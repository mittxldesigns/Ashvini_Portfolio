const COPY = new Set(['tagline', 'homeDescription', 'homeCred', 'aboutTitle', 'aboutBio', 'editorialTitle', 'editorialIntro', 'editorialYearsLabel', 'editorialPubsTitle', 'editorialPubsNote', 'editorialClosingNote', 'sketchesKicker', 'sketchesIntro', 'sketchesClosingNote']);
const LIST_COPY = { experience: ['note'], faq: ['q', 'a'], publishers: ['about', 'work'], caseStudies: ['title'], editorialCategories: ['label', 'blurb'], sketchChapters: ['label', 'hand', 'blurb'], sketchTimeline: ['note'] };
const PAGE_NAMES = ['home', 'about', 'editorial', 'sketches'];
function allowed(content, path) {
  if (!Array.isArray(path) || path.some((key) => ['__proto__', 'constructor', 'prototype'].includes(key))) return false;
  const index = (list, value) => Array.isArray(list) && Number.isSafeInteger(value) && value >= 0 && value < list.length;
  if (path[0] === 'profile') {
    if (path.length === 2) return COPY.has(path[1]);
    if (path.length !== 4) return false;
    if (path[1] === 'seo') return PAGE_NAMES.includes(path[2]) && ['title', 'description'].includes(path[3]);
    return LIST_COPY[path[1]]?.includes(path[3]) && index(content.profile?.[path[1]], path[2]);
  }
  return path.length === 3 && ['projects', 'editorial', 'sketches'].includes(path[0]) && index(content[path[0]], path[1]) && ['title', 'description', 'note'].includes(path[2]);
}
// Suggestions are proposals. Never apply one over a field edited since review.
export function applyRefinements(content, suggestions) {
  const next = structuredClone(content);
  let applied = 0, skipped = 0;
  for (const suggestion of suggestions) {
    const path = suggestion?.path;
    if (!allowed(next, path) || typeof suggestion.after !== 'string' || !suggestion.after.trim()) { skipped++; continue; }
    let current = next;
    for (const key of path.slice(0, -1)) current = current?.[key];
    const previous = current?.[path.at(-1)];
    const seo = path[0] === 'profile' && path[1] === 'seo';
    if ((!seo && (typeof previous !== 'string' || !previous.trim())) || (previous ?? '') !== suggestion.before) { skipped++; continue; }
    // Only search-preview containers may be created; all other parents must exist.
    if (seo) { next.profile.seo ??= {}; next.profile.seo[path[2]] ??= {}; current = next.profile.seo[path[2]]; }
    current[path.at(-1)] = suggestion.after; applied++;
  }
  return { content: next, applied, skipped };
}
