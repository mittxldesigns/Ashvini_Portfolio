const thumbs = import.meta.glob("../assets/work/*-thumb.webp", {
  eager: true,
  import: "default",
});
const fulls = import.meta.glob("../assets/work/*.webp", {
  eager: true,
  import: "default",
});

const thumb = (slug) => thumbs[`../assets/work/${slug}-thumb.webp`];
const full = (slug) => fulls[`../assets/work/${slug}.webp`];

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
  thumb: thumb(p.slug),
  image: full(p.slug),
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

let thumbsReady = false;
let thumbsPromise = null;

export function areThumbsReady() {
  return thumbsReady;
}

// Fetch + decode every grid thumb once so the grid can reveal all at once.
export function preloadThumbs() {
  if (!thumbsPromise) {
    const decodeAll = Promise.all(
      projects.map(
        (p) =>
          new Promise((resolve) => {
            const img = new Image();
            img.decoding = "async";
            img.src = p.thumb;
            img.decode().then(resolve, resolve);
          })
      )
    );
    const timeout = new Promise((resolve) => setTimeout(resolve, 5000));
    thumbsPromise = Promise.race([decodeAll, timeout]).then(() => {
      thumbsReady = true;
    });
  }
  return thumbsPromise;
}
