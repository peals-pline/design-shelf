/* =========================================================================
   DesignShelf — app shell, routing, command palette, tweaks, settings
   ========================================================================= */
const { useState: aS, useEffect: aE, useMemo: aM, useRef: aR, useCallback: aC } = React;
const D = window.DS;

const ACCENTS = [
  { key: "clay",   strong: "oklch(0.66 0.14 47)",  color: "oklch(0.705 0.135 47)", on: "oklch(0.18 0.03 60)", sw: "#C8643C" },
  { key: "blue",   strong: "oklch(0.56 0.14 250)", color: "oklch(0.63 0.13 250)",  on: "#ffffff",             sw: "#5B8DEF" },
  { key: "green",  strong: "oklch(0.58 0.13 160)", color: "oklch(0.65 0.12 160)",  on: "#ffffff",             sw: "#2F9E6F" },
  { key: "violet", strong: "oklch(0.56 0.15 300)", color: "oklch(0.63 0.14 300)",  on: "#ffffff",             sw: "#8B6FD4" },
  { key: "amber",  strong: "oklch(0.72 0.14 75)",  color: "oklch(0.79 0.13 80)",   on: "oklch(0.22 0.05 80)", sw: "#E0A23B" },
];

function applyPrefs(p) {
  const root = document.documentElement;
  root.dataset.theme = p.theme || "dark";
  const a = ACCENTS.find((x) => x.key === p.accent) || ACCENTS[0];
  if (p.theme === "light") {
    // light mode keeps its own tuned accent unless user picked non-clay
    if (p.accent && p.accent !== "clay") { root.style.setProperty("--accent", a.color); root.style.setProperty("--accent-strong", a.strong); root.style.setProperty("--on-accent", a.on); }
    else { root.style.removeProperty("--accent"); root.style.removeProperty("--accent-strong"); root.style.removeProperty("--on-accent"); }
  } else {
    root.style.setProperty("--accent", a.color);
    root.style.setProperty("--accent-strong", a.strong);
    root.style.setProperty("--on-accent", a.on);
  }
  const r = p.radius ?? 12;
  root.style.setProperty("--radius", r + "px");
  root.style.setProperty("--radius-sm", Math.max(4, r - 4) + "px");
  root.style.setProperty("--radius-lg", (r + 6) + "px");
}

// ---- Command palette --------------------------------------------------------
function CommandPalette({ app, onClose }) {
  const [q, setQ] = aS("");
  const [idx, setIdx] = aS(0);
  const inputRef = aR(null);
  aE(() => { inputRef.current?.focus(); }, []);

  const results = aM(() => {
    const actions = [];
    if (!q || "dashboard home".includes(q.toLowerCase())) actions.push({ kind: "nav", id: "dashboard", label: "Go to Dashboard", icon: "Home", run: () => app.navigate("dashboard") });
    D.TYPES.forEach((t) => actions.push({ kind: "nav", id: "nav-" + t.key, label: "Add " + t.label, icon: "Plus", run: () => app.add(t.key), tag: "create" }));
    const items = D.filterItems(app.items, { query: q }).slice(0, 7).map((it) => ({ kind: "item", id: it.id, label: it.title, type: it.type, run: () => app.open(it) }));
    const navs = q ? actions.filter((a) => a.label.toLowerCase().includes(q.toLowerCase())) : actions.slice(0, 3);
    return [...items, ...navs];
  }, [q, app.items]);

  aE(() => { setIdx(0); }, [q]);
  const onKey = (e) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setIdx((i) => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setIdx((i) => Math.max(i - 1, 0)); }
    else if (e.key === "Enter") { e.preventDefault(); results[idx]?.run(); onClose(); }
  };

  return (
    <div className="scrim" style={{ alignItems: "flex-start" }} onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={{ width: "min(580px,94vw)", marginTop: "12vh" }} onKeyDown={onKey}>
        <div className="search" style={{ maxWidth: "none", height: 52, border: "none", borderBottom: "1px solid var(--border)", borderRadius: 0, fontSize: 15 }}>
          <D.Icon name="Search" /><input ref={inputRef} value={q} placeholder="Search items, or jump to…" onChange={(e) => setQ(e.target.value)} style={{ fontSize: 15 }} />
          <span className="kbd">esc</span>
        </div>
        <div style={{ padding: 8, maxHeight: "50vh", overflowY: "auto" }}>
          {results.length === 0 && <div style={{ padding: 24, textAlign: "center", color: "var(--text-3)", fontSize: 13 }}>No results for “{q}”.</div>}
          {results.map((r, i) => (
            <button key={r.id} className="cmd-row" onMouseEnter={() => setIdx(i)} onClick={() => { r.run(); onClose(); }}
              style={{ display: "flex", alignItems: "center", gap: 11, width: "100%", padding: "10px 12px", borderRadius: 8, textAlign: "left", background: i === idx ? "var(--accent-soft)" : "transparent" }}>
              {r.kind === "item" ? <D.TypeDot type={r.type} /> : <D.Icon name={r.icon} style={{ width: 16, height: 16, color: "var(--text-3)" }} />}
              <span style={{ flex: 1, fontSize: 14, fontWeight: 500 }}>{r.label}</span>
              {r.kind === "item" && <span style={{ fontFamily: "var(--font-mono)", fontSize: 11, color: "var(--text-faint)" }}>{D.TYPE_MAP[r.type].label}</span>}
              {r.tag && <span className="kbd">{r.tag}</span>}
              {i === idx && <D.Icon name="CornerDownLeft" style={{ width: 14, height: 14, color: "var(--text-faint)" }} />}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ---- Tweaks panel -----------------------------------------------------------
function Tweaks({ prefs, setPrefs, onClose }) {
  const ref = aR(null), drag = aR(null);
  const [pos, setPos] = aS(null);
  const onDown = (e) => { const r = ref.current.getBoundingClientRect(); drag.current = { x: e.clientX - r.left, y: e.clientY - r.top }; };
  aE(() => {
    const mv = (e) => { if (!drag.current) return; setPos({ left: e.clientX - drag.current.x, top: e.clientY - drag.current.y }); };
    const up = () => (drag.current = null);
    window.addEventListener("mousemove", mv); window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", mv); window.removeEventListener("mouseup", up); };
  }, []);
  const set = (patch) => setPrefs({ ...prefs, ...patch });
  return (
    <div className="tweaks" ref={ref} style={pos ? { top: pos.top, left: pos.left, right: "auto" } : undefined}>
      <div className="tweaks-head" onMouseDown={onDown}>
        <D.Icon name="SlidersHorizontal" /><h3>Tweaks</h3>
        <button className="x-btn" style={{ width: 26, height: 26 }} onClick={onClose}><D.Icon name="X" /></button>
      </div>
      <div className="tweaks-body">
        <div className="tw-group">
          <span className="tw-label">Theme</span>
          <div className="tw-seg">
            {["dark", "light"].map((th) => <button key={th} className={prefs.theme === th ? "on" : ""} onClick={() => set({ theme: th })}>{th[0].toUpperCase() + th.slice(1)}</button>)}
          </div>
        </div>
        <div className="tw-group">
          <span className="tw-label">Accent</span>
          <div className="tw-swatches">
            {ACCENTS.map((a) => <button key={a.key} className={"tw-sw" + ((prefs.accent || "clay") === a.key ? " on" : "")} style={{ background: a.sw }} onClick={() => set({ accent: a.key })} aria-label={a.key} />)}
          </div>
        </div>
        <div className="tw-group">
          <span className="tw-label">Corner radius — {prefs.radius ?? 12}px</span>
          <input className="tw-slider" type="range" min="4" max="20" step="1" value={prefs.radius ?? 12} onChange={(e) => set({ radius: +e.target.value })} />
        </div>
        <div className="tw-group">
          <span className="tw-label">Density</span>
          <div className="tw-seg">
            {[["cozy", "Cozy"], ["roomy", "Roomy"]].map(([k, l]) => <button key={k} className={(prefs.density || "roomy") === k ? "on" : ""} onClick={() => set({ density: k })}>{l}</button>)}
          </div>
        </div>
      </div>
    </div>
  );
}

// ---- Settings (import / export / data) -------------------------------------
function Settings({ app, onClose }) {
  const fileRef = aR(null);
  const doImport = (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = () => { try { const n = app.store.importJSON(reader.result, "merge"); D.pushToast("Imported " + n + " items", "Upload"); onClose(); } catch (err) { alert(err.message); } };
    reader.readAsText(file);
  };
  return (
    <D.Modal title="Data & privacy" onClose={onClose} footer={<D.Button variant="ghost" onClick={onClose}>Close</D.Button>}>
      <div className="detail-note" style={{ display: "flex", gap: 10, alignItems: "flex-start" }}>
        <D.Icon name="Lock" style={{ width: 16, height: 16, color: "var(--accent)", flex: "none", marginTop: 2 }} />
        <div>Everything lives in this browser only. No account, no server, no analytics. Export a backup to keep your shelf safe or move it to another machine.</div>
      </div>
      <D.Field label="Backup">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <D.Button icon="Download" onClick={() => { D.download("designshelf-backup.json", D.exportAllJSON(app.items), "application/json"); D.pushToast("Exported backup", "Download"); }}>Export all (JSON)</D.Button>
          <D.Button icon="Copy" onClick={() => D.copyText(D.exportAllJSON(app.items)).then(() => D.pushToast("Backup copied", "Copy"))}>Copy JSON</D.Button>
          <D.Button icon="Upload" onClick={() => fileRef.current.click()}>Import backup</D.Button>
          <input ref={fileRef} type="file" accept="application/json,.json" style={{ display: "none" }} onChange={doImport} />
        </div>
      </D.Field>
      <div className="divider" />
      <D.Field label="Danger zone">
        <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
          <D.Button icon="RotateCcw" onClick={() => { if (confirm("Replace everything with the demo data?")) { app.store.resetSeed(); D.pushToast("Demo data restored", "RotateCcw"); onClose(); } }}>Restore demo data</D.Button>
          <D.Button className="danger" icon="Trash2" onClick={() => { if (confirm("Delete ALL items? Export a backup first — this can't be undone.")) { app.store.clearAll(); D.pushToast("Shelf cleared", "Trash2"); onClose(); } }}>Clear everything</D.Button>
        </div>
      </D.Field>
    </D.Modal>
  );
}

// ---- Sidebar ----------------------------------------------------------------
function Sidebar({ app, counts }) {
  const total = app.items.length;
  const favCount = app.items.filter((i) => i.favorite).length;
  const NavItem = ({ id, icon, label, count, dot, active }) => (
    <button className={"nav-item" + (active ? " active" : "")} onClick={() => app.navigate(id)}>
      {dot ? <D.TypeDot type={dot} /> : <D.Icon name={icon} />}
      <span>{label}</span>
      {count != null && <span className="nav-count">{count}</span>}
    </button>
  );
  return (
    <aside className="sidebar">
      <div className="brand">
        <div className="brand-mark">◧</div>
        <div><div className="brand-name">DesignShelf</div><div className="brand-sub">local library</div></div>
      </div>
      <nav className="nav">
        <div className="nav-label">Library</div>
        <NavItem id="dashboard" icon="LayoutGrid" label="Dashboard" active={app.view === "dashboard"} />
        <NavItem id="all" icon="Library" label="All items" count={total} active={app.view === "all" && !app.favOnly} />
        <NavItem id="favorites" icon="Heart" label="Favorites" count={favCount} active={app.view === "all" && app.favOnly} />
        <div className="nav-label">By type</div>
        {D.TYPES.map((t) => <NavItem key={t.key} id={t.key} dot={t.key} label={t.plural} count={counts[t.key]} active={app.view === t.key} />)}
      </nav>
      <div className="sidebar-foot">
        <div className="privacy"><D.Icon name="ShieldCheck" /><span>100% local & private. No account, no cloud, no tracking.</span></div>
        <D.Button variant="ghost" icon="Settings2" onClick={app.openSettings} style={{ justifyContent: "flex-start" }}>Data & settings</D.Button>
      </div>
    </aside>
  );
}

// ---- Toolbar (filters) ------------------------------------------------------
function Toolbar({ app, count }) {
  return (
    <>
      <div className="toolbar">
        <div className="seg">
          <button className={app.favOnly ? "on" : ""} onClick={() => app.setFavOnly(!app.favOnly)}><D.Icon name="Heart" />Favorites</button>
        </div>
        <div className="select-wrap">
          <select value={app.since} onChange={(e) => app.setSince(e.target.value)}>
            <option value="all">Any time</option><option value="7d">Last 7 days</option><option value="30d">Last 30 days</option><option value="90d">Last 90 days</option>
          </select><D.Icon name="ChevronDown" />
        </div>
        <div className="select-wrap">
          <select value={app.sort} onChange={(e) => app.setSort(e.target.value)}>
            <option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="title">Title A–Z</option><option value="type">By type</option>
          </select><D.Icon name="ChevronDown" />
        </div>
        <div className="toolbar-spacer" />
        <span className="result-count">{count} {count === 1 ? "item" : "items"}</span>
      </div>
      {app.tagFilters.length > 0 && (
        <div className="filter-chips">
          {app.tagFilters.map((t) => (
            <span className="fchip" key={t}>#{t}<button onClick={() => app.removeTagFilter(t)}><D.Icon name="X" /></button></span>
          ))}
          <button className="link-btn" onClick={() => app.clearTagFilters()}>Clear</button>
        </div>
      )}
    </>
  );
}

// ---- Root App ---------------------------------------------------------------
function App() {
  const store = D.useStore();
  const saved = D.loadPrefs();
  const [prefs, setPrefsState] = aS({ theme: "dark", accent: "clay", radius: 12, density: "roomy", ...saved });
  const [view, setView] = aS(saved.view || "dashboard");
  const [query, setQuery] = aS("");
  const [favOnly, setFavOnly] = aS(false);
  const [since, setSince] = aS("all");
  const [sort, setSort] = aS(saved.sort || "newest");
  const [tagFilters, setTagFilters] = aS([]);
  const [openItem, setOpenItem] = aS(null);
  const [editing, setEditing] = aS(null);
  const [creating, setCreating] = aS(null); // presetType or null
  const [cmdOpen, setCmdOpen] = aS(false);
  const [tweaksOpen, setTweaksOpen] = aS(false);
  const [settingsOpen, setSettingsOpen] = aS(false);

  const setPrefs = (p) => { setPrefsState(p); };
  aE(() => { applyPrefs(prefs); }, [prefs]);
  aE(() => { try { localStorage.setItem(D.LS_PREFS, JSON.stringify({ ...prefs, view, sort })); } catch (e) {} }, [prefs, view, sort]);
  aE(() => { document.body.classList.toggle("dense", prefs.density === "cozy"); }, [prefs.density]);

  // keyboard: Ctrl/Cmd+K / focus search, esc
  aE(() => {
    const onKey = (e) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "k") { e.preventDefault(); setCmdOpen((v) => !v); }
      if (e.key === "/" && document.activeElement.tagName !== "INPUT" && document.activeElement.tagName !== "TEXTAREA") { e.preventDefault(); document.getElementById("topsearch")?.focus(); }
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, []);

  const counts = aM(() => D.countsByType(store.items), [store.items]);

  const navigate = aC((v) => {
    if (v === "favorites") { setFavOnly(true); setView("all"); }
    else { if (v !== "all") setFavOnly(false); setView(v); }
    setOpenItem(null);
    document.querySelector(".content")?.scrollTo({ top: 0 });
  }, []);

  const app = {
    items: store.items, store, view, favOnly, since, sort, tagFilters,
    navigate, setFavOnly, setSince, setSort,
    toggleFav: store.toggleFav, remove: store.removeItem,
    open: (it) => setOpenItem(it),
    close: () => setOpenItem(null),
    edit: (it) => { setOpenItem(null); setEditing(it); },
    add: (type) => setCreating(type || "font"),
    openSettings: () => setSettingsOpen(true),
    addTagFilter: (t) => setTagFilters((p) => (p.includes(t) ? p : [...p, t])),
    removeTagFilter: (t) => setTagFilters((p) => p.filter((x) => x !== t)),
    clearTagFilters: () => setTagFilters([]),
  };

  const activeTypes = view !== "dashboard" && view !== "all" ? [view] : [];
  const filtered = aM(() => D.filterItems(store.items, { query, types: activeTypes, tags: tagFilters, favorite: favOnly, since, sort }), [store.items, query, view, tagFilters, favOnly, since, sort]);

  // keep openItem fresh after edits
  const liveOpen = openItem ? store.items.find((i) => i.id === openItem.id) || null : null;

  const curType = D.TYPE_MAP[view];

  return (
    <div className="app">
      <Sidebar app={app} counts={counts} />
      <div className="main">
        <header className="topbar">
          <div className="search">
            <D.Icon name="Search" />
            <input id="topsearch" value={query} placeholder="Search your shelf…" onChange={(e) => setQuery(e.target.value)} />
            <button className="kbd" onClick={() => setCmdOpen(true)} title="Command palette" style={{ cursor: "pointer" }}>Ctrl K</button>
          </div>
          <div className="mobile-nav">
            <D.Icon name="Menu" />
            <select aria-label="Library navigation" value={favOnly ? "favorites" : view} onChange={(e) => navigate(e.target.value)}>
              <option value="dashboard">Dashboard</option>
              <option value="all">All items</option>
              <option value="favorites">Favorites</option>
              {D.TYPES.map((t) => <option key={t.key} value={t.key}>{t.plural}</option>)}
            </select>
            <D.Icon name="ChevronDown" />
          </div>
          <div className="topbar-spacer" />
          <div className="topbar-actions">
            <D.Button variant="ghost" size="sm" icon={prefs.theme === "dark" ? "Sun" : "Moon"} onClick={() => setPrefs({ ...prefs, theme: prefs.theme === "dark" ? "light" : "dark" })} aria-label="Toggle theme" />
            <D.Button variant="ghost" size="sm" icon="SlidersHorizontal" onClick={() => setTweaksOpen((v) => !v)} aria-label="Tweaks" />
            <D.Button variant="accent" size="sm" icon="Plus" onClick={() => app.add()}>Add</D.Button>
          </div>
        </header>

        <div className="content">
          {view === "dashboard" ? (
            <D.Dashboard app={app} />
          ) : (
            <div className="page">
              <div className="page-head">
                <div>
                  {curType ? (
                    <>
                      <div className="page-title">
                        <span className="tt-icon" style={{ ...D.typeVars(view), background: "var(--type-soft)", color: "var(--type-color)" }}><D.Icon name={curType.icon} /></span>
                        {curType.plural}
                      </div>
                      <p className="page-sub">{TYPE_BLURB[view]}</p>
                    </>
                  ) : (
                    <>
                      <div className="page-title">{favOnly ? "Favorites" : "All items"}</div>
                      <p className="page-sub">{favOnly ? "Everything you've starred, in one place." : "Your entire shelf — every font, palette, reference and snippet."}</p>
                    </>
                  )}
                </div>
                <D.Button variant="accent" icon="Plus" onClick={() => app.add(curType ? view : undefined)}>New {curType ? curType.label.toLowerCase() : "item"}</D.Button>
              </div>
              <Toolbar app={app} count={filtered.length} />
              <D.LibraryGrid items={filtered} app={app} />
            </div>
          )}
        </div>
      </div>

      {liveOpen && <D.DetailDrawer item={liveOpen} app={app} />}
      {(creating || editing) && (
        <D.ItemForm presetType={creating} initial={editing} allItems={store.items}
          onClose={() => { setCreating(null); setEditing(null); }}
          onSave={(draft) => {
            if (editing) { store.updateItem(editing.id, draft); D.pushToast("Saved changes", "Check"); }
            else { const it = store.addItem(draft); D.pushToast("Added to shelf", "Check"); setTimeout(() => setOpenItem(it), 60); }
            setCreating(null); setEditing(null);
          }} />
      )}
      {cmdOpen && <CommandPalette app={app} onClose={() => setCmdOpen(false)} />}
      {settingsOpen && <Settings app={app} onClose={() => setSettingsOpen(false)} />}
      {tweaksOpen && <Tweaks prefs={prefs} setPrefs={setPrefs} onClose={() => setTweaksOpen(false)} />}
      <D.ToastHost />
    </div>
  );
}

const TYPE_BLURB = {
  font: "Typefaces worth remembering — with category, license and a live preview. Files are never stored, only metadata.",
  palette: "Color sets you reuse. Copy any HEX, or export the whole palette as CSS variables or design tokens.",
  reference: "Screens and patterns that solve a problem well — with a note on why they work.",
  snippet: "Reusable UI copy, organized by purpose and tone. One click to copy.",
  system: "Public and internal design systems you reference, with their component coverage.",
  image: "Loose visual inspiration — textures, posters, moodboard material.",
  kit: "Per-project bundles of assets and direction. Export any kit as a Markdown design brief.",
};

applyPrefs(D.loadPrefs());
ReactDOM.createRoot(document.getElementById("root")).render(<App />);
