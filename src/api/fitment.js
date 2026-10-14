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

// Admin creation endpoints
export async function createMake(payload) {
  const { data } = await api.post("/vehicles/makes/", payload);
  return data;
}

export async function createModel(makeSlug, payload) {
  const { data } = await api.post(`/vehicles/${makeSlug}/models/`, payload);
  return data;
}

export async function createYear(makeSlug, modelSlug, payload) {
  const { data } = await api.post(`/vehicles/${makeSlug}/${modelSlug}/years/`, payload);
  return data;
}

// Admin edit / delete endpoints
export async function updateMake(id, payload) {
  const { data } = await api.patch(`/vehicles/makes/${id}/`, payload);
  return data;
}

export async function deleteMake(id) {
  const { data } = await api.delete(`/vehicles/makes/${id}/`);
  return data;
}

export async function updateModel(id, payload) {
  const { data } = await api.patch(`/vehicles/models/${id}/`, payload);
  return data;
}

export async function deleteModel(id) {
  const { data } = await api.delete(`/vehicles/models/${id}/`);
  return data;
}

export async function updateYear(id, payload) {
  const { data } = await api.patch(`/vehicles/years/${id}/`, payload);
  return data;
}

export async function deleteYear(id) {
  const { data } = await api.delete(`/vehicles/years/${id}/`);
  return data;
}