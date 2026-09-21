import { api } from "./client";

export async function listProducts(params = {}) {
  const { data } = await api.get("/products/", { params });
  return data;
}

export async function getProduct(slug) {
  const { data } = await api.get(`/products/${slug}/`);
  return data;
}

export async function listCategories() {
  const { data } = await api.get("/categories/");
  return data;
}

export async function listBrands() {
  const { data } = await api.get("/brands/");
  return data;
}
