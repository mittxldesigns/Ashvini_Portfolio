package main

import (
	"bytes"
	"context"
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"errors"
	"fmt"
	"image/png"
	"io"
	"net/http"
	"net/url"
	"strings"
	"time"
)

const maxInputBytes = 2 << 20
const maxResultBytes = 2 << 20
const maxDimension = 1600

type Job struct {
	ID                 string `json:"id"`
	LeaseToken         string `json:"leaseToken"`
	LeaseExpiresAt     int64  `json:"leaseExpiresAt"`
	ProjectID          int64  `json:"projectId"`
	SourceFingerprint  string `json:"sourceFingerprint"`
	InputURL           string `json:"inputUrl"`
	InputSHA256        string `json:"inputSha256"`
	InputMIME          string `json:"inputMime"`
	InputBytes         int64  `json:"inputBytes"`
	MaxOutputBytes     int    `json:"maxOutputBytes"`
	MaxOutputDimension int    `json:"maxOutputDimension"`
}
type claimReply struct {
	Job               *Job `json:"job"`
	RetryAfterSeconds int  `json:"retryAfterSeconds"`
	Paused            bool `json:"paused"`
}
type apiClient struct {
	site, token string
	http        *http.Client
}

var errInputInvalid = errors.New("input invalid")

type httpStatusError int

func (e httpStatusError) Error() string { return fmt.Sprintf("website returned HTTP %d", int(e)) }
func unauthorized(err error) bool {
	var status httpStatusError
	return errors.As(err, &status) && status == 401
}
func failureCode(err error) string {
	if errors.Is(err, errInputInvalid) {
		return "input_invalid"
	}
	return "processing_failed"
}

func normalizedSite(raw string) (string, error) {
	u, err := url.Parse(raw)
	if err != nil || u.Scheme != "https" || u.Hostname() == "" || u.User != nil || u.RawQuery != "" || u.Fragment != "" || (u.Path != "" && u.Path != "/") || (u.Port() != "" && u.Port() != "443") {
		return "", errors.New("use a complete HTTPS website origin")
	}
	u.Path = ""
	u.Host = strings.ToLower(u.Host)
	return strings.TrimSuffix(u.String(), "/"), nil
}
func newAPI(site, token string) (*apiClient, error) {
	s, err := normalizedSite(site)
	if err != nil {
		return nil, err
	}
	return &apiClient{s, token, &http.Client{Timeout: 45 * time.Second, CheckRedirect: func(_ *http.Request, _ []*http.Request) error { return errors.New("redirect refused") }}}, nil
}
func (c *apiClient) request(ctx context.Context, method, endpoint, lease, contentType string, body []byte, result any) error {
	u, err := url.Parse(endpoint)
	if err != nil {
		return errors.New("invalid request path")
	}
	if !u.IsAbs() {
		if !strings.HasPrefix(endpoint, "/") {
			return errors.New("invalid request path")
		}
		u, err = url.Parse(c.site + endpoint)
	}
	if err != nil || u.Scheme != "https" || u.User != nil || u.Fragment != "" || strings.TrimSuffix(u.Scheme+"://"+u.Host, "/") != c.site {
		return errors.New("request origin refused")
	}
	req, err := http.NewRequestWithContext(ctx, method, u.String(), bytes.NewReader(body))
	if err != nil {
		return errors.New("request failed")
	}
	if c.token != "" {
		req.Header.Set("Authorization", "Bearer "+c.token)
	}
	if lease != "" {
		req.Header.Set("X-Job-Lease", lease)
	}
	if contentType != "" {
		req.Header.Set("Content-Type", contentType)
	}
	req.Header.Set("User-Agent", "AshviniThumbnailHelper/"+Version)
	resp, err := c.http.Do(req)
	if err != nil {
		return errors.New("connection failed")
	}
	defer resp.Body.Close()
	if resp.StatusCode < 200 || resp.StatusCode > 299 {
		return httpStatusError(resp.StatusCode)
	}
	if result != nil {
		return json.NewDecoder(io.LimitReader(resp.Body, 1<<20)).Decode(result)
	}
	return nil
}
func (c *apiClient) post(ctx context.Context, endpoint string, value, result any) error {
	body, err := json.Marshal(value)
	if err != nil {
		return errors.New("request could not be prepared")
	}
	return c.request(ctx, "POST", endpoint, "", "application/json", body, result)
}
func (c *apiClient) input(ctx context.Context, job *Job) ([]byte, error) {
	if job.InputBytes <= 0 || job.InputBytes > maxInputBytes || len(job.InputSHA256) != 64 || !allowedMime(job.InputMIME) || len(job.ID) > 128 || job.ID == "" || len(job.LeaseToken) > 512 || job.LeaseToken == "" {
		return nil, fmt.Errorf("%w: limits refused", errInputInvalid)
	}
	u, err := url.Parse(job.InputURL)
	if err != nil || u.Scheme+"://"+u.Host != c.site || u.User != nil || u.Fragment != "" || u.RawQuery != "" {
		return nil, fmt.Errorf("%w: origin refused", errInputInvalid)
	}
	req, err := http.NewRequestWithContext(ctx, "GET", u.String(), nil)
	if err != nil {
		return nil, errInputInvalid
	}
	req.Header.Set("Authorization", "Bearer "+c.token)
	req.Header.Set("X-Job-Lease", job.LeaseToken)
	req.Header.Set("User-Agent", "AshviniThumbnailHelper/"+Version)
	resp, err := c.http.Do(req)
	if err != nil {
		if ctx.Err() != nil {
			return nil, ctx.Err()
		}
		return nil, errors.New("input download failed")
	}
	defer resp.Body.Close()
	if resp.StatusCode != 200 {
		return nil, httpStatusError(resp.StatusCode)
	}
	body, err := io.ReadAll(io.LimitReader(resp.Body, job.InputBytes+1))
	if err != nil {
		return nil, errors.New("input download interrupted")
	}
	if int64(len(body)) != job.InputBytes {
		return nil, fmt.Errorf("%w: length differs", errInputInvalid)
	}
	hash := sha256.Sum256(body)
	if !strings.EqualFold(hex.EncodeToString(hash[:]), job.InputSHA256) {
		return nil, fmt.Errorf("%w: checksum differs", errInputInvalid)
	}
	return body, nil
}
func allowedMime(mime string) bool {
	return mime == "image/png" || mime == "image/jpeg" || mime == "image/webp"
}
func validatePNG(body []byte, limit, dimension int) error {
	if limit <= 0 || limit > maxResultBytes {
		limit = maxResultBytes
	}
	if dimension <= 0 || dimension > maxDimension {
		dimension = maxDimension
	}
	if len(body) > limit || len(body) < 33 || string(body[:8]) != "\x89PNG\r\n\x1a\n" || string(body[12:16]) != "IHDR" || body[24] != 8 || body[25] != 6 || body[28] != 0 {
		return errors.New("output must be a bounded 8-bit RGBA PNG")
	}
	config, err := png.DecodeConfig(bytes.NewReader(body))
	if err != nil || config.Width < 1 || config.Height < 1 || config.Width > dimension || config.Height > dimension {
		return errors.New("output dimensions refused")
	}
	image, err := png.Decode(bytes.NewReader(body))
	if err != nil {
		return errors.New("output could not be decoded")
	}
	transparent, foreground := 0, 0
	for y := 0; y < config.Height; y++ {
		for x := 0; x < config.Width; x++ {
			_, _, _, alpha := image.At(x, y).RGBA()
			if alpha == 0 {
				transparent++
			}
			if alpha > 0 {
				foreground++
			}
		}
	}
	minimum := (config.Width*config.Height + 99) / 100
	if transparent < minimum || foreground < minimum {
		return errors.New("output has no usable transparent foreground")
	}
	return nil
}
