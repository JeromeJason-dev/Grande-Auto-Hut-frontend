import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/customers", label: "Customers" },
  { to: "/admin/tickets", label: "Tickets" },
  { to: "/admin/fitment", label: "Fitment Catalog" },
];

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

const sectionLabelClasses =
  "px-3 text-[11px] font-semibold uppercase tracking-wider text-[#7C7669] dark:text-[#9FA8B8]";

const navItemClasses = ({ isActive }) =>
  `rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "border-[#BF9A63] bg-[#FAF7F2] dark:bg-[#162235] text-[#101B2C] dark:text-white"
      : "border-transparent text-[#7C7669] dark:text-[#9FA8B8] hover:bg-[#FAF7F2] dark:hover:bg-[#162235] hover:text-[#101B2C] dark:hover:text-white"
  }`;

export default function AdminLayout() {
  const { pathname } = useLocation();
  const isAccountPage = pathname === "/admin/account";
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate("/");
  };

  const initials =
    ((user?.first_name?.[0] || "") + (user?.last_name?.[0] || "")).toUpperCase() || "A";

  return (
    <div className="flex min-h-screen bg-[#FAF7F2] dark:bg-[#0B1320] text-[#101B2C] dark:text-white transition-colors duration-200">
      {/* Sidebar — carries everything the top navbar used to hold */}
      <aside className="sticky top-0 flex h-screen w-64 shrink-0 flex-col border-r border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0F1B2D]">
        {/* Brand */}
        <Link
          to="/"
          className="flex items-center gap-2 border-b border-[#E7E2D8] dark:border-[#25344D] px-5 py-5"
        >
          <WrenchMark />
          <span className="text-[1.05rem] font-bold tracking-tight text-[#101B2C] dark:text-white">
            Grande Auto Hut
          </span>
        </Link>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-5">
          {isAccountPage ? (
            <Link
              to="/admin"
              className="flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#162235] hover:text-[#101B2C] dark:hover:text-white"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8">
                <path d="M15 18l-6-6 6-6" />
              </svg>
              Back to dashboard
            </Link>
          ) : (
            <>
              <p className={sectionLabelClasses}>Admin</p>
              <div className="mt-2 flex flex-col gap-1">
                {NAV_ITEMS.map(({ to, label, end }) => (
                  <NavLink key={to} to={to} end={end} className={navItemClasses}>
                    {label}
                  </NavLink>
                ))}
              </div>

              <p className={`mt-6 ${sectionLabelClasses}`}>Storefront</p>
              <div className="mt-2 flex flex-col gap-1">
                <NavLink to="/catalog" className={navItemClasses}>
                  Catalog
                </NavLink>
              </div>
            </>
          )}
        </nav>

        {/* Account footer */}
        <div className="border-t border-[#E7E2D8] dark:border-[#25344D] p-4">
          <div className="flex items-center justify-between gap-2">
            <Link to="/admin/account" className="flex min-w-0 items-center gap-2.5">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#101B2C] dark:bg-[#BF9A63] text-xs font-semibold text-white dark:text-slate-950">
                {initials}
              </span>
              <span className="truncate text-sm font-medium text-[#101B2C] dark:text-white">
                {user?.first_name || "Account"}
              </span>
            </Link>
            <ThemeToggle />
          </div>
          <button
            onClick={handleLogout}
            className="mt-3 w-full rounded-md px-3 py-1.5 text-left text-sm font-medium text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-[#FAF7F2] dark:hover:bg-[#162235] hover:text-[#101B2C] dark:hover:text-white"
          >
            Log out
          </button>
        </div>
      </aside>

      {/* Content */}
      <main className="min-w-0 flex-1">
        <div className="mx-auto max-w-6xl px-6 pt-8 pb-4">
          <Outlet />
        </div>
      </main>
    </div>
  );
}