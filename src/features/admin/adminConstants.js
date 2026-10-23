import { useEffect, useState } from "react";

/* ------------------------------------------------------------------ constants */

export const TICKET_STATUS_OPTIONS = [
  { value: "open", label: "Open" },
  { value: "in_progress", label: "In progress" },
  { value: "resolved", label: "Resolved" },
  { value: "closed", label: "Closed" },
];

export const PRIORITY_OPTIONS = [
  { value: "low", label: "Low" },
  { value: "medium", label: "Medium" },
  { value: "high", label: "High" },
  { value: "urgent", label: "Urgent" },
];

export const CATEGORY_OPTIONS = [
  { value: "order", label: "Order issue" },
  { value: "product", label: "Product question" },
  { value: "payment", label: "Payment issue" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
];

export const TASK_STATUS_OPTIONS = [
  { value: "todo", label: "To do" },
  { value: "in_progress", label: "In progress" },
  { value: "done", label: "Done" },
];

export const labelOf = (options, value) => options.find((o) => o.value === value)?.label ?? value;

/* ------------------------------------------------------------------ shared classes */

export const cardClasses =
  "rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235]";

export const controlClasses =
  "w-full rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0B1320] px-3 py-2 text-sm text-[#1E2430] dark:text-slate-100 transition-colors placeholder:text-[#9A9385] focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25 disabled:cursor-not-allowed disabled:opacity-60";

export const labelClasses =
  "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]";

export const primaryButton =
  "inline-flex items-center justify-center gap-2 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-2 text-sm font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] dark:disabled:bg-slate-700 disabled:text-[#7C7669] dark:disabled:text-slate-400";

export const ghostButton =
  "inline-flex items-center justify-center gap-2 rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] px-3 py-2 text-sm font-medium text-[#101B2C] dark:text-white transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#1B2A42] disabled:cursor-not-allowed disabled:opacity-50";

export const dangerButton =
  "inline-flex items-center justify-center gap-2 rounded-md bg-red-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50";

export const STATUS_STYLES = {
  open: "bg-amber-50 text-amber-700 dark:bg-amber-950/40 dark:text-amber-400",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  resolved: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
  closed: "bg-[#EDE7DC] text-[#7C7669] dark:bg-[#25344D] dark:text-[#9FA8B8]",
};

export const PRIORITY_STYLES = {
  low: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  medium: "bg-sky-50 text-sky-700 dark:bg-sky-950/40 dark:text-sky-300",
  high: "bg-orange-50 text-orange-700 dark:bg-orange-950/40 dark:text-orange-300",
  urgent: "bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300",
};

export const TASK_STATUS_STYLES = {
  todo: "bg-slate-100 text-slate-600 dark:bg-white/10 dark:text-slate-300",
  in_progress: "bg-blue-50 text-blue-700 dark:bg-blue-950/40 dark:text-blue-400",
  done: "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-400",
};

/* ------------------------------------------------------------------ formatting */

/** A random 14-character password with upper, lower, digit and symbol (no look-alike characters). */
export function generatePassword(length = 14) {
  const sets = ["ABCDEFGHJKLMNPQRSTUVWXYZ", "abcdefghijkmnopqrstuvwxyz", "23456789", "!@#$%&*?"];
  const all = sets.join("");
  const rand = (max) => {
    const buf = new Uint32Array(1);
    // Rejection sampling keeps the choice unbiased.
    const limit = Math.floor(0xffffffff / max) * max;
    do crypto.getRandomValues(buf);
    while (buf[0] >= limit);
    return buf[0] % max;
  };
  const chars = sets.map((set) => set[rand(set.length)]);
  while (chars.length < length) chars.push(all[rand(all.length)]);
  for (let i = chars.length - 1; i > 0; i--) {
    const j = rand(i + 1);
    [chars[i], chars[j]] = [chars[j], chars[i]];
  }
  return chars.join("");
}

export function shortId(id) {
  return id ? `#${String(id).slice(0, 8).toUpperCase()}` : "";
}

export function personName(person) {
  if (!person) return "";
  const full = `${person.first_name || ""} ${person.last_name || ""}`.trim();
  return person.full_name || full || person.name || person.email || "";
}

export function initialsOf(name, email) {
  const parts = (name || "").trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (email?.[0] || "?").toUpperCase();
}

export function formatDateTime(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleString("en-KE", {
    month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit",
  });
}

export function formatShortTime(value) {
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "";
  return d.toLocaleTimeString("en-KE", { hour: "2-digit", minute: "2-digit", hour12: false });
}

export function formatDate(value) {
  if (!value) return "—";
  // Date-only strings (YYYY-MM-DD) must not shift a day through timezone parsing.
  const d = /^\d{4}-\d{2}-\d{2}$/.test(value) ? new Date(`${value}T00:00:00`) : new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-KE", { month: "short", day: "numeric", year: "numeric" });
}

export function timeAgo(value) {
  const then = new Date(value).getTime();
  if (Number.isNaN(then)) return "";
  const seconds = Math.max(0, Math.floor((Date.now() - then) / 1000));
  if (seconds < 45) return "just now";
  const steps = [
    ["year", 31536000], ["month", 2592000], ["day", 86400], ["hour", 3600], ["minute", 60],
  ];
  for (const [name, size] of steps) {
    const n = Math.floor(seconds / size);
    if (n >= 1) return `${n} ${name}${n === 1 ? "" : "s"} ago`;
  }
  return "just now";
}

export function formatBytes(bytes) {
  if (bytes == null) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Current time as state, refreshed on an interval, so "overdue" labels flip without a reload. */
export function useNow(intervalMs = 60_000) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), intervalMs);
    return () => clearInterval(timer);
  }, [intervalMs]);
  return now;
}