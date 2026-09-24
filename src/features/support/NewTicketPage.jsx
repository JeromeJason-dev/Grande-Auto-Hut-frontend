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
  "w-full rounded-md border border-[#E7E2D8] bg-white px-3 py-2 text-sm text-[#1E2430] transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25";

const labelClasses = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7C7669]";

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
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="mx-auto max-w-xl px-6 py-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="mb-4 inline-flex items-center gap-1.5 text-sm font-medium text-[#7C7669] transition-colors hover:text-[#101B2C]"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="m15 18-6-6 6-6" />
          </svg>
          Back
        </button>

        <h1 className="text-2xl font-semibold text-[#101B2C]">New support ticket</h1>

        {error && (
          <div className="mt-4">
            <ErrorAlert message={error} />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="mt-6 rounded-xl border border-[#E7E2D8] bg-white p-6 shadow-[0_10px_25px_rgba(16,27,44,0.05)]"
        >
          {orderId && (
            <p className="mb-5 rounded-md bg-[#FAF7F2] px-3 py-2 text-sm text-[#7C7669]">
              Linked to order <span className="font-mono text-[#101B2C]">{orderId}</span>
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
            className="w-full rounded-md bg-[#101B2C] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] disabled:text-[#7C7669]"
          >
            {submitting ? "Sending…" : "Open ticket"}
          </button>
        </form>
      </div>
    </div>
  );
}