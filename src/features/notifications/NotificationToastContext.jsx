import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQueryClient } from "@tanstack/react-query";
import { useNotifications } from "./Usenotifications";
import { unwrapList } from "../../api/client";
import ToastContainer from "./ToastContainer";

const NotificationToastContext = createContext(null);

// Support alerts for the team: keep them up a little longer than the default,
// and refresh the ticket queue / dashboard counts behind them.
const TICKET_ALERT_TYPES = new Set(["new_ticket", "ticket_message", "ticket_assigned"]);
const TICKET_ALERT_DURATION_MS = 10_000;

export function NotificationToastProvider({ children }) {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { notifications, markRead, isSuccess, refetch } = useNotifications();
  const [toasts, setToasts] = useState([]);
  const seenIds = useRef(new Set());
  const isFirstLoad = useRef(true);
  const localCounter = useRef(0);

  useEffect(() => {
    // Wait for the first successful fetch. Checking the list length here used to
    // swallow a user's very first notification (an empty first load never "seeded").
    if (!isSuccess) return;

    if (isFirstLoad.current) {
      notifications.forEach((n) => seenIds.current.add(n.id));
      isFirstLoad.current = false;
      return;
    }

    const fresh = notifications.filter(
      (n) => !n.is_read && !seenIds.current.has(n.id)
    );

    if (fresh.length) {
      setToasts((prev) => [
        ...prev,
        ...fresh.map((n) => ({
          ...n,
          toastId: `${n.id}-${Date.now()}`,
          ...(TICKET_ALERT_TYPES.has(n.notification_type) ? { duration: TICKET_ALERT_DURATION_MS } : {}),
        })),
      ]);

      if (fresh.some((n) => TICKET_ALERT_TYPES.has(n.notification_type))) {
        queryClient.invalidateQueries({ queryKey: ["admin-tickets"] });
        queryClient.invalidateQueries({ queryKey: ["tickets"] });
        queryClient.invalidateQueries({ queryKey: ["ticket"] });
        queryClient.invalidateQueries({ queryKey: ["admin-metrics"] });
      }

      // A newly assigned task changes workloads on the Staff page.
      if (fresh.some((n) => n.notification_type === "task_assigned")) {
        queryClient.invalidateQueries({ queryKey: ["admin-tasks"] });
        queryClient.invalidateQueries({ queryKey: ["admin-staff"] });
      }
    }

    notifications.forEach((n) => seenIds.current.add(n.id));
  }, [notifications, isSuccess, queryClient]);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  /**
   * Show a local (client-side) toast. Returns its toastId so callers can dismiss it.
   * Options: { type, title, message, duration, persistent, actions }
   * type: "success" | "warning" | "order" | "support" | "promo" | default
   * actions: [{ label, onClick, variant: "primary" | "danger" | "secondary" }]
   */
  const showToast = useCallback((options) => {
    localCounter.current += 1;
    const toastId = `local-${localCounter.current}-${Date.now()}`;
    setToasts((prev) => [...prev, { ...options, toastId, local: true }]);
    return toastId;
  }, []);

  /**
   * Refetch notifications right away (e.g. after placing an order) so the bell
   * updates immediately. Anything fetched here is marked as seen, so a caller that
   * already showed its own toast doesn't get a duplicate one from the server.
   */
  const refreshNotificationsQuietly = useCallback(async () => {
    try {
      const result = await refetch();
      unwrapList(result?.data).forEach((n) => seenIds.current.add(n.id));
    } catch {
      // The regular 30s poll will catch up.
    }
  }, [refetch]);

  const handleToastClick = useCallback(
    (toast) => {
      dismissToast(toast.toastId);
      if (toast.id && !toast.is_read) markRead(toast.id).catch(() => {});
      if (toast.link) navigate(toast.link);
    },
    [dismissToast, markRead, navigate]
  );

  const value = useMemo(
    () => ({ toasts, showToast, dismissToast, refreshNotificationsQuietly }),
    [toasts, showToast, dismissToast, refreshNotificationsQuietly]
  );

  return (
    <NotificationToastContext.Provider value={value}>
      {children}
      <ToastContainer
        toasts={toasts}
        onDismiss={dismissToast}
        onToastClick={handleToastClick}
      />
    </NotificationToastContext.Provider>
  );
}

export function useNotificationToastContext() {
  return useContext(NotificationToastContext);
}