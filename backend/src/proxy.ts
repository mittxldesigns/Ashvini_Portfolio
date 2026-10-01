import { Content, published, RecordValue } from "./content";
import { getSeoForPath, getStructuredData } from "../../src/data/seo.js";

const escape = (value: unknown) => String(value ?? "").replace(/[&<>"']/g,(char) => ({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[char] || char));
const scriptJson = (value: unknown) => JSON.stringify(value).replace(/</g,"\\u003c").replace(/>/g,"\\u003e").replace(/&/g,"\\u0026").replace(/\u2028/g,"\\u2028").replace(/\u2029/g,"\\u2029");
const routes = ["/","/portfolio","/about","/editorial","/sketches"];
function entries(content: Content, pathname: string) {
  return pathname === "/editorial" ? content.editorial : pathname === "/sketches" ? content.sketches : content.projects;
}
const routeSeo = (content: Content, pathname: string, siteUrl?: string) => getSeoForPath(pathname,{...content,siteUrl});
function shell(content: Content, pathname: string) {
  const profile = content.profile;
  const item = pathname.startsWith("/portfolio/") ? content.projects.find((project) => String(project.id) === pathname.split("/")[2]) : undefined;
  let body = "";
  if (pathname.startsWith("/portfolio/") && !item) body = `<h1>Project not found</h1><p>This project is not in the current portfolio.</p><a href="/portfolio">All work</a>`;
  else if (item?.nsfw) body = `<h1>Sensitive artwork</h1><p>This project requires viewing consent in the interactive portfolio.</p><a href="/portfolio">All work</a>`;
  else if (item) body = `<h1>${escape(item.title)}</h1><p>${escape(item.description)}</p>`;
  else if (pathname === "/about") {
    body = `<h1>${escape(profile.aboutTitle || profile.name)}</h1><p>${escape(profile.aboutBio)}</p>`;
    if (Array.isArray(profile.experience)) body += profile.experience.map((entry) => entry && typeof entry === "object" && !Array.isArray(entry) ? `<section><h2>${escape(entry.org)}</h2><p>${escape(entry.role)} · ${escape(entry.years)}</p><p>${escape(entry.note)}</p></section>` : "").join("");
    if (Array.isArray(profile.faq)) body += profile.faq.map((entry) => entry && typeof entry === "object" && !Array.isArray(entry) ? `<section><h2>${escape(entry.q)}</h2><p>${escape(entry.a)}</p></section>` : "").join("");
  } else {
    const heading = pathname === "/" ? profile.name : pathname === "/portfolio" ? "3D portfolio" : pathname === "/editorial" ? profile.editorialTitle || "Social & editorial design" : "Sketchbook";
    const intro = pathname === "/" ? profile.homeDescription : pathname === "/editorial" ? profile.editorialIntro || routeSeo(content,pathname).description : pathname === "/sketches" ? profile.sketchesIntro || routeSeo(content,pathname).description : routeSeo(content,pathname).description;
    body = `<h1>${escape(heading)}</h1><p>${escape(intro)}</p>${pathname === "/" && profile.homeCred ? `<p>${escape(profile.homeCred)}</p>` : ""}`;
    if (pathname === "/editorial" && Array.isArray(profile.publishers)) {
      body += `<h2>${escape(profile.editorialPubsTitle || "Publisher experience")}</h2><p>${escape(profile.editorialPubsNote)}</p>`;
      body += profile.publishers.map((publisher) => { if (!publisher || typeof publisher !== "object" || Array.isArray(publisher)) return ""; return `<section><h3>${escape(publisher.org)}</h3><p>${escape(publisher.role)} · ${escape(publisher.years)}</p><p>${escape(publisher.work || publisher.about)}</p>${Array.isArray(publisher.stats) ? `<ul>${publisher.stats.map((stat) => stat && typeof stat === "object" && !Array.isArray(stat) ? `<li>${escape(stat.value)} ${escape(stat.label)}</li>` : "").join("")}</ul>` : ""}</section>`; }).join("");
    }
    body += "<ul>";
    body += entries(content,pathname).filter((entry) => !entry.nsfw).sort((a,b) => Number(a.order)-Number(b.order)).map((entry) => {
      const date = entry.dateISO || entry.date;
      const attribution = [entry.client,entry.medium,typeof date === "string" && Number.isFinite(Date.parse(date)) ? date.slice(0,10) : entry.dateLabel].filter(Boolean).map(escape).join(" · ");
      const source = typeof entry.url === "string" && /^https?:\/\//.test(entry.url) ? `<a href="${escape(entry.url)}" rel="noopener noreferrer">Original source</a>` : "";
      return `<li><h2>${escape(entry.title)}</h2>${attribution ? `<p>${attribution}</p>` : ""}<p>${escape(entry.description || entry.note)}</p>${["/","/portfolio"].includes(pathname) ? `<a href="/portfolio/${escape(entry.id)}">View project</a>` : source}</li>`;
    }).join("") + "</ul>";
    if (pathname === "/editorial" || pathname === "/sketches") body += `<p>${escape(pathname === "/editorial" ? profile.editorialClosingNote : profile.sketchesClosingNote)}</p>`;
  }
  return `<main class="seo-shell"><nav><a href="/">Home</a> <a href="/portfolio">3D work</a> <a href="/about">About</a> <a href="/editorial">Editorial</a> <a href="/sketches">Sketches</a></nav>${body}<noscript>This portfolio also includes an interactive view when JavaScript is enabled.</noscript></main>`;
}
export async function proxy(env: Env, request: Request) {
  const incoming = new URL(request.url);
  const needsSnapshot = routes.includes(incoming.pathname) || /^\/portfolio\/\d+\/?$/.test(incoming.pathname) || ["/sitemap.xml","/llms.txt"].includes(incoming.pathname);
  const snapshot = needsSnapshot ? await published(env) : null;
  if (snapshot && incoming.pathname === "/sitemap.xml") {
    const paths = [...routes,...snapshot.projects.filter((entry) => !entry.nsfw).map((entry) => `/portfolio/${entry.id}`)];
    return new Response(`<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${paths.map((path) => `<url><loc>${escape(env.SITE_ORIGIN+path)}</loc></url>`).join("")}</urlset>`,{headers:{"Content-Type":"application/xml; charset=utf-8","Cache-Control":"no-cache"}});
  }
  if (snapshot && incoming.pathname === "/llms.txt") {
    const text = `# ${snapshot.profile.name}\n\n${snapshot.profile.homeDescription || ""}\n\n## Pages\n${routes.map((path) => `- [${path === "/" ? "Home" : path.slice(1)}](${env.SITE_ORIGIN}${path})`).join("\n")}\n\n## 3D projects\n${snapshot.projects.filter((entry) => !entry.nsfw).map((entry) => `- [${entry.title}](${env.SITE_ORIGIN}/portfolio/${entry.id}): ${entry.description || ""}`).join("\n")}\n`;
    return new Response(text,{headers:{"Content-Type":"text/plain; charset=utf-8","Cache-Control":"no-cache"}});
  }
  const target = new URL(incoming.pathname+incoming.search,env.PAGES_ORIGIN);
  const headers = new Headers(request.headers);
  headers.delete("Cookie"); headers.delete("Authorization"); headers.delete("X-CSRF-Token"); headers.delete("X-Setup-Token"); headers.delete("Host");
  const response = await fetch(new Request(target,{method:request.method,headers,redirect:"manual"}));
  if (incoming.pathname === "/admin" || incoming.pathname.startsWith("/admin/")) {
    const protectedHeaders = new Headers(response.headers);
    protectedHeaders.set("X-Robots-Tag","noindex, nofollow, noarchive");
    protectedHeaders.set("X-Frame-Options","DENY");
    protectedHeaders.set("Content-Security-Policy","frame-ancestors 'none'");
    protectedHeaders.set("Referrer-Policy","no-referrer");
    protectedHeaders.set("Cache-Control","private, no-store");
    return new Response(response.body,{status:response.status,headers:protectedHeaders});
  }
  if (!snapshot || request.method !== "GET" || !response.headers.get("Content-Type")?.includes("text/html") || (!routes.includes(incoming.pathname) && !/^\/portfolio\/\d+\/?$/.test(incoming.pathname))) return response;
  const seo = routeSeo(snapshot,incoming.pathname,env.SITE_ORIGIN), outputHeaders = new Headers(response.headers);
  outputHeaders.set("Cache-Control","no-cache"); outputHeaders.delete("ETag"); outputHeaders.delete("Last-Modified");
  outputHeaders.set("X-Robots-Tag",seo.robots);
  const schema = getStructuredData(seo,seo.image);
  const freshHead = `<title>${escape(seo.title)}</title><meta name="description" content="${escape(seo.description)}"><meta name="robots" content="${escape(seo.robots)}"><link rel="canonical" href="${escape(seo.canonical)}"><meta property="og:title" content="${escape(seo.title)}"><meta property="og:description" content="${escape(seo.description)}"><meta property="og:url" content="${escape(seo.canonical)}"><meta property="og:site_name" content="${escape(seo.siteName)}"><meta property="og:image" content="${escape(seo.image)}"><meta property="og:type" content="${seo.kind === "project" ? "article" : "website"}"><meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escape(seo.title)}"><meta name="twitter:description" content="${escape(seo.description)}"><meta name="twitter:image" content="${escape(seo.image)}"><script id="portfolio-content" type="application/json">${scriptJson(snapshot)}</script>${schema ? `<script id="page-structured-data" type="application/ld+json">${scriptJson(schema)}</script>` : ""}`;
  const rewritten = new HTMLRewriter()
    .on("head",{element(element) { element.append(freshHead,{html:true}); }})
    .on('script[type="application/ld+json"],#portfolio-content',{element(element) { element.remove(); }})
    .on("#root",{element(element) { element.setInnerContent(shell(snapshot,incoming.pathname),{html:true}); }})
    .on('title,link[rel="canonical"],meta[name="description"],meta[name="robots"],meta[property^="og:"],meta[name^="twitter:"]',{element(element) { element.remove(); }});
  const projectRoute = /^\/portfolio\/(\d+)\/?$/.exec(incoming.pathname);
  const status = projectRoute ? (snapshot.projects.some((entry) => String(entry.id) === projectRoute[1]) ? 200 : 404) : response.status;
  return rewritten.transform(new Response(response.body,{status,headers:outputHeaders}));
}
