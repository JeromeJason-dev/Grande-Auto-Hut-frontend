import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import * as authApi from "../../api/auth";
import { unwrapList, extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";

const EMPTY_ADDRESS = { label: "", recipient_name: "", phone_number: "", county: "", town: "", street_address: "", building_or_estate: "" };

const fieldClasses =
  "w-full rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0B1320] px-3 py-2 text-sm text-[#1E2430] dark:text-slate-200 transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25";

const labelClasses = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]";

const cardClasses = "mb-5 rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-6";

const primaryButtonClasses =
  "mt-5 rounded-md bg-[#BF9A63] px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-[#A9834E] disabled:cursor-not-allowed disabled:bg-[#BF9A63]/50 disabled:text-slate-950/60";

const successBannerClasses =
  "mt-3 rounded-md bg-emerald-50 dark:bg-emerald-950/40 px-3 py-2 text-sm text-emerald-700 dark:text-emerald-400";

function ProfileForm() {
  const { user, refreshUser } = useAuth();
  const [form, setForm] = useState({ first_name: user?.first_name || "", last_name: user?.last_name || "", phone_number: user?.phone_number || "" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSaved(false); setSaving(true);
    try {
      await authApi.updateMe(form);
      await refreshUser();
      setSaved(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cardClasses}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]">Profile</h2>

      {error && (
        <div className="mt-3">
          <ErrorAlert message={error} />
        </div>
      )}
      {saved && <div className={successBannerClasses}>Profile updated.</div>}

      <div className="mt-4 grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClasses}>First name</label>
          <input
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className={fieldClasses}
          />
        </div>
        <div>
          <label className={labelClasses}>Last name</label>
          <input
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className={fieldClasses}
          />
        </div>
      </div>

      <div className="mt-4">
        <label className={labelClasses}>Phone number</label>
        <input
          value={form.phone_number}
          onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
          className={fieldClasses}
        />
      </div>

      <button type="submit" disabled={saving} className={primaryButtonClasses}>
        {saving ? "Saving…" : "Save profile"}
      </button>
    </form>
  );
}

function PasswordForm() {
  const [form, setForm] = useState({ current_password: "", new_password: "" });
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(""); setSaved(false); setSaving(true);
    try {
      await authApi.changePassword(form);
      setForm({ current_password: "", new_password: "" });
      setSaved(true);
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cardClasses}>
      <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]">Change password</h2>

      {error && (
        <div className="mt-3">
          <ErrorAlert message={error} />
        </div>
      )}
      {saved && <div className={successBannerClasses}>Password changed.</div>}

      <div className="mt-4">
        <label className={labelClasses}>Current password</label>
        <input
          type="password"
          required
          value={form.current_password}
          onChange={(e) => setForm({ ...form, current_password: e.target.value })}
          className={fieldClasses}
        />
      </div>

      <div className="mt-4">
        <label className={labelClasses}>New password</label>
        <input
          type="password"
          required
          value={form.new_password}
          onChange={(e) => setForm({ ...form, new_password: e.target.value })}
          className={fieldClasses}
        />
      </div>

      <button type="submit" disabled={saving} className={primaryButtonClasses}>
        {saving ? "Saving…" : "Change password"}
      </button>
    </form>
  );
}

function AddressBook() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["addresses"], queryFn: authApi.listAddresses });
  const addresses = unwrapList(data);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [error, setError] = useState("");

  const handleAdd = async (e) => {
    e.preventDefault();
    setError("");
    try {
      await authApi.createAddress(form);
      setForm(EMPTY_ADDRESS);
      setShowForm(false);
      queryClient.invalidateQueries({ queryKey: ["addresses"] });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleDelete = async (id) => {
    await authApi.deleteAddress(id);
    queryClient.invalidateQueries({ queryKey: ["addresses"] });
  };

  return (
    <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-6">
      <div className="flex items-center justify-between">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]">Saved addresses</h2>
        <button
          onClick={() => setShowForm((s) => !s)}
          className="rounded-md bg-[#BF9A63] px-3 py-1.5 text-sm font-medium text-slate-950 transition-colors hover:bg-[#A9834E]"
        >
          {showForm ? "Cancel" : "Add address"}
        </button>
      </div>

      {error && (
        <div className="mt-3">
          <ErrorAlert message={error} />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mt-4 rounded-lg border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#0B1320] p-4">
          <div>
            <label className={labelClasses}>Label (e.g. Home, Office)</label>
            <input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} className={fieldClasses} />
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>Recipient name</label>
              <input required value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} className={fieldClasses} />
            </div>
            <div>
              <label className={labelClasses}>Phone</label>
              <input required value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} className={fieldClasses} />
            </div>
          </div>

          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <div>
              <label className={labelClasses}>County</label>
              <input required value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} className={fieldClasses} />
            </div>
            <div>
              <label className={labelClasses}>Town</label>
              <input required value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} className={fieldClasses} />
            </div>
          </div>

          <div className="mt-3">
            <label className={labelClasses}>Street address</label>
            <input required value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} className={fieldClasses} />
          </div>

          <div className="mt-3">
            <label className={labelClasses}>Building / estate</label>
            <input value={form.building_or_estate} onChange={(e) => setForm({ ...form, building_or_estate: e.target.value })} className={fieldClasses} />
          </div>

          <button
            type="submit"
            className="mt-4 rounded-md bg-[#BF9A63] px-4 py-2 text-sm font-medium text-slate-950 transition-colors hover:bg-[#A9834E]"
          >
            Save address
          </button>
        </form>
      )}

      {!isLoading && addresses.length === 0 && !showForm && (
        <p className="mt-4 text-sm text-[#7C7669] dark:text-[#9FA8B8]">No saved addresses yet.</p>
      )}

      <div className="mt-2 flex flex-col">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 border-b border-[#E7E2D8] dark:border-[#25344D] py-3 last:border-b-0"
          >
            <span className="text-sm text-[#1E2430] dark:text-slate-200">
              <strong className="text-[#101B2C] dark:text-white">{a.label || "Address"}</strong> — {a.recipient_name},{" "}
              {a.street_address}, {a.town}, {a.county}
            </span>
            <button
              onClick={() => handleDelete(a.id)}
              className="flex-shrink-0 text-sm font-medium text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:text-red-600 dark:hover:text-red-400"
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminAccountPage() {
  return (
    <div className="min-h-full bg-[#FAF7F2] dark:bg-[#0B1320] transition-colors duration-200">
      <div className="mx-auto max-w-2xl px-6 py-12">
        <h1 className="mb-6 text-2xl font-semibold text-[#101B2C] dark:text-white">Account</h1>

        <ProfileForm />
        <PasswordForm />
        <AddressBook />
      </div>
    </div>
  );
}