import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useBasePath } from "../staff/useBasePath";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Archive, Clock, Inbox, Mail, Search, ShieldAlert, UserRound } from "lucide-react";
import * as supportApi from "../../api/support";
import * as staffApi from "../../api/staff";
import Spinner from "../../components/Spinner";
import { Avatar, Badge, Pagination } from "./AdminUi";
import {
  CATEGORY_OPTIONS, PRIORITY_OPTIONS, PRIORITY_STYLES, STATUS_STYLES, TICKET_STATUS_OPTIONS,
  cardClasses, controlClasses, labelOf, timeAgo,
} from "./adminConstants";

const PAGE_SIZE = 20;

const FOLDERS = [
  { key: "inbox", label: "Inbox", icon: Inbox },
  { key: "unread", label: "Unread", icon: Mail },
  { key: "mine", label: "Assigned to me", icon: UserRound },
  { key: "unassigned", label: "Unassigned", icon: UserRound },
  { key: "overdue", label: "Overdue", icon: Clock },
  { key: "archived", label: "Archived", icon: Archive },
  { key: "spam", label: "Spam", icon: ShieldAlert },
];

const EMPTY_COPY = {
  inbox: ["Inbox zero", "No tickets need attention right now."],
  unread: ["Nothing unread", "You're all caught up."],
  mine: ["Nothing assigned to you", "Tickets assigned to you will show up here."],
  unassigned: ["Everything is assigned", "No ticket is waiting for an owner."],
  overdue: ["Nothing overdue", "Every active ticket is within its deadlines."],
  archived: ["No archived tickets", "Archived tickets are kept here."],
  spam: ["No spam", "Tickets marked as spam are kept here."],
};

const defaultStatusFor = (folder) => (folder === "archived" || folder === "spam" ? "all" : "active");

const selectClasses = `${controlClasses} !w-auto min-w-[9rem] !py-2`;

export default function AdminTicketsPage() {
  const base = useBasePath();
  const navigate = useNavigate();
  const [folder, setFolder] = useState("inbox");
  const [status, setStatus] = useState("active");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [assignee, setAssignee] = useState("");
  const [search, setSearch] = useState("");
  const [q, setQ] = useState("");
  const [page, setPage] = useState(1);

  // Debounce the search box so we don't hit the API on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setQ(search.trim());
      setPage(1);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  const params = { view: folder, status, priority, category, assignee, q, page, page_size: PAGE_SIZE };
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== "" && v != null));

  const { data, isLoading, isError, isFetching } = useQuery({
    queryKey: ["admin-tickets", "list", clean],
    queryFn: () => supportApi.listTickets(clean),
    placeholderData: keepPreviousData,
  });
  const { data: stats } = useQuery({ queryKey: ["admin-tickets", "stats"], queryFn: supportApi.getTicketStats });
  const { data: staff = [] } = useQuery({ queryKey: ["admin-staff"], queryFn: staffApi.listStaff });

  const tickets = data?.results ?? [];
  const count = data?.count ?? 0;

  const pickFolder = (key) => {
    setFolder(key);
    setStatus(defaultStatusFor(key));
    setPage(1);
  };
  const filter = (setter) => (e) => {
    setter(e.target.value);
    setPage(1);
  };

  return (
    <div className="space-y-5">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">Tickets</h1>
          <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
            {data ? `${count} ticket${count === 1 ? "" : "s"}` : "Support requests from customers"}
            {isFetching && !isLoading ? " · updating…" : ""}
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9385]" />
          <input
            type="search" value={search} onChange={(e) => setSearch(e.target.value)}
            placeholder="Search subject, name or email" aria-label="Search tickets"
            className={`${controlClasses} !pl-9`}
          />
        </div>
      </div>

      <div role="tablist" aria-label="Ticket folders" className="flex flex-wrap gap-1.5">
        {FOLDERS.map(({ key, label, icon: Icon }) => {
          const selected = folder === key;
          const n = stats?.[key];
          return (
            <button
              key={key} role="tab" aria-selected={selected} type="button" onClick={() => pickFolder(key)}
              className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                selected
                  ? "border-[#101B2C] bg-[#101B2C] text-white dark:border-[#BF9A63] dark:bg-[#BF9A63] dark:text-slate-950"
                  : "border-[#E7E2D8] bg-white text-[#101B2C] hover:border-[#BF9A63]/50 dark:border-[#25344D] dark:bg-[#162235] dark:text-white"
              }`}
            >
              <Icon aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
              {label}
              {n != null && n > 0 && (
                <span
                  className={`rounded-full px-1.5 text-xs font-semibold tabular-nums ${
                    selected ? "bg-white/20" : key === "overdue" ? "bg-red-100 text-red-700 dark:bg-red-950/50 dark:text-red-300" : "bg-[#EDE7DC] text-[#7C7669] dark:bg-[#25344D] dark:text-[#9FA8B8]"
                  }`}
                >
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap gap-3">
        <select aria-label="Filter by status" value={status} onChange={filter(setStatus)} className={selectClasses}>
          <option value="active">Open &amp; in progress</option>
          <option value="done">Resolved &amp; closed</option>
          <option value="all">All statuses</option>
        </select>
        <select aria-label="Filter by priority" value={priority} onChange={filter(setPriority)} className={selectClasses}>
          <option value="">Any priority</option>
          {PRIORITY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select aria-label="Filter by type" value={category} onChange={filter(setCategory)} className={selectClasses}>
          <option value="">Any type</option>
          {CATEGORY_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        <select aria-label="Filter by assignee" value={assignee} onChange={filter(setAssignee)} className={selectClasses}>
          <option value="">Anyone</option>
          <option value="none">Unassigned</option>
          {staff.map((s) => <option key={s.id} value={s.id}>{s.full_name}</option>)}
        </select>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-16"><Spinner label="Loading tickets" /></div>
      ) : isError ? (
        <div className={`${cardClasses} p-6 text-sm text-red-600 dark:text-red-400`}>
          Couldn't load tickets. Refresh the page to try again.
        </div>
      ) : tickets.length === 0 ? (
        <div className={`${cardClasses} border-dashed px-6 py-12 text-center`}>
          <p className="font-semibold text-[#101B2C] dark:text-white">
            {q || priority || category || assignee ? "No tickets match your filters" : EMPTY_COPY[folder][0]}
          </p>
          <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
            {q || priority || category || assignee ? "Try clearing a filter or searching for something else." : EMPTY_COPY[folder][1]}
          </p>
        </div>
      ) : (
        <div className={`${cardClasses} overflow-hidden`}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[820px]">
              <thead className="border-b border-[#E7E2D8] dark:border-[#25344D]">
                <tr className="text-left text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]">
                  <th className="px-4 py-3">Ticket</th>
                  <th className="px-4 py-3">Priority</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3">Assigned to</th>
                  <th className="px-4 py-3">Updated</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
                {tickets.map((t) => (
                  <tr
                    key={t.id}
                    onClick={() => navigate(`${base}/tickets/${t.id}`)}
                    className="cursor-pointer transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#0B1320]"
                  >
                    <td className="max-w-[26rem] px-4 py-3">
                      <div className="flex items-start gap-3">
                        <span
                          aria-label={t.is_unread ? "Unread" : undefined}
                          className={`mt-2 h-2 w-2 shrink-0 rounded-full ${t.is_unread ? "bg-[#BF9A63]" : "bg-transparent"}`}
                        />
                        <div className="min-w-0">
                          <Link
                            to={`${base}/tickets/${t.id}`} onClick={(e) => e.stopPropagation()}
                            className={`block truncate text-sm text-[#101B2C] hover:underline dark:text-white ${t.is_unread ? "font-semibold" : "font-medium"}`}
                          >
                            {t.subject}
                          </Link>
                          <p className="truncate text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                            {t.customer_name}
                            {t.customer_name !== t.customer_email && ` · ${t.customer_email}`} · {labelOf(CATEGORY_OPTIONS, t.category)}
                            {t.message_count > 1 && ` · ${t.message_count} messages`}
                          </p>
                        </div>
                        {t.is_overdue && <Badge className="shrink-0 bg-red-600 !px-2 !py-0.5 text-white">Overdue</Badge>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={PRIORITY_STYLES[t.priority]}>{labelOf(PRIORITY_OPTIONS, t.priority)}</Badge>
                    </td>
                    <td className="px-4 py-3">
                      <Badge className={STATUS_STYLES[t.status]}>{labelOf(TICKET_STATUS_OPTIONS, t.status)}</Badge>
                    </td>
                    <td className="px-4 py-3 text-sm">
                      {t.assigned_to ? (
                        <span className="flex items-center gap-2 text-[#101B2C] dark:text-white">
                          <Avatar name={t.assigned_to_name} size={24} />
                          <span className="truncate">{t.assigned_to_name}</span>
                        </span>
                      ) : (
                        <span className="text-[#9A9385] dark:text-[#6F7C93]">Unassigned</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
                      {timeAgo(t.updated_at)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination page={page} pageSize={PAGE_SIZE} count={count} onPage={setPage} />
        </div>
      )}
    </div>
  );
}