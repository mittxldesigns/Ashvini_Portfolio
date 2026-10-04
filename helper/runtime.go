package main

import (
	"archive/zip"
	"bufio"
	"context"
	"crypto/md5" // Published upstream artifact checksum; a build-pinned SHA256 is preferred.
	"crypto/sha256"
	_ "embed"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"hash"
	"io"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"
)

const uvVersion = "0.12.23"
const uvURL = "https://releases.astral.sh/github/uv/releases/download/0.12.23/uv-x86_64-pc-windows-msvc.zip"
const uvSHA256 = "75d05de6762778c31ee183398de7dd15093fad0ed90b1f236d8205ea5ec00c90"
const pythonVersion = "3.12.14"
const modelMD5 = "4fab47adc4ff364be1713e97b7e66334"

var ModelSHA256 = "5600024376f572a557870a5eb0afb1e5961636bef4e1e22132025467d0f03333" // Verified official artifact; may be mirrored without changing bytes.
var ModelDownloadURL = "https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx"

//go:embed worker.py
var workerSource []byte

//go:embed requirements.lock
var requirementsLock []byte

//go:embed THIRD_PARTY_NOTICES.txt
var thirdPartyNotices []byte

func digestFile(path string, algorithm string) (string, error) {
	f, err := os.Open(path)
	if err != nil {
		return "", err
	}
	defer f.Close()
	var h hash.Hash
	if algorithm == "md5" {
		h = md5.New()
	} else {
		h = sha256.New()
	}
	if _, err = io.Copy(h, f); err != nil {
		return "", err
	}
	return hex.EncodeToString(h.Sum(nil)), nil
}
func checkedFile(path, algorithm, want string) bool {
	got, err := digestFile(path, algorithm)
	return err == nil && strings.EqualFold(got, want)
}
func download(ctx context.Context, target, source, algorithm, want string, max int64, progress func(string)) error {
	if checkedFile(target, algorithm, want) {
		return nil
	}
	ctx, cancel := context.WithTimeout(ctx, 60*time.Minute)
	defer cancel()
	part := target + ".part"
	var offset int64
	if s, err := os.Stat(part); err == nil && s.Size() < max {
		offset = s.Size()
	}
	req, err := http.NewRequestWithContext(ctx, "GET", source, nil)
	if err != nil {
		return errors.New("download address invalid")
	}
	if offset > 0 {
		req.Header.Set("Range", fmt.Sprintf("bytes=%d-", offset))
	}
	client := &http.Client{Timeout: 60 * time.Minute}
	resp, err := client.Do(req)
	if err != nil {
		return errors.New("download connection failed")
	}
	defer resp.Body.Close()
	flags := os.O_CREATE | os.O_WRONLY | os.O_TRUNC
	if resp.StatusCode == 206 && offset > 0 {
		flags = os.O_CREATE | os.O_WRONLY | os.O_APPEND
	} else if resp.StatusCode == 200 {
		offset = 0
	} else {
		return errors.New("download unavailable")
	}
	f, err := os.OpenFile(part, flags, 0600)
	if err != nil {
		return err
	}
	count := offset
	last := time.Now()
	buf := make([]byte, 128<<10)
	for {
		n, readErr := resp.Body.Read(buf)
		if n > 0 {
			count += int64(n)
			if count > max {
				f.Close()
				return errors.New("download exceeds expected size")
			}
			if _, err = f.Write(buf[:n]); err != nil {
				f.Close()
				return err
			}
		}
		if time.Since(last) > 2*time.Second {
			if progress != nil {
				progress(fmt.Sprintf("Downloading local runtime/model: %.1f MB cached", float64(count)/(1<<20)))
			}
			last = time.Now()
		}
		if readErr == io.EOF {
			break
		}
		if readErr != nil {
			f.Close()
			return errors.New("download interrupted; partial file retained")
		}
	}
	if err = f.Close(); err != nil {
		return err
	}
	if !checkedFile(part, algorithm, want) {
		_ = os.Rename(part, part+fmt.Sprintf(".invalid-%d", time.Now().Unix()))
		return errors.New("download checksum differs")
	}
	return os.Rename(part, target)
}
func runtimeEnvironment(base string) []string {
	env := []string{}
	for _, entry := range os.Environ() {
		key := strings.ToUpper(strings.SplitN(entry, "=", 2)[0])
		switch key {
		case "SYSTEMROOT", "WINDIR", "TEMP", "TMP", "PATH", "LOCALAPPDATA", "USERPROFILE":
			env = append(env, entry)
		}
	}
	return append(env, "UV_PYTHON_INSTALL_DIR="+filepath.Join(base, "runtime", "python"), "UV_CACHE_DIR="+filepath.Join(base, "runtime", "uv-cache"), "UV_NO_CONFIG=1", "PYTHONNOUSERSITE=1", "REMBG_HOME="+filepath.Join(base, "models"), "OMP_NUM_THREADS=2")
}
func runCommand(ctx context.Context, base, exe string, args ...string) error {
	cmd := exec.CommandContext(ctx, exe, args...)
	cmd.Env = runtimeEnvironment(base)
	cmd.Dir = base
	hideCommand(cmd)
	// Never expose child stderr, which can include user paths or HTTP details.
	if err := cmd.Run(); err != nil {
		return errors.New("runtime setup command failed")
	}
	return nil
}
func prepareProcessor(ctx context.Context, base string, progress func(string)) (*processor, error) {
	dir := filepath.Join(base, "runtime")
	if err := os.MkdirAll(dir, 0700); err != nil {
		return nil, err
	}
	archive := filepath.Join(dir, "uv.zip")
	if err := download(ctx, archive, uvURL, "sha256", uvSHA256, 100<<20, progress); err != nil {
		return nil, err
	}
	r, err := zip.OpenReader(archive)
	if err != nil {
		return nil, err
	}
	defer r.Close()
	uv := filepath.Join(dir, "uv.exe")
	found := false
	for _, entry := range r.File {
		if filepath.Base(entry.Name) == "uv.exe" && entry.UncompressedSize64 < 100<<20 {
			reader, e := entry.Open()
			if e != nil {
				return nil, e
			}
			body, e := io.ReadAll(io.LimitReader(reader, 100<<20))
			reader.Close()
			if e != nil {
				return nil, e
			}
			if e = os.WriteFile(uv, body, 0700); e != nil {
				return nil, e
			}
			found = true
			break
		}
	}
	if !found {
		return nil, errors.New("verified uv archive missing runtime")
	}
	python := filepath.Join(dir, "venv", "Scripts", "python.exe")
	lock := filepath.Join(dir, "requirements.lock")
	marker := filepath.Join(dir, "ready-"+Version)
	if _, err = os.Stat(marker); err != nil {
		if progress != nil {
			progress("Installing private Python runtime and CPU dependencies.")
		}
		if err = runCommand(ctx, base, uv, "python", "install", "--no-config", "--no-bin", "--no-registry", pythonVersion); err != nil {
			return nil, err
		}
		if err = runCommand(ctx, base, uv, "venv", "--no-config", "--no-project", "--managed-python", "--python", pythonVersion, "--no-python-downloads", "--allow-existing", filepath.Join(dir, "venv")); err != nil {
			return nil, err
		}
		if err = os.WriteFile(lock, requirementsLock, 0600); err != nil {
			return nil, err
		}
		if err = runCommand(ctx, base, uv, "pip", "install", "--no-config", "--python", python, "--require-hashes", "--only-binary", ":all:", "-r", lock); err != nil {
			return nil, err
		}
		if err = os.WriteFile(marker, []byte(pythonVersion+"\n"), 0600); err != nil {
			return nil, err
		}
	}
	modelDir := filepath.Join(base, "models", "models", ModelID)
	if err = os.MkdirAll(modelDir, 0700); err != nil {
		return nil, err
	}
	model := filepath.Join(modelDir, ModelID+".onnx")
	algorithm, want := "md5", modelMD5
	if ModelSHA256 != "" {
		algorithm, want = "sha256", ModelSHA256
	}
	if progress != nil {
		progress("Checking/downloading BiRefNet Lite model (214 MB, cached after setup).")
	}
	if err = download(ctx, model, ModelDownloadURL, algorithm, want, 256<<20, progress); err != nil {
		return nil, err
	}
	// Require both the published artifact checksum and the release SHA when supplied.
	if !checkedFile(model, "md5", modelMD5) {
		return nil, errors.New("model provenance checksum differs")
	}
	path := filepath.Join(dir, "worker.py")
	if err = os.WriteFile(path, workerSource, 0600); err != nil {
		return nil, err
	}
	if progress != nil {
		progress("Loading the local CPU model.")
	}
	return startProcessor(ctx, base, python, path)
}

type processor struct {
	cmd   *exec.Cmd
	input io.WriteCloser
	lines chan []byte
	done  chan struct{}
}

func startProcessor(ctx context.Context, base, python, path string) (*processor, error) {
	cmd := exec.Command(python, "-I", path)
	cmd.Dir = base
	cmd.Env = runtimeEnvironment(base)
	hideCommand(cmd)
	input, err := cmd.StdinPipe()
	if err != nil {
		return nil, err
	}
	output, err := cmd.StdoutPipe()
	if err != nil {
		return nil, err
	}
	p := &processor{cmd: cmd, input: input, lines: make(chan []byte, 2), done: make(chan struct{})}
	if err = cmd.Start(); err != nil {
		return nil, errors.New("local processor did not start")
	}
	go func() {
		defer close(p.done)
		defer close(p.lines)
		scanner := bufio.NewScanner(output)
		scanner.Buffer(make([]byte, 4096), 65536)
		for scanner.Scan() {
			line := append([]byte(nil), scanner.Bytes()...)
			p.lines <- line
		}
		_ = cmd.Wait()
	}()
	select {
	case line, ok := <-p.lines:
		var ready struct {
			Ready bool `json:"ready"`
		}
		if ok && json.Unmarshal(line, &ready) == nil && ready.Ready {
			return p, nil
		}
		p.stop()
		return nil, errors.New("CPU model could not load (check Windows VC++ runtime)")
	case <-ctx.Done():
		p.stop()
		return nil, ctx.Err()
	case <-time.After(5 * time.Minute):
		p.stop()
		return nil, errors.New("model load timed out")
	}
}
func (p *processor) stop() {
	if p == nil {
		return
	}
	_ = p.input.Close()
	if p.cmd.Process != nil {
		_ = p.cmd.Process.Kill()
	}
}
func (p *processor) process(ctx context.Context, input, output string, dimension, size int) error {
	if dimension <= 0 || dimension > maxDimension {
		dimension = maxDimension
	}
	if size <= 0 || size > maxResultBytes {
		size = maxResultBytes
	}
	body, _ := json.Marshal(map[string]any{"input": input, "output": output, "maxDimension": dimension, "maxBytes": size})
	body = append(body, '\n')
	if _, err := p.input.Write(body); err != nil {
		return errors.New("processor unavailable")
	}
	select {
	case line, ok := <-p.lines:
		var result struct {
			OK   bool   `json:"ok"`
			Code string `json:"code"`
		}
		if ok && json.Unmarshal(line, &result) == nil && result.OK {
			return nil
		}
		if result.Code == "input_invalid" {
			return errInputInvalid
		}
		return errors.New("processing failed")
	case <-ctx.Done():
		p.stop()
		return ctx.Err()
	case <-time.After(4 * time.Minute):
		p.stop()
		return errors.New("processing timed out")
	}
}
