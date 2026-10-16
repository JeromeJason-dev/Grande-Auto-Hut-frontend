import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ordersApi from "../../api/orders";
import { unwrapList, extractErrorMessage } from "../../api/client";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";

const NEXT_STATUS = {
  pending: ["confirmed", "cancelled"],
  confirmed: ["processing", "cancelled"],
  processing: ["in_transit", "cancelled"],
  in_transit: ["delivered"],
  delivered: [],
  cancelled: [],
};

const ALL_STATUSES = ["pending", "confirmed", "processing", "in_transit", "delivered", "cancelled"];
const PAYMENT_OPTIONS = ["pending", "paid", "failed"];
const PAGE_SIZES = [10, 25, 50];

const controlClasses =
  "h-10 rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#0B1320] px-3 text-sm text-[#101B2C] dark:text-white placeholder:text-[#7C7669] dark:placeholder:text-[#9FA8B8] focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20";

const PAYMENT_STYLES = {
  paid: "text-emerald-600 dark:text-emerald-400",
  completed: "text-emerald-600 dark:text-emerald-400",
  pending: "text-amber-600 dark:text-amber-400",
  failed: "text-orange-600 dark:text-orange-400",
  refunded: "text-slate-500 dark:text-slate-400",
};

/* ---------- helpers ---------- */

const label = (s) => (s || "").replace(/_/g, " ");
const capitalize = (s) => label(s).replace(/^\w/, (c) => c.toUpperCase());

function customerName(o) {
  return (
    o.customer_name ||
    o.customer?.full_name ||
    o.customer?.name ||
    o.customer_email ||
    o.user?.email ||
    o.email ||
    "—"
  );
}

function orderDate(o) {
  return o.created_at || o.placed_at || o.date || null;
}

function formatDate(v) {
  if (!v) return "—";
  const d = new Date(v);
  return Number.isNaN(d.getTime()) ? "—" : d.toLocaleDateString();
}

const SORTERS = {
  order: (o) => o.order_number || "",
  customer: (o) => customerName(o).toLowerCase(),
  date: (o) => new Date(orderDate(o) || 0).getTime(),
  amount: (o) => Number(o.total) || 0,
  quantity: (o) => Number(o.total_quantity ?? o.items_count) || 0,
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
const SearchIcon = () => <Svg><circle cx="11" cy="11" r="8" /><path d="m21 21-4.3-4.3" /></Svg>;
const CalendarIcon = () => <Svg><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></Svg>;
const EyeIcon = () => <Svg size={14}><path d="M2 12s3.5-7 10-7 10 7 10 7-3.5 7-10 7S2 12 2 12z" /><circle cx="12" cy="12" r="3" /></Svg>;
const ChevronLeft = () => <Svg><path d="m15 18-6-6 6-6" /></Svg>;
const ChevronRight = () => <Svg><path d="m9 18 6-6-6-6" /></Svg>;
const SortIcon = ({ active, dir }) => (
  <svg width="10" height="14" viewBox="0 0 10 14" aria-hidden="true" className="ml-1.5 inline-block">
    <path d="M5 1 8.5 5h-7z" fill="currentColor" opacity={active && dir === "asc" ? 1 : 0.3} />
    <path d="M5 13 1.5 9h7z" fill="currentColor" opacity={active && dir === "desc" ? 1 : 0.3} />
  </svg>
);

/* ---------- sortable table header ---------- */

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

/* ---------- inline editors ---------- */

// Selects get an explicit dark background + `color-scheme` so the browser's
// native dropdown popup also renders dark in dark theme.
const selectBase =
  "h-8 rounded-md border bg-white dark:bg-[#0B1320] dark:[color-scheme:dark] pl-2 pr-7 text-xs font-medium capitalize focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/30 disabled:cursor-wait disabled:opacity-60";

// Shared by every <option> so the popup list is readable in both themes.
const optionClasses = "bg-white text-[#101B2C] dark:bg-[#0B1320] dark:text-white";

// Order status: only the transitions the backend allows from the current state.
// Delivered / cancelled are final, so they stay a plain badge.
function OrderStatusEditor({ order, busy, onChange }) {
  const next = NEXT_STATUS[order.status] || [];
  if (next.length === 0) return <OrderStatusBadge status={order.status} />;
  return (
    <select
      value={order.status}
      disabled={busy}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Order status for ${order.order_number}`}
      className={`${selectBase} border-[#E7E2D8] dark:border-[#25344D] text-[#101B2C] dark:text-white`}
    >
      <option value={order.status} className={optionClasses}>{capitalize(order.status)}</option>
      {next.map((s) => (
        <option key={s} value={s} className={optionClasses}>{capitalize(s)}</option>
      ))}
    </select>
  );
}

function PaymentStatusEditor({ order, busy, onChange }) {
  const pay = (order.payment_status || "pending").toLowerCase();
  return (
    <select
      value={pay}
      disabled={busy}
      onChange={(e) => onChange(e.target.value)}
      aria-label={`Payment status for ${order.order_number}`}
      className={`${selectBase} border-[#E7E2D8] dark:border-[#25344D] ${PAYMENT_STYLES[pay] || ""}`}
    >
      {PAYMENT_OPTIONS.map((s) => (
        <option key={s} value={s} className={optionClasses}>{capitalize(s)}</option>
      ))}
    </select>
  );
}

/* ---------- row actions ---------- */

function ActionButtons({ order }) {
  const base = "flex h-7 w-7 items-center justify-center rounded-md transition-colors";
  return (
    <div className="relative flex justify-end gap-2">
      <Link
        to={`/orders/${order.id}`}
        aria-label={`View order ${order.order_number}`}
        title="View order"
        className={`${base} bg-emerald-100 text-emerald-700 hover:bg-emerald-600 hover:text-white dark:bg-emerald-500/15 dark:text-emerald-300`}
      >
        <EyeIcon />
      </Link>
    </div>
  );
}

/* ---------- page ---------- */

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [search, setSearch] = useState("");
  const [showDates, setShowDates] = useState(false);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [sort, setSort] = useState({ key: "date", dir: "desc" });
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [error, setError] = useState("");

  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: () =>
      ordersApi.listOrders({ page_size: 100, ...(statusFilter ? { status: statusFilter } : {}) }),
  });
  const orders = unwrapList(data);

  // Which row/field is mid-save, so only that dropdown is disabled.
  const [saving, setSaving] = useState(null); // `${orderId}:status` | `${orderId}:payment`

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    queryClient.invalidateQueries({ queryKey: ["orders"] });
    queryClient.invalidateQueries({ queryKey: ["order"] });
    queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
  };

  const runUpdate = (key, request) => {
    setError("");
    setSaving(key);
    return request()
      .then(refresh)
      .catch((err) => {
        setError(extractErrorMessage(err));
        // Re-fetch so the dropdown snaps back to the real server value.
        refresh();
      })
      .finally(() => setSaving(null));
  };

  const changeStatus = (order, status) => {
    if (status === order.status) return;
    if (
      status === "cancelled" &&
      !window.confirm(`Cancel order ${order.order_number}? This can't be undone and any reserved stock is returned.`)
    ) {
      return;
    }
    runUpdate(`${order.id}:status`, () => ordersApi.updateOrderStatus(order.id, status));
  };

  const changePayment = (order, paymentStatus) => {
    if (paymentStatus === (order.payment_status || "").toLowerCase()) return;
    runUpdate(`${order.id}:payment`, () => ordersApi.updatePaymentStatus(order.id, paymentStatus));
  };

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    const fromTs = from ? new Date(from).getTime() : null;
    const toTs = to ? new Date(to).getTime() + 86400000 - 1 : null;
    const list = orders.filter((o) => {
      if (q && !`${o.order_number} ${customerName(o)}`.toLowerCase().includes(q)) return false;
      if (fromTs || toTs) {
        const ts = new Date(orderDate(o) || 0).getTime();
        if (!ts) return false;
        if (fromTs && ts < fromTs) return false;
        if (toTs && ts > toTs) return false;
      }
      return true;
    });
    const get = SORTERS[sort.key];
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => (get(a) > get(b) ? dir : get(a) < get(b) ? -dir : 0));
  }, [orders, search, from, to, sort]);

  const pageCount = Math.max(1, Math.ceil(visible.length / pageSize));
  const current = Math.min(page, pageCount);
  const start = (current - 1) * pageSize;
  const rows = visible.slice(start, start + pageSize);

  const toggleSort = (key) => {
    setSort((s) => (s.key === key ? { key, dir: s.dir === "asc" ? "desc" : "asc" } : { key, dir: "asc" }));
  };

  const pageBtn =
    "flex h-9 min-w-9 items-center justify-center rounded-md border px-2 text-sm transition-colors";

  return (
    <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235]">
      {/* header */}
      <div className="flex flex-wrap items-start justify-between gap-4 p-6 pb-5">
        <div>
          <h2 className="text-xl font-semibold text-[#101B2C] dark:text-white">Recent orders</h2>
          <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
            Manage, track, and update all customer orders.
          </p>
        </div>

        <div className="relative flex flex-wrap items-center gap-3">
          <label className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7C7669] dark:text-[#9FA8B8]">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              placeholder="Search order or customer"
              aria-label="Search orders"
              className={`${controlClasses} w-56 pl-9`}
            />
          </label>

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
            className={`${controlClasses} dark:[color-scheme:dark]`}
          >
            <option value="" className={optionClasses}>All status</option>
            {ALL_STATUSES.map((s) => (
              <option key={s} value={s} className={optionClasses}>{capitalize(s)}</option>
            ))}
          </select>

          {showDates && (
            <div className="absolute right-0 top-12 z-20 flex items-end gap-3 rounded-lg border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-4 shadow-lg">
              <label className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                From
                <input type="date" value={from} onChange={(e) => { setFrom(e.target.value); setPage(1); }} className={`${controlClasses} dark:[color-scheme:dark] mt-1 block`} />
              </label>
              <label className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                To
                <input type="date" value={to} onChange={(e) => { setTo(e.target.value); setPage(1); }} className={`${controlClasses} dark:[color-scheme:dark] mt-1 block`} />
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

      {error && (
        <div className="px-6 pb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading orders" />
        </div>
      ) : visible.length === 0 ? (
        <div className="border-t border-[#E7E2D8] dark:border-[#25344D] px-6 py-16 text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]">
          No orders match these filters.
        </div>
      ) : (
        <>
          <div className="overflow-x-auto px-3">
            <table className="w-full min-w-[900px]">
              <thead className="bg-[#FAF7F2] dark:bg-[#0B1320]">
                <tr>
                  <Th sortKey="order" sort={sort} onSort={toggleSort} className="rounded-l-lg">Order ID</Th>
                  <Th sortKey="customer" sort={sort} onSort={toggleSort}>Customer</Th>
                  <Th sortKey="date" sort={sort} onSort={toggleSort}>Date</Th>
                  <Th sortKey="amount" sort={sort} onSort={toggleSort}>Amount</Th>
                  <Th sortKey="quantity" sort={sort} onSort={toggleSort}>Quantity</Th>
                  <Th>Payment</Th>
                  <Th>Status</Th>
                  <Th className="rounded-r-lg text-right">Action</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2D8]/70 dark:divide-[#25344D]">
                {rows.map((o) => {
                  return (
                    <tr key={o.id} className="text-sm text-[#101B2C] dark:text-white transition-colors hover:bg-[#FAF7F2]/70 dark:hover:bg-[#0B1320]/50">
                      <td className="px-5 py-4 font-mono text-[13px] font-medium">
                        <Link to={`/orders/${o.id}`} className="hover:text-[#A9834E] dark:hover:text-[#BF9A63]">
                          {o.order_number}
                        </Link>
                      </td>
                      <td className="px-5 py-4">{customerName(o)}</td>
                      <td className="px-5 py-4 whitespace-nowrap">{formatDate(orderDate(o))}</td>
                      <td className="px-5 py-4"><Price value={o.total} /></td>
                      <td className="px-5 py-4">{o.total_quantity ?? o.items_count}</td>
                      <td className="px-5 py-4">
                        <PaymentStatusEditor
                          order={o}
                          busy={saving === `${o.id}:payment`}
                          onChange={(v) => changePayment(o, v)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <OrderStatusEditor
                          order={o}
                          busy={saving === `${o.id}:status`}
                          onChange={(v) => changeStatus(o, v)}
                        />
                      </td>
                      <td className="px-5 py-4">
                        <ActionButtons order={o} />
                      </td>
                    </tr>
                  );
                })}
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
                className={`${controlClasses} dark:[color-scheme:dark] h-9 text-xs`}
              >
                {PAGE_SIZES.map((n) => (
                  <option key={n} value={n} className={optionClasses}>Show {n}</option>
                ))}
              </select>
            </div>
          </div>
        </>
      )}
    </div>
  );
}