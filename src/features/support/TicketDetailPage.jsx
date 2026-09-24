import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as supportApi from "../../api/support";
import { useAuth } from "../auth/AuthContext";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";
import Spinner from "../../components/Spinner";

const STATUS_OPTIONS = ["open", "in_progress", "resolved", "closed"];

const STATUS_STYLES = {
  open: "bg-amber-100 text-amber-800",
  in_progress: "bg-blue-100 text-blue-800",
  resolved: "bg-emerald-100 text-emerald-800",
  closed: "bg-[#E7E2D8] text-[#7C7669]",
};

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [reply, setReply] = useState("");
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  const { data: ticket, isLoading } = useQuery({ queryKey: ["ticket", id], queryFn: () => supportApi.getTicket(id) });

  if (isLoading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FAF7F2]">
        <Spinner label="Loading ticket" />
      </div>
    );
  if (!ticket) return null;

  const isStaff = user?.role !== "customer";

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim()) return;
    setError("");
    setSending(true);
    try {
      await supportApi.replyToTicket(id, reply);
      setReply("");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

  const handleStatusChange = async (status) => {
    try {
      await supportApi.updateTicketStatus(id, status);
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="min-h-full bg-[#FAF7F2]">
      <div className="mx-auto max-w-2xl px-6 py-12">
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

        <div className="flex flex-wrap items-center justify-between gap-3">
          <h1 className="text-2xl font-semibold text-[#101B2C]">{ticket.subject}</h1>
          {isStaff ? (
            <select
              value={ticket.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              className="w-auto rounded-md border border-[#E7E2D8] bg-white px-3 py-1.5 text-sm text-[#1E2430] transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25"
            >
              {STATUS_OPTIONS.map((s) => (
                <option key={s} value={s}>
                  {s.replace("_", " ")}
                </option>
              ))}
            </select>
          ) : (
            <span
              className={`rounded-full px-2.5 py-1 text-xs font-semibold ${STATUS_STYLES[ticket.status]}`}
            >
              {ticket.status.replace("_", " ")}
            </span>
          )}
        </div>

        <p className="mt-1 text-sm text-[#7C7669]">
          {ticket.category}
          {ticket.order && ` · Order ${ticket.order}`}
        </p>

        {error && (
          <div className="mt-4">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3">
          {ticket.messages.map((m) => (
            <div
              key={m.id}
              className={`rounded-lg border p-4 ${
                m.is_staff_reply
                  ? "border-[#BF9A63]/30 bg-[#BF9A63]/10"
                  : "border-[#E7E2D8] bg-white"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <strong className="text-sm text-[#101B2C]">
                  {m.is_staff_reply ? "Support team" : m.sender_email}
                </strong>
                <span className="text-xs text-[#7C7669]">
                  {new Date(m.created_at).toLocaleString("en-KE")}
                </span>
              </div>
              <p className="text-sm leading-relaxed text-[#1E2430]">{m.message}</p>
            </div>
          ))}
        </div>

        <form
          onSubmit={handleReply}
          className="mt-6 rounded-xl border border-[#E7E2D8] bg-white p-5"
        >
          <label htmlFor="reply" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7C7669]">
            Reply
          </label>
          <textarea
            id="reply"
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="w-full resize-none rounded-md border border-[#E7E2D8] bg-white px-3 py-2 text-sm text-[#1E2430] transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25"
          />
          <button
            type="submit"
            disabled={sending}
            className="mt-3 rounded-md bg-[#101B2C] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] disabled:text-[#7C7669]"
          >
            {sending ? "Sending…" : "Send reply"}
          </button>
        </form>
      </div>
    </div>
  );
}