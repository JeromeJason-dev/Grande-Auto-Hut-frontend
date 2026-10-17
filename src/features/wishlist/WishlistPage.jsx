import { Link, useNavigate } from "react-router-dom";
import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as wishlistApi from "../../api/wishlist";
import { useCart } from "../cart/CartContext";
import { useNotificationToastContext } from "../notifications/NotificationToastContext";
import { unwrapList, extractErrorMessage } from "../../api/client";
import { getConditionVariants } from "../../api/productVariants";
import { CONDITION_LABELS } from "../../api/conditions";
import { getProductImage, getFallbackImage } from "../../utils";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";

// Shared column layouts so the header row and every item row line up on desktop.
// The "Date added" column only appears when the API actually returns a date.
const HEAD_WITH_DATES =
  "hidden md:grid md:grid-cols-[2.25rem_minmax(0,1fr)_7rem_8rem_7rem_9.5rem] md:items-center md:gap-x-4";
const HEAD_NO_DATES =
  "hidden md:grid md:grid-cols-[2.25rem_minmax(0,1fr)_7rem_7rem_9.5rem] md:items-center md:gap-x-4";
const ROW_WITH_DATES =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 md:grid-cols-[2.25rem_minmax(0,1fr)_7rem_8rem_7rem_9.5rem] md:gap-y-0";
const ROW_NO_DATES =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 md:grid-cols-[2.25rem_minmax(0,1fr)_7rem_7rem_9.5rem] md:gap-y-0";

const getAddedAt = (item) => item.created_at || item.added_at || item.date_added || null;

function formatDate(value) {
  if (!value) return "—";
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("en-KE", { day: "numeric", month: "short", year: "numeric" });
}

function stockInfo(variant) {
  if (!variant.is_in_stock)
    return { label: "Out of stock", cls: "text-[#DC2626] dark:text-red-400" };
  if (variant.is_low_stock)
    return { label: "Low stock", cls: "text-amber-600 dark:text-amber-400" };
  return { label: "In stock", cls: "text-emerald-600 dark:text-emerald-400" };
}

/* ---------- Small pieces ---------- */

function WishlistImage({ product }) {
  const [failedSrc, setFailedSrc] = useState(null);
  const fallback = getFallbackImage(product);
  const preferred = getProductImage(product);
  const src =
    failedSrc && failedSrc === preferred
      ? preferred !== fallback
        ? fallback
        : null
      : preferred;

  return (
    <div className="h-20 w-20 flex-shrink-0 overflow-hidden rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235]">
      {src ? (
        <img
          src={src}
          alt={product?.name || ""}
          loading="lazy"
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-contain p-1.5"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[#D8D2C4] dark:text-white/20">
          <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
      )}
    </div>
  );
}

function TrustItem({ icon, title, body }) {
  return (
    <div className="flex items-center gap-3">
      <span className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-[#FAF7F2] dark:bg-[#162235] text-[#BF9A63]">
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
          {icon}
        </svg>
      </span>
      <div>
        <p className="text-sm font-semibold text-[#101B2C] dark:text-white">{title}</p>
        <p className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">{body}</p>
      </div>
    </div>
  );
}

const TRUST_ITEMS = [
  {
    title: "Fitment matched",
    body: "Checked against your vehicle before dispatch",
    icon: (
      <>
        <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3Z" />
        <path d="M9 12l2 2 4-4" />
      </>
    ),
  },
  {
    title: "Pay with M-Pesa",
    body: "Secure mobile payment at checkout",
    icon: (
      <>
        <rect x="6" y="2.5" width="12" height="19" rx="2.5" />
        <path d="M11 18.5h2" />
      </>
    ),
  },
  {
    title: "Support when you need it",
    body: "Ask our team about any part",
    icon: (
      <>
        <circle cx="12" cy="12" r="9" />
        <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01" />
      </>
    ),
  },
];

/* ---------- Page ---------- */

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { addItem } = useCart();
  const { showToast, dismissToast } = useNotificationToastContext();
  const [busyId, setBusyId] = useState(null); // item id being added/removed
  const [bulkBusy, setBulkBusy] = useState(false);
  const confirmToastRef = useRef(null);

  const { data, isLoading } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistApi.getWishlist,
  });
  const items = unwrapList(data);
  const hasDates = items.some((i) => getAddedAt(i));

  const itemsRef = useRef(items);
  useEffect(() => {
    itemsRef.current = items;
  }, [items]);

  // Don't leave a confirmation toast behind if the user navigates away.
  useEffect(() => {
    return () => {
      if (confirmToastRef.current) dismissToast(confirmToastRef.current);
    };
  }, [dismissToast]);

  const refresh = () => queryClient.invalidateQueries({ queryKey: ["wishlist"] });

  const notifyError = (err) =>
    showToast({
      type: "warning",
      title: "Something went wrong",
      message: extractErrorMessage(err),
      duration: 5000,
    });

  const viewCartAction = {
    label: "View cart",
    variant: "primary",
    onClick: () => navigate("/cart"),
  };

  const handleRemove = async (item) => {
    setBusyId(item.id);
    try {
      await wishlistApi.removeFromWishlist(item.product.id);
      await refresh();
      showToast({
        type: "success",
        title: "Removed from wishlist",
        message: `${item.product.name} was removed from your wishlist.`,
        duration: 4000,
      });
    } catch (err) {
      notifyError(err);
    } finally {
      setBusyId(null);
    }
  };

  const handleAddToCart = async (item) => {
    const variant = getConditionVariants(item.product)[0];
    setBusyId(item.id);
    try {
      await addItem(variant.product_id ?? item.product.id, 1);
      showToast({
        type: "success",
        title: "Added to cart",
        message: `${item.product.name} was added to your cart.`,
        duration: 4000,
        actions: [viewCartAction],
      });
    } catch (err) {
      notifyError(err);
    } finally {
      setBusyId(null);
    }
  };

  // Sequential on purpose: every add returns the full cart, so parallel calls could race.
  const handleAddAll = async () => {
    setBulkBusy(true);
    let added = 0;
    let skipped = 0;
    try {
      for (const item of items) {
        const variant = getConditionVariants(item.product)[0];
        if (!variant.is_in_stock) {
          skipped += 1;
          continue;
        }
        await addItem(variant.product_id ?? item.product.id, 1);
        added += 1;
      }

      const addedText = `${added} item${added === 1 ? "" : "s"}`;
      if (added > 0 && skipped === 0) {
        showToast({
          type: "success",
          title: "Added to cart",
          message: `${addedText} from your wishlist ${added === 1 ? "was" : "were"} added to your cart.`,
          duration: 4000,
          actions: [viewCartAction],
        });
      } else if (added > 0) {
        showToast({
          type: "warning",
          title: "Some items were skipped",
          message: `${addedText} added to your cart. ${skipped} out-of-stock item${skipped === 1 ? " was" : "s were"} skipped.`,
          duration: 6000,
          actions: [viewCartAction],
        });
      } else {
        showToast({
          type: "warning",
          title: "Nothing to add",
          message: "None of the items in your wishlist are in stock right now.",
          duration: 5000,
        });
      }
    } catch (err) {
      notifyError(err);
    } finally {
      setBulkBusy(false);
    }
  };

  const handleClear = async () => {
    const current = itemsRef.current;
    if (!current.length) return;
    setBulkBusy(true);
    try {
      await Promise.all(current.map((i) => wishlistApi.removeFromWishlist(i.product.id)));
      showToast({
        type: "success",
        title: "Wishlist cleared",
        message: "All saved parts were removed.",
        duration: 4000,
      });
    } catch (err) {
      notifyError(err);
    } finally {
      await refresh();
      setBulkBusy(false);
    }
  };

  // Ask for confirmation with a toast instead of an inline prompt.
  const askToClear = () => {
    if (confirmToastRef.current) dismissToast(confirmToastRef.current);
    const count = items.length;
    confirmToastRef.current = showToast({
      type: "warning",
      title: "Clear your wishlist?",
      message: `This removes all ${count} saved ${count === 1 ? "part" : "parts"}. This can't be undone.`,
      persistent: true,
      actions: [
        { label: "Cancel", variant: "secondary" },
        { label: "Clear all", variant: "danger", onClick: handleClear },
      ],
    });
  };

  return (
    <div className="bg-white dark:bg-[#0B1320] transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <div className="mb-6 flex items-baseline gap-3">
          <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white sm:text-3xl">
            Wishlist
          </h1>
          {items.length > 0 && (
            <span className="text-sm text-[#7C7669] dark:text-[#9FA8B8]">
              {items.length} saved {items.length === 1 ? "part" : "parts"}
            </span>
          )}
        </div>

        {isLoading && (
          <div className="flex min-h-[30vh] items-center justify-center">
            <Spinner label="Loading wishlist" />
          </div>
        )}

        {!isLoading && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-[#0B1320] text-[#BF9A63]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.04 3 5.5l7 7Z" />
              </svg>
            </span>
            <h2 className="mt-4 text-lg font-semibold text-[#101B2C] dark:text-white">
              Nothing saved yet
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#7C7669] dark:text-[#9FA8B8]">
              Save parts you&apos;re considering so you can find them again later.
            </p>
            <Link
              to="/catalog"
              className="mt-6 inline-block rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77]"
            >
              Browse catalog
            </Link>
          </div>
        )}

        {items.length > 0 && (
          <>
            <div>
              {/* Header row */}
              <div
                className={`${hasDates ? HEAD_WITH_DATES : HEAD_NO_DATES} rounded-md bg-[#BF9A63]/15 px-4 py-3 text-sm font-semibold text-[#101B2C] dark:text-white`}
              >
                <span />
                <span>Product</span>
                <span>Price</span>
                {hasDates && <span>Date added</span>}
                <span>Stock status</span>
                <span />
              </div>

              <ul className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
                {items.map((item) => {
                  const product = item.product;
                  const variant = getConditionVariants(product)[0];
                  const stock = stockInfo(variant);
                  const busy = busyId === item.id || bulkBusy;
                  const outOfStock = !variant.is_in_stock;
                  const slug = variant.product_slug ?? product.slug;
                  const conditionLabel = CONDITION_LABELS[variant.condition];

                  return (
                    <li
                      key={item.id}
                      className={`${hasDates ? ROW_WITH_DATES : ROW_NO_DATES} px-0 py-5 transition-opacity md:px-4 ${busy ? "opacity-60" : ""}`}
                    >
                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item)}
                        disabled={busy}
                        aria-label={`Remove ${product.name} from wishlist`}
                        className="order-2 justify-self-end rounded-md p-2 text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#162235] hover:text-[#DC2626] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63] md:order-none md:justify-self-start"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>

                      {/* Product */}
                      <div className="order-1 flex min-w-0 items-center gap-4 md:order-none">
                        <WishlistImage product={product} />
                        <div className="min-w-0">
                          <Link
                            to={`/catalog/${slug}`}
                            className="block font-medium text-[#101B2C] dark:text-white transition-colors hover:text-[#BF9A63]"
                          >
                            {product.name}
                          </Link>
                          <div className="mt-0.5 text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                            {conditionLabel && <span>{conditionLabel}</span>}
                            {conditionLabel && variant.sku && <span> · </span>}
                            {variant.sku && <span className="font-mono">{variant.sku}</span>}
                          </div>
                          {/* Mobile meta (columns below are desktop-only) */}
                          <div className="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm md:hidden">
                            <span className="text-[#101B2C] dark:text-white">
                              <Price value={variant.price} size="sm" />
                            </span>
                            <span className={`font-medium ${stock.cls}`}>{stock.label}</span>
                          </div>
                        </div>
                      </div>

                      {/* Price */}
                      <div className="hidden text-[#101B2C] dark:text-white md:block">
                        <Price value={variant.price} size="sm" />
                      </div>

                      {/* Date added */}
                      {hasDates && (
                        <div className="hidden text-sm text-[#7C7669] dark:text-[#9FA8B8] md:block">
                          {formatDate(getAddedAt(item))}
                        </div>
                      )}

                      {/* Stock */}
                      <div className={`hidden text-sm font-medium md:block ${stock.cls}`}>
                        {stock.label}
                      </div>

                      {/* Add to cart */}
                      <button
                        type="button"
                        onClick={() => handleAddToCart(item)}
                        disabled={busy || outOfStock}
                        className="order-3 col-span-2 w-full rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-2.5 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77] disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B1320] md:order-none md:col-span-1"
                      >
                        {outOfStock ? "Unavailable" : "Add to cart"}
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Bulk actions */}
            <div className="mt-2 flex flex-wrap items-center justify-between gap-4 border-t border-[#E7E2D8] dark:border-[#25344D] pt-5">
              <button
                type="button"
                onClick={askToClear}
                disabled={bulkBusy}
                className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-5 py-2.5 text-sm font-medium text-[#101B2C] dark:text-white transition-colors hover:border-[#DC2626] hover:bg-red-50 hover:text-[#DC2626] dark:hover:border-red-400 dark:hover:bg-red-950/30 dark:hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63]"
              >
                Clear wishlist
              </button>

              <button
                type="button"
                onClick={handleAddAll}
                disabled={bulkBusy}
                className="rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77] disabled:opacity-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B1320]"
              >
                {bulkBusy ? "Working…" : "Add all to cart"}
              </button>
            </div>
          </>
        )}

        {/* Reassurance strip */}
        <div className="mt-10 grid gap-6 border-t border-[#E7E2D8] dark:border-[#25344D] pt-6 sm:grid-cols-3">
          {TRUST_ITEMS.map((t) => (
            <TrustItem key={t.title} {...t} />
          ))}
        </div>
      </div>
    </div>
  );
}