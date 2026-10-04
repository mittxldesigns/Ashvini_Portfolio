import { test } from 'node:test';
import assert from 'node:assert/strict';
import { applyRefinements } from '../src/lib/adminRefinement.js';
const seed = () => ({ profile: { aboutBio: 'I draw.', faq: [{ q: 'Tools?', a: 'Blender.' }] }, projects: [{ title: 'Render', full: '/original', note: '' }] });
test('review applies allowed copy and optional SEO without mutating the draft', () => {
  const original = seed();
  const result = applyRefinements(original, [{ path: ['profile', 'aboutBio'], before: 'I draw.', after: 'I make drawings.' }, { path: ['profile', 'seo', 'home', 'title'], before: '', after: 'Drawings' }]);
  assert.equal(result.applied, 2); assert.equal(original.profile.aboutBio, 'I draw.'); assert.equal(result.content.profile.seo.home.title, 'Drawings');
});
test('stale, immutable, empty and prototype paths cannot alter the draft', () => {
  const original = seed();
  const attempts = [
    { path: ['projects', 0, 'title'], before: 'Old', after: 'Changed' },
    { path: ['projects', 0, 'full'], before: '/original', after: '/wrong' },
    { path: ['projects', 0, 'note'], before: '', after: 'Invented' },
    { path: ['profile', '__proto__', 'polluted'], before: '', after: 'yes' },
    { path: ['profile', 'faq', 999, 'q'], before: '', after: 'Invented' },
  ];
  const result = applyRefinements(original, attempts);
  assert.equal(result.skipped, attempts.length); assert.deepEqual(result.content, original); assert.equal({}.polluted, undefined);
});
