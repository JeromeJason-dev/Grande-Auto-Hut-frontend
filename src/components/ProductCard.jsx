import { useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Price from "./Price";
import StockBadge from "./StockBadge";
import {
  CONDITION_STYLES,
  CONDITION_LABELS,
  CONDITION_PILL_INACTIVE,
} from "../api/conditions";
import { getConditionVariants } from "../api/productVariants";

export default function ProductCard({ product, onAddToCart }) {
  const { slug, name, brand, category, primary_image } = product;
  const navigate = useNavigate();
  const [isAdding, setIsAdding] = useState(false);

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

  return (
    <div className="group flex flex-col overflow-hidden rounded-lg border border-[#E7E2D8] bg-white text-[#1E2430] transition-all duration-200 hover:-translate-y-1 hover:border-[#BF9A63]/40 hover:shadow-[0_16px_32px_rgba(16,27,44,0.1)]">
      <Link to={`/catalog/${slug}`} className="contents">
        <div className="relative aspect-[4/3] bg-[#FAF7F2]">
          {primary_image ? (
            <img
              src={primary_image}
              alt={name}
              className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center text-[#D8D2C4]">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}

          <span className="absolute left-2 top-2 rounded border border-[#E7E2D8] bg-white/95 px-2 py-0.5 font-mono text-[11px] text-[#7C7669]">
            {activeVariant.sku}
          </span>

          {/* Active condition badge */}
          <span
            className={`absolute right-2 top-2 rounded-full px-2.5 py-1 text-[11px] font-semibold ${conditionStyle}`}
          >
            {conditionLabel}
          </span>

          {isOutOfStock && (
            <div className="absolute inset-0 flex items-center justify-center bg-white/60 backdrop-blur-[1px]">
              <span className="rounded-md bg-[#101B2C] px-3 py-1 text-xs font-semibold text-white">
                Out of stock
              </span>
            </div>
          )}
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <span className="text-[13px] text-[#7C7669]">
            {brand} · {category}
          </span>
          <strong className="leading-snug text-[#101B2C]">{name}</strong>

          <div className="mt-auto flex items-center justify-between pt-2">
            <Price value={activeVariant.price} />
            <StockBadge
              inStock={activeVariant.is_in_stock}
              lowStock={activeVariant.is_low_stock}
            />
          </div>
        </div>
      </Link>

      {/* Condition switcher — only shown when more than one state is available */}
      {hasMultipleConditions && (
        <div className="flex flex-wrap gap-1.5 border-t border-[#E7E2D8] px-3 pt-3">
          {conditionVariants.map((v) => (
            <button
              key={v.condition}
              type="button"
              onClick={() => setSelectedCondition(v.condition)}
              aria-pressed={v.condition === selectedCondition}
              className={`rounded-full px-2.5 py-1 text-[11px] font-semibold transition-colors ${
                v.condition === selectedCondition
                  ? CONDITION_STYLES[v.condition]
                  : CONDITION_PILL_INACTIVE
              }`}
            >
              {CONDITION_LABELS[v.condition]}
            </button>
          ))}
        </div>
      )}

      {/* Actions — kept outside the Link so the button isn't a nested interactive element */}
      <div className="flex items-center gap-2 border-t border-[#E7E2D8] p-3">
        <Link
          to={`/catalog/${slug}?condition=${activeVariant.condition}`}
          className="flex-1 rounded-md border border-[#E7E2D8] px-3 py-2 text-center text-sm font-medium text-[#101B2C] transition-colors hover:border-[#BF9A63] hover:text-[#A9834E]"
        >
          View details
        </Link>
        <button
          type="button"
          disabled={isOutOfStock || isAdding}
          onClick={handleAddToCart}
          className="flex-1 rounded-md bg-[#101B2C] px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] disabled:text-[#7C7669]"
        >
          {isAdding ? "Adding…" : "Add to cart"}
        </button>
      </div>
    </div>
  );
}