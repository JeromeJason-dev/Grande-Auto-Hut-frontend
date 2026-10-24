import { api } from "./client";

export async function initiateMpesa(orderId, phoneNumber) {
  const { data } = await api.post("/payments/mpesa/initiate/", { order_id: orderId, phone_number: phoneNumber });
  return data;
}


export async function getMpesaStatus(orderId) {
  const { data } = await api.post("/payments/mpesa/status/", { order_id: orderId });
  return data;
}


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

export async function openCardPopup(accessCode) {
  if (!accessCode) throw new Error("Missing payment access code.");
  const { default: PaystackPop } = await import("@paystack/inline-js");
  return new Promise((resolve, reject) => {
    new PaystackPop().resumeTransaction(accessCode, {
      onSuccess: (tx) => resolve({ status: "success", reference: tx?.reference }),
      onCancel: () => resolve({ status: "cancelled" }),
      onError: (err) => reject(new Error(err?.message || "The card payment window could not load.")),
    });
  });
}


export async function getOrderPayments(orderId) {
  const { data } = await api.get(`/payments/orders/${orderId}/`);
  return data;
}

export async function recheckOrderPayment(orderId) {
  const { data } = await api.post(`/payments/orders/${orderId}/recheck/`);
  return data;
}

export async function markOrderPaid(orderId, { reason, reference = "" }) {
  const { data } = await api.post(`/payments/orders/${orderId}/mark-paid/`, { reason, reference });
  return data;
}

export async function refundOrderPayment(orderId, { reason, reference = "", paymentId }) {
  const { data } = await api.post(`/payments/orders/${orderId}/refund/`, {
    reason,
    reference,
    ...(paymentId ? { payment_id: paymentId } : {}),
  });
  return data;
}