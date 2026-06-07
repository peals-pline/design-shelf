/* =========================================================================
   DesignShelf — create / edit forms
   ========================================================================= */
const { useState: fS, useMemo: fM } = React;

function blankFor(type) {
  const base = { type, title: "", description: "", sourceUrl: "", notes: "", tags: [], favorite: false };
  const extra = {
    font: { category: "sans-serif", license: "unknown", previewText: "" },
    palette: { colors: [{ name: "Primary", hex: "#C8643C" }, { name: "Ink", hex: "#1A1A1C" }] },
    reference: { category: "dashboard", platform: "web", whyItWorks: "" },
    snippet: { text: "", category: "CTA", tone: "neutral", language: "en", context: "" },
    system: { platform: "web", componentCategories: [] },
    image: {},
    kit: { client: "", direction: "", audience: "", itemIds: [] },
  }[type] || {};
  return { ...base, ...extra };
}

// ---- Palette editor --------------------------------------------------------
function PaletteEditor({ colors, onChange }) {
  const set = (i, patch) => onChange(colors.map((c, idx) => (idx === i ? { ...c, ...patch } : c)));
  const add = () => onChange([...colors, { name: "Color " + (colors.length + 1), hex: "#888888" }]);
  const remove = (i) => onChange(colors.filter((_, idx) => idx !== i));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
      {colors.map((c, i) => (
        <div className="pe-row" key={i}>
          <span className="pe-swatch" style={{ background: c.hex }}>
            <input type="color" value={/^#[0-9a-f]{6}$/i.test(c.hex) ? c.hex : "#888888"} onChange={(e) => set(i, { hex: e.target.value })} />
          </span>
          <input className="input" style={{ flex: 1 }} value={c.name} placeholder="Name" onChange={(e) => set(i, { name: e.target.value })} />
          <input className="input mono-input" style={{ width: 116 }} value={c.hex} placeholder="#000000"
            onChange={(e) => { let v = e.target.value; if (v && !v.startsWith("#")) v = "#" + v; set(i, { hex: v }); }} />
          <button className="btn icon sm" type="button" onClick={() => remove(i)} disabled={colors.length <= 1} aria-label="Remove color">
            <window.DS.Icon name="Trash2" />
          </button>
        </div>
      ))}
      <button type="button" className="pe-add" onClick={add}><window.DS.Icon name="Plus" />Add color</button>
    </div>
  );
}

// ---- Kit builder (attach existing items) -----------------------------------
function KitBuilder({ selected, onChange, allItems, excludeId }) {
  const [q, setQ] = fS("");
  const candidates = allItems.filter((it) => it.type !== "kit" && it.id !== excludeId &&
    (!q || it.title.toLowerCase().includes(q.toLowerCase())));
  const toggle = (id) => onChange(selected.includes(id) ? selected.filter((x) => x !== id) : [...selected, id]);
  const { Icon } = window.DS;
  return (
    <div style={{ border: "1px solid var(--border)", borderRadius: "var(--radius-sm)", overflow: "hidden" }}>
      <div className="search" style={{ borderRadius: 0, border: "none", borderBottom: "1px solid var(--border)", height: 42 }}>
        <Icon name="Search" /><input value={q} placeholder="Filter library items…" onChange={(e) => setQ(e.target.value)} />
        <span className="kbd">{selected.length} attached</span>
      </div>
      <div style={{ maxHeight: 240, overflowY: "auto" }}>
        {candidates.length === 0 && <div style={{ padding: 18, color: "var(--text-3)", fontSize: 13, textAlign: "center" }}>No matching items.</div>}
        {candidates.map((it) => {
          const on = selected.includes(it.id);
          return (
            <button type="button" key={it.id} onClick={() => toggle(it.id)}
              style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 13px", borderBottom: "1px solid var(--border)", textAlign: "left", background: on ? "var(--accent-soft)" : "transparent" }}>
              <window.DS.TypeDot type={it.type} />
              <span style={{ flex: 1, fontSize: 13.5, fontWeight: 500 }}>{it.title}</span>
              <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>{window.DS.TYPE_MAP[it.type].label}</span>
              <span style={{ width: 20, height: 20, borderRadius: 5, display: "grid", placeItems: "center", border: on ? "none" : "1px solid var(--border-strong)", background: on ? "var(--accent)" : "transparent", color: "var(--on-accent)" }}>
                {on && <Icon name="Check" size={13} />}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ---- Main item form (modal) ------------------------------------------------
function ItemForm({ presetType, initial, allItems, onSave, onClose }) {
  const [draft, setDraft] = fS(() => initial ? { ...blankFor(initial.type), ...initial } : blankFor(presetType || "font"));
  const [errors, setErrors] = fS({});
  const { Field, ChoiceChips, TagInput, Button, TypeBadge } = window.DS;
  const D = window.DS;
  const t = draft.type;
  const up = (patch) => setDraft((d) => ({ ...d, ...patch }));

  const submit = () => {
    const errs = window.DS.validateItem(draft);
    setErrors(errs);
    if (Object.keys(errs).length) {
      requestAnimationFrame(() => {
        document.querySelector(".modal .invalid")?.focus();
      });
      return;
    }
    onSave(draft);
  };

  const Select = ({ field, options }) => (
    <div className="select-wrap" style={{ width: "100%" }}>
      <select className="select-field" value={draft[field]} onChange={(e) => up({ [field]: e.target.value })}>
        {options.map((o) => <option key={o} value={o}>{o}</option>)}
      </select>
      <window.DS.Icon name="ChevronDown" />
    </div>
  );

  return (
    <window.DS.Modal
      title={<span style={{ display: "flex", alignItems: "center", gap: 10 }}>{initial ? "Edit" : "New"} <TypeBadge type={t} /></span>}
      onClose={onClose}
      footer={<>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="accent" icon="Check" onClick={submit}>{initial ? "Save changes" : "Add to shelf"}</Button>
      </>}
    >
      {/* type switcher only when creating fresh */}
      {!initial && (
        <Field label="Type">
          <div className="choice-wrap">
            {window.DS.TYPES.map((ty) => (
              <button type="button" key={ty.key} className={"choice" + (t === ty.key ? " on" : "")}
                onClick={() => setDraft({ ...blankFor(ty.key), title: draft.title, description: draft.description, tags: draft.tags })}>
                <window.DS.TypeDot type={ty.key} />{ty.label}
              </button>
            ))}
          </div>
        </Field>
      )}

      <Field label="Title" required error={errors.title}>
        <input className={"input" + (errors.title ? " invalid" : "")} value={draft.title} autoFocus
          placeholder={{ font: "e.g. Söhne", palette: "e.g. Terracotta Studio", reference: "e.g. Stripe checkout flow", snippet: "Short label for this copy", system: "e.g. Radix UI", image: "e.g. Brutalist poster", kit: "e.g. Acme — Onboarding" }[t]}
          onChange={(e) => up({ title: e.target.value })} />
      </Field>

      {/* snippet leads with its text */}
      {t === "snippet" && (
        <Field label="Copy text" required error={errors.text} hint="The actual words. This is what gets copied.">
          <textarea className={"textarea" + (errors.text ? " invalid" : "")} value={draft.text} onChange={(e) => up({ text: e.target.value })} placeholder="Write the microcopy…" />
        </Field>
      )}

      {t !== "snippet" && (
        <Field label="Description" hint="One line on what this is or why it's here.">
          <input className="input" value={draft.description} onChange={(e) => up({ description: e.target.value })} />
        </Field>
      )}

      {/* ---- per-type fields ---- */}
      {t === "font" && (
        <>
          <Field label="Category"><ChoiceChips options={window.DS.FONT_CATEGORIES} value={draft.category} onChange={(v) => up({ category: v })} /></Field>
          <Field label="License" hint="You are responsible for respecting each font's license before use.">
            <ChoiceChips options={window.DS.FONT_LICENSES} value={draft.license} onChange={(v) => up({ license: v })} />
          </Field>
          <Field label="Preview text" hint="Used on the preview card."><input className="input" value={draft.previewText} placeholder="The quick brown fox…" onChange={(e) => up({ previewText: e.target.value })} /></Field>
        </>
      )}

      {t === "palette" && (
        <Field label="Colors" required error={errors.colors}>
          <PaletteEditor colors={draft.colors} onChange={(v) => up({ colors: v })} />
        </Field>
      )}

      {t === "reference" && (
        <>
          <Field label="Category"><ChoiceChips options={window.DS.REFERENCE_CATEGORIES} value={draft.category} onChange={(v) => up({ category: v })} /></Field>
          <div className="field-row">
            <Field label="Platform"><Select field="platform" options={window.DS.PLATFORMS} /></Field>
            <div />
          </div>
          <Field label="Why it works" hint="The thing worth remembering about this pattern.">
            <textarea className="textarea" value={draft.whyItWorks} onChange={(e) => up({ whyItWorks: e.target.value })} placeholder="What makes this pattern effective…" />
          </Field>
        </>
      )}

      {t === "snippet" && (
        <>
          <Field label="Category"><ChoiceChips options={window.DS.SNIPPET_CATEGORIES} value={draft.category} onChange={(v) => up({ category: v })} /></Field>
          <div className="field-row">
            <Field label="Tone">
              <div className="select-wrap" style={{ width: "100%" }}>
                <select className="select-field" value={draft.tone} onChange={(e) => up({ tone: e.target.value })}>
                  {window.DS.SNIPPET_TONES.map((o) => <option key={o}>{o}</option>)}
                </select><window.DS.Icon name="ChevronDown" />
              </div>
            </Field>
            <Field label="Language"><input className="input mono-input" value={draft.language} onChange={(e) => up({ language: e.target.value })} placeholder="en" /></Field>
          </div>
          <Field label="Context" hint="Where this copy appears."><input className="input" value={draft.context} onChange={(e) => up({ context: e.target.value })} /></Field>
        </>
      )}

      {t === "system" && (
        <>
          <Field label="Platform"><Select field="platform" options={window.DS.PLATFORMS} /></Field>
          <Field label="Component coverage"><ChoiceChips multi withDot options={window.DS.SYSTEM_COMPONENT_CATEGORIES} value={draft.componentCategories} onChange={(v) => up({ componentCategories: v })} /></Field>
        </>
      )}

      {t === "kit" && (
        <>
          <div className="field-row">
            <Field label="Client / product"><input className="input" value={draft.client} onChange={(e) => up({ client: e.target.value })} placeholder="Acme Fintech" /></Field>
            <div />
          </div>
          <Field label="Target audience"><input className="input" value={draft.audience} onChange={(e) => up({ audience: e.target.value })} placeholder="Who is this for?" /></Field>
          <Field label="Creative direction" hint="The north star for this project's look & feel.">
            <textarea className="textarea" value={draft.direction} onChange={(e) => up({ direction: e.target.value })} placeholder="Tone, mood, do's and don'ts…" />
          </Field>
          <Field label="Assets in this kit" hint="Attach fonts, palettes, references and copy from your shelf.">
            <KitBuilder selected={draft.itemIds} onChange={(v) => up({ itemIds: v })} allItems={allItems} excludeId={draft.id} />
          </Field>
        </>
      )}

      {/* ---- shared fields ---- */}
      <Field label="Source URL" error={errors.sourceUrl}>
        <input className={"input mono-input" + (errors.sourceUrl ? " invalid" : "")} value={draft.sourceUrl} placeholder="https://…" onChange={(e) => up({ sourceUrl: e.target.value })} />
      </Field>
      <Field label="Tags"><TagInput value={draft.tags} onChange={(v) => up({ tags: v })} /></Field>
      {t !== "kit" && (
        <Field label="Notes" hint="Private — only you ever see these.">
          <textarea className="textarea" value={draft.notes} onChange={(e) => up({ notes: e.target.value })} placeholder="Reminders, gotchas, why you saved it…" />
        </Field>
      )}
      {t === "kit" && (
        <Field label="Notes">
          <textarea className="textarea" value={draft.notes} onChange={(e) => up({ notes: e.target.value })} />
        </Field>
      )}
    </window.DS.Modal>
  );
}

Object.assign(window.DS, { ItemForm, blankFor, PaletteEditor, KitBuilder });
