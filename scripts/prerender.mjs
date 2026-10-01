import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pieces, CONTRA_PROFILE } from "../src/data/projectContent.js";
import { EDITORIAL_CATEGORIES, posts as editorialPosts } from "../src/data/editorialContent.js";
import { SKETCH_CHAPTERS, sketches } from "../src/data/sketchesContent.js";
import { getSiteProfile } from "../src/data/siteProfile.js";
import {
  absoluteSeoUrl,
  getSeoForPath,
  getStructuredData,
  SITE_URL,
} from "../src/data/seo.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const output = join(projectRoot, "dist");
const template = await readFile(join(output, "index.html"), "utf8");
const assets = await readdir(join(output, "assets"));
const profile = getSiteProfile();
const personName = profile.name;
const firstName = personName.split(" ")[0];
const contactUrl = profile.contraUrl || CONTRA_PROFILE;
const sensitive = (item) => item.nsfw === true || item.frames?.some((frame) => frame.nsfw === true);

const escapeHtml = (value) =>
  String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    '"': "&quot;",
    "'": "&#39;",
  })[character]);

function replaceSection(html, start, end, content) {
  const first = html.indexOf(start);
  const last = html.indexOf(end, first + start.length);
  if (first < 0 || last < 0) throw new Error(`Missing HTML marker: ${start}`);
  return html.slice(0, first) + content + html.slice(last + end.length);
}

function builtImage(slug) {
  const prefix = slug === "dna-helix" ? "dna-helix-full-" : `${slug}-hero-`;
  const suffix = slug === "dna-helix" ? ".png" : ".webp";
  const file = assets.find((name) => name.startsWith(prefix) && name.endsWith(suffix));
  if (!file) throw new Error(`Missing built image for ${slug}`);
  return `/assets/${file}`;
}

function headFor(page, image) {
  const title = escapeHtml(page.title);
  const description = escapeHtml(page.description);
  const url = escapeHtml(page.canonical);
  const imageUrl = escapeHtml(image);
  const schema = getStructuredData(page, image);
  return [
    `<title>${title}</title>`,
    `<meta name="description" content="${description}" />`,
    `<meta name="robots" content="${escapeHtml(page.robots)}" />`,
    ...(page.kind === "notFound" ? [] : [`<link rel="canonical" href="${url}" />`]),
    `<meta property="og:type" content="website" />`,
    `<meta property="og:site_name" content="${escapeHtml(page.siteName)}" />`,
    `<meta property="og:title" content="${title}" />`,
    `<meta property="og:description" content="${description}" />`,
    `<meta property="og:url" content="${url}" />`,
    `<meta property="og:image" content="${imageUrl}" />`,
    `<meta property="og:image:alt" content="${title}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
    `<meta name="twitter:title" content="${title}" />`,
    `<meta name="twitter:description" content="${description}" />`,
    `<meta name="twitter:image" content="${imageUrl}" />`,
    ...(schema
      ? [`<script id="page-structured-data" type="application/ld+json">${JSON.stringify(schema).replace(/</g, "\\u003c")}</script>`]
      : []),
  ].join("\n    ");
}

const homeShellStart = "<!-- BOOT_SHELL_START -->";
const homeShellEnd = "<!-- BOOT_SHELL_END -->";
const homeShell = `<div class="boot-shell" style="position: relative; width: 100%; min-height: 100vh"><div class="home-container"><div class="home-content"><h1>${escapeHtml(personName)}</h1><p>${escapeHtml(profile.tagline)}</p><div class="home-track"><a class="cta" href="/portfolio">3D &amp; Web3D work</a><a class="cta cta-outline" href="/editorial">Social &amp; editorial work</a><a class="cta cta-outline cta-paper" href="/sketches">Sketchbook</a></div><p class="home-cred">${escapeHtml(profile.homeCred)}</p><a class="home-contact" href="${escapeHtml(contactUrl)}">Start a project <span aria-hidden="true">↗</span></a><nav class="home-browse" aria-label="About"><a href="/about">About ${escapeHtml(firstName)} →</a></nav></div></div><p class="para position-1">${escapeHtml(profile.homeDescription)}</p></div>`;

function artworkLink(item, route) {
  const href = sensitive(item) ? route : absoluteSeoUrl(item.url) || route;
  return `<a href="${escapeHtml(href)}">${escapeHtml(item.title)}</a>${sensitive(item) ? " (sensitive artwork; viewing warning on the portfolio)" : ""}`;
}

function siteNav(path) {
  const links = [
    ["/", "Home"],
    ["/portfolio", "3D & Web3D"],
    ["/editorial", "Social & editorial"],
    ["/sketches", "Sketchbook"],
    ["/about", "About"],
  ].map(([href, label]) =>
    `<a href="${href}"${path === href ? ' aria-current="page"' : ""}>${escapeHtml(label)}</a>`,
  ).join(" · ");
  return `<nav aria-label="Site">${links}</nav>`;
}

function portfolioShell() {
  const links = pieces.filter((piece) => !sensitive(piece)).map((piece, index) =>
    `<li><a href="/portfolio/${piece.id}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(piece.title)}</a></li>`,
  ).join("");
  return `<main class="seo-shell"><a class="seo-home-link" href="/">${escapeHtml(personName)}</a><h1>Selected 3D work</h1><p>Product models, interactive scenes, and motion studies.</p><nav aria-label="Projects"><ol class="seo-project-list">${links}</ol></nav><a class="seo-contact" href="${escapeHtml(contactUrl)}">Message ${escapeHtml(firstName)} about a project ↗</a></main>`;
}

function projectShell(page, index, image) {
  if (page.sensitive) return `<main class="seo-shell"><a class="seo-home-link" href="/portfolio">← All work</a><h1>${escapeHtml(page.project.title)}</h1><p>${escapeHtml(page.project.description)}</p><p>Sensitive artwork. Open the portfolio to review the viewing warning.</p><a href="/portfolio">Explore the work →</a></main>`;
  const previous = (index - 1 + pieces.length) % pieces.length;
  const next = (index + 1) % pieces.length;
  const imageClass = page.project.slug === "dna-helix" ? ' class="seo-project-image--dna"' : "";
  return `<main class="seo-shell seo-project"><div class="seo-project-copy"><a class="seo-home-link" href="/portfolio">← All work</a><p class="seo-number">${String(index + 1).padStart(2, "0")} / ${pieces.length}</p><h1>${escapeHtml(page.project.title)}</h1><p>${escapeHtml(page.project.description)}</p><a class="seo-contact" href="${escapeHtml(contactUrl)}">Message ${escapeHtml(firstName)} about a project ↗</a><nav aria-label="Other projects"><a href="/portfolio/${pieces[previous].id}">← ${escapeHtml(pieces[previous].title)}</a><a href="/portfolio/${pieces[next].id}">${escapeHtml(pieces[next].title)} →</a></nav></div><img${imageClass} src="${escapeHtml(image.replace(SITE_URL, ""))}" alt="${escapeHtml(page.project.title)}" /></main>`;
}

function aboutShell() {
  const exp = (profile.experience || []).map((t) => `<li>${escapeHtml(t.years)}: ${escapeHtml(t.role)}, ${escapeHtml(t.org)}${t.note ? `. ${escapeHtml(t.note)}` : ""}</li>`).join("");
  const qa = (profile.faq || []).map((item) => `<h3>${escapeHtml(item.q)}</h3><p>${escapeHtml(item.a)}</p>`).join("");
  return `<main class="seo-shell"><a class="seo-home-link" href="/portfolio">← Selected work</a><h1>About ${escapeHtml(personName)}</h1><p>${escapeHtml(profile.aboutBio)}</p><h2>Experience</h2><ul>${exp}</ul>${qa ? `<h2>Quick answers</h2>${qa}` : ""}<nav><a href="/portfolio">3D &amp; Web3D work</a> · <a href="/editorial">Social &amp; editorial work</a></nav><a class="seo-contact" href="${escapeHtml(contactUrl)}">Message ${escapeHtml(firstName)} about a project ↗</a></main>`;
}

function editorialShell() {
  const pubs = (profile.publishers || []).map((p) => `<li><strong>${escapeHtml(p.org)}</strong>: ${escapeHtml(p.role)}, ${escapeHtml(p.years)}. ${escapeHtml(p.about)} ${(p.stats || []).map((st) => `${escapeHtml(st.value)} ${escapeHtml(st.label)}`).join(", ")}.</li>`).join("");
  const chapters = (profile.editorialCategories || EDITORIAL_CATEGORIES).map((c) => {
    const items = editorialPosts.filter((post) => post.category === c.id)
      .map((post) => `<li>${artworkLink(post, "/editorial")}: ${escapeHtml(post.note)}${post.client ? ` (${escapeHtml(post.client)})` : ""}${post.date ? ` <time datetime="${escapeHtml(post.date)}">${escapeHtml(post.date)}</time>` : ""}</li>`).join("");
    return `<h2>${escapeHtml(c.label)}</h2><p>${escapeHtml(c.blurb)}</p><ul>${items}</ul>`;
  }).join("");
  const audience = profile.audienceLabel || profile.combinedFollowers;
  const reach = audience && profile.audienceChecked ? ` The publishers' pages total ${escapeHtml(audience)} followers (public counts, ${escapeHtml(profile.audienceChecked)}).` : "";
  return `<main class="seo-shell"><a class="seo-home-link" href="/">${escapeHtml(personName)}</a><h1>${escapeHtml(profile.editorialTitle || `Social & editorial design by ${personName}`)}</h1><p>${escapeHtml(profile.editorialIntro)}${reach}</p><h2>${escapeHtml(profile.editorialPubsTitle || "Where the work runs")}</h2><p>${escapeHtml(profile.editorialPubsNote)}</p><ul>${pubs}</ul>${chapters}<p>${escapeHtml(profile.editorialClosingNote)}</p><a class="seo-contact" href="/portfolio">See the 3D &amp; Web3D work →</a></main>`;
}

function sketchesShell() {
  const chapters = (profile.sketchChapters || SKETCH_CHAPTERS).map((c) => {
    const items = sketches.filter((s) => s.chapter === c.id)
      .map((s) => `<li>${artworkLink(s, "/sketches")} (${escapeHtml(s.medium)}, ${escapeHtml(s.year)}): ${escapeHtml(s.note)}</li>`).join("");
    return `<h2>${escapeHtml(c.label)}</h2><p>${escapeHtml(c.blurb)}</p><ul>${items}</ul>`;
  }).join("");
  return `<main class="seo-shell"><a class="seo-home-link" href="/">${escapeHtml(personName)}</a><h1>Sketchbook: the artist side of ${escapeHtml(personName)}</h1><p>${escapeHtml(profile.sketchesKicker)}</p><p>${escapeHtml(profile.sketchesIntro)}</p>${chapters}<p>${escapeHtml(profile.sketchesClosingNote)}</p><a class="seo-contact" href="${escapeHtml(contactUrl)}">Commission a piece ↗</a></main>`;
}

function notFoundShell() {
  return `<main class="seo-shell"><h1>Page not found</h1><p>That project page is not in this portfolio.</p><a class="seo-contact" href="/portfolio">Explore the work →</a></main>`;
}

async function writePage(path, destination, shell) {
  const page = getSeoForPath(path);
  const image = page.kind === "project" && !page.sensitive
    ? (page.project.full || page.project.heroWebp ? page.image : `${SITE_URL}${builtImage(page.project.slug)}`)
    : page.image;
  const linkedShell = page.kind === "home" || page.kind === "notFound"
    ? shell
    : shell.replace("<h1>", `${siteNav(path)}<h1>`);
  let html = replaceSection(template, "<!-- SEO_HEAD_START -->", "<!-- SEO_HEAD_END -->", headFor(page, image));
  html = replaceSection(html, homeShellStart, homeShellEnd, linkedShell);
  await mkdir(dirname(join(output, destination)), { recursive: true });
  await writeFile(join(output, destination), html);
}

await writePage("/", "index.html", homeShell);
await writePage("/portfolio", "portfolio.html", portfolioShell());
await writePage("/about", "about.html", aboutShell());
await writePage("/editorial", "editorial.html", editorialShell());
await writePage("/sketches", "sketches.html", sketchesShell());
for (const [index, piece] of pieces.entries()) {
  const path = `/portfolio/${piece.id}`;
  const page = getSeoForPath(path);
  await writePage(path, `portfolio/${piece.id}.html`, projectShell(page, index, `${SITE_URL}${builtImage(page.project.slug)}`));
}
await writePage("/404", "404.html", notFoundShell());

const sitemapPaths = ["/", "/portfolio", "/about", "/editorial", "/sketches", ...pieces.filter((piece) => !sensitive(piece)).map((piece) => `/portfolio/${piece.id}`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(join(output, "sitemap.xml"), sitemap);
console.log(`Generated ${sitemapPaths.length} search-ready pages and sitemap.xml`);
