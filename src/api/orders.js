import { api } from "./client";

export async function checkout(payload) {
  const { data } = await api.post("/orders/checkout/", payload);
  return data;
}

export async function listOrders(params = {}) {
  const { data } = await api.get("/orders/", { params });
  return data;
}

export async function getOrder(id) {
  const { data } = await api.get(`/orders/${id}/`);
  return data;
}

export async function updateOrderStatus(id, status, note = "") {
  const { data } = await api.patch(`/orders/${id}/status/`, { status, note });
  return data;
}

export async function updatePaymentStatus(id, paymentStatus, note = "") {
  const { data } = await api.patch(`/orders/${id}/payment-status/`, { payment_status: paymentStatus, note });
  return data;
}