import { useEffect, useRef, useState } from "react";
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
    <svg width="24" height="24" viewBox="0 0 32 32" aria-hidden="true" className="flex-shrink-0">
      <path
        fill="#BF9A63"
        d="M28.6 8.2 22 14.8l-4.8-4.8 6.6-6.6a9 9 0 0 0-11.4 11.4L2 25.2 6.8 30l10.4-10.4a9 9 0 0 0 11.4-11.4Z"
      />
    </svg>
  );
}

/* ---------- Icons ---------- */
const ICONS = {
  catalog: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="1.2" />
      <rect x="14" y="3" width="7" height="7" rx="1.2" />
      <rect x="3" y="14" width="7" height="7" rx="1.2" />
      <rect x="14" y="14" width="7" height="7" rx="1.2" />
    </>
  ),
  about: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 16v-4M12 8h.01" />
    </>
  ),
  orders: (
    <>
      <path d="M21 8l-9-5-9 5v8l9 5 9-5V8Z" />
      <path d="M3 8l9 5 9-5M12 13v8" />
    </>
  ),
  support: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.1 9a3 3 0 0 1 5.8 1c0 2-3 2.5-3 4M12 17h.01" />
    </>
  ),
  heart: (
    <path d="M19 14c1.49-1.46 3-3.21 3-5.5A5.5 5.5 0 0 0 16.5 3c-1.76 0-3 .5-4.5 2-1.5-1.5-2.74-2-4.5-2A5.5 5.5 0 0 0 2 8.5c0 2.3 1.5 4.04 3 5.5l7 7Z" />
  ),
  cart: (
    <>
      <circle cx="9" cy="21" r="1" />
      <circle cx="20" cy="21" r="1" />
      <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
    </>
  ),
  admin: (
    <>
      <path d="M12 3l8 3v6c0 4.5-3.2 8-8 9-4.8-1-8-4.5-8-9V6l8-3Z" />
      <path d="M9 12l2 2 4-4" />
    </>
  ),
  user: (
    <>
      <circle cx="12" cy="8" r="4" />
      <path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7" />
    </>
  ),
  logout: <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" />,
  appearance: (
    <>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </>
  ),
};

function Icon({ name, size = 22 }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="flex-shrink-0"
    >
      {ICONS[name]}
    </svg>
  );
}

function MenuIcon({ open }) {
  return (
    <svg
      width="24"
      height="24"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      aria-hidden="true"
    >
      {open ? <path d="M6 6l12 12M18 6L6 18" /> : <path d="M4 7h16M4 12h16M4 17h16" />}
    </svg>
  );
}

function CountBadge({ count, className = "" }) {
  if (!count || count < 1) return null;
  return (
    <span
      className={`flex h-4 min-w-4 items-center justify-center rounded-full bg-[#DC2626] px-1 text-[11px] font-bold leading-none text-white ${className}`}
    >
      {count > 9 ? "9+" : count}
    </span>
  );
}

/* ---------- Shared class strings ---------- */
const navLinkClasses = ({ isActive }) =>
  `text-base font-medium text-black dark:text-white underline-offset-8 decoration-2 transition-opacity ${
    isActive ? "underline font-semibold" : "no-underline hover:opacity-70"
  }`;

const mobileRowBase =
  "flex w-full items-center gap-3 rounded-lg px-3 py-3 text-base font-medium transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63]";

const mobileLinkClasses = ({ isActive }) =>
  `${mobileRowBase} ${
    isActive
      ? "bg-[#FAF7F2] dark:bg-gray-800 text-[#101B2C] dark:text-white font-semibold"
      : "text-[#101B2C] dark:text-gray-200 hover:bg-[#FAF7F2] dark:hover:bg-gray-800"
  }`;

const dropdownItemClasses =
  "flex w-full items-center rounded-md px-3 py-2.5 text-left text-base font-medium text-[#101B2C] dark:text-gray-200 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-800 focus:outline-none focus-visible:bg-[#FAF7F2] dark:focus-visible:bg-gray-800";

function MobileLink({ to, icon, label, badge, end }) {
  return (
    <NavLink to={to} end={end} className={mobileLinkClasses}>
      {({ isActive }) => (
        <>
          <span className={isActive ? "text-[#BF9A63]" : "text-[#7C7669] dark:text-gray-400"}>
            <Icon name={icon} />
          </span>
          <span className="flex-1">{label}</span>
          <CountBadge count={badge} />
        </>
      )}
    </NavLink>
  );
}

function MobileSectionLabel({ children }) {
  return (
    <p className="px-3 pb-1 pt-3 text-xs font-semibold text-[#7C7669] dark:text-gray-500">
      {children}
    </p>
  );
}

export default function Navbar({ minimal = false }) {
  const { user, status, logout } = useAuth();
  const { itemCount } = useCart();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const accountRef = useRef(null);

  const isAuthed = status === "authenticated";
  const isAdmin = user?.role !== "customer" && isAuthed;
  const backOfficeHome = user?.role === "staff" ? "/staff" : "/admin";
  const backOfficeLabel = user?.role === "staff" ? "Staff" : "Admin";
  const accountPath = minimal || isAdmin ? `${backOfficeHome}/account` : "/account";

  const { data: wishlistData } = useQuery({
    queryKey: ["wishlist"],
    queryFn: wishlistApi.getWishlist,
    enabled: isAuthed && !isAdmin,
  });
  const wishlistCount = unwrapList(wishlistData).length;

  const fullName = user?.first_name
    ? `${user.first_name}${user?.last_name ? ` ${user.last_name}` : ""}`
    : "My account";
  const initial = (user?.first_name || user?.email || "A").charAt(0).toUpperCase();

  // Close both menus whenever the route changes
  useEffect(() => {
    setMenuOpen(false);
    setAccountOpen(false);
  }, [pathname]);

  // Mobile menu: close on Escape / desktop width, and lock page scroll while open
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e) => e.key === "Escape" && setMenuOpen(false);
    const mq = window.matchMedia("(min-width: 1024px)");
    const onChange = (e) => e.matches && setMenuOpen(false);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKey);
    mq.addEventListener("change", onChange);
    return () => {
      document.body.style.overflow = prevOverflow;
      window.removeEventListener("keydown", onKey);
      mq.removeEventListener("change", onChange);
    };
  }, [menuOpen]);

  // Account dropdown (desktop): close on outside click or Escape
  useEffect(() => {
    if (!accountOpen) return;
    const onPointerDown = (e) => {
      if (accountRef.current && !accountRef.current.contains(e.target)) {
        setAccountOpen(false);
      }
    };
    const onKey = (e) => e.key === "Escape" && setAccountOpen(false);
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("touchstart", onPointerDown);
    window.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("touchstart", onPointerDown);
      window.removeEventListener("keydown", onKey);
    };
  }, [accountOpen]);

  const handleLogout = async () => {
    setMenuOpen(false);
    setAccountOpen(false);
    await logout();
    navigate("/");
  };

  const toggleAccount = () => {
    setMenuOpen(false);
    setAccountOpen((o) => !o);
  };

  const toggleMenu = () => {
    setAccountOpen(false);
    setMenuOpen((o) => !o);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-[#E7E2D8] dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur transition-colors">
      <div className="relative mx-auto flex h-16 max-w-6xl items-center gap-2 px-4">
        <Link to="/" className="flex min-w-0 items-center gap-2">
          <WrenchMark />
          <span className="truncate text-lg font-bold tracking-tight text-[#101B2C] dark:text-white sm:text-xl">
            Grande Auto Hut
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="absolute left-1/2 top-1/2 hidden -translate-x-1/2 -translate-y-1/2 items-center gap-6 lg:flex">
          <NavLink to="/catalog" className={navLinkClasses}>Catalog</NavLink>
          {!minimal && (
            <>
              <NavLink to="/about" className={navLinkClasses}>About</NavLink>
              {!isAdmin && isAuthed && (
                <>
                  <NavLink to="/orders" className={navLinkClasses}>My Orders</NavLink>
                  <NavLink to="/support" className={navLinkClasses}>Support</NavLink>
                </>
              )}
            </>
          )}
          {isAdmin && (
            <NavLink to={backOfficeHome} className={navLinkClasses}>{backOfficeLabel}</NavLink>
          )}
        </nav>

        {/* Right-hand actions.
            Mobile (logged in): bell + cart + hamburger only; everything else lives in the menu.
            Desktop: full set of icons + account dropdown. */}
        <div className="ml-auto flex flex-shrink-0 items-center gap-3 sm:gap-4">
          {/* Theme toggle: always visible for visitors; desktop-only when logged in (it's in the menu on mobile) */}
          <div className={isAuthed ? "hidden lg:block" : ""}>
            <ThemeToggle />
          </div>

          {isAuthed && !isAdmin && <NotificationBell />}

          {/* Wishlist: desktop only (in the menu on mobile) */}
          {!minimal && !isAdmin && isAuthed && (
            <Link
              to="/wishlist"
              className="relative hidden text-[#101B2C] dark:text-gray-200 hover:text-gray-700 dark:hover:text-white lg:block"
              aria-label="Wishlist"
            >
              <Icon name="heart" />
              <CountBadge
                count={wishlistCount}
                className="absolute -right-2 -top-2 border-[1.5px] border-white dark:border-gray-900"
              />
            </Link>
          )}

          {/* Cart: always visible for quick access */}
          {!minimal && !isAdmin && (
            <Link
              to="/cart"
              className="relative text-[#101B2C] dark:text-gray-200 hover:text-gray-700 dark:hover:text-white"
              aria-label="Cart"
            >
              <Icon name="cart" />
              <CountBadge
                count={itemCount}
                className="absolute -right-2 -top-2 border-[1.5px] border-white dark:border-gray-900"
              />
            </Link>
          )}

          {/* Account dropdown (desktop only; mobile uses the menu panel) */}
          {isAuthed && (
            <div ref={accountRef} className="relative hidden lg:block">
              <button
                type="button"
                onClick={toggleAccount}
                aria-label="Account menu"
                aria-haspopup="menu"
                aria-expanded={accountOpen}
                aria-controls="account-menu"
                className={`flex h-10 items-center gap-2 rounded-full border pl-2 pr-3 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63] ${
                  accountOpen
                    ? "border-[#BF9A63] bg-[#FAF7F2] text-[#101B2C] dark:bg-gray-800 dark:text-white"
                    : "border-[#E7E2D8] dark:border-gray-700 text-[#101B2C] dark:text-gray-200 hover:bg-[#FAF7F2] dark:hover:bg-gray-800"
                }`}
              >
                <Icon name="user" />
                <span className="max-w-[7rem] truncate text-base font-medium">
                  {user?.first_name || "Account"}
                </span>
              </button>

              {accountOpen && (
                <div
                  id="account-menu"
                  role="menu"
                  aria-label="Account"
                  className="absolute right-0 top-full z-50 mt-2 w-64 origin-top-right rounded-lg border border-[#E7E2D8] dark:border-gray-700 bg-white dark:bg-gray-900 p-1.5 shadow-lg"
                >
                  <div className="border-b border-[#E7E2D8] dark:border-gray-800 px-3 pb-2 pt-1.5">
                    <p className="truncate text-base font-semibold text-[#101B2C] dark:text-white">
                      {fullName}
                    </p>
                    {user?.email && (
                      <p className="truncate text-sm text-[#7C7669] dark:text-gray-400">
                        {user.email}
                      </p>
                    )}
                  </div>

                  <div className="pt-1.5">
                    <Link
                      to={accountPath}
                      role="menuitem"
                      onClick={() => setAccountOpen(false)}
                      className={dropdownItemClasses}
                    >
                      My account
                    </Link>
                    <button
                      type="button"
                      role="menuitem"
                      onClick={handleLogout}
                      className={`${dropdownItemClasses} text-[#DC2626] dark:text-red-400`}
                    >
                      Log out
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Desktop auth actions (logged-out visitors) */}
          {status === "anonymous" && (
            <div className="hidden items-center gap-4 lg:flex">
              <Link
                to="/login"
                className="rounded-md px-3 py-1.5 text-base font-medium text-[#101B2C] dark:text-gray-200 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-800"
              >
                Log in
              </Link>
              <Link
                to="/register"
                className="rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-1.5 text-base font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E]"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Hamburger button (below lg) */}
          <button
            type="button"
            onClick={toggleMenu}
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
          className="max-h-[calc(100dvh-4rem)] overflow-y-auto overscroll-contain border-t border-[#E7E2D8] dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg lg:hidden"
        >
          <nav
            aria-label="Mobile"
            className="mx-auto flex max-w-6xl flex-col gap-0.5 px-4 pb-4 pt-3"
          >
            {/* Signed-in user summary */}
            {isAuthed && (
              <div className="mb-2 flex items-center gap-3 rounded-xl border border-[#E7E2D8] dark:border-gray-700 bg-[#FAF7F2] dark:bg-gray-800 px-3 py-3">
                <span
                  aria-hidden="true"
                  className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#101B2C] dark:bg-[#BF9A63] text-lg font-semibold text-white dark:text-slate-950"
                >
                  {initial}
                </span>
                <div className="min-w-0">
                  <p className="truncate text-base font-semibold text-[#101B2C] dark:text-white">
                    {fullName}
                  </p>
                  {user?.email && (
                    <p className="truncate text-sm text-[#7C7669] dark:text-gray-400">
                      {user.email}
                    </p>
                  )}
                </div>
              </div>
            )}

            <MobileSectionLabel>Browse</MobileSectionLabel>
            <MobileLink to="/catalog" icon="catalog" label="Catalog" />
            {!minimal && <MobileLink to="/about" icon="about" label="About" />}
            {isAdmin && <MobileLink to={backOfficeHome} end icon="admin" label={backOfficeLabel} />}

            {/* Customer features */}
            {!minimal && !isAdmin && isAuthed && (
              <>
                <MobileSectionLabel>Shopping</MobileSectionLabel>
                <MobileLink to="/orders" icon="orders" label="My Orders" />
                <MobileLink to="/wishlist" icon="heart" label="Wishlist" badge={wishlistCount} />
                <MobileLink to="/cart" icon="cart" label="Cart" badge={itemCount} />
                <MobileLink to="/support" icon="support" label="Support" />
              </>
            )}

            {/* Cart for visitors */}
            {!minimal && !isAdmin && !isAuthed && (
              <MobileLink to="/cart" icon="cart" label="Cart" badge={itemCount} />
            )}

            {/* Account section */}
            {isAuthed && (
              <>
                <MobileSectionLabel>Account</MobileSectionLabel>
                <MobileLink to={accountPath} icon="user" label="My account" />

                <div
                  className={`${mobileRowBase} justify-between text-[#101B2C] dark:text-gray-200`}
                >
                  <span className="flex items-center gap-3">
                    <span className="text-[#7C7669] dark:text-gray-400">
                      <Icon name="appearance" />
                    </span>
                    Appearance
                  </span>
                  <ThemeToggle />
                </div>

                <div className="my-2 border-t border-[#E7E2D8] dark:border-gray-800" />
                <button
                  type="button"
                  onClick={handleLogout}
                  className={`${mobileRowBase} text-[#DC2626] dark:text-red-400 hover:bg-red-50 dark:hover:bg-gray-800`}
                >
                  <Icon name="logout" />
                  Log out
                </button>
              </>
            )}

            {/* Visitor auth actions */}
            {status === "anonymous" && (
              <>
                <div className="my-2 border-t border-[#E7E2D8] dark:border-gray-800" />
                <div className="flex gap-3 pt-1">
                  <Link
                    to="/login"
                    className="flex-1 rounded-md border border-[#E7E2D8] dark:border-gray-700 px-4 py-3 text-center text-base font-medium text-[#101B2C] dark:text-gray-200 transition-colors hover:bg-[#FAF7F2] dark:hover:bg-gray-800"
                  >
                    Log in
                  </Link>
                  <Link
                    to="/register"
                    className="flex-1 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-3 text-center text-base font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E]"
                  >
                    Sign up
                  </Link>
                </div>
              </>
            )}
          </nav>
        </div>
      )}
    </header>
  );
}