import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "../auth/AuthContext";
import * as notificationsApi from "../../api/notifications";
import { unwrapList } from "../../api/client";

export const NOTIFICATIONS_KEY = ["notifications"];
const POLL_INTERVAL_MS = 30_000;

export function useNotifications() {
  const { status } = useAuth();
  const queryClient = useQueryClient();

  const query = useQuery({
    queryKey: NOTIFICATIONS_KEY,
    queryFn: notificationsApi.listNotifications,
    enabled: status === "authenticated",
    refetchInterval: POLL_INTERVAL_MS,
    refetchOnWindowFocus: true,
  });

  const notifications = unwrapList(query.data);
  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_KEY });

  const markRead = async (id) => {
    // Optimistic update so the badge/toast react instantly, not on next poll.
    queryClient.setQueryData(NOTIFICATIONS_KEY, (old) => {
      const list = unwrapList(old);
      const updated = list.map((n) => (n.id === id ? { ...n, is_read: true } : n));
      return Array.isArray(old) ? updated : { ...old, results: updated };
    });
    try {
      await notificationsApi.markNotificationRead(id);
    } finally {
      invalidate();
    }
  };

  const markAllRead = async () => {
    queryClient.setQueryData(NOTIFICATIONS_KEY, (old) => {
      const list = unwrapList(old);
      const updated = list.map((n) => ({ ...n, is_read: true }));
      return Array.isArray(old) ? updated : { ...old, results: updated };
    });
    try {
      await notificationsApi.markAllNotificationsRead();
    } finally {
      invalidate();
    }
  };

  return { ...query, notifications, unreadCount, markRead, markAllRead };
}