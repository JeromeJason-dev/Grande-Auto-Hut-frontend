import { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Archive, ArchiveRestore, Check, ChevronDown, ChevronLeft, CircleCheck, Clock, Copy, Download, EllipsisVertical,
  File, FileArchive, FileImage, FileSpreadsheet, FileText, ListPlus, Mail, Paperclip, Plus, Reply, RotateCcw,
  Send, ShieldAlert, Smile, Trash2, UserPlus, Link2, MessageSquareText, X,
} from "lucide-react";
import * as supportApi from "../../api/support";
import * as staffApi from "../../api/staff";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";
import Spinner from "../../components/Spinner";
import { useAuth } from "../auth/AuthContext";
import { useNotificationToastContext } from "../notifications/NotificationToastContext";
import TaskModal from "./TaskModal";
import { Avatar, Badge, Dropdown, Linkify, MenuItem } from "./AdminUi";
import {
  PRIORITY_OPTIONS, PRIORITY_STYLES, STATUS_STYLES, CATEGORY_OPTIONS, TICKET_STATUS_OPTIONS, TASK_STATUS_STYLES, cardClasses, controlClasses, formatBytes, formatDate, formatDateTime, formatShortTime, ghostButton, labelOf, labelClasses, primaryButton, shortId, timeAgo, TASK_STATUS_OPTIONS, useNow,
} from "./adminConstants";

const TICKET_KEY = (id) => ["ticket", "admin", id];

const ALLOWED_EXTENSIONS = ["pdf", "png", "jpg", "jpeg", "gif", "webp", "txt", "csv", "zip", "doc", "docx", "xls", "xlsx"];
const MAX_FILES = 5;
const MAX_BYTES = 5 * 1024 * 1024;

const EMOJIS = ["😀", "😊", "🙂", "👍", "🙏", "🎉", "✅", "👌", "🚗", "🔧", "📦", "💳", "📞", "⏰", "❤️", "😅"];

const QUICK_REPLIES = [
  {
    label: "Looking into it",
    body: "Hi {first},\n\nThanks for reaching out to Grande Auto Hut. I'm looking into this now and will get back to you shortly.\n\nKind regards,\n{agent}",
  },
  {
    label: "Need more details",
    body: "Hi {first},\n\nCould you share a few more details so I can help you quickly? Your order number and, for parts, your vehicle's make, model and year would be ideal.\n\nKind regards,\n{agent}",
  },
  {
    label: "Verify M-Pesa payment",
    body: "Hi {first},\n\nThanks for letting us know. Please reply with the M-Pesa confirmation code so we can match the payment to your order.\n\nKind regards,\n{agent}",
  },
  {
    label: "Issue resolved",
    body: "Hi {first},\n\nI'm glad we could sort this out. I'll mark this ticket as resolved, but just reply here if you need anything else.\n\nKind regards,\n{agent}",
  },
];

function FileTypeIcon({ filename, ...props }) {
  const ext = filename.split(".").pop()?.toLowerCase();
  if (["png", "jpg", "jpeg", "gif", "webp"].includes(ext)) return <FileImage {...props} />;
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet {...props} />;
  if (ext === "zip") return <FileArchive {...props} />;
  if (["pdf", "doc", "docx", "txt"].includes(ext)) return <FileText {...props} />;
  return <File {...props} />;
}

/* ------------------------------------------------------------------ pieces */

function Attachment({ ticketId, attachment }) {
  const toast = useNotificationToastContext();
  const [busy, setBusy] = useState(false);

  const download = async () => {
    setBusy(true);
    try {
      await supportApi.downloadAttachment(ticketId, attachment);
    } catch (err) {
      toast?.showToast({ type: "error", title: "Download failed", message: extractErrorMessage(err) });
    } finally {
      setBusy(false);
    }
  };

  return (
    <button
      type="button"
      onClick={download}
      disabled={busy}
      title={`Download ${attachment.filename}`}
      aria-label={`Download ${attachment.filename} (${formatBytes(attachment.size)})`}
      className="flex min-w-[13rem] max-w-xs items-center gap-3 rounded-lg border border-[#E7E2D8] bg-[#FAF7F2] px-3 py-2.5 text-left transition-colors hover:border-[#BF9A63]/50 disabled:opacity-60 dark:border-[#25344D] dark:bg-[#0B1320]"
    >
      <FileTypeIcon filename={attachment.filename} aria-hidden="true" className="h-8 w-8 shrink-0 text-[#BF9A63]" strokeWidth={1.5} />
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-[#101B2C] dark:text-white">{attachment.filename}</span>
        <span className="block text-xs text-[#7C7669] dark:text-[#9FA8B8]">{formatBytes(attachment.size)}</span>
      </span>
      <Download aria-hidden="true" className={`h-4 w-4 shrink-0 text-[#7C7669] dark:text-[#9FA8B8] ${busy ? "animate-pulse" : ""}`} />
    </button>
  );
}

function Message({ message, ticket, onReply }) {
  const toast = useNotificationToastContext();
  const fromTeam = message.is_staff_reply;
  const to = fromTeam ? `${ticket.requester.name} <${ticket.requester.email}>` : "Grande Auto Hut Support";

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(message.message);
      toast?.showToast({ type: "success", title: "Copied", message: "Message text copied." });
    } catch {
      toast?.showToast({ type: "warning", title: "Couldn't copy", message: "Your browser blocked clipboard access." });
    }
  };

  return (
    <article className="py-6 first:pt-2">
      <header className="flex items-start gap-3">
        <Avatar name={message.sender_name} email={message.sender_email} size={44} />
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm text-[#101B2C] dark:text-white">
            <span className="font-semibold">{message.sender_name}</span>{" "}
            <span className="text-[#7C7669] dark:text-[#9FA8B8]">&lt;{message.sender_email}&gt;</span>
            {fromTeam && <Badge className="ml-2 bg-[#BF9A63]/15 !py-0.5 text-[#8C6C3F] dark:text-[#D4AF77]">Team</Badge>}
          </p>
          <p className="truncate text-xs text-[#7C7669] dark:text-[#9FA8B8]">To: {to}</p>
        </div>
        <div className="flex shrink-0 items-center gap-1 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
          <span className="mr-1 hidden items-center gap-1.5 sm:inline-flex" title={formatDateTime(message.created_at)}>
            <Clock aria-hidden="true" className="h-3.5 w-3.5" />
            {formatShortTime(message.created_at)} ({timeAgo(message.created_at)})
          </span>
          <button
            type="button" onClick={onReply} aria-label="Reply"
            className="rounded-md p-1.5 transition-colors hover:bg-[#FAF7F2] hover:text-[#101B2C] dark:hover:bg-[#1B2A42] dark:hover:text-white"
          >
            <Reply className="h-4 w-4" />
          </button>
          <Dropdown
            align="right" panelClassName="w-44"
            renderTrigger={({ toggle }) => (
              <button
                type="button" onClick={toggle} aria-label="Message actions"
                className="rounded-md p-1.5 transition-colors hover:bg-[#FAF7F2] hover:text-[#101B2C] dark:hover:bg-[#1B2A42] dark:hover:text-white"
              >
                <EllipsisVertical className="h-4 w-4" />
              </button>
            )}
          >
            {({ close }) => (
              <>
                <MenuItem icon={Reply} onClick={() => { close(); onReply(); }}>Reply</MenuItem>
                <MenuItem icon={Copy} disabled={!message.message} onClick={() => { close(); copy(); }}>Copy text</MenuItem>
              </>
            )}
          </Dropdown>
        </div>
      </header>

      {message.message && (
        <p className="mt-4 whitespace-pre-wrap break-words text-sm leading-relaxed text-[#1E2430] dark:text-slate-200 sm:pl-14">
          <Linkify text={message.message} />
        </p>
      )}

      {message.attachments?.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-3 sm:pl-14">
          {message.attachments.map((a) => (
            <Attachment key={a.id} ticketId={ticket.id} attachment={a} />
          ))}
        </div>
      )}
    </article>
  );
}

function Composer({ ticket, user, textareaRef }) {
  const queryClient = useQueryClient();
  const toast = useNotificationToastContext();
  const fileInput = useRef(null);
  const [text, setText] = useState("");
  const [files, setFiles] = useState([]);
  const [resolveAfter, setResolveAfter] = useState(false);
  const [linkOpen, setLinkOpen] = useState(false);
  const [linkUrl, setLinkUrl] = useState("");
  const [error, setError] = useState("");

  const firstName = ticket.requester.name.split(" ")[0] || "there";
  const agent = user?.first_name || "Grande Auto Hut Support";

  const insert = (snippet) => {
    const el = textareaRef.current;
    const start = el?.selectionStart ?? text.length;
    const end = el?.selectionEnd ?? text.length;
    setText(text.slice(0, start) + snippet + text.slice(end));
    requestAnimationFrame(() => {
      el?.focus();
      el?.setSelectionRange(start + snippet.length, start + snippet.length);
    });
  };

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

  const send = useMutation({
    mutationFn: async () => {
      await supportApi.replyToTicket(ticket.id, text.trim(), files);
      if (resolveAfter) await supportApi.updateTicket(ticket.id, { status: "resolved" });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: TICKET_KEY(ticket.id) });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      toast?.showToast({
        type: "success",
        title: resolveAfter ? "Reply sent · ticket resolved" : "Reply sent",
        message: `${ticket.requester.name} has been notified.`,
      });
      setText("");
      setFiles([]);
      setResolveAfter(false);
      setError("");
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const canSend = (text.trim() || files.length) && !send.isPending;
  const submit = () => canSend && send.mutate();

  const iconButton =
    "rounded-md p-2 text-[#7C7669] transition-colors hover:bg-[#FAF7F2] hover:text-[#101B2C] dark:text-[#9FA8B8] dark:hover:bg-[#1B2A42] dark:hover:text-white";

  return (
    <section
      aria-label="Reply"
      className="mt-2 rounded-xl border border-[#E7E2D8] bg-white shadow-sm dark:border-[#25344D] dark:bg-[#162235]"
    >
      <div className="flex items-center gap-2 px-4 pt-3 text-sm text-[#101B2C] dark:text-white">
        <Reply aria-hidden="true" className="h-4 w-4 text-[#7C7669] dark:text-[#9FA8B8]" />
        <span className="font-medium">{ticket.requester.name}</span>
        <span className="truncate text-xs text-[#7C7669] dark:text-[#9FA8B8]">({ticket.requester.email})</span>
      </div>

      <textarea
        ref={textareaRef}
        aria-label="Write your reply"
        rows={5}
        value={text}
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) {
            e.preventDefault();
            submit();
          }
        }}
        placeholder="Write your reply…  (Ctrl/⌘ + Enter to send)"
        className="block w-full resize-y bg-transparent px-4 py-3 text-sm text-[#1E2430] placeholder:text-[#9A9385] focus:outline-none dark:text-slate-100"
      />

      {files.length > 0 && (
        <ul className="flex flex-wrap gap-2 px-4 pb-3">
          {files.map((f, i) => (
            <li
              key={`${f.name}-${i}`}
              className="flex items-center gap-2 rounded-md border border-[#E7E2D8] bg-[#FAF7F2] py-1 pl-2.5 pr-1 text-xs text-[#101B2C] dark:border-[#25344D] dark:bg-[#0B1320] dark:text-white"
            >
              <Paperclip aria-hidden="true" className="h-3 w-3 text-[#BF9A63]" />
              <span className="max-w-[10rem] truncate">{f.name}</span>
              <span className="text-[#7C7669] dark:text-[#9FA8B8]">{formatBytes(f.size)}</span>
              <button
                type="button" aria-label={`Remove ${f.name}`}
                onClick={() => setFiles(files.filter((_, idx) => idx !== i))}
                className="rounded p-0.5 hover:bg-black/5 dark:hover:bg-white/10"
              >
                <X className="h-3 w-3" />
              </button>
            </li>
          ))}
        </ul>
      )}

      {linkOpen && (
        <div className="flex items-center gap-2 border-t border-[#E7E2D8] px-4 py-2.5 dark:border-[#25344D]">
          <Link2 aria-hidden="true" className="h-4 w-4 shrink-0 text-[#7C7669]" />
          <input
            autoFocus type="url" value={linkUrl} onChange={(e) => setLinkUrl(e.target.value)}
            placeholder="https://…"
            onKeyDown={(e) => {
              if (e.key === "Enter") {
                e.preventDefault();
                if (linkUrl.trim()) insert(linkUrl.trim());
                setLinkUrl(""); setLinkOpen(false);
              }
              if (e.key === "Escape") setLinkOpen(false);
            }}
            className={`${controlClasses} !py-1.5`}
          />
          <button
            type="button" className={ghostButton}
            onClick={() => { if (linkUrl.trim()) insert(linkUrl.trim()); setLinkUrl(""); setLinkOpen(false); }}
          >
            Insert
          </button>
        </div>
      )}

      {error && (
        <div className="px-4 pb-3">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-1 border-t border-[#E7E2D8] px-3 py-2.5 dark:border-[#25344D]">
        <button type="button" onClick={submit} disabled={!canSend} className={`${primaryButton} mr-2`}>
          <Send aria-hidden="true" className="h-4 w-4" />
          {send.isPending ? "Sending…" : resolveAfter ? "Send & resolve" : "Send"}
        </button>

        <Dropdown
          panelClassName="w-64 bottom-full !mt-0 mb-1.5"
          renderTrigger={({ toggle }) => (
            <button type="button" onClick={toggle} className={`${iconButton} flex items-center gap-1`} aria-label="Quick replies" title="Quick replies">
              <MessageSquareText className="h-[18px] w-[18px]" strokeWidth={1.75} />
              <ChevronDown className="h-3 w-3" />
            </button>
          )}
        >
          {({ close }) => (
            <>
              <p className="px-3 pb-1 pt-2 text-[11px] font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]">
                Quick replies
              </p>
              {QUICK_REPLIES.map((r) => (
                <MenuItem
                  key={r.label}
                  onClick={() => {
                    insert(r.body.replaceAll("{first}", firstName).replaceAll("{agent}", agent));
                    close();
                  }}
                >
                  {r.label}
                </MenuItem>
              ))}
            </>
          )}
        </Dropdown>

        <button
          type="button" className={iconButton} aria-label="Insert link" title="Insert link"
          onClick={() => setLinkOpen((v) => !v)}
        >
          <Link2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>

        <Dropdown
          panelClassName="w-52 bottom-full !mt-0 mb-1.5"
          renderTrigger={({ toggle }) => (
            <button type="button" onClick={toggle} className={iconButton} aria-label="Insert emoji" title="Insert emoji">
              <Smile className="h-[18px] w-[18px]" strokeWidth={1.75} />
            </button>
          )}
        >
          {({ close }) => (
            <div className="grid grid-cols-8 gap-0.5 p-2">
              {EMOJIS.map((e) => (
                <button
                  key={e} type="button" onClick={() => { insert(e); close(); }}
                  className="rounded p-1 text-lg leading-none hover:bg-[#FAF7F2] dark:hover:bg-[#1B2A42]"
                >
                  {e}
                </button>
              ))}
            </div>
          )}
        </Dropdown>

        <button
          type="button" className={iconButton} aria-label="Attach files" title="Attach files (up to 5, 5 MB each)"
          onClick={() => fileInput.current?.click()}
        >
          <Paperclip className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
        <input
          ref={fileInput} type="file" multiple hidden
          accept={ALLOWED_EXTENSIONS.map((e) => `.${e}`).join(",")}
          onChange={(e) => { addFiles([...e.target.files]); e.target.value = ""; }}
        />

        <label className="ml-auto flex cursor-pointer items-center gap-2 pr-1 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
          <input
            type="checkbox" checked={resolveAfter} onChange={(e) => setResolveAfter(e.target.checked)}
            className="h-3.5 w-3.5 accent-[#BF9A63]"
          />
          Resolve after sending
        </label>

        <button
          type="button" aria-label="Discard draft" title="Discard draft" className={`${iconButton} hover:!text-red-600`}
          disabled={!text && files.length === 0}
          onClick={() => { setText(""); setFiles([]); setError(""); setLinkOpen(false); }}
        >
          <Trash2 className="h-[18px] w-[18px]" strokeWidth={1.75} />
        </button>
      </div>
    </section>
  );
}

function DetailRow({ label, children }) {
  return (
    <div className="grid grid-cols-[7.5rem_minmax(0,1fr)] items-start gap-3 py-1.5 text-sm">
      <dt className="text-[#7C7669] dark:text-[#9FA8B8]">{label}</dt>
      <dd className="min-w-0 break-words font-medium text-[#101B2C] dark:text-white">{children}</dd>
    </div>
  );
}

function SidebarHeading({ children, action }) {
  return (
    <div className="mb-2 flex items-center justify-between">
      <h3 className="text-base font-semibold text-[#101B2C] dark:text-white">{children}</h3>
      {action}
    </div>
  );
}

function SlaValue({ due, doneAt, doneLabel, active, now }) {
  const late = active && !doneAt && new Date(due).getTime() < now;
  return (
    <span className="block">
      <span className={late ? "text-red-600 dark:text-red-400" : ""}>{formatDateTime(due)}</span>
      {doneAt ? (
        <span className="mt-0.5 flex items-center gap-1 text-xs font-normal text-emerald-600 dark:text-emerald-400">
          <CircleCheck className="h-3 w-3" /> {doneLabel} {timeAgo(doneAt)}
        </span>
      ) : late ? (
        <span className="mt-0.5 block text-xs font-normal text-red-600 dark:text-red-400">Overdue</span>
      ) : null}
    </span>
  );
}

function LinkedTasks({ ticket, user, isAdmin, onAdd }) {
  const queryClient = useQueryClient();
  const toast = useNotificationToastContext();
  const toggle = useMutation({
    mutationFn: (t) => staffApi.updateTask(t.id, { status: t.status === "done" ? "todo" : "done" }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["ticket"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    },
    onError: (err) => toast?.showToast({ type: "error", title: "Couldn't update task", message: extractErrorMessage(err) }),
  });

  return (
    <section>
      <SidebarHeading
        action={
          <button type="button" onClick={onAdd} className="inline-flex items-center gap-1 text-xs font-semibold text-[#A9834E] hover:underline dark:text-[#D4AF77]">
            <Plus className="h-3.5 w-3.5" /> Add
          </button>
        }
      >
        Tasks
      </SidebarHeading>
      {ticket.tasks.length === 0 ? (
        <p className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">No tasks linked to this ticket.</p>
      ) : (
        <ul className="space-y-2">
          {ticket.tasks.map((t) => {
            const done = t.status === "done";
            const canToggle = isAdmin || t.assigned_to === user?.id;
            return (
              <li key={t.id} className="flex items-start gap-2.5 rounded-lg border border-[#E7E2D8] px-3 py-2 dark:border-[#25344D]">
                <button
                  type="button" disabled={!canToggle || toggle.isPending} onClick={() => toggle.mutate(t)}
                  aria-label={done ? "Mark as to do" : "Mark as done"}
                  title={canToggle ? (done ? "Mark as to do" : "Mark as done") : "Only the assignee or an admin can change this"}
                  className={`mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded border transition-colors disabled:cursor-not-allowed ${
                    done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#BFB8A8] hover:border-[#BF9A63] dark:border-[#4A5A75]"
                  }`}
                >
                  {done && <Check className="h-3 w-3" strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={`text-sm font-medium ${done ? "text-[#7C7669] line-through" : "text-[#101B2C] dark:text-white"}`}>{t.title}</p>
                  <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                    <span>{t.assigned_to_name}</span>
                    {t.due_date && <span className={t.is_overdue ? "font-semibold text-red-600 dark:text-red-400" : ""}>Due {formatDate(t.due_date)}</span>}
                    <Badge className={`!px-2 !py-0 ${TASK_STATUS_STYLES[t.status]}`}>{labelOf(TASK_STATUS_OPTIONS, t.status)}</Badge>
                  </p>
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ page */

export default function AdminTicketDetailPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const toast = useNotificationToastContext();
  const now = useNow();
  const composerRef = useRef(null);
  const bottomRef = useRef(null);
  const markedRead = useRef("");
  const lastCount = useRef(null);

  const [draft, setDraft] = useState({});
  const [showTask, setShowTask] = useState(false);
  const [error, setError] = useState("");

  const { data: ticket, isLoading, isError } = useQuery({
    queryKey: TICKET_KEY(id),
    queryFn: () => supportApi.getTicket(id),
    retry: false,
  });
  const { data: staff = [] } = useQuery({ queryKey: ["admin-staff"], queryFn: staffApi.listStaff });

  const refreshLists = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
    queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
    queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
  };

  const update = useMutation({
    mutationFn: (changes) => supportApi.updateTicket(id, changes),
    onSuccess: (data) => {
      queryClient.setQueryData(TICKET_KEY(id), data);
      refreshLists();
      setError("");
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  // Opening a ticket marks it read (again whenever a new message lands while it's open).
  useEffect(() => {
    if (!ticket) return;
    const key = `${ticket.id}:${ticket.messages.length}`;
    if (ticket.is_unread && markedRead.current !== key) {
      markedRead.current = key;
      supportApi
        .updateTicket(ticket.id, { is_unread: false })
        .then((data) => {
          queryClient.setQueryData(TICKET_KEY(ticket.id), data);
          queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        })
        .catch(() => {});
    }
  }, [ticket, queryClient]);

  // Bring a freshly sent/received message into view (not on first load).
  const messageCount = ticket?.messages.length;
  useEffect(() => {
    if (messageCount == null) return;
    if (lastCount.current !== null && messageCount > lastCount.current) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
    lastCount.current = messageCount;
  }, [messageCount]);

  const dirtyFields = useMemo(() => {
    if (!ticket) return {};
    const changes = {};
    for (const [field, value] of Object.entries(draft)) {
      if (value !== ticket[field]) changes[field] = value;
    }
    return changes;
  }, [draft, ticket]);
  const dirty = Object.keys(dirtyFields).length > 0;

  if (isLoading) {
    return (
      <div className="flex justify-center py-16">
        <Spinner label="Loading ticket" />
      </div>
    );
  }
  if (isError || !ticket) {
    return (
      <div className={`${cardClasses} p-8 text-center`}>
        <p className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">We couldn't find that ticket. It may have been deleted.</p>
        <Link to="/admin/tickets" className={`${primaryButton} mt-4`}>Back to tickets</Link>
      </div>
    );
  }

  const value = (field) => (field in draft ? draft[field] : ticket[field]);
  const setField = (field) => (e) => setDraft((d) => ({ ...d, [field]: e.target.value }));
  const active = ticket.status === "open" || ticket.status === "in_progress";

  const backToList = () => navigate("/admin/tickets");

  const run = (changes, { successTitle, successMessage, then } = {}) =>
    update.mutate(changes, {
      onSuccess: () => {
        if (successTitle) toast?.showToast({ type: "success", title: successTitle, message: successMessage });
        then?.();
      },
    });

  const assign = (person) => {
    // A quick-assign supersedes an unsaved dropdown choice.
    setDraft((d) => {
      const next = { ...d };
      delete next.assigned_to;
      return next;
    });
    run(
      { assigned_to: person?.id ?? null },
      {
        successTitle: person ? "Ticket assigned" : "Ticket unassigned",
        successMessage: person ? `Assigned to ${person.id === user?.id ? "you" : person.full_name}.` : undefined,
      },
    );
  };

  const saveProperties = () =>
    update.mutate(dirtyFields, {
      onSuccess: () => {
        setDraft({});
        toast?.showToast({ type: "success", title: "Ticket updated", message: "Your changes have been saved." });
      },
    });

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast?.showToast({ type: "success", title: "Link copied", message: "Ticket link copied to your clipboard." });
    } catch {
      toast?.showToast({ type: "warning", title: "Couldn't copy", message: "Your browser blocked clipboard access." });
    }
  };

  const remove = async () => {
    if (!window.confirm("Delete this ticket and all its messages? This can't be undone.")) return;
    try {
      await supportApi.deleteTicket(ticket.id);
      queryClient.removeQueries({ queryKey: TICKET_KEY(ticket.id) });
      refreshLists();
      toast?.showToast({ type: "success", title: "Ticket deleted", message: ticket.subject });
      backToList();
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const toolbarButton = `${ghostButton} !px-3 !py-1.5`;

  return (
    <div>
      <nav aria-label="Breadcrumb" className="mb-4 flex items-center gap-1.5 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
        <Link to="/admin/tickets" className="inline-flex items-center gap-1 hover:text-[#101B2C] dark:hover:text-white">
          <ChevronLeft aria-hidden="true" className="h-4 w-4" /> Tickets
        </Link>
        <span aria-hidden="true">/</span>
        <span className="text-[#101B2C] dark:text-white">Ticket details</span>
      </nav>

      <div className={`${cardClasses} grid overflow-hidden lg:grid-cols-[minmax(0,1fr)_21rem]`}>
        {/* ---------------- main column ---------------- */}
        <div className="min-w-0 p-5 sm:p-6">
          <div className="flex flex-wrap items-center gap-2 border-b border-[#E7E2D8] pb-4 dark:border-[#25344D]">
            <Dropdown
              panelClassName="w-64 max-h-80 overflow-y-auto"
              renderTrigger={({ toggle }) => (
                <button type="button" onClick={toggle} className={toolbarButton}>
                  <UserPlus aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} /> Assign
                </button>
              )}
            >
              {({ close }) => (
                <>
                  <MenuItem icon={UserPlus} disabled={ticket.assigned_to === user?.id} onClick={() => { close(); assign(user); }}>
                    Assign to me
                  </MenuItem>
                  {staff.filter((s) => s.id !== user?.id).map((s) => (
                    <button
                      key={s.id} type="button" onClick={() => { close(); assign(s); }}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-left text-sm text-[#101B2C] hover:bg-[#FAF7F2] dark:text-white dark:hover:bg-[#1B2A42]"
                    >
                      <Avatar name={s.full_name} email={s.email} size={24} />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate">{s.full_name}</span>
                        <span className="block text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                          {s.open_tickets} open ticket{s.open_tickets === 1 ? "" : "s"}
                        </span>
                      </span>
                      {ticket.assigned_to === s.id && <Check className="h-4 w-4 text-[#BF9A63]" />}
                    </button>
                  ))}
                  {ticket.assigned_to && (
                    <MenuItem icon={X} onClick={() => { close(); assign(null); }}>Unassign</MenuItem>
                  )}
                </>
              )}
            </Dropdown>

            <button
              type="button" className={toolbarButton} disabled={update.isPending}
              onClick={() =>
                run(
                  { is_archived: !ticket.is_archived },
                  {
                    successTitle: ticket.is_archived ? "Ticket restored" : "Ticket archived",
                    successMessage: ticket.subject,
                    then: ticket.is_archived ? undefined : backToList,
                  },
                )
              }
            >
              {ticket.is_archived ? <ArchiveRestore className="h-4 w-4" strokeWidth={1.75} /> : <Archive className="h-4 w-4" strokeWidth={1.75} />}
              {ticket.is_archived ? "Unarchive" : "Archive"}
            </button>

            <button
              type="button" className={toolbarButton} disabled={update.isPending}
              onClick={() =>
                run(
                  { is_spam: !ticket.is_spam },
                  {
                    successTitle: ticket.is_spam ? "Moved out of spam" : "Marked as spam",
                    successMessage: ticket.subject,
                    then: ticket.is_spam ? undefined : backToList,
                  },
                )
              }
            >
              <ShieldAlert className="h-4 w-4" strokeWidth={1.75} /> {ticket.is_spam ? "Not spam" : "Spam"}
            </button>

            <button
              type="button" className={toolbarButton} disabled={update.isPending}
              onClick={() => run({ is_unread: true }, { successTitle: "Marked as unread", then: backToList })}
            >
              <Mail className="h-4 w-4" strokeWidth={1.75} /> Unread
            </button>

            <button type="button" className={toolbarButton} onClick={() => setShowTask(true)}>
              <ListPlus className="h-4 w-4" strokeWidth={1.75} /> Add Task
            </button>

            <Dropdown
              align="left" panelClassName="w-56"
              renderTrigger={({ toggle }) => (
                <button type="button" onClick={toggle} aria-label="More actions" className={`${toolbarButton} !px-2`}>
                  <EllipsisVertical className="h-4 w-4" strokeWidth={1.75} />
                </button>
              )}
            >
              {({ close }) => (
                <>
                  <MenuItem icon={Copy} onClick={() => { close(); copyLink(); }}>Copy ticket link</MenuItem>
                  {active ? (
                    <MenuItem icon={CircleCheck} onClick={() => { close(); run({ status: "resolved" }, { successTitle: "Ticket resolved", successMessage: ticket.subject }); }}>
                      Mark as resolved
                    </MenuItem>
                  ) : (
                    <MenuItem icon={RotateCcw} onClick={() => { close(); run({ status: "open" }, { successTitle: "Ticket reopened", successMessage: ticket.subject }); }}>
                      Reopen ticket
                    </MenuItem>
                  )}
                  {ticket.status !== "closed" && (
                    <MenuItem icon={X} onClick={() => { close(); run({ status: "closed" }, { successTitle: "Ticket closed", successMessage: ticket.subject }); }}>
                      Close ticket
                    </MenuItem>
                  )}
                  {isAdmin && (
                    <MenuItem icon={Trash2} danger onClick={() => { close(); remove(); }}>Delete ticket</MenuItem>
                  )}
                </>
              )}
            </Dropdown>
          </div>

          <div className="flex flex-wrap items-center gap-x-3 gap-y-2 py-5">
            <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">{ticket.subject}</h1>
            <Badge className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">ID {shortId(ticket.id)}</Badge>
            <Badge className={STATUS_STYLES[ticket.status]}>{labelOf(TICKET_STATUS_OPTIONS, ticket.status)}</Badge>
            {ticket.is_overdue && <Badge className="bg-red-600 text-white">Overdue</Badge>}
            {ticket.is_archived && <Badge className="bg-[#EDE7DC] text-[#7C7669] dark:bg-[#25344D] dark:text-[#9FA8B8]">Archived</Badge>}
            {ticket.is_spam && <Badge className="bg-red-50 text-red-700 dark:bg-red-950/40 dark:text-red-300">Spam</Badge>}
          </div>

          {error && (
            <div className="mb-3">
              <ErrorAlert message={error} />
            </div>
          )}

          <div className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
            {ticket.messages.map((m) => (
              <Message key={m.id} message={m} ticket={ticket} onReply={() => composerRef.current?.focus()} />
            ))}
          </div>
          <div ref={bottomRef} />

          <div className="mt-4">
            <Composer ticket={ticket} user={user} textareaRef={composerRef} />
          </div>
        </div>

        {/* ---------------- sidebar ---------------- */}
        <aside className="space-y-7 border-t border-[#E7E2D8] bg-[#FDFCFA] p-5 dark:border-[#25344D] dark:bg-[#121E31] sm:p-6 lg:border-l lg:border-t-0">
          <section>
            <SidebarHeading>Details</SidebarHeading>
            <dl>
              <DetailRow label="Ticket ID">
                <Badge className="bg-red-50 text-red-600 dark:bg-red-950/40 dark:text-red-300">ID {shortId(ticket.id)}</Badge>
              </DetailRow>
              <DetailRow label="Subject">{ticket.subject}</DetailRow>
              <DetailRow label="Created">{formatDateTime(ticket.created_at)}</DetailRow>
              <DetailRow label="First response due">
                <SlaValue due={ticket.first_response_due} doneAt={ticket.first_response_at} doneLabel="Responded" active={active} now={now} />
              </DetailRow>
              <DetailRow label="Resolution due">
                <SlaValue due={ticket.resolution_due} doneAt={ticket.resolved_at} doneLabel="Resolved" active={active} now={now} />
              </DetailRow>
              {ticket.order && <DetailRow label="Order"><span className="font-mono text-xs">{shortId(ticket.order)}</span></DetailRow>}
            </dl>
          </section>

          <section>
            <SidebarHeading>Requester info</SidebarHeading>
            <dl>
              <DetailRow label="Requester">{ticket.requester.name}</DetailRow>
              <DetailRow label="Email">
                <a href={`mailto:${ticket.requester.email}`} className="text-[#A9834E] hover:underline dark:text-[#D4AF77]">
                  {ticket.requester.email}
                </a>
              </DetailRow>
              {ticket.requester.phone_number && (
                <DetailRow label="Phone">
                  <a href={`tel:${ticket.requester.phone_number}`} className="hover:underline">{ticket.requester.phone_number}</a>
                </DetailRow>
              )}
              <DetailRow label="Customer since">{formatDate(ticket.requester.joined)}</DetailRow>
            </dl>
          </section>

          <section>
            <SidebarHeading>Properties</SidebarHeading>
            <div className="space-y-4">
              <div>
                <label htmlFor="prop-type" className={labelClasses}>Type</label>
                <select id="prop-type" value={value("category")} onChange={setField("category")} className={controlClasses}>
                  {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="prop-status" className={labelClasses}>Status</label>
                <select id="prop-status" value={value("status")} onChange={setField("status")} className={controlClasses}>
                  {TICKET_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="prop-priority" className={`${labelClasses} flex items-center justify-between`}>
                  Priority
                  <Badge className={`!py-0.5 normal-case tracking-normal ${PRIORITY_STYLES[value("priority")]}`}>
                    {labelOf(PRIORITY_OPTIONS, value("priority"))}
                  </Badge>
                </label>
                <select id="prop-priority" value={value("priority")} onChange={setField("priority")} className={controlClasses}>
                  {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="prop-assignee" className={labelClasses}>Assign to</label>
                <select
                  id="prop-assignee"
                  value={value("assigned_to") ?? ""}
                  onChange={(e) => setDraft((d) => ({ ...d, assigned_to: e.target.value || null }))}
                  className={controlClasses}
                >
                  <option value="">Unassigned</option>
                  {staff.map((s) => (
                    <option key={s.id} value={s.id}>{s.full_name}{s.id === user?.id ? " (me)" : ""}</option>
                  ))}
                </select>
              </div>
              <button type="button" onClick={saveProperties} disabled={!dirty || update.isPending} className={`${primaryButton} w-full`}>
                {update.isPending ? "Updating…" : "Update"}
              </button>
              {dirty && (
                <button type="button" onClick={() => setDraft({})} className="w-full text-center text-xs text-[#7C7669] hover:underline dark:text-[#9FA8B8]">
                  Discard changes
                </button>
              )}
            </div>
          </section>

          <LinkedTasks ticket={ticket} user={user} isAdmin={isAdmin} onAdd={() => setShowTask(true)} />
        </aside>
      </div>

      {showTask && (
        <TaskModal
          ticket={{ id: ticket.id, subject: ticket.subject, assigned_to: ticket.assigned_to }}
          onClose={() => setShowTask(false)}
        />
      )}
    </div>
  );
}