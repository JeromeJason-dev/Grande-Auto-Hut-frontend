import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";

const inputClasses =
  "w-full rounded-md border border-[#E7E2D8] bg-white px-3.5 py-2.5 text-sm text-[#1E2430] placeholder:text-[#B9B2A3] transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25";

const labelClasses = "mb-1.5 block text-sm font-medium text-[#101B2C]";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await login(form.email, form.password);
      navigate(location.state?.from?.pathname || "/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't log in with those details."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-[#FAF7F2] px-6 py-16">
      <div className="w-full max-w-[420px]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[#101B2C]">Log in</h1>
          <p className="mt-1.5 text-sm text-[#7C7669]">
            Welcome back — pick up where you left off.
          </p>
        </div>

        {error && (
          <div className="mb-4">
            <ErrorAlert message={error} />
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-xl border border-[#E7E2D8] bg-white p-6 shadow-[0_1px_2px_rgba(16,27,44,0.04)] sm:p-8"
        >
          <div>
            <label htmlFor="email" className={labelClasses}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              className={inputClasses}
            />
          </div>

          <div className="mt-4">
            <label htmlFor="password" className={labelClasses}>
              Password
            </label>
            <input
              id="password"
              type="password"
              required
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              className={inputClasses}
            />
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-md bg-[#101B2C] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46] disabled:cursor-not-allowed disabled:bg-[#7C7669]"
          >
            {submitting ? "Logging in…" : "Log in"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#7C7669]">
          New here?{" "}
          <Link
            to="/register"
            className="font-medium text-[#101B2C] transition-colors hover:text-[#A9834E]"
          >
            Create an account
          </Link>
        </p>
      </div>
    </div>
  );
}