import { CONTRA_PROFILE, pieces } from "./projectContent.js";
export { CONTRA_PROFILE } from "./projectContent.js";

const images = import.meta.glob("../assets/work/*.{avif,webp}", {
  eager: true,
  import: "default",
});

const asset = (name) => images[`../assets/work/${name}`];

// Spline code exports (Export → Code Export), loaded live on project pages.
const scene = (id) => `https://prod.spline.design/${id}/scene.splinecode`;
const splineScenes = {
  "nothing-headphones": scene("jXEeiYImnNo-xkP9"),
  "teenage-engineering-tp7": scene("OTRUzpGWHaubpEPX"),
  "mebrafino": scene("kdqhqPUq6EiMChKd"),
  "head-animation": scene("yEU3-rshpVEnZpOO"),
  "cmf-headphones-pro": scene("AudUg-Rg6HK6vyGz"),
  "helix-animation": scene("jopYXnsC3tdHKmh7"),
  "worklouder-keypad": scene("JpuhRvZr5uM0NUsL"),
  "patek-philippe": scene("hY3qIr45CrkA3skJ"),
  "labyrinth-orb": scene("h0Vxy9FByCAJOujC"),
  "petal-spiral": scene("BrvRczWQQJRmAnHS"),
  "chrome-ak47": scene("ETZoGHGU-gWBxlR8"),
  "eneftro-card": scene("QwfwSb7Mgrojmw3X"),
  "dna-helix": scene("3vQwrcy4RfqSLaaZ"),
};

export const projects = pieces.map((p) => ({
  description: null,
  roles: [],
  tools: [],
  outcome: null,
  externalLink: null,
  extraLinks: [],
  contraUrl: CONTRA_PROFILE,
  ...p,
  thumbAvif: asset(`${p.slug}-thumb.avif`),
  thumbWebp: asset(`${p.slug}-thumb.webp`),
  heroAvif: asset(`${p.slug}-hero.avif`),
  heroWebp: asset(`${p.slug}-hero.webp`),
  splineScene: splineScenes[p.slug] ?? null,
}));

// Contra work without a matching render in the grid.
export const caseStudies = [
  {
    title: "T.M-4 — Teenage Engineering Concept in Spline",
    url: "https://contra.com/community/EuN2LzOQ-back-with-another-spline-project-from",
  },
  {
    title: "Best Spline Projects of 2024–2025",
    url: "https://contra.com/p/k3OMMAmq-best-spline-projects-of-2024-2025",
  },
  {
    title: "Crafting Realities: 3D Modeling & Rendering Showcase",
    url: "https://contra.com/p/F6BLmXlE-crafting-realities-a-3-d-modeling-and-rendering-showcase",
  },
  {
    title: "Interactive 3D Bottle Models for Athletic Power",
    url: "https://contra.com/p/BEU2orqq-interactive-3-d-bottle-models-for-athletic-power",
  },
  {
    title: "AEOS Labs: Where Spline meets Framer",
    url: "https://contra.com/p/MvLXOYr7-aeos-labs-where-spline-meets-framer",
  },
  {
    title: "Interactive Boxes for a Website Hero Section",
    url: "https://contra.com/p/oXZqkP6o-interactive-boxes-for-website-hero-section",
  },
  {
    title: "AI Concept Page Hero Section",
    url: "https://contra.com/p/rBYeR2Xb-ai-concept-page-hero-section-with-spline3-d",
  },
  {
    title: "Interactive Hero Section for Zamn Studios",
    url: "https://contra.com/p/ogooAZkM-interactive-hero-section-for-zamn-studios-with-spline3-d",
  },
];

export function getProjectById(id) {
  return projects.find((p) => p.id === Number(id));
}

// --- Thumbnail loading -------------------------------------------------

const AVIF_PROBE =
  "data:image/avif;base64,AAAAIGZ0eXBhdmlmAAAAAGF2aWZtaWYxbWlhZk1BMUIAAADybWV0YQAAAAAAAAAoaGRscgAAAAAAAAAAcGljdAAAAAAAAAAAAAAAAGxpYmF2aWYAAAAADnBpdG0AAAAAAAEAAAAeaWxvYwAAAABEAAABAAEAAAABAAABGgAAAB0AAAAoaWluZgAAAAAAAQAAABppbmZlAgAAAAABAABhdjAxQ29sb3IAAAAAamlwcnAAAABLaXBjbwAAABRpc3BlAAAAAAAAAAIAAAACAAAAEHBpeGkAAAAAAwgICAAAAAxhdjFDgQ0MAAAAABNjb2xybmNseAACAAIAAYAAAAAXaXBtYQAAAAAAAAABAAEEAQKDBAAAACVtZGF0EgAKCBgANogQEAwgMg8f8D///8WfhwB8+ErK42A=";

let avifSupported = null;
const avifCheck = new Promise((resolve) => {
  const img = new Image();
  img.onload = () => resolve((avifSupported = img.width > 0));
  img.onerror = () => resolve((avifSupported = false));
  img.src = AVIF_PROBE;
});

// Only meaningful once an item has loaded (loading waits for the AVIF check).
export function thumbSrc(project) {
  return avifSupported ? project.thumbAvif : project.thumbWebp;
}

const loadedIds = new Set();
const pending = new Map();
const listeners = new Set();

export function getLoadedIds() {
  return new Set(loadedIds);
}

export function onThumbLoaded(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

function loadThumb(project) {
  if (!pending.has(project.id)) {
    const p = avifCheck.then(
      () =>
        new Promise((resolve) => {
          const img = new Image();
          img.decoding = "async";
          // Resolve on load, not decode: browsers can defer decode (e.g. in
          // background tabs), which would stall the queue behind it.
          img.onload = () => {
            img.decode().catch(() => {});
            resolve();
          };
          img.onerror = resolve;
          img.src = thumbSrc(project);
        })
    );
    pending.set(
      project.id,
      p.then(() => {
        loadedIds.add(project.id);
        listeners.forEach((fn) => fn(project.id));
      })
    );
  }
  return pending.get(project.id);
}

export function preloadThumb(project) {
  return loadThumb(project);
}

export function preloadThumbIds(ids) {
  return Promise.all(ids.map(getProjectById).filter(Boolean).map(loadThumb));
}

// Loads the given ids first (in parallel), then everything else.
export function preloadThumbs(priorityIds = []) {
  const rest = projects.filter((p) => !priorityIds.includes(p.id));
  return preloadThumbIds(priorityIds).then(() =>
    Promise.all(rest.map(loadThumb))
  );
}

// --- Hero images ---------------------------------------------------------

export function heroSrc(project) {
  return avifSupported === false ? project.heroWebp : project.heroAvif;
}

const heroRequested = new Set();

// Warm the hi-res hero (e.g. on hover) so a switch shows it immediately.
export function preloadHero(project) {
  if (!project || heroRequested.has(project.id)) return;
  heroRequested.add(project.id);
  avifCheck.then(() => {
    const img = new Image();
    img.decoding = "async";
    img.src = heroSrc(project);
  });
}

// Resolves once the project's thumb is decoded, so a transition can capture
// it painted rather than blank.
export function decodeThumb(project) {
  return avifCheck.then(() => {
    const img = new Image();
    img.src = thumbSrc(project);
    return img.decode().catch(() => {});
  });
}
