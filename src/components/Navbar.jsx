import { Link, NavLink, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useCart } from "../features/cart/CartContext";
import NotificationBell from "./NotificationBell";

function WrenchMark() {
  return (
    <svg width="22" height="22" viewBox="0 0 32 32" aria-hidden="true">
      <path
        fill="#BF9A63"
        d="M28.6 8.2 22 14.8l-4.8-4.8 6.6-6.6a9 9 0 0 0-11.4 11.4L2 25.2 6.8 30l10.4-10.4a9 9 0 0 0 11.4-11.4Z"
      />
    </svg>
  );
}

const navLinkClasses = ({ isActive }) =>
  `text-sm font-medium transition-colors ${
    isActive ? "text-[#101B2C]" : "text-[#7C7669] hover:text-[#101B2C]"
  }`;

export default function Navbar() {
  const { user, status, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E2D8] bg-white/95 backdrop-blur">
      <div className="mx-auto grid h-16 max-w-6xl grid-cols-[auto_1fr_auto] items-center gap-6 px-6">
        <Link to="/" className="flex flex-shrink-0 items-center gap-2">
          <WrenchMark />
          <span className="text-[1.05rem] font-bold tracking-tight text-[#101B2C]">
            Grande Auto Hut
          </span>
        </Link>

        <nav className="flex items-center justify-center gap-6 justify-self-center">
          <NavLink to="/catalog" className={navLinkClasses}>Catalog</NavLink>
          <NavLink to="/fitment" className={navLinkClasses}>Fitment Finder</NavLink>
          <NavLink to="/" className={navLinkClasses}>About</NavLink>
          <NavLink to="/" className={navLinkClasses}>Contact</NavLink>
          {status === "authenticated" && (
            <NavLink to="/orders" className={navLinkClasses}>My Orders</NavLink>
          )}
          {status === "authenticated" && (
            <NavLink to="/support" className={navLinkClasses}>Support</NavLink>
          )}
          {user?.role !== "customer" && status === "authenticated" && (
            <NavLink to="/admin" className={navLinkClasses}>Admin</NavLink>
          )}
        </nav>

        <div className="flex flex-shrink-0 items-center justify-self-end gap-4">
          {status === "authenticated" && <NotificationBell />}

          <Link to="/cart" className="relative text-[#101B2C]" aria-label="Cart">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
              <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
              <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
            </svg>
            {itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full bg-[#BF9A63] px-1 text-[10px] font-semibold text-white">
                {itemCount}
              </span>
            )}
          </Link>

          {status === "authenticated" ? (
            <>
              <Link to="/account" className="text-sm font-medium text-[#101B2C] hover:text-[#A9834E]">
                {user?.first_name || "Account"}
              </Link>
              <button
                onClick={handleLogout}
                className="rounded-md px-3 py-1.5 text-sm font-medium text-[#7C7669] transition-colors hover:bg-[#FAF7F2] hover:text-[#101B2C]"
              >
                Log out
              </button>
            </>
          ) : status === "anonymous" ? (
            <>
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-sm font-medium text-[#101B2C] transition-colors hover:bg-[#FAF7F2]"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-[#101B2C] px-4 py-1.5 text-sm font-medium text-white transition-colors hover:bg-[#1B2C46]"
              >
                Sign up
              </Link>
            </>
          ) : null}
        </div>
      </div>
    </header>
  );
}