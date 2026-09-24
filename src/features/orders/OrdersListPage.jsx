import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as ordersApi from "../../api/orders";
import { unwrapList } from "../../api/client";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";

export default function OrdersListPage() {
  const { data, isLoading } = useQuery({ queryKey: ["orders"], queryFn: () => ordersApi.listOrders() });
  const orders = unwrapList(data);

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-[#101B2C]">My orders</h1>

        {isLoading && (
          <div className="flex justify-center py-16">
            <Spinner label="Loading orders" />
          </div>
        )}

        {!isLoading && orders.length === 0 && (
          <div className="mt-8 rounded-xl border border-dashed border-[#E7E2D8] bg-white px-6 py-16">
            <EmptyState
              title="No orders yet"
              body="Once you place an order, you'll be able to track it here from confirmation to delivery."
              action={
                <Link
                  to="/catalog"
                  className="mt-3 inline-block rounded-md bg-[#101B2C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46]"
                >
                  Browse catalog
                </Link>
              }
            />
          </div>
        )}

        <div className="mt-8 flex flex-col gap-3">
          {orders.map((o) => (
            <Link
              key={o.id}
              to={`/orders/${o.id}`}
              className="flex items-center justify-between gap-4 rounded-lg border border-[#E7E2D8] bg-white p-4 text-[#1E2430] transition-colors hover:border-[#BF9A63]/40 hover:shadow-[0_10px_25px_rgba(16,27,44,0.05)]"
            >
              <div className="min-w-0">
                <div className="font-mono text-sm font-medium text-[#101B2C]">{o.order_number}</div>
                <div className="mt-0.5 text-sm text-[#7C7669]">
                  {o.items_count} item{o.items_count !== 1 && "s"} ·{" "}
                  {new Date(o.created_at).toLocaleDateString("en-KE", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </div>
              </div>
              <div className="flex flex-shrink-0 items-center gap-4">
                <Price value={o.total} />
                <OrderStatusBadge status={o.status} />
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}