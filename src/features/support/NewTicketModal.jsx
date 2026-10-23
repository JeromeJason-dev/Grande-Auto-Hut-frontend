import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import * as supportApi from "../../api/support";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";
import { useNotificationToastContext } from "../notifications/NotificationToastContext";

const CATEGORIES = [
  { value: "order", label: "Order issue" },
  { value: "product", label: "Product question" },
  { value: "payment", label: "Payment issue" },
  { value: "account", label: "Account" },
  { value: "other", label: "Other" },
];

const fieldClasses =
  "w-full rounded-md border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] px-3 py-2 text-sm text-[#1E2430] dark:text-slate-100 transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25";

const labelClasses = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-slate-400";

/**
 * Modal for opening a new support ticket.
 * Props:
 *  - open: boolean
 *  - onClose: () => void
 *  - orderId: optional order to link the ticket to
 */
export default function NewTicketModal({ open, onClose, orderId = "" }) {
  // Mount the form only while open so its state resets on every open.
  if (!open) return null;
  return <NewTicketDialog onClose={onClose} orderId={orderId} />;
}

function NewTicketDialog({ onClose, orderId }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { showToast } = useNotificationToastContext();

  const [form, setForm] = useState({ subject: "", category: orderId ? "order" : "other", message: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Close on Escape (unless submitting) and lock background scroll.
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !submitting) onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, submitting]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const ticket = await supportApi.createTicket({ ...form, order: orderId || undefined });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
      showToast({
        type: "success",
        title: "Ticket submitted",
        message: "Our support team has been notified and will get back to you soon.",
      });
      onClose();
      navigate(`/support/${ticket.id}`);
    } catch (err) {
      const message = extractErrorMessage(err);
      setError(message);
      showToast({ type: "error", title: "Couldn't submit ticket", message, duration: 8000 });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !submitting) onClose();
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="new-ticket-title"
        className="w-full max-w-lg rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] shadow-[0_20px_50px_rgba(16,27,44,0.25)]"
      >
        <div className="flex items-start justify-between gap-4 border-b border-[#E7E2D8] dark:border-white/10 px-6 py-4">
          <h2 id="new-ticket-title" className="text-lg font-semibold text-[#101B2C] dark:text-white">
            New support ticket
          </h2>
          <button
            type="button"
            onClick={onClose}
            disabled={submitting}
            aria-label="Close"
            className="rounded-md p-1 text-[#7C7669] dark:text-slate-400 transition-colors hover:bg-[#FAF7F2] hover:text-[#101B2C] dark:hover:bg-white/5 dark:hover:text-white disabled:opacity-50"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6">
          {error && (
            <div className="mb-4">
              <ErrorAlert message={error} />
            </div>
          )}

          {orderId && (
            <p className="mb-5 rounded-md bg-[#FAF7F2] dark:bg-white/5 px-3 py-2 text-sm text-[#7C7669] dark:text-slate-400">
              Linked to order <span className="font-mono text-[#101B2C] dark:text-white">{orderId}</span>
            </p>
          )}

          <div className="mb-4">
            <label htmlFor="ticket-subject" className={labelClasses}>Subject</label>
            <input
              id="ticket-subject"
              required
              autoFocus
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className={fieldClasses}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="ticket-category" className={labelClasses}>Category</label>
            <select
              id="ticket-category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={fieldClasses}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="ticket-message" className={labelClasses}>How can we help?</label>
            <textarea
              id="ticket-message"
              rows={5}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={`${fieldClasses} resize-none`}
            />
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="flex-1 rounded-md border border-[#E7E2D8] dark:border-white/10 px-4 py-2.5 text-sm font-medium text-[#101B2C] dark:text-white transition-colors hover:bg-[#FAF7F2] dark:hover:bg-white/5 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="flex-1 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-2.5 text-sm font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] dark:disabled:bg-slate-700 disabled:text-[#7C7669] dark:disabled:text-slate-400"
            >
              {submitting ? "Sending…" : "Open ticket"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}