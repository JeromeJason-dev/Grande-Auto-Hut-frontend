import { Outlet, Link } from "react-router-dom";
import Navbar from "./Navbar";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/catalog" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

export default function Layout() {
  return (
    <div className="flex min-h-full flex-col bg-[#FAF7F2] dark:bg-gray-950 text-[#1E2430] dark:text-gray-100 transition-colors">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      <footer className="mt-0 border-t border-[#E7E2D8] dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
        <div className="mx-12 px-6 py-10">
          <div className="grid gap-15 sm:grid-cols-3">
            {/* Brand */}
            <div>
              <h2 className="text-xl font-semibold text-[#101B2C] dark:text-white">
                Grande <span className="text-[#BF9A63]">Auto</span> Hut
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#7C7669] dark:text-gray-400">
                Genuine and aftermarket parts for the Kenyan fleet — matched
                to your vehicle before an order ever leaves the warehouse.
              </p>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-md font-semibold uppercase tracking-wide text-[#101B2C] dark:text-gray-200">
                Quick links
              </h3>
              <ul className="mt-4 space-y-2">
                {QUICK_LINKS.map(({ label, to }) => (
                  <li key={to}>
                    <Link
                      to={to}
                      className="text-sm text-[#7C7669] dark:text-gray-400 transition-colors hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                    >
                      {label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>

            {/* Contact info */}
            <div>
              <h3 className="text-md font-semibold uppercase tracking-wide text-[#101B2C] dark:text-gray-200">
                Get in touch
              </h3>
              <ul className="mt-4 space-y-3">
                <li>
                  <a
                    href="mailto:hello@grandeautohut.co.ke"
                    className="flex items-center gap-2.5 text-sm text-[#7C7669] dark:text-gray-400 transition-colors hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="h-4 w-4 shrink-0 text-[#BF9A63]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M3.75 6.75h16.5v10.5H3.75V6.75Zm0 0 8.25 6 8.25-6"
                      />
                    </svg>
                    hello@grandeautohut.co.ke
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+254700000000"
                    className="flex items-center gap-2.5 text-sm text-[#7C7669] dark:text-gray-400 transition-colors hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                  >
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="h-4 w-4 shrink-0 text-[#BF9A63]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M4.5 5.25c0-.83.67-1.5 1.5-1.5h2.02c.7 0 1.3.47 1.46 1.15l.72 3.06a1.5 1.5 0 0 1-.4 1.42l-1.37 1.37a12.02 12.02 0 0 0 5.82 5.82l1.37-1.37a1.5 1.5 0 0 1 1.42-.4l3.06.72c.68.16 1.15.76 1.15 1.46v2.02c0 .83-.67 1.5-1.5 1.5H19.5C10.94 20.5 3.5 13.06 3.5 4.5v-.75"
                      />
                    </svg>
                    +254 700 000 000
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-15 border-t border-[#E7E2D8] dark:border-gray-800 pt-6 text-center text-[13px] text-[#7C7669] dark:text-gray-500">
            &copy; {new Date().getFullYear()} Grande Auto Hut — genuine and
            aftermarket parts for the Kenyan fleet.
          </div>
        </div>
      </footer>
    </div>
  );
}