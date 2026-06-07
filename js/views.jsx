/* =========================================================================
   DesignShelf — views: Dashboard, Library grid, Cards, Detail drawer
   ========================================================================= */
const { useState: vS, useMemo: vM } = React;

function fmtDate(iso) {
  const d = new Date(iso), now = Date.now(), diff = (now - d) / 86400000;
  if (diff < 1) return "today";
  if (diff < 2) return "yesterday";
  if (diff < 30) return Math.floor(diff) + "d ago";
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function FavButton({ item, app }) {
  const { Icon } = window.DS;
  return (
    <button className={"fav-btn" + (item.favorite ? " on" : "")} aria-label="Favorite"
      onClick={(e) => { e.stopPropagation(); app.toggleFav(item.id); }}>
      <Icon name="Heart" />
    </button>
  );
}

// ---- Per-type card preview --------------------------------------------------
function CardPreview({ item }) {
  const { Icon } = window.DS;
  const t = item.type;
  if (t === "font") {
    return (
      <div className="font-pre" style={window.DS.typeVars(t)}>
        <div className="font-glyph" style={{ fontFamily: window.DS.FONT_STACKS[item.category] || "var(--font-ui)" }}>Ag</div>
        <div className="font-sample" style={{ fontFamily: window.DS.FONT_STACKS[item.category] || "var(--font-ui)" }}>
          {item.previewText || "The quick brown fox jumps over the lazy dog"}
        </div>
      </div>
    );
  }
  if (t === "palette") {
    return (
      <div className="swatch-row">
        {(item.colors || []).map((c, i) => (
          <div className="swatch" key={i} style={{ background: c.hex }}>
            <span className="swatch-hex" style={{ color: pickReadable(c.hex) }}>{c.hex.toUpperCase()}</span>
          </div>
        ))}
      </div>
    );
  }
  if (t === "reference" || t === "image") {
    return (
      <div className="shot" style={window.DS.typeVars(t)}>
        {item.platform && t === "reference" && (
          <div className="platform-pill"><span className="pill"><Icon name={platformIcon(item.platform)} />{item.platform}</span></div>
        )}
        <span className="shot-label"><Icon name="ImageOff" />{t === "image" ? "inspiration" : "screenshot"}</span>
      </div>
    );
  }
  if (t === "system") {
    return (
      <div className="font-pre" style={{ ...window.DS.typeVars(t), minHeight: 96, padding: "16px 18px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
          <span style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: "var(--type-soft)", color: "var(--type-color)" }}><Icon name="Boxes" /></span>
          <span className="pill"><Icon name={platformIcon(item.platform)} />{item.platform}</span>
        </div>
        <div className="tags">
          {(item.componentCategories || []).slice(0, 5).map((c) => <span className="tag" key={c}>{c}</span>)}
          {(item.componentCategories || []).length === 0 && <span className="tag">design system</span>}
        </div>
      </div>
    );
  }
  return null;
}

// ---- Library card -----------------------------------------------------------
function LibraryCard({ item, app }) {
  const { Icon, TypeBadge } = window.DS;
  const D = window.DS;
  const t = item.type;
  const linked = t === "kit" ? (item.itemIds || []).map((id) => app.items.find((i) => i.id === id)).filter(Boolean) : [];

  return (
    <article className="card" style={window.DS.typeVars(t)} onClick={() => app.open(item)}>
      <FavButton item={item} app={app} />

      {t === "snippet" ? (
        <div className="card-body snippet-card">
          <div className="card-head"><TypeBadge type={t} /></div>
          <p className="snippet-quote">“{item.text}”</p>
          <div className="card-foot">
            <span className="tone-pill">{item.tone} · {item.category}</span>
            <button className="btn ghost sm" style={{ marginLeft: "auto" }} onClick={(e) => { e.stopPropagation(); D.copyText(item.text).then(() => D.pushToast("Copied snippet", "Copy")); }}>
              <Icon name="Copy" />Copy
            </button>
          </div>
        </div>
      ) : t === "kit" ? (
        <>
          <div className="kit-pre">
            <div className="kit-stack">
              {linked.slice(0, 5).map((l) => (
                <span className="mini" key={l.id} style={window.DS.typeVars(l.type)}>
                  <Icon name={window.DS.TYPE_MAP[l.type].icon} style={{ color: "var(--type-color)" }} />
                </span>
              ))}
              {linked.length > 5 && <span className="kit-more">+{linked.length - 5}</span>}
              {linked.length === 0 && <span className="kit-more">No assets yet</span>}
            </div>
            {item.client && <span className="pill" style={{ alignSelf: "flex-start" }}><Icon name="Building2" />{item.client}</span>}
          </div>
          <div className="card-body">
            <div className="card-head" style={{ justifyContent: "space-between" }}>
              <h3 className="card-title">{item.title}</h3>
            </div>
            {item.description && <p className="card-desc">{item.description}</p>}
            <div className="card-foot">
              <TypeBadge type={t} />
              <span className="result-count" style={{ marginLeft: "auto" }}>{linked.length} assets</span>
            </div>
          </div>
        </>
      ) : (
        <>
          <div className="card-pre"><CardPreview item={item} /></div>
          <div className="card-body">
            <div className="card-head">
              <h3 className="card-title" style={{ flex: 1 }}>{item.title}</h3>
            </div>
            {item.description && <p className="card-desc">{item.description}</p>}
            <div className="card-foot">
              <TypeBadge type={t} />
              {item.tags && item.tags.length > 0 && (
                <span className="result-count" style={{ marginLeft: "auto" }}>{item.tags.slice(0, 2).map((x) => "#" + x).join(" ")}</span>
              )}
            </div>
          </div>
        </>
      )}
    </article>
  );
}

// ---- Library grid view ------------------------------------------------------
function LibraryGrid({ items, app }) {
  if (items.length === 0) {
    return (
      <window.DS.EmptyState icon="SearchX" title="No matches on the shelf"
        examples={["try a broader search", "clear a filter", "switch type"]}>
        Nothing fits those filters yet. Loosen the search, or add something new to your library.
      </window.DS.EmptyState>
    );
  }
  return (
    <div className="lib-grid">
      {items.map((it) => <LibraryCard key={it.id} item={it} app={app} />)}
    </div>
  );
}

// ---- Dashboard --------------------------------------------------------------
function Dashboard({ app }) {
  const { Icon, Button } = window.DS;
  const counts = vM(() => window.DS.countsByType(app.items), [app.items]);
  const total = app.items.length;
  const recent = vM(() => [...app.items].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)).slice(0, 4), [app.items]);
  const favs = vM(() => app.items.filter((i) => i.favorite).slice(0, 4), [app.items]);

  return (
    <div className="page">
      <div className="hero">
        <div style={{ position: "relative", zIndex: 1 }}>
          <div className="eyebrow" style={{ marginBottom: 12 }}>◧ Your private shelf</div>
          <h1>{greeting()}. Everything in one quiet place.</h1>
          <p>Fonts, palettes, UI references, copy and project kits — searchable, exportable, and stored only on this device.</p>
          <div className="hero-actions">
            <Button variant="accent" icon="Plus" onClick={() => app.add()}>Add to shelf</Button>
            <Button icon="Sparkles" onClick={() => app.navigate("kit")}>Build a project kit</Button>
          </div>
        </div>
        <div className="hero-count" style={{ textAlign: "right", position: "relative", zIndex: 1 }}>
          <div className="hero-big">{String(total).padStart(2, "0")}</div>
          <div className="eyebrow hero-count-label" style={{ marginTop: 6 }}>items saved</div>
        </div>
      </div>

      <div className="stat-grid">
        {window.DS.TYPES.map((t) => (
          <div className="stat" key={t.key} style={window.DS.typeVars(t.key)} onClick={() => app.navigate(t.key)}>
            <div className="stat-top">
              <span className="stat-ico" style={{ background: "var(--type-soft)", color: "var(--type-color)" }}><Icon name={t.icon} /></span>
              <Icon name="ArrowUpRight" style={{ width: 15, height: 15, color: "var(--text-faint)" }} />
            </div>
            <div className="stat-num">{counts[t.key]}</div>
            <div className="stat-label">{t.plural}</div>
          </div>
        ))}
      </div>

      <div className="section-head">
        <h2><Icon name="Clock" />Recently added</h2>
        <button className="link-btn" onClick={() => app.navigate("all")}>Browse all<Icon name="ArrowRight" /></button>
      </div>
      {recent.length ? <div className="lib-grid">{recent.map((it) => <LibraryCard key={it.id} item={it} app={app} />)}</div>
        : <window.DS.EmptyState icon="Inbox" title="Your shelf is empty" action={<window.DS.Button variant="accent" icon="Plus" onClick={() => app.add()}>Add your first item</window.DS.Button>}>
            Start by adding a font you love or a palette you keep reusing.
          </window.DS.EmptyState>}

      {favs.length > 0 && (
        <>
          <div className="section-head">
            <h2><Icon name="Heart" />Favorites</h2>
            <button className="link-btn" onClick={() => { app.setFavOnly(true); app.navigate("all"); }}>See all favorites<Icon name="ArrowRight" /></button>
          </div>
          <div className="lib-grid">{favs.map((it) => <LibraryCard key={it.id} item={it} app={app} />)}</div>
        </>
      )}
    </div>
  );
}

// ---- Detail drawer ----------------------------------------------------------
function DetailDrawer({ item, app }) {
  const { Icon, Button, TypeBadge, Drawer } = window.DS;
  const D = window.DS;
  const t = item.type;
  const linked = t === "kit" ? (item.itemIds || []).map((id) => app.items.find((i) => i.id === id)).filter(Boolean) : [];

  const copyHex = (hex) => D.copyText(hex).then(() => D.pushToast(hex.toUpperCase() + " copied", "Copy"));

  return (
    <Drawer onClose={app.close}>
      <div className="drawer-head">
        <TypeBadge type={t} />
        <div style={{ flex: 1 }} />
        <button className={"x-btn"} onClick={() => app.toggleFav(item.id)} aria-label="Favorite" style={{ color: item.favorite ? "var(--accent)" : undefined }}>
          <Icon name="Heart" style={item.favorite ? { fill: "var(--accent)" } : undefined} />
        </button>
        <button className="x-btn" onClick={() => app.edit(item)} aria-label="Edit"><Icon name="Pencil" /></button>
        <button className="x-btn" onClick={() => { if (confirm("Delete “" + item.title + "”? This can't be undone.")) { app.remove(item.id); app.close(); D.pushToast("Deleted", "Trash2"); } }} aria-label="Delete"><Icon name="Trash2" /></button>
        <button className="x-btn" onClick={app.close} aria-label="Close"><Icon name="X" /></button>
      </div>

      <div className="detail-pre" style={window.DS.typeVars(t)}>
        {(t === "font" || t === "palette" || t === "reference" || t === "image" || t === "system") && <CardPreview item={item} />}
      </div>

      <div className="detail-body">
        <div>
          <h1 className="detail-title">{item.title}</h1>
          {item.description && <p className="detail-desc" style={{ marginTop: 8 }}>{item.description}</p>}
        </div>

        {t === "snippet" && (
          <div className="detail-note" style={{ fontSize: 17, color: "var(--text)", lineHeight: 1.5 }}>
            “{item.text}”
            <div style={{ marginTop: 14 }}>
              <Button variant="accent" size="sm" icon="Copy" onClick={() => D.copyText(item.text).then(() => D.pushToast("Copied snippet", "Copy"))}>Copy text</Button>
            </div>
          </div>
        )}

        {/* key-values */}
        <dl className="kv">
          {t === "font" && <><dt>category</dt><dd>{item.category}</dd><dt>license</dt><dd style={{ textTransform: "uppercase", fontFamily: "var(--font-mono)", fontSize: 13 }}>{item.license}</dd></>}
          {t === "reference" && <><dt>category</dt><dd>{item.category}</dd><dt>platform</dt><dd>{item.platform}</dd></>}
          {t === "snippet" && <><dt>category</dt><dd>{item.category}</dd><dt>tone</dt><dd>{item.tone}</dd><dt>language</dt><dd className="mono-input">{item.language}</dd>{item.context && <><dt>context</dt><dd>{item.context}</dd></>}</>}
          {t === "system" && <><dt>platform</dt><dd>{item.platform}</dd>{item.componentCategories?.length > 0 && <><dt>coverage</dt><dd><div className="tags">{item.componentCategories.map((c) => <span className="tag" key={c}>{c}</span>)}</div></dd></>}</>}
          {t === "kit" && <>{item.client && <><dt>client</dt><dd>{item.client}</dd></>}{item.audience && <><dt>audience</dt><dd>{item.audience}</dd></>}</>}
          <dt>added</dt><dd>{new Date(item.createdAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</dd>
        </dl>

        {/* palette full + exports */}
        {t === "palette" && (
          <>
            <div className="divider" />
            <div className="palette-full">
              {(item.colors || []).map((c, i) => (
                <div className="pf-row" key={i} onClick={() => copyHex(c.hex)}>
                  <span className="pf-chip" style={{ background: c.hex }} />
                  <div><div className="pf-name">{c.name}</div><div className="pf-hex">{c.hex.toUpperCase()}</div></div>
                  <span className="pf-copy">click to copy</span>
                </div>
              ))}
            </div>
            <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
              <Button size="sm" icon="Code" onClick={() => D.copyText(D.paletteToCSS(item)).then(() => D.pushToast("CSS variables copied", "Code"))}>Copy CSS vars</Button>
              <Button size="sm" icon="Braces" onClick={() => D.copyText(D.paletteToTokens(item)).then(() => D.pushToast("Tokens JSON copied", "Braces"))}>Copy tokens</Button>
              <Button size="sm" icon="Download" onClick={() => D.download(D.slugify(item.title) + ".tokens.json", D.paletteToTokens(item), "application/json")}>Download tokens</Button>
            </div>
          </>
        )}

        {/* why it works */}
        {t === "reference" && item.whyItWorks && (
          <div className="detail-note"><span className="note-label">Why it works</span>{item.whyItWorks}</div>
        )}

        {/* kit assets + markdown export */}
        {t === "kit" && (
          <>
            {item.direction && <div className="detail-note"><span className="note-label">Creative direction</span>{item.direction}</div>}
            <div className="divider" />
            <div className="section-head" style={{ margin: 0 }}>
              <h2 style={{ fontSize: 14 }}><Icon name="Layers" />Assets ({linked.length})</h2>
              <Button size="sm" variant="accent" icon="FileDown" onClick={() => { D.download(D.slugify(item.title) + ".md", D.kitToMarkdown(item, app.items), "text/markdown"); D.pushToast("Brief exported as Markdown", "FileDown"); }}>Export brief</Button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {linked.map((l) => (
                <button key={l.id} className="pf-row" onClick={() => app.open(l)}>
                  <span className="pf-chip" style={{ ...window.DS.typeVars(l.type), background: "var(--type-soft)", display: "grid", placeItems: "center", color: "var(--type-color)" }}><Icon name={window.DS.TYPE_MAP[l.type].icon} /></span>
                  <div><div className="pf-name">{l.title}</div><div className="pf-hex">{window.DS.TYPE_MAP[l.type].label}</div></div>
                  <Icon name="ArrowRight" style={{ marginLeft: "auto", width: 15, height: 15, color: "var(--text-faint)" }} />
                </button>
              ))}
              {linked.length === 0 && <p className="hint">No assets attached yet. Edit the kit to add some.</p>}
            </div>
          </>
        )}

        {/* notes */}
        {item.notes && t !== "kit" && <div className="detail-note"><span className="note-label">Notes</span>{item.notes}</div>}
        {item.notes && t === "kit" && <div className="detail-note"><span className="note-label">Notes</span>{item.notes}</div>}

        {/* font license reminder */}
        {t === "font" && (
          <p className="hint" style={{ display: "flex", gap: 7, alignItems: "flex-start" }}><Icon name="ShieldAlert" style={{ width: 14, height: 14, color: "var(--accent)", flex: "none", marginTop: 1 }} />DesignShelf stores metadata only — never font files. Check the license before using this font.</p>
        )}

        {/* tags */}
        {item.tags && item.tags.length > 0 && (
          <div className="tags">{item.tags.map((tg) => <span className="tag click" key={tg} onClick={() => { app.addTagFilter(tg); app.close(); app.navigate("all"); }}>#{tg}</span>)}</div>
        )}

        {/* source */}
        {item.sourceUrl && (
          <a className="source-link" href={item.sourceUrl} target="_blank" rel="noreferrer"><Icon name="ExternalLink" />{prettyUrl(item.sourceUrl)}</a>
        )}
      </div>
    </Drawer>
  );
}

// ---- small helpers ----------------------------------------------------------
function greeting() { const h = new Date().getHours(); return h < 5 ? "Late night" : h < 12 ? "Good morning" : h < 18 ? "Good afternoon" : "Good evening"; }
function platformIcon(p) { return ({ web: "Globe", iOS: "Smartphone", Android: "Tablet", desktop: "Monitor", "cross-platform": "LayoutGrid" })[p] || "Globe"; }
function prettyUrl(u) { try { return new URL(u).hostname.replace(/^www\./, ""); } catch (e) { return u; } }
function pickReadable(hex) {
  const c = hex.replace("#", ""); if (c.length < 6) return "#fff";
  const r = parseInt(c.slice(0, 2), 16), g = parseInt(c.slice(2, 4), 16), b = parseInt(c.slice(4, 6), 16);
  return (0.299 * r + 0.587 * g + 0.114 * b) > 150 ? "#111" : "#fff";
}

Object.assign(window.DS, { Dashboard, LibraryGrid, LibraryCard, DetailDrawer, CardPreview, fmtDate });
