import { mkdir, readFile, readdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { pieces, CONTRA_PROFILE } from "../src/data/projectContent.js";
import {
  getSeoForPath,
  getStructuredData,
  PERSON_NAME,
  SITE_URL,
} from "../src/data/seo.js";

const projectRoot = fileURLToPath(new URL("../", import.meta.url));
const output = join(projectRoot, "dist");
const template = await readFile(join(output, "index.html"), "utf8");
const assets = await readdir(join(output, "assets"));

const escapeHtml = (value) =>
  String(value).replace(/[&<>"']/g, (character) => ({
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
    `<meta property="og:site_name" content="${escapeHtml(PERSON_NAME)}" />`,
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
const homeShell = template.slice(
  template.indexOf(homeShellStart) + homeShellStart.length,
  template.indexOf(homeShellEnd),
);

function portfolioShell() {
  const links = pieces.map((piece, index) =>
    `<li><a href="/portfolio/${piece.id}"><span>${String(index + 1).padStart(2, "0")}</span>${escapeHtml(piece.title)}</a></li>`,
  ).join("");
  return `<main class="seo-shell"><a class="seo-home-link" href="/">${escapeHtml(PERSON_NAME)}</a><h1>Selected 3D work</h1><p>Product models, interactive scenes, and motion studies.</p><nav aria-label="Projects"><ol class="seo-project-list">${links}</ol></nav><a class="seo-contact" href="${escapeHtml(CONTRA_PROFILE)}">Message Ashvini about a project ↗</a></main>`;
}

function projectShell(page, index, image) {
  const previous = (index - 1 + pieces.length) % pieces.length;
  const next = (index + 1) % pieces.length;
  const imageClass = page.project.slug === "dna-helix" ? ' class="seo-project-image--dna"' : "";
  return `<main class="seo-shell seo-project"><div class="seo-project-copy"><a class="seo-home-link" href="/portfolio">← All work</a><p class="seo-number">${String(index + 1).padStart(2, "0")} / ${pieces.length}</p><h1>${escapeHtml(page.project.title)}</h1><p>${escapeHtml(page.project.description)}</p><a class="seo-contact" href="${escapeHtml(CONTRA_PROFILE)}">Message Ashvini about a project ↗</a><nav aria-label="Other projects"><a href="/portfolio/${pieces[previous].id}">← ${escapeHtml(pieces[previous].title)}</a><a href="/portfolio/${pieces[next].id}">${escapeHtml(pieces[next].title)} →</a></nav></div><img${imageClass} src="${escapeHtml(image.replace(SITE_URL, ""))}" alt="${escapeHtml(page.project.title)}" /></main>`;
}

function aboutShell() {
  return `<main class="seo-shell"><a class="seo-home-link" href="/portfolio">← Selected work</a><h1>About ${escapeHtml(PERSON_NAME)}</h1><p>A 3D artist and Spline designer creating product visuals and interactive scenes for the web.</p><p>Explore selected work, or send a project inquiry through Contra.</p><a class="seo-contact" href="${escapeHtml(CONTRA_PROFILE)}">Message Ashvini about a project ↗</a></main>`;
}

function notFoundShell() {
  return `<main class="seo-shell"><h1>Page not found</h1><p>That project page is not in this portfolio.</p><a class="seo-contact" href="/portfolio">Explore the work →</a></main>`;
}

async function writePage(path, destination, shell) {
  const page = getSeoForPath(path);
  const image = page.kind === "project"
    ? `${SITE_URL}${builtImage(page.project.slug)}`
    : `${SITE_URL}/social-preview.webp`;
  let html = replaceSection(template, "<!-- SEO_HEAD_START -->", "<!-- SEO_HEAD_END -->", headFor(page, image));
  html = replaceSection(html, homeShellStart, homeShellEnd, shell);
  await mkdir(dirname(join(output, destination)), { recursive: true });
  await writeFile(join(output, destination), html);
}

await writePage("/", "index.html", homeShell);
await writePage("/portfolio", "portfolio.html", portfolioShell());
await writePage("/about", "about.html", aboutShell());
for (const [index, piece] of pieces.entries()) {
  const path = `/portfolio/${piece.id}`;
  const page = getSeoForPath(path);
  await writePage(path, `portfolio/${piece.id}.html`, projectShell(page, index, `${SITE_URL}${builtImage(page.project.slug)}`));
}
await writePage("/404", "404.html", notFoundShell());

const sitemapPaths = ["/", "/portfolio", "/about", ...pieces.map((piece) => `/portfolio/${piece.id}`)];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${sitemapPaths.map((path) => `  <url><loc>${SITE_URL}${path}</loc></url>`).join("\n")}\n</urlset>\n`;
await writeFile(join(output, "sitemap.xml"), sitemap);
console.log(`Generated ${sitemapPaths.length} search-ready pages and sitemap.xml`);
