import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import * as authApi from "../../api/auth";
import { unwrapList, extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";

const EMPTY_ADDRESS = { label: "", recipient_name: "", phone_number: "", county: "", town: "", street_address: "", building_or_estate: "" };

/* ---------- shared styles ---------- */

const cardClasses =
  "mb-5 rounded-3xl bg-[#F4F4F4] dark:bg-[#162235] p-6 sm:p-7";

const cardTitleClasses = "font-mono text-xl text-[#16161A] dark:text-white";

const labelClasses = "mb-2 block text-xs text-[#16161A] dark:text-slate-300";

const fieldClasses =
  "w-full rounded-full border border-[#16161A] dark:border-slate-500 bg-transparent px-5 py-3 text-sm text-[#16161A] dark:text-slate-100 placeholder:text-[#8A8A8F] transition-colors focus:outline-none focus:ring-2 focus:ring-[#16161A]/25 dark:focus:ring-white/30 disabled:cursor-not-allowed disabled:border-[#16161A]/30 dark:disabled:border-slate-600 disabled:text-[#16161A]/60 dark:disabled:text-slate-400";

const primaryButtonClasses =
  "rounded-full bg-[#16161A] dark:bg-white px-8 py-3.5 text-sm font-semibold text-white dark:text-[#16161A] transition-opacity hover:opacity-85 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16161A]/40 dark:focus-visible:ring-white/50 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50";

const outlineButtonClasses =
  "rounded-full border border-[#16161A] dark:border-slate-400 bg-white dark:bg-transparent px-6 py-2.5 text-sm font-semibold text-[#16161A] dark:text-white transition-colors hover:bg-[#16161A] hover:text-white dark:hover:bg-white dark:hover:text-[#16161A] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16161A]/40";

const softButtonClasses =
  "rounded-full bg-[#E9E8E8] dark:bg-[#25344D] px-6 py-2.5 text-sm font-semibold text-[#16161A] dark:text-slate-200 transition-colors hover:bg-[#DCDBDB] dark:hover:bg-[#2F4260] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#16161A]/40 disabled:cursor-not-allowed disabled:opacity-50";

const successBannerClasses =
  "mt-4 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 px-4 py-2.5 text-sm text-emerald-700 dark:text-emerald-400";

/* ---------- avatar ---------- */

function Avatar({ src, initials }) {
  return src ? (
    <img src={src} alt="" className="h-[72px] w-[72px] flex-shrink-0 rounded-full object-cover" />
  ) : (
    <div
      aria-hidden="true"
      className="flex h-[72px] w-[72px] flex-shrink-0 items-center justify-center rounded-full bg-[#16161A] dark:bg-white font-mono text-xl text-white dark:text-[#16161A]"
    >
      {initials}
    </div>
  );
}

/* ---------- "My details" card: profile + email + password ---------- */

function DetailsCard() {
  const { user, refreshUser } = useAuth();
  const fileRef = useRef(null);

  const [form, setForm] = useState({
    first_name: user?.first_name || "",
    last_name: user?.last_name || "",
    phone_number: user?.phone_number || "",
  });
  const [photo, setPhoto] = useState(null); // local preview only
  const [error, setError] = useState("");
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);

  const [changingPassword, setChangingPassword] = useState(false);
  const [pw, setPw] = useState({ current_password: "", new_password: "" });
  const [pwError, setPwError] = useState("");
  const [pwSaved, setPwSaved] = useState(false);
  const [pwSaving, setPwSaving] = useState(false);

  const fullName = `${form.first_name} ${form.last_name}`.trim() || "Your name";
  const initials =
    `${form.first_name?.[0] || ""}${form.last_name?.[0] || ""}`.toUpperCase() || "?";

  const handlePhoto = (e) => {
    const file = e.target.files?.[0];
    if (file) setPhoto(URL.createObjectURL(file));
  };

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

  const handlePasswordChange = async () => {
    setPwError(""); setPwSaved(false); setPwSaving(true);
    try {
      await authApi.changePassword(pw);
      setPw({ current_password: "", new_password: "" });
      setPwSaved(true);
      setChangingPassword(false);
    } catch (err) {
      setPwError(extractErrorMessage(err));
    } finally {
      setPwSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={cardClasses}>
      <h2 className={cardTitleClasses}>My details</h2>

      {/* Avatar row */}
      <div className="mt-6 flex items-center gap-4">
        <Avatar src={photo} initials={initials} />
        <div className="min-w-0">
          <p className="truncate font-mono text-base text-[#16161A] dark:text-white">{fullName}</p>
          <div className="mt-2.5 flex flex-wrap gap-2.5">
            <input ref={fileRef} type="file" accept="image/*" onChange={handlePhoto} className="hidden" />
            <button type="button" onClick={() => fileRef.current?.click()} className={outlineButtonClasses}>
              Upload new picture
            </button>
            <button type="button" onClick={() => setPhoto(null)} disabled={!photo} className={softButtonClasses}>
              Delete
            </button>
          </div>
        </div>
      </div>

      {error && (
        <div className="mt-5">
          <ErrorAlert message={error} />
        </div>
      )}
      {saved && <div className={successBannerClasses}>Details updated.</div>}
      {pwSaved && <div className={successBannerClasses}>Password changed.</div>}

      {/* Fields */}
      <div className="mt-7 grid gap-x-6 gap-y-5 sm:grid-cols-2">
        <div>
          <label htmlFor="first_name" className={labelClasses}>First name</label>
          <input
            id="first_name"
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="last_name" className={labelClasses}>Last name</label>
          <input
            id="last_name"
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
            className={fieldClasses}
          />
        </div>

        <div>
          <label htmlFor="phone_number" className={labelClasses}>Phone number</label>
          <input
            id="phone_number"
            value={form.phone_number}
            onChange={(e) => setForm({ ...form, phone_number: e.target.value })}
            className={fieldClasses}
          />
        </div>
        <div>
          <label htmlFor="email" className={labelClasses}>Email address</label>
          <input id="email" value={user?.email || ""} disabled readOnly className={fieldClasses} />
        </div>

        <div className="sm:col-span-2 sm:max-w-[calc(50%-0.75rem)]">
          <label htmlFor="password" className={labelClasses}>Password</label>
          <div className="relative">
            <input
              id="password"
              type="password"
              value="••••••••"
              disabled
              readOnly
              className={`${fieldClasses} pr-24`}
            />
            <button
              type="button"
              onClick={() => { setChangingPassword((c) => !c); setPwError(""); }}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-sm font-semibold text-[#16161A] dark:text-white underline underline-offset-2 hover:opacity-70"
            >
              {changingPassword ? "Cancel" : "Change"}
            </button>
          </div>
        </div>
      </div>

      {/* Change password (expands in place) */}
      {changingPassword && (
        <div className="mt-5 rounded-2xl border border-[#16161A]/15 dark:border-slate-600 p-4 sm:p-5">
          {pwError && (
            <div className="mb-4">
              <ErrorAlert message={pwError} />
            </div>
          )}
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div>
              <label htmlFor="current_password" className={labelClasses}>Current password</label>
              <input
                id="current_password"
                type="password"
                value={pw.current_password}
                onChange={(e) => setPw({ ...pw, current_password: e.target.value })}
                className={fieldClasses}
              />
            </div>
            <div>
              <label htmlFor="new_password" className={labelClasses}>New password</label>
              <input
                id="new_password"
                type="password"
                value={pw.new_password}
                onChange={(e) => setPw({ ...pw, new_password: e.target.value })}
                className={fieldClasses}
              />
            </div>
          </div>
          <button
            type="button"
            onClick={handlePasswordChange}
            disabled={pwSaving || !pw.current_password || !pw.new_password}
            className={`${outlineButtonClasses} mt-5 disabled:cursor-not-allowed disabled:opacity-50`}
          >
            {pwSaving ? "Saving…" : "Update password"}
          </button>
        </div>
      )}

      <button type="submit" disabled={saving} className={`${primaryButtonClasses} mt-7 w-full sm:w-[calc(50%-0.75rem)]`}>
        {saving ? "Saving…" : "Save my details"}
      </button>
    </form>
  );
}

/* ---------- Saved addresses ---------- */

function AddressBook() {
  const queryClient = useQueryClient();
  const { data, isLoading } = useQuery({ queryKey: ["addresses"], queryFn: authApi.listAddresses });
  const addresses = unwrapList(data);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(EMPTY_ADDRESS);
  const [error, setError] = useState("");

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

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
    <div className="rounded-3xl bg-[#F4F4F4] dark:bg-[#162235] p-6 sm:p-7">
      <div className="flex items-center justify-between gap-3">
        <h2 className={cardTitleClasses}>Saved addresses</h2>
        <button type="button" onClick={() => setShowForm((s) => !s)} className={outlineButtonClasses}>
          {showForm ? "Cancel" : "Add address"}
        </button>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorAlert message={error} />
        </div>
      )}

      {showForm && (
        <form onSubmit={handleAdd} className="mt-6">
          <div className="grid gap-x-6 gap-y-5 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label htmlFor="addr_label" className={labelClasses}>Label (e.g. Home, Office)</label>
              <input id="addr_label" value={form.label} onChange={set("label")} className={fieldClasses} />
            </div>
            <div>
              <label htmlFor="addr_recipient" className={labelClasses}>Recipient name</label>
              <input id="addr_recipient" required value={form.recipient_name} onChange={set("recipient_name")} className={fieldClasses} />
            </div>
            <div>
              <label htmlFor="addr_phone" className={labelClasses}>Phone number</label>
              <input id="addr_phone" required value={form.phone_number} onChange={set("phone_number")} className={fieldClasses} />
            </div>
            <div>
              <label htmlFor="addr_county" className={labelClasses}>County</label>
              <input id="addr_county" required value={form.county} onChange={set("county")} className={fieldClasses} />
            </div>
            <div>
              <label htmlFor="addr_town" className={labelClasses}>Town</label>
              <input id="addr_town" required value={form.town} onChange={set("town")} className={fieldClasses} />
            </div>
            <div>
              <label htmlFor="addr_street" className={labelClasses}>Street address</label>
              <input id="addr_street" required value={form.street_address} onChange={set("street_address")} className={fieldClasses} />
            </div>
            <div>
              <label htmlFor="addr_building" className={labelClasses}>Building / estate</label>
              <input id="addr_building" value={form.building_or_estate} onChange={set("building_or_estate")} className={fieldClasses} />
            </div>
          </div>

          <button type="submit" className={`${primaryButtonClasses} mt-7 w-full sm:w-[calc(50%-0.75rem)]`}>
            Save address
          </button>
        </form>
      )}

      {!isLoading && addresses.length === 0 && !showForm && (
        <p className="mt-4 text-sm text-[#5F5F65] dark:text-slate-400">No saved addresses yet.</p>
      )}

      <div className="mt-3 flex flex-col">
        {addresses.map((a) => (
          <div
            key={a.id}
            className="flex items-center justify-between gap-3 border-b border-[#16161A]/10 dark:border-slate-700 py-4 last:border-b-0"
          >
            <span className="text-sm text-[#16161A] dark:text-slate-200">
              <strong className="font-mono font-semibold text-[#16161A] dark:text-white">{a.label || "Address"}</strong>
              {" "}— {a.recipient_name}, {a.street_address}, {a.town}, {a.county}
            </span>
            <button
              type="button"
              onClick={() => handleDelete(a.id)}
              className={`${softButtonClasses} flex-shrink-0 !px-4 !py-2 hover:!bg-red-100 hover:!text-red-700 dark:hover:!bg-red-950/60 dark:hover:!text-red-300`}
            >
              Delete
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

/* ---------- Page ---------- */

export default function AccountPage() {
  return (
    <div className="min-h-full bg-white dark:bg-[#0B1320] transition-colors duration-200">
      <div className="mx-auto max-w-2xl px-4 py-10 sm:px-6 sm:py-12">
        <DetailsCard />
        <AddressBook />
      </div>
    </div>
  );
}