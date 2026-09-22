import { Link } from "react-router-dom";

const ADVANTAGES = [
  {
    title: "Massive inventory",
    body: "From routine maintenance essentials — brake pads, filters, spark plugs — to hard-to-find engine components and specialized performance upgrades, we stock parts for all major makes and models.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M4 7.5 12 4l8 3.5M4 7.5v9L12 20l8-3.5v-9M4 7.5 12 11l8-3.5M12 11v9"
      />
    ),
  },
  {
    title: "Guaranteed quality",
    body: "We partner exclusively with trusted OEM and top-tier aftermarket brands. Every part on our shelves meets strict industry standards for durability and performance.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M12 3 4 6v6c0 4.5 3.2 7.4 8 9 4.8-1.6 8-4.5 8-9V6l-8-3Zm-2.5 9.5 1.8 1.8L15.5 10"
      />
    ),
  },
  {
    title: "Expert counter staff",
    body: "We aren't just order-takers — we're gear heads. Our staff understand automotive electrical, plumbing and mechanical systems well enough to find the exact fitment for your vehicle.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M10.5 3.5a3 3 0 1 1 4.24 4.24l-1 1 3.5 3.5-2 2-3.5-3.5-6 6-2.5-2.5 6-6-1-1a3 3 0 0 1 2.26-4.74Z"
      />
    ),
  },
  {
    title: "Fast, reliable logistics",
    body: "Need something we don't have on the shelf? Our supplier network lets us source and deliver specialized parts faster than the competition.",
    icon: (
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={1.5}
        d="M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6Zm-9 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z"
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

/*
  cream:   "#FAF7F2"   page background
  hairline:"#E7E2D8"   borders / dividers
  navy:    "#101B2C"   dark panels, footer, primary heading ink
  gold:    "#BF9A63"   accent — CTAs, links, small marks
  gold-dk: "#A9834E"   gold hover state
  ink:     "#1E2430"   body copy
  ink-soft:"#7C7669"   secondary / muted copy
*/

export default function AboutPage() {
  return (
    <div className="bg-[#FAF7F2]">
      {/* Intro */}
      <section className="border-b border-[#E7E2D8] bg-white pt-6 pb-16 md:pb-20">
        <div className="pl-12 pr-8">
          <div className="flex justify-center">
            <span className="inline-flex items-center gap-2 rounded-full border border-[#E7E2D8] bg-[#FAF7F2] px-3 py-1 text-[11px] font-medium tracking-wide text-[#7C7669]">
              <span className="h-1.5 w-1.5 rounded-full bg-[#BF9A63]" />
              10+ years in Nairobi
            </span>
          </div>
          <h1 className="mx-auto mt-6 max-w-4xl text-center text-3xl font-semibold leading-tight text-[#101B2C] md:text-5xl">
            Your ultimate source for quality auto parts &amp; accessories
          </h1>
          <p className="mt-2 pt-10 pl-10 text-left text-[23px] leading-relaxed text-[#7C7669]">
            Here at Grande Auto Hut Ltd, we know that the right part makes
            all the difference. For over a decade we've supplied the Nairobi
            community and drivers countrywide with a wide selection of
            high-quality auto parts, hard-to-find components, and advice
            from staff who actually know what's under the hood.
          </p>
        </div>
      </section>

      {/* Advantages */}
      <section className="pl-12 pr-8 py-16">
        <div>
          <h2 className="text-center text-4xl font-semibold text-[#101B2C]">
            Why drivers and professionals choose us
          </h2>
          <p className="mt-2 text-center text-md leading-relaxed text-[#7C7669]">
            Finding the exact part shouldn't be a guessing game.
          </p>
        </div>

        <div className="mt-10 grid gap-6 sm:grid-cols-2">
          {ADVANTAGES.map(({ title, body, icon }) => (
            <div
              key={title}
              className="rounded-xl border border-[#E7E2D8] bg-white p-6 shadow-[0_10px_25px_rgba(16,27,44,0.05)] transition-colors hover:border-[#BF9A63]/40"
            >
              <span className="flex h-12 w-12 items-center justify-center rounded-full bg-[#BF9A63]/15 text-[#BF9A63]">
                <Icon className="h-6 w-6">{icon}</Icon>
              </span>
              <h3 className="mt-4 text-lg font-semibold text-[#101B2C]">
                {title}
              </h3>
              <p className="mt-2 text-md leading-relaxed text-[#7C7669]">
                {body}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* Core commitment — dark contrast band, matching the home page's dark section */}
      <section className="bg-[#101B2C] py-16 text-white">
        <div className="pl-12 pr-8">
          <span className="block text-center text-[45px] font-medium tracking-wide text-[#BF9A63]">
            Our core commitment
          </span>
          <p className="mt-4 text-left text-xl font-semibold leading-relaxed md:text-2xl">
            To empower drivers and mechanics by delivering premium-grade
            automotive parts with unmatched technical expertise, competitive
            pricing, and a commitment to keeping your vehicle safe on the
            road.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t border-[#E7E2D8] bg-white py-16">
        <div className="pl-12 pr-8">
          <h2 className="text-center text-4xl font-semibold text-[#101B2C]">
            Find the right part today
          </h2>
          <p className="mt-3 text-left text-xl leading-relaxed text-[#7C7669]">
            Don't risk your safety or your vehicle's performance on subpar
            components. Browse our digital inventory to find exactly what
            your vehicle demands, or talk to a parts specialist first.
          </p>
          <div className="mt-5 flex justify-center gap-3">
            <Link
              to="/catalog"
              className="inline-block rounded-md bg-[#BF9A63] px-5 py-2.5 text-md font-medium text-[#101B2C] shadow-[0_10px_25px_rgba(0,0,0,0.15)] transition-all hover:-translate-y-0.5 hover:bg-[#A9834E]"
            >
              Browse the catalog
            </Link>
            <Link
              to="/contact"
              className="inline-block rounded-md border border-[#E7E2D8] bg-white px-5 py-2.5 text-md font-medium text-[#101B2C] transition-colors hover:border-[#BF9A63] hover:text-[#A9834E]"
            >
              Talk to a specialist
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}