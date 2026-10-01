import { publishers, timeline, COMBINED_FOLLOWERS, AUDIENCE_CHECKED } from "./experience.js";
import { caseStudies } from "./caseStudyContent.js";
import { faq } from "./faq.js";
import { EDITORIAL_CATEGORIES } from "./editorialContent.js";
import { SKETCH_CHAPTERS, SKETCH_TIMELINE } from "./sketchesContent.js";

const profile = {
  name: "Ashvini Kumar",
  avatarUrl: "/avatar.webp",
  location: "India",
  rating: "4.86★",
  tagline: "3D artist · social & editorial designer",
  homeDescription: "I make interactive 3D scenes and product visuals for the web, from modeling through motion.",
  homeCred: "Senior Designer at Animated Times · Designer at FandomWire · Top 1% Spline expert on Contra",
  aboutTitle: "Top 1% Spline Expert on Contra",
  aboutBio: "I build product models and interactive 3D scenes for the web. Selected projects include backgrounds for HeyGen, bottle models for Athletic Power, and a scroll-driven visual experience for Mebrafino.",
  skills: ["Spline", "Blender", "Autodesk 3ds Max", "V-Ray", "ZBrush", "Framer", "Webflow"],
  experience: timeline,
  faq,
  publishers,
  editorialCategories: EDITORIAL_CATEGORIES,
  sketchChapters: SKETCH_CHAPTERS,
  sketchTimeline: SKETCH_TIMELINE,
  caseStudies,
  editorialTitle: "Built to stop\nthe scroll.",
  editorialIntro: "Before I got into 3D, I was a newsroom designer, and I still am. For six years I've made the covers, thumbnails and posts that FandomWire and Animated Times put out every day: Marvel, DC and everything in between, often on tight deadlines.",
  editorialYearsLabel: "6 yrs",
  editorialPubsTitle: "Six years in two newsrooms.",
  editorialPubsNote: "Animated Times and FandomWire, since 2020. A few of the posts below, with their original links.",
  editorialClosingNote: "I work remotely, can start right away, and I'm used to newsroom deadlines and teams in the US.",
  sketchesKicker: "the stuff I draw for myself (and sometimes for money)",
  sketchesIntro: "Started with a Deadpool sketch in 2017 and never really stopped. Graphite first, then ink covers people actually paid for, and these days mostly Photoshop, one movie still at a time.",
  sketchesClosingNote: "posters, covers, portraits, your favourite character. dm is open.",
  audienceLabel: COMBINED_FOLLOWERS,
  audienceChecked: AUDIENCE_CHECKED,
  contraUrl: "https://contra.com/ashvini_kmr?r=mittxldesigns",
  instagramUrl: "https://instagram.com/ashvini_kmr",
  linkedinUrl: "https://www.linkedin.com/in/ashwani-kumar-b899b5188",
  splineUrl: "https://community.spline.design/bettercallashvini",
  seo: {},
};

export function getSiteProfile() { return profile; }

export function applySiteProfile(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return;
  for (const key of Object.keys(profile)) {
    if (Object.hasOwn(value, key)) profile[key] = value[key];
  }
}
