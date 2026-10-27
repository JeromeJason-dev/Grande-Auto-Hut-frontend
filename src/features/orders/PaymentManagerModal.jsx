import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as paymentsApi from "../../api/payments";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";
import Spinner from "../../components/Spinner";
import { useAuth } from "../auth/AuthContext";
import { Modal } from "../admin/AdminUi";
import {
  controlClasses, dangerButton, formatDateTime, ghostButton, labelClasses, primaryButton,
} from "../admin/adminConstants";

const STATUS_STYLES = {
  paid: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  success: "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300",
  pending: "bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300",
  failed: "bg-orange-100 text-orange-700 dark:bg-orange-500/15 dark:text-orange-300",
  refunded: "bg-slate-200 text-slate-700 dark:bg-slate-500/20 dark:text-slate-300",
};

const capitalize = (s) => (s || "").replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
const money = (v) => `KES ${new Intl.NumberFormat("en-KE", { minimumFractionDigits: 0 }).format(Number(v))}`;

function Chip({ status }) {
  return (
    <span className={`inline-flex rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_STYLES[status] || STATUS_STYLES.pending}`}>
      {capitalize(status === "success" ? "paid" : status)}
    </span>
  );
}

/** DRF sends { field: ["message"] } for validation errors; keep them per field. */
function splitErrors(err) {
  const data = err?.response?.data;
  if (data && typeof data === "object" && !data.detail && !Array.isArray(data)) {
    const fields = {};
    let general = "";
    for (const [key, value] of Object.entries(data)) {
      const text = Array.isArray(value) ? value[0] : String(value);
      if (key === "non_field_errors") general = text;
      else fields[key] = text;
    }
    return { fields, general };
  }
  return { fields: {}, general: extractErrorMessage(err) };
}

function PaymentRow({ payment }) {
  const details = [
    payment.phone_number && `Phone ${payment.phone_number}`,
    payment.mpesa_receipt_number && `Receipt ${payment.mpesa_receipt_number}`,
    payment.card_brand && `${capitalize(payment.card_brand)} ending ${payment.card_last4 || "----"}`,
    payment.card_reference && `Ref ${payment.card_reference}`,
  ].filter(Boolean);

  return (
    <li className="rounded-lg border border-[#E7E2D8] dark:border-[#25344D] p-3">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-sm font-medium text-[#101B2C] dark:text-white">{payment.method_label}</span>
          <Chip status={payment.status} />
          {payment.recorded_manually && (
            <span className="rounded-full border border-[#BF9A63]/50 px-2 py-0.5 text-[11px] font-medium text-[#A9834E] dark:text-[#BF9A63]">
              Recorded manually
            </span>
          )}
        </div>
        <span className="mono text-sm text-[#101B2C] dark:text-white">{money(payment.amount)}</span>
      </div>
      <p className="mt-1 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
        {formatDateTime(payment.created_at)}
        {details.length > 0 && ` · ${details.join(" · ")}`}
      </p>
      {payment.raw_callback && (
        <details className="mt-2">
          <summary className="cursor-pointer text-xs text-[#7C7669] hover:text-[#101B2C] dark:text-[#9FA8B8] dark:hover:text-white">
            Gateway response
          </summary>
          <pre className="mt-2 max-h-40 overflow-auto rounded-md bg-[#FAF7F2] dark:bg-[#0B1320] p-2 text-[11px] leading-relaxed text-[#101B2C] dark:text-slate-200">
            {JSON.stringify(payment.raw_callback, null, 2)}
          </pre>
        </details>
      )}
    </li>
  );
}

/** Reason (+ optional reference) form shared by "record payment" and "record refund". */
function ReasonForm({ title, warning, referenceLabel, submitLabel, danger, busy, error, fieldErrors, onSubmit, onCancel }) {
  const [reason, setReason] = useState("");
  const [reference, setReference] = useState("");
  const canSubmit = reason.trim().length >= 5 && !busy;

  return (
    <form
      className="mt-4 space-y-3 rounded-lg border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#0B1320] p-4"
      onSubmit={(e) => {
        e.preventDefault();
        if (canSubmit) onSubmit({ reason: reason.trim(), reference: reference.trim() });
      }}
    >
      <h3 className="text-sm font-semibold text-[#101B2C] dark:text-white">{title}</h3>
      <p className="text-xs leading-relaxed text-[#7C7669] dark:text-[#9FA8B8]">{warning}</p>
      <div>
        <label htmlFor="pay-reason" className={labelClasses}>Reason (required)</label>
        <textarea
          id="pay-reason"
          rows={2}
          maxLength={255}
          value={reason}
          onChange={(e) => setReason(e.target.value)}
          disabled={busy}
          className={controlClasses}
          placeholder="Why is this being recorded?"
        />
        {fieldErrors.reason && <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{fieldErrors.reason}</p>}
      </div>
      <div>
        <label htmlFor="pay-reference" className={labelClasses}>{referenceLabel} (optional)</label>
        <input
          id="pay-reference"
          maxLength={100}
          value={reference}
          onChange={(e) => setReference(e.target.value)}
          disabled={busy}
          className={controlClasses}
        />
      </div>
      {error && <ErrorAlert message={error} />}
      <div className="flex justify-end gap-2">
        <button type="button" onClick={onCancel} disabled={busy} className={ghostButton}>Cancel</button>
        <button type="submit" disabled={!canSubmit} className={danger ? dangerButton : primaryButton}>
          {busy ? "Saving…" : submitLabel}
        </button>
      </div>
    </form>
  );
}

/**
 * Staff/admin view of an order's payments. Mount only while open.
 * Staff can look and re-check with the gateway; admins can also record a manual payment or a refund.
 * Nothing here edits a status directly - each action is validated and audited on the server.
 */
export default function PaymentManagerModal({ order, onClose, onChanged }) {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const key = ["order-payments", order.id];

  const [form, setForm] = useState(null); // null | "paid" | "refund"
  const [notice, setNotice] = useState("");
  const [actionError, setActionError] = useState({ fields: {}, general: "" });

  const { data, isLoading, isError, error } = useQuery({
    queryKey: key,
    queryFn: () => paymentsApi.getOrderPayments(order.id),
  });

  const run = useMutation({
    mutationFn: (request) => request(),
    onMutate: () => {
      setNotice("");
      setActionError({ fields: {}, general: "" });
    },
    onSuccess: (result) => {
      queryClient.setQueryData(key, result);
      setNotice(result.detail || "Done.");
      setForm(null);
      onChanged?.();
    },
    onError: (err) => {
      setActionError(splitErrors(err));
      onChanged?.(); // the server may have partly moved on (e.g. the gateway answered), so refresh the table
    },
  });

  const busy = run.isPending;

  return (
    <Modal title={`Payments · ${order.order_number}`} onClose={onClose} busy={busy} maxWidth="max-w-2xl">
      <div className="space-y-5 px-6 py-5">
        {isLoading && (
          <div className="flex justify-center py-10"><Spinner /></div>
        )}
        {isError && <ErrorAlert message={extractErrorMessage(error)} />}

        {data && (
          <>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <span className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">Payment status</span>
                <Chip status={data.payment_status} />
              </div>
              <span className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">
                {data.payment_method === "cod" ? "Pay on Delivery" : capitalize(data.payment_method)} · Order total{" "}
                <span className="mono text-[#101B2C] dark:text-white">{money(data.total)}</span>
              </span>
            </div>

            {data.attention_note && (
              <p role="alert" className="rounded-md border border-red-200 dark:border-red-500/30 bg-red-50 dark:bg-red-500/10 px-3 py-2 text-sm text-red-800 dark:text-red-300">
                <span className="font-semibold">Needs attention: </span>{data.attention_note}
              </p>
            )}

            {notice && (
              <p role="status" className="rounded-md bg-emerald-50 dark:bg-emerald-500/10 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-300">
                {notice}
              </p>
            )}

            <section aria-label="Payment attempts">
              <h3 className={labelClasses}>Payment attempts</h3>
              {data.payments.length === 0 ? (
                <p className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">
                  {data.payment_method === "cod"
                    ? "Pay on Delivery: payment is collected when the order is delivered."
                    : "No payment has been started for this order yet."}
                </p>
              ) : (
                <ul className="space-y-2">
                  {data.payments.map((p) => <PaymentRow key={p.id} payment={p} />)}
                </ul>
              )}
            </section>

            {form === null && (
              <section aria-label="Actions" className="space-y-2">
                <div className="flex flex-wrap gap-2">
                  {data.can_recheck && (
                    <button
                      type="button"
                      disabled={busy}
                      onClick={() => run.mutate(() => paymentsApi.recheckOrderPayment(order.id))}
                      className={ghostButton}
                    >
                      {busy ? "Checking…" : "Re-check with gateway"}
                    </button>
                  )}
                  {data.can_mark_paid && (
                    <button type="button" disabled={busy} onClick={() => setForm("paid")} className={ghostButton}>
                      Record manual payment
                    </button>
                  )}
                  {data.can_refund && (
                    <button type="button" disabled={busy} onClick={() => setForm("refund")} className={ghostButton}>
                      Record refund
                    </button>
                  )}
                </div>
                {data.can_refund && (
                  <p className="rounded-md bg-amber-50 dark:bg-amber-500/10 px-3 py-2 text-xs text-amber-900 dark:text-amber-200">
                    {data.refund_note || "Recording a refund does not send money. Send the refund through M-Pesa or Paystack yourself, then record it here."}
                  </p>
                )}
                {!isAdmin && (
                  <p className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                    Recording a manual payment or a refund is limited to admins. Use re-check to pull the latest result from M-Pesa or card.
                  </p>
                )}
                {actionError.general && <ErrorAlert message={actionError.general} />}
              </section>
            )}

            {form === "paid" && (
              <ReasonForm
                title="Record manual payment"
                warning="Only use this once you've confirmed the money was received outside the gateway (cash, bank transfer, or visible on the M-Pesa statement). A pending order will be confirmed and its stock deducted, and the customer is notified. This can't be undone from here."
                referenceLabel="M-Pesa code / bank reference"
                submitLabel="Record payment"
                busy={busy}
                error={actionError.general}
                fieldErrors={actionError.fields}
                onCancel={() => { setForm(null); setActionError({ fields: {}, general: "" }); }}
                onSubmit={(v) => run.mutate(() => paymentsApi.markOrderPaid(order.id, v))}
              />
            )}

            {form === "refund" && (
              <ReasonForm
                title="Record refund"
                warning="This only records that the customer was paid back, in full; it doesn't send any money. Reverse the payment in M-Pesa or Paystack first. It also doesn't cancel the order or return stock, so cancel the order separately if that's needed."
                referenceLabel="Reversal / refund reference"
                submitLabel="Record refund"
                danger
                busy={busy}
                error={actionError.general}
                fieldErrors={actionError.fields}
                onCancel={() => { setForm(null); setActionError({ fields: {}, general: "" }); }}
                onSubmit={(v) => run.mutate(() => paymentsApi.refundOrderPayment(order.id, v))}
              />
            )}

            <section aria-label="Audit trail">
              <h3 className={labelClasses}>Audit trail</h3>
              {data.audit_log.length === 0 ? (
                <p className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">No manual actions yet.</p>
              ) : (
                <ul className="divide-y divide-[#E7E2D8] dark:divide-[#25344D] rounded-lg border border-[#E7E2D8] dark:border-[#25344D]">
                  {data.audit_log.map((entry) => (
                    <li key={entry.id} className="px-3 py-2 text-xs text-[#101B2C] dark:text-white">
                      <div className="flex flex-wrap items-center justify-between gap-1">
                        <span className="font-medium">{entry.action_label}</span>
                        <span className="text-[#7C7669] dark:text-[#9FA8B8]">
                          {entry.performed_by_name} · {formatDateTime(entry.created_at)}
                        </span>
                      </div>
                      <p className="mt-0.5 text-[#7C7669] dark:text-[#9FA8B8]">
                        {capitalize(entry.from_status)} → {capitalize(entry.to_status)}
                        {entry.amount && ` · ${money(entry.amount)}`}
                        {entry.reference && ` · Ref ${entry.reference}`}
                        {entry.reason && ` · ${entry.reason}`}
                      </p>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          </>
        )}
      </div>
    </Modal>
  );
}