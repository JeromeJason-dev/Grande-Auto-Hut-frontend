import { api } from "./client";

export async function getAdminMetrics() {
  const { data } = await api.get("/admin/metrics/");
  return data;
}

export async function createProduct(payload) {
  const { data } = await api.post("/products/", payload);
  return data;
}

export async function updateProduct(slug, payload) {
  const { data } = await api.patch(`/products/${slug}/`, payload);
  return data;
}

export async function restock(productId, quantity, note = "") {
  const { data } = await api.post("/inventory/restock/", { product: productId, quantity, note });
  return data;
}
