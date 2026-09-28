import { createContext, useCallback, useContext, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useNotifications } from "./Usenotifications";
import ToastContainer from "../notifications/ToastContainer";

const NotificationToastContext = createContext(null);

export function NotificationToastProvider({ children }) {
  const navigate = useNavigate();
  const { notifications, markRead } = useNotifications();
  const [toasts, setToasts] = useState([]);
  const seenIds = useRef(new Set());
  const isFirstLoad = useRef(true);

  useEffect(() => {
    if (!notifications.length) return;

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
        ...fresh.map((n) => ({ ...n, toastId: `${n.id}-${Date.now()}` })),
      ]);
    }

    notifications.forEach((n) => seenIds.current.add(n.id));
  }, [notifications]);

  const dismissToast = useCallback((toastId) => {
    setToasts((prev) => prev.filter((t) => t.toastId !== toastId));
  }, []);

  const handleToastClick = useCallback(
    (toast) => {
      dismissToast(toast.toastId);
      if (!toast.is_read) markRead(toast.id).catch(() => {});
      if (toast.link) navigate(toast.link);
    },
    [dismissToast, markRead, navigate]
  );

  return (
    <NotificationToastContext.Provider value={{ toasts }}>
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