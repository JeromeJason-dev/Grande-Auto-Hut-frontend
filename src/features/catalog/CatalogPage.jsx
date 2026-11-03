import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
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

// Products shown per page. This must match PAGE_SIZE in the backend's
const PAGE_SIZE = 20;

const pageButtonBase =
  "inline-flex h-9 min-w-9 items-center justify-center rounded-md border px-3 text-sm font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/40 disabled:cursor-not-allowed disabled:opacity-40";
const pageButtonIdle =
  "border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] text-[#1E2430] dark:text-slate-100 hover:border-[#BF9A63] hover:text-[#A9834E] dark:hover:text-[#BF9A63] disabled:hover:border-[#E7E2D8] dark:disabled:hover:border-white/10 disabled:hover:text-inherit";
const pageButtonActive = "border-[#BF9A63] bg-[#BF9A63] text-[#101B2C]";

/** 1 ... 4 5 6 ... 12 style list of page numbers ("gap" renders as an ellipsis). */
function getPageItems(current, total) {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
  const pages = new Set([1, total, current - 1, current, current + 1]);
  if (current <= 3) [2, 3, 4].forEach((n) => pages.add(n));
  if (current >= total - 2) [total - 3, total - 2, total - 1].forEach((n) => pages.add(n));
  const sorted = [...pages].filter((n) => n >= 1 && n <= total).sort((a, b) => a - b);
  const items = [];
  sorted.forEach((n, i) => {
    if (i > 0 && n - sorted[i - 1] > 1) items.push("gap");
    items.push(n);
  });
  return items;
}

function CatalogPagination({ page, totalPages, onPage }) {
  if (totalPages <= 1) return null;
  const items = getPageItems(page, totalPages);
  return (
    <nav aria-label="Catalog pages" className="mt-8 flex flex-wrap items-center justify-center gap-2">
      <button
        type="button"
        disabled={page <= 1}
        onClick={() => onPage(page - 1)}
        className={`${pageButtonBase} ${pageButtonIdle}`}
      >
        Previous
      </button>
      {items.map((item, i) =>
        item === "gap" ? (
          <span key={`gap-${i}`} aria-hidden="true" className="px-1 text-[#7C7669] dark:text-slate-400">
            …
          </span>
        ) : (
          <button
            key={item}
            type="button"
            onClick={() => onPage(item)}
            aria-label={`Page ${item}`}
            aria-current={item === page ? "page" : undefined}
            className={`${pageButtonBase} ${item === page ? pageButtonActive : pageButtonIdle}`}
          >
            {item}
          </button>
        )
      )}
      <button
        type="button"
        disabled={page >= totalPages}
        onClick={() => onPage(page + 1)}
        className={`${pageButtonBase} ${pageButtonIdle}`}
      >
        Next
      </button>
    </nav>
  );
}

export default function CatalogPage() {
  const [params, setParams] = useSearchParams();
  const [search, setSearch] = useState(params.get("search") || "");
  const { addItem } = useCart();

  const categoriesQuery = useQuery({ queryKey: ["categories"], queryFn: catalogApi.listCategories });
  const brandsQuery = useQuery({ queryKey: ["brands"], queryFn: catalogApi.listBrands });

  // Current page comes from the URL (?page=2) so it survives refresh, back/forward and shared links.
  const page = Math.max(1, parseInt(params.get("page"), 10) || 1);
  const filters = Object.fromEntries(params.entries());
  if (page > 1) filters.page = String(page);
  else delete filters.page;

  const productsQuery = useQuery({
    queryKey: ["products", filters],
    queryFn: () => catalogApi.listProducts(filters),
    placeholderData: keepPreviousData, // keep showing the old page while the next one loads
  });

  const count = productsQuery.data?.count ?? 0;
  const totalPages = Math.max(1, Math.ceil(count / PAGE_SIZE));

  const goToPage = (n) => {
    const next = new URLSearchParams(params);
    if (n > 1) next.set("page", String(n)); else next.delete("page");
    setParams(next);
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // If the URL asks for a page that doesn't exist (e.g. ?page=99, or fewer results after
  // a product was removed), fall back to the last valid page instead of showing an error.
  const notFound = productsQuery.isError && productsQuery.error?.response?.status === 404;
  useEffect(() => {
    if (page <= 1) return;
    const outOfRange = productsQuery.data && !productsQuery.isPlaceholderData && count > 0 && page > totalPages;
    if (!notFound && !outOfRange) return;
    const next = new URLSearchParams(params);
    const target = notFound ? 1 : totalPages;
    if (target > 1) next.set("page", String(target)); else next.delete("page");
    setParams(next, { replace: true });
  }, [notFound, page, count, totalPages, productsQuery.data, productsQuery.isPlaceholderData, params, setParams]);

  const setFilter = (key, value) => {
    const next = new URLSearchParams(params);
    if (value) next.set(key, value); else next.delete(key);
    next.delete("page"); // a new filter/search/sort always starts back on page 1
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
    ["category", "brand", "condition", "search", "page"].forEach((key) => next.delete(key));
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
              {count > PAGE_SIZE
                ? `Showing ${(page - 1) * PAGE_SIZE + 1}–${Math.min(count, page * PAGE_SIZE)} of ${count} parts`
                : `${count || products.length} parts`}
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

            {productsQuery.isError && !notFound && (
              <div className="rounded-xl border border-dashed border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] px-6 py-16">
                <EmptyState
                  title="Couldn't load parts"
                  body="Please check your connection and try again."
                />
              </div>
            )}

            {products.length > 0 && (
              <>
                <div
                  className={`grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3 transition-opacity ${
                    productsQuery.isPlaceholderData ? "opacity-60" : "opacity-100"
                  }`}
                >
                  {products.map((p) => (
                    <ProductCard key={p.id} product={p} onAddToCart={addItem} />
                  ))}
                </div>
                <CatalogPagination page={page} totalPages={totalPages} onPage={goToPage} />
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}