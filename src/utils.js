export { cn } from "cn"

import { api } from "./api/client";

export function getFallbackImage() {
  return null;
}

function resolveUrl(src) {
  if (!src || typeof src !== "string") return null;
  // Cloudinary pictures are already full https:// URLs and are used as-is.
  if (/^(https?:)?\/\//i.test(src) || /^(data|blob):/i.test(src)) return src;
  try {
    const base = api?.defaults?.baseURL || "";
    const origin = new URL(base, window.location.origin).origin;
    return `${origin}${src.startsWith("/") ? "" : "/"}${src}`;
  } catch {
    return src;
  }
}

// Accepts a string URL or an object such as { image: "..." } / { url: "..." }.
function pickSrc(value) {
  if (!value) return null;
  if (typeof value === "string") return value;
  return value.image || value.url || value.src || null;
}

function getBackendImage(product) {
  if (!product) return null;

  const images = Array.isArray(product.images) ? product.images : [];
  const primaryFromList = images.find((img) => img?.is_primary) ?? images[0];

  const raw =
    pickSrc(product.primary_image) ||
    pickSrc(product.image) ||
    pickSrc(product.thumbnail) ||
    pickSrc(product.image_url) ||
    pickSrc(primaryFromList);

  return resolveUrl(raw);
}

export function getProductImage(product) {
  return getBackendImage(product);
}