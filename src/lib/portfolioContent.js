import { projects } from "../data/projects.js";
import { editorialPosts, EDITORIAL_CATEGORIES } from "../data/editorial.js";
import { sketches, SKETCH_CHAPTERS } from "../data/sketches.js";
import { pieces } from "../data/projectContent.js";
import { posts } from "../data/editorialContent.js";
import { sketches as sketchContent } from "../data/sketchesContent.js";
import { getSiteProfile, applySiteProfile } from "../data/siteProfile.js";

function replaceRecords(target, incoming) {
  const bundled = new Map(target.map((item) => [item.slug, item]));
  const items = incoming.map((item, index) => {
    const record = { ...(target === projects || target === pieces ? { roles: [], tools: [], extraLinks: [], description: null, outcome: null, contraUrl: getSiteProfile().contraUrl } : {}), ...bundled.get(item.slug), ...item, id: item.id || index + 1, order: item.order ?? index };
    if (target === sketches || target === sketchContent) {
      if (Object.hasOwn(item, "dateISO")) record.date = record.dateISO = item.dateISO;
      else if (Object.hasOwn(item, "date")) record.date = record.dateISO = item.date;
    }
    if (record.frames) record.frames = record.frames.map((frame) => ({ ...frame, full: frame.asset || frame.full, ...(frame.mediaType === "video" ? { video: frame.asset || frame.video || frame.full } : {}) })).sort((a, b) => (a.position || 0) - (b.position || 0));
    if (record.frames?.length) {
      const cover = record.frames[0];
      record.full = cover.full || record.full;
      record.thumbWebp = cover.thumbWebp || record.thumbWebp;
      record.thumbAvif = cover.thumbAvif || null;
      record.width = cover.width || record.width;
      record.height = cover.height || record.height;
      if (target === projects || target === pieces) {
        record.heroWebp = cover.mediaType === "video" ? cover.thumbWebp : cover.full;
        record.heroAvif = null;
      }
    }
    return record;
  }).sort((a, b) => a.order - b.order);
  target.splice(0, target.length, ...items);
}

export function applyPortfolioContent(content) {
  if (content?.schemaVersion !== 1 || !["projects", "editorial", "sketches"].every((key) => Array.isArray(content[key]))) return false;
  if (![...content.projects, ...content.editorial, ...content.sketches].every((item) => item && typeof item.slug === "string")) return false;
  applySiteProfile(content.profile);
  replaceRecords(projects, content.projects);
  replaceRecords(pieces, content.projects);
  replaceRecords(editorialPosts, content.editorial);
  replaceRecords(posts, content.editorial);
  replaceRecords(sketches, content.sketches);
  replaceRecords(sketchContent, content.sketches);
  if (Array.isArray(content.profile?.editorialCategories)) EDITORIAL_CATEGORIES.splice(0, EDITORIAL_CATEGORIES.length, ...content.profile.editorialCategories);
  if (Array.isArray(content.profile?.sketchChapters)) SKETCH_CHAPTERS.splice(0, SKETCH_CHAPTERS.length, ...content.profile.sketchChapters);
  return true;
}

export function bundledPortfolioContent() {
  const content = JSON.parse(JSON.stringify({ schemaVersion: 1, revision: 0, profile: getSiteProfile(), projects, editorial: editorialPosts, sketches }));
  for (const group of [content.projects, content.editorial, content.sketches]) {
    for (const item of group) {
      item.nsfw = item.nsfw === true || item.frames?.some((frame) => frame.nsfw === true) || false;
      delete item.suppliedOrder;
      if (item.sourceDateLabel) { item.dateLabel = item.sourceDateLabel; delete item.sourceDateLabel; }
      for (const frame of item.frames || []) {
        frame.asset = frame.full;
        delete frame.file;
        delete frame.videoFile;
      }
    }
  }
  return content;
}

export function readPublishedContent() {
  const element = document.getElementById("portfolio-content");
  if (!element) return null;
  try { return JSON.parse(element.textContent); } catch { return null; }
}
