import { api } from "./client";

export async function listTickets() {
  const { data } = await api.get("/tickets/");
  return data;
}

export async function createTicket(payload) {
  const { data } = await api.post("/tickets/", payload);
  return data;
}

export async function getTicket(id) {
  const { data } = await api.get(`/tickets/${id}/`);
  return data;
}

export async function updateTicketStatus(id, status) {
  const { data } = await api.patch(`/tickets/${id}/`, { status });
  return data;
}

export async function replyToTicket(id, message) {
  const { data } = await api.post(`/tickets/${id}/messages/`, { message });
  return data;
}
