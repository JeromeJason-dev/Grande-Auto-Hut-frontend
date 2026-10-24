import { useRef, useState } from "react";
import { Navigate, useParams, useNavigate } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as supportApi from "../../api/support";
import { useAuth } from "../auth/AuthContext";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";
import Spinner from "../../components/Spinner";

const STATUS_STYLES = {
  open: "bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-950/60 dark:text-blue-300",
  resolved: "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300",
  closed: "bg-[#E7E2D8] text-[#7C7669] dark:bg-slate-800 dark:text-slate-400",
};

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "gif", "webp", "txt", "csv", "zip", "doc", "docx", "xls", "xlsx"];
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

function formatBytes(bytes) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentLink({ ticketId, attachment, onError }) {
  const [busy, setBusy] = useState(false);
  const download = async () => {
    setBusy(true);
    try {
      await supportApi.downloadAttachment(ticketId, attachment);
    } catch (err) {
      onError(extractErrorMessage(err));
    } finally {
      setBusy(false);
    }
  };
  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      aria-label={`Download ${attachment.filename} (${formatBytes(attachment.size)})`}
      className="inline-flex max-w-full items-center gap-2 rounded-md border border-[#E7E2D8] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#0B121F] px-3 py-1.5 text-xs text-[#101B2C] dark:text-white transition-colors hover:border-[#BF9A63]/50 disabled:opacity-60"
    >
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" />
      </svg>
      <span className="truncate font-medium">{attachment.filename}</span>
      <span className="shrink-0 text-[#7C7669] dark:text-slate-400">{formatBytes(attachment.size)}</span>
    </button>
  );
}

export default function TicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileInput = useRef(null);
  const [reply, setReply] = useState("");
  const [files, setFiles] = useState([]);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // Support staff work tickets from the admin area (this also catches old notification links).
  const isStaff = user?.role !== "customer";

  const { data: ticket, isLoading } = useQuery({
    queryKey: ["ticket", id],
    queryFn: () => supportApi.getTicket(id),
    enabled: !isStaff,
  });

  if (isStaff) return <Navigate to={`${user?.role === "staff" ? "/staff" : "/admin"}/tickets/${id}`} replace />;

  if (isLoading)
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-[#FAF7F2] dark:bg-[#0B121F]">
        <Spinner label="Loading ticket" />
      </div>
    );
  if (!ticket) return null;

  const addFiles = (picked) => {
    setError("");
    const next = [...files];
    for (const f of picked) {
      const ext = f.name.split(".").pop()?.toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setError(`“${f.name}”: this file type isn't allowed.`);
        continue;
      }
      if (f.size > MAX_BYTES) {
        setError(`“${f.name}” is larger than ${MAX_BYTES / (1024 * 1024)} MB.`);
        continue;
      }
      if (next.length >= MAX_FILES) {
        setError(`You can attach up to ${MAX_FILES} files.`);
        break;
      }
      next.push(f);
    }
    setFiles(next);
  };

  const handleReply = async (e) => {
    e.preventDefault();
    if (!reply.trim() && files.length === 0) return;
    setError("");
    setSending(true);
    try {
      await supportApi.replyToTicket(id, reply.trim(), files);
      setReply("");
      setFiles([]);
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      queryClient.invalidateQueries({ queryKey: ["tickets"] });
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSending(false);
    }
  };

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
          <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">{ticket.subject}</h1>
          <span className={`rounded-full px-2.5 py-1 text-xs font-semibold capitalize ${STATUS_STYLES[ticket.status]}`}>
            {ticket.status.replace("_", " ")}
          </span>
        </div>

        <p className="mt-1 text-sm text-[#7C7669] dark:text-slate-400">
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
                  ? "border-[#BF9A63]/30 bg-[#BF9A63]/10 dark:bg-[#BF9A63]/10 dark:border-[#BF9A63]/30"
                  : "border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C]"
              }`}
            >
              <div className="mb-1.5 flex items-center justify-between gap-3">
                <strong className="text-sm text-[#101B2C] dark:text-white">
                  {m.is_staff_reply ? "Support team" : m.sender_email}
                </strong>
                <span className="text-xs text-[#7C7669] dark:text-slate-400">
                  {new Date(m.created_at).toLocaleString("en-KE")}
                </span>
              </div>
              {m.message && (
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-[#1E2430] dark:text-slate-200">{m.message}</p>
              )}
              {m.attachments?.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {m.attachments.map((a) => (
                    <AttachmentLink key={a.id} ticketId={ticket.id} attachment={a} onError={setError} />
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>

        <form
          onSubmit={handleReply}
          className="mt-6 rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] p-5 shadow-sm dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
        >
          <label htmlFor="reply" className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-slate-400">
            Reply
          </label>
          <textarea
            id="reply"
            rows={3}
            value={reply}
            onChange={(e) => setReply(e.target.value)}
            className="w-full resize-none rounded-md border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] px-3 py-2 text-sm text-[#1E2430] dark:text-slate-100 transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25"
          />

          {files.length > 0 && (
            <ul className="mt-3 flex flex-wrap gap-2">
              {files.map((f, i) => (
                <li
                  key={`${f.name}-${i}`}
                  className="flex items-center gap-2 rounded-md border border-[#E7E2D8] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#0B121F] py-1 pl-2.5 pr-1 text-xs text-[#101B2C] dark:text-white"
                >
                  <span className="max-w-[10rem] truncate">{f.name}</span>
                  <span className="text-[#7C7669] dark:text-slate-400">{formatBytes(f.size)}</span>
                  <button
                    type="button"
                    aria-label={`Remove ${f.name}`}
                    onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                    className="rounded px-1.5 py-0.5 hover:bg-black/5 dark:hover:bg-white/10"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <button
              type="submit"
              disabled={sending || (!reply.trim() && files.length === 0)}
              className="rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2 text-sm font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] dark:disabled:bg-slate-700 disabled:text-[#7C7669] dark:disabled:text-slate-400"
            >
              {sending ? "Sending…" : "Send reply"}
            </button>
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              className="rounded-md border border-[#E7E2D8] dark:border-white/10 px-4 py-2 text-sm font-medium text-[#101B2C] dark:text-white transition-colors hover:bg-[#FAF7F2] dark:hover:bg-white/5"
            >
              Attach files
            </button>
            <input
              ref={fileInput}
              type="file"
              multiple
              hidden
              accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
              onChange={(e) => {
                addFiles([...e.target.files]);
                e.target.value = "";
              }}
            />
            <span className="text-xs text-[#7C7669] dark:text-slate-400">Up to 5 files, 5 MB each</span>
          </div>
        </form>
      </div>
    </div>
  );
}