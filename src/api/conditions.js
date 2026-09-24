// Shared across ProductCard and ProductDetailPage so both agree on
// ordering, labels and colors for a product's condition variants.

export const CONDITION_ORDER = ["genuine", "aftermarket", "refurbished"];

export const CONDITION_LABELS = {
  genuine: "Genuine",
  aftermarket: "Aftermarket",
  refurbished: "Refurbished",
};

export const CONDITION_STYLES = {
  genuine: "bg-[#101B2C] text-white",
  aftermarket: "bg-[#EDE7DC] text-[#101B2C]",
  refurbished: "bg-[#BF9A63]/15 text-[#A9834E]",
};

export const CONDITION_PILL_INACTIVE =
  "bg-[#FAF7F2] text-[#7C7669] hover:bg-[#EDE7DC]";