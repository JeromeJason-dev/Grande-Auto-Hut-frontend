export { cn } from "cn"

import { api } from "./api/client";


export const RADIATOR_IMAGE = "/Aluminium_Radiator.png";
export const CLUTCH_KIT_IMAGE = "/Clutch_Kit.png";

function getCategoryName(product) {
  return typeof product?.category === "string"
    ? product.category
    : product?.category?.name;
}

const LOCAL_IMAGE_RULES = [
  { pattern: /radiator/i, image: RADIATOR_IMAGE, useCategory: true },
  { pattern: /clutch[\s_-]*kit/i, image: CLUTCH_KIT_IMAGE, useCategory: false },
];

export function getFallbackImage(product) {
  if (!product) return null;
  const nameAndSlug = [product.name, product.slug].filter(Boolean).join(" ");
  const withCategory = [nameAndSlug, getCategoryName(product)]
    .filter(Boolean)
    .join(" ");

  for (const rule of LOCAL_IMAGE_RULES) {
    const haystack = rule.useCategory ? withCategory : nameAndSlug;
    if (rule.pattern.test(haystack)) return rule.image;
  }
  return null;
}

function resolveUrl(src) {
  if (!src || typeof src !== "string") return null;
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
  return getBackendImage(product) || getFallbackImage(product);
}