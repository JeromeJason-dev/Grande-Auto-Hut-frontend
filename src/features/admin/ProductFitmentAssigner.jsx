import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import * as fitmentApi from "../../api/fitment";
import * as catalogApi from "../../api/catalog";
import { unwrapList, extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";

const inputClasses =
  "h-11 w-full rounded-md border border-[#E7E2D8] bg-white px-3 text-sm text-[#101B2C] " +
  "focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/20 " +
  "disabled:cursor-not-allowed disabled:opacity-60 dark:border-slate-700 dark:bg-slate-900 dark:text-white";
const labelClasses = "mb-1.5 block text-xs font-medium text-[#7C7669] dark:text-[#9FA8B8]";
const deleteBtn =
  "rounded-md border border-rose-200 dark:border-rose-500/30 px-2.5 py-1 text-xs font-medium text-rose-600 dark:text-rose-400 transition-colors hover:bg-rose-50 dark:hover:bg-rose-500/10 disabled:opacity-50";

const ALL_YEARS = "__all__";

function useDebounced(value, delay = 300) {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function ProductFitmentAssigner() {
  const queryClient = useQueryClient();

  // Product picker
  const [search, setSearch] = useState("");
  const debouncedSearch = useDebounced(search.trim());
  const [product, setProduct] = useState(null);

  // Vehicle selection for a new assignment
  const [makeSlug, setMakeSlug] = useState("");
  const [modelSlug, setModelSlug] = useState("");
  const [yearId, setYearId] = useState("");
  const [notes, setNotes] = useState("");
  const [notice, setNotice] = useState("");

  const productsQuery = useQuery({
    queryKey: ["admin-fitment-products", debouncedSearch],
    queryFn: () =>
      catalogApi.listProducts({ search: debouncedSearch || undefined, include_inactive: true }),
  });
  const products = unwrapList(productsQuery.data);

  // Shares cache keys with the vehicle catalog panels above.
  const makesQuery = useQuery({ queryKey: ["admin-makes"], queryFn: fitmentApi.listMakes });
  const modelsQuery = useQuery({
    queryKey: ["admin-models", makeSlug],
    queryFn: () => fitmentApi.listModels(makeSlug),
    enabled: !!makeSlug,
  });
  const yearsQuery = useQuery({
    queryKey: ["admin-years", makeSlug, modelSlug],
    queryFn: () => fitmentApi.listYears(makeSlug, modelSlug),
    enabled: !!makeSlug && !!modelSlug,
  });
  const makes = unwrapList(makesQuery.data);
  const models = unwrapList(modelsQuery.data);
  const years = unwrapList(yearsQuery.data);

  const fitmentsQuery = useQuery({
    queryKey: ["admin-fitments", product?.id],
    queryFn: () => fitmentApi.listFitments({ product: product.id }),
    enabled: !!product,
  });
  const fitments = unwrapList(fitmentsQuery.data);

  const afterChange = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-fitments", product?.id] });
    // The customer-facing finder results and product pages must reflect the change.
    queryClient.invalidateQueries({ queryKey: ["fitment-results"] });
    queryClient.invalidateQueries({ queryKey: ["product"] });
  };

  const assignMutation = useMutation({
    mutationFn: async () => {
      if (yearId === ALL_YEARS) {
        return fitmentApi.bulkCreateFitments({
          product: product.id,
          vehicle_years: years.map((y) => y.id),
          notes: notes.trim(),
        });
      }
      await fitmentApi.createFitment({ product: product.id, vehicle_year: yearId, notes: notes.trim() });
      return { created: 1, skipped: 0 };
    },
    onSuccess: (res) => {
      afterChange();
      setNotice(
        res.skipped
          ? `Assigned to ${res.created} year(s); ${res.skipped} already assigned.`
          : `Assigned to ${res.created} year${res.created === 1 ? "" : "s"}.`
      );
      setYearId("");
      setNotes("");
    },
  });

  const removeMutation = useMutation({
    mutationFn: (id) => fitmentApi.deleteFitment(id),
    onSuccess: () => {
      setNotice("");
      afterChange();
    },
  });

  const pickProduct = (p) => {
    setProduct(p);
    setNotice("");
    assignMutation.reset();
    removeMutation.reset();
  };

  const canAssign = !!product && !!yearId && !assignMutation.isPending && (yearId !== ALL_YEARS || years.length > 0);

  return (
    <div className="rounded-xl border border-[#E7E2D8] bg-white p-5 dark:border-slate-800 dark:bg-[#162235]">
      <h2 className="text-sm font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]">
        Assign Products to Vehicles
      </h2>
      <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
        Choose a product, then pick the make, model and year it fits. Customers using the Fitment Finder will see it
        for that vehicle.
      </p>

      <div className="mt-5 grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Product picker */}
        <div>
          <label className={labelClasses} htmlFor="fitment-product-search">Find a product</label>
          <input
            id="fitment-product-search"
            type="search"
            placeholder="Search by name or SKU"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={inputClasses}
          />
          <div className="mt-3 max-h-72 overflow-y-auto divide-y divide-[#E7E2D8] rounded-md border border-[#E7E2D8] dark:divide-slate-700 dark:border-slate-700">
            {productsQuery.isLoading ? (
              <p className="p-3 text-sm text-[#7C7669]">Loading products…</p>
            ) : productsQuery.isError ? (
              <div className="p-3"><ErrorAlert message={extractErrorMessage(productsQuery.error)} /></div>
            ) : products.length === 0 ? (
              <p className="p-3 text-sm text-[#7C7669]">No products match your search.</p>
            ) : (
              products.map((p) => (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => pickProduct(p)}
                  className={`flex w-full items-center justify-between gap-3 px-3 py-2.5 text-left text-sm transition-colors ${
                    product?.id === p.id ? "bg-[#BF9A63]/10" : "hover:bg-slate-50 dark:hover:bg-slate-800"
                  }`}
                >
                  <span className="min-w-0">
                    <span className={`block truncate ${product?.id === p.id ? "font-medium text-[#BF9A63]" : "text-[#101B2C] dark:text-white"}`}>
                      {p.name}
                    </span>
                    <span className="block truncate text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                      {p.sku} · {p.category}
                    </span>
                  </span>
                  {!p.is_active && (
                    <span className="shrink-0 rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium uppercase text-slate-500 dark:bg-slate-800">
                      Inactive
                    </span>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Assignment form + current fitments */}
        <div>
          {!product ? (
            <p className="rounded-md border border-dashed border-[#E7E2D8] p-6 text-sm text-[#7C7669] dark:border-slate-700">
              Select a product on the left to manage which vehicles it fits.
            </p>
          ) : (
            <div className="space-y-5">
              <div>
                <p className="text-xs font-medium text-[#7C7669] dark:text-[#9FA8B8]">Selected product</p>
                <p className="text-base font-semibold text-[#101B2C] dark:text-white">{product.name}</p>
                <p className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">{product.sku}</p>
              </div>

              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  setNotice("");
                  if (canAssign) assignMutation.mutate();
                }}
                className="space-y-3"
              >
                <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <div>
                    <label className={labelClasses} htmlFor="assign-make">Make</label>
                    <select
                      id="assign-make"
                      value={makeSlug}
                      onChange={(e) => { setMakeSlug(e.target.value); setModelSlug(""); setYearId(""); }}
                      className={inputClasses}
                    >
                      <option value="">Select make</option>
                      {makes.map((m) => <option key={m.id} value={m.slug}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses} htmlFor="assign-model">Model</label>
                    <select
                      id="assign-model"
                      value={modelSlug}
                      disabled={!makeSlug}
                      onChange={(e) => { setModelSlug(e.target.value); setYearId(""); }}
                      className={inputClasses}
                    >
                      <option value="">{makeSlug ? "Select model" : "Pick a make"}</option>
                      {models.map((m) => <option key={m.id} value={m.slug}>{m.name}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className={labelClasses} htmlFor="assign-year">Year</label>
                    <select
                      id="assign-year"
                      value={yearId}
                      disabled={!modelSlug}
                      onChange={(e) => setYearId(e.target.value)}
                      className={inputClasses}
                    >
                      <option value="">{modelSlug ? "Select year" : "Pick a model"}</option>
                      {years.length > 1 && <option value={ALL_YEARS}>All years ({years.length})</option>}
                      {years.map((y) => <option key={y.id} value={y.id}>{y.year}</option>)}
                    </select>
                  </div>
                </div>

                {modelSlug && !yearsQuery.isLoading && years.length === 0 && (
                  <p className="text-xs text-amber-600">
                    This model has no years yet. Add some in the Years panel above first.
                  </p>
                )}

                <div>
                  <label className={labelClasses} htmlFor="assign-notes">Notes (optional)</label>
                  <input
                    id="assign-notes"
                    type="text"
                    maxLength={255}
                    placeholder="e.g. Front only, requires bracket kit"
                    value={notes}
                    onChange={(e) => setNotes(e.target.value)}
                    className={inputClasses}
                  />
                </div>

                <button
                  type="submit"
                  disabled={!canAssign}
                  className="h-11 rounded-md bg-[#BF9A63] px-6 text-sm font-medium text-white hover:bg-[#A9834E] disabled:opacity-50"
                >
                  {assignMutation.isPending ? "Assigning…" : "Assign to vehicle"}
                </button>

                {assignMutation.isError && <ErrorAlert message={extractErrorMessage(assignMutation.error)} />}
                {notice && <p role="status" className="text-sm text-emerald-600 dark:text-emerald-400">{notice}</p>}
              </form>

              <div>
                <h3 className="text-xs font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]">
                  Currently fits ({fitments.length})
                </h3>
                {removeMutation.isError && (
                  <div className="mt-2"><ErrorAlert message={extractErrorMessage(removeMutation.error)} /></div>
                )}
                <div className="mt-2 max-h-56 overflow-y-auto divide-y divide-[#E7E2D8] rounded-md border border-[#E7E2D8] dark:divide-slate-700 dark:border-slate-700">
                  {fitmentsQuery.isLoading ? (
                    <p className="p-3 text-sm text-[#7C7669]">Loading…</p>
                  ) : fitments.length === 0 ? (
                    <p className="p-3 text-sm text-[#7C7669]">Not assigned to any vehicle yet.</p>
                  ) : (
                    fitments.map((f) => (
                      <div key={f.id} className="flex items-center justify-between gap-3 px-3 py-2">
                        <div className="min-w-0 text-sm text-[#101B2C] dark:text-white">
                          <span className="font-medium">{f.make} {f.model} {f.year}</span>
                          {f.notes && <span className="block truncate text-xs text-[#7C7669] dark:text-[#9FA8B8]">{f.notes}</span>}
                        </div>
                        <button
                          type="button"
                          onClick={() => removeMutation.mutate(f.id)}
                          disabled={removeMutation.isPending}
                          className={deleteBtn}
                          aria-label={`Remove fitment for ${f.make} ${f.model} ${f.year}`}
                        >
                          Remove
                        </button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}