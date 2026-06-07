/* =========================================================================
   DesignShelf — UI primitives
   ========================================================================= */
const {
  useState: uS,
  useEffect: uE,
  useRef: uR,
  useCallback: uC,
  useId: uI,
} = React;

// ---- Icon: renders real Lucide paths ---------------------------------------
const SVG_ATTR_MAP = { "stroke-width": "strokeWidth", "stroke-linecap": "strokeLinecap", "stroke-linejoin": "strokeLinejoin", "stroke-dasharray": "strokeDasharray", "fill-rule": "fillRule", "clip-rule": "clipRule", "stroke-miterlimit": "strokeMiterlimit" };
function normAttrs(a) {
  const o = {};
  for (const k in a) o[SVG_ATTR_MAP[k] || k] = a[k];
  return o;
}
function renderLucideChild(entry, i) {
  if (!Array.isArray(entry)) return null;
  const [tag, attrs, kids] = entry;
  return React.createElement(tag, { key: i, ...normAttrs(attrs) }, Array.isArray(kids) ? kids.map(renderLucideChild) : undefined);
}
function Icon({ name, size, className = "", style, ...rest }) {
  const node = (window.lucide && (window.lucide.icons?.[name] || window.lucide[name])) || null;
  const extra = size ? { width: size, height: size } : {};
  // each lucide icon === ["svg", svgAttrs, [children]]
  if (!Array.isArray(node) || node[0] !== "svg") {
    return <svg className={"lucide " + className} viewBox="0 0 24 24" style={{ ...extra, ...style }} {...rest}><circle cx="12" cy="12" r="3" fill="currentColor" stroke="none" /></svg>;
  }
  const [, attrs, children = []] = node;
  return React.createElement("svg", {
    ...normAttrs(attrs), className: "lucide " + className,
    style: { ...extra, ...style }, ...rest,
  }, (children || []).map(renderLucideChild));
}

// ---- Button ----------------------------------------------------------------
function Button({ variant = "default", size, icon, iconRight, children, className = "", ...rest }) {
  const cls = ["btn", variant !== "default" ? variant : "", size === "sm" ? "sm" : "", !children ? "icon" : "", className].filter(Boolean).join(" ");
  return (
    <button className={cls} {...rest}>
      {icon && <Icon name={icon} />}
      {children}
      {iconRight && <Icon name={iconRight} />}
    </button>
  );
}

// ---- Type badge ------------------------------------------------------------
function TypeBadge({ type, withIcon = true }) {
  const t = window.DS.TYPE_MAP[type];
  if (!t) return null;
  return (
    <span className="type-badge" style={window.DS.typeVars(type)}>
      {withIcon && <Icon name={t.icon} />}{t.label}
    </span>
  );
}

function TypeDot({ type }) {
  const t = window.DS.TYPE_MAP[type];
  return <span className="type-dot" style={{ background: window.DS.typeColor(t.hue) }} />;
}

// ---- Tag -------------------------------------------------------------------
function Tag({ children, onClick }) {
  return <span className={"tag" + (onClick ? " click" : "")} onClick={onClick}>{onClick ? "#" : ""}{children}</span>;
}

// ---- Modal -----------------------------------------------------------------
function Modal({ title, onClose, children, footer, wide }) {
  uE(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="modal" style={wide ? { width: "min(820px, 95vw)" } : undefined} role="dialog" aria-modal="true">
        <div className="modal-head">
          <h2>{title}</h2>
          <button className="x-btn" onClick={onClose} aria-label="Close"><Icon name="X" /></button>
        </div>
        <div className="modal-body">{children}</div>
        {footer && <div className="modal-foot">{footer}</div>}
      </div>
    </div>
  );
}

// ---- Drawer ----------------------------------------------------------------
function Drawer({ onClose, children }) {
  uE(() => {
    const onKey = (e) => { if (e.key === "Escape") onClose(); };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [onClose]);
  return (
    <div className="scrim" onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}>
      <div className="drawer" role="dialog" aria-modal="true">{children}</div>
    </div>
  );
}

// ---- Form Field ------------------------------------------------------------
function Field({ label, required, hint, error, children }) {
  const generatedId = uI().replace(/:/g, "");
  const controlId = `field-${generatedId}`;
  const messageId = `${controlId}-message`;
  const child = React.Children.count(children) === 1
    ? React.Children.only(children)
    : children;
  const isNativeControl = React.isValidElement(child)
    && ["input", "select", "textarea"].includes(child.type);
  const resolvedControlId = isNativeControl
    ? (child.props.id || controlId)
    : undefined;
  const control = isNativeControl
    ? React.cloneElement(child, {
      id: resolvedControlId,
      "aria-describedby": hint || error ? messageId : undefined,
      "aria-invalid": error ? true : undefined,
    })
    : child;

  return (
    <div className="field">
      {label && (
        <label htmlFor={resolvedControlId}>
          {label}{required && <span className="req">*</span>}
        </label>
      )}
      {control}
      {error ? (
        <span id={messageId} className="err-text">{error}</span>
      ) : hint ? (
        <span id={messageId} className="hint">{hint}</span>
      ) : null}
    </div>
  );
}

// ---- Choice chips (single or multi) ----------------------------------------
function ChoiceChips({ options, value, onChange, multi, withDot }) {
  const isOn = (o) => multi ? (value || []).includes(o) : value === o;
  const toggle = (o) => {
    if (multi) {
      const set = new Set(value || []);
      set.has(o) ? set.delete(o) : set.add(o);
      onChange([...set]);
    } else onChange(value === o ? "" : o);
  };
  return (
    <div className="choice-wrap">
      {options.map((o) => (
        <button type="button" key={o} className={"choice" + (isOn(o) ? " on" : "")} onClick={() => toggle(o)}>
          {withDot && <span className="dot" />}{o}
        </button>
      ))}
    </div>
  );
}

// ---- Tag input -------------------------------------------------------------
function TagInput({ value = [], onChange, placeholder = "Add tag, Enter…" }) {
  const [draft, setDraft] = uS("");
  const add = (t) => { const v = t.trim().replace(/^#/, ""); if (v && !value.includes(v)) onChange([...value, v]); setDraft(""); };
  return (
    <div className="taginput" onClick={(e) => e.currentTarget.querySelector("input").focus()}>
      {value.map((t) => (
        <span className="tag-pill" key={t}>#{t}
          <button type="button" onClick={() => onChange(value.filter((x) => x !== t))}><Icon name="X" /></button>
        </span>
      ))}
      <input value={draft} placeholder={placeholder}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") { e.preventDefault(); add(draft); }
          else if (e.key === "Backspace" && !draft && value.length) onChange(value.slice(0, -1));
        }}
        onBlur={() => draft && add(draft)} />
    </div>
  );
}

// ---- Empty state -----------------------------------------------------------
function EmptyState({ icon = "Inbox", title, children, examples, action }) {
  return (
    <div className="empty">
      <div className="empty-ico"><Icon name={icon} /></div>
      <h3>{title}</h3>
      <p>{children}</p>
      {examples && (
        <div className="empty-examples">
          {examples.map((e) => <span className="tag" key={e}>{e}</span>)}
        </div>
      )}
      {action && <div style={{ marginTop: 14 }}>{action}</div>}
    </div>
  );
}

// ---- Toast bus -------------------------------------------------------------
const toastBus = { fns: new Set() };
function pushToast(msg, icon = "Check") { toastBus.fns.forEach((fn) => fn({ id: Math.random(), msg, icon })); }
function ToastHost() {
  const [toasts, setToasts] = uS([]);
  uE(() => {
    const fn = (t) => {
      setToasts((p) => [...p, t]);
      setTimeout(() => setToasts((p) => p.filter((x) => x.id !== t.id)), 2600);
    };
    toastBus.fns.add(fn);
    return () => toastBus.fns.delete(fn);
  }, []);
  return (
    <div className="toast-wrap">
      {toasts.map((t) => (
        <div className="toast" key={t.id}><Icon name={t.icon} />{t.msg}</div>
      ))}
    </div>
  );
}

Object.assign(window.DS, {
  Icon, Button, TypeBadge, TypeDot, Tag, Modal, Drawer, Field,
  ChoiceChips, TagInput, EmptyState, ToastHost, pushToast,
});
