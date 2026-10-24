import { api, setAccessToken } from "./client";
import { getGoogleIdToken } from "../api/firebase";

export async function login(email, password) {
  const { data } = await api.post("/auth/login/", { email, password });
  setAccessToken(data.access);
  return data;
}

export async function register(payload) {
  const { data } = await api.post("/auth/register/", payload);
  await login(payload.email, payload.password);
  return data;
}

/** Google sign-in via Firebase. Registers the user on first use, logs in after that. */
export async function loginWithGoogle() {
  const idToken = await getGoogleIdToken();
  const { data } = await api.post("/auth/google/", { id_token: idToken });
  setAccessToken(data.access);
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