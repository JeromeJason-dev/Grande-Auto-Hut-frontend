import { api } from "./client";

export async function initiateMpesa(orderId, phoneNumber) {
  const { data } = await api.post("/payments/mpesa/initiate/", { order_id: orderId, phone_number: phoneNumber });
  return data;
}

/** Starts a hosted card checkout. Resolves to { payment_url, payment } - redirect the browser to payment_url. */
export async function initiateCard(orderId) {
  const { data } = await api.post("/payments/card/initiate/", { order_id: orderId });
  return data;
}

export async function verifyCard(orderId, reference) {
  const { data } = await api.post("/payments/card/verify/", {
    order_id: orderId,
    ...(reference ? { reference } : {}),
  });
  return data;
}