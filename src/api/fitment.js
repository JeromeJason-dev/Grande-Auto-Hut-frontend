import { api } from "./client";

export async function listMakes() {
  const { data } = await api.get("/vehicles/makes/");
  return data;
}

export async function listModels(makeSlug) {
  const { data } = await api.get(`/vehicles/${makeSlug}/models/`);
  return data;
}

export async function listYears(makeSlug, modelSlug) {
  const { data } = await api.get(`/vehicles/${makeSlug}/${modelSlug}/years/`);
  return data;
}

export async function findFittingProducts({ make, model, year }) {
  const { data } = await api.get("/products/fitment/", { params: { make, model, year } });
  return data;
}
