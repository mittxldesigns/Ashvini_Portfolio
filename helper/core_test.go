package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"image"
	"image/color"
	"image/png"
	"io"
	"net/http"
	"os"
	"path/filepath"
	"strings"
	"testing"
	"time"
)

type roundTripFunc func(*http.Request) (*http.Response, error)

func (f roundTripFunc) RoundTrip(r *http.Request) (*http.Response, error) { return f(r) }
func response(code int, body []byte) *http.Response {
	return &http.Response{StatusCode: code, Body: io.NopCloser(bytes.NewReader(body)), Header: make(http.Header)}
}
func TestOriginRules(t *testing.T) {
	for _, bad := range []string{"http://localhost:7000", "https://user:secret@example.com", "https://example.com/path", "https://example.com/?token=x", "https://example.com:444"} {
		if _, err := normalizedSite(bad); err == nil {
			t.Fatalf("allowed unsafe origin")
		}
	}
	if site, err := normalizedSite("https://Example.com/"); err != nil || site != "https://example.com" {
		t.Fatal("normalization failed")
	}
}
func TestRequestsUseScopedHeadersAndExactLength(t *testing.T) {
	c, _ := newAPI("https://example.com", "token-not-logged")
	c.http = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.Header.Get("Authorization") != "Bearer token-not-logged" || r.Header.Get("X-Job-Lease") != "lease" || r.ContentLength != 3 || r.Header.Get("Content-Type") != "image/png" {
			t.Fatal("result transport differs")
		}
		return response(200, []byte(`{"status":"ready"}`)), nil
	})}
	var result struct {
		Status string `json:"status"`
	}
	if err := c.request(context.Background(), "PUT", "/api/helper/jobs/id/result", "lease", "image/png", []byte{1, 2, 3}, &result); err != nil || result.Status != "ready" {
		t.Fatal("request failed")
	}
	if err := c.request(context.Background(), "GET", "https://evil.test/input", "", "", nil, nil); err == nil {
		t.Fatal("cross-origin request allowed")
	}
}
func TestInputChecksumAndBounds(t *testing.T) {
	body := []byte("image bytes")
	sum := sha256.Sum256(body)
	c, _ := newAPI("https://example.com", "device")
	c.http = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.Header.Get("X-Job-Lease") != "lease" {
			t.Fatal("missing lease")
		}
		return response(200, body), nil
	})}
	j := &Job{ID: "id", LeaseToken: "lease", InputURL: "https://example.com/input", InputBytes: int64(len(body)), InputMIME: "image/png", InputSHA256: hex.EncodeToString(sum[:])}
	if got, err := c.input(context.Background(), j); err != nil || !bytes.Equal(got, body) {
		t.Fatal("valid input refused")
	}
	j.InputSHA256 = strings.Repeat("0", 64)
	if _, err := c.input(context.Background(), j); err == nil {
		t.Fatal("bad checksum accepted")
	}
	j.InputURL = "https://evil.test/input"
	if _, err := c.input(context.Background(), j); err == nil {
		t.Fatal("foreign input accepted")
	}
}
func pngFixture(transparent bool) []byte {
	im := image.NewNRGBA(image.Rect(0, 0, 10, 10))
	for y := 0; y < 10; y++ {
		for x := 0; x < 10; x++ {
			a := uint8(255)
			if transparent && x == 0 {
				a = 0
			}
			im.SetNRGBA(x, y, color.NRGBA{10, 20, 30, a})
		}
	}
	var b bytes.Buffer
	_ = png.Encode(&b, im)
	return b.Bytes()
}
func TestPNGConstraints(t *testing.T) {
	valid := pngFixture(true)
	if err := validatePNG(valid, maxResultBytes, 1600); err != nil {
		t.Fatal(err)
	}
	if validatePNG(pngFixture(false), maxResultBytes, 1600) == nil {
		t.Fatal("opaque fake cutout accepted")
	}
	if validatePNG(valid, 10, 1600) == nil || validatePNG(valid, maxResultBytes, 5) == nil {
		t.Fatal("limits ignored")
	}
	broken := append([]byte(nil), valid...)
	broken[len(broken)-1] ^= 1
	if validatePNG(broken, maxResultBytes, 1600) == nil {
		t.Fatal("corrupt PNG accepted")
	}
}
func TestSetupPinsAndNoCloudProvider(t *testing.T) {
	if len(uvSHA256) != 64 || len(ModelSHA256) != 64 || len(modelMD5) != 32 || ModelID != "birefnet-general-lite" {
		t.Fatal("runtime pins missing")
	}
	if !bytes.Contains(workerSource, []byte(`providers=["CPUExecutionProvider"]`)) || !bytes.Contains(workerSource, []byte(`only_mask=True`)) {
		t.Fatal("local CPU/mask contract changed")
	}
	for _, entry := range runtimeEnvironment(t.TempDir()) {
		if strings.HasPrefix(entry, "U2NET_HOME=") || strings.HasPrefix(entry, "WITHOUTBG_API_KEY=") {
			t.Fatal("external model environment leaked")
		}
	}
	if !bytes.Contains(requirementsLock, []byte("--hash=sha256:")) || !bytes.Contains(requirementsLock, []byte("rembg==2.0.85")) {
		t.Fatal("hashed runtime lock missing")
	}
}

func TestClaimDecodesActualNumericProjectContract(t *testing.T) {
	c, _ := newAPI(DefaultSite, "device")
	c.http = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
		if r.Header.Get("User-Agent") != "AshviniThumbnailHelper/1.0.0" {
			t.Fatal("helper identification missing")
		}
		return response(200, []byte(`{"job":{"id":"job-1","leaseToken":"lease","leaseExpiresAt":1791220200,"projectId":18,"sourceFingerprint":"abc","inputUrl":"https://bettercallashvini.com/api/helper/jobs/job-1/input","inputSha256":"5600024376f572a557870a5eb0afb1e5961636bef4e1e22132025467d0f03333","inputMime":"image/png","inputBytes":1200,"maxOutputBytes":2097152,"maxOutputDimension":1600},"paused":false}`)), nil
	})}
	var result claimReply
	if err := c.post(context.Background(), "/api/helper/claim", claimPayload(false, "ready"), &result); err != nil {
		t.Fatal(err)
	}
	if result.Job == nil || result.Job.ProjectID != 18 || result.Job.LeaseExpiresAt != 1791220200 || result.Job.MaxOutputBytes != 2097152 {
		t.Fatal("numeric server contract changed")
	}
}

func TestInputFailureRecoveryCodes(t *testing.T) {
	for _, tc := range []struct{ name, mode, want string }{
		{"offline is retryable", "offline", "processing_failed"},
		{"invalid hash is terminal", "hash", "input_invalid"},
		{"canceled job does not fail", "canceled", ""},
		{"revoked input does not fail", "revoked", ""},
	} {
		t.Run(tc.name, func(t *testing.T) {
			ctx, cancel := context.WithCancel(context.Background())
			defer cancel()
			if tc.mode == "canceled" {
				cancel()
			}
			a := &app{base: t.TempDir(), cfg: settings{Site: DefaultSite}}
			c, _ := newAPI(DefaultSite, "device")
			got := ""
			c.http = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
				if r.Method == "GET" {
					switch tc.mode {
					case "offline", "canceled":
						return nil, errors.New("connection interrupted")
					case "revoked":
						return response(401, nil), nil
					default:
						return response(200, []byte("bad image")), nil
					}
				}
				var value struct {
					Code string `json:"code"`
				}
				if err := json.NewDecoder(r.Body).Decode(&value); err != nil {
					t.Fatal(err)
				}
				got = value.Code
				return response(200, []byte(`{}`)), nil
			})}
			job := &Job{ID: "job", LeaseToken: "lease", LeaseExpiresAt: time.Now().Add(time.Minute).Unix(), InputURL: DefaultSite + "/input", InputSHA256: strings.Repeat("0", 64), InputBytes: 9, InputMIME: "image/png"}
			if err := a.process(ctx, c, nil, job); err == nil {
				t.Fatal("expected input failure")
			}
			if got != tc.want {
				t.Fatalf("failure code %q, want %q", got, tc.want)
			}
		})
	}
}

func TestRevokedClaimClearsPairingAndStopsRetry(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	a := &app{base: t.TempDir(), ctx: ctx, quit: cancel, cfg: settings{Site: DefaultSite, DeviceID: "device", EncryptedToken: "cipher"}, token: strings.Repeat("a", 64), modelStatus: "failed"}
	claimed := make(chan struct{}, 1)
	a.clientFactory = func(site, token string) (*apiClient, error) {
		c, _ := newAPI(site, token)
		c.http = &http.Client{Transport: roundTripFunc(func(r *http.Request) (*http.Response, error) {
			if r.URL.Path != "/api/helper/claim" {
				t.Error("unexpected request")
			}
			claimed <- struct{}{}
			return response(401, nil), nil
		})}
		return c, nil
	}
	done := make(chan struct{})
	go func() { defer close(done); a.run() }()
	select {
	case <-claimed:
	case <-time.After(time.Second):
		t.Fatal("claim did not run")
	}
	deadline := time.Now().Add(time.Second)
	for {
		cfg, token, status, _ := a.snapshot()
		if token == "" {
			if cfg.DeviceID != "" || cfg.EncryptedToken != "" || !strings.Contains(status, "Pair this PC again") {
				t.Fatal("revocation did not clear pairing")
			}
			break
		}
		if time.Now().After(deadline) {
			t.Fatal("revocation was ignored")
		}
		time.Sleep(time.Millisecond)
	}
	cancel()
	select {
	case <-done:
	case <-time.After(time.Second):
		t.Fatal("helper did not stop")
	}
	if len(claimed) != 0 {
		t.Fatal("revoked credential was retried")
	}
	data, err := os.ReadFile(filepath.Join(a.base, "settings.json"))
	if err != nil || bytes.Contains(data, []byte("cipher")) {
		t.Fatal("revoked credential remains on disk")
	}
}

func TestChangedSavedOriginCannotReuseCredential(t *testing.T) {
	base := t.TempDir()
	if err := os.WriteFile(filepath.Join(base, "settings.json"), []byte(`{"site":"https://other.example","deviceId":"device","encryptedToken":"Y2lwaGVy"}`), 0600); err != nil {
		t.Fatal(err)
	}
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	a := newApp(base, ctx, cancel)
	cfg, token, _, _ := a.snapshot()
	if cfg.Site != DefaultSite || token != "" || canonicalSite("https://other.example") {
		t.Fatal("saved origin can reuse site credential")
	}
}

func TestPauseCancelsWorkAndPersistsVisibleState(t *testing.T) {
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	a := &app{base: t.TempDir(), cfg: settings{Site: DefaultSite}, activeCancel: cancel}
	a.togglePause()
	cfg, _, status, _ := a.snapshot()
	if !cfg.Paused || ctx.Err() == nil || !strings.HasPrefix(status, "Paused.") {
		t.Fatal("pause did not interrupt work or update visible state")
	}
	data, err := os.ReadFile(filepath.Join(a.base, "settings.json"))
	if err != nil || !bytes.Contains(data, []byte(`"paused": true`)) {
		t.Fatal("pause was not persisted")
	}
}
