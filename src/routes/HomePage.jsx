import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import FitmentFinder from "../features/fitment/FitmentFinder";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import { unwrapList } from "../api/client";
import * as catalogApi from "../api/catalog";

const FLEET = ["Toyota", "Nissan", "Subaru", "Mazda", "Isuzu", "Mitsubishi"];

// How many products the "Recently added" section shows.
const RECENT_COUNT = 4;

// Hero quick-info cards (icon + small label + bold value), Godown style.
const HERO_STATS = [
  {
    label: "Genuine OEM",
    value: "12,000+ SKUs in stock",
    icon: "M21 8 12 3 3 8m18 0-9 5m9-5v8l-9 5m0-8L3 8m9 5v8M3 8v8l9 5",
  },
  {
    label: "Express freight",
    value: "48-Hour, door to door",
    icon: "M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6Zm-9 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
  },
  {
    label: "Fitment",
    value: "100% verified pre-dispatch",
    icon: "M12 3 4 6v6c0 4.5 3.2 7.4 8 9 4.8-1.6 8-4.5 8-9V6l-8-3Zm-2.5 9.5 1.8 1.8L15.5 10",
  },
];

const WHY_US = [
  {
    title: "M-Pesa, card & pay on delivery",
    body: "Secure STK Push or card checkout, or settle the invoice when your parts arrive — whichever suits your fleet's workflow.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M7 4h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 14h3M9 8h6"
      />
    ),
  },
  {
    title: "Fast, tracked freight",
    body: "Every order ships within 48 hours and is tracked door to door, wherever your vehicles are based.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6Zm-9 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
      />
    ),
  },
  {
    title: "Verified fitment, every time",
    body: "Parts are matched against your vehicle's exact make, model and year before an order ever leaves the warehouse.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3 4 6v6c0 4.5 3.2 7.4 8 9 4.8-1.6 8-4.5 8-9V6l-8-3Zm-2.5 9.5 1.8 1.8L15.5 10"
      />
    ),
  },
];

const REVIEWS = [
  {
    name: "Joseph Mwangi",
    role: "Fleet Manager, Mwangi Logistics",
    quote:
      "We run 40+ Isuzu trucks and used to lose a full day whenever a part came back wrong. Fitment Konnect has cut that to almost zero — everything we've ordered has bolted straight on.",
    rating: 5,
  },
  {
    name: "Amina Yusuf",
    role: "Operations Lead, Yusuf Transporters",
    quote:
      "The M-Pesa checkout alone is worth it, but what keeps us ordering is the freight speed. Parts land within two days even when we're dispatching to Mombasa.",
    rating: 5,
  },
  {
    name: "Peter Kariuki",
    role: "Workshop Owner, Kariuki Auto Care",
    quote:
      "I was skeptical about ordering OEM parts online without seeing them first, but the fitment check against exact model years has been spot on every time.",
    rating: 4,
  },
];

function Icon({ children, className = "h-6 w-6" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" className={className}>
      {children}
    </svg>
  );
}

function CarIcon({ className }) {
  return (
    <Icon className={className}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 16V11l1.6-4.2A2 2 0 0 1 7.5 5.5h9a2 2 0 0 1 1.9 1.3L20 11v5M4 16a1.5 1.5 0 0 0 1.5 1.5h1A1.5 1.5 0 0 0 8 16M4 16v1.5A1 1 0 0 0 5 18.5h.5M20 16a1.5 1.5 0 0 1-1.5 1.5h-1A1.5 1.5 0 0 1 16 16M20 16v1.5a1 1 0 0 1-1 1h-.5M4 11h16"
      />
    </Icon>
  );
}

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["products", { ordering: "-created_at", page_size: RECENT_COUNT }],
    queryFn: () => catalogApi.listProducts({ ordering: "-created_at" }),
  });

  const products = isLoading ? [] : unwrapList(data).slice(0, RECENT_COUNT);

  return (
    <div className="bg-slate-50 text-base text-slate-900 dark:bg-[#0B121F] dark:text-slate-100 min-h-screen transition-colors duration-200">
      {/* Hero (Godown-style: full-bleed dimmed photo, centered copy, glass info cards) */}
      <section className="relative flex min-h-[90vh] items-center justify-center overflow-hidden py-20">
        {/* Background image + fade into page background */}
        <div className="absolute inset-0 z-0">
          <img
            src="/grande_auto_hut_shop.jpg"
            alt="Fitment Konnect parts shop"
            className="h-full w-full object-cover object-center brightness-[0.35] dark:brightness-[0.25]"
          />
          <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-slate-50 to-transparent dark:inset-0 dark:h-auto dark:from-[#0B121F] dark:via-transparent" />
        </div>

        <div className="relative z-10 mx-auto max-w-5xl space-y-9 px-4 text-center sm:px-6 lg:px-8">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 rounded-full border border-[#BF9A63]/30 bg-[#BF9A63]/10 px-4 py-2 text-sm font-semibold tracking-wide text-[#D9B97F] backdrop-blur-md">
            <Icon className="h-4 w-4 fill-current">
              <path d="M12 2.5l2.9 6 6.6.6-5 4.4 1.5 6.5L12 16.9 6 20l1.5-6.5-5-4.4 6.6-.6L12 2.5Z" />
            </Icon>
            <span>Built for the Kenyan fleet</span>
          </div>

          {/* Headline */}
          <h1 className="font-['Playfair_Display',serif] text-4xl font-extrabold leading-tight tracking-tight text-white sm:text-6xl lg:text-7xl">
            Genuine Parts. Precise Fit.
            <br />
            <span className="bg-gradient-to-r from-[#BF9A63] to-[#E8CFA0] bg-clip-text text-transparent">
              Zero Guesswork.
            </span>
          </h1>

          {/* Sub-copy */}
          <p className="mx-auto max-w-3xl text-lg font-light leading-relaxed text-slate-100 sm:text-xl">
            Genuine, top-grade components at fair retail pricing — checked against
            your vehicle's exact specification and backed by counter staff who{" "}
            <strong className="font-semibold text-[#D9B97F]">actually know what's under the hood.</strong>
          </p>

          {/* CTAs */}
          <div className="flex flex-col items-center justify-center gap-4 pt-4 sm:flex-row">
            <Link
              to="/catalog"
              className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#BF9A63] px-8 py-4 text-base font-bold text-slate-900 shadow-xl shadow-[#BF9A63]/20 transition-all hover:scale-105 hover:bg-[#A9834E] sm:w-auto"
            >
              <Icon className="h-5 w-5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M4 6h16M4 12h16M4 18h10"
                />
              </Icon>
              View Catalog
            </Link>
            <Link
              to="/register"
              className="flex w-full items-center justify-center gap-2 rounded-xl border-2 border-white/30 px-8 py-4 text-base font-bold text-white backdrop-blur-sm transition-all hover:scale-105 hover:border-[#BF9A63] hover:bg-[#BF9A63]/10 sm:w-auto"
            >
              <Icon className="h-5 w-5">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={1.8}
                  d="M15 19a6 6 0 0 0-12 0m9-11a3.5 3.5 0 1 1-7 0 3.5 3.5 0 0 1 7 0Zm6 1v6m3-3h-6"
                />
              </Icon>
              Get Started
            </Link>
          </div>

          {/* Quick info cards */}
          <div className="mx-auto grid max-w-4xl grid-cols-1 gap-4 pt-12 text-left md:grid-cols-3">
            {HERO_STATS.map(({ label, value, icon }) => (
              <div
                key={label}
                className="flex items-center gap-4 rounded-2xl border border-white/10 bg-[#101B2C]/75 p-4 backdrop-blur-md"
              >
                <div className="rounded-xl bg-[#BF9A63]/20 p-3 text-[#D9B97F]">
                  <Icon className="h-6 w-6">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d={icon} />
                  </Icon>
                </div>
                <div>
                  <h4 className="text-xs uppercase tracking-wider text-slate-400">{label}</h4>
                  <p className="text-sm font-bold text-white">{value}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fitment finder */}
      <section className="relative overflow-hidden border-b border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B121F]">
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#BF9A63]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-slate-200 dark:bg-white/5 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-8 py-14">
          <div className="rounded-xl border-2 border-[#BF9A63]/30 bg-white dark:bg-[#101B2C] p-6 shadow-md transition-shadow hover:shadow-lg md:p-7">
            <div className="mb-5 flex items-center gap-2">
              <span className="text-xs font-semibold uppercase tracking-wider text-[#BF9A63]">
                Flagship feature
              </span>
            </div>
            <h2 className="text-xl font-semibold text-slate-900 dark:text-white">
              Find parts for your vehicle
            </h2>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-400">
              Select your make, model and year — we'll only show parts confirmed to fit.
            </p>
            <div className="mt-5">
              <FitmentFinder compact />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted fleet band */}
      <section className="border-b border-slate-200 dark:border-white/10 bg-white dark:bg-[#101B2C] py-12">
        <div className="max-w-7xl mx-auto px-8">
          <p className="text-center text-sm font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
            Stocked for the fleet
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {FLEET.map((make) => (
              <div
                key={make}
                className="flex flex-col items-center gap-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B121F] px-3 py-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[#BF9A63]/40 hover:shadow-sm"
              >
                <CarIcon className="h-7 w-7 text-[#BF9A63]" />
                <span className="text-base font-medium text-slate-900 dark:text-white">{make}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently added */}
      <section className="max-w-7xl mx-auto px-8 py-14">
        <div className="mb-6 flex items-end justify-between gap-4">
          <div>
            <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
              Recently added
            </h2>
            <p className="mt-1 text-base text-slate-600 dark:text-slate-400">
              Newest parts to land in the warehouse.
            </p>
          </div>
          <Link
            to="/catalog"
            className="shrink-0 rounded-md border border-slate-300 dark:border-white/20 bg-white dark:bg-[#101B2C] px-4 py-2.5 text-base font-medium text-slate-700 dark:text-white transition-colors hover:border-[#BF9A63] hover:text-[#BF9A63]"
          >
            View full catalog
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Loading products" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-slate-300 dark:border-white/10 bg-white dark:bg-[#101B2C] px-6 py-16 text-center">
            <p className="text-base text-slate-500 dark:text-slate-400">
              No products yet — new stock will show up here as it's added.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {products.map((p) => (
              <ProductCard key={p.id} product={p} />
            ))}
          </div>
        )}
      </section>

      {/* Why fleets order from us */}
      <section className="bg-white dark:bg-[#101B2C] border-t border-slate-200 dark:border-white/10 py-16 text-slate-900 dark:text-white">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">Why fleets order from us</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {WHY_US.map(({ title, body, icon }) => (
              <div
                key={title}
                className="rounded-xl border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-[#0B121F] p-6 transition-colors hover:border-[#BF9A63]/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#BF9A63]/15 text-[#BF9A63]">
                  <Icon className="h-6 w-6">{icon}</Icon>
                </span>
                <h3 className="mt-4 text-lg font-semibold text-slate-900 dark:text-white">{title}</h3>
                <p className="mt-2 text-base leading-relaxed text-slate-600 dark:text-slate-300">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews */}
      <section className="bg-slate-50 dark:bg-[#0B121F] py-16">
        <div className="max-w-7xl mx-auto px-8">
          <h2 className="text-3xl font-semibold text-slate-900 dark:text-white">
            Trusted by fleets across the country
          </h2>
          <p className="mt-1 text-base text-slate-600 dark:text-slate-400">
            A few words from the workshops and operators who order from us every week.
          </p>

          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {REVIEWS.map(({ name, role, quote, rating }) => (
              <div
                key={name}
                className="flex flex-col rounded-xl border border-slate-200 dark:border-white/10 bg-white dark:bg-[#101B2C] p-6 shadow-sm dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]"
              >
                <div className="flex gap-0.5 text-[#BF9A63]">
                  {Array.from({ length: 5 }).map((_, i) => (
                    <Icon
                      key={i}
                      className={`h-5 w-5 ${
                        i < rating ? "fill-current" : "fill-none text-slate-300 dark:text-white/20"
                      }`}
                    >
                      <path d="M12 2.5l2.9 6 6.6.6-5 4.4 1.5 6.5L12 16.9 6 20l1.5-6.5-5-4.4 6.6-.6L12 2.5Z" />
                    </Icon>
                  ))}
                </div>

                <p className="mt-4 flex-1 text-base leading-relaxed text-slate-700 dark:text-slate-200">
                  "{quote}"
                </p>

                <div className="mt-6 border-t border-slate-200 dark:border-white/10 pt-4">
                  <p className="text-base font-semibold text-slate-900 dark:text-white">{name}</p>
                  <p className="text-sm text-slate-500 dark:text-slate-400">{role}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}