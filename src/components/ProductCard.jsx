import { useMemo, useState, useEffect } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../features/auth/AuthContext";
import Price from "./Price";
import StockBadge from "./StockBadge";
import {
  CONDITION_STYLES,
  CONDITION_LABELS,
  CONDITION_PILL_INACTIVE,
} from "../api/conditions";
import { getConditionVariants } from "../api/productVariants";
import { addToWishlist, removeFromWishlist } from "../api/wishlist";
import { getProductImage, getFallbackImage } from "../utils";

export default function ProductCard({ 
  product, 
  onAddToCart, 
  isWishlisted = false, 
  onToggleWishlist = () => {},
  showFooterActions = true,
}) {
  const { slug, name, brand, category } = product;
  const fallbackImage = getFallbackImage(product);
  // Remember which URL failed to load; derive the image to show from that.
  const [failedSrc, setFailedSrc] = useState(null);
  const preferredSrc = getProductImage(product);
  const imageSrc =
    failedSrc && failedSrc === preferredSrc
      ? preferredSrc !== fallbackImage
        ? fallbackImage
        : null
      : preferredSrc;
  const navigate = useNavigate();
  const location = useLocation();
  const { status } = useAuth();
  const queryClient = useQueryClient();
  const [isAdding, setIsAdding] = useState(false);
  const [isTogglingWishlist, setIsTogglingWishlist] = useState(false);

  const [wishlisted, setWishlisted] = useState(isWishlisted);

  useEffect(() => {
    setWishlisted(isWishlisted);
  }, [isWishlisted]);

  const conditionVariants = useMemo(
    () => getConditionVariants(product),
    [product]
  );

  const [selectedCondition, setSelectedCondition] = useState(
    conditionVariants[0]?.condition
  );

  const activeVariant =
    conditionVariants.find((v) => v.condition === selectedCondition) ??
    conditionVariants[0];

  const conditionStyle =
    CONDITION_STYLES[activeVariant.condition] ?? CONDITION_STYLES.genuine;
  const conditionLabel =
    CONDITION_LABELS[activeVariant.condition] ?? "Genuine";
  const isOutOfStock = !activeVariant.is_in_stock;
  const hasMultipleConditions = conditionVariants.length > 1;

  const handleAddToCart = async () => {
    if (!onAddToCart || isAdding) return;

    // Guests must log in before adding to cart
    if (status !== "authenticated") {
      if (status === "anonymous") {
        navigate("/login", {
          state: { from: location.pathname + location.search },
        });
      }
      // If auth is still loading, do nothing rather than redirect a logged-in user
      return;
    }

    if (!activeVariant.product_id) {
      console.error("Missing product_id on active variant — cannot add to cart", activeVariant);
      return;
    }

    setIsAdding(true);
    try {
      await onAddToCart({
        id: activeVariant.product_id,
        slug: activeVariant.product_slug ?? slug,
        name,
        brand,
        category,
        condition: activeVariant.condition,
        sku: activeVariant.sku,
        price: activeVariant.price,
        is_in_stock: activeVariant.is_in_stock,
        is_low_stock: activeVariant.is_low_stock,
      });
      navigate("/cart");
    } catch (err) {
      console.error("Failed to add item to cart:", err);
    } finally {
      setIsAdding(false);
    }
  };

  const handleWishlistClick = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (isTogglingWishlist) return;

    const productId = activeVariant.product_id;
    if (!productId) {
      console.error("Missing product_id on active variant — cannot update wishlist", activeVariant);
      return;
    }

    const nextWishlisted = !wishlisted;
    setIsTogglingWishlist(true);
    setWishlisted(nextWishlisted);

    try {
      if (nextWishlisted) {
        await addToWishlist(productId);
      } else {
        await removeFromWishlist(productId);
      }
      await queryClient.invalidateQueries({ queryKey: ["wishlist"] });
      await onToggleWishlist(product);
    } catch (err) {
      console.error("Failed to update wishlist:", err);
      setWishlisted(!nextWishlisted);
    } finally {
      setIsTogglingWishlist(false);
    }
  };

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] text-[#1E2430] dark:text-slate-100 transition-all duration-200 hover:-translate-y-1 hover:border-[#BF9A63]/60 hover:shadow-[0_16px_32px_rgba(16,27,44,0.1)] dark:hover:shadow-[0_16px_32px_rgba(0,0,0,0.5)]">
      <Link to={`/catalog/${slug}`} className="contents">
        <div className="relative aspect-square overflow-hidden bg-white dark:bg-[#0B121F]">
          {imageSrc ? (
            <img
              src={imageSrc}
              alt={name}
              loading="lazy"
              onError={() => setFailedSrc(imageSrc)}
              className="h-full w-full object-contain p-4 transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#D8D2C4] dark:text-white/20">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}

          <span className="absolute left-2 top-2 rounded border border-[#E7E2D8] dark:border-white/10 bg-white/95 dark:bg-[#101B2C]/95 px-2 py-0.5 font-mono text-[11px] text-[#7C7669] dark:text-slate-300">
            {activeVariant.sku}
          </span>

          <div className="absolute right-2 top-2 flex items-center">
            <span className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${conditionStyle}`}>
              {conditionLabel}
            </span>
          </div>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 dark:bg-black/75 backdrop-blur-[1px]">
              <span className="rounded-md bg-[#101B2C] dark:bg-[#101B2C] px-3 py-1 text-xs font-semibold text-white border border-[#BF9A63]/30">
                Out of stock
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <span className="text-[13px] text-[#7C7669] dark:text-slate-400">
            {brand} · {category}
          </span>
          <strong className="line-clamp-2 min-h-[2.75rem] leading-snug text-[#101B2C] dark:text-white group-hover:text-[#BF9A63] transition-colors">{name}</strong>

          <div className="mt-auto flex items-center justify-between pt-2">
            <Price value={activeVariant.price} />
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleWishlistClick}
                disabled={isTogglingWishlist}
                aria-label={wishlisted ? "Remove from wishlist" : "Add to wishlist"}
                aria-pressed={wishlisted}
                className={`flex h-7 w-7 items-center justify-center rounded-full border border-[#E7E2D8] dark:border-white/10 bg-white/95 dark:bg-[#101B2C]/95 backdrop-blur-sm transition-colors hover:scale-105 ${
                  wishlisted
                    ? "text-red-500 hover:text-red-600"
                    : "text-[#7C7669] dark:text-slate-300 hover:text-[#BF9A63]"
                }`}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill={wishlisted ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" />
                </svg>
              </button>
              <StockBadge
                inStock={activeVariant.is_in_stock}
                lowStock={activeVariant.is_low_stock}
              />
            </div>
          </div>
        </div>
      </Link>

      {hasMultipleConditions && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#E7E2D8] dark:border-white/10 px-3 py-3">
          {conditionVariants.map((v) => (
            <button
              key={v.condition}
              type="button"
              onClick={() => setSelectedCondition(v.condition)}
              aria-pressed={v.condition === selectedCondition}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                v.condition === selectedCondition
                  ? CONDITION_STYLES[v.condition]
                  : CONDITION_PILL_INACTIVE + " dark:bg-white/5 dark:text-slate-300 dark:hover:bg-white/10 dark:hover:border-[#BF9A63]/30"
              }`}
            >
              {CONDITION_LABELS[v.condition]}
            </button>
          ))}
        </div>
      )}

      {/* Actions */}
      {showFooterActions && (
        <div className="flex items-center gap-2 border-t border-[#E7E2D8] dark:border-white/10 p-3">
          <Link
            to={`/catalog/${slug}?condition=${activeVariant.condition}`}
            className="flex-1 rounded-md border border-[#E7E2D8] dark:border-white/20 px-3 py-2 text-center text-sm font-medium text-[#101B2C] dark:text-slate-200 transition-colors hover:border-[#BF9A63] hover:text-[#BF9A63] dark:hover:border-[#BF9A63] dark:hover:text-[#BF9A63]"
          >
            View details
          </Link>
          <button
            type="button"
            disabled={isOutOfStock || isAdding}
            onClick={handleAddToCart}
            className="flex-1 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-3 py-2 text-sm font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] dark:disabled:bg-white/10 disabled:text-[#7C7669] dark:disabled:text-slate-500"
          >
            {isAdding ? "Adding…" : "Add to cart"}
          </button>
        </div>
      )}
    </div>
  );
}