const avifThumbs = import.meta.glob("../assets/work/*-thumb.avif", {
  eager: true,
  import: "default",
});
const webpImages = import.meta.glob("../assets/work/*.webp", {
  eager: true,
  import: "default",
});

const asset = (map, name) => map[`../assets/work/${name}`];

const CONTRA_PROFILE = "https://contra.com/ashvini_kmr?r=mittxldesigns";

// Grid pieces. Only renders verified against their Contra case-study cover
// carry case-study metadata; the rest are standalone renders.
const pieces = [
  {
    slug: "nothing-headphones",
    title: "Spline3D Meets Nothing Headphones 1",
    description:
      "Modeled Nothing Headphones 1 entirely in Spline3D with native tools — complex hard-surface forms, clean geometry, and a web-ready model under 1MB.",
    roles: ["3D Modeler", "Product Designer", "Spline Designer"],
    tools: ["Spline"],
    outcome: "3D Model",
    externalLink:
      "https://my.spline.design/nothingheadphonescopycopycopy-qkUBtxMtp3bkVcodGcTFLSpA/",
    contraUrl:
      "https://contra.com/p/csecLZQL-spline3-d-meets-nothing-headphones-1",
  },
  {
    slug: "teenage-engineering-tp7",
    title: "When Spline meets Teenage Engineering",
    description:
      "Recreated the Teenage Engineering TP-7 in Spline3D using primitives and booleans, as a fully interactive, web-ready 3D model.",
    roles: ["Spline Designer"],
    tools: ["Spline"],
    outcome: "3D Model",
    externalLink: "https://my.spline.design/tp7copy-0schcvltKXayJ29fZiVLZ29Y/",
    contraUrl:
      "https://contra.com/p/UcWcPUBA-when-spline-meets-teenage-engineering",
  },
  {
    slug: "mebrafino",
    title: "Scroll-Interactive 3D Experience for Mebrafino",
    description:
      "A scroll-interactive 3D experience for Mebrafino's brand identity, blending motion, depth, and smooth performance for an immersive web presence.",
    roles: ["3D Designer"],
    tools: ["Spline", "Webflow"],
    outcome: "3D Visualization",
    externalLink:
      "https://my.spline.design/mebrafinostagingmobilefinaldraftcopycopy-8wkhTuCAEmrT1Q3hE4wp1aYU/",
    contraUrl:
      "https://contra.com/p/cecBRmPL-scroll-interactive-3-d-visual-experience-for-mebrafino",
  },
  { slug: "head-animation", title: "Head Animation" },
  {
    slug: "cmf-headphones-pro",
    title: "CMF Headphones Pro by Nothing",
    description:
      "Modeled, textured, and optimized natively in Spline3D — kept minimal, efficient, and performance-friendly from the ground up.",
    roles: ["3D Modeler", "Spline Designer"],
    tools: ["Spline"],
    outcome: "3D Model",
    externalLink:
      "https://my.spline.design/cmfheadphonesprowhiteversion-RMtAV5bZDZguG4QJJqAfB8IG/",
    contraUrl:
      "https://contra.com/community/6YUMLm37-from-modeling-to-texturing-and-optimization",
  },
  { slug: "helix-animation", title: "Helix Animation" },
  {
    slug: "worklouder-keypad",
    title: "Enhancing Worklouder's Keyboard Concept",
    description:
      "Reimagined Worklouder's keypad concept in Spline3D, with subtle design improvements aimed at designers.",
    roles: ["3D Designer", "3D Modeler", "Spline Designer"],
    tools: ["Framer", "Spline"],
    outcome: "3D Model",
    contraUrl:
      "https://contra.com/p/XlvoQMAE-enhancing-worklouders-keyboard-concept-with-spline3-d",
  },
  { slug: "patek-philippe", title: "Patek Philippe" },
  {
    slug: "heygen-glass",
    title: "Web Background Assets for HeyGen",
    description:
      "Dynamic Spline3D backgrounds for HeyGen built from glass, gradients, refractions, and 3D elements.",
    roles: ["Spline Designer"],
    tools: ["Spline"],
    outcome: "3D Animation",
    externalLink: "https://www.heygen.com",
    contraUrl:
      "https://contra.com/p/UFsARA6m-web-background-assets-for-hey-gen-using-spline3-d",
  },
  { slug: "labyrinth-orb", title: "Labyrinth Orb" },
  { slug: "eneftro-card", title: "Eneftro Membership Card" },
  { slug: "dna-helix", title: "DNA Helix" },
  { slug: "petal-spiral", title: "Petal Spiral" },
  { slug: "split-prism", title: "Split Prism" },
  { slug: "chrome-ak47", title: "Chrome AK-47" },
];

export const projects = pieces.map((p, i) => ({
  id: i + 1,
  description: "A 3D render from Ashwani's portfolio.",
  roles: [],
  tools: [],
  outcome: null,
  externalLink: null,
  contraUrl: CONTRA_PROFILE,
  ...p,
  thumbAvif: asset(avifThumbs, `${p.slug}-thumb.avif`),
  thumbWebp: asset(webpImages, `${p.slug}-thumb.webp`),
  image: asset(webpImages, `${p.slug}.webp`),
}));

// Contra case studies without a matching render in the grid.
export const caseStudies = [
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
          img.src = thumbSrc(project);
          img.decode().then(resolve, resolve);
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

// Loads the given ids first (in parallel), then everything else.
export function preloadThumbs(priorityIds = []) {
  const first = priorityIds.map(getProjectById).filter(Boolean);
  const rest = projects.filter((p) => !priorityIds.includes(p.id));
  return Promise.all(first.map(loadThumb)).then(() =>
    Promise.all(rest.map(loadThumb))
  );
}
