import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import * as staffApi from "../../api/staff";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";
import { useAuth } from "../auth/AuthContext";
import { useNotificationToastContext } from "../notifications/NotificationToastContext";
import { Modal } from "./AdminUi";
import {
  PRIORITY_OPTIONS, controlClasses, labelClasses, primaryButton, ghostButton, personName, shortId,
} from "./adminConstants";


export default function TaskModal({ onClose, ticket = null, defaultAssignee = "", task = null }) {
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";
  const queryClient = useQueryClient();
  const toast = useNotificationToastContext();
  const editing = Boolean(task);

  const { data: staff = [] } = useQuery({
    queryKey: ["admin-staff"], queryFn: staffApi.listStaff, enabled: isAdmin,
  });

  const [form, setForm] = useState(() => ({
    title: task?.title ?? (ticket ? `Follow up: ${ticket.subject}` : ""),
    description: task?.description ?? "",
    assigned_to: task?.assigned_to ?? defaultAssignee ?? ticket?.assigned_to ?? user?.id ?? "",
    priority: task?.priority ?? "medium",
    due_date: task?.due_date ?? "",
  }));
  const [error, setError] = useState("");
  const set = (field) => (e) => setForm((f) => ({ ...f, [field]: e.target.value }));

  const assignee = form.assigned_to || user?.id;

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        title: form.title,
        description: form.description,
        priority: form.priority,
        due_date: form.due_date || null,
        assigned_to: assignee,
      };
      return editing ? staffApi.updateTask(task.id, payload) : staffApi.createTask({ ...payload, ticket: ticket?.id });
    },
    onSuccess: (saved) => {
      queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      if (ticket || task?.ticket) queryClient.invalidateQueries({ queryKey: ["ticket"] });
      toast?.showToast({
        type: "success",
        title: editing ? "Task updated" : "Task assigned",
        message:
          !editing && saved.assigned_to !== user?.id
            ? `Assigned to ${saved.assigned_to_name}.`
            : saved.title,
      });
      onClose(saved);
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    setError("");
    save.mutate();
  };

  if (!isAdmin) return null;

  const linked = ticket || (task?.ticket ? { id: task.ticket, subject: task.ticket_subject } : null);

  return (
    <Modal title={editing ? "Edit task" : "Assign task"} onClose={() => onClose(null)} busy={save.isPending}>
      <form onSubmit={handleSubmit} className="space-y-4 p-6">
        {error && <ErrorAlert message={error} />}

        {linked && (
          <p className="rounded-md bg-[#FAF7F2] px-3 py-2 text-sm text-[#7C7669] dark:bg-white/5 dark:text-[#9FA8B8]">
            Linked to ticket{" "}
            <span className="font-medium text-[#101B2C] dark:text-white">
              {linked.subject} <span className="font-mono text-xs opacity-70">{shortId(linked.id)}</span>
            </span>
          </p>
        )}

        <div>
          <label htmlFor="task-title" className={labelClasses}>Title</label>
          <input
            id="task-title" required autoFocus value={form.title} onChange={set("title")}
            maxLength={255} className={controlClasses}
          />
        </div>

        <div>
          <label htmlFor="task-description" className={labelClasses}>Details</label>
          <textarea
            id="task-description" rows={3} value={form.description} onChange={set("description")}
            placeholder="What needs to happen?" className={`${controlClasses} resize-none`}
          />
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label htmlFor="task-assignee" className={labelClasses}>Assign to</label>
            <select
              id="task-assignee" value={assignee} onChange={set("assigned_to")}
              className={controlClasses}
            >
              {staff.length === 0 && <option value={assignee}>{personName(user) || "Me"}</option>}
              {staff.map((s) => (
                <option key={s.id} value={s.id}>
                  {s.full_name}{s.id === user?.id ? " (me)" : ""}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor="task-priority" className={labelClasses}>Priority</label>
            <select id="task-priority" value={form.priority} onChange={set("priority")} className={controlClasses}>
              {PRIORITY_OPTIONS.map((p) => (
                <option key={p.value} value={p.value}>{p.label}</option>
              ))}
            </select>
          </div>
        </div>

        <div>
          <label htmlFor="task-due" className={labelClasses}>Due date <span className="normal-case opacity-60">(optional)</span></label>
          <input id="task-due" type="date" value={form.due_date || ""} onChange={set("due_date")} className={controlClasses} />
        </div>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => onClose(null)} disabled={save.isPending} className={`${ghostButton} flex-1`}>
            Cancel
          </button>
          <button type="submit" disabled={save.isPending || !form.title.trim()} className={`${primaryButton} flex-1`}>
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Assign task"}
          </button>
        </div>
      </form>
    </Modal>
  );
}