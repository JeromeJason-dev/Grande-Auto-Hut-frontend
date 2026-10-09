import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as catalogApi from "../../api/catalog";
import * as adminApi from "../../api/admin";
import { unwrapList, extractErrorMessage } from "../../api/client";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";

const EMPTY_FORM = {
  sku: "", name: "", slug: "", category: "", brand: "", family: "", description: "",
  condition: "aftermarket", price: "", stock_quantity: "", low_stock_threshold: "5", is_active: true,
};

const PAGE_SIZE = 10;

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const inputClasses =
  "w-full rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0B1320] px-3 py-2 text-sm text-[#1E2430] dark:text-white focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20";
const labelClasses = "mb-1.5 block text-xs font-medium text-[#7C7669] dark:text-[#9FA8B8]";

const primaryBtn =
  "rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] dark:disabled:bg-[#25344D] disabled:text-[#7C7669] dark:disabled:text-[#9FA8B8]";
const ghostBtn =
  "rounded-md px-5 py-2 text-sm font-medium text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#0B1320] hover:text-[#101B2C] dark:hover:text-white disabled:opacity-50";

/* ---------- status helpers ---------- */

function getStatus(p) {
  if (p.is_active === false) return "inactive";
  if (!p.is_in_stock) return "out";
  if (p.is_low_stock) return "low";
  return "in";
}

const STATUS_META = {
  in: {
    label: "In stock",
    badge: "bg-emerald-100 text-emerald-800 dark:bg-emerald-500/15 dark:text-emerald-300",
    dot: "bg-emerald-500",
  },
  low: {
    label: "Low stock",
    badge: "bg-amber-100 text-amber-800 dark:bg-amber-500/15 dark:text-amber-300",
    dot: "bg-amber-500",
  },
  out: {
    label: "Out of stock",
    badge: "bg-orange-100 text-orange-800 dark:bg-orange-500/15 dark:text-orange-300",
    dot: "bg-orange-500",
  },
  inactive: {
    label: "Inactive",
    badge: "bg-rose-100 text-rose-800 dark:bg-rose-500/15 dark:text-rose-300",
    dot: "bg-rose-500",
  },
};

function StatusPill({ status }) {
  const m = STATUS_META[status];
  return (
    <span className={`inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-xs font-medium ${m.badge}`}>
      <span className={`h-1.5 w-1.5 rounded-full ${m.dot}`} />
      {m.label}
    </span>
  );
}

const STATUS_FILTERS = [
  { value: "all", label: "All status" },
  { value: "in", label: "In stock" },
  { value: "low", label: "Low stock" },
  { value: "out", label: "Out of stock" },
  { value: "inactive", label: "Inactive" },
];

const CONDITION_LABELS = {
  genuine: "Genuine (OEM)",
  aftermarket: "Aftermarket",
  refurbished: "Refurbished",
};

/* ---------- small pieces ---------- */

function Field({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className={labelClasses}>{label}</label>
      {children}
    </div>
  );
}

function ProductThumb({ product }) {
  const src = product.image || product.thumbnail || product.primary_image;
  const [failed, setFailed] = useState(false);
  if (src && !failed) {
    return (
      <img
        src={src}
        alt=""
        onError={() => setFailed(true)}
        className="h-9 w-9 shrink-0 rounded-md border border-[#E7E2D8] dark:border-[#25344D] object-cover"
      />
    );
  }
  return (
    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#0B1320] text-xs font-semibold text-[#A9834E] dark:text-[#BF9A63]">
      {(product.name || "?").slice(0, 2).toUpperCase()}
    </span>
  );
}

function SearchIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx="11" cy="11" r="8" />
      <path d="m21 21-4.3-4.3" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <path d="M18 6 6 18M6 6l12 12" />
    </svg>
  );
}

function StatCard({ label, value, hint, tone }) {
  return (
    <div className="px-5 first:pl-0 sm:border-l sm:border-[#E7E2D8] sm:dark:border-[#25344D] sm:first:border-l-0">
      <p className="text-sm text-[#1E2430] dark:text-slate-200">{label}</p>
      <div className="mt-1 flex items-center gap-2.5">
        <span className="text-2xl font-semibold text-[#101B2C] dark:text-white">{value}</span>
        <span className={`h-[3px] w-3 rounded-full ${tone}`} />
      </div>
      <p className="mt-1 text-xs text-[#9A9487] dark:text-[#9FA8B8]">{hint}</p>
    </div>
  );
}

/* ---------- shared modal shell ---------- */

function ModalShell({ onClose, busy = false, labelledBy, children }) {
  // Close on Escape (unless a save is in flight) and lock background scroll.
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

/* ---------- inline quick-add (category / brand / family) ---------- */

function QuickAdd({ kind, categories = [], categoryId = "", onCreated }) {
  const isCategory = kind === "category";
  const isFamily = kind === "family";
  const [open, setOpen] = useState(false);
  const [name, setName] = useState("");
  const [parent, setParent] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const reset = () => {
    setOpen(false);
    setName("");
    setParent("");
    setError("");
  };

  const handleCreate = async () => {
    const trimmed = name.trim();
    if (!trimmed) {
      setError("Name is required.");
      return;
    }
    if (isFamily && !categoryId) {
      setError("Select a category first; a family belongs to one.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      let created;
      if (isFamily) {
        // slug omitted: the backend auto-generates a unique one
        created = await adminApi.createFamily({ name: trimmed, category: categoryId });
      } else {
        const payload = { name: trimmed, slug: slugify(trimmed), is_active: true };
        if (isCategory && parent) payload.parent = parent;
        created = isCategory
          ? await adminApi.createCategory(payload)
          : await adminApi.createBrand(payload);
      }
      await onCreated(created);
      reset();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-1.5 text-xs font-medium text-[#A9834E] dark:text-[#BF9A63] hover:underline"
      >
        + New {kind}
      </button>
    );
  }

  return (
    <div className="mt-2 rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#0B1320]/50 p-3">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        onKeyDown={(e) => {
          // Enter must create the category/brand/family, not submit the product form.
          if (e.key === "Enter") {
            e.preventDefault();
            handleCreate();
          }
        }}
        placeholder={`New ${kind} name`}
        className={inputClasses}
      />
      {isCategory && (
        <select value={parent} onChange={(e) => setParent(e.target.value)} className={`${inputClasses} mt-2`}>
          <option value="">No parent category</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>{c.name}</option>
          ))}
        </select>
      )}
      {error && <p className="mt-2 text-xs text-rose-600 dark:text-rose-400">{error}</p>}
      <div className="mt-2 flex justify-end gap-2">
        <button type="button" onClick={reset} disabled={saving} className={`${ghostBtn} !px-3 !py-1.5 !text-xs`}>
          Cancel
        </button>
        <button type="button" onClick={handleCreate} disabled={saving} className={`${primaryBtn} !px-3 !py-1.5 !text-xs`}>
          {saving ? "Adding…" : `Add ${kind}`}
        </button>
      </div>
    </div>
  );
}

/* ---------- add / edit product modal ---------- */

function buildInitialForm(editing) {
  if (!editing) return EMPTY_FORM;
  return {
    ...EMPTY_FORM,
    sku: editing.sku ?? "",
    name: editing.name ?? "",
    slug: editing.slug ?? "",
    // Prefer real IDs; fall back to the name (resolved to an ID later).
    category: editing.category_id ?? editing.category?.id ?? editing.category ?? "",
    brand: editing.brand_id ?? editing.brand?.id ?? editing.brand ?? "",
    family: editing.family_id ?? "",
    description: editing.description ?? "",
    condition: editing.condition ?? "aftermarket",
    price: editing.price ?? "",
    stock_quantity: editing.stock_quantity ?? "",
    low_stock_threshold: editing.low_stock_threshold ?? "5",
    is_active: editing.is_active !== false,
  };
}

function ProductModal({ editing, onClose, onSaved }) {
  const [form, setForm] = useState(() => buildInitialForm(editing));
  // Once the admin edits the slug by hand, stop auto-overwriting it from the name.
  const [slugTouched, setSlugTouched] = useState(Boolean(editing));
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: catalogApi.listCategories });
  const brandsQuery = useQuery({ queryKey: ["brands"], queryFn: catalogApi.listBrands });
  const familiesQuery = useQuery({ queryKey: ["families"], queryFn: () => catalogApi.listFamilies() });
  const queryClient = useQueryClient();
  const categories = unwrapList(categoriesQuery.data);
  const brands = unwrapList(brandsQuery.data);
  const [createdFamilies, setCreatedFamilies] = useState([]);
  const fetchedFamilies = unwrapList(familiesQuery.data);
  const families = useMemo(() => {
    const seen = new Set(fetchedFamilies.map((f) => String(f.id)));
    return [...fetchedFamilies, ...createdFamilies.filter((f) => !seen.has(String(f.id)))];
  }, [fetchedFamilies, createdFamilies]);

  const resolveId = (value, list) => {
    if (value === "" || value === null || value === undefined) return "";
    const byId = list.find((x) => String(x.id) === String(value));
    if (byId) return byId.id;
    const byName = list.find((x) => x.name === value);
    return byName ? byName.id : "";
  };
  const categoryId = resolveId(form.category, categories);
  const brandId = resolveId(form.brand, brands);

  // A family can hold only one product per condition. Detect clashes up front.
  const familyTakenBy = (fam) =>
    (fam.variants || []).find(
      (v) => v.condition === form.condition && (!editing || v.id !== editing.id)
    );
  const selectedFamily = families.find((f) => String(f.id) === String(form.family));
  const familyClash = selectedFamily ? familyTakenBy(selectedFamily) : null;

  // After creating a category/brand/family: refresh the list, then auto-select the new one.
  const handleCategoryCreated = async (created) => {
    await queryClient.invalidateQueries({ queryKey: ["categories"] });
    setForm((f) => ({ ...f, category: created.id }));
  };
  const handleBrandCreated = async (created) => {
    await queryClient.invalidateQueries({ queryKey: ["brands"] });
    setForm((f) => ({ ...f, brand: created.id }));
  };
  const handleFamilyCreated = async (created) => {
    // Select it right away; don't wait on (or depend on) the refetch.
    setCreatedFamilies((prev) => [...prev, { variants: [], ...created }]);
    setForm((f) => ({ ...f, family: created.id }));
    queryClient.invalidateQueries({ queryKey: ["families"] });
  };

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    if (key === "slug") setSlugTouched(true);
    setForm((f) => ({
      ...f,
      [key]: value,
      ...(key === "name" && !slugTouched ? { slug: slugify(value) } : {}),
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;
    setError("");

    if (!categoryId) {
      setError("Please select a category.");
      return;
    }
    if (!brandId) {
      setError("Please select a brand.");
      return;
    }
    if (familyClash) {
      setError(
        `That family already has a ${CONDITION_LABELS[form.condition]} variant (${familyClash.sku}). Change the condition or pick another family.`
      );
      return;
    }

    const price = Number(form.price);
    const stock = Number(form.stock_quantity);
    const threshold = Number(form.low_stock_threshold || 0);
    if (Number.isNaN(price) || price < 0) {
      setError("Enter a valid price.");
      return;
    }
    if (!Number.isInteger(stock) || stock < 0) {
      setError("Stock quantity must be a whole number of 0 or more.");
      return;
    }
    if (!Number.isInteger(threshold) || threshold < 0) {
      setError("Low stock alert must be a whole number of 0 or more.");
      return;
    }

    setSaving(true);
    try {
      // Send only writable fields (not read-only list fields like id/image/is_in_stock).
      const payload = {
        sku: form.sku.trim(),
        name: form.name.trim(),
        slug: (form.slug.trim() || slugify(form.name)),
        category: categoryId,
        brand: brandId,
        description: form.description || "",
        condition: form.condition,
        price,
        stock_quantity: stock,
        low_stock_threshold: threshold,
        is_active: form.is_active,
        // null detaches the product from any family (standalone)
        family: form.family || null,
      };
      if (editing) {
        await adminApi.updateProduct(editing.slug, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} busy={saving} labelledBy="product-modal-title">
      <form
        onSubmit={handleSubmit}
        className="flex max-h-[90vh] w-full max-w-2xl flex-col overflow-hidden rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] shadow-2xl"
      >
        {/* header */}
        <div className="flex items-start justify-between gap-4 border-b border-[#E7E2D8] dark:border-[#25344D] px-6 py-4">
          <div>
            <h3 id="product-modal-title" className="text-base font-semibold text-[#101B2C] dark:text-white">
              {editing ? `Edit ${editing.name}` : "Add product"}
            </h3>
            <p className="mt-0.5 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
              {editing ? "Update the product details below." : "Fill in the details to add a product to your catalog."}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            disabled={saving}
            aria-label="Close"
            className="-mr-2 -mt-1 rounded-md p-2 text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#0B1320] hover:text-[#101B2C] dark:hover:text-white disabled:opacity-50"
          >
            <CloseIcon />
          </button>
        </div>

        {error && (
          <div className="border-b border-[#E7E2D8] dark:border-[#25344D] px-6 py-3">
            <ErrorAlert message={error} />
          </div>
        )}

        {/* scrollable body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <Field label="SKU">
              <input required autoFocus value={form.sku} onChange={set("sku")} className={inputClasses} />
            </Field>
            <Field label="Name" className="sm:col-span-2">
              <input required value={form.name} onChange={set("name")} className={inputClasses} />
            </Field>
          </div>

          <Field label="Slug" className="mt-4">
            <input required value={form.slug} onChange={set("slug")} className={inputClasses} />
          </Field>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field label="Category">
              <select required value={categoryId} onChange={set("category")} className={inputClasses}>
                <option value="">Select category</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
              <QuickAdd kind="category" categories={categories} onCreated={handleCategoryCreated} />
            </Field>
            <Field label="Brand">
              <select required value={brandId} onChange={set("brand")} className={inputClasses}>
                <option value="">Select brand</option>
                {brands.map((b) => (
                  <option key={b.id} value={b.id}>{b.name}</option>
                ))}
              </select>
              <QuickAdd kind="brand" onCreated={handleBrandCreated} />
            </Field>
          </div>

          <Field label="Product family (optional)" className="mt-4">
            <select value={form.family} onChange={set("family")} className={inputClasses}>
              <option value="">Standalone (no family)</option>
              {families.map((f) => {
                const taken = familyTakenBy(f);
                return (
                  <option
                    key={f.id}
                    value={f.id}
                    disabled={Boolean(taken) && String(f.id) !== String(form.family)}
                  >
                    {f.name} · {f.category_name}
                    {taken ? ` — ${CONDITION_LABELS[form.condition]} taken` : ""}
                  </option>
                );
              })}
            </select>
            {familiesQuery.isError && (
              <p className="mt-1.5 text-xs text-rose-600 dark:text-rose-400">
                Couldn't load existing families ({extractErrorMessage(familiesQuery.error)}). Check that
                listFamilies exists in api/catalog.js and that /product-families/ is reachable.
              </p>
            )}
            {familyClash && (
              <p className="mt-1.5 text-xs text-amber-700 dark:text-amber-300">
                This family already has a {CONDITION_LABELS[form.condition]} variant ({familyClash.sku}). Change the
                condition or pick another family.
              </p>
            )}
            <QuickAdd kind="family" categoryId={categoryId} onCreated={handleFamilyCreated} />
          </Field>

          <Field label="Description" className="mt-4">
            <textarea rows={3} value={form.description} onChange={set("description")} className={inputClasses} />
          </Field>

          <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
            <Field label="Condition">
              <select value={form.condition} onChange={set("condition")} className={inputClasses}>
                <option value="genuine">Genuine (OEM)</option>
                <option value="aftermarket">Aftermarket</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </Field>
            <Field label="Price (KES)">
              <input type="number" required min="0" step="0.01" value={form.price} onChange={set("price")} className={inputClasses} />
            </Field>
            <Field label="Stock qty">
              <input type="number" required min="0" step="1" value={form.stock_quantity} onChange={set("stock_quantity")} className={inputClasses} />
            </Field>
            <Field label="Low stock alert">
              <input type="number" min="0" step="1" value={form.low_stock_threshold} onChange={set("low_stock_threshold")} className={inputClasses} />
            </Field>
          </div>

          <label className="mt-5 flex items-center gap-2 text-sm text-[#1E2430] dark:text-slate-200">
            <input
              type="checkbox"
              checked={form.is_active}
              onChange={set("is_active")}
              className="h-4 w-4 rounded border-[#E7E2D8] dark:border-[#25344D] text-[#101B2C] focus:ring-[#BF9A63]"
            />
            Active (visible in catalog)
          </label>
        </div>

        {/* footer */}
        <div className="flex justify-end gap-2 border-t border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#0B1320]/50 px-6 py-4">
          <button type="button" onClick={onClose} disabled={saving} className={ghostBtn}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={primaryBtn}>
            {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------- restock modal ---------- */

function RestockModal({ product, onClose, onSaved }) {
  const [qty, setQty] = useState("1");
  const [note, setNote] = useState("");
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const amount = Number(qty);
    if (!amount || amount <= 0) {
      setError("Enter a quantity greater than 0.");
      return;
    }
    setError("");
    setSaving(true);
    try {
      await adminApi.restock(product.id, amount, note);
      onSaved();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <ModalShell onClose={onClose} busy={saving} labelledBy="restock-modal-title">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-sm rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235] p-6 shadow-2xl"
      >
        <h3 id="restock-modal-title" className="text-base font-semibold text-[#101B2C] dark:text-white">
          Restock {product.sku}
        </h3>
        <p className="mt-1 text-xs text-[#7C7669] dark:text-[#9FA8B8]">{product.name}</p>

        {error && (
          <div className="mt-3">
            <ErrorAlert message={error} />
          </div>
        )}

        <Field label="Quantity to add" className="mt-4">
          <input
            type="number"
            min="1"
            autoFocus
            value={qty}
            onChange={(e) => setQty(e.target.value)}
            className={inputClasses}
          />
        </Field>

        <Field label="Note" className="mt-4">
          <input value={note} onChange={(e) => setNote(e.target.value)} className={inputClasses} />
        </Field>

        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onClose} disabled={saving} className={`${ghostBtn} !px-4`}>
            Cancel
          </button>
          <button type="submit" disabled={saving} className={`${primaryBtn} !px-4`}>
            {saving ? "Saving…" : "Add stock"}
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ---------- page ---------- */

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [restocking, setRestocking] = useState(null);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [page, setPage] = useState(1);

  // include_inactive lets staff see (and re-activate) deactivated products.
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => catalogApi.listAllProducts({ include_inactive: true }),
  });
  const products = unwrapList(data);

  const stats = useMemo(() => {
    const counts = { in: 0, low: 0, out: 0, inactive: 0 };
    products.forEach((p) => {
      counts[getStatus(p)] += 1;
    });
    return {
      total: products.length,
      active: products.length - counts.inactive,
      inStock: counts.in + counts.low,
      low: counts.low,
      out: counts.out,
    };
  }, [products]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return products.filter((p) => {
      if (statusFilter !== "all" && getStatus(p) !== statusFilter) return false;
      if (!q) return true;
      return [p.name, p.sku, String(p.category ?? ""), String(p.brand ?? ""), p.family_name]
        .some((v) => (v || "").toLowerCase().includes(q));
    });
  }, [products, search, statusFilter]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  // Close the product modal without touching data (Cancel / X / Esc / backdrop).
  const handleCloseForm = () => {
    setShowForm(false);
    setEditing(null);
  };

  // Close after a successful save and refresh the lists.
  const handleSaved = () => {
    handleCloseForm();
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
    queryClient.invalidateQueries({ queryKey: ["families"] });
  };

  const handleRestockSaved = () => {
    setRestocking(null);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
  };

  const th = "px-5 py-3 text-left text-sm font-medium text-[#101B2C] dark:text-white whitespace-nowrap";

  return (
    <div>
      {/* heading */}
      <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-[#101B2C] dark:text-white">Products list</h2>
          <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
            Here you can find all of your products.
          </p>
        </div>
        <button
          onClick={() => {
            setEditing(null);
            setShowForm(true);
          }}
          className="inline-flex items-center gap-2 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-2.5 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77]"
        >
          <span className="text-lg leading-none">+</span> Add product
        </button>
      </div>

      {/* stats */}
      <div className="mb-6 grid grid-cols-2 gap-y-6 border-b border-[#E7E2D8] dark:border-[#25344D] pb-6 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard label="Total products" value={stats.total} hint="All products in catalog" tone="bg-[#BF9A63]" />
        <StatCard label="Active products" value={stats.active} hint="Visible in catalog" tone="bg-emerald-500" />
        <StatCard label="In stock" value={stats.inStock} hint="Available to order" tone="bg-sky-500" />
        <StatCard label="Low stock" value={stats.low} hint="At or below alert level" tone="bg-amber-500" />
        <StatCard label="Out of stock" value={stats.out} hint="Needs restocking" tone="bg-rose-500" />
      </div>

      {/* table card */}
      <div className="overflow-hidden rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235]">
        {/* toolbar */}
        <div className="flex flex-wrap items-center gap-3 p-4">
          <label className="relative min-w-[220px] flex-1 max-w-sm">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[#7C7669] dark:text-[#9FA8B8]">
              <SearchIcon />
            </span>
            <input
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by name, SKU, brand, family…"
              aria-label="Search products"
              className={`${inputClasses} pl-9`}
            />
          </label>
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            aria-label="Filter by status"
            className={`${inputClasses} !w-auto min-w-[150px]`}
          >
            {STATUS_FILTERS.map((s) => (
              <option key={s.value} value={s.value}>{s.label}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Loading products" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="border-t border-[#E7E2D8] dark:border-[#25344D] px-6 py-16 text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]">
            {products.length === 0 ? "No products yet. Add your first product to get started." : "No products match your search."}
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[860px] border-t border-[#E7E2D8] dark:border-[#25344D]">
                <thead className="bg-[#FAF7F2] dark:bg-[#0B1320]">
                  <tr>
                    <th className={th}>Product name</th>
                    <th className={th}>SKU &amp; brand</th>
                    <th className={th}>Price</th>
                    <th className={th}>Stock</th>
                    <th className={th}>Status</th>
                    <th className={`${th} text-right`}>Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
                  {rows.map((p) => (
                    <tr key={p.id} className="transition-colors hover:bg-[#FAF7F2]/60 dark:hover:bg-[#0B1320]/40">
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-3">
                          <ProductThumb product={p} />
                          <div className="min-w-0">
                            <p className="truncate text-sm font-semibold text-[#101B2C] dark:text-white">{p.name}</p>
                            <p className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                              {p.category}
                              {p.condition && ` · ${CONDITION_LABELS[p.condition] || p.condition}`}
                              {p.family_name && ` · Family: ${p.family_name}`}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-5 py-3">
                        <p className="text-sm font-semibold text-[#101B2C] dark:text-white">{p.sku}</p>
                        <p className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">{p.brand}</p>
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-[#101B2C] dark:text-white">
                        <Price value={p.price} />
                      </td>
                      <td className="px-5 py-3 text-sm font-semibold text-[#101B2C] dark:text-white">
                        {(p.stock_quantity ?? 0).toLocaleString()}
                      </td>
                      <td className="px-5 py-3">
                        <StatusPill status={getStatus(p)} />
                      </td>
                      <td className="px-5 py-3">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => setRestocking(p)}
                            className="rounded-md px-3 py-1.5 text-xs font-medium text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#0B1320] hover:text-[#101B2C] dark:hover:text-white"
                          >
                            Restock
                          </button>
                          <button
                            onClick={() => {
                              setShowForm(false);
                              setEditing(p);
                            }}
                            className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-3 py-1.5 text-xs font-medium text-[#101B2C] dark:text-white transition-colors hover:border-[#BF9A63] hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                          >
                            Edit
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* pagination */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-t border-[#E7E2D8] dark:border-[#25344D] px-5 py-3 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
              <span>
                Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, filtered.length)} of {filtered.length}
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-3 py-1.5 font-medium text-[#101B2C] dark:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Previous
                </button>
                <span>Page {currentPage} of {pageCount}</span>
                <button
                  onClick={() => setPage(currentPage + 1)}
                  disabled={currentPage === pageCount}
                  className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-3 py-1.5 font-medium text-[#101B2C] dark:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  Next
                </button>
              </div>
            </div>
          </>
        )}
      </div>

      {(showForm || editing) && (
        <ProductModal
          key={editing ? editing.id : "new"}
          editing={editing}
          onClose={handleCloseForm}
          onSaved={handleSaved}
        />
      )}

      {restocking && (
        <RestockModal
          product={restocking}
          onClose={() => setRestocking(null)}
          onSaved={handleRestockSaved}
        />
      )}
    </div>
  );
}