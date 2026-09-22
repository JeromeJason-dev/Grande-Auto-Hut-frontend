import { useMemo, useState } from "react";
import { Link, useParams, useSearchParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import * as catalogApi from "../../api/catalog";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import Price from "../../components/Price";
import StockBadge from "../../components/StockBadge";
import { useCart } from "../cart/CartContext";
import {
  CONDITION_LABELS,
  CONDITION_STYLES,
} from "../../constants/conditions";
import { getConditionVariants } from "../../utils/productVariants";
import { groupProductsByFamily } from "../../utils/groupProducts";
import { unwrapList } from "../../api/client";

export default function ProductDetailPage() {
  const { slug } = useParams();
  const [searchParams] = useSearchParams();
  const { addItem } = useCart();

  // TODO: this assumes your product list endpoint can filter by
  // family_slug once that field exists (see groupProducts.js and the
  // backend note below). Today, with no field yet, every product is its
  // own "family", so this effectively just filters by that one slug —
  // swap `family_slug` for whatever param name you land on.
  const { data, isLoading, isError } = useQuery({
    queryKey: ["product-family", slug],
    queryFn: () => catalogApi.listProducts({ family_slug: slug }),
  });

  const product = useMemo(() => {
    const families = groupProductsByFamily(unwrapList(data));
    return families[0] ?? null;
  }, [data]);

  const conditionVariants = useMemo(
    () => (product ? getConditionVariants(product) : []),
    [product]
  );

  // Deep-link support: ProductCard's "View details" link passes
  // ?condition=genuine|aftermarket|refurbished so the detail page opens
  // pre-selected to whichever state the shopper was already looking at.
  const preferredCondition = searchParams.get("condition");
  const [selectedCondition, setSelectedCondition] = useState(null);

  const activeVariant = useMemo(() => {
    if (!conditionVariants.length) return null;
    return (
      conditionVariants.find(
        (v) => v.condition === (selectedCondition ?? preferredCondition)
      ) ?? conditionVariants[0]
    );
  }, [conditionVariants, selectedCondition, preferredCondition]);

  if (isLoading) {
    return (
      <div className="flex justify-center py-20">
        <Spinner label="Loading part" />
      </div>
    );
  }

  if (isError || !product) {
    return (
      <div className="mx-auto max-w-3xl px-6 py-16">
        <EmptyState
          title="We couldn't find that part"
          body="It may have been removed, or the link is out of date."
        />
      </div>
    );
  }

  const isOutOfStock = !activeVariant?.is_in_stock;

  return (
    <div className="mx-auto max-w-5xl px-6 py-10">
      <Link
        to="/catalog"
        className="text-sm text-[#7C7669] transition-colors hover:text-[#101B2C]"
      >
        ← Back to catalog
      </Link>

      <div className="mt-4 grid gap-10 md:grid-cols-2">
        <div className="overflow-hidden rounded-lg border border-[#E7E2D8] bg-[#FAF7F2]">
          {product.primary_image ? (
            <img
              src={product.primary_image}
              alt={product.name}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex aspect-[4/3] items-center justify-center text-[#D8D2C4]">
              <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="3" y="3" width="18" height="18" rx="2" />
                <circle cx="8.5" cy="8.5" r="1.5" />
                <path d="m21 15-5-5L5 21" />
              </svg>
            </div>
          )}
        </div>

        <div>
          <span className="text-sm text-[#7C7669]">
            {product.brand} · {product.category}
          </span>
          <h1 className="mt-1 text-2xl font-semibold text-[#101B2C]">
            {product.name}
          </h1>
          {product.fitment && (
            <p className="mt-2 text-sm text-[#7C7669]">{product.fitment}</p>
          )}

          {/* Every available state, with its own SKU, price and stock */}
          <div className="mt-6 overflow-hidden rounded-lg border border-[#E7E2D8]">
            <div className="divide-y divide-[#E7E2D8]">
              {conditionVariants.map((v) => {
                const active = v.condition === activeVariant.condition;
                return (
                  <button
                    key={v.condition}
                    type="button"
                    onClick={() => setSelectedCondition(v.condition)}
                    aria-pressed={active}
                    className={`flex w-full items-center justify-between gap-4 px-4 py-3.5 text-left transition-colors ${
                      active ? "bg-[#FAF7F2]" : "hover:bg-[#FAF7F2]/60"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-semibold ${CONDITION_STYLES[v.condition]}`}
                      >
                        {CONDITION_LABELS[v.condition]}
                      </span>
                      <span className="font-mono text-xs text-[#7C7669]">
                        {v.sku}
                      </span>
                    </div>
                    <div className="flex items-center gap-3">
                      <Price value={v.price} />
                      <StockBadge
                        inStock={v.is_in_stock}
                        lowStock={v.is_low_stock}
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <button
            type="button"
            disabled={isOutOfStock}
            onClick={() =>
              addItem?.({
                ...product,
                condition: activeVariant.condition,
                sku: activeVariant.sku,
                price: activeVariant.price,
              })
            }
            className="mt-6 rounded-md bg-[#101B2C] px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] disabled:text-[#7C7669]"
          >
            {isOutOfStock
              ? "Out of stock"
              : `Add to cart — ${CONDITION_LABELS[activeVariant.condition]}`}
          </button>

          {product.description && (
            <p className="mt-8 text-sm leading-relaxed text-[#1E2430]">
              {product.description}
            </p>
          )}
        </div>
      </div>
    </div>
  );
}