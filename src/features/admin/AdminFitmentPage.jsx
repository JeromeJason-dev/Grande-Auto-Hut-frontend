import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as fitmentApi from "../../api/fitment";
import { unwrapList, extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";

const inputClasses =
  "h-11 w-full rounded-md border border-[#E7E2D8] bg-white px-3 text-sm text-[#101B2C] " +
  "focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20 dark:border-slate-700 dark:bg-slate-900 dark:text-white";

const editBtn =
  "rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-2.5 py-1 text-xs font-medium text-[#101B2C] dark:text-white transition-colors hover:border-[#BF9A63] hover:text-[#A9834E] dark:hover:text-[#BF9A63] disabled:opacity-50";
const deleteBtn =
  "rounded-md border border-rose-200 dark:border-rose-500/30 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-50";
const ghostBtn =
  "rounded-md px-4 py-2 text-sm font-medium text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#0B1320] hover:text-[#101B2C] dark:hover:text-white disabled:opacity-50";

/* ---------- modal shell (same look as the products page modals) ---------- */

function ModalShell({ onClose, busy = false, labelledBy, children }) {
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape" && !busy) onClose();
    };
    document.addEventListener("keydown", onKey);
    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = previousOverflow;
    };
  }, [onClose, busy]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-[2px]"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget && !busy) onClose();
      }}
    >
      <div role="dialog" aria-modal="true" aria-labelledby={labelledBy} className="contents">
        {children}
      </div>
    </div>
  );
}

/* ---------- edit modal ---------- */

function EditModal({ target, onClose, onSave, saving, error }) {
  const isYear = target.type === "year";
  const [value, setValue] = useState(String(isYear ? target.item.year : target.item.name));
  const label = isYear ? "Year" : "Name";
  const heading = `Edit ${target.type}`;
  const unchanged = value.trim() === String(isYear ? target.item.year : target.item.name);

  return (
    <ModalShell onClose={onClose} busy={saving} labelledBy="edit-fitment-title">
      <form
        onSubmit={(e) => {
          e.preventDefault();
          if (value.trim() && !unchanged) onSave(value.trim());
        }}
        className="w-full max-w-sm rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-6 shadow-2xl"
      >
        <h3 id="edit-fitment-title" className="text-base font-semibold capitalize text-[#101B2C] dark:text-white">
          {heading}
        </h3>
        <label className="mb-1.5 mt-4 block text-xs font-medium text-[#7C7669] dark:text-[#9FA8B8]">{label}</label>
        <input
          autoFocus
          type={isYear ? "number" : "text"}
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className={inputClasses}
        />

        {error && (
          <div className="mt-3">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={ghostBtn}>
            Cancel
          </button>
          <button
            type="submit"
            disabled={saving || !value.trim() || unchanged}
            className="rounded-md bg-[#BF9A63] px-4 py-2 text-sm font-medium text-white hover:bg-[#A9834E] disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save changes"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------- delete modal ---------- */

const DELETE_WARNINGS = {
  make: "All of its models, years and product fitment links will also be deleted.",
  model: "All of its years and product fitment links will also be deleted.",
  year: "Product fitment links for this year will also be deleted.",
};

function DeleteModal({ target, onClose, onConfirm, deleting, error }) {
  const name = target.type === "year" ? String(target.item.year) : target.item.name;

  return (
    <ModalShell onClose={onClose} busy={deleting} labelledBy="delete-fitment-title">
      <div className="w-full max-w-sm rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-6 shadow-2xl">
        <h3 id="delete-fitment-title" className="text-base font-semibold capitalize text-[#101B2C] dark:text-white">
          Delete {target.type}?
        </h3>
        <p className="mt-2 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
          <span className="font-semibold text-[#101B2C] dark:text-white">{name}</span> will be permanently removed.{" "}
          {DELETE_WARNINGS[target.type]} This can't be undone.
        </p>

        {error && (
          <div className="mt-3">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={deleting} className={ghostBtn}>
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={deleting}
            className="rounded-md bg-rose-600 px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {deleting ? "Deleting…" : "Delete"}
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ---------- page ---------- */

export default function AdminFitmentPage() {
  const queryClient = useQueryClient();

  const [selectedMakeSlug, setSelectedMakeSlug] = useState("");
  const [selectedModelSlug, setSelectedModelSlug] = useState("");

  // Form input states
  const [newMakeName, setNewMakeName] = useState("");
  const [newModelName, setNewModelName] = useState("");
  const [newYear, setNewYear] = useState("");

  // Edit / delete modal targets: { type: "make" | "model" | "year", item }
  const [editTarget, setEditTarget] = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  // Queries
  const makesQuery = useQuery({ queryKey: ["admin-makes"], queryFn: fitmentApi.listMakes });
  const modelsQuery = useQuery({
    queryKey: ["admin-models", selectedMakeSlug],
    queryFn: () => fitmentApi.listModels(selectedMakeSlug),
    enabled: !!selectedMakeSlug,
  });
  const yearsQuery = useQuery({
    queryKey: ["admin-years", selectedMakeSlug, selectedModelSlug],
    queryFn: () => fitmentApi.listYears(selectedMakeSlug, selectedModelSlug),
    enabled: !!selectedMakeSlug && !!selectedModelSlug,
  });

  const makes = unwrapList(makesQuery.data);
  const models = unwrapList(modelsQuery.data);
  const years = unwrapList(yearsQuery.data);

  // Refresh both the admin lists and the public fitment finder lists.
  const refreshMakes = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-makes"] });
    queryClient.invalidateQueries({ queryKey: ["makes"] });
  };
  const refreshModels = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-models"] });
    queryClient.invalidateQueries({ queryKey: ["models"] });
  };
  const refreshYears = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-years"] });
    queryClient.invalidateQueries({ queryKey: ["years"] });
  };

  // Mutations: create
  const addMakeMutation = useMutation({
    mutationFn: (name) => fitmentApi.createMake({ name }),
    onSuccess: () => {
      refreshMakes();
      setNewMakeName("");
    },
  });

  const addModelMutation = useMutation({
    mutationFn: ({ makeSlug, name }) => fitmentApi.createModel(makeSlug, { name }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-models", selectedMakeSlug] });
      queryClient.invalidateQueries({ queryKey: ["models"] });
      setNewModelName("");
    },
  });

  const addYearMutation = useMutation({
    mutationFn: ({ makeSlug, modelSlug, year }) => fitmentApi.createYear(makeSlug, modelSlug, { year }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-years", selectedMakeSlug, selectedModelSlug] });
      queryClient.invalidateQueries({ queryKey: ["years"] });
      setNewYear("");
    },
  });

  // Mutations: edit
  const updateMutation = useMutation({
    mutationFn: ({ type, id, value }) => {
      if (type === "make") return fitmentApi.updateMake(id, { name: value });
      if (type === "model") return fitmentApi.updateModel(id, { name: value });
      return fitmentApi.updateYear(id, { year: Number(value) });
    },
    onSuccess: (_data, { type }) => {
      if (type === "make") refreshMakes();
      if (type === "model") refreshModels();
      if (type === "year") refreshYears();
      setEditTarget(null);
    },
  });

  // Mutations: delete
  const deleteMutation = useMutation({
    mutationFn: ({ type, item }) => {
      if (type === "make") return fitmentApi.deleteMake(item.id);
      if (type === "model") return fitmentApi.deleteModel(item.id);
      return fitmentApi.deleteYear(item.id);
    },
    onSuccess: (_data, { type, item }) => {
      if (type === "make") {
        if (selectedMakeSlug === item.slug) {
          setSelectedMakeSlug("");
          setSelectedModelSlug("");
        }
        refreshMakes();
        refreshModels();
        refreshYears();
      } else if (type === "model") {
        if (selectedModelSlug === item.slug) setSelectedModelSlug("");
        refreshModels();
        refreshYears();
      } else {
        refreshYears();
      }
      setDeleteTarget(null);
    },
  });

  const openEdit = (type, item) => {
    updateMutation.reset();
    setEditTarget({ type, item });
  };
  const openDelete = (type, item) => {
    deleteMutation.reset();
    setDeleteTarget({ type, item });
  };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-xl font-semibold text-[#101B2C] dark:text-white">Vehicle Fitment Catalog</h1>
        <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
          Manage the master list of makes, models, and years used for part compatibility checks.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* 1. Makes Section */}
        <div className="rounded-xl border border-[#E7E2D8] bg-white p-5 dark:border-slate-800 dark:bg-[#162235]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]">1. Vehicle Makes</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newMakeName.trim()) addMakeMutation.mutate(newMakeName.trim());
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="text"
              placeholder="e.g. Toyota"
              value={newMakeName}
              onChange={(e) => setNewMakeName(e.target.value)}
              className={inputClasses}
            />
            <button
              type="submit"
              disabled={!newMakeName.trim() || addMakeMutation.isPending}
              className="shrink-0 rounded-md bg-[#BF9A63] px-4 text-sm font-medium text-white hover:bg-[#A9834E] disabled:opacity-50"
            >
              Add
            </button>
          </form>
          {addMakeMutation.isError && (
            <div className="mt-3">
              <ErrorAlert message={extractErrorMessage(addMakeMutation.error)} />
            </div>
          )}

          <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-[#E7E2D8] dark:divide-slate-700">
            {makes.map((m) => (
              <div
                key={m.id || m.slug}
                className={`flex items-center gap-2 pr-2 transition-colors ${
                  selectedMakeSlug === m.slug ? "bg-[#BF9A63]/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <button
                  onClick={() => {
                    setSelectedMakeSlug(m.slug);
                    setSelectedModelSlug("");
                  }}
                  className={`min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm ${
                    selectedMakeSlug === m.slug
                      ? "font-medium text-[#BF9A63]"
                      : "text-[#101B2C] dark:text-white"
                  }`}
                >
                  {m.name}
                </button>
                <button onClick={() => openEdit("make", m)} className={editBtn} aria-label={`Edit ${m.name}`}>
                  Edit
                </button>
                <button onClick={() => openDelete("make", m)} className={deleteBtn} aria-label={`Delete ${m.name}`}>
                  Delete
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* 2. Models Section */}
        <div className="rounded-xl border border-[#E7E2D8] bg-white p-5 dark:border-slate-800 dark:bg-[#162235]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]">2. Models</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newModelName.trim() && selectedMakeSlug) {
                addModelMutation.mutate({ makeSlug: selectedMakeSlug, name: newModelName.trim() });
              }
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="text"
              placeholder={selectedMakeSlug ? "e.g. Corolla" : "Select a make first"}
              disabled={!selectedMakeSlug}
              value={newModelName}
              onChange={(e) => setNewModelName(e.target.value)}
              className={inputClasses}
            />
            <button
              type="submit"
              disabled={!selectedMakeSlug || !newModelName.trim() || addModelMutation.isPending}
              className="shrink-0 rounded-md bg-[#BF9A63] px-4 text-sm font-medium text-white hover:bg-[#A9834E] disabled:opacity-50"
            >
              Add
            </button>
          </form>
          {addModelMutation.isError && (
            <div className="mt-3">
              <ErrorAlert message={extractErrorMessage(addModelMutation.error)} />
            </div>
          )}

          <div className="mt-4 max-h-60 overflow-y-auto divide-y divide-[#E7E2D8] dark:divide-slate-700">
            {!selectedMakeSlug ? (
              <p className="p-3 text-sm text-[#7C7669]">Choose a make on the left to view models.</p>
            ) : models.length === 0 ? (
              <p className="p-3 text-sm text-[#7C7669]">No models found for this make.</p>
            ) : (
              models.map((m) => (
                <div
                  key={m.id || m.slug}
                  className={`flex items-center gap-2 pr-2 transition-colors ${
                    selectedModelSlug === m.slug ? "bg-[#BF9A63]/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <button
                    onClick={() => setSelectedModelSlug(m.slug)}
                    className={`min-w-0 flex-1 truncate px-3 py-2.5 text-left text-sm ${
                      selectedModelSlug === m.slug
                        ? "font-medium text-[#BF9A63]"
                        : "text-[#101B2C] dark:text-white"
                    }`}
                  >
                    {m.name}
                  </button>
                  <button onClick={() => openEdit("model", m)} className={editBtn} aria-label={`Edit ${m.name}`}>
                    Edit
                  </button>
                  <button onClick={() => openDelete("model", m)} className={deleteBtn} aria-label={`Delete ${m.name}`}>
                    Delete
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {/* 3. Years Section */}
        <div className="rounded-xl border border-[#E7E2D8] bg-white p-5 dark:border-slate-800 dark:bg-[#162235]">
          <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]">3. Years</h2>

          <form
            onSubmit={(e) => {
              e.preventDefault();
              if (newYear && selectedModelSlug) {
                addYearMutation.mutate({ makeSlug: selectedMakeSlug, modelSlug: selectedModelSlug, year: Number(newYear) });
              }
            }}
            className="mt-4 flex gap-2"
          >
            <input
              type="number"
              placeholder={selectedModelSlug ? "e.g. 2018" : "Select a model first"}
              disabled={!selectedModelSlug}
              value={newYear}
              onChange={(e) => setNewYear(e.target.value)}
              className={inputClasses}
            />
            <button
              type="submit"
              disabled={!selectedModelSlug || !newYear || addYearMutation.isPending}
              className="shrink-0 rounded-md bg-[#BF9A63] px-4 text-sm font-medium text-white hover:bg-[#A9834E] disabled:opacity-50"
            >
              Add
            </button>
          </form>
          {addYearMutation.isError && (
            <div className="mt-3">
              <ErrorAlert message={extractErrorMessage(addYearMutation.error)} />
            </div>
          )}

          <div className="mt-4 flex flex-wrap gap-2 max-h-60 overflow-y-auto pt-1">
            {!selectedModelSlug ? (
              <p className="p-3 text-sm text-[#7C7669]">Choose a model to view or add years.</p>
            ) : years.length === 0 ? (
              <p className="p-3 text-sm text-[#7C7669]">No years added yet for this model.</p>
            ) : (
              years.map((y) => (
                <span
                  key={y.id || y.year}
                  className="inline-flex items-center gap-2 rounded-md bg-[#FAF7F2] py-1 pl-3 pr-1.5 text-sm font-medium text-[#101B2C] dark:bg-slate-800 dark:text-white"
                >
                  {y.year}
                  <button onClick={() => openEdit("year", y)} className={editBtn} aria-label={`Edit ${y.year}`}>
                    Edit
                  </button>
                  <button onClick={() => openDelete("year", y)} className={deleteBtn} aria-label={`Delete ${y.year}`}>
                    Delete
                  </button>
                </span>
              ))
            )}
          </div>
        </div>
      </div>

      {editTarget && (
        <EditModal
          key={`${editTarget.type}-${editTarget.item.id}`}
          target={editTarget}
          saving={updateMutation.isPending}
          error={updateMutation.isError ? extractErrorMessage(updateMutation.error) : ""}
          onClose={() => setEditTarget(null)}
          onSave={(value) => updateMutation.mutate({ type: editTarget.type, id: editTarget.item.id, value })}
        />
      )}

      {deleteTarget && (
        <DeleteModal
          target={deleteTarget}
          deleting={deleteMutation.isPending}
          error={deleteMutation.isError ? extractErrorMessage(deleteMutation.error) : ""}
          onClose={() => setDeleteTarget(null)}
          onConfirm={() => deleteMutation.mutate(deleteTarget)}
        />
      )}
    </div>
  );
}