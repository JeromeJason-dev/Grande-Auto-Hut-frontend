import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as catalogApi from "../../api/catalog";
import * as adminApi from "../../api/admin";
import { unwrapList, extractErrorMessage } from "../../api/client";
import Price from "../../components/Price";
import StockBadge from "../../components/StockBadge";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";

const EMPTY_FORM = {
  sku: "", name: "", slug: "", category: "", brand: "", description: "",
  condition: "aftermarket", price: "", stock_quantity: "", low_stock_threshold: "5", is_active: true,
};

function slugify(text) {
  return text.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
}

const inputClasses =
  "w-full rounded-md border border-[#E7E2D8] bg-white px-3 py-2 text-sm text-[#1E2430] focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20";
const labelClasses = "mb-1.5 block text-xs font-medium text-[#7C7669]";

function Field({ label, className = "", children }) {
  return (
    <div className={className}>
      <label className={labelClasses}>{label}</label>
      {children}
    </div>
  );
}

function ProductForm({ editing, onDone }) {
  const [form, setForm] = useState(
    editing
      ? {
          ...EMPTY_FORM,
          ...editing,
          category: editing.category?.id || editing.category,
          brand: editing.brand?.id || editing.brand,
        }
      : EMPTY_FORM
  );
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: catalogApi.listCategories });
  const brandsQuery = useQuery({ queryKey: ["brands"], queryFn: catalogApi.listBrands });

  const set = (key) => (e) => {
    const value = e.target.type === "checkbox" ? e.target.checked : e.target.value;
    setForm((f) => ({ ...f, [key]: value, ...(key === "name" && !editing ? { slug: slugify(value) } : {}) }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSaving(true);
    try {
      const payload = {
        ...form,
        price: Number(form.price),
        stock_quantity: Number(form.stock_quantity),
        low_stock_threshold: Number(form.low_stock_threshold),
      };
      if (editing) {
        await adminApi.updateProduct(editing.slug, payload);
      } else {
        await adminApi.createProduct(payload);
      }
      onDone();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="mb-6 rounded-xl border border-[#E7E2D8] bg-white p-6">
      <h3 className="text-base font-semibold text-[#101B2C]">
        {editing ? `Edit ${editing.name}` : "Add product"}
      </h3>

      {error && (
        <div className="mt-3">
          <ErrorAlert message={error} />
        </div>
      )}

      <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="SKU">
          <input required value={form.sku} onChange={set("sku")} className={inputClasses} />
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
          <select required value={form.category} onChange={set("category")} className={inputClasses}>
            <option value="">Select category</option>
            {unwrapList(categoriesQuery.data).map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </Field>
        <Field label="Brand">
          <select required value={form.brand} onChange={set("brand")} className={inputClasses}>
            <option value="">Select brand</option>
            {unwrapList(brandsQuery.data).map((b) => (
              <option key={b.id} value={b.id}>{b.name}</option>
            ))}
          </select>
        </Field>
      </div>

      <Field label="Description" className="mt-4">
        <textarea rows={2} value={form.description} onChange={set("description")} className={inputClasses} />
      </Field>

      <div className="mt-4 grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Field label="Condition">
          {/* "refurbished" was missing here even though the backend and
              catalog filter both support it — added so admins can
              actually create the third variant type. */}
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
          <input type="number" required min="0" value={form.stock_quantity} onChange={set("stock_quantity")} className={inputClasses} />
        </Field>
        <Field label="Low stock alert">
          <input type="number" min="0" value={form.low_stock_threshold} onChange={set("low_stock_threshold")} className={inputClasses} />
        </Field>
      </div>

      <label className="mt-4 flex items-center gap-2 text-sm text-[#1E2430]">
        <input
          type="checkbox"
          checked={form.is_active}
          onChange={set("is_active")}
          className="h-4 w-4 rounded border-[#E7E2D8] text-[#101B2C] focus:ring-[#BF9A63]"
        />
        Active (visible in catalog)
      </label>

      <div className="mt-5 flex gap-2">
        <button
          type="submit"
          disabled={saving}
          className="rounded-md bg-[#101B2C] px-5 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] disabled:text-[#7C7669]"
        >
          {saving ? "Saving…" : editing ? "Save changes" : "Create product"}
        </button>
        <button
          type="button"
          onClick={onDone}
          className="rounded-md px-5 py-2 text-sm font-medium text-[#7C7669] transition-colors hover:bg-[#FAF7F2] hover:text-[#101B2C]"
        >
          Cancel
        </button>
      </div>
    </form>
  );
}

export default function AdminProductsPage() {
  const queryClient = useQueryClient();
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState(null);
  const [restockError, setRestockError] = useState("");
  const { data, isLoading } = useQuery({
    queryKey: ["admin-products"],
    queryFn: () => catalogApi.listProducts({ page_size: 100 }),
  });
  const products = unwrapList(data);

  const handleDone = () => {
    setShowForm(false);
    setEditing(null);
    queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    queryClient.invalidateQueries({ queryKey: ["products"] });
  };

  const handleRestock = async (product) => {
    const qty = window.prompt(`Add how many units of ${product.sku} to stock?`, "10");
    if (!qty || Number(qty) <= 0) return;
    setRestockError("");
    try {
      await adminApi.restock(product.id, Number(qty), "Restock via admin dashboard");
      queryClient.invalidateQueries({ queryKey: ["admin-products"] });
    } catch (err) {
      setRestockError(extractErrorMessage(err));
    }
  };

  return (
    <div>
      <div className="mb-5 flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#101B2C]">Products</h2>
        {!showForm && !editing && (
          <button
            onClick={() => setShowForm(true)}
            className="rounded-md bg-[#101B2C] px-4 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46]"
          >
            Add product
          </button>
        )}
      </div>

      {restockError && (
        <div className="mb-4">
          <ErrorAlert message={restockError} />
        </div>
      )}

      {(showForm || editing) && <ProductForm editing={editing} onDone={handleDone} />}

      {isLoading ? (
        <div className="flex justify-center py-16">
          <Spinner label="Loading products" />
        </div>
      ) : products.length === 0 ? (
        <div className="rounded-xl border border-dashed border-[#E7E2D8] bg-white px-6 py-16 text-center text-sm text-[#7C7669]">
          No products yet.
        </div>
      ) : (
        <div className="overflow-hidden rounded-xl border border-[#E7E2D8] bg-white">
          <div className="divide-y divide-[#E7E2D8]">
            {products.map((p) => (
              <div key={p.id} className="flex flex-wrap items-center gap-4 px-5 py-3.5">
                <span className="rounded border border-[#E7E2D8] bg-[#FAF7F2] px-2 py-0.5 font-mono text-[11px] text-[#7C7669]">
                  {p.sku}
                </span>
                <strong className="flex-1 text-sm font-medium text-[#101B2C]">{p.name}</strong>
                <span className="text-sm text-[#7C7669]">
                  {p.category} · {p.brand}
                </span>
                <Price value={p.price} />
                <StockBadge inStock={p.is_in_stock} lowStock={p.is_low_stock} />
                <button
                  onClick={() => handleRestock(p)}
                  className="rounded-md px-3 py-1.5 text-xs font-medium text-[#7C7669] transition-colors hover:bg-[#FAF7F2] hover:text-[#101B2C]"
                >
                  Restock
                </button>
                <button
                  onClick={() => {
                    setEditing(p);
                    setShowForm(false);
                  }}
                  className="rounded-md border border-[#E7E2D8] px-3 py-1.5 text-xs font-medium text-[#101B2C] transition-colors hover:border-[#BF9A63] hover:text-[#A9834E]"
                >
                  Edit
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}