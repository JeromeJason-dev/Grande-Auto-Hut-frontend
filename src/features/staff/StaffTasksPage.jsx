import { useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, Search } from "lucide-react";
import * as staffApi from "../../api/staff";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";
import { useAuth } from "../auth/AuthContext";
import { useNotificationToastContext } from "../notifications/NotificationToastContext";
import { Badge, Pagination } from "../admin/AdminUi";
import {
  PRIORITY_OPTIONS, PRIORITY_STYLES, TASK_STATUS_OPTIONS, TASK_STATUS_STYLES, TICKET_STATUS_OPTIONS,
  cardClasses, controlClasses, formatDate, labelOf, timeAgo,
} from "../admin/adminConstants";

const PAGE_SIZE = 10;
const FILTERS = [
  { key: "open", label: "Open" },
  { key: "todo", label: "To do" },
  { key: "in_progress", label: "In progress" },
  { key: "done", label: "Done" },
  { key: "all", label: "All" },
];

function StatCard({ label, value, tone = "" }) {
  return (
    <div className={`${cardClasses} px-5 py-4`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone || "text-[#101B2C] dark:text-white"}`}>{value}</p>
    </div>
  );
}

function TaskRow({ task }) {
  const queryClient = useQueryClient();
  const toast = useNotificationToastContext();

  // Staff can only change the status of their tasks; the server enforces this too.
  const setStatus = useMutation({
    mutationFn: (status) => staffApi.updateTask(task.id, { status }),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["staff-workload"] });
      queryClient.invalidateQueries({ queryKey: ["ticket"] });
      queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
      queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      // The server moves the linked ticket along with its tasks; let the person know.
      if (data?.ticket && data.ticket_status && data.ticket_status !== task.ticket_status) {
        toast?.showToast({
          type: "success",
          title: `Ticket marked ${labelOf(TICKET_STATUS_OPTIONS, data.ticket_status).toLowerCase()}`,
          message: data.ticket_subject,
        });
      }
    },
    onError: (err) =>
      toast?.showToast({ type: "error", title: "Couldn't update task", message: extractErrorMessage(err) }),
  });

  const done = task.status === "done";
  const busy = setStatus.isPending;

  return (
    <li className="flex items-start gap-3 px-4 py-4">
      <button
        type="button" disabled={busy}
        onClick={() => setStatus.mutate(done ? "todo" : "done")}
        aria-label={done ? "Mark as to do" : "Mark as done"}
        title={done ? "Mark as to do" : "Mark as done"}
        className={`mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-colors disabled:cursor-not-allowed ${
          done ? "border-emerald-500 bg-emerald-500 text-white" : "border-[#BFB8A8] hover:border-[#BF9A63] dark:border-[#4A5A75]"
        }`}
      >
        {done && <Check className="h-3 w-3" strokeWidth={3} />}
      </button>

      <div className="min-w-0 flex-1">
        <p className={`text-sm font-medium ${done ? "text-[#7C7669] line-through dark:text-[#9FA8B8]" : "text-[#101B2C] dark:text-white"}`}>
          {task.title}
        </p>
        {task.description && (
          <p className="mt-0.5 whitespace-pre-line text-sm text-[#7C7669] dark:text-[#9FA8B8]">{task.description}</p>
        )}
        <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-1.5 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
          <Badge className={`!py-0.5 ${PRIORITY_STYLES[task.priority]}`}>{labelOf(PRIORITY_OPTIONS, task.priority)}</Badge>
          {task.due_date && (
            <span className={task.is_overdue ? "font-semibold text-red-600 dark:text-red-400" : ""}>
              {task.is_overdue ? "Overdue · " : "Due "}
              {formatDate(task.due_date)}
            </span>
          )}
          {task.ticket && (
            <Link to={`/staff/tickets/${task.ticket}`} className="text-[#A9834E] hover:underline dark:text-[#D4AF77]">
              Support ticket: {task.ticket_subject}
            </Link>
          )}
          {task.created_by_name && <span>Assigned by {task.created_by_name}</span>}
          {done && task.completed_at && <span>Completed {timeAgo(task.completed_at)}</span>}
        </div>
      </div>

      <select
        aria-label={`Status of ${task.title}`} value={task.status} disabled={busy}
        onChange={(e) => setStatus.mutate(e.target.value)}
        className={`shrink-0 rounded-full border-0 px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/40 ${TASK_STATUS_STYLES[task.status]}`}
      >
        {TASK_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    </li>
  );
}

export default function StaffTasksPage() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("open");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // Workload counts for the stat cards (one row per team member; we pick our own).
  const { data: team = [] } = useQuery({ queryKey: ["staff-workload"], queryFn: staffApi.listStaff });
  const me = team.find((m) => m.id === user?.id);

  const params = {
    assignee: "me",
    status: filter === "all" ? undefined : filter,
    q: search.trim() || undefined,
    page,
    page_size: PAGE_SIZE,
  };
  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-tasks", params],
    queryFn: () => staffApi.listTasks(params),
    placeholderData: keepPreviousData,
  });
  const tasks = data?.results ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">My tasks</h1>
        <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
          Customer-support work your admin has assigned to you. Update the status as you go.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatCard label="Open tasks" value={me?.open_tasks ?? "–"} />
        <StatCard label="Overdue" value={me?.overdue_tasks ?? "–"} tone={me?.overdue_tasks ? "text-red-600 dark:text-red-400" : ""} />
        <StatCard label="Completed" value={me?.done_tasks ?? "–"} tone="text-emerald-600 dark:text-emerald-400" />
        <StatCard label="Open tickets assigned" value={me?.open_tickets ?? "–"} />
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div role="tablist" aria-label="Task filter" className="flex flex-wrap gap-1">
          {FILTERS.map(({ key, label }) => (
            <button
              key={key} role="tab" type="button" aria-selected={filter === key}
              onClick={() => { setFilter(key); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                filter === key
                  ? "bg-[#101B2C] text-white dark:bg-[#BF9A63] dark:text-slate-950"
                  : "text-[#7C7669] hover:bg-white dark:text-[#9FA8B8] dark:hover:bg-[#162235]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <div className="relative w-full sm:w-64">
          <Search aria-hidden="true" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9385]" />
          <input
            type="search" value={search} onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            placeholder="Search tasks" aria-label="Search tasks" className={`${controlClasses} pl-9`}
          />
        </div>
      </div>

      {isError && <ErrorAlert message={extractErrorMessage(error, "Couldn't load your tasks.")} />}

      <div className={`${cardClasses} overflow-hidden`}>
        {isLoading ? (
          <div className="py-12"><Spinner label="Loading tasks" /></div>
        ) : tasks.length === 0 ? (
          <div className="flex flex-col items-center gap-2 px-6 py-14 text-center">
            <ClipboardList className="h-8 w-8 text-[#BF9A63]" strokeWidth={1.5} aria-hidden="true" />
            <p className="text-sm font-medium text-[#101B2C] dark:text-white">
              {search || filter !== "open" ? "No tasks match this view." : "You're all caught up."}
            </p>
            <p className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">Tasks your admin assigns to you will appear here.</p>
          </div>
        ) : (
          <ul className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
            {tasks.map((t) => <TaskRow key={t.id} task={t} />)}
          </ul>
        )}
        <Pagination page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPage={setPage} />
      </div>
    </div>
  );
}