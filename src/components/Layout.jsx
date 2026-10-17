import { Outlet, Link, useLocation } from "react-router-dom";
import Navbar from "./Navbar";

const QUICK_LINKS = [
  { label: "Home", to: "/" },
  { label: "Products", to: "/catalog" },
  { label: "About", to: "/about" },
];

const WHATSAPP_NUMBER = "254723113311"; // international format, no "+" or spaces
const WHATSAPP_MESSAGE = "Hello Grande Auto Hut, I'd like help with a part.";
const WHATSAPP_HREF = `https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(WHATSAPP_MESSAGE)}`;
const WHATSAPP_ICON_PATH =
  "M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413Z";

const SOCIAL_LINKS = [
  {
    label: "Facebook",
    href: "https://www.facebook.com/GRANDE AUTO HUT LTD",
    icon: (
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-[#1877F2]">
        <path d="M13.5 21v-7.5h2.5l.5-3h-3V8.5c0-.87.24-1.46 1.49-1.46H16.5V4.36A20.7 20.7 0 0 0 14.32 4.25c-2.19 0-3.69 1.34-3.69 3.79V10.5H8v3h2.63V21h2.87Z" />
      </svg>
    ),
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/grandeautohut",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} className="h-6 w-6 text-[#E4405F]">
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
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-6 w-6 text-black dark:text-white">
        <path d="M16.5 3h-2.6v12.1a2.9 2.9 0 1 1-2.05-2.77V9.6a5.6 5.6 0 1 0 4.65 5.52V9.15a6.9 6.9 0 0 0 4 1.28V7.8a4.3 4.3 0 0 1-4-4.8Z" />
      </svg>
    ),
  },
];

// Floating button: shown only on the catalog and about pages.
function WhatsAppButton() {
  return (
    <a
      href={WHATSAPP_HREF}
      target="_blank"
      rel="noreferrer"
      aria-label="Chat with us on WhatsApp"
      title="Chat with us on WhatsApp"
      className="fixed bottom-5 right-5 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-[#25D366] text-white shadow-lg transition-transform hover:scale-110 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#25D366] focus-visible:ring-offset-2"
    >
      <svg viewBox="0 0 24 24" fill="currentColor" className="h-7 w-7" aria-hidden="true">
        <path d={WHATSAPP_ICON_PATH} />
      </svg>
    </a>
  );
}

export default function Layout() {
  const { pathname } = useLocation();

  // Ignore trailing slashes so "/about/" behaves like "/about"
  const path = pathname.replace(/\/+$/, "") || "/";

  const isHome = path === "/";
  const isAbout = path === "/about";
  const isCatalog = path === "/catalog" || path.startsWith("/catalog/");

  const showFloatingWhatsApp = isAbout || isCatalog;
  const showFooter = isHome || isAbout || isCatalog;

  return (
    <div className="flex min-h-full flex-col bg-[#FAF7F2] dark:bg-gray-950 text-[#1E2430] dark:text-gray-100 transition-colors">
      <Navbar />

      <main className="flex-1">
        <Outlet />
      </main>

      {showFooter && (
        <footer className="mt-0 border-t border-[#E7E2D8] dark:border-gray-800 bg-white dark:bg-gray-900 transition-colors">
          <div className="mx-4 px-6 py-10 sm:mx-12">
            <div className="grid gap-10 sm:grid-cols-3">
              {/* Brand */}
              <div>
                <h2 className="text-2xl font-semibold text-[#101B2C] dark:text-white">
                  Grande <span className="text-[#BF9A63]">Auto</span> Hut
                </h2>
                <p className="mt-3 text-base leading-relaxed text-[#7C7669] dark:text-gray-400">
                  Genuine and aftermarket parts for the Kenyan fleet — matched
                  to your vehicle before an order ever leaves the warehouse.
                </p>

                {/* Social links */}
                <div className="mt-4 flex flex-wrap items-center gap-x-5 gap-y-3">
                  {SOCIAL_LINKS.map(({ label, href, icon }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-2 text-base text-[#7C7669] dark:text-gray-400 transition-colors hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                    >
                      {icon}
                      {label}
                    </a>
                  ))}
                </div>
              </div>

              {/* Quick links */}
              <div>
                <h3 className="text-lg font-semibold uppercase tracking-wide text-[#101B2C] dark:text-gray-200">
                  Quick links
                </h3>
                <ul className="mt-4 space-y-3">
                  {QUICK_LINKS.map(({ label, to }) => (
                    <li key={to}>
                      <Link
                        to={to}
                        className="text-base text-[#7C7669] dark:text-gray-400 transition-colors hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Contact info */}
              <div>
                <h3 className="text-lg font-semibold uppercase tracking-wide text-[#101B2C] dark:text-gray-200">
                  Get in touch
                </h3>
                <ul className="mt-4 space-y-3">
                  <li>
                    <div className="flex items-start gap-3 text-base text-[#7C7669] dark:text-gray-400">
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="mt-0.5 h-5 w-5 shrink-0 text-[#BF9A63]"
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
                      className="flex items-center gap-3 text-base text-[#7C7669] dark:text-gray-400 transition-colors hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="h-5 w-5 shrink-0 text-[#BF9A63]"
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
                      className="flex items-center gap-3 text-base text-[#7C7669] dark:text-gray-400 transition-colors hover:text-[#A9834E] dark:hover:text-[#BF9A63]"
                    >
                      <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        stroke="currentColor"
                        className="h-5 w-5 shrink-0 text-[#BF9A63]"
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

            <div className="mt-10 border-t border-[#E7E2D8] dark:border-gray-800 pt-6 text-center text-sm text-[#7C7669] dark:text-gray-500">
              &copy; {new Date().getFullYear()} Grande Auto Hut — genuine and
              aftermarket parts for the Kenyan fleet.
            </div>
          </div>
        </footer>
      )}

      {showFloatingWhatsApp && <WhatsAppButton />}
    </div>
  );
}