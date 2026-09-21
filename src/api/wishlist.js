import { api } from "./client";

export async function getWishlist() {
  const { data } = await api.get("/wishlist/");
  return data;
}

export async function addToWishlist(productId) {
  const { data } = await api.post("/wishlist/items/", { product: productId });
  return data;
}

export async function removeFromWishlist(productId) {
  await api.delete(`/wishlist/items/${productId}/`);
}
