import { NavLink, Outlet, useLocation } from "react-router-dom";
import Navbar from "../../components/Navbar";

const NAV_ITEMS = [
  { to: "/admin", label: "Dashboard", end: true },
  { to: "/admin/products", label: "Products" },
  { to: "/admin/orders", label: "Orders" },
  { to: "/admin/tickets", label: "Tickets" },
];

export default function AdminLayout() {
  const { pathname } = useLocation();
  const isAccountPage = pathname === "/admin/account";

  return (
    <div className="flex min-h-full flex-col bg-[#FAF7F2]">
      <Navbar minimal />

      <div className="mx-auto flex w-full max-w-6xl flex-1 gap-8 px-6 py-8">
        {/* Sidebar — hidden on the account page */}
        {!isAccountPage && (
          <aside className="w-56 shrink-0">
            <h1 className="px-3 text-lg font-semibold text-[#101B2C]">Admin</h1>

            <nav className="mt-6 flex flex-col gap-1">
              {NAV_ITEMS.map(({ to, label, end }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={end}
                  className={({ isActive }) =>
                    `rounded-md border-l-2 px-3 py-2 text-sm font-medium transition-colors ${
                      isActive
                        ? "border-[#BF9A63] bg-white text-[#101B2C]"
                        : "border-transparent text-[#7C7669] hover:bg-white/60 hover:text-[#101B2C]"
                    }`
                  }
                >
                  {label}
                </NavLink>
              ))}
            </nav>
          </aside>
        )}

        {/* Content */}
        <main className="min-w-0 flex-1">
          <Outlet />
        </main>
      </div>
    </div>
  );
}