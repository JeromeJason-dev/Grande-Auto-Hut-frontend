import { CONDITION_ORDER } from "../api/conditions";

/**
 * Normalizes a product into an ordered list of condition variants.
 *
 * Each variant carries `product_id` / `product_slug` — the REAL backend
 * Product UUID for that specific condition row (genuine/aftermarket/
 * refurbished are separate Product rows on the backend, not one row
 * with a condition field the API can switch). Anything that adds to
 * cart or links to a detail page must use `product_id`/`product_slug`
 * from the active variant, never the parent family's `id`/`slug`.
 */
export function getConditionVariants(product) {
  const {
    variants,
    condition = "genuine",
    sku,
    price,
    is_in_stock,
    is_low_stock,
    id,
    slug,
  } = product;

  if (variants?.length) {
    // Family-grouped shape (see groupProductsByFamily): each variant
    // object already carries its own product_id/product_slug.
    return CONDITION_ORDER.filter((c) =>
      variants.some((v) => v.condition === c)
    ).map((c) => variants.find((v) => v.condition === c));
  }

  // Flat/standalone product shape — this IS the real product row, so
  // its own id/slug are the correct ones to carry forward.
  return [
    {
      condition,
      sku,
      price,
      is_in_stock,
      is_low_stock,
      product_id: id,
      product_slug: slug,
    },
  ];
}