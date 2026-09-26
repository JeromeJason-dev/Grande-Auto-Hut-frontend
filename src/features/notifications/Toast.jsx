import { useEffect, useRef, useState } from "react";

const DURATION_MS = 6000;

const TYPE_STYLES = {
  order: { badge: "bg-blue-500", icon: "📦" },
  support: { badge: "bg-[#BF9A63]", icon: "💬" },
  promo: { badge: "bg-emerald-500", icon: "🏷️" },
  default: { badge: "bg-[#101B2C] dark:bg-[#BF9A63]", icon: "🔔" },
};

export default function Toast({ notification, onDismiss, onClick }) {
  const [mounted, setMounted] = useState(false);
  const [leaving, setLeaving] = useState(false);
  const [paused, setPaused] = useState(false);
  const remainingRef = useRef(DURATION_MS);
  const startedAtRef = useRef(Date.now());
  const timeoutRef = useRef(null);

  const { badge, icon } = TYPE_STYLES[notification.type] || TYPE_STYLES.default;

  // Trigger the enter transition on the next frame.
  useEffect(() => {
    const raf = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const handleDismiss = () => {
    setLeaving(true);
    setTimeout(() => onDismiss(notification.toastId), 180);
  };

  // Auto-dismiss timer, pausable on hover.
  useEffect(() => {
    if (paused) {
      clearTimeout(timeoutRef.current);
      remainingRef.current -= Date.now() - startedAtRef.current;
      return;
    }
    startedAtRef.current = Date.now();
    timeoutRef.current = setTimeout(handleDismiss, Math.max(remainingRef.current, 0));
    return () => clearTimeout(timeoutRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [paused]);

  return (
    <div
      role="alert"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onClick={() => onClick(notification)}
      className={`pointer-events-auto w-80 max-w-[calc(100vw-2rem)] cursor-pointer overflow-hidden rounded-lg border border-[#E7E2D8] bg-white shadow-lg transition-all duration-200 ease-out dark:border-gray-800 dark:bg-gray-900 ${
        mounted && !leaving ? "translate-x-0 opacity-100" : "translate-x-4 opacity-0"
      }`}
    >
      <div className="flex gap-3 p-4">
        <span
          className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-xs text-white ${badge}`}
        >
          {icon}
        </span>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm font-semibold text-[#101B2C] dark:text-white">
            {notification.title || "New notification"}
          </p>
          {notification.message && (
            <p className="mt-0.5 line-clamp-2 text-sm text-[#7C7669] dark:text-gray-400">
              {notification.message}
            </p>
          )}
        </div>
        <button
          onClick={(e) => {
            e.stopPropagation();
            handleDismiss();
          }}
          aria-label="Dismiss notification"
          className="flex-shrink-0 text-[#7C7669] hover:text-[#101B2C] dark:text-gray-500 dark:hover:text-white"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M18 6 6 18M6 6l12 12" />
          </svg>
        </button>
      </div>
      <div className="h-0.5 w-full bg-[#F4F1EA] dark:bg-gray-800">
        <div
          className="h-full bg-[#BF9A63]"
          style={{
            animation: `toast-progress ${DURATION_MS}ms linear forwards`,
            animationPlayState: paused ? "paused" : "running",
          }}
        />
      </div>
    </div>
  );
}