# PC thumbnail helper

Requested by Tanish, 5 October 2026. Ash uses Windows 10/11 on Intel/AMD.

## Outcomes

1. Every new 3D grid thumbnail is prepared as a transparent subject cutout. Social graphics, sketches, full artwork, and original video stay unchanged.
2. Install the Windows helper once. Models and runtime remain cached locally; the helper offers visible status, pause/resume, quit, and optional start at login.
3. The website and helper exchange authenticated jobs. Image inference runs on Ash's PC; no paid image API or owner-password sharing.
4. Clear offline/processing/failure states. Never claim a cutout exists while it is queued. Never silently publish an opaque substitute as a completed sticker.

## Architecture and invariants

- Cloudflare remains the website's only backend/storage provider: Worker, D1 and R2.
- A short-lived pairing code is generated inside the authenticated editor. Pairing issues a separate scoped, revocable device credential, stored using Windows DPAPI. It cannot edit portfolio text, publish drafts, or run arbitrary commands.
- Immutable thumbnail jobs identify the project and exact source image. One leased job runs at a time; expired claims can be recovered. Completion is applied only when the source still matches, protecting concurrent edits by Ash.
- The helper downloads only allowlisted website media and writes only processed thumbnail results. It never scans local folders, watches clipboard contents, opens inbound network ports, or sends messages.
- Existing published and draft content must not be replaced by an old seed. Derived thumbnails should be overlaid separately where practical rather than rewriting active drafts.
- Local inference uses a permissively licensed segmentation model. Its mask is applied to the actual image; no generated replacement subject. Preserve useful thin edges and contain the subject with transparent margins.
- Ship a Windows amd64 executable and pinned/hash-verified runtime/model dependencies. No disabling Defender, certificate checks, or PowerShell execution policy. No administrator access required.

## Verification and delivery

- Test pairing expiry/reuse/revocation, scoped auth, atomic leases, malformed/oversized uploads, stale-source completion, and offline recovery.
- Test mask generation on real opaque portfolio thumbnails, preserving original files and true alpha in output.
- Compile Windows binary, test portable core and protocol locally; report that native Windows installation remains unverified until Ash runs it.
- Provide the public download and concise setup instructions to Ash through the user-authorized WhatsApp handoff only after the package is ready.
- Independently ship the verified drag/drop/paste and Spline guidance fixes while the helper is built.
