import { useEffect, useRef, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { verifyEmail } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import { useAuth } from "./AuthContext";
import { cardClasses, linkClasses, pageClasses, primaryButton } from "./authStyles";

export default function VerifyEmailPage() {
  const [params] = useSearchParams();
  const token = params.get("token") || "";
  const { status: authStatus, refreshUser } = useAuth();
  const [state, setState] = useState(token ? "working" : "invalid"); // working | ok | invalid
  const [message, setMessage] = useState("");
  const started = useRef(false);

  useEffect(() => {
    if (!token || started.current) return;
    started.current = true; // the link is single-purpose; don't call twice under StrictMode
    (async () => {
      try {
        await verifyEmail(token);
        setState("ok");
        // If they're signed in on this device, update the banner/checkout gate right away.
        try { await refreshUser(); } catch { /* not signed in: nothing to refresh */ }
      } catch (err) {
        setMessage(extractErrorMessage(err, "This verification link is invalid or has expired."));
        setState("invalid");
      }
    })();
  }, [token, refreshUser]);

  return (
    <div className={pageClasses}>
      <div className="w-full max-w-[540px]">
        <div className={`${cardClasses} text-center`}>
          {state === "working" && (
            <p role="status" className="text-base text-[#7C7669] dark:text-slate-400">Confirming your email…</p>
          )}
          {state === "ok" && (
            <div role="status">
              <h1 className="text-3xl font-semibold text-[#101B2C] dark:text-white">Email confirmed</h1>
              <p className="mt-3 text-base text-[#7C7669] dark:text-slate-400">
                Thank you! You can now place orders.
              </p>
              <Link to={authStatus === "authenticated" ? "/catalog" : "/login"} className={`${primaryButton} inline-block`}>
                {authStatus === "authenticated" ? "Continue shopping" : "Log in"}
              </Link>
            </div>
          )}
          {state === "invalid" && (
            <div role="alert">
              <h1 className="text-3xl font-semibold text-[#101B2C] dark:text-white">Link not valid</h1>
              <p className="mt-3 text-base text-[#7C7669] dark:text-slate-400">
                {message || "This verification link is incomplete or has expired."} Log in and use the
                “Resend email” button at the top of the page to get a fresh one.
              </p>
              <Link to="/login" className={`mt-6 inline-block ${linkClasses}`}>Go to log in</Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}