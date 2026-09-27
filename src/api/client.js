import axios from "axios";

export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || "http://localhost:8000/api";

// Access token lives in memory only (never localStorage) - the refresh token
// is an httpOnly cookie the browser sends automatically, so a page reload
// re-derives a fresh access token via /auth/refresh/ rather than persisting
// the access token itself anywhere JS-readable.
let accessToken = null;
let onAuthLost = () => {};

export function setAccessToken(token) {
  accessToken = token;
}

export function getAccessToken() {
  return accessToken;
}

/** Registered by AuthProvider so the client can react (e.g. redirect to login) when refresh fails. */
export function setOnAuthLost(handler) {
  onAuthLost = handler;
}

export const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true, // sends the httpOnly refresh cookie
});

api.interceptors.request.use((config) => {
  if (accessToken) {
    config.headers.Authorization = `Bearer ${accessToken}`;
  }
  return config;
});

let refreshPromise = null;

async function refreshAccessToken() {
  if (!refreshPromise) {
    refreshPromise = axios
      .post(`${API_BASE_URL}/auth/refresh/`, {}, { withCredentials: true })
      .then((res) => {
        setAccessToken(res.data.access);
        return res.data.access;
      })
      .finally(() => {
        refreshPromise = null;
      });
  }
  return refreshPromise;
}

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = original?.url?.includes("/auth/login") || original?.url?.includes("/auth/refresh");

    // original can be undefined for errors axios raises before a config
    // exists (e.g. a cancelled request) - guard with optional chaining so
    // those just reject cleanly instead of throwing here.
    if (error.response?.status === 401 && !original?._retry && !isAuthEndpoint) {
      original._retry = true;
      try {
        const newToken = await refreshAccessToken();
        original.headers.Authorization = `Bearer ${newToken}`;
        return api(original);
      } catch (refreshError) {
        setAccessToken(null);
        onAuthLost();
        return Promise.reject(refreshError);
      }
    }
    return Promise.reject(error);
  }
);

/** Pulls DRF's error shape into a single readable string for toasts/alerts. */
/** Every DRF ListAPIView here is paginated ({count, next, previous, results}) -
 * use this everywhere a list is consumed so pages don't have to know that. */
export function unwrapList(data) {
  return data?.results ?? (Array.isArray(data) ? data : []);
}

export function extractErrorMessage(error, fallback = "Something went wrong. Please try again.") {
  const data = error?.response?.data;
  if (!data) return error?.message || fallback;
  if (typeof data === "string") return data;
  if (data.detail) return data.detail;
  const firstKey = Object.keys(data)[0];
  if (firstKey) {
    const value = data[firstKey];
    const text = Array.isArray(value) ? value[0] : value;
    return firstKey === "non_field_errors" || firstKey === "detail" ? text : `${firstKey}: ${text}`;
  }
  return fallback;
}