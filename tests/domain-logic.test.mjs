import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import vm from "node:vm";
import test from "node:test";

const source = readFileSync(new URL("../js/store.jsx", import.meta.url), "utf8");
const context = {
  React: {
    useState() {},
    useEffect() {},
    useCallback() {},
    useRef() {},
    useMemo() {},
  },
  window: {
    DS: {
      TYPES: [
        { key: "font" },
        { key: "palette" },
        { key: "reference" },
        { key: "snippet" },
        { key: "system" },
        { key: "image" },
        { key: "kit" },
      ],
      TYPE_MAP: {
        font: { plural: "Fonts" },
        palette: { plural: "Palettes" },
      },
    },
  },
  navigator: {},
  document: {},
  Blob,
  URL,
  setTimeout,
};
vm.runInNewContext(source, context);

const D = context.window.DS;

test("search ignores accents and combines words", () => {
  const item = {
    title: "Söhne",
    description: "Editorial interface font",
    tags: ["neo-grotesque"],
  };

  assert.equal(D.matchesQuery(item, "sohne editorial"), true);
  assert.equal(D.matchesQuery(item, "serif"), false);
});

test("filters by type, tags, favorite state, and stable title order", () => {
  const items = [
    { id: "2", type: "font", title: "Zed", tags: ["ui"], favorite: true, createdAt: "2026-01-02" },
    { id: "1", type: "font", title: "Alpha", tags: ["ui"], favorite: true, createdAt: "2026-01-01" },
    { id: "3", type: "palette", title: "Calm", tags: ["ui"], favorite: true, createdAt: "2026-01-03" },
  ];

  const result = D.filterItems(items, {
    types: ["font"],
    tags: ["ui"],
    favorite: true,
    sort: "title",
  });

  assert.deepEqual(Array.from(result, (item) => item.id), ["1", "2"]);
});

test("validates required fields, palette colors, snippets, and URLs", () => {
  assert.deepEqual(
    Object.keys(D.validateItem({
      type: "palette",
      title: "",
      colors: [{ name: "Broken", hex: "red" }],
      sourceUrl: "figma.com/file",
    })).sort(),
    ["colors", "sourceUrl", "title"],
  );
  assert.equal(D.validateItem({ type: "snippet", title: "Empty", text: "" }).text, "Snippet text can't be empty.");
});

test("palette exports generate unique safe keys for empty and duplicate names", () => {
  const palette = {
    title: "Crème Brûlée",
    colors: [
      { name: "", hex: "#111111" },
      { name: "Primary", hex: "#222222" },
      { name: "Primary", hex: "#333333" },
    ],
  };

  const css = D.paletteToCSS(palette);
  const tokens = JSON.parse(D.paletteToTokens(palette));

  assert.match(css, /--color-color-1: #111111;/);
  assert.match(css, /--color-primary: #222222;/);
  assert.match(css, /--color-primary-2: #333333;/);
  assert.deepEqual(Object.keys(tokens["creme-brulee"].color), ["color-1", "primary", "primary-2"]);
});

test("exports project kits and complete JSON backups", () => {
  const kit = { title: "Launch kit", itemIds: ["font-1"], direction: "Calm and direct." };
  const items = [{ id: "font-1", type: "font", title: "Inter", category: "sans-serif", license: "OFL" }];

  assert.match(D.kitToMarkdown(kit, items), /## Library assets \(1\)/);

  const backup = JSON.parse(D.exportAllJSON(items));
  assert.equal(backup.app, "DesignShelf");
  assert.equal(backup.version, 1);
  assert.equal(backup.items.length, 1);
});
