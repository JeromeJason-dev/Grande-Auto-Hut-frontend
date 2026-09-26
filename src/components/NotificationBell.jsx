import { Link } from "react-router-dom";
import { useNotifications } from "../features/notifications/Usenotifications";

export default function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Link to="/notifications" aria-label="Notifications" style={{ position: "relative", color: "var(--ink)" }}>
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span
          className="mono"
          style={{
            position: "absolute",
            top: -6,
            right: -8,
            minWidth: 16,
            height: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "#DC2626",
            color: "#fff",
            border: "1.5px solid #fff",
            borderRadius: "999px",
            fontSize: "0.65rem",
            fontWeight: 700,
            padding: "0 4px",
            lineHeight: 1,
          }}
        >
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}