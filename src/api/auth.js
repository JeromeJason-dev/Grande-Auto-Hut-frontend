import { api, setAccessToken } from "./client";

export async function login(email, password) {
  const { data } = await api.post("/auth/login/", { email, password });
  setAccessToken(data.access);
  return data;
}

export async function register(payload) {
  // RegisterView only creates the account - it doesn't issue tokens or set
  // the refresh cookie ("Please log in to get your token" in its response).
  // So a signup has to be followed by a real login to actually establish a
  // session; otherwise the new user looks logged out immediately after
  // registering.
  const { data } = await api.post("/auth/register/", payload);
  await login(payload.email, payload.password);
  return data;
}

export async function logout() {
  await api.post("/auth/logout/");
  setAccessToken(null);
}

export async function fetchMe() {
  const { data } = await api.get("/auth/me/");
  return data;
}

export async function updateMe(payload) {
  const { data } = await api.patch("/auth/me/", payload);
  return data;
}

export async function changePassword(payload) {
  const { data } = await api.post("/auth/change-password/", payload);
  return data;
}

export async function listAddresses() {
  const { data } = await api.get("/auth/addresses/");
  return data;
}

export async function createAddress(payload) {
  const { data } = await api.post("/auth/addresses/", payload);
  return data;
}

export async function deleteAddress(id) {
  await api.delete(`/auth/addresses/${id}/`);
}