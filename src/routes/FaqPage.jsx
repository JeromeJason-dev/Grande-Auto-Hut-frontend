import { useMemo, useState } from "react";
import { Link } from "react-router-dom";

const WHATSAPP_HREF = `https://wa.me/254723113311?text=${encodeURIComponent(
  "Hello Grande Auto Hut, I have a question."
)}`;

/* ------------------------------------------------------------------ */
/* Content. Edit the text here; the page renders everything from it.   */
/* ------------------------------------------------------------------ */
const CATEGORIES = [
  {
    id: "ordering",
    label: "Ordering & fitment",
    icon: "M4 7.5 12 4l8 3.5M4 7.5v9L12 20l8-3.5v-9M4 7.5 12 11l8-3.5M12 11v9",
    items: [
      {
        q: "How do I know a part will fit my vehicle?",
        a: "Use the Fitment Finder: choose your vehicle's make, model and year and we show only the parts matched to it. Our team also double-checks fitment before an order is dispatched. If you're unsure about a part, message us on WhatsApp with your vehicle details (and your logbook or chassis number if you have it) and we'll confirm before you pay.",
      },
      {
        q: "Do I need an account to order?",
        a: "You can browse the catalog freely, but you need a free account to add items to your cart, check out, track orders and save a wishlist. You can sign up with your email or with Google.",
      },
      {
        q: "Are your parts genuine or aftermarket?",
        a: "We stock both. We work with trusted OEM and top-tier aftermarket brands, and each product page shows what you're getting so you can choose by budget and quality.",
      },
      {
        q: "What if the part I need isn't listed or is out of stock?",
        a: "Message us or open a support ticket. Our supplier network lets us source specialised and hard-to-find parts, and we'll tell you the price and expected lead time before you commit.",
      },
      {
        q: "Can I change or cancel my order?",
        a: "Yes, as long as it hasn't gone out for delivery. Contact us as soon as possible with your order number. Orders that are already in transit can't be cancelled.",
      },
    ],
  },
  {
    id: "payments",
    label: "Payments",
    icon: "M7 4h7a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2Zm2 14h3M9 8h6",
    items: [
      {
        q: "Which payment methods do you accept?",
        a: "M-Pesa, Visa or Mastercard cards, and Pay on Delivery. You choose your method at checkout.",
      },
      {
        q: "How does M-Pesa payment work?",
        a: "Enter your M-Pesa number at checkout and we send a prompt (STK Push) to your phone. Enter your M-Pesa PIN to approve it. Your order is confirmed automatically once the payment goes through. If you miss or cancel the prompt, you won't be charged and you can retry from your order page.",
      },
      {
        q: "Is it safe to pay by card?",
        a: "Yes. Card payments are handled in a secure payment window run by Paystack. Your card number, expiry and CVV are entered there and are never stored on our website or servers. We only keep the card type, the last 4 digits and the payment reference.",
      },
      {
        q: "How does Pay on Delivery work?",
        a: "Place your order and pay when it arrives. Please have the amount ready on delivery. Our team will prepare your order for dispatch after it's placed.",
      },
      {
        q: "My payment went through but my order still shows as pending. What should I do?",
        a: "Open the order from My Orders and use the payment re-check option, since confirmations can take a moment. If it still shows pending after a few minutes, contact us with your order number and your M-Pesa code or card reference and we'll sort it out quickly.",
      },
      {
        q: "I was charged twice. What now?",
        a: "Contact us right away with your order number and both payment references. Any duplicate payment is refunded to you.",
      },
    ],
  },
  {
    id: "delivery",
    label: "Delivery",
    icon: "M3 7h11v9H3V7Zm11 3h4l3 3v3h-7v-6Zm-9 6a2 2 0 1 0 0 4 2 2 0 0 0 0-4Zm12 0a2 2 0 1 0 0 4 2 2 0 0 0 0-4Z",
    items: [
      {
        q: "Where do you deliver?",
        a: "We deliver within Nairobi and countrywide. Enter your county, town and street address at checkout and save addresses to your account for faster ordering next time.",
      },
      {
        q: "How long does delivery take?",
        a: "Orders are dispatched within 48 hours of being confirmed. Delivery time after dispatch depends on your location, and parts we need to source from suppliers may take longer. We'll tell you upfront.",
      },
      {
        q: "How much does delivery cost?",
        a: "The shipping fee is shown in your order summary before you pay, so there are no surprises at the end.",
      },
      {
        q: "How can I track my order?",
        a: "Go to My Orders and open your order to see its live status: Pending, Confirmed, Processing, In Transit, then Delivered. You also receive notifications in the app each time the status changes.",
      },
      {
        q: "Can I collect my order from your shop?",
        a: "Yes. Our shop is at South B, Industrial Area, Nairobi. Call or message us first so we can confirm your parts are ready for collection.",
      },
    ],
  },
  {
    id: "returns",
    label: "Returns & warranty",
    icon: "M12 3 4 6v6c0 4.5 3.2 7.4 8 9 4.8-1.6 8-4.5 8-9V6l-8-3Zm-2.5 9.5 1.8 1.8L15.5 10",
    items: [
      {
        q: "What if I receive the wrong or a faulty part?",
        a: "Contact us as soon as you notice, with your order number and a photo of the part and its packaging. If we sent the wrong item or it's faulty, we'll arrange a replacement or refund. Please don't install the part before checking it matches what you ordered.",
      },
      {
        q: "Can I return a part I no longer need?",
        a: "Unused parts in their original packaging can usually be returned. Contact us first so we can approve the return. Electrical parts and items that have been installed or damaged may not be returnable.",
      },
      {
        q: "Do your parts come with a warranty?",
        a: "Many do. Where a part has a warranty, the period is shown on its product page under Warranty. Keep your order number and delivery details as proof of purchase.",
      },
      {
        q: "How do refunds work?",
        a: "Approved refunds are sent back through your original payment method. Card refunds and M-Pesa reversals can take a few working days to reach you.",
      },
    ],
  },
  {
    id: "account",
    label: "Account & support",
    icon: "M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8Zm-7 8a7 7 0 0 1 14 0",
    items: [
      {
        q: "I forgot my password. How do I reset it?",
        a: "On the login page choose the forgot password option and enter your email. We'll send you a link to set a new password. If you signed up with Google, just use Continue with Google.",
      },
      {
        q: "How do I contact support?",
        a: "The fastest way is WhatsApp or a phone call. You can also open a support ticket from your account and follow the conversation there, or email grandeautohut@gmail.com.",
      },
      {
        q: "What are your opening hours?",
        a: "Call or message us on +254 723 113311 to confirm our current opening hours, especially before visiting the shop or on public holidays.",
      },
      {
        q: "Do you sell to garages and fleet owners?",
        a: "Yes. We supply garages, mechanics and fleets across Kenya. Contact us about regular orders and we'll help with sourcing and pricing.",
      },
    ],
  },
];

/* ------------------------------------------------------------------ */
/* Small pieces                                                        */
/* ------------------------------------------------------------------ */
function Icon({ d, className = "h-5 w-5" }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5} strokeLinecap="round" strokeLinejoin="round" className={className} aria-hidden="true">
      <path d={d} />
    </svg>
  );
}

function FaqItem({ id, q, a, open, onToggle }) {
  return (
    <div
      className={`rounded-xl border bg-white dark:bg-[#101B2C] shadow-sm transition-all ${
        open
          ? "border-[#BF9A63]/60 dark:border-[#BF9A63]/50"
          : "border-slate-200 dark:border-white/10 hover:border-[#BF9A63]/40"
      }`}
    >
      <h3>
        <button
          type="button"
          id={`${id}-btn`}
          aria-expanded={open}
          aria-controls={`${id}-panel`}
          onClick={onToggle}
          className="flex w-full items-center justify-between gap-4 rounded-xl px-5 py-4 text-left focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63]"
        >
          <span className="text-base font-semibold text-slate-900 dark:text-white sm:text-lg">{q}</span>
          <span
            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
              open ? "rotate-45 bg-[#BF9A63] text-[#101B2C]" : "bg-[#BF9A63]/15 text-[#BF9A63]"
            }`}
          >
            <Icon d="M12 5v14M5 12h14" className="h-4 w-4" />
          </span>
        </button>
      </h3>
      <div
        id={`${id}-panel`}
        role="region"
        aria-labelledby={`${id}-btn`}
        className={`grid transition-all duration-300 ease-in-out ${open ? "grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0"}`}
      >
        <div className="overflow-hidden">
          <p className="px-5 pb-5 text-base leading-relaxed text-slate-600 dark:text-slate-300">{a}</p>
        </div>
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/* Page                                                                */
/* ------------------------------------------------------------------ */
export default function FaqPage() {
  const [active, setActive] = useState("all");
  const [query, setQuery] = useState("");
  const [openId, setOpenId] = useState(null);

  const sections = useMemo(() => {
    const term = query.trim().toLowerCase();
    return CATEGORIES.filter((c) => active === "all" || c.id === active)
      .map((c) => ({
        ...c,
        items: c.items
          .map((item, i) => ({ ...item, id: `${c.id}-${i}` }))
          .filter((item) => !term || item.q.toLowerCase().includes(term) || item.a.toLowerCase().includes(term)),
      }))
      .filter((c) => c.items.length > 0);
  }, [active, query]);

  const total = sections.reduce((n, s) => n + s.items.length, 0);

  const pill = (isActive) =>
    `rounded-full border px-4 py-2 text-sm font-medium transition-all focus:outline-none focus-visible:ring-2 focus-visible:ring-[#BF9A63] ${
      isActive
        ? "border-[#BF9A63] bg-[#BF9A63] text-[#101B2C] shadow-md"
        : "border-slate-200 bg-white text-slate-600 hover:border-[#BF9A63]/50 dark:border-white/10 dark:bg-[#101B2C] dark:text-slate-300"
    }`;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 transition-colors duration-200 dark:bg-[#0B121F] dark:text-slate-100">
      {/* Hero */}
      <section className="border-b border-slate-200 bg-white pb-12 pt-10 dark:border-white/10 dark:bg-[#101B2C] md:pb-16">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-slate-100 px-3 py-1 text-[11px] font-medium tracking-wide text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-400">
            <span className="h-1.5 w-1.5 rounded-full bg-[#BF9A63]" />
            Help centre
          </span>
          <h1 className="mt-5 text-3xl font-semibold leading-tight text-slate-900 dark:text-white md:text-5xl">
            Frequently asked <span className="text-[#BF9A63]">questions</span>
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg leading-relaxed text-slate-600 dark:text-slate-300">
            Quick answers about ordering, paying, delivery and returns. Can't find what you need? We're a message away.
          </p>

          {/* Search */}
          <div className="relative mx-auto mt-8 max-w-xl">
            <Icon
              d="M21 21l-4.35-4.35M10.5 18a7.5 7.5 0 1 1 0-15 7.5 7.5 0 0 1 0 15Z"
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-slate-400"
            />
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search e.g. M-Pesa, delivery, warranty…"
              aria-label="Search frequently asked questions"
              className="w-full rounded-full border border-slate-200 bg-slate-50 py-3.5 pl-12 pr-4 text-base text-slate-900 placeholder:text-slate-400 focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/40 dark:border-white/10 dark:bg-[#0B121F] dark:text-white"
            />
          </div>
        </div>
      </section>

      {/* Questions */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* Category pills */}
        <div className="flex flex-wrap justify-center gap-2" role="tablist" aria-label="FAQ categories">
          <button type="button" role="tab" aria-selected={active === "all"} onClick={() => setActive("all")} className={pill(active === "all")}>
            All
          </button>
          {CATEGORIES.map((c) => (
            <button key={c.id} type="button" role="tab" aria-selected={active === c.id} onClick={() => setActive(c.id)} className={pill(active === c.id)}>
              {c.label}
            </button>
          ))}
        </div>

        <p className="mt-6 text-center text-sm text-slate-500 dark:text-slate-400" aria-live="polite">
          {total} {total === 1 ? "answer" : "answers"} {query.trim() ? "found" : "available"}
        </p>

        {sections.length === 0 ? (
          <div className="mt-8 rounded-xl border border-dashed border-slate-300 bg-white p-10 text-center dark:border-white/15 dark:bg-[#101B2C]">
            <p className="text-lg font-semibold text-slate-900 dark:text-white">No matching questions</p>
            <p className="mt-2 text-slate-600 dark:text-slate-300">Try a different word, or ask us directly below.</p>
            <button
              type="button"
              onClick={() => {
                setQuery("");
                setActive("all");
              }}
              className="mt-5 rounded-md bg-[#BF9A63] px-5 py-2.5 font-medium text-[#101B2C] transition-all hover:bg-[#A9834E]"
            >
              Clear search
            </button>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {sections.map((section) => (
              <div key={section.id}>
                <div className="mb-4 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full bg-[#BF9A63]/15 text-[#BF9A63]">
                    <Icon d={section.icon} className="h-5 w-5" />
                  </span>
                  <h2 className="text-xl font-semibold text-slate-900 dark:text-white sm:text-2xl">{section.label}</h2>
                </div>
                <div className="space-y-3">
                  {section.items.map((item) => (
                    <FaqItem
                      key={item.id}
                      id={item.id}
                      q={item.q}
                      a={item.a}
                      open={openId === item.id}
                      onToggle={() => setOpenId(openId === item.id ? null : item.id)}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Still need help */}
      <section className="border-t border-slate-200 bg-white py-14 dark:border-white/10 dark:bg-[#101B2C]">
        <div className="mx-auto max-w-4xl px-6">
          <h2 className="text-center text-3xl font-semibold text-slate-900 dark:text-white">Still need a hand?</h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-lg text-slate-600 dark:text-slate-300">
            Our parts specialists will help you find the right part and sort out any order issue.
          </p>

          <div className="mt-8 grid gap-4 sm:grid-cols-3">
            <a
              href={WHATSAPP_HREF}
              target="_blank"
              rel="noreferrer"
              className="group rounded-xl border border-slate-200 bg-slate-50 p-5 text-center transition-all hover:-translate-y-0.5 hover:border-[#25D366]/60 dark:border-white/10 dark:bg-[#0B121F]"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#25D366]/15 text-[#25D366]">
                <Icon d="M21 12a8.5 8.5 0 0 1-12.4 7.55L3 21l1.5-5.4A8.5 8.5 0 1 1 21 12Z" />
              </span>
              <p className="mt-3 font-semibold text-slate-900 dark:text-white">WhatsApp</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Fastest reply</p>
            </a>
            <a
              href="tel:+254723113311"
              className="group rounded-xl border border-slate-200 bg-slate-50 p-5 text-center transition-all hover:-translate-y-0.5 hover:border-[#BF9A63]/60 dark:border-white/10 dark:bg-[#0B121F]"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#BF9A63]/15 text-[#BF9A63]">
                <Icon d="M4.5 5.25c0-.83.67-1.5 1.5-1.5h2.02c.7 0 1.3.47 1.46 1.15l.72 3.06a1.5 1.5 0 0 1-.4 1.42l-1.37 1.37a12.02 12.02 0 0 0 5.82 5.82l1.37-1.37a1.5 1.5 0 0 1 1.42-.4l3.06.72c.68.16 1.15.76 1.15 1.46v2.02c0 .83-.67 1.5-1.5 1.5H19.5C10.94 20.5 3.5 13.06 3.5 4.5v-.75" />
              </span>
              <p className="mt-3 font-semibold text-slate-900 dark:text-white">Call us</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">+254 723 113311</p>
            </a>
            <Link
              to="/support"
              className="group rounded-xl border border-slate-200 bg-slate-50 p-5 text-center transition-all hover:-translate-y-0.5 hover:border-[#BF9A63]/60 dark:border-white/10 dark:bg-[#0B121F]"
            >
              <span className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-[#BF9A63]/15 text-[#BF9A63]">
                <Icon d="M3.75 6.75h16.5v10.5H3.75V6.75Zm0 0 8.25 6 8.25-6" />
              </span>
              <p className="mt-3 font-semibold text-slate-900 dark:text-white">Support ticket</p>
              <p className="mt-1 text-sm text-slate-600 dark:text-slate-400">Track your request</p>
            </Link>
          </div>

          <div className="mt-8 flex justify-center">
            <Link
              to="/catalog"
              className="inline-block rounded-md bg-[#BF9A63] px-5 py-2.5 font-medium text-[#101B2C] shadow-md transition-all hover:-translate-y-0.5 hover:bg-[#A9834E]"
            >
              Browse the catalog
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}