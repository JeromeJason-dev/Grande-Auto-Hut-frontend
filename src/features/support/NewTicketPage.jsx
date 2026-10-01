import { useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import * as supportApi from "../../api/support";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";

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

export default function NewTicketPage() {
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const orderId = params.get("order") || "";

  const [form, setForm] = useState({ subject: "", category: orderId ? "order" : "other", message: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      const ticket = await supportApi.createTicket({ ...form, order: orderId || undefined });
      navigate(`/support/${ticket.id}`, { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-full bg-[#FAF7F2] p-8 dark:bg-[#0B121F] transition-colors duration-200">
      <div className="mx-auto max-w-xl">
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

        <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">New support ticket</h1>

        {error && (
          <div className="mt-4">
            <ErrorAlert message={error} />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] p-6 shadow-[0_10px_25px_rgba(16,27,44,0.05)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
        >
          {orderId && (
            <p className="mb-5 rounded-md bg-[#FAF7F2] dark:bg-white/5 px-3 py-2 text-sm text-[#7C7669] dark:text-slate-400">
              Linked to order <span className="font-mono text-[#101B2C] dark:text-white">{orderId}</span>
            </p>
          )}

          <div className="mb-4">
            <label htmlFor="subject" className={labelClasses}>
              Subject
            </label>
            <input
              id="subject"
              required
              value={form.subject}
              onChange={(e) => setForm({ ...form, subject: e.target.value })}
              className={fieldClasses}
            />
          </div>

          <div className="mb-4">
            <label htmlFor="category" className={labelClasses}>
              Category
            </label>
            <select
              id="category"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value })}
              className={fieldClasses}
            >
              {CATEGORIES.map((c) => (
                <option key={c.value} value={c.value}>
                  {c.label}
                </option>
              ))}
            </select>
          </div>

          <div className="mb-6">
            <label htmlFor="message" className={labelClasses}>
              How can we help?
            </label>
            <textarea
              id="message"
              rows={5}
              required
              value={form.message}
              onChange={(e) => setForm({ ...form, message: e.target.value })}
              className={`${fieldClasses} resize-none`}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="w-full rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-2.5 text-sm font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] dark:disabled:bg-slate-700 disabled:text-[#7C7669] dark:disabled:text-slate-400"
          >
            {submitting ? "Sending…" : "Open ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}