import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { extractErrorMessage } from "../../api/client";
import { isFirebaseConfigured } from "../../api/firebase";

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 48 48" aria-hidden="true">
      <path fill="#EA4335" d="M24 9.5c3.5 0 6.6 1.2 9.1 3.6l6.8-6.8C35.8 2.4 30.3 0 24 0 14.6 0 6.5 5.4 2.6 13.2l7.9 6.1C12.4 13.5 17.7 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.5 24.5c0-1.6-.1-3.1-.4-4.5H24v9h12.7c-.6 3-2.3 5.5-4.8 7.2l7.5 5.8c4.4-4.1 7.1-10.1 7.1-17.5z" />
      <path fill="#FBBC05" d="M10.5 28.7a14.5 14.5 0 010-9.4l-7.9-6.1a24 24 0 000 21.6l7.9-6.1z" />
      <path fill="#34A853" d="M24 48c6.5 0 11.9-2.1 15.9-5.8l-7.5-5.8c-2.1 1.4-4.9 2.3-8.4 2.3-6.3 0-11.6-4-13.5-9.8l-7.9 6.1C6.5 42.6 14.6 48 24 48z" />
    </svg>
  );
}

export default function GoogleButton({ onError, label = "Continue with Google" }) {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [busy, setBusy] = useState(false);

  const handleClick = async () => {
    onError?.("");
    setBusy(true);
    try {
      const user = await loginWithGoogle();
      const isAdmin = user?.is_staff || user?.is_superuser || user?.role === "admin";
      const defaultRedirect = user?.role === "staff" ? "/staff" : isAdmin ? "/admin" : "/";
      const isBackOffice = user?.role === "staff" || isAdmin;
      const from = location.state?.from?.pathname;
      navigate(!isBackOffice && from ? from : defaultRedirect, { replace: true });
    } catch (err) {
      // Closing the popup isn't an error worth showing.
      const code = err?.code;
      if (code === "auth/popup-closed-by-user" || code === "auth/cancelled-popup-request") return;
      onError?.(
        code === "auth/popup-blocked"
          ? "Your browser blocked the Google popup. Please allow popups and try again."
          : extractErrorMessage(err, "Couldn't sign in with Google.")
      );
    } finally {
      setBusy(false);
    }
  };

  if (!isFirebaseConfigured) return null;

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={busy}
      className="flex w-full items-center justify-center gap-3 rounded-md border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] px-4 py-3 text-base font-medium text-[#101B2C] dark:text-slate-100 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#16243A] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <GoogleIcon />
      {busy ? "Waiting for Google…" : label}
    </button>
  );
}

export function OrDivider() {
  if (!isFirebaseConfigured) return null;
  return (
    <div className="my-6 flex items-center gap-4 text-sm text-[#7C7669] dark:text-slate-400">
      <span className="h-px flex-1 bg-[#E7E2D8] dark:bg-white/10" />
      or
      <span className="h-px flex-1 bg-[#E7E2D8] dark:bg-white/10" />
    </div>
  );
}