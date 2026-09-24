import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as catalogApi from "../../api/catalog";
import { unwrapList } from "../../api/client";
import ProductCard from "../../components/ProductCard";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import { groupProductsByFamily } from "../../api/groupProducts";
import { useCart } from "../cart/CartContext";

const selectClasses =
  "w-full rounded-md border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] px-3 py-2 text-sm text-[#1E2430] dark:text-slate-100 transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25";

const labelClasses = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-slate-400";

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const { addItem } = useCart();

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: catalogApi.listCategories });
  const brandsQuery = useQuery({ queryKey: ["brands"], queryFn: catalogApi.listBrands });

  const filters = Object.fromEntries(params.entries());
  const productsQuery = useQuery({
    queryKey: ["products", filters],
    queryFn: () => catalogApi.listProducts(filters),
  });

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    setParams(next);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setFilter("search", search);
  };

  const activeFilterCount = ["category", "brand", "condition"].filter((key) =>
    params.get(key)
  ).length;

  const clearFilters = () => {
    const next = new URLSearchParams(params);
    ["category", "brand", "condition", "search"].forEach((key) => next.delete(key));
    setParams(next);
    setSearch("");
  };

  const products = groupProductsByFamily(unwrapList(productsQuery.data));

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0B121F] text-[#1E2430] dark:text-slate-100 transition-colors duration-200">
      <div className="pl-12 pr-8 py-10">
        <div className="mb-8 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">Catalog</h1>
            <p className="mt-1 text-sm text-[#7C7669] dark:text-slate-400">
              Genuine, aftermarket and refurbished parts, all fitment-verified.
            </p>
          </div>
          {productsQuery.data && (
            <span className="text-sm text-[#7C7669] dark:text-slate-400">
              {productsQuery.data.count ?? products.length} parts
            </span>
          )}
        </div>

        <div className="grid gap-8 md:grid-cols-[240px_1fr]">
          {/* Filters */}
          <aside className="h-fit rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] p-5 shadow-sm dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-sm font-semibold text-[#101B2C] dark:text-white">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-xs font-medium text-[#A9834E] dark:text-[#BF9A63] transition-colors hover:text-[#101B2C] dark:hover:text-white"
                >
                  Clear all
                </button>
              )}
            </div>

            <form onSubmit={handleSearchSubmit} className="mb-5">
              <label htmlFor="search" className={labelClasses}>
                Search
              </label>
              <div className="relative">
                <input
                  id="search"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Part name or SKU"
                  className={`${selectClasses} pr-9`}
                />
                <button
                  type="submit"
                  aria-label="Search"
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-[#7C7669] dark:text-slate-400 transition-colors hover:text-[#101B2C] dark:hover:text-white"
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="11" cy="11" r="7" />
                    <path d="m21 21-4.3-4.3" />
                  </svg>
                </button>
              </div>
            </form>

            <div className="mb-5">
              <label htmlFor="category" className={labelClasses}>
                Category
              </label>
              <select
                id="category"
                value={params.get("category") || ""}
                onChange={(e) => setFilter("category", e.target.value)}
                className={selectClasses}
              >
                <option value="">All categories</option>
                {unwrapList(categoriesQuery.data).map((c) => (
                  <option key={c.id} value={c.slug}>{c.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="brand" className={labelClasses}>
                Brand
              </label>
              <select
                id="brand"
                value={params.get("brand") || ""}
                onChange={(e) => setFilter("brand", e.target.value)}
                className={selectClasses}
              >
                <option value="">All brands</option>
                {unwrapList(brandsQuery.data).map((b) => (
                  <option key={b.id} value={b.slug}>{b.name}</option>
                ))}
              </select>
            </div>

            <div className="mb-5">
              <label htmlFor="condition" className={labelClasses}>
                Condition
              </label>
              <select
                id="condition"
                value={params.get("condition") || ""}
                onChange={(e) => setFilter("condition", e.target.value)}
                className={selectClasses}
              >
                <option value="">All conditions</option>
                <option value="genuine">Genuine (OEM)</option>
                <option value="aftermarket">Aftermarket</option>
                <option value="refurbished">Refurbished</option>
              </select>
            </div>

            <div>
              <label htmlFor="ordering" className={labelClasses}>
                Sort by
              </label>
              <select
                id="ordering"
                value={params.get("ordering") || ""}
                onChange={(e) => setFilter("ordering", e.target.value)}
                className={selectClasses}
              >
                <option value="">Newest first</option>
                <option value="price">Price: low to high</option>
                <option value="-price">Price: high to low</option>
                <option value="name">Name: A–Z</option>
              </select>
            </div>
          </aside>

          {/* Results */}
          <div>
            {productsQuery.isLoading && (
              <div className="flex justify-center py-20">
                <Spinner label="Loading parts" />
              </div>
            )}

            {productsQuery.data && products.length === 0 && (
              <div className="rounded-xl border border-dashed border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] px-6 py-16">
                <EmptyState
                  title="No parts match those filters"
                  body="Try clearing a filter or searching a different term."
                />
              </div>
            )}

            {products.length > 0 && (
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
                {products.map((p) => (
                  <ProductCard key={p.id} product={p} onAddToCart={addItem} />
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}