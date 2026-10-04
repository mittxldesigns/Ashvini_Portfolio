# Handoff: Ashvini portfolio (bettercallashvini.com) + job bot

Owner: Tanish (building for Ashvini / Ashwani Kumar). Stopped mid-task on 2026-10-01 to save limits.

## Repo / branches
- Work folder: `~/Documents/AI Websites/ashvini-editorial` (git worktree), branch `feat/editorial-work`.
- Cloudflare production is LIVE at source `3b3c877` (Pages `de0ac58c`) plus the ready side-chat loader shortcut adjustment. The owner CMS Worker is live at version `90621175-7069-42ca-9a5f-77f6b037b174` on the exact `bettercallashvini.com/*` route. GitHub `origin/main` remains at `2516a57`: automatic approval review blocked the requested Git push because this session cannot request approval. Do not assume GitHub main matches the live site.
- Old folder `~/Documents/AI Websites/Ashvini new site final` has an unpushed local commit b2b1d73 "Polish homepage artwork entrance" that is NOT live and is now behind origin/main. Leave it unless Tanish asks.
- Deploy = Cloudflare Pages direct upload, project `ashvini-portfolio`:
  - preview: `npm run build && npx wrangler pages deploy dist --project-name ashvini-portfolio --branch sketches-draft --commit-dirty=true` -> https://sketches-draft.ashvini-portfolio.pages.dev
  - production: same with `--branch main` (only when Tanish says go), then `git push origin feat/editorial-work:main` (fast-forward).
- Rules from Tanish: build on top of what's live, don't rewrite Codex's existing pages/styles. No invented facts in copy (only Ashvini's resume/captions/public numbers). Copy must not sound AI/generic.

## Live already (done)
- `/editorial`: social & editorial design page (FandomWire posts, publisher reach: Animated Times FB 1.09M / IG 140K, FandomWire FB 1.48M / IG 74K, checked Oct 2026), first-person copy.
- Header work switch, home two buttons + credibility line, About experience timeline + FAQ.
- SEO/AEO/GEO: richer Person schema, FAQPage, CollectionPage lists, prerendered crawlable text (scripts/prerender.mjs), llms.txt, robots.txt (AI crawlers allowed), og-editorial.jpg, sitemap lastmod.

## In progress: `/sketches` (artist side) -- NOT live
Files: `src/componenets/Sketches.jsx`, `src/data/sketchesContent.js` (28 curated pieces, Node-safe), `src/data/sketches.js` (images), `src/assets/sketches/*`, `src/assets/cutout/*` (letters), CSS block "Sketchbook page" at the end of `src/index.css`, route in `App.jsx`, `/sketches` entries in `seo.js` + `prerender.mjs`, HeaderNav 3rd switch option + `.headernav--paper`.
Design brief (Tanish): white paper, blueprint-but-white, pencil, real pencil-drawn grid (not AI grid), lots of vector/pencil animations, must feel different from the dark site, "more sketchy, more pencil, light", non-AI fonts and copy, sexy load animation.
Current state:
- Paper bg + wobbly pencil grid (SVG feDisplacementMap), rough pencil frames (`#sk-rough` filter), tape, Reenie Beanie (handwriting) + Courier Prime (labels).
- Headlines use magazine cut-out letters extracted from Tanish's font `~/Documents/IleneJoy/fonts/Newspaper-Cutouts-Regular.ttf` (sbix colour bitmap, so it's rendered as per-letter images via the `Cutout` component; only A-Z/0-9 exist). NOTE: font's maker field says IleneJoy; Tanish asked to use it.
- Intro (once per session, skipped for reduced motion): pencil grid draws, frame sketches, SKETCHBOOK pasted letter by letter, page turns away.
- Desktop looks good. Mobile was reported "messy"; a calmer phone layout (<=600px block at the very end of index.css: 2-column board, no tilts/doodles, smaller tape) was just added and looked OK in the last check, but Tanish has NOT seen it yet. Draft link still shows the OLDER version -> rebuild + redeploy preview, then ask Tanish.
TODO next:
1. Polish mobile further and re-deploy `sketches-draft`; get Tanish's OK.
2. Page transitions (Tanish asked: "every page should blend seamlessly, not generic"). Plan agreed in chat:
   - give the active `.work-switch a[aria-current]` pill a `view-transition-name` so it glides between 3D / Social / Sketches,
   - dark -> /sketches: paper sheet slides/lays in over the dark page (custom `::view-transition-new(root)` keyed by `html[data-vt=...]`),
   - /sketches -> dark: paper lifts/turns away,
   - dark <-> dark: keep Codex's existing transitions (`src/lib/viewTransition.js`, "View transitions" block in index.css). Set the `kind` via TransitionLink / HeaderNav links.
3. DECIDED: keep the "Bangles" study (with the @siimipie reference credit). Ashvini may still review copy.
4. Then add `/sketches` to llms.txt, link it from Home/About, deploy to production.

## Other assets
- Instagram archive (all 169 posts, captions, dates, full-res): `~/Documents/AI Websites/ashvini-instagram/` (`index.json`, `media/`). Don't hammer Instagram (rate-limits his account).
- Knowledge base: `~/Library/Application Support/Claude/scratch-workspaces/.../knowledge-base/ashwani-kumar.md` (session scratch; copy somewhere permanent if needed).

## LinkedIn auto-apply extension (running live)
- `~/Downloads/linkedin-autoapply/` (v1.4.1), loaded unpacked in Chrome profile "Profile 8" (kumarak9335@gmail.com). Bumping `version.txt` makes it self-reload.
- Pacing: 07:00-01:00 local, bursts of 10-15 then 5-6 min cooldown, soft cap ~50/day, alternates India-remote with abroad searches, priority pop-culture employers, blocks FandomWire/Animated Times, honest answers only. Claude Code native bridge for odd questions (`host/`). Tests: `node tests/rules.test.js`, jsdom sim in `tests/`.
- DECIDED (v1.4.2): "make this job your sole focus / drop other clients?" is answered Yes (he'll commit if the offer is worth it).

## Bot status (checked 2026-10-01 ~22:20 IST)
- Live, ~70+ applications so far (36 on Sep 30, 35 on Oct 1). LinkedIn's Easy Apply daily limit hit at ~35/day (08:10 IST); bot pauses until ~07:00 next day.
- TODO (small, in `~/Downloads/linkedin-autoapply/content.js`):
  1. Persist the limit pause: when LIMIT is detected, `S.set("limitUntil", nextStart)` and at the top of `main()` nap if `Date.now() < limitUntil`. Today a page reload during the pause made it re-hit the limit twice (extension self-update, manual tab navigation).
  2. Lower the default soft cap from 50 to ~32 (`s.maxPerDay ?? 50` in `main()` and popup default) so it stops just before LinkedIn's wall.
  3. Bump `version.txt` + manifest version so it self-reloads; run `node tests/rules.test.js` and the jsdom suite (`tests/test.js`, needs `npm i jsdom`).
- Don't navigate the bot's own LinkedIn tab when checking status; read `#autoapply-status` from it or use the extension popup.

## NEW FEATURE: inbox & lead monitor (requested 2026-10-01)
Goal: the bot also watches LinkedIn for DMs, recruiter replies and potential leads, so Ashvini never misses one.
Build inside the existing extension (`~/Downloads/linkedin-autoapply/`):
- What to watch (read-only, from his logged-in session, same text/aria-based DOM approach as the apply flow):
  1. Messaging inbox (`/messaging/`): new/unread threads, sender name + headline, first lines.
  2. Application updates (`/my-items/saved-jobs/?cardType=APPLIED` / "Applied" tab): status changes like viewed, in review, rejected, "interviewing".
  3. Notifications page: "viewed your profile" from recruiters/companies, InMails, connection requests from recruiters/hiring managers.
- Classify each item (rules first, then the existing Claude Code bridge / Haiku fallback for anything unclear): `recruiter_reply`, `interview_request`, `client_lead` (someone wants to hire him for a project/commission), `rejection`, `spam/sales pitch`, `other`. Match against the `applied` history so replies are linked to the job he applied for.
- Alerts: macOS notification for recruiter replies, interview requests and client leads (the extension already has `notifications`). Add a "Leads" tab in the popup: sender, company, linked job, category, time, link to the thread, plus a suggested reply draft.
- NEVER send messages, accept connections or click anything that acts on his behalf automatically. Drafts only; Ashvini/Tanish sends. Never paste credentials/personal data anywhere.
- Pacing: check every 20-40 min (random), only during active hours, max one tab driver (reuse the lock), pause while an application is in progress; don't hammer LinkedIn.
- Optional later: also scan Gmail (kumarak9335@gmail.com) for recruiter emails via the Gmail connector, read-only.
- Tests: extend `tests/sim.js` with a fake inbox/notifications page; verify classification + no-send guarantee.

## Verified continuation checkpoint
- Latest site preview: https://sketches-draft.ashvini-portfolio.pages.dev/sketches (deployment `2c039e6d`, source `98108af`). Production and the push to `main` still await Tanish's "go".
- Phone hero now puts the full-width, upright artwork immediately below SKETCHBOOK; smaller handwriting/labels, two-row phone header, no long phone intro. Desktop layout retained; Bangles and @siimipie credit retained.
- Paper entry slides in; exit lifts the whole paper header with the sheet. Social is captured fully visible underneath. Active work pill glides; dark-to-dark motion retained; reduced motion skips transitions.
- Home/About/llms.txt links were authorized for the preview and are prepared. Crawlable HTML now links all site sections; unverified build-date sitemap lastmod values removed.
- Site checks passed: npm run lint, npm run build, inline browser at 375/320/1440px, 21 HTML/20 indexable-route crawl + schema audit, no broken internal links.
- Site checkpoints: `2424f60` phone tabs; `73bd2bf` paper transitions/tab/header; `84c2b3c` SEO/internal links; `37977d7` paper-header exit; `98108af` artwork first + phone typography.
- Bot source is now v1.5.0; manifest and version.txt match. Self-reload trigger updated; the actual Chrome loaded version was not inspected.
- Bot now has local Git source tracking on feat/editorial-work, no remote: `5c90d6b` persistent limitUntil/default ~32; `035ce81` inbox/lead monitor.
- Monitor: persisted 20–40 minute checks during 07:00–01:00, shared serialized driver lock, safe pauses between applications, quiet first baselines, hot-item alerts, Leads tab and neutral manual drafts. No send/accept/composer actions.
- Bot checks passed: node tests/rules.test.js (79), tests/monitor.test.js (113), full tests/test.js integration suite, syntax and whitespace. jsdom is in the Codex chat's work/bot-test-runtime; use its node_modules as NODE_PATH, without installing into the extension.
- Live LinkedIn collector layouts remain unverified. Coverage is up to 80 rendered previews per source, without opening threads or pagination; unknown structures preserve baselines and report source errors in Leads.
- Original historical TODOs above are superseded by these completed source checkpoints; production approval and live collector validation remain outstanding.

## Production checkpoint — 2026-10-02
- Tanish explicitly authorized production publishing. https://bettercallashvini.com/sketches and https://bettercallashvini.com/sketches?loader=true were verified in the inline browser after deployment.
- Production deployment `0c64e655` contains `54f37d2` (16px faint, uneven paper grid + six coordinate marks) and `c8d7bec` (decoded image cache, immediate previews, adjacent preload, full-quality originals and the side-chat portrait loader).
- Normal phone visits retain immediate artwork; the forced `loader=true` query plays the new portrait intro. The portrait loader and repeatable query behavior were included from the ready side-chat source.
- Release checks passed: npm run lint, npm run build, 20 Node cache/loader tests, HTML/schema audits, 375px viewer sizing, rapid arrows, slow full-image loading, offline fallback and retry. The live domain served the new bundle and forced loader.
- Git push was not completed: `git push origin feat/editorial-work:main` was rejected by automatic approval review with "approval required by policy, but AskForApproval is set to Never". GitHub main was independently confirmed still at `2516a57`. Local branch changes are committed.


## Galleries, owner CMS and story checkpoint — 2026-10-02
- Public domain: https://bettercallashvini.com. Latest Pages deployment `de0ac58c`; latest preview is `989a198b` at `sketches-draft.ashvini-portfolio.pages.dev`, including the same-document setup-link fix.
- Editorial: 89 post groups / 211 full frames, comprising 43 Animated Times and 46 FandomWire posts. All 74 newly supplied social links are represented. Seven explicitly marked Highlights lead in supplied order. Real source links and dates retained; 51 verified publication dates, 38 dates left unknown. Full media is lossless with original decoded pixels/dimensions retained.
- Sketchbook: 43 artwork groups covering 45 source posts. The 19 supplied links contain 17 unique posts; three Joji sources are grouped with ordered versions. Existing 28 artworks and Bangles reference credit retained. All 17 unique supplied posts represented.
- Source gaps: Joji's actual reel MP4, Alita's second slide and Batman: Arkham Knight's second slide were unavailable. Their genuine covers/source links are present; coverage/status metadata remains explicit. No substitute video or slides invented.
- Sensitive artwork: three personal pieces plus two social posts containing graphic film-injury frames. Covers are blurred, the viewer warns before mounting/fetching full media, and navigating into another protected post clears consent. Sensitive items are excluded from original preloading and direct sensitive source/media anchors in crawlable HTML/JSON-LD.
- Lightboxes use one arrow pair through carousel frames, then posts; no duplicate navigation pairs. Immediate previews and bounded original-image cache retained. Phone chapter tabs use one opaque paper strip beneath the header. Phone dark headers cover scrolling text. Publisher credits now show actual published covers, tenure and roles with separately labelled publisher audience figures.
- Cloudflare-only CMS: `backend/` Worker, D1 `ashvini-owner-cms`, R2 `ashvini-portfolio-media`. `/admin` supports the pinned owner email, native scrypt password hashing, secure sessions, CSRF/origin checks, upload originals/previews, structured content editing, draft/publish, revision conflicts and rollback. Published data drives the public UI, metadata, schemas, sitemap and llms. Existing WWW redirects to the apex remain; no extra WWW Worker route was added.
- Owner is `kumarak9335@gmail.com`. No actual owner password/account was created by the agent. Private first-password setup is configured; the URL token is removed from the address after load or same-document navigation. Bootstrap metadata is held privately in the chat's work area and Keychain; never copy the URL/token into this repository or public reports. It expires within 24 hours. Sharing the owner-access link through WhatsApp is pending explicit confirmation under the computer-use credential/access rule.
- Story: https://bettercallashvini.com/site-tour.mp4, served from a fixed R2 key independently of CMS publication flags. 29 seconds, 1080×1920 export, H.264/yuv420p, 60fps, 1,740 frames; silent. Actual inline-browser UI, predominantly 360×640 captures upscaled with Lanczos; offline CFR assembly, no optical-flow interpolation or claim of native real-time 1080/60 capture. All five primary pages, a project detail, publisher credits, and a safe carousel are covered. Full decode and scene/frame checks pass.
- Validation: `npm run lint`, `npm run build`, `node --test tests/*.test.mjs` (32/32), backend `npm run typecheck` and `npm test` (39/39), 20-route HTML/schema/internal-link audit, desktop + phone inline-browser checks. Live domain editor, setup form, API counts, private headers, source schema identity, asset passthrough, WWW redirects, video HEAD/ranges/ETag, and wrong-login rejection verified. Actual owner login/upload/publish remains a human setup/live workflow step. Native hashing probes passed; production CPU accounting was unavailable from the bounded tail probe.
- WhatsApp: user explicitly authorized the final handoff to Ashvini. Exact contact verified against the matching supplied Instagram links. Public site/editor/video instructions and source-gap/bot notes were sent; original `ashvini-site-story.mp4` was sent as a document, and its Delivered status was observed. The private setup link has not been forwarded while confirmation is pending.
- Commits: `7525dc2` verified source galleries; `81b4aa9` public galleries/consent/editor integration; `ca2cd26` CMS; `443a17b` phone header; `2628939` private editor metadata; `3b3c877` domain CMS/story activation. The side-chat change in `SketchbookPreloader.jsx` remains uncommitted and preserved; it is included in the uploaded build.

## Location update (2026-10-04)
Ashvini now lives in Delhi (not Lucknow). Updated: bot `rules.js` city + `background.js` KB (v1.5.1, commit 8fe9a50), site `faq.js` + `llms.txt`. Site change is committed but NOT deployed (working tree had uncommitted sketchbook WIP); ship it with the next production deploy. School name "The Lucknow Public Collegiate" stays as-is.
