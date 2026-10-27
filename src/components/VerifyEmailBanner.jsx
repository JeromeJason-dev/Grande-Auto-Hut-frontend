import { useState } from "react";
import { useAuth } from "../features/auth/AuthContext";
import { resendVerification } from "../api/auth";
import { extractErrorMessage } from "../api/client";

/** Shown to signed-in customers who haven't confirmed their email yet (they can't check out until they do). */
export default function VerifyEmailBanner() {
  const { user, status } = useAuth();
  const [state, setState] = useState("idle"); // idle | sending | sent | error
  const [error, setError] = useState("");

  if (status !== "authenticated" || !user || user.is_email_verified || user.role !== "customer") return null;

  const resend = async () => {
    setState("sending");
    setError("");
    try {
      await resendVerification();
      setState("sent");
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't send the email. Please try again shortly."));
      setState("error");
    }
  };

  return (
    <div role="status" className="border-b border-amber-200 dark:border-amber-500/30 bg-amber-50 dark:bg-amber-500/10 px-4 py-2.5 text-sm text-amber-900 dark:text-amber-200">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-center gap-x-3 gap-y-1 text-center">
        <span>
          {state === "sent"
            ? `We've sent a new link to ${user.email}. Check your inbox and spam folder.`
            : `Please confirm your email (${user.email}) to place orders.`}
        </span>
        {state !== "sent" && (
          <button
            type="button"
            onClick={resend}
            disabled={state === "sending"}
            className="font-semibold underline underline-offset-2 disabled:opacity-60"
          >
            {state === "sending" ? "Sending…" : "Resend email"}
          </button>
        )}
        {state === "error" && <span className="text-red-700 dark:text-red-300">{error}</span>}
      </div>
    </div>
  );
}