import { useState } from "react";
import { useSearchParams, Link, useNavigate, useLocation } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as fitmentApi from "../../api/fitment";
import { unwrapList } from "../../api/client";
import { CONDITION_LABELS } from "../../api/conditions";
import { getProductImage } from "../../utils";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import { useNotificationToastContext } from "../notifications/NotificationToastContext";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";
import FitmentFinder from "./FitmentFinder";

const PAGE_SIZE = 10;

const th = "px-5 py-3 text-left text-sm font-medium text-[#101B2C] dark:text-white whitespace-nowrap";

/* ---------- availability pill (same look as the admin products page) ---------- */

function getStatus(p) {
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

function ProductThumb({ product }) {
  const src = getProductImage(product);
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
      {(product.name || "?").slice(0, 1).toUpperCase()}
    </span>
  );
}

/* ---------- add to cart (same flow as ProductCard) ---------- */

function AddToCartButton({ product }) {
  const { status } = useAuth();
  const { addItem } = useCart();
  const { showToast } = useNotificationToastContext();
  const navigate = useNavigate();
  const location = useLocation();
  const [adding, setAdding] = useState(false);

  const handleClick = async () => {
    if (adding) return;
    if (status !== "authenticated") {
      if (status === "anonymous") {
        navigate("/login", { state: { from: location.pathname + location.search } });
      }
      return;
    }
    setAdding(true);
    try {
      await addItem({
        id: product.id,
        slug: product.slug,
        name: product.name,
        brand: product.brand,
        category: product.category,
        condition: product.condition,
        sku: product.sku,
        price: product.price,
        is_in_stock: product.is_in_stock,
        is_low_stock: product.is_low_stock,
      });
      showToast({
        type: "success",
        title: "Added to cart",
        message: `${product.name} was added to your cart.`,
        duration: 4000,
        actions: [{ label: "View cart", variant: "primary", onClick: () => navigate("/cart") }],
      });
    } catch (err) {
      console.error("Failed to add item to cart:", err);
      showToast({
        type: "warning",
        title: "Couldn't add to cart",
        message: "Something went wrong. Please try again.",
        duration: 5000,
      });
    } finally {
      setAdding(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={!product.is_in_stock || adding}
      className="rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-3 py-1.5 text-xs font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] dark:disabled:bg-[#25344D] disabled:text-[#7C7669] dark:disabled:text-[#9FA8B8]"
    >
      {adding ? "Adding…" : "Add to cart"}
    </button>
  );
}

/* ---------- page ---------- */

export default function FitmentResultsPage() {
  const [params] = useSearchParams();
  const make = params.get("make");
  const model = params.get("model");
  const year = params.get("year");
  const hasVehicle = !!(make && model && year);

  // Page number is remembered per vehicle, so a new search starts back on page 1.
  const vehicleKey = `${make}|${model}|${year}`;
  const [pageState, setPageState] = useState({ key: vehicleKey, page: 1 });
  const page = pageState.key === vehicleKey ? pageState.page : 1;
  const setPage = (n) => setPageState({ key: vehicleKey, page: n });

  const { data: raw, isLoading, isError, error } = useQuery({
    queryKey: ["fitment-results", make, model, year],
    queryFn: () => fitmentApi.findFittingProducts({ make, model, year }),
    enabled: hasVehicle,
  });
  const products = raw ? unwrapList(raw) : [];

  const pageCount = Math.max(1, Math.ceil(products.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const rows = products.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);

  const vehicleLabel = hasVehicle
    ? `${make.replace(/-/g, " ")} ${model.replace(/-/g, " ")} ${year}`
    : "";

  let body;
  if (!hasVehicle) {
    body = (
      <div className="border-t border-[#E7E2D8] dark:border-[#25344D] px-6 py-16 text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]">
        Select your make, model and year above to see the parts confirmed to fit your vehicle.
      </div>
    );
  } else if (isLoading) {
    body = (
      <div className="flex justify-center border-t border-[#E7E2D8] dark:border-[#25344D] py-16">
        <Spinner label="Checking fitment" />
      </div>
    );
  } else if (isError) {
    body = (
      <div className="border-t border-[#E7E2D8] dark:border-[#25344D] px-6 py-16 text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]">
        {error?.response?.status === 404
          ? "We couldn't find that make/model/year combination. Try adjusting your selection above."
          : "Something went wrong looking that up. Please try again."}
      </div>
    );
  } else if (products.length === 0) {
    body = (
      <div className="border-t border-[#E7E2D8] dark:border-[#25344D] px-6 py-16 text-center text-sm text-[#7C7669] dark:text-[#9FA8B8]">
        <p>We haven't catalogued any confirmed parts for this exact vehicle yet.</p>
        <Link
          to="/catalog"
          className="mt-3 inline-block rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-3 py-1.5 text-xs font-medium text-[#101B2C] dark:text-white transition-colors hover:border-[#BF9A63] hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
        >
          Browse full catalog
        </Link>
      </div>
    );
  } else {
    body = (
      <>
        <div className="overflow-x-auto">
          <table className="w-full min-w-[920px] border-t border-[#E7E2D8] dark:border-[#25344D]">
            <thead className="bg-[#FAF7F2] dark:bg-[#0B1320]">
              <tr>
                <th className={th}>Product name</th>
                <th className={th}>SKU &amp; brand</th>
                <th className={th}>Price</th>
                <th className={th}>Availability</th>
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
                        <Link
                          to={`/catalog/${p.slug}`}
                          className="block truncate text-sm font-semibold text-[#101B2C] dark:text-white hover:text-[#BF9A63]"
                        >
                          {p.name}
                        </Link>
                        <p className="text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                          {p.category}
                          {p.condition && ` · ${CONDITION_LABELS[p.condition] || p.condition}`}
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
                  <td className="px-5 py-3">
                    <StatusPill status={getStatus(p)} />
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex justify-end gap-2">
                      <Link
                        to={`/catalog/${p.slug}`}
                        className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-3 py-1.5 text-xs font-medium text-[#101B2C] dark:text-white transition-colors hover:border-[#BF9A63] hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                      >
                        View details
                      </Link>
                      <AddToCartButton product={p} />
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
            Showing {(currentPage - 1) * PAGE_SIZE + 1}–{Math.min(currentPage * PAGE_SIZE, products.length)} of {products.length}
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
    );
  }

  return (
    // Full width of the page with a 5rem margin on each side (tighter on phones).
    <div className="mx-4 py-10 sm:mx-20">
      <div className="mb-8">
        <h1 className="text-2xl font-semibold capitalize text-[#101B2C] dark:text-white">
          {hasVehicle ? `Parts for ${vehicleLabel}` : "Find parts for your vehicle"}
        </h1>
        <p className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8]">
          {hasVehicle && raw && !isError
            ? `${products.length} part${products.length === 1 ? "" : "s"} confirmed to fit.`
            : "Only parts confirmed to fit your vehicle are listed."}
        </p>
      </div>

      <div className="overflow-hidden rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#162235]">
        {/* toolbar: the fitment finder is the search bar */}
        <div className="p-4">
          <FitmentFinder variant="toolbar" initial={{ make, model, year }} />
        </div>
        {body}
      </div>
    </div>
  );
}