import { useCallback, useEffect, useRef, useState } from "react";
import { useParams, useNavigate, useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as ordersApi from "../../api/orders";
import * as paymentsApi from "../../api/payments";
import { extractErrorMessage } from "../../api/client";
import OrderStatusBadge from "../../components/OrderStatusBadge";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";
import NewTicketModal from "../support/NewTicketModal";

const STEPS = ["pending", "confirmed", "processing", "in_transit", "delivered"];
const PAYMENT_METHOD_LABEL = { mpesa: "M-Pesa", card: "Card", cod: "Pay on Delivery" };
const PAYMENT_STATUS_STYLE = {
  paid: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
  failed: "bg-red-100 text-red-700 dark:bg-red-500/15 dark:text-red-300",
};
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
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
  const queryClient = useQueryClient();
  const [searchParams, setSearchParams] = useSearchParams();
  // The card provider sends the customer back here with ?reference=...&trxref=...
  const returnedReference = searchParams.get("reference") || searchParams.get("trxref");
  const [verifying, setVerifying] = useState(Boolean(returnedReference));
  const [paying, setPaying] = useState(false);
  const [payError, setPayError] = useState("");
  const [payNotice, setPayNotice] = useState("");
  const verifiedOnce = useRef(false);
  const [showTicketModal, setShowTicketModal] = useState(false);

  const { data: order, isLoading, isError } = useQuery({
    queryKey: ["order", id],
    queryFn: () => ordersApi.getOrder(id),
    enabled: Boolean(id),
    // Keep checking for a short while after a card payment so the page flips to "paid" by itself.
    refetchInterval: (query) =>
      returnedReference && query.state.data?.payment_status === "pending" ? 4000 : false,
  });

  // Asks the provider for the transaction result and refreshes the order. Safe to repeat.
  const confirmCardPayment = useCallback(
    async (reference) => {
      setVerifying(true);
      setPayError("");
      setPayNotice("");
      try {
        let payment = null;
        for (let attempt = 0; attempt < 5; attempt += 1) {
          payment = await paymentsApi.verifyCard(id, reference);
          if (payment.status !== "pending") break;
          await sleep(2500);
        }
        if (payment?.status === "failed") setPayError("The card payment was not completed. You can try again below.");
        if (payment?.status === "pending") setPayNotice("We're still waiting for your bank to confirm the payment. This page will update automatically.");
      } catch (err) {
        setPayError(extractErrorMessage(err));
      } finally {
        await queryClient.invalidateQueries({ queryKey: ["order", id] });
        setVerifying(false);
      }
    },
    [id, queryClient]
  );

  // Arriving with ?reference=... (popup success from checkout, or return from the hosted page).
  useEffect(() => {
    if (!returnedReference || !id || verifiedOnce.current) return;
    verifiedOnce.current = true;
    confirmCardPayment(returnedReference).finally(() => setSearchParams({}, { replace: true }));
  }, [returnedReference, id, confirmCardPayment, setSearchParams]);

  const payByCard = async () => {
    setPaying(true);
    setPayError("");
    setPayNotice("");
    let init;
    try {
      init = await paymentsApi.initiateCard(order.id);
    } catch (err) {
      setPayError(extractErrorMessage(err));
      setPaying(false);
      return;
    }
    try {
      const result = await paymentsApi.openCardPopup(init.access_code);
      setPaying(false);
      if (result.status === "success") {
        await confirmCardPayment(result.reference || init.reference);
      } else {
        setPayNotice("The payment window was closed before the payment was completed. You can try again when you're ready.");
      }
    } catch {
      // Popup couldn't load - fall back to the hosted payment page.
      window.location.assign(init.payment_url);
    }
  };

  const resendMpesa = async () => {
    setPaying(true);
    setPayError("");
    setPayNotice("");
    try {
      await paymentsApi.initiateMpesa(order.id, order.phone_number);
      setPayNotice(`M-Pesa prompt sent to ${order.phone_number}. Enter your PIN to complete payment.`);
    } catch (err) {
      setPayError(extractErrorMessage(err));
    } finally {
      setPaying(false);
    }
  };

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
          <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-slate-400">Payment</h3>
          <div className="mt-3 flex flex-wrap items-center justify-between gap-3 text-sm">
            <span className="text-[#1E2430] dark:text-slate-200">
              {PAYMENT_METHOD_LABEL[order.payment_method] || order.payment_method}
            </span>
            <span
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium capitalize ${
                PAYMENT_STATUS_STYLE[order.payment_status] || PAYMENT_STATUS_STYLE.pending
              }`}
            >
              {verifying ? "Confirming…" : order.payment_status}
            </span>
          </div>

          {payNotice && <p className="mt-3 text-sm text-[#7C7669] dark:text-slate-400">{payNotice}</p>}
          {payError && <p className="mt-3 text-sm text-red-600 dark:text-red-400">{payError}</p>}

          {!verifying && order.status === "pending" && order.payment_status !== "paid" && order.payment_method === "card" && (
            <button
              type="button"
              onClick={payByCard}
              disabled={paying}
              className="mt-4 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying ? "Opening secure payment…" : order.payment_status === "failed" ? "Try card payment again" : "Pay now by card"}
            </button>
          )}

          {!verifying && order.status === "pending" && order.payment_status !== "paid" && order.payment_method === "mpesa" && (
            <button
              type="button"
              onClick={resendMpesa}
              disabled={paying}
              className="mt-4 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {paying ? "Sending…" : "Resend M-Pesa prompt"}
            </button>
          )}
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

        <button
          type="button"
          onClick={() => setShowTicketModal(true)}
          className="inline-block rounded-md border border-transparent bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#A9834E]"
        >
          Get help with this order
        </button>
        <NewTicketModal
          open={showTicketModal}
          onClose={() => setShowTicketModal(false)}
          orderId={order.id}
        />
      </div>
    </div>
  );
}