import { useParams, Link, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as ordersApi from "../../api/orders";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";

const STEPS = ["pending", "confirmed", "processing", "in_transit", "delivered"];
const STEP_LABEL = { pending: "Placed", confirmed: "Confirmed", processing: "Processing", in_transit: "In Transit", delivered: "Delivered" };

function Tracker({ status }) {
  if (status === "cancelled") {
    return (
      <div className="mb-8 rounded-lg border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/40 px-4 py-3 text-sm text-red-700 dark:text-red-300">
        This order was cancelled.
      </div>
    );
  }

  const currentIndex = STEPS.indexOf(status);

  return (
    <div className="mb-10 flex items-start">
      {STEPS.map((step, i) => (
        <div key={step} className={`flex items-center ${i < STEPS.length - 1 ? "flex-1" : "flex-none"}`}>
          <div className="flex flex-col items-center gap-1.5">
            <div
              className={`h-3.5 w-3.5 rounded-full ${
                i <= currentIndex ? "bg-emerald-500" : "border border-[#D8D2C4] dark:border-slate-700 bg-white dark:bg-[#101B2C]"
              }`}
            />
            <span
              className={`whitespace-nowrap text-xs ${
                i <= currentIndex ? "font-medium text-[#101B2C] dark:text-white" : "text-[#7C7669] dark:text-slate-500"
              }`}
            >
              {STEP_LABEL[step]}
            </span>
          </div>
          {i < STEPS.length - 1 && (
            <div
              className={`mx-1.5 mb-5 h-0.5 flex-1 ${
                i < currentIndex ? "bg-emerald-500" : "bg-[#E7E2D8] dark:bg-white/10"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

export default function OrderDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { data: order, isLoading, isError } = useQuery({ queryKey: ["order", id], queryFn: () => ordersApi.getOrder(id) });

  if (isLoading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FAF7F2] dark:bg-[#0B121F]">
        <Spinner label="Loading order" />
      </div>
    );

  if (isError || !order)
    return (
      <div className="min-h-full bg-[#FAF7F2] dark:bg-[#0B121F]">
        <div className="mx-auto max-w-2xl px-6 py-12">
          <ErrorAlert message="That order couldn't be found." />
        </div>
      </div>
    );

  return (
    <div className="min-h-full bg-[#FAF7F2] dark:bg-[#0B121F] transition-colors duration-200">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#7C7669] dark:text-slate-400 transition-colors hover:text-[#101B2C] dark:hover:text-white"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="font-mono text-xl font-semibold text-[#101B2C] dark:text-white">{order.order_number}</h1>
          <OrderStatusBadge status={order.status} />
        </div>
        <p className="mt-1 text-sm text-[#7C7669] dark:text-slate-400">
          Placed {new Date(order.created_at).toLocaleString("en-KE")}
        </p>

        <div className="mt-8">
          <Tracker status={order.status} />
        </div>

        <div className="mb-5 rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] p-5 shadow-sm dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-slate-400">Items</h3>
          <div className="mt-4 flex flex-col gap-2.5">
            {order.items.map((item) => (
              <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                <span className="text-[#1E2430] dark:text-slate-200">
                  {item.quantity} × {item.product_name}{" "}
                  <span className="font-mono text-xs text-[#7C7669] dark:text-slate-400">{item.product_sku}</span>
                </span>
                <Price value={item.line_total} />
              </div>
            ))}
          </div>

          <div className="mt-4 flex items-center justify-between border-t border-[#E7E2D8] dark:border-white/10 pt-4 text-sm">
            <span className="text-[#7C7669] dark:text-slate-400">Subtotal</span>
            <Price value={order.subtotal} />
          </div>
          <div className="mt-2 flex items-center justify-between text-sm">
            <span className="text-[#7C7669] dark:text-slate-400">Shipping</span>
            <Price value={order.shipping_fee} />
          </div>
          <div className="mt-2 flex items-center justify-between">
            <span className="font-semibold text-[#101B2C] dark:text-white">Total</span>
            <Price value={order.total} size="lg" />
          </div>
        </div>

        <div className="mb-5 rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] p-5 shadow-sm dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-slate-400">Delivery to</h3>
          <p className="mt-3 text-sm leading-relaxed text-[#1E2430] dark:text-slate-300">
            {order.recipient_name} · {order.phone_number}
            <br />
            {order.street_address}
            {order.building_or_estate && `, ${order.building_or_estate}`}
            <br />
            {order.town}, {order.county}
          </p>
        </div>

        <div className="mb-6 rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] p-5 shadow-sm dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-slate-400">Status history</h3>
          <div className="mt-4 flex flex-col gap-4">
            {order.status_history.map((h, i) => (
              <div key={i} className="flex items-start gap-3">
                <OrderStatusBadge status={h.status} />
                <div>
                  {h.note && <div className="text-sm text-[#1E2430] dark:text-slate-200">{h.note}</div>}
                  <div className="text-xs text-[#7C7669] dark:text-slate-400">
                    {new Date(h.created_at).toLocaleString("en-KE")}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <Link
          to={`/support/new?order=${order.id}`}
          className="inline-block rounded-md border border-transparent bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#A9834E]"
        >
          Get help with this order
        </Link>
      </div>
    </div>
  );
}