import { api } from "./client";

export async function listProducts(params = {}) {
  const { data } = await api.get("/products/", { params });
  return data;
}

export async function getProduct(slug) {
  const { data } = await api.get(`/products/${slug}/`);
  return data;
}

async function fetchAll(url) {
  let results = [];
  let page = 1;
  // Backend paginates at 20 per page, so walk every page.
  while (true) {
    const { data } = await api.get(url, { params: { page } });
    if (Array.isArray(data)) return data;
    results = results.concat(data?.results ?? []);
    if (!data?.next) break;
    page += 1;
  }
  return results;
}

export async function listCategories() {
  return fetchAll("/categories/");
}

export async function listBrands() {
  return fetchAll("/brands/");
}