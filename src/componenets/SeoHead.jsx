import { useEffect } from "react";
import { useLocation } from "react-router-dom";
import { projects } from "../data/projects.js";
import { getSeoForPath, getStructuredData, PERSON_NAME, SITE_URL } from "../data/seo.js";
import dnaHelixFull from "../assets/work/dna-helix-full.png";

function setMeta(attribute, name, content) {
  let tag = document.head.querySelector(`meta[${attribute}="${name}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attribute, name);
    document.head.appendChild(tag);
  }
  tag.setAttribute("content", content);
}

export default function SeoHead() {
  const { pathname } = useLocation();

  useEffect(() => {
    const page = getSeoForPath(pathname);
    const project = page.kind === "project" && projects.find((item) => item.id === page.project.id);
    const image = project
      ? `${SITE_URL}${project.slug === "dna-helix" ? dnaHelixFull : project.heroWebp}`
      : page.image;
    document.title = page.title;
    setMeta("name", "description", page.description);
    setMeta("name", "robots", page.robots);
    setMeta("property", "og:type", "website");
    setMeta("property", "og:site_name", PERSON_NAME);
    setMeta("property", "og:title", page.title);
    setMeta("property", "og:description", page.description);
    setMeta("property", "og:url", page.canonical);
    setMeta("property", "og:image", image);
    setMeta("property", "og:image:alt", page.title);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", page.title);
    setMeta("name", "twitter:description", page.description);
    setMeta("name", "twitter:image", image);

    let canonical = document.head.querySelector('link[rel="canonical"]');
    if (!canonical) {
      canonical = document.createElement("link");
      canonical.rel = "canonical";
      document.head.appendChild(canonical);
    }
    canonical.href = page.canonical;

    let schema = document.head.querySelector('#page-structured-data');
    const data = getStructuredData(page, image);
    if (!data) {
      schema?.remove();
    } else if (!schema) {
      schema = document.createElement("script");
      schema.id = "page-structured-data";
      schema.type = "application/ld+json";
      document.head.appendChild(schema);
    }
    if (data) schema.textContent = JSON.stringify(data);
  }, [pathname]);

  return null;
}
