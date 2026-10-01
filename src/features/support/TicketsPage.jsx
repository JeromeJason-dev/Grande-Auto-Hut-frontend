import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as supportApi from "../../api/support";
import { unwrapList } from "../../api/client";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";

const STATUS_STYLES = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  closed: "bg-[#E7E2D8] text-[#7C7669] dark:bg-slate-800 dark:text-slate-400",
};

const STATUS_LABEL = { open: "Open", in_progress: "In Progress", resolved: "Resolved", closed: "Closed" };
const ALL_STATUSES = Object.keys(STATUS_LABEL);
const PAGE_SIZES = [10, 25, 50];

const controlClasses =
  "h-10 rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#0B1320] px-3 text-sm text-[#101B2C] dark:text-white placeholder:text-[#7C7669] dark:placeholder:text-[#9FA8B8] focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20";

/* ---------- helpers ---------- */

function ticketDate(t) {
  return t.updated_at || t.created_at || null;
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString("en-KE");
}

const SORTERS = {
  issue: (t) => (t.subject || "").toLowerCase(),
  date: (t) => new Date(ticketDate(t) || 0).getTime(),
  status: (t) => STATUS_LABEL[t.status] || t.status || "",
};

function pageList(current, total) {
  if (total <= 6) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current, current - 1, current + 1]);
  const sorted = [...pages].filter((p) => p >= 1 && p <= total).sort((a, b) => a - b);
  const out = [];
  sorted.forEach((p, i) => {
    if (i && p - sorted[i - 1] > 1) out.push("…");
    out.push(p);
  });
  return out;
}

/* ---------- icons ---------- */

const Svg = ({ children, size = 16 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
    {children}
  </svg>
);
const CalendarIcon = () => <Svg><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>;
const EyeIcon = () => <Svg size={14}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>;
const ChevronLeft = () => <Svg><path d="m15 18-6-6 6-6" /></Svg>;
const ChevronRight = () => <Svg><path d="m9 18 6-6-6-6" /></Svg>;
const PlusIcon = () => <Svg size={14}><path d="M12 5v14M5 12h14" /></Svg>;
const SortIcon = ({ active, dir }) => (
  <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true" className="ml-1.5 inline-block">
    <path d="M5 1 8.5 5h-7z" fill="currentColor" opacity={active && dir === "asc" ? 1 : 0.3} />
    <path d="M5 13 1.5 9h7z" fill="currentColor" opacity={active && dir === "desc" ? 1 : 0.3} />
  </svg>
);

/* ---------- table header cell ---------- */

function Th({ children, sortKey, sort, onSort, className = "" }) {
  return (
    <th className={`px-5 py-3.5 text-left text-xs font-semibold text-[#101B2C] dark:text-white whitespace-nowrap ${className}`}>
      {sortKey ? (
        <button type="button" onClick={() => onSort(sortKey)} className="inline-flex items-center hover:text-[#A9834E] dark:hover:text-[#BF9A63]">
          {children}
          <SortIcon active={sort.key === sortKey} dir={sort.dir} />
        </button>
      ) : (
        children
      )}
    </th>
  );
}

/* ---------- page ---------- */

export default function TicketsPage() {
  const [statusFilter, setStatusFilter] = useState("");
  const [showDates, setShowDates] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({ queryKey: ["tickets"], queryFn: supportApi.listTickets });
  const tickets = unwrapList(data);

  const visible = useMemo(() => {
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() + 86400000 - 1 : null;
    const list = tickets.filter((t) => {
      if (statusFilter && t.status !== statusFilter) return false;
      if (fromTs || toTs) {
        const ts = new Date(ticketDate(t) || 0).getTime();
        if (!ts) return false;
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
      }
      return true;
    });
    const get = SORTERS[sort.key];
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => (get(a) > get(b) ? dir : get(a) < get(b) ? -dir : 0));
  }, [tickets, statusFilter, from, to, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = visible.slice(start, start + pageSize);

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const hasFilters = Boolean(statusFilter || from || to);

  const pageBtn =
    "flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm transition-colors";

  return (
    <div className="min-h-full bg-[#FAF7F2] dark:bg-[#0B121F] transition-colors duration-200">
      <div className="w-full p-8">
        {/* CTA — outside the card, top right */}
        <div className="mb-4 flex justify-end">
          <Link
            to="/support/new"
            className="inline-flex h-10 items-center gap-2 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 text-sm font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E]"
          >
            <PlusIcon />
            New ticket
          </Link>
        </div>

        <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235]">
          {/* header */}
          <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-5">
            <div>
              <h1 className="text-xl font-semibold text-[#101B2C] dark:text-white">Support tickets</h1>
              <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
                Track your requests and follow up on replies.
              </p>
            </div>

            <div className="relative flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => setShowDates((v) => !v)}
                className={`${controlClasses} inline-flex items-center gap-2`}
              >
                {from || to ? `${from || "…"} to ${to || "…"}` : "Date range"}
                <CalendarIcon />
              </button>

              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
                aria-label="Filter by status"
                className={controlClasses}
              >
                <option value="">All status</option>
                {ALL_STATUSES.map((s) => (
                  <option key={s} value={s}>{STATUS_LABEL[s]}</option>
                ))}
              </select>

              {showDates && (
                <div className="absolute right-0 top-12 z-20 flex items-end gap-3 rounded-lg border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-4 shadow-lg">
                  <label className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                    From
                    <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={`${controlClasses} mt-1 block`} />
                  </label>
                  <label className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                    To
                    <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={`${controlClasses} mt-1 block`} />
                  </label>
                  <button
                    type="button"
                    onClick={() => { setFrom(""); setTo(""); setPage(1); setShowDates(false); }}
                    className="h-10 rounded-md px-3 text-sm font-medium text-[#7C7669] dark:text-[#9FA8B8] hover:text-[#101B2C] dark:hover:text-white"
                  >
                    Clear
                  </button>
                </div>
              )}
            </div>
          </div>

          {isLoading ? (
            <div className="flex justify-center py-16">
              <Spinner label="Loading tickets" />
            </div>
          ) : visible.length === 0 ? (
            <div className="border-t border-[#E7E2D8] dark:border-[#25344D] px-6 py-16">
              {hasFilters ? (
                <p className="text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]">
                  No tickets match these filters.
                </p>
              ) : (
                <EmptyState
                  title="No tickets yet"
                  body="Open a ticket if you need help with an order, product, or payment."
                />
              )}
            </div>
          ) : (
            <>
              <div className="overflow-x-auto px-3">
                <table className="w-full min-w-[600px]">
                  <thead className="bg-[#FAF7F2] dark:bg-[#0B1320]">
                    <tr>
                      <Th sortKey="issue" sort={sort} onSort={toggleSort} className="rounded-l-lg">Issue</Th>
                      <Th sortKey="date" sort={sort} onSort={toggleSort}>Date</Th>
                      <Th sortKey="status" sort={sort} onSort={toggleSort}>Status</Th>
                      <Th className="rounded-r-lg text-right">Action</Th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#E7E2D8]/70 dark:divide-[#25344D]">
                    {rows.map((t) => (
                      <tr key={t.id} className="text-sm text-[#101B2C] dark:text-white transition-colors hover:bg-[#FAF7F2]/70 dark:hover:bg-[#0B1320]/50">
                        <td className="px-5 py-4">
                          <Link to={`/support/${t.id}`} className="font-medium hover:text-[#A9834E] dark:hover:text-[#BF9A63]">
                            {t.subject}
                          </Link>
                          <p className="mt-0.5 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                            {t.message_count} message{t.message_count !== 1 && "s"}
                          </p>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">{formatDate(ticketDate(t))}</td>
                        <td className="px-5 py-4">
                          <span
                            className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[t.status] || STATUS_STYLES.closed}`}
                          >
                            {STATUS_LABEL[t.status] || t.status}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex justify-end">
                            <Link
                              to={`/support/${t.id}`}
                              aria-label={`View ticket ${t.subject}`}
                              title="View ticket"
                              className="flex h-7 w-7 items-center justify-center rounded-md bg-emerald-100 text-emerald-700 transition-colors hover:bg-emerald-600 hover:text-white dark:bg-emerald-500/15 dark:text-emerald-300"
                            >
                              <EyeIcon />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* footer */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-6">
                <div className="flex items-center gap-2 text-[#101B2C] dark:text-white">
                  <button
                    type="button"
                    onClick={() => setPage(current - 1)}
                    disabled={current === 1}
                    aria-label="Previous page"
                    className={`${pageBtn} border-[#E7E2D8] dark:border-[#25344D] disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <ChevronLeft />
                  </button>
                  {pageList(current, pageCount).map((p, i) =>
                    p === "…" ? (
                      <span key={`gap-${i}`} className="px-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">…</span>
                    ) : (
                      <button
                        key={p}
                        type="button"
                        onClick={() => setPage(p)}
                        aria-current={p === current ? "page" : undefined}
                        className={`${pageBtn} ${
                          p === current
                            ? "border-transparent bg-[#101B2C] text-white dark:bg-[#BF9A63] dark:text-[#0B1320]"
                            : "border-transparent hover:bg-[#FAF7F2] dark:hover:bg-[#0B1320]"
                        }`}
                      >
                        {p}
                      </button>
                    )
                  )}
                  <button
                    type="button"
                    onClick={() => setPage(current + 1)}
                    disabled={current === pageCount}
                    aria-label="Next page"
                    className={`${pageBtn} border-[#E7E2D8] dark:border-[#25344D] disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    <ChevronRight />
                  </button>
                </div>

                <div className="flex items-center gap-4 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                  <span>
                    Showing {start + 1} to {Math.min(start + pageSize, visible.length)} of {visible.length} entries
                  </span>
                  <select
                    value={pageSize}
                    onChange={(e) => { setPageSize(Number(e.target.value)); setPage(1); }}
                    aria-label="Rows per page"
                    className={`${controlClasses} h-9 text-xs`}
                  >
                    {PAGE_SIZES.map((n) => (
                      <option key={n} value={n}>Show {n}</option>
                    ))}
                  </select>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}