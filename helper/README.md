# Ashvini Thumbnail Helper 1.0.0

Windows 10/11 x64 (Intel/AMD), per-user native tray/status app. No local HTTP listener, administrator install, PowerShell script, GPU dependency, or paid image API. Pair once with the website's 10-character code. The resulting limited device token is encrypted with current-user Windows DPAPI, bound to the website origin/device ID; it is not passed to Python or written in plaintext. Start at login is off until explicitly enabled and uses the current user's Run key. Quit stops the processor; Pause cancels work and stops new leases.

First setup downloads verified uv, private Python, CPU dependencies and the model. The status window shows progress; interrupted model downloads retain a partial file and resume when supported by the official server. Downloads have a 60-minute bound. Reusing cached runtime/model files avoids repeating setup. Missing VC++ runtime or import problems show a failed model state with Retry setup. A native Windows smoke test is still required; a Mac cross-build does not prove tray, DPAPI, startup, DLL loading or Windows inference behavior.

## Runtime/model pins

- uv 0.12.23 x86_64-pc-windows-msvc zip: SHA256 `75d05de6762778c31ee183398de7dd15093fad0ed90b1f236d8205ea5ec00c90`; official https://github.com/astral-sh/uv/releases/tag/0.12.23. uv is MIT/Apache-2.0. Its pinned Python metadata verifies the managed CPython download; CPython 3.12.14 Windows x64 metadata SHA256 is `f38e68f4d612ade6dd50c894fc80b14c0be0c3b5201145d6fff5f20b9323204d`.
- Private CPython 3.12.14, rembg[cpu] 2.0.85, ONNX Runtime CPU 1.30.0, Pillow 12.1.1. The release embeds a Windows/Python3.12 lock containing pinned transitive versions and wheel hashes. First setup only installs that locked set, binary-only with required hashes; it does not resolve new versions on the PC or change system PATH/Python. Preserve installed distributions' license files. Sources: https://docs.astral.sh/uv/concepts/python-versions/ and https://pypi.org/project/rembg/2.0.85/.
- Explicit `birefnet-general-lite`, checkpoint `BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx`, 224005088 bytes. Verified downloaded official artifact SHA256 `5600024376f572a557870a5eb0afb1e5961636bef4e1e22132025467d0f03333`; published rembg MD5 `4fab47adc4ff364be1713e97b7e66334` is checked additionally. Official model MIT license: https://huggingface.co/ZhengPeng7/BiRefNet_lite. Artifact source: https://github.com/danielgatis/rembg/releases/download/v0.0.0/BiRefNet-general-bb_swin_v1_tiny-epoch_232.onnx. Both cached and newly downloaded models are checked before loading. No default BRIA/cloud model or checksum-disable flag is used.
- ONNX Windows builds require the VC++ 2019+ runtime: https://onnxruntime.ai/docs/install/. No automatic elevated installer or execution-policy bypass is performed. An app-local runtime distribution needs Windows validation and its redistribution notices.

## Output and website protocol

One CPU job at a time. The worker derives an alpha mask, preserves source RGB before framing, multiplies existing source alpha, crops the meaningful alpha bounds, preserves subject aspect ratio and creates a square PNG up to 768px with about 8% transparent margin. The original website file is untouched. Output must be RGBA8, noninterlaced, at most 2 MiB and contain both real transparent and foreground pixels. Empty/opaque masks fail; there is no uncut rectangle fallback. An opaque source whose subject reaches the frame boundary needs a complete cover image instead of silently producing a clipped sticker. Already-transparent exports receive padding without being rejected just for tight framing. Segmentation quality/speed need real artwork and target-PC checks.

The native supervisor pairs/claims through HTTPS, verifies same-origin inputs, exact input length and SHA256, renews the lease every 30 seconds, and uploads only the bounded PNG. The backend checks the lease, device scope and current source fingerprint before accepting. `stale` means no website thumbnail was changed. Job images are stored only in a newly generated private per-job temporary directory and cleaned up afterward. Tokens, pairing codes, response bodies and subprocess stderr are not logged.

## Build/test

For a persistent setup, enable **Start automatically when I log in** once in the status window. That explicit action retains the EXE in this user's LocalAppData and registers only the current-user startup entry. The retained copy remains usable if the downloaded copy is later removed. No autorun is enabled silently. Processing requires the user to be logged in and the PC awake/connected; no Windows service is installed.

Use a verified Go SDK, caches under a writable work directory, and no external Go packages:

Run the Python tests from a development environment with the CPU requirements installed (including Pillow, NumPy and SciPy); a bare system Python is insufficient.

```sh
go test ./...
python3 -m unittest worker_test.py
GOOS=windows GOARCH=amd64 GOAMD64=v1 CGO_ENABLED=0 go build -trimpath -ldflags='-H=windowsgui' -o dist/AshviniThumbnailHelper.exe .
```

The cross-built EXE is unsigned. Windows distribution/signing and native validation remain release checks; no instruction is provided to bypass Windows security warnings. A verified same-byte model mirror can be pinned with `-X main.ModelDownloadURL=https://…`; the embedded model SHA256 remains unchanged.

Ship `THIRD_PARTY_NOTICES.txt` with the EXE. The same notices are embedded and written to the per-user helper folder on launch and beside its retained startup copy. Installed Python dependency license files stay in the private environment.
