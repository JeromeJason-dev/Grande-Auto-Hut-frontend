import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Check, Copy, Eye, EyeOff, RefreshCw } from "lucide-react";
import * as staffApi from "../../api/staff";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";
import { useNotificationToastContext } from "../notifications/NotificationToastContext";
import { Modal } from "./AdminUi";
import {
  controlClasses, dangerButton, generatePassword, ghostButton, labelClasses, personName, primaryButton,
} from "./adminConstants";

const ROLE_OPTIONS = [
  { value: "staff", label: "Staff", hint: "Works tickets and their own tasks." },
  { value: "admin", label: "Admin", hint: "Also manages the team, assigns tasks and deletes tickets." },
];

/** DRF sends { field: ["message"] } on validation errors; keep them per field. */
function splitErrors(err) {
  const data = err?.response?.data;
  if (data && typeof data === "object" && !data.detail) {
    const fields = {};
    let general = "";
    for (const [key, value] of Object.entries(data)) {
      const text = Array.isArray(value) ? value[0] : String(value);
      if (key === "non_field_errors") general = text;
      else fields[key] = text;
    }
    return { fields, general };
  }
  return { fields: {}, general: extractErrorMessage(err) };
}

function Field({ id, label, error, hint, children }) {
  return (
    <div>
      <label htmlFor={id} className={labelClasses}>{label}</label>
      {children}
      {error ? (
        <p role="alert" className="mt-1 text-xs text-red-600 dark:text-red-400">{error}</p>
      ) : hint ? (
        <p className="mt-1 text-xs text-[#7C7669] dark:text-[#9FA8B8]">{hint}</p>
      ) : null}
    </div>
  );
}

function refreshTeamData(queryClient) {
  queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
  queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
  queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
  queryClient.invalidateQueries({ queryKey: ["ticket"] });
}

/**
 * Add a team member (no `member`) or edit one. Mount only while open.
 * onClose(saved | null) — `saved` is the created/updated member.
 */
export function StaffFormModal({ member = null, currentUserId, onClose }) {
  const editing = Boolean(member);
  const isSelf = editing && member.id === currentUserId;
  const queryClient = useQueryClient();
  const toast = useNotificationToastContext();

  const [form, setForm] = useState({
    first_name: member?.first_name ?? "",
    last_name: member?.last_name ?? "",
    email: member?.email ?? "",
    phone_number: member?.phone_number ?? "",
    role: member?.role ?? "staff",
    password: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [error, setError] = useState("");
  const [created, setCreated] = useState(null); // { email, password } once an account is made
  const [copied, setCopied] = useState(false);

  const set = (field) => (e) => {
    setForm((f) => ({ ...f, [field]: e.target.value }));
    setFieldErrors((errs) => ({ ...errs, [field]: undefined }));
  };

  const save = useMutation({
    mutationFn: () => {
      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        email: form.email.trim(),
        phone_number: form.phone_number.replace(/\s+/g, ""),
      };
      if (!isSelf) payload.role = form.role;
      if (form.password) payload.password = form.password;
      return editing ? staffApi.updateStaff(member.id, payload) : staffApi.createStaff(payload);
    },
    onSuccess: (saved) => {
      refreshTeamData(queryClient);
      if (editing) {
        toast?.showToast({
          type: "success",
          title: "Staff updated",
          message: form.password ? `${personName(saved)} · password reset` : personName(saved),
        });
        onClose(saved);
      } else {
        toast?.showToast({ type: "success", title: "Staff added", message: personName(saved) });
        setCreated({ saved, email: saved.email, password: form.password });
      }
    },
    onError: (err) => {
      const { fields, general } = splitErrors(err);
      setFieldErrors(fields);
      setError(general);
    },
  });

  const submit = (e) => {
    e.preventDefault();
    setError("");
    setFieldErrors({});
    save.mutate();
  };

  const copyDetails = async () => {
    const text = `Grande Auto Hut staff login\nEmail: ${created.email}\nPassword: ${created.password}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast?.showToast({ type: "warning", title: "Couldn't copy", message: "Select and copy the details manually." });
    }
  };

  /* ---- step 2 of "add": show the credentials once, since the password can't be looked up later ---- */
  if (created) {
    return (
      <Modal title="Staff account created" onClose={() => onClose(created.saved)}>
        <div className="space-y-4 p-6">
          <p className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">
            Share these sign-in details with {created.saved.first_name} securely. The password can't be shown again,
            but you can reset it any time from Edit.
          </p>
          <dl className="space-y-2 rounded-lg bg-[#FAF7F2] p-4 text-sm dark:bg-[#0B1320]">
            <div className="flex justify-between gap-4">
              <dt className="text-[#7C7669] dark:text-[#9FA8B8]">Email</dt>
              <dd className="font-medium text-[#101B2C] dark:text-white">{created.email}</dd>
            </div>
            <div className="flex justify-between gap-4">
              <dt className="text-[#7C7669] dark:text-[#9FA8B8]">Password</dt>
              <dd className="font-mono font-medium text-[#101B2C] dark:text-white">{created.password}</dd>
            </div>
          </dl>
          <div className="flex gap-3">
            <button type="button" onClick={copyDetails} className={`${ghostButton} flex-1`}>
              {copied ? <Check className="h-4 w-4 text-emerald-600" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy details"}
            </button>
            <button type="button" onClick={() => onClose(created.saved)} className={`${primaryButton} flex-1`}>Done</button>
          </div>
        </div>
      </Modal>
    );
  }

  const passwordRequired = !editing;
  const canSubmit =
    form.first_name.trim() && form.last_name.trim() && form.email.trim() && (!passwordRequired || form.password.length >= 8);

  return (
    <Modal title={editing ? "Edit staff" : "Add staff"} onClose={() => onClose(null)} busy={save.isPending}>
      <form onSubmit={submit} className="space-y-4 p-6" noValidate>
        {error && <ErrorAlert message={error} />}

        <div className="grid gap-4 sm:grid-cols-2">
          <Field id="staff-first" label="First name" error={fieldErrors.first_name}>
            <input id="staff-first" autoFocus required value={form.first_name} onChange={set("first_name")} className={controlClasses} />
          </Field>
          <Field id="staff-last" label="Last name" error={fieldErrors.last_name}>
            <input id="staff-last" required value={form.last_name} onChange={set("last_name")} className={controlClasses} />
          </Field>
        </div>

        <Field id="staff-email" label="Email" error={fieldErrors.email} hint="They sign in with this address.">
          <input id="staff-email" type="email" required value={form.email} onChange={set("email")} className={controlClasses} />
        </Field>

        <Field id="staff-phone" label="Phone (optional)" error={fieldErrors.phone_number}>
          <input
            id="staff-phone" type="tel" value={form.phone_number} onChange={set("phone_number")}
            placeholder="0712 345 678" className={controlClasses}
          />
        </Field>

        <Field
          id="staff-role" label="Role" error={fieldErrors.role}
          hint={isSelf ? "You can't change your own role." : ROLE_OPTIONS.find((r) => r.value === form.role)?.hint}
        >
          <select id="staff-role" value={form.role} onChange={set("role")} disabled={isSelf} className={controlClasses}>
            {ROLE_OPTIONS.map((r) => <option key={r.value} value={r.value}>{r.label}</option>)}
          </select>
        </Field>

        <Field
          id="staff-password" label={editing ? "Reset password (optional)" : "Password"} error={fieldErrors.password}
          hint={editing ? "Leave blank to keep their current password." : "At least 8 characters, not too common."}
        >
          <div className="flex gap-2">
            <div className="relative flex-1">
              <input
                id="staff-password" type={showPassword ? "text" : "password"} autoComplete="new-password"
                required={passwordRequired} value={form.password} onChange={set("password")}
                className={`${controlClasses} pr-10 ${showPassword ? "font-mono" : ""}`}
              />
              <button
                type="button" onClick={() => setShowPassword((v) => !v)}
                aria-label={showPassword ? "Hide password" : "Show password"}
                className="absolute right-2 top-1/2 -translate-y-1/2 rounded p-1 text-[#7C7669] hover:text-[#101B2C] dark:text-[#9FA8B8] dark:hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            <button
              type="button" className={ghostButton} title="Generate a strong password"
              onClick={() => {
                setForm((f) => ({ ...f, password: generatePassword() }));
                setFieldErrors((errs) => ({ ...errs, password: undefined }));
                setShowPassword(true);
              }}
            >
              <RefreshCw className="h-4 w-4" /> Generate
            </button>
          </div>
        </Field>

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => onClose(null)} disabled={save.isPending} className={`${ghostButton} flex-1`}>
            Cancel
          </button>
          <button type="submit" disabled={save.isPending || !canSubmit} className={`${primaryButton} flex-1`}>
            {save.isPending ? "Saving…" : editing ? "Save changes" : "Add staff"}
          </button>
        </div>
      </form>
    </Modal>
  );
}

/** Confirm removing a team member and choose who inherits their unfinished tasks. */
export function DeleteStaffModal({ member, team, currentUserId, onClose }) {
  const queryClient = useQueryClient();
  const toast = useNotificationToastContext();
  const candidates = team.filter((s) => s.id !== member.id);
  const [successor, setSuccessor] = useState(candidates.some((s) => s.id === currentUserId) ? currentUserId : candidates[0]?.id ?? "");
  const [error, setError] = useState("");

  const remove = useMutation({
    mutationFn: () => staffApi.deleteStaff(member.id, successor),
    onSuccess: (result) => {
      refreshTeamData(queryClient);
      const heir = team.find((s) => s.id === result.reassigned_to);
      const parts = [];
      if (result.tasks_reassigned) parts.push(`${result.tasks_reassigned} task${result.tasks_reassigned === 1 ? "" : "s"} moved to ${heir ? personName(heir) : "you"}`);
      if (result.tickets_unassigned) parts.push(`${result.tickets_unassigned} ticket${result.tickets_unassigned === 1 ? "" : "s"} unassigned`);
      toast?.showToast({
        type: "success",
        title: `${personName(member)} removed`,
        message: parts.join(" · ") || "They can no longer sign in.",
      });
      onClose(true);
    },
    onError: (err) => setError(extractErrorMessage(err)),
  });

  return (
    <Modal title="Delete staff member" onClose={() => onClose(false)} busy={remove.isPending} maxWidth="max-w-md">
      <div className="space-y-4 p-6">
        {error && <ErrorAlert message={error} />}

        <p className="text-sm text-[#1E2430] dark:text-slate-200">
          Delete <strong>{personName(member)}</strong>? They'll no longer be able to sign in and will disappear from the team.
        </p>

        <ul className="space-y-1.5 rounded-lg bg-[#FAF7F2] p-4 text-sm text-[#7C7669] dark:bg-[#0B1320] dark:text-[#9FA8B8]">
          <li>
            <strong className="text-[#101B2C] dark:text-white">{member.open_tickets}</strong> open ticket
            {member.open_tickets === 1 ? "" : "s"} will go back to <em>Unassigned</em>.
          </li>
          <li>
            <strong className="text-[#101B2C] dark:text-white">{member.open_tasks}</strong> unfinished task
            {member.open_tasks === 1 ? "" : "s"} will be handed over.
          </li>
          <li>Their past replies, tickets and completed tasks are kept for your records.</li>
        </ul>

        {member.open_tasks > 0 && (
          <div>
            <label htmlFor="successor" className={labelClasses}>Hand over unfinished tasks to</label>
            <select id="successor" value={successor} onChange={(e) => setSuccessor(e.target.value)} className={controlClasses}>
              {candidates.map((s) => (
                <option key={s.id} value={s.id}>{personName(s)}{s.id === currentUserId ? " (me)" : ""}</option>
              ))}
            </select>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button type="button" onClick={() => onClose(false)} disabled={remove.isPending} className={`${ghostButton} flex-1`}>
            Cancel
          </button>
          <button
            type="button" onClick={() => remove.mutate()}
            disabled={remove.isPending || (member.open_tasks > 0 && !successor)} className={`${dangerButton} flex-1`}
          >
            {remove.isPending ? "Deleting…" : "Delete staff"}
          </button>
        </div>
      </div>
    </Modal>
  );
}