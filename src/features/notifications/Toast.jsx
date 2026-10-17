import { useEffect, useRef, useState } from "react";

const DEFAULT_DURATION_MS = 6000;

// Keys cover both local toast types and the backend's notification_type values.
const TYPE_STYLES = {
  order: { badge: "bg-blue-500", icon: "📦" },
  order_update: { badge: "bg-blue-500", icon: "📦" },
  support: { badge: "bg-[#BF9A63]", icon: "💬" },
  ticket_reply: { badge: "bg-[#BF9A63]", icon: "💬" },
  account: { badge: "bg-purple-500", icon: "👤" },
  promo: { badge: "bg-emerald-500", icon: "🏷️" },
  success: { badge: "bg-emerald-500", icon: "✓" },
  warning: { badge: "bg-amber-500", icon: "!" },
  default: { badge: "bg-[#101B2C] dark:bg-[#BF9A63]", icon: "🔔" },
};

const ACTION_STYLES = {
  primary:
    "bg-[#101B2C] text-white hover:bg-[#1B2C46] dark:bg-[#BF9A63] dark:text-[#0B1320] dark:hover:bg-[#D4AF77]",
  danger: "bg-[#DC2626] text-white hover:bg-[#B91C1C]",
  secondary:
    "border border-[#E7E2D8] text-[#101B2C] hover:bg-[#FAF7F2] dark:border-[#25344D] dark:text-white dark:hover:bg-[#162235]",
};

/**
 * Renders either a server notification or a local toast created with showToast().
 * Local toasts may set:
 *   persistent: true     -> stays until dismissed (no timer / progress bar)
 *   duration: <ms>       -> custom auto-dismiss time
 *   actions: [{ label, onClick, variant: "primary" | "danger" | "secondary" }]
 */
export default function Toast({ notification, onDismiss, onClick }) {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);

  const persistent = Boolean(notification.persistent);
  const duration = notification.duration ?? DEFAULT_DURATION_MS;
  const actions = notification.actions || [];

  const remainingRef = useRef(duration);
  const startedAtRef = useRef(0); // set when the timer starts
  const timeoutRef = useRef(null);

  const typeKey = notification.type || notification.notification_type;
  const { badge, icon } = TYPE_STYLES[typeKey] || TYPE_STYLES.default;

  // Trigger the enter transition on the next frame.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(notification.toastId), 180);
  };

  // Auto-dismiss timer, pausable on hover. Persistent toasts never auto-dismiss.
  useEffect(() => {
    if (persistent) return;
    if (paused) {
      clearTimeout(timeoutRef.current);
      remainingRef.current -= Date.now() - startedAtRef.current;
      return;
    }
    startedAtRef.current = Date.now();
    timeoutRef.current = setTimeout(handleDismiss, Math.max(remainingRef.current, 0));
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused, persistent]);

  const clickable = !notification.local;

  return (
    <div
      role="alert"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => clickable && onClick(notification)}
      className={`pointer-events-auto w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-[#E7E2D8] bg-white shadow-lg transition-all duration-200 ease-out dark:border-gray-800 dark:bg-gray-900 ${
        clickable ? "cursor-pointer" : "cursor-default"
      } ${mounted && !leaving ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"}`}
    >
      <div className="flex gap-3 p-4">
        <span
          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white ${badge}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-[#101B2C] dark:text-white">
            {notification.title || "New notification"}
          </p>
          {notification.message && (
            <p className="mt-0.5 line-clamp-3 text-sm text-[#7C7669] dark:text-gray-400">
              {notification.message}
            </p>
          )}

          {actions.length > 0 && (
            <div className="mt-3 flex gap-2">
              {actions.map((action) => (
                <button
                  key={action.label}
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDismiss();
                    action.onClick?.();
                  }}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63] ${
                    ACTION_STYLES[action.variant] || ACTION_STYLES.secondary
                  }`}
                >
                  {action.label}
                </button>
              ))}
            </div>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          aria-label="Dismiss notification"
          className="h-5 flex-shrink-0 text-[#7C7669] hover:text-[#101B2C] dark:text-gray-500 dark:hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>

      {!persistent && (
        <div className="h-0.5 w-full bg-[#F4F1EA] dark:bg-gray-800">
          <div
            className="h-full bg-[#BF9A63]"
            style={{
              animation: `toast-progress ${duration}ms linear forwards`,
              animationPlayState: paused ? "paused" : "running",
            }}
          />
        </div>
      )}
    </div>
  );
}