import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import * as adminApi from "../../api/admin";
import { unwrapList } from "../../api/client";
import Spinner from "../../components/Spinner";

const cardClasses =
  "rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235]";

const thClasses =
  "px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]";

const tdClasses = "px-4 py-3 text-sm text-[#1E2430] dark:text-slate-200";

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString(undefined, { year: "numeric", month: "short", day: "numeric" });
}

function fullName(c) {
  return `${c.first_name || ""} ${c.last_name || ""}`.trim() || "—";
}

function initialsOf(c) {
  return (
    `${c.first_name?.[0] || ""}${c.last_name?.[0] || ""}`.toUpperCase() ||
    c.email?.[0]?.toUpperCase() ||
    "?"
  );
}

export default function AdminCustomersPage() {
  const [search, setSearch] = useState("");
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-customers"],
    queryFn: adminApi.listCustomers,
  });

  const customers = useMemo(() => unwrapList(data), [data]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return customers;
    return customers.filter((c) =>
      [fullName(c), c.email, c.phone_number]
        .filter(Boolean)
        .some((v) => v.toLowerCase().includes(q))
    );
  }, [customers, search]);

  const showOrders = customers.some((c) => c.orders_count !== undefined);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">Customers</h1>
          {!isLoading && (
            <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
              {customers.length} customer{customers.length === 1 ? "" : "s"}
            </p>
          )}
        </div>

        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by name, email or phone"
          aria-label="Search customers"
          className="w-full rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0B1320] px-3 py-2 text-sm text-[#1E2430] dark:text-slate-200 transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25 sm:w-72"
        />
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading customers" />
        </div>
      ) : isError ? (
        <div className={`${cardClasses} p-6 text-sm text-red-600 dark:text-red-400`}>
          Couldn't load customers. Refresh the page to try again.
        </div>
      ) : filtered.length === 0 ? (
        <div className={`${cardClasses} p-6 text-sm text-[#7C7669] dark:text-[#9FA8B8]`}>
          {search ? "No customers match your search." : "No customers yet."}
        </div>
      ) : (
        <div className={`${cardClasses} overflow-x-auto`}>
          <table className="w-full min-w-[640px]">
            <thead className="border-b border-[#E7E2D8] dark:border-[#25344D]">
              <tr>
                <th className={thClasses}>Customer</th>
                <th className={thClasses}>Phone</th>
                {showOrders && <th className={thClasses}>Orders</th>}
                <th className={thClasses}>Joined</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
              {filtered.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#0B1320]">
                  <td className={tdClasses}>
                    <div className="flex items-center gap-3">
                      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-[#101B2C] dark:bg-[#BF9A63] text-xs font-semibold text-white dark:text-slate-950">
                        {initialsOf(c)}
                      </span>
                      <div className="min-w-0">
                        <div className="truncate font-medium text-[#101B2C] dark:text-white">{fullName(c)}</div>
                        <div className="truncate text-xs text-[#7C7669] dark:text-[#9FA8B8]">{c.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className={tdClasses}>{c.phone_number || "—"}</td>
                  {showOrders && <td className={tdClasses}>{c.orders_count ?? "—"}</td>}
                  <td className={`${tdClasses} text-[#7C7669] dark:text-[#9FA8B8]`}>
                    {formatDate(c.date_joined || c.created_at)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}