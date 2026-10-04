package main

import (
	"context"
	"fmt"
	"os"
	"path/filepath"
	"runtime"
	"time"
)

const Version = "1.0.0"
const ModelID = "birefnet-general-lite"
const ModelVersion = "BiRefNet-general-bb_swin_v1_tiny-epoch_232"

var DefaultSite = "https://bettercallashvini.com"

func main() {
	if runtime.GOOS != "windows" {
		fmt.Fprintln(os.Stderr, "This helper runs on Windows 10/11 x64.")
		return
	}
	base := filepath.Join(os.Getenv("LOCALAPPDATA"), "AshviniThumbnailHelper")
	if os.Getenv("LOCALAPPDATA") == "" {
		return
	}
	if err := os.MkdirAll(base, 0700); err != nil {
		return
	}
	if err := os.WriteFile(filepath.Join(base, "THIRD_PARTY_NOTICES.txt"), thirdPartyNotices, 0600); err != nil {
		return
	}
	release, single := singleInstance(base)
	if !single {
		return
	}
	defer release()
	ctx, cancel := context.WithCancel(context.Background())
	defer cancel()
	a := newApp(base, ctx, cancel)
	done := make(chan struct{})
	go func() { defer close(done); a.run() }()
	_ = runUI(a)
	cancel()
	select {
	case <-done:
	case <-time.After(5 * time.Second):
	}
}
