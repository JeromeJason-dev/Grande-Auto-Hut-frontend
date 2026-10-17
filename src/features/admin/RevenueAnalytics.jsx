import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { extractErrorMessage } from "../../api/client";
import RevenueBarChart from "../../components/RevenueBarChart";
import { formatKES } from "../../api/ChartFormat";
import Spinner from "../../components/Spinner";

const CARD = "rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235]";

function Change({ pct, suffix }) {
  if (pct === null || pct === undefined) {
    return <span className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">No prior data</span>;
  }
  const up = pct >= 0;
  return (
    <span className={`text-xs font-semibold ${up ? "text-emerald-600 dark:text-emerald-400" : "text-red-600 dark:text-red-400"}`}>
      {up ? "▲" : "▼"} {Math.abs(pct)}%{" "}
      <span className="font-normal text-[#7C7669] dark:text-[#9FA8B8]">{suffix}</span>
    </span>
  );
}

function Kpi({ label, value, footer }) {
  return (
    <div className={`${CARD} p-5`}>
      <div className="text-xs font-medium text-[#7C7669] dark:text-[#9FA8B8]">{label}</div>
      <div className="mt-2 font-mono text-xl font-semibold text-[#101B2C] dark:text-white">{value}</div>
      <div className="mt-1 min-h-4">{footer}</div>
    </div>
  );
}

export default function RevenueAnalytics() {
  const [year, setYear] = useState(null); // null -> server picks the current year

  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ["admin-revenue-analytics", year],
    queryFn: () => adminApi.getRevenueAnalytics(year),
    placeholderData: keepPreviousData, // keep the old chart on screen while a new year loads
  });

  if (isLoading) {
    return (
      <div className={`${CARD} flex justify-center p-6`}>
        <Spinner label="Loading revenue analytics" />
      </div>
    );
  }

  if (isError || !data) {
    return (
      <div className={`${CARD} p-6`}>
        <h3 className="text-sm font-semibold text-[#101B2C] dark:text-white">Revenue analytics</h3>
        <p className="mt-2 text-sm text-red-600 dark:text-red-400">
          {extractErrorMessage(error, "Couldn't load revenue analytics.")}
        </p>
        <button
          type="button"
          onClick={() => refetch()}
          className="mt-3 rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-3 py-1.5 text-xs font-medium text-[#101B2C] dark:text-white hover:border-[#BF9A63]"
        >
          Try again
        </button>
      </div>
    );
  }

  const { monthly, yearly, summary, available_years: years, current_year: currentYear } = data;
  const currentMonth = new Date().getMonth() + 1;

  const monthlyData = monthly.map((m) => ({
    key: m.month,
    label: m.label,
    value: m.revenue,
    detail: `${m.orders} order${m.orders === 1 ? "" : "s"}`,
    highlight: data.year === currentYear && m.month === currentMonth,
  }));

  const yearlyData = yearly.map((y) => ({
    key: y.year,
    label: String(y.year),
    value: y.revenue,
    detail: `${y.orders} order${y.orders === 1 ? "" : "s"}`,
    highlight: y.year === data.year,
  }));

  const monthlyHasData = monthly.some((m) => m.revenue > 0);
  const yearlyHasData = yearly.some((y) => y.revenue > 0);

  return (
    <section className="space-y-6" aria-label="Revenue analytics">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-[#101B2C] dark:text-white">Revenue analytics</h2>
          <p className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
            Confirmed, processing, in-transit and delivered orders. Cancelled and pending orders are excluded.
          </p>
        </div>
        <label className="flex items-center gap-2 text-xs font-medium text-[#7C7669] dark:text-[#9FA8B8]">
          Year
          <select
            value={data.year}
            onChange={(e) => setYear(Number(e.target.value))}
            className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] px-2.5 py-1.5 text-sm text-[#101B2C] dark:text-white focus:outline-none focus:ring-2 focus:ring-[#BF9A63]"
          >
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>
      </div>

      {/* KPI strip */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <Kpi
          label={`Revenue ${data.year}`}
          value={formatKES(summary.year_revenue)}
          footer={<Change pct={summary.yoy_change_pct} suffix={`vs ${data.year - 1}`} />}
        />
        <Kpi
          label="This month"
          value={formatKES(summary.this_month_revenue)}
          footer={<Change pct={summary.mom_change_pct} suffix="vs last month" />}
        />
        <Kpi
          label={`Avg. order value ${data.year}`}
          value={formatKES(summary.avg_order_value)}
          footer={
            <span className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
              {summary.year_orders} order{summary.year_orders === 1 ? "" : "s"}
            </span>
          }
        />
        <Kpi
          label={`Best month ${data.year}`}
          value={summary.best_month ? summary.best_month.label : "—"}
          footer={
            <span className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
              {summary.best_month ? formatKES(summary.best_month.revenue) : "No revenue yet"}
            </span>
          }
        />
      </div>

      {/* Bar charts */}
      <div className={`grid grid-cols-1 gap-6 lg:grid-cols-3 transition-opacity ${isFetching ? "opacity-60" : ""}`}>
        <div className={`${CARD} p-6 lg:col-span-2`}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#101B2C] dark:text-white">Monthly revenue · {data.year}</h3>
            <span className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">KES</span>
          </div>
          {monthlyHasData ? (
            <RevenueBarChart data={monthlyData} ariaLabel={`Monthly revenue for ${data.year}`} />
          ) : (
            <p className="py-16 text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]">
              No revenue recorded for {data.year}.
            </p>
          )}
        </div>

        <div className={`${CARD} p-6`}>
          <div className="mb-5 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-[#101B2C] dark:text-white">Yearly revenue</h3>
            <span className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">Click a bar to view that year</span>
          </div>
          {yearlyHasData ? (
            <RevenueBarChart data={yearlyData} ariaLabel="Yearly revenue" onSelect={setYear} />
          ) : (
            <p className="py-16 text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]">No revenue recorded yet.</p>
          )}
        </div>
      </div>
    </section>
  );
}