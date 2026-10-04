//go:build !windows

package main

import (
	"errors"
	"os/exec"
)

func protect(_ []byte, _ []byte) ([]byte, error) {
	return nil, errors.New("DPAPI is only available on Windows")
}
func unprotect(_ []byte, _ []byte) ([]byte, error) {
	return nil, errors.New("DPAPI is only available on Windows")
}
func hideCommand(_ *exec.Cmd)                {}
func setAutostart(_ bool) error              { return errors.New("Windows startup is unavailable") }
func singleInstance(_ string) (func(), bool) { return func() {}, true }
func runUI(_ *app) error                     { return errors.New("Windows UI is unavailable") }
