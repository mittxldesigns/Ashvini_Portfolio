# Handoff: Ashvini portfolio (bettercallashvini.com) + job bot

Owner: Tanish (building for Ashvini / Ashwani Kumar). Stopped mid-task on 2026-10-01 to save limits.

## Repo / branches
- Work folder: `~/Documents/AI Websites/ashvini-editorial` (git worktree), branch `feat/editorial-work`.
- `origin/main` (GitHub mittxldesigns/Ashvini_Portfolio) == what's LIVE now (commit 2516a57: editorial page + SEO). Everything after that on this branch is the UNPUBLISHED sketchbook draft.
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
