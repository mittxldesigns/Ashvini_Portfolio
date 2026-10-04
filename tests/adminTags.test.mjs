import assert from "node:assert/strict";
import test from "node:test";
import fs from "node:fs/promises";
import { createRequire } from "node:module";
import { pathToFileURL } from "node:url";
import { parseTags } from "../src/lib/adminTags.js";

test("parseTags trims comma lists, preserves spaces, and omits empty tags", () => {
  assert.deepEqual(parseTags("  3D art, , Blender ,  ,Video editing  "), ["3D art", "Blender", "Video editing"]);
});
test("parseTags dedupes case-insensitively against existing tags without mutation", () => {
  const existing = ["Photoshop", "Blender"];
  assert.deepEqual(parseTags(" photoshop , AFTER EFFECTS, blender,after effects", existing), ["Photoshop", "Blender", "AFTER EFFECTS"]);
  assert.deepEqual(existing, ["Photoshop", "Blender"]);
});
test("parseTags tolerates absent/non-string values and cleans string arrays", () => {
  assert.deepEqual(parseTags(undefined), []);
  assert.deepEqual(parseTags([" Design ", null, 42, "design", "Motion, 3D"]), ["Design", "Motion", "3D"]);
});

test("controlled React input supports keys, paste, removal, and blur-before-Save", async (t) => {
  const require = createRequire(import.meta.url);
  let jsdomPath;
  try { jsdomPath = require.resolve("jsdom"); } catch {
    if (process.env.JSDOM_MODULE_PATH) jsdomPath = require.resolve(process.env.JSDOM_MODULE_PATH);
    else { t.skip("jsdom unavailable; set JSDOM_MODULE_PATH to run the DOM test"); return; }
  }
  const { JSDOM } = await import(pathToFileURL(jsdomPath).href);
  const dom = new JSDOM('<!doctype html><div id="root"></div>', { pretendToBeVisual: true });
  const originals = new Map();
  for (const [key, value] of Object.entries({ window: dom.window, document: dom.window.document, navigator: dom.window.navigator, HTMLElement: dom.window.HTMLElement, IS_REACT_ACT_ENVIRONMENT: true })) {
    originals.set(key, Object.getOwnPropertyDescriptor(globalThis, key));
    Object.defineProperty(globalThis, key, { value, configurable: true, writable: true });
  }
  let root;
  try {
    const { transform } = await import("esbuild");
    const source = await fs.readFile(new URL("../src/componenets/AdminTags.jsx", import.meta.url), "utf8");
    const compiled = await transform(source, { loader: "jsx", jsx: "automatic", format: "esm" });
    const imports = { react: pathToFileURL(require.resolve("react")).href, "react-dom": pathToFileURL(require.resolve("react-dom")).href, "react/jsx-runtime": pathToFileURL(require.resolve("react/jsx-runtime")).href, "../lib/adminTags.js": new URL("../src/lib/adminTags.js", import.meta.url).href };
    const code = compiled.code.replace(/from "([^"]+)"/g, (all, name) => imports[name] ? `from "${imports[name]}"` : all);
    const { default: AdminTags } = await import("data:text/javascript;base64," + Buffer.from(code).toString("base64"));
    const React = await import("react"), { createRoot } = await import("react-dom/client");
    let tags, submits = 0; const saves = [];
    function Harness({ disabled = false }) {
      const [value, setValue] = React.useState(["Photoshop"]); tags = value;
      return React.createElement("form", { onSubmit: (event) => { event.preventDefault(); submits++; } },
        React.createElement(AdminTags, { label: "Skills", value, onChange: setValue, disabled }),
        React.createElement("button", { id: "save", type: "button", onClick: () => saves.push([...value]) }, "Save"));
    }
    root = createRoot(document.getElementById("root"));
    await React.act(() => root.render(React.createElement(Harness)));
    const input = () => document.querySelector(".cms-tag-entry");
    const setValue = Object.getOwnPropertyDescriptor(dom.window.HTMLInputElement.prototype, "value").set;
    const type = (text) => React.act(() => { setValue.call(input(), text); input().dispatchEvent(new dom.window.Event("input", { bubbles: true })); });
    const key = async (name, extra = {}) => {
      const event = new dom.window.KeyboardEvent("keydown", { key: name, bubbles: true, cancelable: true, ...extra });
      await React.act(() => input().dispatchEvent(event)); return event;
    };
    await type(" Blender "); assert.equal((await key("Enter")).defaultPrevented, true);
    assert.deepEqual(tags, ["Photoshop", "Blender"]); assert.equal(input().value, "");
    await type("photoshop"); await key(","); assert.deepEqual(tags, ["Photoshop", "Blender"]);
    await type("   "); await key("Enter"); assert.deepEqual(tags, ["Photoshop", "Blender"]);
    await type("PhotoSHop, Illustrator, , 3D art"); assert.deepEqual(tags, ["Photoshop", "Blender", "Illustrator", "3D art"]);
    const paste = new dom.window.Event("paste", { bubbles: true, cancelable: true });
    Object.defineProperty(paste, "clipboardData", { value: { getData: () => "Motion, blender, After Effects, " } });
    await React.act(() => input().dispatchEvent(paste)); assert.equal(paste.defaultPrevented, true);
    assert.deepEqual(tags, ["Photoshop", "Blender", "Illustrator", "3D art", "Motion", "After Effects"]);
    await type("Part"); await key("Backspace"); assert.equal(tags.at(-1), "After Effects");
    await type(""); assert.equal((await key("Backspace")).defaultPrevented, true); assert.equal(tags.at(-1), "Motion");
    await React.act(() => document.querySelector('[aria-label="Remove Illustrator"]').click()); assert(!tags.includes("Illustrator"));
    await type("Cinema 4D");
    await React.act(() => { input().dispatchEvent(new dom.window.FocusEvent("focusout", { bubbles: true })); document.getElementById("save").click(); });
    assert.equal(saves.at(-1).at(-1), "Cinema 4D"); assert.equal(input().value, ""); assert.equal(submits, 0);
    await type("Pending"); await key("Enter", { isComposing: true }); assert(!tags.includes("Pending"));
    await key("Enter"); assert.equal(tags.at(-1), "Pending");
    await React.act(() => root.render(React.createElement(Harness, { disabled: true })));
    const before = [...tags]; assert.equal(input().disabled, true);
    await type("Blocked"); await key("Enter");
    await React.act(() => document.querySelector(".cms-tag-remove").click()); assert.deepEqual(tags, before);
  } finally {
    if (root) { const { act } = await import("react"); await act(() => root.unmount()); }
    dom.window.close();
    for (const [key, descriptor] of originals) { if (descriptor) Object.defineProperty(globalThis, key, descriptor); else delete globalThis[key]; }
  }
});
