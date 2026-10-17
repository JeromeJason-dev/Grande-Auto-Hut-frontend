import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "./CartContext";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";
import { extractErrorMessage } from "../../api/client";
import { getProductImage, getFallbackImage } from "../../utils";

// Shared column layout so the header row and every item row line up on desktop.
const HEAD_GRID =
  "hidden md:grid md:grid-cols-[minmax(0,1fr)_7rem_9.5rem_7.5rem_2.25rem] md:items-center md:gap-x-4";
const ROW_GRID =
  "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-x-4 gap-y-3 md:grid-cols-[minmax(0,1fr)_7rem_9.5rem_7.5rem_2.25rem] md:gap-y-0";

const unitPrice = (item) =>
  item.product?.price ?? Number(item.line_total) / Math.max(item.quantity, 1);

/* ---------- Small pieces ---------- */

function CartItemImage({ product }) {
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

function QuantityStepper({ value, onChange, disabled }) {
  const btn =
    "flex h-9 w-9 items-center justify-center text-[#101B2C] dark:text-white transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#162235] disabled:cursor-not-allowed disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-[#BF9A63]";
  return (
    <div className="inline-flex items-center overflow-hidden rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0B1320]">
      <button
        type="button"
        aria-label="Decrease quantity"
        disabled={disabled || value <= 1}
        onClick={() => onChange(value - 1)}
        className={btn}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M5 12h14" />
        </svg>
      </button>
      <span
        aria-live="polite"
        className="w-10 border-x border-[#E7E2D8] dark:border-[#25344D] text-center text-sm font-medium leading-9 tabular-nums text-[#101B2C] dark:text-white"
      >
        {value}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={disabled}
        onClick={() => onChange(value + 1)}
        className={btn}
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M12 5v14M5 12h14" />
        </svg>
      </button>
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
    title: "Genuine & aftermarket",
    body: "Quality parts for the Kenyan fleet",
    icon: (
      <>
        <path d="M21 8l-9-5-9 5v8l9 5 9-5V8Z" />
        <path d="M3 8l9 5 9-5M12 13v8" />
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
];

/* ---------- Page ---------- */

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const [busyId, setBusyId] = useState(null);

  if (loading && !cart)
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-white dark:bg-[#0B1320]">
        <Spinner label="Loading your cart" />
      </div>
    );

  const items = cart?.items || [];
  const totalUnits = items.reduce((sum, i) => sum + i.quantity, 0);

  const run = async (itemId, action) => {
    setError("");
    setBusyId(itemId);
    try {
      await action();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setBusyId(null);
    }
  };

  const handleQtyChange = (itemId, quantity) => {
    if (quantity < 1) return;
    run(itemId, () => updateItem(itemId, quantity));
  };

  const handleRemove = (itemId) => run(itemId, () => removeItem(itemId));

  return (
    <div className="bg-white dark:bg-[#0B1320] transition-colors">
      <div className="mx-auto max-w-6xl px-4 py-6 sm:px-6 sm:py-8">
        <h1 className="mb-6 text-2xl font-semibold text-[#101B2C] dark:text-white sm:text-3xl">
          Your cart
        </h1>

        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {items.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] px-6 py-16 text-center">
            <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-white dark:bg-[#0B1320] text-[#BF9A63]">
              <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="9" cy="21" r="1" />
                <circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
            </span>
            <h2 className="mt-4 text-lg font-semibold text-[#101B2C] dark:text-white">
              Your cart is empty
            </h2>
            <p className="mx-auto mt-2 max-w-md text-sm text-[#7C7669] dark:text-[#9FA8B8]">
              Use the Fitment Finder to find parts confirmed for your vehicle, or browse the full catalog.
            </p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link
                to="/catalog"
                className="rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77]"
              >
                Browse catalog
              </Link>
              <Link
                to="/fitment"
                className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-5 py-2.5 text-sm font-medium text-[#101B2C] dark:text-white transition-colors hover:bg-white dark:hover:bg-[#0B1320]"
              >
                Fitment Finder
              </Link>
            </div>
          </div>
        ) : (
          <>
            {/* Items table */}
            <div>
              <div className={`${HEAD_GRID} border-b border-[#E7E2D8] dark:border-[#25344D] pb-3 text-sm font-semibold text-[#101B2C] dark:text-white`}>
                <span>Product</span>
                <span>Price</span>
                <span>Quantity</span>
                <span className="text-right">Subtotal</span>
                <span />
              </div>

              <ul className="divide-y divide-[#E7E2D8] dark:divide-[#25344D]">
                {items.map((item) => {
                  const busy = busyId === item.id;
                  return (
                    <li
                      key={item.id}
                      className={`${ROW_GRID} py-5 transition-opacity ${busy ? "opacity-60" : ""}`}
                    >
                      {/* Product */}
                      <div className="order-1 flex min-w-0 items-center gap-4 md:order-none">
                        <CartItemImage product={item.product} />
                        <div className="min-w-0">
                          <Link
                            to={`/catalog/${item.product.slug}`}
                            className="block font-medium text-[#101B2C] dark:text-white transition-colors hover:text-[#BF9A63]"
                          >
                            {item.product.name}
                          </Link>
                          <div className="mt-0.5 font-mono text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                            {item.product.sku}
                          </div>
                          <div className="mt-1 text-sm text-[#7C7669] dark:text-[#9FA8B8] md:hidden">
                            <Price value={unitPrice(item)} size="sm" /> each
                          </div>
                        </div>
                      </div>

                      {/* Unit price (desktop) */}
                      <div className="hidden text-[#101B2C] dark:text-white md:order-none md:block">
                        <Price value={unitPrice(item)} size="sm" />
                      </div>

                      {/* Quantity */}
                      <div className="order-3 md:order-none">
                        <QuantityStepper
                          value={item.quantity}
                          disabled={busy}
                          onChange={(q) => handleQtyChange(item.id, q)}
                        />
                      </div>

                      {/* Line total */}
                      <div className="order-4 text-right font-medium text-[#101B2C] dark:text-white md:order-none">
                        <Price value={item.line_total} size="sm" />
                      </div>

                      {/* Remove */}
                      <button
                        type="button"
                        onClick={() => handleRemove(item.id)}
                        disabled={busy}
                        aria-label={`Remove ${item.product.name}`}
                        className="order-2 justify-self-end rounded-md p-2 text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#162235] hover:text-[#DC2626] disabled:opacity-40 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63] md:order-none"
                      >
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                          <path d="M18 6 6 18M6 6l12 12" />
                        </svg>
                      </button>
                    </li>
                  );
                })}
              </ul>
            </div>

            {/* Help + summary */}
            <div className="mt-6 grid gap-6 border-t border-[#E7E2D8] dark:border-[#25344D] pt-6 md:grid-cols-2">
              <div className="order-2 md:order-1">
                <h2 className="text-sm font-semibold text-[#101B2C] dark:text-white">
                  Not sure a part fits?
                </h2>
                <p className="mt-1.5 max-w-sm text-sm text-[#7C7669] dark:text-[#9FA8B8]">
                  Check your vehicle in the Fitment Finder before you pay, or add more parts from the catalog.
                </p>
                <Link
                  to="/fitment"
                  className="mt-3 inline-block rounded-md border border-[#E7E2D8] dark:border-[#25344D] px-4 py-2 text-sm font-medium text-[#101B2C] dark:text-white transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#162235]"
                >
                  Open Fitment Finder
                </Link>
              </div>

              <div className="order-1 md:order-2 md:ml-auto md:w-full md:max-w-sm">
                <dl className="space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <dt className="text-[#7C7669] dark:text-[#9FA8B8]">
                      Subtotal ({totalUnits} {totalUnits === 1 ? "item" : "items"})
                    </dt>
                    <dd className="text-[#101B2C] dark:text-white">
                      <Price value={cart.subtotal} size="sm" />
                    </dd>
                  </div>
                  <div className="flex items-center justify-between border-t border-[#E7E2D8] dark:border-[#25344D] pt-4">
                    <dt className="font-semibold text-[#101B2C] dark:text-white">Total</dt>
                    <dd className="text-[#101B2C] dark:text-white">
                      <Price value={cart.subtotal} size="lg" />
                    </dd>
                  </div>
                </dl>

                <button
                  type="button"
                  onClick={() => navigate("/checkout")}
                  className="mt-5 w-full rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-3 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63] focus-visible:ring-offset-2 dark:focus-visible:ring-offset-[#0B1320]"
                >
                  Proceed to checkout
                </button>
                <Link
                  to="/catalog"
                  className="mt-3 block text-center text-sm font-medium text-[#101B2C] dark:text-white transition-colors hover:text-[#BF9A63]"
                >
                  Continue shopping
                </Link>
              </div>
            </div>
          </>
        )}

        {/* Reassurance strip */}
        <div className="mt-8 grid gap-6 border-t border-[#E7E2D8] dark:border-[#25344D] pt-6 sm:grid-cols-3">
          {TRUST_ITEMS.map((t) => (
            <TrustItem key={t.title} {...t} />
          ))}
        </div>
      </div>
    </div>
  );
}