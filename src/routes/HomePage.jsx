import { useQuery } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import FitmentFinder from "../features/fitment/FitmentFinder";
import ProductCard from "../components/ProductCard";
import Spinner from "../components/Spinner";
import { unwrapList } from "../api/client";
import * as catalogApi from "../api/catalog";

const FLEET = ["Toyota", "Nissan", "Subaru", "Mazda", "Isuzu", "Mitsubishi"];

const TRUST_MARKERS = [
  { value: "12,000+", label: "Genuine OEM SKUs in stock" },
  { value: "48-Hour", label: "Express freight, door to door" },
  { value: "100%", label: "Fitment-verified before dispatch" },
];

const WHY_US = [
  {
    title: "M-Pesa & pay on delivery",
    body: "Secure STK Push checkout, or settle the invoice when your parts arrive — whichever suits your fleet's workflow.",
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

/*

  cream:   "#FAF7F2"   page background
  hairline:"#E7E2D8"   borders / dividers
  navy:    "#101B2C"   dark panels, footer, primary heading ink
  gold:    "#BF9A63"   accent — CTAs, links, small marks
  gold-dk: "#A9834E"   gold hover state
  ink:     "#1E2430"   body copy
  ink-soft:"#7C7669"   secondary / muted copy
*/

export default function HomePage() {
  const { data, isLoading } = useQuery({
    queryKey: ["products", { ordering: "-created_at", page_size: 8 }],
    queryFn: () => catalogApi.listProducts({ ordering: "-created_at" }),
  });

  const products = isLoading ? [] : unwrapList(data).slice(0, 8);

  return (
    <div className="bg-[#FAF7F2]">
      {/* Hero */}
      <section className="relative overflow-hidden border-b border-[#E7E2D8]">
        {/* soft decorative glow, echoes the dark-theme hero without switching palette */}
        <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#BF9A63]/10 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -right-16 h-96 w-96 rounded-full bg-[#101B2C]/5 blur-3xl" />

        <div className="relative max-w-6xl pl-20 pr-6 pt-14 md:pt-20">
          <span className="inline-flex items-center gap-2 rounded-full border border-[#E7E2D8] bg-white px-3 py-1 text-[11px] font-medium tracking-wide text-[#7C7669]">
            <span className="h-1.5 w-1.5 rounded-full bg-[#BF9A63]" />
            Built for the Kenyan fleet
          </span>

          <div className="mt-6 grid gap-10 md:grid-cols-[1.15fr_0.85fr] md:items-center">
            <div>
              <h1 className="max-w-[16ch] text-4xl font-semibold leading-tight text-[#101B2C] md:text-5xl">
                The right part, confirmed to fit — before you pay for it.
              </h1>
              <p className="mt-5 max-w-[48ch] text-[15px] leading-relaxed text-[#7C7669]">
                Genuine OEM assemblies and factory-matched components, checked
                against your vehicle's exact specification before an order
                ever leaves the warehouse.
              </p>

              <div className="mt-7 flex flex-wrap gap-3">
                <Link
                  to="/catalog"
                  className="rounded-md bg-[#101B2C] px-5 py-2.5 text-sm font-medium text-white shadow-[0_10px_25px_rgba(16,27,44,0.25)] transition-all hover:-translate-y-0.5 hover:bg-[#1B2C46]"
                >
                  Explore the catalog
                </Link>
                <Link
                  to="/fitment-concierge"
                  className="rounded-md border border-[#E7E2D8] bg-white px-5 py-2.5 text-sm font-medium text-[#101B2C] transition-colors hover:border-[#BF9A63] hover:text-[#A9834E]"
                >
                  Talk to a fitment specialist
                </Link>
              </div>
            </div>

            <div className="relative hidden overflow-hidden rounded-xl border border-[#E7E2D8] bg-gradient-to-br from-[#101B2C] to-[#1B2C46] shadow-[0_20px_45px_rgba(16,27,44,0.18)] md:block">
              <div className="flex h-full flex-col justify-between p-6 text-white/90">
                <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-white/10 px-3 py-1 text-[11px] font-medium tracking-wide text-white">
                  Live warehouse feed
                </span>
                <div>
                  <p className="text-sm text-white/60">Currently dispatching</p>
                  <p className="mt-1 text-lg font-semibold">
                    Sealed factory components
                  </p>
                </div>
              </div>

              {/* floating trust badge, gold-accented like the HTML hero's floating cards */}
              <div className="absolute -bottom-5 -left-5 hidden items-center gap-3 rounded-lg border border-[#E7E2D8] bg-white px-4 py-3 shadow-[0_14px_30px_rgba(16,27,44,0.15)] md:flex">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#BF9A63]/15 text-[#A9834E]">
                  <Icon className="h-5 w-5">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="m5 13 4 4L19 7"
                    />
                  </Icon>
                </span>
                <div>
                  <p className="text-sm font-semibold text-[#101B2C]">
                    Fitment guaranteed
                  </p>
                  <p className="text-xs text-[#7C7669]">Or your money back</p>
                </div>
              </div>

              <div className="absolute -top-4 -right-4 hidden items-center gap-0.5 rounded-lg border border-[#E7E2D8] bg-white px-3 py-2 text-[#BF9A63] shadow-[0_14px_30px_rgba(16,27,44,0.15)] md:flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Icon key={i} className="h-4 w-4 fill-current">
                    <path d="M12 2.5l2.9 6 6.6.6-5 4.4 1.5 6.5L12 16.9 6 20l1.5-6.5-5-4.4 6.6-.6L12 2.5Z" />
                  </Icon>
                ))}
              </div>
            </div>
          </div>

          {/* Stat strip */}
          <dl className="mt-10 grid grid-cols-1 divide-y divide-[#E7E2D8] border border-[#E7E2D8] bg-white sm:grid-cols-3 sm:divide-x sm:divide-y-0">
            {TRUST_MARKERS.map(({ value, label }) => (
              <div key={label} className="px-6 py-5">
                <dt className="text-xl font-semibold text-[#101B2C]">{value}</dt>
                <dd className="mt-1 text-sm text-[#7C7669]">{label}</dd>
              </div>
            ))}
          </dl>

          {/* Fitment finder — the flagship feature, given a gold-glow treatment */}
          <div className="my-10 rounded-xl border-2 border-[#BF9A63]/30 bg-white p-6 shadow-[0_20px_45px_rgba(191,154,99,0.12)] transition-shadow hover:shadow-[0_25px_55px_rgba(191,154,99,0.2)] md:p-7">
            <div className="mb-5 flex items-center gap-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-[#A9834E]">
                Flagship feature
              </span>
            </div>
            <h2 className="text-lg font-semibold text-[#101B2C]">
              Find parts for your vehicle
            </h2>
            <p className="mt-1 text-sm text-[#7C7669]">
              Select your make, model and year — we'll only show parts confirmed to fit.
            </p>
            <div className="mt-5">
              <FitmentFinder compact />
            </div>
          </div>
        </div>
      </section>

      {/* Trusted fleet band */}
      <section className="border-b border-[#E7E2D8] bg-white py-12">
        <div className="max-w-6xl pl-20 pr-6">
          <p className="text-center text-xs font-medium uppercase tracking-wide text-[#7C7669]">
            Stocked for the fleet
          </p>
          <div className="mt-6 grid grid-cols-3 gap-4 sm:grid-cols-6">
            {FLEET.map((make) => (
              <div
                key={make}
                className="flex flex-col items-center gap-2 rounded-lg border border-[#E7E2D8] bg-[#FAF7F2] px-3 py-5 text-center transition-all duration-200 hover:-translate-y-1 hover:border-[#BF9A63]/40 hover:shadow-[0_12px_28px_rgba(191,154,99,0.15)]"
              >
                <CarIcon className="h-6 w-6 text-[#BF9A63]" />
                <span className="text-sm font-medium text-[#101B2C]">{make}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Recently added */}
      <section className="max-w-6xl pl-20 pr-6 py-14">
        <div className="mb-6 flex items-end justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-[#101B2C]">
              Recently added
            </h2>
            <p className="mt-1 text-sm text-[#7C7669]">
              Newest parts to land in the warehouse.
            </p>
          </div>
          <Link
            to="/catalog"
            className="shrink-0 rounded-md border border-[#E7E2D8] bg-white px-4 py-2 text-sm font-medium text-[#101B2C] transition-colors hover:border-[#BF9A63] hover:text-[#A9834E]"
          >
            View full catalog
          </Link>
        </div>

        {isLoading ? (
          <div className="flex justify-center py-16">
            <Spinner label="Loading products" />
          </div>
        ) : products.length === 0 ? (
          <div className="rounded-xl border border-dashed border-[#E7E2D8] bg-white px-6 py-16 text-center">
            <p className="text-sm text-[#7C7669]">
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

      {/* Why fleets order from us — dark contrast band, matching the HTML page's payment/delivery section */}
      <section className="bg-[#101B2C] py-16 text-white">
        <div className="max-w-6xl pl-20 pr-6">
          <h2 className="text-2xl font-semibold">Why fleets order from us</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-3">
            {WHY_US.map(({ title, body, icon }) => (
              <div
                key={title}
                className="rounded-xl border border-white/10 bg-white/[0.03] p-6 transition-colors hover:border-[#BF9A63]/40"
              >
                <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#BF9A63]/15 text-[#BF9A63]">
                  <Icon className="h-6 w-6">{icon}</Icon>
                </span>
                <h3 className="mt-4 text-base font-semibold">{title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-white/60">
                  {body}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>
    </div>
  );
}