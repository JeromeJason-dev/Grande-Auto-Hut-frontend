import { Outlet, Link } from "react-router-dom";
import Navbar from "./Navbar";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/catalog" },
  { label: "About", to: "/about" },
  { label: "Contact", to: "/contact" },
];

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/GRANDE AUTO HUT LTD",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.87.24-1.46 1.49-1.46H16.5V4.36A20.7 20.7 0 0 0 14.32 4.25c-2.19 0-3.69 1.34-3.69 3.79V10.5H8v3h2.63V21h2.87Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/grandeautohut",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-5 w-5">
        <rect x="3.75" y="3.75" width="16.5" height="16.5" rx="4.5" />
        <circle cx="12" cy="12" r="3.75" />
        <circle cx="16.5" cy="7.5" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@grandeautohutltd",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-5 w-5">
        <path d="M16.5 3h-2.6v12.1a2.9 2.9 0 1 1-2.05-2.77V9.6a5.6 5.6 0 1 0 4.65 5.52V9.15a6.9 6.9 0 0 0 4 1.28V7.8a4.3 4.3 0 0 1-4-4.8Z" />
      </svg>
    ),
  },
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
          <div className="grid gap-10 sm:grid-cols-3">
            {/* Brand */}
            <div>
              <h2 className="text-xl font-semibold text-[#101B2C] dark:text-white">
                Grande <span className="text-[#BF9A63]">Auto</span> Hut
              </h2>
              <p className="mt-3 text-sm leading-relaxed text-[#7C7669] dark:text-gray-400">
                Genuine and aftermarket parts for the Kenyan fleet — matched
                to your vehicle before an order ever leaves the warehouse.
              </p>

              {/* Social links */}
              <div className="mt-4 flex items-center gap-4">
                {SOCIAL_LINKS.map(({ label, href, icon }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    className="flex items-center gap-1.5 text-sm text-[#7C7669] dark:text-gray-400 transition-colors hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                  >
                    {icon}
                    {label}
                  </a>
                ))}
              </div>
            </div>

            {/* Quick links */}
            <div>
              <h3 className="text-md font-semibold uppercase tracking-wide text-[#101B2C] dark:text-gray-200">
                Quick links
              </h3>
              <ul className="mt-4 space-y-3">
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
                  <div className="flex items-start gap-2.5 text-sm text-[#7C7669] dark:text-gray-400">
                    <svg
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      className="h-4 w-4 shrink-0 mt-0.5 text-[#BF9A63]"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={1.5}
                        d="M12 21s-6.75-6.19-6.75-11.25a6.75 6.75 0 0 1 13.5 0C18.75 14.81 12 21 12 21Z"
                      />
                      <circle cx="12" cy="9.75" r="2.25" strokeWidth={1.5} />
                    </svg>
                    <span>South B, Industrial Area, Nairobi, Kenya</span>
                  </div>
                </li>
                <li>
                  <a
                    href="mailto:grandeautohut@gmail.com"
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
                    grandeautohut@gmail.com
                  </a>
                </li>
                <li>
                  <a
                    href="tel:+254723113311"
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
                    +254 723 113311
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="mt-10 border-t border-[#E7E2D8] dark:border-gray-800 pt-6 text-center text-[13px] text-[#7C7669] dark:text-gray-500">
            &copy; {new Date().getFullYear()} Grande Auto Hut — genuine and
            aftermarket parts for the Kenyan fleet.
          </div>
        </div>
      </footer>
    </div>
  );
}