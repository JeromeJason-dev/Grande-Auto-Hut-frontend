import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "./AuthContext";
import { extractErrorMessage } from "../../api/client";
import ErrorAlert from "../../components/ErrorAlert";

const EMPTY = {
  email: "", username: "", first_name: "", last_name: "", phone_number: "",
  password: "", password_confirm: "",
};

const inputClasses =
  "w-full rounded-md border border-[#E7E2D8] bg-white px-3.5 py-2.5 text-sm text-[#1E2430] placeholder:text-[#B9B2A3] transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25";

const labelClasses = "mb-1.5 block text-sm font-medium text-[#101B2C]";

export default function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const set = (key) => (e) => setForm({ ...form, [key]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await register(form);
      navigate("/", { replace: true });
    } catch (err) {
      setError(extractErrorMessage(err, "Couldn't create your account."));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-full items-center justify-center bg-[#FAF7F2] px-6 py-16">
      <div className="w-full max-w-[460px]">
        <div className="mb-6 text-center">
          <h1 className="text-2xl font-semibold text-[#101B2C]">
            Create an account
          </h1>
          <p className="mt-1.5 text-sm text-[#7C7669]">
            Set up your fleet account to track orders and fitment history.
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label htmlFor="first_name" className={labelClasses}>
                First name
              </label>
              <input
                id="first_name"
                required
                value={form.first_name}
                onChange={set("first_name")}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="last_name" className={labelClasses}>
                Last name
              </label>
              <input
                id="last_name"
                required
                value={form.last_name}
                onChange={set("last_name")}
                className={inputClasses}
              />
            </div>
          </div>

          <div className="mt-4">
            <label htmlFor="username" className={labelClasses}>
              Username
            </label>
            <input
              id="username"
              required
              value={form.username}
              onChange={set("username")}
              className={inputClasses}
            />
          </div>

          <div className="mt-4">
            <label htmlFor="email" className={labelClasses}>
              Email
            </label>
            <input
              id="email"
              type="email"
              required
              value={form.email}
              onChange={set("email")}
              className={inputClasses}
            />
          </div>

          <div className="mt-4">
            <label htmlFor="phone_number" className={labelClasses}>
              Phone number
            </label>
            <input
              id="phone_number"
              placeholder="0712345678"
              value={form.phone_number}
              onChange={set("phone_number")}
              className={inputClasses}
            />
          </div>

          <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label htmlFor="password" className={labelClasses}>
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={form.password}
                onChange={set("password")}
                className={inputClasses}
              />
            </div>
            <div>
              <label htmlFor="password_confirm" className={labelClasses}>
                Confirm password
              </label>
              <input
                id="password_confirm"
                type="password"
                required
                value={form.password_confirm}
                onChange={set("password_confirm")}
                className={inputClasses}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={submitting}
            className="mt-6 w-full rounded-md bg-[#101B2C] px-4 py-2.5 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46] disabled:cursor-not-allowed disabled:bg-[#7C7669]"
          >
            {submitting ? "Creating account…" : "Create account"}
          </button>
        </form>

        <p className="mt-5 text-center text-sm text-[#7C7669]">
          Already have an account?{" "}
          <Link
            to="/login"
            className="font-medium text-[#101B2C] transition-colors hover:text-[#A9834E]"
          >
            Log in
          </Link>
        </p>
      </div>
    </div>
  );
}