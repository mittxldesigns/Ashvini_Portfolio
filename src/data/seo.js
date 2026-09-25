import { CONTRA_PROFILE, pieces } from "./projectContent.js";

export const SITE_URL = "https://bettercallashvini.com";
export const PERSON_NAME = "Ashvini Kumar";

const homeDescription =
  "Interactive 3D scenes, product models, and motion for the web by Ashvini Kumar.";

export function getSeoForPath(pathname) {
  const path = pathname === "/" ? "/" : pathname.replace(/\/+$/, "");
  const base = {
    path,
    canonical: `${SITE_URL}${path}`,
    image: `${SITE_URL}/social-preview.webp`,
    robots: "index,follow",
  };

  if (path === "/") {
    return {
      ...base,
      kind: "home",
      title: `${PERSON_NAME} — 3D Artist & Spline Designer`,
      description: homeDescription,
    };
  }

  if (path === "/portfolio") {
    return {
      ...base,
      kind: "portfolio",
      title: `Selected 3D Work — ${PERSON_NAME}`,
      description:
        "Explore product models, interactive scenes, and motion studies by Ashvini Kumar.",
    };
  }

  if (path === "/about") {
    return {
      ...base,
      kind: "about",
      title: `About ${PERSON_NAME} — 3D Artist & Spline Designer`,
      description:
        "Meet Ashvini Kumar, a 3D artist and Spline designer creating product visuals and interactive web scenes.",
    };
  }

  const projectMatch = /^\/portfolio\/([1-9]\d*)$/.exec(path);
  const project = projectMatch && pieces.find((piece) => piece.id === Number(projectMatch[1]));
  if (project) {
    return {
      ...base,
      kind: "project",
      project,
      title: `${project.title} — ${PERSON_NAME}`,
      description: project.description,
    };
  }

  return {
    ...base,
    kind: "notFound",
    title: `Page not found — ${PERSON_NAME}`,
    description: "This page is not part of Ashvini Kumar's portfolio.",
    robots: "noindex,nofollow",
  };
}

export function getStructuredData(page, image = page.image) {
  const person = {
    "@type": "Person",
    "@id": `${SITE_URL}/#person`,
    name: PERSON_NAME,
    url: SITE_URL,
    image: `${SITE_URL}/avatar.webp`,
    jobTitle: "3D Artist and Spline Designer",
    sameAs: [
      "https://contra.com/ashvini_kmr",
      "https://instagram.com/ashvini_kmr",
    ],
  };

  if (page.kind === "notFound") return null;
  if (page.kind === "home") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        person,
        {
          "@type": "WebSite",
          name: `${PERSON_NAME} Portfolio`,
          url: SITE_URL,
          creator: { "@id": person["@id"] },
        },
      ],
    };
  }

  if (page.kind === "portfolio") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        person,
        {
          "@type": "CollectionPage",
          name: "Selected 3D Work",
          url: page.canonical,
          creator: { "@id": person["@id"] },
          mainEntity: {
            "@type": "ItemList",
            itemListElement: pieces.map((piece, index) => ({
              "@type": "ListItem",
              position: index + 1,
              name: piece.title,
              url: `${SITE_URL}/portfolio/${piece.id}`,
            })),
          },
        },
      ],
    };
  }

  if (page.kind === "about") {
    return {
      "@context": "https://schema.org",
      "@graph": [
        person,
        {
          "@type": "AboutPage",
          name: `About ${PERSON_NAME}`,
          url: page.canonical,
          mainEntity: { "@id": person["@id"] },
        },
      ],
    };
  }

  return {
    "@context": "https://schema.org",
    "@graph": [
      person,
      {
        "@type": "CreativeWork",
        name: page.project.title,
        description: page.project.description,
        url: page.canonical,
        image,
        creator: { "@id": person["@id"] },
        isPartOf: `${SITE_URL}/portfolio`,
        ...(page.project.contraUrl && page.project.contraUrl !== CONTRA_PROFILE
          ? { sameAs: page.project.contraUrl }
          : {}),
      },
    ],
  };
}
