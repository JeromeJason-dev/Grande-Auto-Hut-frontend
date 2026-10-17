import Toast from "./Toast";

export default function ToastContainer({ toasts, onDismiss, onToastClick }) {
  if (!toasts.length) return null;

  return (
    <>
      <style>{`
        @keyframes toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
      <div
        aria-live="polite"
        className="pointer-events-none fixed right-4 top-20 z-50 flex flex-col gap-3"
      >
        {toasts.map((toast) => (
          <Toast key={toast.toastId} notification={toast} onDismiss={onDismiss} onClick={onToastClick} />
        ))}
      </div>
    </>
  );
}