import assert from "node:assert/strict";
import test from "node:test";
import { getSeoForPath, getStructuredData, absoluteSeoUrl, SITE_URL } from "../src/data/seo.js";
import { posts } from "../src/data/editorialContent.js";
import { sketches } from "../src/data/sketchesContent.js";
import { pieces } from "../src/data/projectContent.js";
import { getSiteProfile, applySiteProfile } from "../src/data/siteProfile.js";

const collection = (path, content) => getStructuredData(getSeoForPath(path, content))["@graph"][1].mainEntity.itemListElement;
const sensitive = (item) => item.nsfw || item.frames?.some((frame) => frame.nsfw);

test("editorial schema retains all 89 works with verified publishers and publication dates", () => {
  const items = collection("/editorial").map((entry) => entry.item);
  assert.equal(items.length, 89);
  assert.equal(items.filter((item) => item.publisher.name === "Animated Times").length, 43);
  assert.equal(items.filter((item) => item.publisher.name === "FandomWire").length, 46);
  assert.equal(items.filter((item) => "datePublished" in item).length, 51);
  assert.ok(items.every((item) => !("dateCreated" in item)));
  for (const post of posts) {
    const item = items.find((entry) => entry["@id"] === `${SITE_URL}/editorial#${post.slug}`);
    assert.equal(item.publisher.name, post.client);
    if (post.date) assert.equal(item.datePublished, post.date);
    else assert.ok(!("datePublished" in item));
  }
});

test("sketchbook schema retains all 43 works and treats imported dates as publication", () => {
  const items = collection("/sketches").map((entry) => entry.item);
  assert.equal(items.length, 43);
  assert.ok(items.every((item) => !("dateCreated" in item)));
  for (const sketch of sketches) {
    const item = items.find((entry) => entry["@id"] === `${SITE_URL}/sketches#${sketch.slug}`);
    assert.equal(item.datePublished, sketch.date ?? sketch.dateISO);
  }
  assert.ok(items.some((item) => item.name === "Bangles" && item.description.includes("@siimipie")));
});

test("sensitive collection entries link to their warning route without source or media URLs", () => {
  for (const [path, records] of [["/editorial", posts], ["/sketches", sketches]]) {
    const items = collection(path).map((entry) => entry.item);
    for (const record of records) {
      const item = items.find((entry) => entry["@id"] === `${SITE_URL}${path}#${record.slug}`);
      assert.equal(item.url, sensitive(record) ? SITE_URL + path : record.url);
      if (sensitive(record)) {
        assert.ok(!JSON.stringify(item).includes(record.url));
        assert.ok(!("image" in item));
        assert.ok(!("contentUrl" in item));
      }
    }
  }
});

test("owner-updated profile, page copy, search previews and FAQ feed the same metadata", (t) => {
  const original = structuredClone(getSiteProfile());
  t.after(() => applySiteProfile(original));
  applySiteProfile({
    name: "Updated Owner", homeDescription: "Owner introduction.", aboutBio: "Owner biography.",
    editorialIntro: "Owner editorial introduction.", sketchesIntro: "Owner sketchbook introduction.",
    faq: [{ q: "Owner question?", a: "Owner answer." }],
    seo: { home: { title: "Owner search title", description: "Owner search description" } },
  });
  assert.equal(getSeoForPath("/").title, "Owner search title");
  assert.equal(getSeoForPath("/").description, "Owner search description");
  assert.equal(getSeoForPath("/about").description, "Owner biography.");
  assert.equal(getSeoForPath("/editorial").description, "Owner editorial introduction.");
  assert.equal(getSeoForPath("/sketches").description, "Owner sketchbook introduction.");
  const graph = getStructuredData(getSeoForPath("/about"))["@graph"];
  assert.equal(graph[0].name, "Updated Owner");
  assert.ok(!("alternateName" in graph[0]));
  assert.equal(graph[2].mainEntity[0].acceptedAnswer.text, "Owner answer.");
});

test("published snapshots support new routes, absolute media and sensitive project noindex", () => {
  const content = {
    profile: { name: "Published Owner", homeDescription: "Published introduction.", faq: [], seo: {} },
    projects: [
      { id: 99, slug: "uploaded", title: "Uploaded work", description: "Published project.", full: "https://cdn.example.test/original.webp", nsfw: false },
      { id: 100, slug: "sensitive", title: "Sensitive work", full: "/media/private/original", nsfw: true },
      { id: 101, slug: "video", title: "Video work", full: "/media/clip/original", mediaType: "video", poster: "/media/clip/preview", nsfw: false },
    ],
    editorial: [], sketches: [], siteUrl: "https://cms.example.test",
  };
  const page = getSeoForPath("/portfolio/99", content);
  assert.equal(page.title, "Uploaded work — Published Owner");
  assert.equal(page.canonical, "https://cms.example.test/portfolio/99");
  assert.equal(page.image, "https://cdn.example.test/original.webp");
  assert.equal(getSeoForPath("/portfolio/101", content).image, "https://cms.example.test/media/clip/preview");
  const sensitivePage = getSeoForPath("/portfolio/100", content);
  assert.equal(sensitivePage.robots, "noindex,follow");
  assert.ok(!sensitivePage.image.includes("/media/private/"));
  assert.equal(getStructuredData(sensitivePage), null);
  assert.equal(collection("/editorial", content).length, 0);
  assert.equal(collection("/sketches", content).length, 0);
  assert.equal(getSeoForPath("/portfolio/999", content).robots, "noindex,nofollow");
  assert.equal(getStructuredData(getSeoForPath("/portfolio/999", content)), null);
});

test("an explicit cleared date and invalid calendar date never revive or invent publication", () => {
  const content = {
    profile: { name: "Owner" }, projects: [], sketches: [],
    editorial: [
      { title: "Cleared date", client: "Actual Publisher", date: null, dateISO: "2025-01-01" },
      { title: "Invalid date", client: "Actual Publisher", date: "2026-02-30" },
      { title: "Known date", client: "Actual Publisher", date: "2026-10-02" },
    ],
  };
  const items = collection("/editorial", content).map((entry) => entry.item);
  assert.ok(!("datePublished" in items[0]));
  assert.ok(!("datePublished" in items[1]));
  assert.equal(items[2].datePublished, "2026-10-02");
});

test("live plain project arrays update SEO without browser globals or captured copies", (t) => {
  const originalLength = pieces.length;
  t.after(() => pieces.splice(originalLength));
  pieces.push({ id: 999, slug: "dynamic", title: "Dynamic project", description: "Updated description." });
  assert.equal(getSeoForPath("/portfolio/999").description, "Updated description.");
  assert.ok(collection("/portfolio").some((entry) => entry.url.endsWith("/portfolio/999")));
  assert.equal(absoluteSeoUrl("javascript:alert(1)"), "");
  assert.equal(absoluteSeoUrl("https://private:secret@example.test/image.jpg"), "");
  assert.equal(absoluteSeoUrl("/media/a/preview", "https://cms.example.test"), "https://cms.example.test/media/a/preview");
});

test("owner editor metadata stays private and publishes no structured profile", () => {
  for (const path of ["/admin", "/admin/setup"]) {
    const page = getSeoForPath(path);
    assert.equal(page.kind, "admin");
    assert.equal(page.robots, "noindex,nofollow,noarchive");
    assert.match(page.title, /Portfolio editor/);
    assert.equal(getStructuredData(page), null);
  }
});
