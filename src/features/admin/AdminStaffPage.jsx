import { useEffect, useMemo, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { keepPreviousData, useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, ClipboardList, Pencil, Plus, Search, Trash2, UserPlus } from "lucide-react";
import * as staffApi from "../../api/staff";
import * as supportApi from "../../api/support";
import { extractErrorMessage } from "../../api/client";
import Spinner from "../../components/Spinner";
import { useAuth } from "../auth/AuthContext";
import { useNotificationToastContext } from "../notifications/NotificationToastContext";
import TaskModal from "./TaskModal";
import { DeleteStaffModal, StaffFormModal } from "./StaffModals";
import { Avatar, Badge, Pagination } from "./AdminUi";
import {
  PRIORITY_OPTIONS, PRIORITY_STYLES, STATUS_STYLES, TASK_STATUS_OPTIONS, TASK_STATUS_STYLES, TICKET_STATUS_OPTIONS,
  cardClasses, controlClasses, formatDate, labelOf, personName, primaryButton, ghostButton, timeAgo,
} from "./adminConstants";

const PAGE_SIZE = 10;

function StatCard({ label, value, tone = "" }) {
  return (
    <div className={`${cardClasses} px-5 py-4`}>
      <p className="text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]">{label}</p>
      <p className={`mt-1 text-2xl font-semibold tabular-nums ${tone || "text-[#101B2C] dark:text-white"}`}>{value}</p>
    </div>
  );
}

function RoleBadge({ role }) {
  return role === "admin" ? (
    <Badge className="bg-[#BF9A63]/15 !py-0.5 text-[#8C6C3F] dark:text-[#D4AF77]">Admin</Badge>
  ) : (
    <Badge className="bg-slate-100 !py-0.5 text-slate-600 dark:bg-white/10 dark:text-slate-300">Staff</Badge>
  );
}

/* ------------------------------------------------------------------ tasks */

function TaskRow({ task, canManage, canChangeStatus, onEdit }) {
  const queryClient = useQueryClient();
  const toast = useNotificationToastContext();

  const refresh = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
    queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
    queryClient.invalidateQueries({ queryKey: ["ticket"] });
  };
  const onError = (err) => toast?.showToast({ type: "error", title: "Couldn't update task", message: extractErrorMessage(err) });
  const confirmToastRef = useRef(null);
  const dismissToast = toast?.dismissToast;

  // Don't leave a pending "Delete task?" prompt behind if the row goes away.
  useEffect(
    () => () => {
      if (confirmToastRef.current) dismissToast?.(confirmToastRef.current);
    },
    [dismissToast]
  );

  const setStatus = useMutation({
    mutationFn: (status) => staffApi.updateTask(task.id, { status }),
    onSuccess: refresh,
    onError,
  });
  const remove = useMutation({
    mutationFn: () => staffApi.deleteTask(task.id),
    onSuccess: () => {
      refresh();
      toast?.showToast({ type: "success", title: "Task deleted", message: task.title });
    },
    onError,
  });

  // Deleting is irreversible, so ask first, in a toast rather than a browser dialog.
  const confirmDelete = () => {
    if (confirmToastRef.current) dismissToast?.(confirmToastRef.current);
    confirmToastRef.current = toast?.showToast({
      type: "warning",
      title: "Delete task?",
      message: `“${task.title}” will be permanently deleted. This can't be undone.`,
      persistent: true,
      actions: [
        { label: "Delete", variant: "danger", onClick: () => remove.mutate() },
        { label: "Keep task", variant: "secondary" },
      ],
    });
  };

  const done = task.status === "done";
  const busy = setStatus.isPending || remove.isPending;

  return (
    <li className="flex items-start gap-3 px-4 py-4">
      <button
        type="button" disabled={!canChangeStatus || busy}
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
          <p className="mt-0.5 line-clamp-2 whitespace-pre-line text-sm text-[#7C7669] dark:text-[#9FA8B8]">{task.description}</p>
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
            <Link to={`/admin/tickets/${task.ticket}`} className="text-[#A9834E] hover:underline dark:text-[#D4AF77]">
              Ticket: {task.ticket_subject}
            </Link>
          )}
          {task.created_by_name && task.created_by !== task.assigned_to && <span>Assigned by {task.created_by_name}</span>}
          {done && task.completed_at && <span>Completed {timeAgo(task.completed_at)}</span>}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-1.5">
        <select
          aria-label={`Status of ${task.title}`} value={task.status} disabled={!canChangeStatus || busy}
          onChange={(e) => setStatus.mutate(e.target.value)}
          className={`rounded-full border-0 px-2.5 py-1 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/40 ${TASK_STATUS_STYLES[task.status]}`}
        >
          {TASK_STATUS_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
        {canManage && (
          <>
            <button
              type="button" onClick={() => onEdit(task)} aria-label={`Edit ${task.title}`} title="Edit task"
              className="rounded-md p-1.5 text-[#7C7669] transition-colors hover:bg-[#FAF7F2] hover:text-[#101B2C] dark:text-[#9FA8B8] dark:hover:bg-[#1B2A42] dark:hover:text-white"
            >
              <Pencil className="h-4 w-4" strokeWidth={1.75} />
            </button>
            <button
              type="button" disabled={busy} aria-label={`Delete ${task.title}`} title="Delete task"
              onClick={confirmDelete}
              className="rounded-md p-1.5 text-[#7C7669] transition-colors hover:bg-red-50 hover:text-red-600 disabled:opacity-50 dark:text-[#9FA8B8] dark:hover:bg-red-950/30 dark:hover:text-red-400"
            >
              <Trash2 className="h-4 w-4" strokeWidth={1.75} />
            </button>
          </>
        )}
      </div>
    </li>
  );
}

function TasksTab({ member, isAdmin, currentUser }) {
  const [status, setStatus] = useState("open");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState(null);

  const params = { assignee: isAdmin ? member.id : "me", status: status === "all" ? undefined : status, page, page_size: PAGE_SIZE };
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-tasks", params],
    queryFn: () => staffApi.listTasks(params),
    placeholderData: keepPreviousData,
  });
  const tasks = data?.results ?? [];
  const isOwn = member.id === currentUser?.id;

  return (
    <div>
      <div className="flex items-center justify-between gap-3 border-b border-[#E7E2D8] px-4 py-3 dark:border-[#25344D]">
        <div role="tablist" aria-label="Task filter" className="flex gap-1">
          {[["open", "Open"], ["done", "Done"], ["all", "All"]].map(([key, label]) => (
            <button
              key={key} role="tab" type="button" aria-selected={status === key}
              onClick={() => { setStatus(key); setPage(1); }}
              className={`rounded-md px-3 py-1.5 text-sm font-medium transition-colors ${
                status === key
                  ? "bg-[#101B2C] text-white dark:bg-[#BF9A63] dark:text-slate-950"
                  : "text-[#7C7669] hover:bg-[#FAF7F2] dark:text-[#9FA8B8] dark:hover:bg-[#1B2A42]"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {data && <span className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">{data.count} task{data.count === 1 ? "" : "s"}</span>}
      </div>

      {isLoading ? (
        <div className="flex justify-center py-10"><Spinner label="Loading tasks" /></div>
      ) : isError ? (
        <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load tasks. Refresh the page to try again.</p>
      ) : tasks.length === 0 ? (
        <div className="px-6 py-12 text-center">
          <ClipboardList aria-hidden="true" className="mx-auto h-8 w-8 text-[#BF9A63]" strokeWidth={1.5} />
          <p className="mt-3 font-semibold text-[#101B2C] dark:text-white">
            {status === "done" ? "No completed tasks yet" : status === "open" ? "No open tasks" : "No tasks yet"}
          </p>
          <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
            {isAdmin && !isOwn ? `Assign ${member.first_name || "them"} a task to get started.` : "Tasks assigned to you will appear here."}
          </p>
        </div>
      ) : (
        <ul className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
          {tasks.map((t) => (
            <TaskRow
              key={t.id} task={t} canManage={isAdmin} onEdit={setEditing}
              canChangeStatus={isAdmin || t.assigned_to === currentUser?.id}
            />
          ))}
        </ul>
      )}

      <Pagination page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPage={setPage} />
      {editing && <TaskModal task={editing} onClose={() => setEditing(null)} />}
    </div>
  );
}

/* ------------------------------------------------------------------ assigned tickets */

function TicketsTab({ member }) {
  const [page, setPage] = useState(1);
  const params = { view: "inbox", status: "active", assignee: member.id, page, page_size: PAGE_SIZE };
  const { data, isLoading, isError } = useQuery({
    queryKey: ["admin-tickets", "assigned", params],
    queryFn: () => supportApi.listTickets(params),
    placeholderData: keepPreviousData,
  });
  const tickets = data?.results ?? [];

  if (isLoading) return <div className="flex justify-center py-10"><Spinner label="Loading tickets" /></div>;
  if (isError) return <p className="p-6 text-sm text-red-600 dark:text-red-400">Couldn't load tickets.</p>;
  if (tickets.length === 0) {
    return (
      <div className="px-6 py-12 text-center">
        <p className="font-semibold text-[#101B2C] dark:text-white">No open tickets</p>
        <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">Tickets assigned to {member.first_name || "this person"} will show here.</p>
      </div>
    );
  }
  return (
    <div>
      <ul className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
        {tickets.map((t) => (
          <li key={t.id}>
            <Link to={`/admin/tickets/${t.id}`} className="flex items-center gap-3 px-4 py-3.5 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#0B1320]">
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-[#101B2C] dark:text-white">{t.subject}</p>
                <p className="truncate text-xs text-[#7C7669] dark:text-[#9FA8B8]">{t.customer_name} · updated {timeAgo(t.updated_at)}</p>
              </div>
              {t.is_overdue && <Badge className="bg-red-600 !px-2 !py-0.5 text-white">Overdue</Badge>}
              <Badge className={PRIORITY_STYLES[t.priority]}>{labelOf(PRIORITY_OPTIONS, t.priority)}</Badge>
              <Badge className={STATUS_STYLES[t.status]}>{labelOf(TICKET_STATUS_OPTIONS, t.status)}</Badge>
            </Link>
          </li>
        ))}
      </ul>
      <Pagination page={page} pageSize={PAGE_SIZE} count={data?.count ?? 0} onPage={setPage} />
    </div>
  );
}

/* ------------------------------------------------------------------ member panel */

function MemberPanel({ member, team, isAdmin, currentUser, onRemoved }) {
  const [tab, setTab] = useState("tasks");
  const [showTask, setShowTask] = useState(false);
  const [showEdit, setShowEdit] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const isOwn = member.id === currentUser?.id;

  return (
    <section className="space-y-4">
      <div className={`${cardClasses} p-5`}>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar name={member.full_name} email={member.email} size={56} />
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-semibold text-[#101B2C] dark:text-white">{member.full_name}</h2>
              <RoleBadge role={member.role} />
              {isOwn && <span className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">(you)</span>}
            </div>
            <p className="mt-0.5 flex flex-wrap gap-x-3 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
              <a href={`mailto:${member.email}`} className="hover:underline">{member.email}</a>
              {member.phone_number && <a href={`tel:${member.phone_number}`} className="hover:underline">{member.phone_number}</a>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            {isAdmin && (
              <>
                <button type="button" onClick={() => setShowTask(true)} className={primaryButton}>
                  <Plus aria-hidden="true" className="h-4 w-4" />
                  {isOwn ? "New task" : "Assign task"}
                </button>
                <button type="button" onClick={() => setShowEdit(true)} className={ghostButton}>
                  <Pencil aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} /> Edit
                </button>
                <button
                  type="button" onClick={() => setShowDelete(true)} disabled={isOwn}
                  title={isOwn ? "You can't delete your own account" : "Delete this team member"}
                  className={`${ghostButton} hover:!border-red-300 hover:!text-red-600 dark:hover:!text-red-400`}
                >
                  <Trash2 aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} /> Delete
                </button>
              </>
            )}
          </div>
        </div>

        <dl className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            ["Open tasks", member.open_tasks, ""],
            ["Overdue", member.overdue_tasks, member.overdue_tasks > 0 ? "text-red-600 dark:text-red-400" : ""],
            ["Completed", member.done_tasks, ""],
            ["Open tickets", member.open_tickets, ""],
          ].map(([label, value, tone]) => (
            <div key={label} className="rounded-lg bg-[#FAF7F2] px-3 py-2.5 dark:bg-[#0B1320]">
              <dt className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">{label}</dt>
              <dd className={`text-lg font-semibold tabular-nums ${tone || "text-[#101B2C] dark:text-white"}`}>{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      <div className={`${cardClasses} overflow-hidden`}>
        <div role="tablist" className="flex border-b border-[#E7E2D8] dark:border-[#25344D]">
          {[["tasks", "Tasks"], ["tickets", `Assigned tickets (${member.open_tickets})`]].map(([key, label]) => (
            <button
              key={key} role="tab" type="button" aria-selected={tab === key} onClick={() => setTab(key)}
              className={`-mb-px border-b-2 px-5 py-3 text-sm font-medium transition-colors ${
                tab === key
                  ? "border-[#BF9A63] text-[#101B2C] dark:text-white"
                  : "border-transparent text-[#7C7669] hover:text-[#101B2C] dark:text-[#9FA8B8] dark:hover:text-white"
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        {tab === "tasks" ? (
          <TasksTab member={member} isAdmin={isAdmin} currentUser={currentUser} />
        ) : (
          <TicketsTab member={member} />
        )}
      </div>

      {isAdmin && showTask && <TaskModal defaultAssignee={member.id} onClose={() => setShowTask(false)} />}
      {showEdit && <StaffFormModal member={member} currentUserId={currentUser?.id} onClose={() => setShowEdit(false)} />}
      {showDelete && (
        <DeleteStaffModal
          member={member} team={team} currentUserId={currentUser?.id}
          onClose={(removed) => {
            setShowDelete(false);
            if (removed) onRemoved();
          }}
        />
      )}
    </section>
  );
}

/* ------------------------------------------------------------------ page */

export default function AdminStaffPage() {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const [selectedId, setSelectedId] = useState(null);
  const [search, setSearch] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const { data: staff = [], isLoading, isError } = useQuery({ queryKey: ["admin-staff"], queryFn: staffApi.listStaff });
  const { data: stats } = useQuery({
    queryKey: ["admin-tickets", "stats"], queryFn: supportApi.getTicketStats, enabled: isAdmin,
  });

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    if (!term) return staff;
    return staff.filter((s) => [s.full_name, s.email, s.phone_number].some((v) => v?.toLowerCase().includes(term)));
  }, [staff, search]);

  const selected = isAdmin ? staff.find((s) => s.id === selectedId) ?? staff[0] : staff.find((s) => s.id === user?.id);

  const totals = useMemo(
    () => staff.reduce((t, s) => ({ open: t.open + s.open_tasks, overdue: t.overdue + s.overdue_tasks }), { open: 0, overdue: 0 }),
    [staff],
  );

  if (isLoading) return <div className="flex justify-center py-16"><Spinner label="Loading team" /></div>;
  if (isError) {
    return <div className={`${cardClasses} p-6 text-sm text-red-600 dark:text-red-400`}>Couldn't load the team. Refresh the page to try again.</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">{isAdmin ? "Staff" : "My tasks"}</h1>
          <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
            {isAdmin ? "See what everyone is working on, assign tasks, and manage your team." : "Work your admin has assigned to you. Update the status as you go."}
          </p>
        </div>
        {isAdmin && (
          <button type="button" onClick={() => setShowAdd(true)} className={primaryButton}>
            <UserPlus aria-hidden="true" className="h-4 w-4" /> Add staff
          </button>
        )}
      </div>

      {isAdmin && (
        <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
          <StatCard label="Team members" value={staff.length} />
          <StatCard label="Open tasks" value={totals.open} />
          <StatCard label="Overdue tasks" value={totals.overdue} tone={totals.overdue > 0 ? "text-red-600 dark:text-red-400" : ""} />
          <StatCard label="Unassigned tickets" value={stats?.unassigned ?? "—"} />
        </div>
      )}

      <div className={isAdmin ? "grid items-start gap-6 lg:grid-cols-[20rem_minmax(0,1fr)]" : ""}>
        {isAdmin && (
          <aside className={`${cardClasses} overflow-hidden`}>
            <div className="relative border-b border-[#E7E2D8] p-3 dark:border-[#25344D]">
              <Search aria-hidden="true" className="pointer-events-none absolute left-6 top-1/2 h-4 w-4 -translate-y-1/2 text-[#9A9385]" />
              <input
                type="search" value={search} onChange={(e) => setSearch(e.target.value)}
                placeholder="Search team" aria-label="Search team members" className={`${controlClasses} !pl-9`}
              />
            </div>
            {filtered.length === 0 ? (
              <p className="p-5 text-sm text-[#7C7669] dark:text-[#9FA8B8]">No team members match your search.</p>
            ) : (
              <ul className="max-h-[32rem] divide-y divide-[#E7E2D8] overflow-y-auto dark:divide-[#25344D]">
                {filtered.map((s) => {
                  const active = selected?.id === s.id;
                  return (
                    <li key={s.id}>
                      <button
                        type="button" onClick={() => setSelectedId(s.id)} aria-current={active ? "true" : undefined}
                        className={`flex w-full items-center gap-3 border-l-2 px-4 py-3 text-left transition-colors ${
                          active
                            ? "border-[#BF9A63] bg-[#FAF7F2] dark:bg-[#0B1320]"
                            : "border-transparent hover:bg-[#FAF7F2] dark:hover:bg-[#0B1320]"
                        }`}
                      >
                        <Avatar name={s.full_name} email={s.email} size={38} />
                        <span className="min-w-0 flex-1">
                          <span className="flex items-center gap-2">
                            <span className="truncate text-sm font-medium text-[#101B2C] dark:text-white">{personName(s)}</span>
                            {s.role === "admin" && <RoleBadge role="admin" />}
                          </span>
                          <span className="block truncate text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                            {s.open_tasks} open task{s.open_tasks === 1 ? "" : "s"} · {s.open_tickets} ticket{s.open_tickets === 1 ? "" : "s"}
                          </span>
                        </span>
                        {s.overdue_tasks > 0 && (
                          <span title={`${s.overdue_tasks} overdue`} className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-semibold text-red-700 dark:bg-red-950/50 dark:text-red-300">
                            {s.overdue_tasks}
                          </span>
                        )}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
          </aside>
        )}

        {selected ? (
          <MemberPanel
            key={selected.id} member={selected} team={staff} isAdmin={isAdmin} currentUser={user}
            onRemoved={() => setSelectedId(null)}
          />
        ) : (
          <div className={`${cardClasses} p-8 text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]`}>
            No team members yet.
            {isAdmin && (
              <div className="mt-3">
                <button type="button" className={primaryButton} onClick={() => setShowAdd(true)}>Add staff</button>
              </div>
            )}
          </div>
        )}
      </div>

      {showAdd && (
        <StaffFormModal
          currentUserId={user?.id}
          onClose={(saved) => {
            setShowAdd(false);
            if (saved) setSelectedId(saved.id);
          }}
        />
      )}
    </div>
  );
}