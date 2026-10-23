import { api } from "./client";

/**
 * Customers get their own tickets; staff can pass the folder/filter params the
 * admin ticket list uses: { view, status, priority, category, assignee, q, page, page_size }.
 */
export async function listTickets(params) {
  const { data } = await api.get("/tickets/", { params });
  return data;
}

/** Counts behind the admin folder tabs (staff only). */
export async function getTicketStats() {
  const { data } = await api.get("/tickets/stats/");
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
  return updateTicket(id, { status });
}

/**
 * Staff only. Any of: status, priority, category, assigned_to (user id or null),
 * is_archived, is_spam, is_unread.
 */
export async function updateTicket(id, changes) {
  const { data } = await api.patch(`/tickets/${id}/`, changes);
  return data;
}

export async function deleteTicket(id) {
  await api.delete(`/tickets/${id}/`);
}

/** Send a reply. Pass `files` (File[]) to attach documents/images. */
export async function replyToTicket(id, message, files = []) {
  if (!files.length) {
    const { data } = await api.post(`/tickets/${id}/messages/`, { message });
    return data;
  }
  const body = new FormData();
  body.append("message", message);
  files.forEach((file) => body.append("attachments", file));
  const { data } = await api.post(`/tickets/${id}/messages/`, body);
  return data;
}

/**
 * Attachments are private, so they're fetched with the auth header and handed to the
 * browser as a download (a plain <a href> couldn't send the token).
 */
export async function downloadAttachment(ticketId, attachment) {
  const { data } = await api.get(`/tickets/${ticketId}/attachments/${attachment.id}/`, {
    responseType: "blob",
  });
  const url = URL.createObjectURL(data);
  const link = document.createElement("a");
  link.href = url;
  link.download = attachment.filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  setTimeout(() => URL.revokeObjectURL(url), 10_000);
}