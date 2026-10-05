import { Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import { useCart } from "./CartContext";
import Price from "../../components/Price";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import { extractErrorMessage } from "../../api/client";
import { getProductImage, getFallbackImage } from "../../utils";

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
    <div className="h-16 w-16 flex-shrink-0 overflow-hidden rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0B1320]">
      {src ? (
        <img
          src={src}
          alt={product?.name || ""}
          loading="lazy"
          onError={() => setFailedSrc(src)}
          className="h-full w-full object-contain p-1"
        />
      ) : (
        <div className="flex h-full items-center justify-center text-[#D8D2C4] dark:text-white/20">
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" />
            <circle cx="8.5" cy="8.5" r="1.5" />
            <path d="m21 15-5-5L5 21" />
          </svg>
        </div>
      )}
    </div>
  );
}

export default function CartPage() {
  const { cart, loading, updateItem, removeItem } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState("");

  if (loading && !cart)
    return (
      <div className="flex min-h-[50vh] items-center justify-center bg-white dark:bg-[#0B1320]">
        <Spinner label="Loading your cart" />
      </div>
    );

  const items = cart?.items || [];

  const handleQtyChange = async (itemId, quantity) => {
    if (quantity < 1) return;
    setError("");
    try {
      await updateItem(itemId, quantity);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleRemove = async (itemId) => {
    setError("");
    try {
      await removeItem(itemId);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="min-h-full bg-white dark:bg-[#0B1320] px-6 py-10 transition-colors">
      <div className="mx-auto max-w-3xl">
        <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">Your cart</h1>

        {error && (
          <div className="mt-4">
            <ErrorAlert message={error} />
          </div>
        )}

        {items.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] px-6 py-16">
            <EmptyState
              title="Your cart is empty"
              body="Use the Fitment Finder to find parts confirmed for your vehicle, or browse the full catalog."
              action={
                <Link
                  to="/catalog"
                  className="mt-3 inline-block rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-2 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77]"
                >
                  Browse catalog
                </Link>
              }
            />
          </div>
        ) : (
          <>
            <div className="mt-8 flex flex-col gap-3">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex items-center gap-4 rounded-lg border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] p-4"
                >
                  <CartItemImage product={item.product} />

                  <div className="min-w-0 flex-1">
                    <Link
                      to={`/catalog/${item.product.slug}`}
                      className="font-medium text-[#101B2C] dark:text-white transition-colors hover:text-[#BF9A63]"
                    >
                      {item.product.name}
                    </Link>
                    <div className="mt-0.5 font-mono text-xs text-[#7C7669] dark:text-[#9FA8B8]">
                      {item.product.sku}
                    </div>
                  </div>

                  <input
                    type="number"
                    min={1}
                    value={item.quantity}
                    onChange={(e) => handleQtyChange(item.id, Number(e.target.value))}
                    className="w-16 rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0B1320] px-2 py-1.5 text-center text-sm text-[#101B2C] dark:text-white transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25"
                  />

                  <div className="w-24 text-right text-[#101B2C] dark:text-white">
                    <Price value={item.line_total} />
                  </div>

                  <button
                    onClick={() => handleRemove(item.id)}
                    aria-label="Remove item"
                    className="rounded-md p-2 text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-white dark:hover:bg-[#0B1320] hover:text-[#101B2C] dark:hover:text-white"
                  >
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                      <path d="M3 6h18" />
                      <path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" />
                      <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                      <path d="M10 11v6" />
                      <path d="M14 11v6" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>

            <div className="mt-6 flex items-center justify-between rounded-lg border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] p-5">
              <span className="text-sm font-medium text-[#7C7669] dark:text-[#9FA8B8]">Subtotal</span>
              <Price value={cart.subtotal} size="lg" />
            </div>

            <button
              onClick={() => navigate("/checkout")}
              className="mt-4 w-full rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-3 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77]"
            >
              Proceed to checkout
            </button>
          </>
        )}
      </div>
    </div>
  );
}