import { useState } from "react";
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

const selectClasses =
  "h-10 rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] px-3 text-sm text-[#101B2C] dark:text-white focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20";

export default function AdminOrdersPage() {
  const queryClient = useQueryClient();
  const [statusFilter, setStatusFilter] = useState("");
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-orders", statusFilter],
    queryFn: () => ordersApi.listOrders(statusFilter ? { status: statusFilter } : {}),
  });
  const orders = unwrapList(data);

  const handleAdvance = async (order, newStatus) => {
    setError("");
    try {
      await ordersApi.updateOrderStatus(order.id, newStatus);
      queryClient.invalidateQueries({ queryKey: ["admin-orders"] });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#101B2C] dark:text-white">Orders</h2>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className={selectClasses}
        >
          <option value="">All statuses</option>
          {["pending", "confirmed", "processing", "in_transit", "delivered", "cancelled"].map((s) => (
            <option key={s} value={s}>{s.replace("_", " ")}</option>
          ))}
        </select>
      </div>

      {error && (
        <div className="mb-4">
          <ErrorAlert message={error} />
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading orders" />
        </div>
      ) : orders.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] px-6 py-16 text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]">
          No orders match this filter.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235]">
          <div className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
            {orders.map((o) => (
              <div key={o.id} className="flex flex-wrap items-center gap-4 px-5 py-4">
                <Link
                  to={`/orders/${o.id}`}
                  className="font-mono text-sm font-medium text-[#101B2C] dark:text-white hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                >
                  {o.order_number}
                </Link>
                <span className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">{o.items_count} items</span>
                <Price value={o.total} />
                <OrderStatusBadge status={o.status} />
                <div className="ml-auto flex flex-wrap gap-2">
                  {NEXT_STATUS[o.status]?.map((s) => (
                    <button
                      key={s}
                      onClick={() => handleAdvance(o, s)}
                      className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-3 py-1.5 text-xs font-medium text-[#101B2C] dark:text-white transition-colors hover:border-[#BF9A63] hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                    >
                      Mark {s.replace("_", " ")}
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}