import { useEffect, useRef, useState } from "react";
import { ghostButton, initialsOf } from "./adminConstants";

export function Badge({ className = "", children }) {
  return (
    <span className={`inline-flex items-center rounded-full px-2.5 py-1 text-xs font-semibold ${className}`}>
      {children}
    </span>
  );
}

export function Avatar({ name, email, size = 36, className = "" }) {
  return (
    <span
      style={{ width: size, height: size, fontSize: Math.max(10, Math.round(size * 0.36)) }}
      className={`flex shrink-0 items-center justify-center rounded-full bg-[#101B2C] font-semibold text-white dark:bg-[#BF9A63] dark:text-slate-950 ${className}`}
      aria-hidden="true"
    >
      {initialsOf(name, email)}
    </span>
  );
}

/**
 * Small popover menu. `renderTrigger({ open, toggle })` draws the button;
 * `children` may be a node or `({ close }) => node`. Closes on outside click / Escape.
 */
export function Dropdown({ renderTrigger, children, align = "left", panelClassName = "w-56" }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    if (!open) return undefined;
    const onDown = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false);
    };
    const onKey = (e) => {
      if (e.key === "Escape") setOpen(false);
    };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => setOpen(false);
  return (
    <div ref={ref} className="relative inline-block">
      {renderTrigger({ open, toggle: () => setOpen((v) => !v) })}
      {open && (
        <div
          className={`absolute z-30 mt-1.5 ${align === "right" ? "right-0" : "left-0"} ${panelClassName} overflow-hidden rounded-lg border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] py-1 shadow-[0_12px_32px_rgba(16,27,44,0.18)]`}
        >
          {typeof children === "function" ? children({ close }) : children}
        </div>
      )}
    </div>
  );
}

export function MenuItem({ icon: Icon, children, onClick, danger = false, disabled = false }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={`flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm transition-colors disabled:opacity-50 ${
        danger
          ? "text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-950/30"
          : "text-[#101B2C] hover:bg-[#FAF7F2] dark:text-white dark:hover:bg-[#1B2A42]"
      }`}
    >
      {Icon && <Icon aria-hidden="true" className="h-4 w-4 shrink-0 opacity-70" strokeWidth={1.75} />}
      <span className="min-w-0 flex-1 truncate">{children}</span>
    </button>
  );
}

/** Plain text with http(s) links turned into safe, clickable anchors. */
export function Linkify({ text }) {
  const parts = String(text || "").split(/(https?:\/\/[^\s<]+)/g);
  return parts.map((part, i) => {
    if (i % 2 === 0) return part;
    const trailing = part.match(/[.,;:!?)\]]+$/)?.[0] || "";
    const url = trailing ? part.slice(0, -trailing.length) : part;
    return (
      <span key={i}>
        <a
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className="text-[#A9834E] underline underline-offset-2 hover:text-[#8C6C3F] dark:text-[#D4AF77]"
        >
          {url}
        </a>
        {trailing}
      </span>
    );
  });
}

/** Centered dialog shell shared by the admin modals. Click backdrop / Esc closes unless `busy`. */
export function Modal({ title, onClose, busy = false, maxWidth = "max-w-lg", children }) {
  // Latest handlers live in a ref so the listeners below are attached once, not on every render.
  const latest = useRef({ onClose, busy });
  useEffect(() => {
    latest.current = { onClose, busy };
  });

  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !latest.current.busy) latest.current.onClose();
    };
    document.addEventListener("keydown", onKey);
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previous;
    };
  }, []);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className={`w-full ${maxWidth} rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] shadow-[0_20px_50px_rgba(16,27,44,0.25)]`}
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E7E2D8] dark:border-[#25344D] px-6 py-4">
          <h2 className="text-lg font-semibold text-[#101B2C] dark:text-white">{title}</h2>
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            aria-label="Close"
            className="rounded-md p-1 text-[#7C7669] transition-colors hover:bg-[#FAF7F2] hover:text-[#101B2C] disabled:opacity-50 dark:text-[#9FA8B8] dark:hover:bg-[#1B2A42] dark:hover:text-white"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export function Pagination({ page, pageSize, count, onPage }) {
  const pages = Math.max(1, Math.ceil(count / pageSize));
  if (count <= pageSize) return null;
  const from = (page - 1) * pageSize + 1;
  const to = Math.min(count, page * pageSize);
  return (
    <div className="flex items-center justify-between gap-3 border-t border-[#E7E2D8] dark:border-[#25344D] px-4 py-3 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
      <span>
        {from}–{to} of {count}
      </span>
      <div className="flex items-center gap-2">
        <button type="button" disabled={page <= 1} onClick={() => onPage(page - 1)} className={ghostButton}>
          Previous
        </button>
        <span className="tabular-nums">
          {page} / {pages}
        </span>
        <button type="button" disabled={page >= pages} onClick={() => onPage(page + 1)} className={ghostButton}>
          Next
        </button>
      </div>
    </div>
  );
}