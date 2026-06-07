/* =========================================================================
   DesignShelf — config + demo seed data
   ========================================================================= */

// Each content type: key, labels, lucide icon, and a muted hue for its accent.
const TYPES = [
  { key: "font",      label: "Font",          plural: "Fonts",          icon: "Type",            hue: 264 },
  { key: "palette",   label: "Palette",       plural: "Palettes",       icon: "Palette",         hue: 344 },
  { key: "reference", label: "UI Reference",  plural: "UI References",  icon: "LayoutDashboard", hue: 212 },
  { key: "snippet",   label: "Copy Snippet",  plural: "Copy Snippets",  icon: "Quote",           hue: 152 },
  { key: "system",    label: "Design System", plural: "Design Systems", icon: "Boxes",           hue: 96  },
  { key: "image",     label: "Inspiration",   plural: "Inspiration",    icon: "Image",           hue: 300 },
  { key: "kit",       label: "Project Kit",   plural: "Project Kits",   icon: "FolderKanban",    hue: 40  },
];
const TYPE_MAP = Object.fromEntries(TYPES.map((t) => [t.key, t]));

// In dark mode hues are lightened a touch by CSS; here we expose helpers.
function typeColor(hue) { return `oklch(0.74 0.095 ${hue})`; }
function typeSoft(hue) { return `color-mix(in oklch, oklch(0.74 0.095 ${hue}) 14%, transparent)`; }
function typeVars(key) {
  const t = TYPE_MAP[key];
  return { "--type-color": typeColor(t.hue), "--type-soft": typeSoft(t.hue) };
}

const FONT_CATEGORIES = ["serif", "sans-serif", "mono", "display", "handwritten"];
const FONT_LICENSES = ["OFL", "free", "commercial", "unknown"];
const REFERENCE_CATEGORIES = ["onboarding", "dashboard", "pricing", "checkout", "settings", "empty state", "forms", "navigation", "mobile", "web"];
const SNIPPET_CATEGORIES = ["CTA", "empty state", "error", "success", "onboarding", "form helper", "tooltip", "notification"];
const SNIPPET_TONES = ["neutral", "friendly", "playful", "formal", "urgent", "reassuring", "confident"];
const SYSTEM_COMPONENT_CATEGORIES = ["buttons", "forms", "navigation", "typography", "colors", "icons", "layout", "motion"];
const PLATFORMS = ["web", "iOS", "Android", "desktop", "cross-platform"];

// font-family stack used for the preview glyph (falls back to UI font)
const FONT_STACKS = {
  serif: "'Newsreader', Georgia, 'Times New Roman', serif",
  "sans-serif": "var(--font-ui)",
  mono: "var(--font-mono)",
  display: "var(--font-ui)",
  handwritten: "'Segoe Script', 'Bradley Hand', cursive",
};

const uid = () => "id-" + Math.random().toString(36).slice(2, 10);
const daysAgo = (n) => new Date(Date.now() - n * 86400000).toISOString();

// ---- Demo seed --------------------------------------------------------------
function buildSeed() {
  const f = (over) => ({ favorite: false, tags: [], notes: "", description: "", sourceUrl: "", ...over,
    createdAt: over.createdAt || daysAgo(over._d ?? 10), updatedAt: over.updatedAt || daysAgo(over._d ?? 10) });

  const items = [
    // ---- Fonts
    f({ id: "seed-f1", type: "font", title: "Söhne", _d: 2, favorite: true,
      description: "Neo-grotesque revival of Akzidenz — the workhorse for modern product UI.",
      category: "sans-serif", license: "commercial", previewText: "Ship calm, considered software.",
      sourceUrl: "https://klim.co.nz/retail-fonts/soehne/", tags: ["ui", "neo-grotesque", "klim"],
      notes: "Pairs beautifully with a mono for data. Buy before using commercially." }),
    f({ id: "seed-f2", type: "font", title: "Newsreader", _d: 6,
      description: "Variable serif made for long-form reading on screens. Free & open.",
      category: "serif", license: "OFL", previewText: "An editorial voice for content-heavy screens.",
      sourceUrl: "https://fonts.google.com/specimen/Newsreader", tags: ["editorial", "variable", "reading"],
      notes: "Optical sizes are gorgeous — use the larger optical cut for display." }),
    f({ id: "seed-f3", type: "font", title: "JetBrains Mono", _d: 14, favorite: true,
      description: "Mono with tall x-height and clear glyph distinction. Great for code & data.",
      category: "mono", license: "OFL", previewText: "0O 1lI — never confuse a zero again.",
      sourceUrl: "https://www.jetbrains.com/lp/mono/", tags: ["code", "data", "labels"],
      notes: "Our metadata/label font in this very app." }),
    f({ id: "seed-f4", type: "font", title: "Clash Display", _d: 21,
      description: "High-contrast display grotesque with attitude. Free for personal & commercial.",
      category: "display", license: "free", previewText: "Big, loud, headline energy.",
      sourceUrl: "https://www.fontshare.com/fonts/clash-display", tags: ["headline", "hero", "fontshare"], notes: "" }),

    // ---- Palettes
    f({ id: "seed-p1", type: "palette", title: "Terracotta Studio", _d: 1, favorite: true,
      description: "Warm, earthy, editorial. The palette this app is built on.",
      tags: ["warm", "editorial", "brand"],
      colors: [
        { name: "Clay", hex: "#C8643C" }, { name: "Ink", hex: "#1A1A1C" },
        { name: "Bone", hex: "#F4F1EA" }, { name: "Sand", hex: "#D9CBB3" }, { name: "Moss", hex: "#5C6B4C" },
      ], notes: "Clay is the single accent. Everything else is a warm neutral ramp." }),
    f({ id: "seed-p2", type: "palette", title: "Midnight Console", _d: 4,
      description: "A calm dark UI ramp — surfaces, borders, and one cool accent.",
      tags: ["dark", "ui", "tool"],
      colors: [
        { name: "Base", hex: "#161718" }, { name: "Surface", hex: "#1F2123" },
        { name: "Border", hex: "#2E3134" }, { name: "Signal", hex: "#5B8DEF" }, { name: "Text", hex: "#F4F4F3" },
      ], notes: "" }),
    f({ id: "seed-p3", type: "palette", title: "Citrus Pop", _d: 9,
      description: "Playful, high-energy set for a consumer brand or marketing site.",
      tags: ["bright", "consumer", "playful"],
      colors: [
        { name: "Lime", hex: "#B4E33D" }, { name: "Tangerine", hex: "#FF8A3D" },
        { name: "Grape", hex: "#7C5CFC" }, { name: "Cloud", hex: "#FBFBF9" }, { name: "Slate", hex: "#222531" },
      ], notes: "" }),

    // ---- UI references
    f({ id: "seed-r1", type: "reference", title: "Command menu — keyboard-first nav", _d: 3, favorite: true,
      description: "A ⌘K palette that lets power users jump anywhere without the mouse.",
      category: "navigation", platform: "web", tags: ["cmdk", "power-user", "search"],
      sourceUrl: "https://linear.app", whyItWorks: "Reduces clicks to near-zero for repeat tasks, and quietly teaches shortcuts by showing them inline next to each action." }),
    f({ id: "seed-r2", type: "reference", title: "Progressive onboarding checklist", _d: 7,
      description: "A dismissible setup checklist that drives activation without a wall of modals.",
      category: "onboarding", platform: "web", tags: ["activation", "checklist", "empty-state"],
      sourceUrl: "", whyItWorks: "Breaks first-run into small, skippable wins. Progress bar creates a completion pull. Never blocks the actual product." }),
    f({ id: "seed-r3", type: "reference", title: "Pricing — slider-driven plans", _d: 12,
      description: "Usage slider that recalculates the recommended tier in real time.",
      category: "pricing", platform: "web", tags: ["pricing", "interactive"],
      sourceUrl: "", whyItWorks: "Turns an abstract decision into a concrete one. People self-select the right plan instead of guessing." }),
    f({ id: "seed-r4", type: "reference", title: "Mobile checkout — one-thumb flow", _d: 18,
      description: "Single-column checkout with sticky pay button reachable by thumb.",
      category: "checkout", platform: "iOS", tags: ["mobile", "conversion"],
      sourceUrl: "", whyItWorks: "Every field is one tap; the CTA never leaves the thumb zone; Apple Pay is the default, typing is the fallback." }),

    // ---- Copy snippets
    f({ id: "seed-c1", type: "snippet", title: "Empty state — first project", _d: 2,
      text: "Nothing here yet — and that's a clean slate. Drop in your first font, palette, or screenshot to start your shelf.",
      category: "empty state", tone: "friendly", language: "en", context: "Shown on an empty library before any item exists.",
      tags: ["empty-state", "warm"], favorite: true }),
    f({ id: "seed-c2", type: "snippet", title: "Save error — offline", _d: 5,
      text: "We couldn't save that just now. Your changes are kept locally and will sync the moment you're back online.",
      category: "error", tone: "reassuring", language: "en", context: "Network failure during a save action.", tags: ["error", "trust"] }),
    f({ id: "seed-c3", type: "snippet", title: "CTA — start free", _d: 11,
      text: "Start your shelf — free, forever, no account.",
      category: "CTA", tone: "confident", language: "en", context: "Primary hero button on the landing page.", tags: ["cta", "hero"] }),
    f({ id: "seed-c4", type: "snippet", title: "Success — export done", _d: 16,
      text: "Exported. Your backup is in your Downloads — keep it somewhere safe.",
      category: "success", tone: "neutral", language: "en", context: "After a JSON export completes.", tags: ["success", "export"] }),

    // ---- Design systems
    f({ id: "seed-s1", type: "system", title: "Radix UI Primitives", _d: 4, favorite: true,
      description: "Unstyled, accessible component primitives you style yourself.",
      platform: "web", componentCategories: ["forms", "navigation", "layout", "motion"],
      sourceUrl: "https://www.radix-ui.com", tags: ["headless", "a11y", "react"],
      notes: "Start here for accessible behavior, then layer your own visual system on top." }),
    f({ id: "seed-s2", type: "system", title: "Material Design 3", _d: 13,
      description: "Google's expressive system with dynamic color and motion guidelines.",
      platform: "cross-platform", componentCategories: ["buttons", "colors", "motion", "typography"],
      sourceUrl: "https://m3.material.io", tags: ["google", "tokens", "dynamic-color"], notes: "" }),
    f({ id: "seed-s3", type: "system", title: "Carbon", _d: 20,
      description: "IBM's open enterprise design system — heavy on data-dense patterns.",
      platform: "web", componentCategories: ["layout", "forms", "icons", "typography"],
      sourceUrl: "https://carbondesignsystem.com", tags: ["enterprise", "ibm", "data"], notes: "" }),

    // ---- Inspiration
    f({ id: "seed-i1", type: "image", title: "Brutalist grid poster", _d: 6,
      description: "Type-as-structure layout — oversized numerals on a strict grid.",
      tags: ["poster", "grid", "typographic"], sourceUrl: "", notes: "Steal the idea of using the metric numbers AS the layout." }),
    f({ id: "seed-i2", type: "image", title: "Risograph texture set", _d: 15, favorite: true,
      description: "Grainy two-color overprints — warmth for an otherwise clean UI.",
      tags: ["texture", "riso", "print"], sourceUrl: "", notes: "" }),

    // ---- Project kit
    f({ id: "seed-k1", type: "kit", title: "Acme Fintech — Onboarding revamp", _d: 1, favorite: true,
      description: "Direction & assets for the Q3 activation push.",
      client: "Acme Fintech", direction: "Trustworthy but warm. Lead with clay accent on a calm dark base, mono for figures, generous spacing so money feels handled, not crowded.",
      audience: "First-time users opening a business account on mobile.",
      itemIds: ["seed-f1", "seed-f3", "seed-p1", "seed-r2", "seed-c2"],
      tags: ["client", "fintech", "onboarding"],
      notes: "Decision: no illustration of money. Use restraint as the trust signal." }),
  ];
  return items;
}

window.DS = window.DS || {};
Object.assign(window.DS, {
  TYPES, TYPE_MAP, typeColor, typeSoft, typeVars,
  FONT_CATEGORIES, FONT_LICENSES, REFERENCE_CATEGORIES, SNIPPET_CATEGORIES,
  SNIPPET_TONES, SYSTEM_COMPONENT_CATEGORIES, PLATFORMS, FONT_STACKS,
  uid, daysAgo, buildSeed,
});
