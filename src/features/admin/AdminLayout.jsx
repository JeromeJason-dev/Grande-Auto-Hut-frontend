import {
  CarFront,
  ChevronLeft,
  ClipboardList,
  LayoutDashboard,
  LifeBuoy,
  Package,
  ShoppingCart,
  Store,
  Users,
  UsersRound,
} from "lucide-react";
import { Link, NavLink, Outlet, useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../../features/auth/AuthContext";
import ThemeToggle from "../../components/ThemeToggle";
import NotificationBell from "../../components/NotificationBell";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", icon: LayoutDashboard, end: true },
  { to: "/admin/products", label: "Products", icon: Package },
  { to: "/admin/orders", label: "Orders", icon: ShoppingCart },
  { to: "/admin/customers", label: "Customers", icon: Users },
  { to: "/admin/tickets", label: "Tickets", icon: LifeBuoy },
  { to: "/admin/fitment", label: "Fitment Catalog", icon: CarFront },
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
  `group flex items-center gap-3 rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
    isActive
      ? "border-[#BF9A63] bg-[#FAF7F2] dark:bg-[#162235] text-[#101B2C] dark:text-white"
      : "border-transparent text-[#7C7669] dark:text-[#9FA8B8] hover:bg-[#FAF7F2] dark:hover:bg-[#162235] hover:text-[#101B2C] dark:hover:text-white"
  }`;

// Icon + label for a sidebar link. The icon takes the gold accent when its page is active.
function NavContent({ icon: Icon, label, isActive }) {
  return (
    <>
      <Icon
        aria-hidden="true"
        strokeWidth={1.75}
        className={`h-[18px] w-[18px] shrink-0 transition-colors ${
          isActive ? "text-[#BF9A63]" : "text-[#9A9385] dark:text-[#6F7C93] group-hover:text-[#BF9A63]"
        }`}
      />
      <span className="truncate">{label}</span>
    </>
  );
}

export default function AdminLayout() {
  const { pathname } = useLocation();
  const isAccountPage = pathname === "/admin/account";
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  // Admins manage the team; staff get a "My tasks" view of the same page.
  const isAdmin = user?.role === "admin";
  const navItems = NAV_ITEMS.flatMap((item) =>
    item.to === "/admin/tickets"
      ? [item, { to: "/admin/staff", label: isAdmin ? "Staff" : "My tasks", icon: isAdmin ? UsersRound : ClipboardList }]
      : [item],
  );

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
              <ChevronLeft aria-hidden="true" className="h-4 w-4" strokeWidth={1.75} />
              Back to dashboard
            </Link>
          ) : (
            <>
              <p className={sectionLabelClasses}>Admin</p>
              <div className="mt-2 flex flex-col gap-1">
                {navItems.map(({ to, label, icon, end }) => (
                  <NavLink key={to} to={to} end={end} className={navItemClasses}>
                    {({ isActive }) => <NavContent icon={icon} label={label} isActive={isActive} />}
                  </NavLink>
                ))}
              </div>

              <p className={`mt-6 ${sectionLabelClasses}`}>Storefront</p>
              <div className="mt-2 flex flex-col gap-1">
                <NavLink to="/catalog" className={navItemClasses}>
                  {({ isActive }) => <NavContent icon={Store} label="Catalog" isActive={isActive} />}
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
            <div className="flex items-center gap-3">
              <NotificationBell />
              <ThemeToggle />
            </div>
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