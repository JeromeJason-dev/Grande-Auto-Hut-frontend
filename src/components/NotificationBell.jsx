import { Link } from "react-router-dom";
import { useNotifications } from "../features/notifications/Usenotifications";

export default function NotificationBell() {
  const { unreadCount } = useNotifications();

  return (
    <Link
      to="/notifications"
      aria-label="Notifications"
      className="relative text-[#101B2C] dark:text-gray-200 hover:text-gray-700 dark:hover:text-white"
    >
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
        <path d="M18 8a6 6 0 0 0-12 0c0 7-3 9-3 9h18s-3-2-3-9" />
        <path d="M13.73 21a2 2 0 0 1-3.46 0" />
      </svg>
      {unreadCount > 0 && (
        <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-white dark:border-gray-900 bg-[#DC2626] px-1 text-[10px] font-bold leading-none text-white">
          {unreadCount > 9 ? "9+" : unreadCount}
        </span>
      )}
    </Link>
  );
}