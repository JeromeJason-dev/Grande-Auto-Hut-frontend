import { api } from "./client";

export async function listNotifications() {
  const { data } = await api.get("/notifications/");
  return data;
}

export async function markNotificationRead(id) {
  const { data } = await api.patch(`/notifications/${id}/read/`);
  return data;
}

export async function markAllNotificationsRead() {
  const { data } = await api.patch("/notifications/read-all/");
  return data;
}
