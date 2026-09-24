import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import * as adminApi from "../../api/admin";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";

function StatCard({ label, value }) {
  return (
    <div className="rounded-xl border border-[#E7E2D8] bg-white p-5">
      <div className="text-xs font-medium uppercase tracking-wide text-[#7C7669]">
        {label}
      </div>
      <div className="mt-2 text-2xl font-semibold text-[#101B2C]">{value}</div>
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

  return (
    <div>
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6">
        <StatCard label="Total orders" value={data.total_orders} />
        <StatCard
          label="Revenue (confirmed+)"
          value={<Price value={data.revenue_confirmed_and_beyond} size="lg" />}
        />
        <StatCard label="Customers" value={data.total_customers} />
        <StatCard label="Open tickets" value={data.open_tickets} />
        <StatCard label="Pending M-Pesa" value={data.pending_mpesa_payments} />
        <StatCard label="Low stock parts" value={data.low_stock_count} />
      </div>

      <div className="mt-8 rounded-xl border border-[#E7E2D8] bg-white p-6">
        <h3 className="text-sm font-semibold text-[#101B2C]">Orders by status</h3>
        <div className="mt-3 flex flex-wrap gap-2">
          {Object.entries(data.orders_by_status).map(([status, count]) => (
            <span
              key={status}
              className="rounded-full border border-[#E7E2D8] bg-[#FAF7F2] px-3 py-1 text-xs font-medium capitalize text-[#101B2C]"
            >
              {status.replace("_", " ")}: {count}
            </span>
          ))}
        </div>
      </div>

      {data.low_stock_products.length > 0 && (
        <div className="mt-6 rounded-xl border border-[#E7E2D8] bg-white p-6">
          <h3 className="text-sm font-semibold text-[#101B2C]">Low stock</h3>
          <div className="mt-3 divide-y divide-[#E7E2D8]">
            {data.low_stock_products.map((p) => (
              <div key={p.id} className="flex items-center justify-between py-2.5">
                <span className="text-sm text-[#1E2430]">
                  {p.name}{" "}
                  <span className="font-mono text-xs text-[#7C7669]">{p.sku}</span>
                </span>
                <span className="rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-700">
                  {p.stock_quantity} left
                </span>
              </div>
            ))}
          </div>
          <Link
            to="/admin/products"
            className="mt-4 inline-block rounded-md border border-[#E7E2D8] px-3.5 py-1.5 text-sm font-medium text-[#101B2C] transition-colors hover:border-[#BF9A63] hover:text-[#A9834E]"
          >
            Manage stock
          </Link>
        </div>
      )}
    </div>
  );
}