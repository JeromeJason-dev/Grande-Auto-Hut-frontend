import { api } from "./client";

export async function listReviews(productId) {
  const { data } = await api.get(`/products/${productId}/reviews/`);
  return data;
}

export async function createReview(productId, payload) {
  const { data } = await api.post(`/products/${productId}/reviews/`, payload);
  return data;
}
