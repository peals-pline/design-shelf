/* =========================================================================
   DesignShelf — store (localStorage), search/filter/sort, exports
   ========================================================================= */
const { useState, useEffect, useCallback, useRef, useMemo } = React;

const LS_KEY = "designshelf.items.v1";
const LS_PREFS = "designshelf.prefs.v1";

function loadItems() {
  try {
    const raw = localStorage.getItem(LS_KEY);
    if (raw) return JSON.parse(raw);
  } catch (e) { /* ignore */ }
  const seed = window.DS.buildSeed();
  try { localStorage.setItem(LS_KEY, JSON.stringify(seed)); } catch (e) {}
  return seed;
}

function loadPrefs() {
  try { return JSON.parse(localStorage.getItem(LS_PREFS)) || {}; } catch (e) { return {}; }
}

// ---- Validation (lightweight Zod-style) ------------------------------------
function validateItem(draft) {
  const errors = {};
  if (!draft.title || !draft.title.trim()) errors.title = "A title is required.";
  if (draft.type === "palette") {
    if (!draft.colors || draft.colors.length === 0) errors.colors = "Add at least one color.";
    (draft.colors || []).forEach((c) => {
      if (!/^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(c.hex || "")) errors.colors = "Every color needs a valid HEX value.";
    });
  }
  if (draft.type === "snippet" && (!draft.text || !draft.text.trim())) errors.text = "Snippet text can't be empty.";
  if (draft.sourceUrl && !/^https?:\/\//i.test(draft.sourceUrl)) errors.sourceUrl = "URL should start with http:// or https://";
  return errors;
}

// ---- Main store hook --------------------------------------------------------
function useStore() {
  const [items, setItems] = useState(loadItems);

  useEffect(() => {
    try { localStorage.setItem(LS_KEY, JSON.stringify(items)); } catch (e) {}
  }, [items]);

  const addItem = useCallback((draft) => {
    const now = new Date().toISOString();
    const item = { id: window.DS.uid(), favorite: false, tags: [], createdAt: now, updatedAt: now, ...draft };
    setItems((prev) => [item, ...prev]);
    return item;
  }, []);

  const updateItem = useCallback((id, patch) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, ...patch, updatedAt: new Date().toISOString() } : it)));
  }, []);

  const removeItem = useCallback((id) => {
    setItems((prev) => prev
      .filter((it) => it.id !== id)
      // also drop the id from any kit that referenced it
      .map((it) => it.type === "kit" && it.itemIds ? { ...it, itemIds: it.itemIds.filter((x) => x !== id) } : it));
  }, []);

  const toggleFav = useCallback((id) => {
    setItems((prev) => prev.map((it) => (it.id === id ? { ...it, favorite: !it.favorite, updatedAt: new Date().toISOString() } : it)));
  }, []);

  const importJSON = useCallback((json, mode = "merge") => {
    const preview = json?.valid ? json : window.DS.analyzeImportJSON(json, items);
    const imported = mode === "replace" ? preview.valid.length + preview.duplicates.length : preview.valid.length;
    setItems((prev) => window.DS.mergeImportedItems(prev, preview, mode));
    return imported;
  }, [items]);

  const resetSeed = useCallback(() => setItems(window.DS.buildSeed()), []);
  const clearAll = useCallback(() => setItems([]), []);

  return { items, setItems, addItem, updateItem, removeItem, toggleFav, importJSON, resetSeed, clearAll };
}

// ---- Search / filter / sort -------------------------------------------------
function matchesQuery(item, q) {
  const query = normalizeText(q).trim();
  if (!query) return true;
  const hay = [
    item.title, item.description, item.notes, item.context, item.text, item.direction,
    item.audience, item.client, item.sourceUrl, item.whyItWorks, item.category, item.platform,
    (item.tags || []).join(" "),
    (item.colors || []).map((c) => `${c.name} ${c.hex}`).join(" "),
    (item.componentCategories || []).join(" "),
  ].filter(Boolean).map(normalizeText).join(" ");
  return query.split(/\s+/).every((tok) => hay.includes(tok));
}

function filterItems(items, opts) {
  const { query = "", types = [], tags = [], favorite = false, since = "all", sort = "newest" } = opts;
  const cut = since === "all" ? 0 : Date.now() - { "7d": 7, "30d": 30, "90d": 90 }[since] * 86400000;
  let out = items.filter((it) => {
    if (types.length && !types.includes(it.type)) return false;
    if (favorite && !it.favorite) return false;
    if (tags.length && !tags.every((t) => (it.tags || []).includes(t))) return false;
    if (cut && new Date(it.createdAt).getTime() < cut) return false;
    if (!matchesQuery(it, query)) return false;
    return true;
  });
  const dir = {
    newest: (a, b) => new Date(b.createdAt) - new Date(a.createdAt),
    oldest: (a, b) => new Date(a.createdAt) - new Date(b.createdAt),
    title: (a, b) => a.title.localeCompare(b.title),
    type: (a, b) => a.type.localeCompare(b.type) || a.title.localeCompare(b.title),
  }[sort];
  return out.sort(dir || ((a, b) => new Date(b.createdAt) - new Date(a.createdAt)));
}

function allTags(items) {
  const counts = {};
  items.forEach((it) => (it.tags || []).forEach((t) => { counts[t] = (counts[t] || 0) + 1; }));
  return Object.entries(counts).sort((a, b) => b[1] - a[1]);
}

function countsByType(items) {
  const c = {};
  window.DS.TYPES.forEach((t) => (c[t.key] = 0));
  items.forEach((it) => { if (c[it.type] != null) c[it.type]++; });
  return c;
}

// ---- Exporters --------------------------------------------------------------
function normalizeText(value) {
  return String(value || "")
    .normalize("NFKD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase();
}

function slugify(s, fallback = "untitled") {
  return normalizeText(s).replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || fallback;
}

function paletteEntries(p) {
  const counts = {};
  return (p.colors || []).map((color, index) => {
    const base = slugify(color.name, `color-${index + 1}`);
    counts[base] = (counts[base] || 0) + 1;
    return { ...color, key: counts[base] === 1 ? base : `${base}-${counts[base]}` };
  });
}

function paletteToCSS(p) {
  const lines = paletteEntries(p).map((c) => `  --color-${c.key}: ${c.hex};`);
  return `/* ${p.title} — DesignShelf export */\n:root {\n${lines.join("\n")}\n}`;
}

function paletteToTokens(p) {
  const color = {};
  paletteEntries(p).forEach((c) => { color[c.key] = { value: c.hex, type: "color" }; });
  return JSON.stringify({ [slugify(p.title)]: { color } }, null, 2);
}

function kitToMarkdown(kit, items) {
  const linked = (kit.itemIds || []).map((id) => items.find((i) => i.id === id)).filter(Boolean);
  const byType = {};
  linked.forEach((it) => { (byType[it.type] ||= []).push(it); });
  let md = `# ${kit.title}\n\n`;
  if (kit.client) md += `**Client / product:** ${kit.client}\n\n`;
  if (kit.audience) md += `**Target audience:** ${kit.audience}\n\n`;
  if (kit.direction) md += `## Creative direction\n\n${kit.direction}\n\n`;
  if (kit.notes) md += `## Notes\n\n${kit.notes}\n\n`;
  if (linked.length) {
    md += `## Library assets (${linked.length})\n\n`;
    Object.entries(byType).forEach(([type, list]) => {
      md += `### ${window.DS.TYPE_MAP[type].plural}\n\n`;
      list.forEach((it) => {
        md += `- **${it.title}**`;
        if (it.type === "palette") md += ` — ${(it.colors || []).map((c) => c.hex).join(", ")}`;
        else if (it.type === "font") md += ` — ${it.category}, ${it.license} license`;
        else if (it.type === "snippet") md += ` — “${it.text}”`;
        else if (it.description) md += ` — ${it.description}`;
        if (it.sourceUrl) md += ` ([source](${it.sourceUrl}))`;
        md += `\n`;
      });
      md += `\n`;
    });
  }
  md += `---\n_Generated with DesignShelf · ${new Date().toLocaleDateString("en-US")}_\n`;
  return md;
}

function exportAllJSON(items) {
  return JSON.stringify({ app: "DesignShelf", version: 1, exportedAt: new Date().toISOString(), items }, null, 2);
}

function download(filename, text, mime = "text/plain") {
  const blob = new Blob([text], { type: mime });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url; a.download = filename; a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1500);
}

async function copyText(text) {
  try { await navigator.clipboard.writeText(text); return true; }
  catch (e) {
    const ta = document.createElement("textarea");
    ta.value = text; ta.style.position = "fixed"; ta.style.opacity = "0";
    document.body.appendChild(ta); ta.select();
    try { document.execCommand("copy"); document.body.removeChild(ta); return true; }
    catch (e2) { document.body.removeChild(ta); return false; }
  }
}

Object.assign(window.DS, {
  useStore, validateItem, filterItems, allTags, countsByType, matchesQuery,
  paletteToCSS, paletteToTokens, kitToMarkdown, exportAllJSON, download, copyText, slugify, loadPrefs, LS_PREFS,
});
