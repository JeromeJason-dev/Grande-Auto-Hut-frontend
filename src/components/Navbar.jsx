import { useEffect, useState } from "react";
import { Link, NavLink, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../features/auth/AuthContext";
import { useCart } from "../features/cart/CartContext";
import { useQuery } from "@tanstack/react-query";
import * as wishlistApi from "../api/wishlist";
import { unwrapList } from "../api/client";
import NotificationBell from "./NotificationBell";
import ThemeToggle from "./ThemeToggle";

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
    isActive
      ? "text-[#101B2C] dark:text-white font-semibold"
      : "text-[#7C7669] dark:text-gray-400 hover:text-[#101B2C] dark:hover:text-white"
  }`;

// Larger, full-width rows for the mobile panel
const mobileLinkClasses = ({ isActive }) =>
  `block rounded-md px-3 py-3 text-base font-medium transition-colors ${
    isActive
      ? "bg-[#FAF7F2] dark:bg-gray-800 text-[#101B2C] dark:text-white font-semibold"
      : "text-[#7C7669] dark:text-gray-400 hover:bg-[#FAF7F2] dark:hover:bg-gray-800 hover:text-[#101B2C] dark:hover:text-white"
  }`;

function MenuIcon({ open }) {
  return (
    <svg
      width="22"
      height="22"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? (
        <path d="M6 6l12 12M18 6L6 18" />
      ) : (
        <path d="M4 7h16M4 12h16M4 17h16" />
      )}
    </svg>
  );
}

export default function Navbar({ minimal = false }) {
  const { user, status, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const isAdmin = user?.role !== "customer" && status === "authenticated";
  const accountPath = minimal || isAdmin ? "/admin/account" : "/account";

  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistApi.getWishlist,
    enabled: status === "authenticated" && !isAdmin,
  });
  const wishlistCount = unwrapList(wishlistData).length;

  // Close the menu whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Close on Escape, and when the viewport grows to desktop width
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => e.matches && setMenuOpen(false);
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [menuOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    await logout();
    navigate("/");
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E2D8] dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur transition-colors">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center px-4">
        <Link to="/" className="flex flex-shrink-0 items-center gap-2">
          <WrenchMark />
          <span className="text-lg font-bold tracking-tight text-[#101B2C] dark:text-white sm:text-xl">
            Grande Auto Hut
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 lg:flex">
          <NavLink to="/catalog" className={navLinkClasses}>Catalog</NavLink>
          {!minimal && (
            <>
              <NavLink to="/about" className={navLinkClasses}>About</NavLink>
              {!isAdmin && status === "authenticated" && (
                <>
                  <NavLink to="/orders" className={navLinkClasses}>My Orders</NavLink>
                  <NavLink to="/support" className={navLinkClasses}>Support</NavLink>
                </>
              )}
            </>
          )}
          {isAdmin && (
            <NavLink to="/admin" className={navLinkClasses}>Admin</NavLink>
          )}
        </nav>

        <div className="ml-auto flex flex-shrink-0 items-center gap-3 sm:gap-4">
          {/* Theme Toggle Button */}
          <ThemeToggle />

          {status === "authenticated" && !isAdmin && <NotificationBell />}

          {!minimal && !isAdmin && status === "authenticated" && (
            <Link to="/wishlist" className="relative text-[#101B2C] dark:text-gray-200 hover:text-gray-700 dark:hover:text-white" aria-label="Wishlist">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.04 3 5.5l7 7Z" />
              </svg>
              {wishlistCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-white dark:border-gray-900 bg-[#DC2626] px-1 text-[10px] font-bold leading-none text-white">
                  {wishlistCount > 9 ? "9+" : wishlistCount}
                </span>
              )}
            </Link>
          )}

          {!minimal && !isAdmin && (
            <Link to="/cart" className="relative text-[#101B2C] dark:text-gray-200 hover:text-gray-700 dark:hover:text-white" aria-label="Cart">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
              {itemCount > 0 && (
                <span className="absolute -right-2 -top-2 flex h-4 min-w-4 items-center justify-center rounded-full border-[1.5px] border-white dark:border-gray-900 bg-[#DC2626] px-1 text-[10px] font-bold leading-none text-white">
                  {itemCount > 9 ? "9+" : itemCount}
                </span>
              )}
            </Link>
          )}

          {/* Desktop auth actions */}
          <div className="hidden items-center gap-4 lg:flex">
            {status === "authenticated" ? (
              <>
                <Link
                  to={accountPath}
                  className="text-sm font-medium text-[#101B2C] dark:text-gray-200 hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                >
                  {user?.first_name || "Account"}
                </Link>
                <button
                  onClick={handleLogout}
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-[#7C7669] dark:text-gray-400 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-800 hover:text-[#101B2C] dark:hover:text-white"
                >
                  Log out
                </button>
              </>
            ) : status === "anonymous" ? (
              <>
                <Link
                  to="/login"
                  className="rounded-md px-3 py-1.5 text-sm font-medium text-[#101B2C] dark:text-gray-200 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-800"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-1.5 text-sm font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E]"
                >
                  Sign up
                </Link>
              </>
            ) : null}
          </div>

          {/* Hamburger button (below lg) */}
          <button
            type="button"
            onClick={() => setMenuOpen((o) => !o)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            aria-controls="mobile-menu"
            className="-mr-2 rounded-md p-2 text-[#101B2C] dark:text-gray-200 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63] lg:hidden"
          >
            <MenuIcon open={menuOpen} />
          </button>
        </div>
      </div>

      {/* Mobile panel */}
      {menuOpen && (
        <div
          id="mobile-menu"
          className="max-h-[calc(100vh-4rem)] overflow-y-auto border-t border-[#E7E2D8] dark:border-gray-800 bg-white dark:bg-gray-900 lg:hidden"
        >
          <nav className="mx-auto flex max-w-6xl flex-col gap-1 px-4 py-3">
            <NavLink to="/catalog" className={mobileLinkClasses}>Catalog</NavLink>
            {!minimal && (
              <>
                <NavLink to="/about" className={mobileLinkClasses}>About</NavLink>
                {!isAdmin && status === "authenticated" && (
                  <>
                    <NavLink to="/orders" className={mobileLinkClasses}>My Orders</NavLink>
                    <NavLink to="/support" className={mobileLinkClasses}>Support</NavLink>
                  </>
                )}
              </>
            )}
            {isAdmin && (
              <NavLink to="/admin" className={mobileLinkClasses}>Admin</NavLink>
            )}

            <div className="my-2 border-t border-[#E7E2D8] dark:border-gray-800" />

            {status === "authenticated" ? (
              <>
                <NavLink to={accountPath} className={mobileLinkClasses}>
                  {user?.first_name || "Account"}
                </NavLink>
                <button
                  onClick={handleLogout}
                  className="block w-full rounded-md px-3 py-3 text-left text-base font-medium text-[#7C7669] dark:text-gray-400 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-800 hover:text-[#101B2C] dark:hover:text-white"
                >
                  Log out
                </button>
              </>
            ) : status === "anonymous" ? (
              <div className="flex gap-3 pt-1">
                <Link
                  to="/login"
                  className="flex-1 rounded-md border border-[#E7E2D8] dark:border-gray-700 px-4 py-2.5 text-center text-sm font-medium text-[#101B2C] dark:text-gray-200 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-800"
                >
                  Log in
                </Link>
                <Link
                  to="/register"
                  className="flex-1 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-2.5 text-center text-sm font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E]"
                >
                  Sign up
                </Link>
              </div>
            ) : null}
          </nav>
        </div>
      )}
    </header>
  );
}