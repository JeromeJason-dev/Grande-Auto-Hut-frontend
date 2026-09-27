import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import * as adminApi from "../../api/admin";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";

// Status colors pulled from the existing design tokens, cycled if there are
// more statuses than colors.
const STATUS_COLORS = ["#BF9A63", "#101B2C", "#5B7BA6", "#A9834E", "#7C7669", "#9FA8B8"];

function Icon({ path, className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <path d={path} />
    </svg>
  );
}

const ICONS = {
  orders: "M3 7h18M3 7l1.5 12A2 2 0 0 0 6.5 21h11a2 2 0 0 0 2-1.8L21 7M3 7l1-3h16l1 3M9 11v4M15 11v4",
  revenue: "M12 2v20M17 5.5c0-1.9-2.2-3.5-5-3.5S7 3.6 7 5.5 9.2 9 12 9s5 1.6 5 3.5-2.2 3.5-5 3.5-5-1.6-5-3.5",
  customers: "M17 21v-2a4 4 0 0 0-4-4H7a4 4 0 0 0-4 4v2M10 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75",
  tickets: "M21 12v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-6M2 12l4-8h12l4 8M2 12h20",
  mpesa: "M12 2v20M2 12h20M2 12a10 10 0 0 1 20 0M2 12a10 10 0 0 0 20 0",
  stock: "M21 8l-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8",
  package: "M21 8l-9-5-9 5 9 5 9-5ZM3 8v8l9 5 9-5V8M12 13v8",
  arrowRight: "M5 12h14M13 6l6 6-6 6",
  alert: "M12 9v4M12 17h.01M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0Z",
};

function StatCard({ label, value, icon, tint }) {
  return (
    <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-5">
      <div className="flex items-center gap-3">
        <span
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg"
          style={{ backgroundColor: `${tint}1A`, color: tint }}
        >
          <Icon path={icon} className="h-4.5 w-4.5" />
        </span>
        <div className="text-xs font-medium text-[#7C7669] dark:text-[#9FA8B8]">{label}</div>
      </div>
      <div className="mt-3 text-2xl font-semibold text-[#101B2C] dark:text-white">{value}</div>
    </div>
  );
}

function OrdersByStatusBars({ entries, total }) {
  const max = Math.max(...entries.map(([, count]) => count), 1);
  return (
    <div className="mt-6 space-y-4">
      {entries.map(([status, count], i) => (
        <div key={status}>
          <div className="flex items-baseline justify-between text-sm">
            <span className="capitalize text-[#1E2430] dark:text-slate-200">{status.replace(/_/g, " ")}</span>
            <span className="font-mono text-xs text-[#7C7669] dark:text-[#9FA8B8]">
              {count} · {total ? Math.round((count / total) * 100) : 0}%
            </span>
          </div>
          <div className="mt-1.5 h-2 rounded-full bg-[#FAF7F2] dark:bg-[#0B1320]">
            <div
              className="h-2 rounded-full transition-all"
              style={{
                width: `${(count / max) * 100}%`,
                backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length],
              }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

function OrdersDonut({ entries, total }) {
  const size = 160;
  const stroke = 20;
  const r = (size - stroke) / 2;
  const circumference = 2 * Math.PI * r;
  let offset = 0;

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90">
          <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#FAF7F2" strokeWidth={stroke} className="dark:stroke-[#0B1320]" />
          {entries.map(([status, count], i) => {
            const fraction = total ? count / total : 0;
            const dash = fraction * circumference;
            const circle = (
              <circle
                key={status}
                cx={size / 2}
                cy={size / 2}
                r={r}
                fill="none"
                stroke={STATUS_COLORS[i % STATUS_COLORS.length]}
                strokeWidth={stroke}
                strokeDasharray={`${dash} ${circumference - dash}`}
                strokeDashoffset={-offset}
                strokeLinecap="butt"
              />
            );
            offset += dash;
            return circle;
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">Total orders</span>
          <span className="text-lg font-semibold text-[#101B2C] dark:text-white">{total}</span>
        </div>
      </div>

      <div className="mt-5 w-full space-y-2">
        {entries.map(([status, count], i) => (
          <div key={status} className="flex items-center justify-between text-sm">
            <span className="flex items-center gap-2 capitalize text-[#1E2430] dark:text-slate-200">
              <span className="h-2 w-2 rounded-full" style={{ backgroundColor: STATUS_COLORS[i % STATUS_COLORS.length] }} />
              {status.replace(/_/g, " ")}
            </span>
            <span className="text-[#7C7669] dark:text-[#9FA8B8]">
              {count} <span className="font-semibold text-[#101B2C] dark:text-white">{total ? Math.round((count / total) * 100) : 0}%</span>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminDashboardPage() {
  const { data, isLoading } = useQuery({ queryKey: ["admin-metrics"], queryFn: adminApi.getAdminMetrics });

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading metrics" />
      </div>
    );
  }
  if (!data) return null;

  const statusEntries = Object.entries(data.orders_by_status || {}).sort((a, b) => b[1] - a[1]);
  const totalOrdersForStatus = statusEntries.reduce((sum, [, count]) => sum + count, 0);

  const alerts = [
    data.low_stock_count > 0 && {
      icon: ICONS.stock,
      tint: "#BF9A63",
      title: `${data.low_stock_count} part${data.low_stock_count === 1 ? "" : "s"} low on stock`,
      subtitle: "Restock before you run out",
      to: "/admin/products",
      cta: "Manage stock",
    },
    data.pending_mpesa_payments > 0 && {
      icon: ICONS.mpesa,
      tint: "#5B7BA6",
      title: `${data.pending_mpesa_payments} M-Pesa payment${data.pending_mpesa_payments === 1 ? "" : "s"} pending`,
      subtitle: "Awaiting confirmation",
      to: "/admin/orders",
      cta: "View orders",
    },
    data.open_tickets > 0 && {
      icon: ICONS.tickets,
      tint: "#A9834E",
      title: `${data.open_tickets} open ticket${data.open_tickets === 1 ? "" : "s"}`,
      subtitle: "Customers waiting on a reply",
      to: "/admin/tickets",
      cta: "View tickets",
    },
  ].filter(Boolean);

  return (
    <div className="space-y-6">
      {/* Stat strip */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total orders" value={data.total_orders} icon={ICONS.orders} tint="#101B2C" />
        <StatCard label="Revenue" value={<Price value={data.revenue_confirmed_and_beyond} size="lg" />} icon={ICONS.revenue} tint="#BF9A63" />
        <StatCard label="Customers" value={data.total_customers} icon={ICONS.customers} tint="#5B7BA6" />
        <StatCard label="Open tickets" value={data.open_tickets} icon={ICONS.tickets} tint="#A9834E" />
        <StatCard label="Pending M-Pesa" value={data.pending_mpesa_payments} icon={ICONS.mpesa} tint="#7C7669" />
        <StatCard label="Low stock parts" value={data.low_stock_count} icon={ICONS.stock} tint="#B5533C" />
      </div>

      {/* Orders by status: bars + donut */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#101B2C] dark:text-white">Orders by status</h3>
            <span className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">{totalOrdersForStatus} total</span>
          </div>
          {statusEntries.length > 0 ? (
            <OrdersByStatusBars entries={statusEntries} total={totalOrdersForStatus} />
          ) : (
            <p className="mt-4 text-sm text-[#7C7669] dark:text-[#9FA8B8]">No orders yet.</p>
          )}
        </div>

        <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-6">
          <h3 className="text-sm font-semibold text-[#101B2C] dark:text-white">Status breakdown</h3>
          <div className="mt-4">
            {statusEntries.length > 0 ? (
              <OrdersDonut entries={statusEntries} total={totalOrdersForStatus} />
            ) : (
              <p className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">No orders yet.</p>
            )}
          </div>
        </div>
      </div>

      {/* Low stock table + alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-6 lg:col-span-2">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#101B2C] dark:text-white">Low stock</h3>
            <Link
              to="/admin/products"
              className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-3 py-1.5 text-xs font-medium text-[#101B2C] dark:text-white transition-colors hover:border-[#BF9A63] hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
            >
              Manage stock
            </Link>
          </div>

          {data.low_stock_products.length > 0 ? (
            <div className="mt-3 divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
              {data.low_stock_products.map((p) => (
                <div key={p.id} className="flex items-center justify-between py-2.5">
                  <span className="text-sm text-[#1E2430] dark:text-slate-200">
                    {p.name} <span className="font-mono text-xs text-[#7C7669] dark:text-[#9FA8B8]">{p.sku}</span>
                  </span>
                  <span className="rounded-full bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 text-xs font-semibold text-amber-700 dark:text-amber-400">
                    {p.stock_quantity} left
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#7C7669] dark:text-[#9FA8B8]">Nothing running low right now.</p>
          )}
        </div>

        <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-6">
          <h3 className="text-sm font-semibold text-[#101B2C] dark:text-white">Needs attention</h3>
          {alerts.length > 0 ? (
            <div className="mt-3 divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
              {alerts.map((a) => (
                <Link
                  key={a.title}
                  to={a.to}
                  className="flex items-center gap-3 py-3 group"
                >
                  <span
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                    style={{ backgroundColor: `${a.tint}1A`, color: a.tint }}
                  >
                    <Icon path={a.icon} className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-sm font-medium text-[#1E2430] dark:text-slate-200">{a.title}</span>
                    <span className="block text-xs text-[#7C7669] dark:text-[#9FA8B8]">{a.subtitle}</span>
                  </span>
                  <Icon path={ICONS.arrowRight} className="h-4 w-4 shrink-0 text-[#7C7669] dark:text-[#9FA8B8] transition-colors group-hover:text-[#BF9A63]" />
                </Link>
              ))}
            </div>
          ) : (
            <p className="mt-4 text-sm text-[#7C7669] dark:text-[#9FA8B8]">Everything's on track.</p>
          )}
        </div>
      </div>
    </div>
  );
}