import { useState } from "react";
import { Link } from "react-router-dom";
import { requestPasswordReset } from "../../api/auth";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";
import { cardClasses, inputClasses, labelClasses, linkClasses, pageClasses, primaryButton } from "/src/api/authstyles.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await requestPasswordReset(email.trim());
      setSent(true);
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't send the reset email. Please try again."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className={pageClasses}>
      <div className="w-full max-w-[540px]">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-semibold text-[#101B2C] dark:text-white">Forgot your password?</h1>
          <p className="mt-2 text-base text-[#7C7669] dark:text-slate-400">
            Enter your email and we&apos;ll send you a link to choose a new one.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className={cardClasses}>
          {sent ? (
            <div role="status" className="text-center">
              <h2 className="text-xl font-semibold text-[#101B2C] dark:text-white">Check your email</h2>
              <p className="mt-3 text-base text-[#7C7669] dark:text-slate-400">
                If an account exists for <span className="font-medium">{email}</span>, a reset link is on its way.
                It expires in one hour. Don&apos;t see it? Check your spam folder.
              </p>
              <button
                type="button"
                onClick={() => setSent(false)}
                className="mt-6 text-base font-medium text-[#101B2C] dark:text-white underline underline-offset-2"
              >
                Use a different email
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              <label htmlFor="email" className={labelClasses}>Email</label>
              <input
                id="email"
                type="email"
                required
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={inputClasses}
              />
              <button type="submit" disabled={submitting} className={primaryButton}>
                {submitting ? "Sending…" : "Send reset link"}
              </button>
            </form>
          )}
        </div>

        <p className="mt-6 text-center text-base text-[#7C7669] dark:text-slate-400">
          Remembered it?{" "}
          <Link to="/login" className={linkClasses}>Back to log in</Link>
        </p>
      </div>
    </div>
  );
}