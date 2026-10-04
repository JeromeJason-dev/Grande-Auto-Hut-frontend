export { cn } from "cn"


// Local fallback pictures, served from /public.
export const RADIATOR_IMAGE = "/Aluminium_Radiator.jpg";

function isRadiator(product) {
  const category =
    typeof product?.category === "string"
      ? product.category
      : product?.category?.name;
  return /radiator/i.test(
    [product?.name, product?.slug, category].filter(Boolean).join(" ")
  );
}

export function getFallbackImage(product) {
  return isRadiator(product) ? RADIATOR_IMAGE : null;
}

/** Backend picture first, then the local fallback. */
export function getProductImage(product) {
  return product?.primary_image || getFallbackImage(product);
}