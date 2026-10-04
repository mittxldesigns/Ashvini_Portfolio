//go:build windows

package main

import (
	"crypto/sha256"
	"encoding/hex"
	"errors"
	"os"
	"os/exec"
	"path/filepath"
	"runtime"
	"strings"
	"syscall"
	"unsafe"
)

var user32 = syscall.NewLazyDLL("user32.dll")
var shell32 = syscall.NewLazyDLL("shell32.dll")
var kernel32 = syscall.NewLazyDLL("kernel32.dll")
var crypt32 = syscall.NewLazyDLL("crypt32.dll")
var advapi32 = syscall.NewLazyDLL("advapi32.dll")
var createWindow = user32.NewProc("CreateWindowExW")
var defWindow = user32.NewProc("DefWindowProcW")
var showWindow = user32.NewProc("ShowWindow")
var setWindowText = user32.NewProc("SetWindowTextW")
var getWindowText = user32.NewProc("GetWindowTextW")
var notifyIcon = shell32.NewProc("Shell_NotifyIconW")
var appWindow *windowState

func utf(s string) *uint16 { p, _ := syscall.UTF16PtrFromString(s); return p }

type blob struct {
	Size uint32
	Data *byte
}

func dpapi(data, entropy []byte, decrypt bool) ([]byte, error) {
	if len(data) == 0 || len(data) > 16384 {
		return nil, errors.New("credential data refused")
	}
	in := blob{uint32(len(data)), &data[0]}
	extra := blob{}
	if len(entropy) > 0 {
		extra = blob{uint32(len(entropy)), &entropy[0]}
	}
	var out blob
	var result uintptr
	if decrypt {
		result, _, _ = crypt32.NewProc("CryptUnprotectData").Call(uintptr(unsafe.Pointer(&in)), 0, uintptr(unsafe.Pointer(&extra)), 0, 0, 1, uintptr(unsafe.Pointer(&out)))
	} else {
		result, _, _ = crypt32.NewProc("CryptProtectData").Call(uintptr(unsafe.Pointer(&in)), 0, uintptr(unsafe.Pointer(&extra)), 0, 0, 1, uintptr(unsafe.Pointer(&out)))
	}
	if result == 0 || out.Data == nil {
		return nil, errors.New("Windows credential protection failed")
	}
	defer kernel32.NewProc("LocalFree").Call(uintptr(unsafe.Pointer(out.Data)))
	return append([]byte(nil), unsafe.Slice(out.Data, int(out.Size))...), nil
}
func protect(data, entropy []byte) ([]byte, error)   { return dpapi(data, entropy, false) }
func unprotect(data, entropy []byte) ([]byte, error) { return dpapi(data, entropy, true) }
func hideCommand(cmd *exec.Cmd) {
	cmd.SysProcAttr = &syscall.SysProcAttr{HideWindow: true, CreationFlags: 0x08000000}
}
func singleInstance(base string) (func(), bool) {
	sum := sha256.Sum256([]byte(base))
	name := "Local\\AshviniThumbnailHelper-" + hex.EncodeToString(sum[:8])
	h, _, err := kernel32.NewProc("CreateMutexW").Call(0, 0, uintptr(unsafe.Pointer(utf(name))))
	if h == 0 {
		return func() {}, false
	}
	if err == syscall.Errno(183) {
		kernel32.NewProc("CloseHandle").Call(h)
		return func() {}, false
	}
	return func() { kernel32.NewProc("CloseHandle").Call(h) }, true
}
func setAutostart(enable bool) error {
	var key syscall.Handle
	var disposition uint32
	result, _, _ := advapi32.NewProc("RegCreateKeyExW").Call(uintptr(syscall.HKEY_CURRENT_USER), uintptr(unsafe.Pointer(utf(`Software\Microsoft\Windows\CurrentVersion\Run`))), 0, 0, 0, 0x0002, 0, uintptr(unsafe.Pointer(&key)), uintptr(unsafe.Pointer(&disposition)))
	if result != 0 {
		return errors.New("could not change this user's startup setting")
	}
	defer syscall.RegCloseKey(key)
	name := utf("AshviniThumbnailHelper")
	if !enable {
		r, _, _ := advapi32.NewProc("RegDeleteValueW").Call(uintptr(key), uintptr(unsafe.Pointer(name)))
		if r != 0 && r != 2 {
			return errors.New("could not disable startup")
		}
		return nil
	}
	source, err := os.Executable()
	if err != nil {
		return err
	}
	base := filepath.Join(os.Getenv("LOCALAPPDATA"), "AshviniThumbnailHelper", "app", Version)
	if err = os.MkdirAll(base, 0700); err != nil {
		return err
	}
	if err = os.WriteFile(filepath.Join(base, "THIRD_PARTY_NOTICES.txt"), thirdPartyNotices, 0600); err != nil {
		return errors.New("could not retain the helper notices")
	}
	dest := filepath.Join(base, "AshviniThumbnailHelper.exe")
	if !strings.EqualFold(source, dest) {
		body, e := os.ReadFile(source)
		if e != nil {
			return e
		}
		if e = os.WriteFile(dest, body, 0700); e != nil {
			return errors.New("could not retain the helper for startup")
		}
	}
	command := `"` + dest + `"`
	if len(command) > 260 {
		return errors.New("startup path is too long")
	}
	data, _ := syscall.UTF16FromString(command)
	r, _, _ := advapi32.NewProc("RegSetValueExW").Call(uintptr(key), uintptr(unsafe.Pointer(name)), 0, 1, uintptr(unsafe.Pointer(&data[0])), uintptr(len(data)*2))
	if r != 0 {
		return errors.New("could not enable startup")
	}
	return nil
}

type windowClass struct {
	Size, Style                        uint32
	Proc                               uintptr
	ClassExtra, WindowExtra            int32
	Instance, Icon, Cursor, Background uintptr
	Menu, Name                         *uint16
	SmallIcon                          uintptr
}
type point struct{ X, Y int32 }
type message struct {
	Window         uintptr
	ID             uint32
	WParam, LParam uintptr
	Time           uint32
	Point          point
	Private        uint32
}
type notifyData struct {
	Size                uint32
	Window              uintptr
	ID, Flags, Callback uint32
	Icon                uintptr
	Tip                 [128]uint16
	State, StateMask    uint32
	Info                [256]uint16
	Version             uint32
	InfoTitle           [64]uint16
	InfoFlags           uint32
	GUID                [16]byte
	Balloon             uintptr
}
type windowState struct {
	a                                  *app
	hwnd, status, code, pause, startup uintptr
	icon                               notifyData
	taskbar                            uint32
	pairing                            bool
}

func control(parent uintptr, class, text string, style uint32, x, y, w, h, id int) uintptr {
	handle, _, _ := createWindow.Call(0, uintptr(unsafe.Pointer(utf(class))), uintptr(unsafe.Pointer(utf(text))), uintptr(style|0x50000000), uintptr(x), uintptr(y), uintptr(w), uintptr(h), parent, uintptr(id), 0, 0)
	font, _, _ := syscall.NewLazyDLL("gdi32.dll").NewProc("GetStockObject").Call(17)
	user32.NewProc("SendMessageW").Call(handle, 0x0030, font, 1)
	return handle
}
func (w *windowState) refresh() {
	cfg, _, status, model := w.a.snapshot()
	text := status + "\r\nModel: " + ModelID + " (" + model + ")"
	setWindowText.Call(w.status, uintptr(unsafe.Pointer(utf(text))))
	label := "Pause"
	if cfg.Paused {
		label = "Resume"
	}
	setWindowText.Call(w.pause, uintptr(unsafe.Pointer(utf(label))))
	checked := uintptr(0)
	if cfg.Autostart {
		checked = 1
	}
	user32.NewProc("SendMessageW").Call(w.startup, 0x00f1, checked, 0)
	tip := "Ashvini Helper — " + status
	if len(tip) > 110 {
		tip = tip[:110]
	}
	for i := range w.icon.Tip {
		w.icon.Tip[i] = 0
	}
	copy(w.icon.Tip[:], syscall.StringToUTF16(tip))
	notifyIcon.Call(1, uintptr(unsafe.Pointer(&w.icon)))
}
func (w *windowState) show() {
	showWindow.Call(w.hwnd, 5)
	user32.NewProc("SetForegroundWindow").Call(w.hwnd)
}
func (w *windowState) menu() {
	menu, _, _ := user32.NewProc("CreatePopupMenu").Call()
	defer user32.NewProc("DestroyMenu").Call(menu)
	items := []struct {
		id   uintptr
		text string
	}{{1, "Show status / Pair"}, {2, "Pause / Resume"}, {3, "Start at login (toggle)"}, {4, "Retry local setup"}, {5, "Quit"}}
	for _, item := range items {
		user32.NewProc("AppendMenuW").Call(menu, 0, item.id, uintptr(unsafe.Pointer(utf(item.text))))
	}
	var pt point
	user32.NewProc("GetCursorPos").Call(uintptr(unsafe.Pointer(&pt)))
	user32.NewProc("SetForegroundWindow").Call(w.hwnd)
	choice, _, _ := user32.NewProc("TrackPopupMenu").Call(menu, 0x0100|0x0002, uintptr(pt.X), uintptr(pt.Y), 0, w.hwnd, 0)
	w.command(choice)
}
func (w *windowState) command(id uintptr) {
	switch id {
	case 1:
		w.show()
	case 2:
		w.a.togglePause()
		w.refresh()
	case 3:
		if err := w.a.toggleAutostart(); err != nil {
			w.a.report("Startup setting could not be changed.", "")
		}
		w.refresh()
	case 4:
		w.a.retry()
		w.a.report("Retrying local setup.", "missing")
	case 5:
		w.a.quit()
		notifyIcon.Call(2, uintptr(unsafe.Pointer(&w.icon)))
		user32.NewProc("PostQuitMessage").Call(0)
	case 10:
		if w.pairing {
			return
		}
		buffer := make([]uint16, 128)
		getWindowText.Call(w.code, uintptr(unsafe.Pointer(&buffer[0])), 128)
		code := strings.ToUpper(strings.ReplaceAll(strings.ReplaceAll(strings.TrimSpace(syscall.UTF16ToString(buffer)), " ", ""), "-", ""))
		if len(code) != 10 {
			w.a.report("Paste the 10-character pairing code from your website.", "")
			w.refresh()
			return
		}
		w.pairing = true
		w.a.report("Pairing with your website.", "")
		go func() {
			err := w.a.pair(code)
			if err != nil {
				w.a.report("Pairing could not complete. Use a fresh code and check the website connection.", "")
			}
			user32.NewProc("PostMessageW").Call(w.hwnd, 0x8002, 0, 0)
		}()
	}
}
func windowProc(hwnd uintptr, id uint32, wp, lp uintptr) uintptr {
	w := appWindow
	if w == nil {
		r, _, _ := defWindow.Call(hwnd, uintptr(id), wp, lp)
		return r
	}
	if id == w.taskbar {
		notifyIcon.Call(0, uintptr(unsafe.Pointer(&w.icon)))
		return 0
	}
	switch id {
	case 0x0010:
		showWindow.Call(hwnd, 0)
		return 0 // Close hides to the visible tray; Quit stops processing.
	case 0x0111:
		w.command(wp & 0xffff)
		return 0
	case 0x0113:
		w.refresh()
		return 0
	case 0x8001:
		if lp == 0x0205 {
			w.menu()
		} else if lp == 0x0203 {
			w.show()
		}
		return 0
	case 0x8002:
		w.pairing = false
		setWindowText.Call(w.code, uintptr(unsafe.Pointer(utf(""))))
		w.refresh()
		return 0
	}
	r, _, _ := defWindow.Call(hwnd, uintptr(id), wp, lp)
	return r
}
func runUI(a *app) error {
	runtime.LockOSThread()
	defer runtime.UnlockOSThread()
	instance, _, _ := kernel32.NewProc("GetModuleHandleW").Call(0)
	icon, _, _ := user32.NewProc("LoadIconW").Call(0, 32512)
	cursor, _, _ := user32.NewProc("LoadCursorW").Call(0, 32512)
	class := windowClass{Size: uint32(unsafe.Sizeof(windowClass{})), Proc: syscall.NewCallback(windowProc), Instance: instance, Icon: icon, Cursor: cursor, Background: 6, Name: utf("AshviniThumbnailHelperWindow")}
	registered, _, _ := user32.NewProc("RegisterClassExW").Call(uintptr(unsafe.Pointer(&class)))
	if registered == 0 {
		return errors.New("Windows status window could not start")
	}
	hwnd, _, _ := createWindow.Call(0, uintptr(unsafe.Pointer(class.Name)), uintptr(unsafe.Pointer(utf("Ashvini Thumbnail Helper"))), 0x00cf0000, 0x80000000, 0x80000000, 560, 340, 0, 0, instance, 0)
	if hwnd == 0 {
		return errors.New("Windows status window could not start")
	}
	w := &windowState{a: a, hwnd: hwnd}
	appWindow = w
	control(hwnd, "STATIC", "Background removal runs on this PC. No paid image API.", 0, 18, 16, 515, 22, 0)
	cfg, token, _, _ := a.snapshot()
	control(hwnd, "STATIC", cfg.Site, 0, 18, 44, 515, 22, 0)
	w.status = control(hwnd, "STATIC", "Preparing…", 0, 18, 76, 515, 62, 0)
	control(hwnd, "STATIC", "Pairing code", 0, 18, 148, 110, 22, 0)
	w.code = control(hwnd, "EDIT", "", 0x00800000|0x0080|0x0020, 128, 144, 245, 28, 0)
	control(hwnd, "BUTTON", "Pair", 0, 386, 144, 132, 28, 10)
	w.pause = control(hwnd, "BUTTON", "Pause", 0, 18, 190, 110, 32, 2)
	control(hwnd, "BUTTON", "Retry setup", 0, 140, 190, 130, 32, 4)
	control(hwnd, "BUTTON", "Quit", 0, 282, 190, 110, 32, 5)
	w.startup = control(hwnd, "BUTTON", "Start automatically when I log in", 0x0003, 18, 242, 480, 26, 3)
	w.icon = notifyData{Size: uint32(unsafe.Sizeof(notifyData{})), Window: hwnd, ID: 1, Flags: 7, Callback: 0x8001, Icon: icon}
	copy(w.icon.Tip[:], syscall.StringToUTF16("Ashvini Thumbnail Helper"))
	if ok, _, _ := notifyIcon.Call(0, uintptr(unsafe.Pointer(&w.icon))); ok == 0 {
		return errors.New("Windows tray icon could not start")
	}
	taskbar, _, _ := user32.NewProc("RegisterWindowMessageW").Call(uintptr(unsafe.Pointer(utf("TaskbarCreated"))))
	w.taskbar = uint32(taskbar)
	user32.NewProc("SetTimer").Call(hwnd, 1, 1000, 0)
	w.refresh()
	if token == "" {
		w.show()
	}
	var msg message
	for {
		result, _, _ := user32.NewProc("GetMessageW").Call(uintptr(unsafe.Pointer(&msg)), 0, 0, 0)
		if int32(result) <= 0 {
			break
		}
		user32.NewProc("TranslateMessage").Call(uintptr(unsafe.Pointer(&msg)))
		user32.NewProc("DispatchMessageW").Call(uintptr(unsafe.Pointer(&msg)))
	}
	notifyIcon.Call(2, uintptr(unsafe.Pointer(&w.icon)))
	appWindow = nil
	return nil
}
