import { api } from "./client";

export async function initiateMpesa(orderId, phoneNumber) {
  const { data } = await api.post("/payments/mpesa/initiate/", { order_id: orderId, phone_number: phoneNumber });
  return data;
}
