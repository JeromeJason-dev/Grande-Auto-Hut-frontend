import { api } from "./client";

export async function initiateMpesa(orderId, phoneNumber) {
  const { data } = await api.post("/payments/mpesa/initiate/", { order_id: orderId, phone_number: phoneNumber });
  return data;
}

/**
 * Starts a card payment. Resolves to { access_code, reference, payment_url, payment }.
 * Open the popup with access_code (see openCardPopup); payment_url is the redirect fallback.
 */
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