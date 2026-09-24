/**
 * Groups flat product rows from the API into "product families" — one
 * card per physical part, with each condition (genuine/aftermarket/
 * refurbished) collapsed into that family's `variants` array.
 *
 * This assumes each product row carries a `family_slug` field shared
 * across its variant rows (see the backend note below). Rows without a
 * `family_slug` are treated as their own single-variant family, so this
 * is safe to run even before every product has been assigned one.
 */
export function groupProductsByFamily(products) {
  const families = new Map();

  for (const p of products) {
    const key = p.family_slug ?? `standalone:${p.id}`;

    if (!families.has(key)) {
      families.set(key, {
        id: key,
        // Prefer an explicit family slug/name once your backend has one;
        // fall back to this variant's own slug/name until then.
        slug: p.family_slug ?? p.slug,
        name: p.family_name ?? p.name,
        brand: p.brand,
        category: p.category,
        primary_image: p.primary_image,
        fitment: p.fitment,
        description: p.description,
        variants: [],
      });
    }

    families.get(key).variants.push({
      condition: p.condition,
      sku: p.sku,
      price: p.price,
      is_in_stock: p.is_in_stock,
      is_low_stock: p.is_low_stock,
      // keep the original row's own id/slug so the detail page can still
      // look up this exact variant if you're not on a family endpoint yet
      product_id: p.id,
      product_slug: p.slug,
    });
  }

  return Array.from(families.values());
}