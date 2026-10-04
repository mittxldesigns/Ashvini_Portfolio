package main

import (
	"context"
	"encoding/base64"
	"encoding/json"
	"errors"
	"net/url"
	"os"
	"path/filepath"
	"regexp"
	"sync"
	"time"
)

type settings struct {
	Site           string `json:"site"`
	DeviceID       string `json:"deviceId"`
	DeviceName     string `json:"deviceName"`
	EncryptedToken string `json:"encryptedToken"`
	Paused         bool   `json:"paused"`
	Autostart      bool   `json:"autostart"`
}
type app struct {
	mu                  sync.Mutex
	base                string
	ctx                 context.Context
	quit                context.CancelFunc
	cfg                 settings
	token               string
	status, modelStatus string
	retrySetup          bool
	activeCancel        context.CancelFunc
	clientFactory       func(string, string) (*apiClient, error)
}

func newApp(base string, ctx context.Context, cancel context.CancelFunc) *app {
	a := &app{base: base, ctx: ctx, quit: cancel, status: "Open the status window to pair this PC.", modelStatus: "missing", clientFactory: newAPI}
	data, err := os.ReadFile(filepath.Join(base, "settings.json"))
	if err == nil && len(data) < 16384 && json.Unmarshal(data, &a.cfg) == nil {
		cipher, err := base64.StdEncoding.DecodeString(a.cfg.EncryptedToken)
		if err == nil && canonicalSite(a.cfg.Site) {
			token, err := unprotect(cipher, []byte(a.cfg.Site+"\x00"+a.cfg.DeviceID))
			if err == nil && regexp.MustCompile(`^[a-f0-9]{64}$`).Match(token) {
				a.token = string(token)
			}
		}
	}
	if !canonicalSite(a.cfg.Site) {
		a.cfg.Site = DefaultSite
	}
	if a.cfg.DeviceName == "" {
		a.cfg.DeviceName, _ = os.Hostname()
	}
	return a
}
func canonicalSite(site string) bool {
	want, e1 := normalizedSite(DefaultSite)
	got, e2 := normalizedSite(site)
	return e1 == nil && e2 == nil && want == got
}
func (a *app) invalidatePairing() {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.token = ""
	a.cfg.EncryptedToken = ""
	a.cfg.DeviceID = ""
	if a.activeCancel != nil {
		a.activeCancel()
	}
	_ = a.saveLocked()
	a.status = "Device authorization expired or was revoked. Pair this PC again."
}
func failJob(ctx context.Context, client *apiClient, endpoint string, job *Job, err error) {
	if ctx.Err() == nil && !unauthorized(err) {
		_ = client.post(ctx, endpoint+"/fail", map[string]any{"leaseToken": job.LeaseToken, "code": failureCode(err)}, nil)
	}
}
func (a *app) snapshot() (settings, string, string, string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	return a.cfg, a.token, a.status, a.modelStatus
}
func (a *app) report(status, model string) {
	a.mu.Lock()
	defer a.mu.Unlock()
	a.status = status
	if model != "" {
		a.modelStatus = model
	}
}
func (a *app) save() error { a.mu.Lock(); defer a.mu.Unlock(); return a.saveLocked() }
func (a *app) saveLocked() error {
	data, err := json.MarshalIndent(a.cfg, "", "  ")
	if err != nil {
		return err
	}
	tmp := filepath.Join(a.base, "settings.json.part")
	if err = os.WriteFile(tmp, data, 0600); err != nil {
		return err
	}
	return os.Rename(tmp, filepath.Join(a.base, "settings.json"))
}
func (a *app) pair(code string) error {
	cfg, _, _, _ := a.snapshot()
	if !canonicalSite(cfg.Site) {
		return errors.New("only the portfolio website can pair this helper")
	}
	c, err := newAPI(cfg.Site, "")
	if err != nil {
		return err
	}
	var result struct {
		DeviceID string `json:"deviceId"`
		Token    string `json:"token"`
	}
	ctx, cancel := context.WithTimeout(a.ctx, 30*time.Second)
	defer cancel()
	if err = c.post(ctx, "/api/helper/pair", map[string]any{"pairingCode": code, "deviceName": cfg.DeviceName, "version": Version}, &result); err != nil {
		return err
	}
	if result.DeviceID == "" || !regexp.MustCompile(`^[a-f0-9]{64}$`).MatchString(result.Token) {
		return errors.New("pairing response refused")
	}
	cipher, err := protect([]byte(result.Token), []byte(cfg.Site+"\x00"+result.DeviceID))
	if err != nil {
		return errors.New("Windows credential protection failed")
	}
	a.mu.Lock()
	a.cfg.DeviceID = result.DeviceID
	a.cfg.EncryptedToken = base64.StdEncoding.EncodeToString(cipher)
	a.token = result.Token
	err = a.saveLocked()
	a.mu.Unlock()
	if err != nil {
		return errors.New("could not save the paired credential")
	}
	a.report("Paired. Preparing local background removal.", "missing")
	return nil
}
func (a *app) togglePause() {
	a.mu.Lock()
	a.cfg.Paused = !a.cfg.Paused
	if a.cfg.Paused && a.activeCancel != nil {
		a.activeCancel()
	}
	if a.cfg.Paused {
		a.status = "Paused. No image jobs will run."
	} else {
		a.status = "Resuming local thumbnail jobs."
	}
	if !a.cfg.Paused {
		a.retrySetup = true
	}
	_ = a.saveLocked()
	a.mu.Unlock()
}
func (a *app) toggleAutostart() error {
	a.mu.Lock()
	defer a.mu.Unlock()
	next := !a.cfg.Autostart
	if err := setAutostart(next); err != nil {
		return err
	}
	a.cfg.Autostart = next
	return a.saveLocked()
}
func (a *app) retry() { a.mu.Lock(); a.retrySetup = true; a.mu.Unlock() }
func (a *app) wait(seconds int) bool {
	if seconds < 5 {
		seconds = 5
	}
	if seconds > 60 {
		seconds = 60
	}
	select {
	case <-a.ctx.Done():
		return false
	case <-time.After(time.Duration(seconds) * time.Second):
		return true
	}
}
func (a *app) run() {
	var engine *processor
	defer func() {
		if engine != nil {
			engine.stop()
		}
	}()
	for a.ctx.Err() == nil {
		cfg, token, _, state := a.snapshot()
		if token == "" {
			if engine != nil {
				engine.stop()
				engine = nil
			}
			if !a.wait(5) {
				return
			}
			continue
		}
		if !canonicalSite(cfg.Site) {
			a.invalidatePairing()
			continue
		}
		client, err := a.clientFactory(cfg.Site, token)
		if err != nil {
			a.report("Website configuration is invalid.", "")
			if !a.wait(15) {
				return
			}
			continue
		}
		a.mu.Lock()
		retry := a.retrySetup
		a.retrySetup = false
		a.mu.Unlock()
		if !cfg.Paused && engine == nil && (state != "failed" || retry) {
			a.report("Preparing local runtime and model (first setup may take a few minutes).", "loading")
			setupCtx, cancel := context.WithCancel(a.ctx)
			a.mu.Lock()
			a.activeCancel = cancel
			a.mu.Unlock()
			go func() {
				for {
					select {
					case <-setupCtx.Done():
						return
					case <-time.After(15 * time.Second):
						if failure := client.post(setupCtx, "/api/helper/claim", claimPayload(false, "loading"), nil); unauthorized(failure) {
							a.invalidatePairing()
							return
						}
					}
				}
			}()
			engine, err = prepareProcessor(setupCtx, a.base, func(status string) { a.report(status, "loading") })
			cancel()
			a.mu.Lock()
			a.activeCancel = nil
			a.mu.Unlock()
			_, activeToken, _, _ := a.snapshot()
			if activeToken == "" {
				if engine != nil {
					engine.stop()
					engine = nil
				}
				continue
			}
			if err != nil {
				engine = nil
				a.report("Local setup could not finish. Check the connection and Windows runtime, then Retry setup.", "failed")
			} else {
				a.report("Ready for thumbnail jobs.", "ready")
			}
			cfg, token, _, state = a.snapshot()
			if token == "" {
				continue
			}
			if a.ctx.Err() != nil {
				return
			}
		}
		if cfg.Paused {
			a.report("Paused. No image jobs will run.", "")
		}
		var reply claimReply
		if err = client.post(a.ctx, "/api/helper/claim", claimPayload(cfg.Paused, state), &reply); err != nil {
			if unauthorized(err) {
				a.invalidatePairing()
				continue
			}
			a.report("Website connection unavailable. Retrying shortly.", "")
			if !a.wait(15) {
				return
			}
			continue
		}
		if reply.Paused || cfg.Paused || state != "ready" || engine == nil || reply.Job == nil {
			if !a.wait(reply.RetryAfterSeconds) {
				return
			}
			continue
		}
		jobCtx, cancel := context.WithCancel(a.ctx)
		a.mu.Lock()
		a.activeCancel = cancel
		a.mu.Unlock()
		err = a.process(jobCtx, client, engine, reply.Job)
		cancel()
		a.mu.Lock()
		a.activeCancel = nil
		a.mu.Unlock()
		if err != nil {
			if unauthorized(err) {
				a.invalidatePairing()
				continue
			}
			select {
			case <-engine.done:
				engine = nil
				a.report("Local processor stopped. Preparing it again.", "missing")
			default:
				if current, activeToken, _, _ := a.snapshot(); activeToken != "" && !current.Paused {
					a.report("Job could not finish. It remains available for a retry.", "ready")
				}
			}
			if !a.wait(5) {
				return
			}
		}
	}
}
func claimPayload(paused bool, status string) map[string]any {
	return map[string]any{"version": Version, "paused": paused, "modelStatus": status, "model": ModelID, "modelVersion": ModelVersion}
}
func (a *app) process(ctx context.Context, client *apiClient, engine *processor, job *Job) error {
	endpoint := "/api/helper/jobs/" + url.PathEscape(job.ID)
	if job.LeaseExpiresAt <= time.Now().Unix() {
		return errors.New("lease expired")
	}
	ctx, cancel := context.WithCancel(ctx)
	defer cancel()
	go func() {
		for {
			select {
			case <-ctx.Done():
				return
			case <-time.After(30 * time.Second):
				var lease struct {
					LeaseExpiresAt int64 `json:"leaseExpiresAt"`
					Paused         bool  `json:"paused"`
				}
				if err := client.post(ctx, endpoint+"/heartbeat", map[string]any{"leaseToken": job.LeaseToken}, &lease); err != nil || lease.Paused || lease.LeaseExpiresAt <= time.Now().Unix() {
					if unauthorized(err) {
						a.invalidatePairing()
					}
					cancel()
					return
				}
			}
		}
	}()
	a.report("Removing the thumbnail background locally.", "ready")
	input, err := client.input(ctx, job)
	if err != nil {
		failJob(ctx, client, endpoint, job, err)
		return err
	}
	dir, err := os.MkdirTemp(a.base, "job-")
	if err != nil {
		return err
	}
	defer os.RemoveAll(dir)
	in, out := filepath.Join(dir, "input"), filepath.Join(dir, "output.png")
	if err = os.WriteFile(in, input, 0600); err != nil {
		return err
	}
	if err = engine.process(ctx, in, out, job.MaxOutputDimension, job.MaxOutputBytes); err != nil {
		failJob(ctx, client, endpoint, job, err)
		return err
	}
	body, err := os.ReadFile(out)
	if err != nil {
		return err
	}
	if err = validatePNG(body, job.MaxOutputBytes, job.MaxOutputDimension); err != nil {
		failJob(ctx, client, endpoint, job, err)
		return err
	}
	cfg, _, _, _ := a.snapshot()
	if cfg.Paused || ctx.Err() != nil {
		return errors.New("job paused")
	}
	var result struct {
		Status string `json:"status"`
	}
	if err = client.request(ctx, "PUT", endpoint+"/result", job.LeaseToken, "image/png", body, &result); err != nil {
		return err
	}
	if result.Status == "stale" {
		a.report("Source changed; the old thumbnail was discarded.", "ready")
	} else if result.Status == "ready" {
		a.report("Thumbnail is ready on the website.", "ready")
	} else {
		return errors.New("result response refused")
	}
	return nil
}
