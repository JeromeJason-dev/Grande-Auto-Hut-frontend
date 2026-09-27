import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as ordersApi from "../../api/orders";
import { unwrapList } from "../../api/client";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";

export default function OrderListPage() {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["orders"],
    queryFn: () => ordersApi.listOrders(),
  });

  const orders = unwrapList(data);

  if (isLoading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FAF7F2] dark:bg-[#0B121F]">
        <Spinner label="Loading orders" />
      </div>
    );

  if (isError)
    return (
      <div className="min-h-full bg-[#FAF7F2] dark:bg-[#0B121F]">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <ErrorAlert message="We couldn't load your orders." />
        </div>
      </div>
    );

  return (
    <div className="min-h-full bg-[#FAF7F2] dark:bg-[#0B121F] transition-colors duration-200">
      <div className="mx-auto max-w-3xl px-6 py-12">
        <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">My Orders</h1>

        {orders.length === 0 ? (
          <p className="mt-6 text-sm text-[#7C7669] dark:text-slate-400">
            You haven't placed any orders yet.{" "}
            <Link to="/catalog" className="font-medium text-[#101B2C] dark:text-white hover:text-[#BF9A63]">
              Browse the catalog
            </Link>
            .
          </p>
        ) : (
          <div className="mt-6 flex flex-col gap-3">
            {orders.map((order) => (
              <Link
                key={order.id}
                to={`/orders/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] p-5 shadow-sm transition-colors hover:border-[#101B2C]/40 dark:hover:border-[#BF9A63]/40"
              >
                <div>
                  <span className="font-mono text-sm font-semibold text-[#101B2C] dark:text-white">
                    {order.order_number}
                  </span>
                  <p className="mt-1 text-xs text-[#7C7669] dark:text-slate-400">
                    {new Date(order.created_at).toLocaleString("en-KE")}
                  </p>
                </div>
                <div className="flex items-center gap-4">
                  <Price value={order.total} />
                  <OrderStatusBadge status={order.status} />
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}