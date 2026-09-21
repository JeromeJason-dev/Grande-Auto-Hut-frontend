import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import * as authApi from "../../api/auth";
import { unwrapList, extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";

const EMPTY_ADDRESS = { label: "", recipient_name: "", phone_number: "", county: "", town: "", street_address: "", building_or_estate: "" };

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
    <form onSubmit={handleSubmit} className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
      <h2>Profile</h2>
      <ErrorAlert message={error} />
      {saved && <div className="alert alert-success">Profile updated.</div>}
      <div className="row" style={{ gap: "0.75rem" }}>
        <div className="field" style={{ flex: 1 }}>
          <label>First name</label>
          <input value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
        </div>
        <div className="field" style={{ flex: 1 }}>
          <label>Last name</label>
          <input value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
        </div>
      </div>
      <div className="field">
        <label>Phone number</label>
        <input value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} />
      </div>
      <button type="submit" className="btn btn-secondary" disabled={saving}>{saving ? "Saving…" : "Save profile"}</button>
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
    <form onSubmit={handleSubmit} className="card" style={{ padding: "1.25rem", marginBottom: "1.5rem" }}>
      <h2>Change password</h2>
      <ErrorAlert message={error} />
      {saved && <div className="alert alert-success">Password changed.</div>}
      <div className="field">
        <label>Current password</label>
        <input type="password" required value={form.current_password} onChange={(e) => setForm({ ...form, current_password: e.target.value })} />
      </div>
      <div className="field">
        <label>New password</label>
        <input type="password" required value={form.new_password} onChange={(e) => setForm({ ...form, new_password: e.target.value })} />
      </div>
      <button type="submit" className="btn btn-secondary" disabled={saving}>{saving ? "Saving…" : "Change password"}</button>
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
    <div className="card" style={{ padding: "1.25rem" }}>
      <div className="spread">
        <h2>Saved addresses</h2>
        <button className="btn btn-ghost btn-sm" onClick={() => setShowForm((s) => !s)}>{showForm ? "Cancel" : "Add address"}</button>
      </div>
      <ErrorAlert message={error} />

      {showForm && (
        <form onSubmit={handleAdd} className="card" style={{ padding: "1rem", marginBottom: "1rem", background: "var(--paper)" }}>
          <div className="field"><label>Label (e.g. Home, Office)</label><input value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} /></div>
          <div className="row" style={{ gap: "0.75rem" }}>
            <div className="field" style={{ flex: 1 }}><label>Recipient name</label><input required value={form.recipient_name} onChange={(e) => setForm({ ...form, recipient_name: e.target.value })} /></div>
            <div className="field" style={{ flex: 1 }}><label>Phone</label><input required value={form.phone_number} onChange={(e) => setForm({ ...form, phone_number: e.target.value })} /></div>
          </div>
          <div className="row" style={{ gap: "0.75rem" }}>
            <div className="field" style={{ flex: 1 }}><label>County</label><input required value={form.county} onChange={(e) => setForm({ ...form, county: e.target.value })} /></div>
            <div className="field" style={{ flex: 1 }}><label>Town</label><input required value={form.town} onChange={(e) => setForm({ ...form, town: e.target.value })} /></div>
          </div>
          <div className="field"><label>Street address</label><input required value={form.street_address} onChange={(e) => setForm({ ...form, street_address: e.target.value })} /></div>
          <div className="field"><label>Building / estate</label><input value={form.building_or_estate} onChange={(e) => setForm({ ...form, building_or_estate: e.target.value })} /></div>
          <button type="submit" className="btn btn-primary btn-sm">Save address</button>
        </form>
      )}

      {!isLoading && addresses.length === 0 && !showForm && <p style={{ color: "var(--ink-soft)" }}>No saved addresses yet.</p>}

      <div className="stack" style={{ gap: "0.5rem" }}>
        {addresses.map((a) => (
          <div key={a.id} className="spread" style={{ padding: "0.6rem 0", borderBottom: "1px solid var(--line)" }}>
            <span><strong>{a.label || "Address"}</strong> — {a.recipient_name}, {a.street_address}, {a.town}, {a.county}</span>
            <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(a.id)}>Delete</button>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AccountPage() {
  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem", maxWidth: 640 }}>
      <h1>Account</h1>
      <ProfileForm />
      <PasswordForm />
      <AddressBook />
    </div>
  );
}
