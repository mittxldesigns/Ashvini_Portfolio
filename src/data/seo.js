import { CONTRA_PROFILE, pieces } from "./projectContent.js";
import { EDITORIAL_CATEGORIES, posts as editorialPosts } from "./editorialContent.js";
import { SKETCH_CHAPTERS, sketches as sketchList } from "./sketchesContent.js";
import { getSiteProfile } from "./siteProfile.js";

export const SITE_URL = "https://bettercallashvini.com";
export const PERSON_NAME = "Ashvini Kumar";

const sensitive = (item) => item?.nsfw === true || item?.frames?.some((frame) => frame.nsfw === true);
const list = (value) => Array.isArray(value) ? value : [];
const text = (value) => typeof value === "string" ? value : "";

function snapshot(content = {}) {
  return {
    profile: content.profile ?? getSiteProfile(),
    projects: content.projects ?? pieces,
    editorial: content.editorial ?? editorialPosts,
    sketches: content.sketches ?? sketchList,
    siteUrl: (content.siteUrl || SITE_URL).replace(/\/+$/, ""),
  };
}

export function absoluteSeoUrl(value, siteUrl = SITE_URL) {
  if (typeof value !== "string" || !value) return "";
  try {
    const url = new URL(value, `${siteUrl}/`);
    return ["http:", "https:"].includes(url.protocol) && !url.username && !url.password ? url.href : "";
  } catch { return ""; }
}

function publicationDate(item) {
  const value = Object.hasOwn(item, "date") ? item.date : item.dateISO;
  if (typeof value !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(value)) return {};
  const parsed = new Date(`${value}T00:00:00Z`);
  return Number.isFinite(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value ? { datePublished: value } : {};
}

export function getSeoForPath(pathname, content) {
  const context = snapshot(content);
  const { profile, projects, editorial, siteUrl } = context;
  const name = text(profile.name) || PERSON_NAME;
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const base = {
    context,
    path,
    siteName: name,
    canonical: `${siteUrl}${path}`,
    image: `${siteUrl}/social-preview.webp`,
    robots: "index,follow",
    sensitive: false,
  };
  const clients = [...new Set(editorial.map((post) => post.client).filter(Boolean))];
  const categories = list(profile.editorialCategories ?? EDITORIAL_CATEGORIES);
  const chapters = list(profile.sketchChapters ?? SKETCH_CHAPTERS);
  const definitions = {
    "/": {
      kind: "home",
      title: `${name} — ${text(profile.tagline) || "3D Artist & Social Editorial Designer"}`,
      description: text(profile.homeDescription),
    },
    "/portfolio": {
      kind: "portfolio",
      title: `Selected 3D Work — ${name}`,
      description: text(profile.homeDescription) || `Product models, interactive scenes, and motion studies by ${name}.`,
    },
    "/about": {
      kind: "about",
      title: `About ${name} — ${text(profile.tagline) || "3D Artist & Editorial Designer"}`,
      description: text(profile.aboutBio) || text(profile.homeDescription),
    },
    "/editorial": {
      kind: "editorial",
      image: `${siteUrl}/og-editorial.jpg`,
      title: `Social & Editorial Design — ${name}`,
      description: text(profile.editorialIntro) || `${name}'s social and editorial work${clients.length ? ` for ${clients.join(" and ")}` : ""}. ${categories.map((category) => category.label).filter(Boolean).join(", ")}.`,
    },
    "/sketches": {
      kind: "sketches",
      title: `Sketchbook: Digital Paintings & Pencil Art — ${name}`,
      description: text(profile.sketchesIntro) || `${name}'s sketchbook: ${chapters.map((chapter) => chapter.label).filter(Boolean).join(", ")}.`,
    },
  };
  if (path === "/admin" || path.startsWith("/admin/")) return {
    ...base, kind: "admin", title: `Portfolio editor — ${name}`,
    description: "Owner sign-in for editing and publishing the portfolio.",
    robots: "noindex,nofollow,noarchive",
  };
  const definition = definitions[path];
  if (definition) {
    const overrides = profile.seo?.[definition.kind];
    return {
      ...base,
      ...definition,
      ...(text(overrides?.title).trim() ? { title: overrides.title } : {}),
      ...(text(overrides?.description).trim() ? { description: overrides.description } : {}),
    };
  }

  const match = /^\/portfolio\/([1-9]\d*)$/.exec(path);
  const project = match && projects.find((piece) => String(piece.id) === match[1]);
  if (project) {
    const needsConsent = Boolean(sensitive(project));
    const mediaImage = project.poster || (project.mediaType === "video" ? project.thumbWebp : project.full || project.heroWebp);
    const image = !needsConsent && absoluteSeoUrl(mediaImage, siteUrl);
    return {
      ...base,
      kind: "project",
      project,
      sensitive: needsConsent,
      title: `${project.title} — ${name}`,
      description: text(project.description) || text(project.note),
      ...(image ? { image } : {}),
      ...(needsConsent ? { robots: "noindex,follow" } : {}),
    };
  }

  return {
    ...base,
    kind: "notFound",
    title: `Page not found — ${name}`,
    description: `This page is not part of ${name}'s portfolio.`,
    robots: "noindex,nofollow",
  };
}

export function getStructuredData(page, image = page.image, content) {
  if (["notFound", "admin"].includes(page.kind) || (page.kind === "project" && page.sensitive)) return null;
  const { profile, projects, editorial, sketches, siteUrl } = snapshot(content ?? page.context);
  const name = text(profile.name) || PERSON_NAME;
  const experience = list(profile.experience);
  const publishers = list(profile.publishers);
  const categories = list(profile.editorialCategories ?? EDITORIAL_CATEGORIES);
  const chapters = list(profile.sketchChapters ?? SKETCH_CHAPTERS);
  const person = {
    "@type": "Person",
    "@id": `${siteUrl}/#person`,
    name,
    url: siteUrl,
    ...(absoluteSeoUrl(profile.avatarUrl, siteUrl) ? { image: absoluteSeoUrl(profile.avatarUrl, siteUrl) } : {}),
    ...(name === PERSON_NAME ? { alternateName: ["Ashwani Kumar", "Ashvini"] } : {}),
    ...(profile.tagline ? { jobTitle: profile.tagline } : {}),
    ...(profile.aboutBio || profile.homeDescription ? { description: profile.aboutBio || profile.homeDescription } : {}),
    ...(profile.location ? { homeLocation: { "@type": "Place", name: profile.location } } : {}),
    worksFor: publishers.filter((publisher) => publisher.org && /present|current/i.test(publisher.years || "")).map((publisher) => ({ "@type": "Organization", name: publisher.org })),
    alumniOf: experience.filter((entry) => entry.side === "edu" && entry.org).map((entry) => ({ "@type": "EducationalOrganization", name: entry.org })),
    knowsAbout: list(profile.skills),
    sameAs: [profile.contraUrl, profile.instagramUrl, profile.linkedinUrl, profile.splineUrl]
      .map((url) => absoluteSeoUrl(url, siteUrl)).filter(Boolean),
  };
  const graph = (entities) => ({ "@context": "https://schema.org", "@graph": [person, ...entities] });

  if (page.kind === "home") return graph([{
    "@type": "WebSite", name: `${name} Portfolio`, url: siteUrl, creator: { "@id": person["@id"] },
  }]);

  if (page.kind === "about") return graph([
    { "@type": "ProfilePage", name: `About ${name}`, url: page.canonical, mainEntity: { "@id": person["@id"] } },
    ...(list(profile.faq).length ? [{
      "@type": "FAQPage",
      mainEntity: profile.faq.map((item) => ({
        "@type": "Question", name: item.q, acceptedAnswer: { "@type": "Answer", text: item.a },
      })),
    }] : []),
  ]);

  if (["portfolio", "editorial", "sketches"].includes(page.kind)) {
    const items = page.kind === "portfolio" ? projects : page.kind === "editorial" ? editorial : sketches;
    return graph([{
      "@type": "CollectionPage",
      name: page.kind === "portfolio" ? "Selected 3D Work" : page.kind === "editorial" ? "Social & Editorial Design" : "Sketchbook",
      description: page.description,
      url: page.canonical,
      creator: { "@id": person["@id"] },
      ...(page.kind === "portfolio" ? {} : { about: (page.kind === "editorial" ? categories : chapters).map((category) => ({ "@type": "Thing", name: category.label })) }),
      mainEntity: {
        "@type": "ItemList",
        itemListElement: items.map((item, index) => {
          if (page.kind === "portfolio") return {
            "@type": "ListItem", position: index + 1, name: item.title, url: `${siteUrl}/portfolio/${item.id}`,
          };
          const source = !sensitive(item) && absoluteSeoUrl(item.url, siteUrl);
          return {
            "@type": "ListItem",
            position: index + 1,
            item: {
              "@type": page.kind === "sketches" && item.mediaType !== "video" ? "VisualArtwork" : "CreativeWork",
              ...(item.slug ? { "@id": `${page.canonical}#${encodeURIComponent(item.slug)}` } : {}),
              name: item.title,
              description: text(item.note) || text(item.description),
              url: source || page.canonical,
              creator: { "@id": person["@id"] },
              ...publicationDate(item),
              ...(page.kind === "sketches" && item.medium ? { artMedium: item.medium } : {}),
              ...(page.kind === "editorial" ? {
                ...(categories.find((category) => category.id === item.category)?.label ? { genre: categories.find((category) => category.id === item.category).label } : {}),
                ...(item.client ? { publisher: { "@type": "Organization", name: item.client } } : {}),
              } : {}),
            },
          };
        }),
      },
    }]);
  }

  return graph([{
    "@type": "CreativeWork",
    name: page.project.title,
    description: text(page.project.description) || text(page.project.note),
    url: page.canonical,
    ...(absoluteSeoUrl(image, siteUrl) ? { image: absoluteSeoUrl(image, siteUrl) } : {}),
    creator: { "@id": person["@id"] },
    isPartOf: `${siteUrl}/portfolio`,
    ...(page.project.contraUrl && page.project.contraUrl !== (profile.contraUrl || CONTRA_PROFILE)
      ? { sameAs: absoluteSeoUrl(page.project.contraUrl, siteUrl) } : {}),
  }]);
}
