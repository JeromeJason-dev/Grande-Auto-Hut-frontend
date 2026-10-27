import { useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { confirmPasswordReset } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";
import { cardClasses, inputClasses, labelClasses, linkClasses, pageClasses, primaryButton } from "./authStyles";

export default function ResetPasswordPage() {
  const [params] = useSearchParams();
  const uid = params.get("uid") || "";
  const token = params.get("token") || "";
  const linkIsComplete = Boolean(uid && token);

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (password !== confirm) {
      setError("The two passwords don't match.");
      return;
    }
    setSubmitting(true);
    try {
      await confirmPasswordReset({ uid, token, new_password: password });
      setDone(true);
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't reset your password. The link may have expired."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={pageClasses}>
      <div className="w-full max-w-[540px]">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold text-[#101B2C] dark:text-white">Choose a new password</h1>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className={cardClasses}>
          {done ? (
            <div role="status" className="text-center">
              <h2 className="text-xl font-semibold text-[#101B2C] dark:text-white">Password updated</h2>
              <p className="mt-3 text-base text-[#7C7669] dark:text-slate-400">
                You&apos;ve been signed out everywhere for safety. Log in with your new password.
              </p>
              <Link to="/login" className={`${primaryButton} inline-block text-center`}>Go to log in</Link>
            </div>
          ) : !linkIsComplete ? (
            <div className="text-center">
              <p className="text-base text-[#7C7669] dark:text-slate-400">
                This reset link is incomplete. Please use the link from your email, or request a new one.
              </p>
              <Link to="/forgot-password" className={`${primaryButton} inline-block text-center`}>Request a new link</Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="new-password" className={labelClasses}>New password</label>
              <input
                id="new-password"
                type="password"
                required
                minLength={8}
                autoComplete="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className={inputClasses}
              />
              <p className="mt-2 text-sm text-[#7C7669] dark:text-slate-400">
                At least 8 characters; avoid common or all-numeric passwords.
              </p>

              <label htmlFor="confirm-password" className={`${labelClasses} mt-5`}>Confirm new password</label>
              <input
                id="confirm-password"
                type="password"
                required
                autoComplete="new-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                className={inputClasses}
              />
              <button type="submit" disabled={submitting} className={primaryButton}>
                {submitting ? "Saving…" : "Set new password"}
              </button>
              <p className="mt-4 text-center text-sm text-[#7C7669] dark:text-slate-400">
                Link expired?{" "}
                <Link to="/forgot-password" className={linkClasses}>Request a new one</Link>
              </p>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}