# Ashvini owner CMS

The existing portfolio remains the frontend. This separate Cloudflare Worker provides an owner editor, a D1 draft/published snapshot, and R2 original/preview media. Public registration is disabled. Only `OWNER_EMAIL` can create the single account using a privately configured first-password link.

## Current state

- Dedicated D1 `ashvini-owner-cms` exists in APAC. Its initial migration contains only new CMS tables and has been applied.
- R2 creation initially returned error 10042. The user then confirmed activation, and the dedicated private bucket `ashvini-portfolio-media` was created successfully. This implementation made no paid plan, subscription, or billing change.
- `PROXY_ENABLED` is `false`; no production route has been activated. Password setup is disabled because no bootstrap secrets are configured. No owner account/password was created.
- The API passes local integration tests against real workerd, D1 and R2 emulation. The synthetic browser editor checks cover save/publish, original image bytes, JPEG previews, NSFW flags and mobile scrolling. Staging is deployed on workers.dev; production upload, login CPU accounting, routing and the real owner workflow still require live verification.

## Architecture

`/api/portfolio` reads only one published JSON snapshot directly from D1's primary. Save uses a compare-and-set revision; competing saves return 409. Publishing copies the saved draft and marks its referenced R2 media public in one D1 transaction. Rollback creates a new draft revision, so an owner can review before publishing it. No published document can contain credential fields or raw HTML. Site/bootstrap data is escaped inside a non-executable JSON script.

`PROXY_ENABLED=true` enables a Pages origin proxy. It strips cookies and authorization before contacting Pages, preserves frontend assets, embeds `#portfolio-content`, and replaces the crawlable `#root` shell on canonical pages. It also regenerates `/sitemap.xml`, `/llms.txt`, titles, descriptions, Person/WebPage and FAQ structured data from the published snapshot. Its canonical paths are `/`, `/portfolio`, `/portfolio/:id`, `/about`, `/editorial`, `/sketches`. Sensitive entries are excluded from crawlable listings. The frontend must enforce its viewing consent gate before rendering/prefetching sensitive artwork.

The password uses native `node:crypto` scrypt with N=32768, r=8, p=3, a fresh 256-bit salt, and 64 MiB maximum allocation. This is [OWASP's 32 MiB scrypt profile](https://cheatsheetseries.owasp.org/cheatsheets/Password_Storage_Cheat_Sheet.html). A production probe found that both WebCrypto and Node PBKDF2 enforce an iteration ceiling below OWASP's 600,000-round SHA256 cost, even though local workerd accepted it; the implementation therefore uses the standard memory-hard scrypt alternative. Cloudflare [supports native scrypt through node:crypto](https://developers.cloudflare.com/workers/runtime-apis/nodejs/crypto/). Actual production CPU accounting must still be verified. A deployment must never weaken hashing to fit a quota or upgrade billing automatically.

Session tokens are 256 random bits; only their SHA256 digest is stored. Cookies use `__Host-`, Secure, HttpOnly, SameSite=Strict, Path=/ and a seven-day expiry. Server-side logout revokes the token. Every mutation checks the exact request Origin and an independent session CSRF token before parsing bodies. Database-backed rate limits cover setup/login (8 attempts per client IP/10 minutes plus 20 account-wide), new uploads (60/hour) and binary uploads (120/hour). Error responses contain no raw server errors; logs contain an incident ID only.

## API

| Method / path | Contract |
| --- | --- |
| `GET /api/portfolio` | Published `{schemaVersion:1,revision,profile,projects,editorial,sketches}` or `null` (use bundled seed). |
| `GET /api/auth/session` | `{authenticated,email?,csrfToken?,initialized?}`; private no-store. |
| `POST /api/auth/login` | `{email,password}`. |
| `POST /api/auth/setup` | `{email,password}` and `X-Setup-Token`; the private fragment is removed from browser history immediately. |
| `POST /api/auth/logout` | Revokes the current session. |
| `GET /api/admin/content` | `{content,revision,publishedRevision,history,media}`. |
| `PUT /api/admin/content` | `{expectedRevision,content}` -> `{content,revision,createdAt}`. |
| `POST /api/admin/publish` | `{expectedRevision}` -> `{publishedRevision,publishedAt}`. |
| `POST /api/admin/rollback` | `{expectedRevision,revision}`; creates a new draft revision. |
| `POST /api/admin/media` | `{filename,mime,size,previewMime,previewSize}` -> `{id,original,preview,mime,size}`. |
| `PUT /api/admin/media/:id/original` | Raw bytes, exact matching MIME and Content-Length. |
| `PUT /api/admin/media/:id/preview` | Raw JPEG/WebP preview bytes with matching MIME and Content-Length. |
| `GET /media/:id/original` / `preview` | Published files public; unpublished files require the owner's session. Supports ETag/HEAD/range. |

Authenticated mutations require `X-CSRF-Token`. Setup and login still require the exact Origin. No cross-origin CORS is enabled.

Images are limited to 30 MiB; videos to 80 MiB; previews to 2 MiB; content edits to 512 KiB and 300 entries per collection. Accepted originals: JPEG, PNG, WebP, AVIF, GIF, MP4, WebM, MOV. MIME plus magic bytes are checked, and incoming originals stream through a fixed-length stream to R2 without full buffering. The browser creates a JPEG preview or video poster; originals retain exact uploaded bytes. Failed uploads remain unpublished and retryable. An interrupted upload claim can retry after 15 minutes. Media objects are immutable once uploaded. Unpublished orphan uploads remain private; automatic deletion has deliberately not been added.

## Local verification

```sh
cd backend
npm ci
npm run types
npm run typecheck
npm run build
npm test
```

`npm run types` creates an ignored local runtime declarations file from Wrangler's actual configuration. Integration tests use synthetic credentials and isolated emulated storage; they do not create an owner account or send email. The lockfile pins the retrieved packages. Current npm `latest` Miniflare is v5 alpha; tests use Cloudflare's exported v4-options converter, while the Worker itself has no runtime dependency.

## Deployment sequence

1. Keep the existing `ashvini-portfolio-media` bucket's public access disabled; only this Worker serves objects.
2. Validate the full existing portfolio seed and prepare SQL with `node scripts/seed-sql.mjs <seed.json> <scratch-output.sql>`. Apply it with `wrangler d1 execute ashvini-owner-cms --remote --file <scratch-output.sql>`. Seeding cannot overwrite an existing CMS state.
3. Deploy to workers.dev with proxy disabled. Verify public API, unauthorized API, origin guards, static content preservation, media, and logging. Review security before routing production.
4. Enable the Pages proxy and the exact approved production route. Do not route a production hostname before reviewing its zone/origin configuration and testing the proxy with the complete seed.
5. Generate a fresh 256-bit bootstrap token in a trusted local process; store it in Keychain, set only its SHA256 digest as `BOOTSTRAP_TOKEN_HASH` and a Unix expiry (at most 24 hours ahead) as `BOOTSTRAP_EXPIRES_AT` through Wrangler secrets. Never print the token or place it in the repo/reports. Privately open `/admin#setup=<token>` for the owner handoff. The owner enters their password themselves.
6. After setup, the account's unique ID blocks all later setup attempts. Remove the bootstrap configuration in a separately authorized secret-management step. Verify owner login, save, publish, upload and logout manually without reading the password field.

Password recovery/email verification are not automatically configured: no mail sender or outbound email was authorized. Recovery requires a separately reviewed private administrator workflow. This is a tested implementation, not a guarantee that bugs cannot occur.
