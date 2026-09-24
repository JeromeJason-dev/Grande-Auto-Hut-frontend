import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { useCart } from "./CartContext";
import * as authApi from "../../api/auth";
import * as ordersApi from "../../api/orders";
import * as paymentsApi from "../../api/payments";
import { unwrapList, extractErrorMessage } from "../../api/client";
import Price from "../../components/Price";
import ErrorAlert from "../../components/ErrorAlert";

const EMPTY_ADDRESS = { recipient_name: "", phone_number: "", county: "", town: "", street_address: "", building_or_estate: "" };

const fieldClasses =
  "w-full rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-white dark:bg-[#0B1320] px-3 py-2 text-sm text-[#101B2C] dark:text-white transition-colors focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25";

const labelClasses = "mb-1.5 block text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]";

export default function CheckoutPage() {
  const { cart, refresh } = useCart();
  const addressesQuery = useQuery({ queryKey: ["addresses"], queryFn: authApi.listAddresses });

  const [addressId, setAddressId] = useState("");
  const [newAddress, setNewAddress] = useState(EMPTY_ADDRESS);
  const [paymentMethod, setPaymentMethod] = useState("mpesa");
  const [mpesaPhone, setMpesaPhone] = useState("");
  const [error, setError] = useState("");
  const [step, setStep] = useState("form"); // form | placing | awaiting-mpesa | done
  const [placedOrder, setPlacedOrder] = useState(null);

  const addresses = unwrapList(addressesQuery.data);

  if (!cart || cart.items.length === 0) {
    return (
      <div className="min-h-full bg-white dark:bg-[#0B1320] px-6 py-16 text-center transition-colors">
        <div className="mx-auto max-w-3xl">
          <p className="text-[#7C7669] dark:text-[#9FA8B8]">
            Your cart is empty.{" "}
            <Link to="/catalog" className="font-medium text-[#101B2C] dark:text-white hover:text-[#BF9A63]">
              Browse the catalog
            </Link>{" "}
            first.
          </p>
        </div>
      </div>
    );
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setStep("placing");
    try {
      const payload = addressId
        ? { address_id: addressId, payment_method: paymentMethod }
        : { ...newAddress, payment_method: paymentMethod };

      const order = await ordersApi.checkout(payload);
      setPlacedOrder(order);
      await refresh();

      if (paymentMethod === "mpesa") {
        setStep("awaiting-mpesa");
        await paymentsApi.initiateMpesa(order.id, mpesaPhone || newAddress.phone_number);
      } else {
        setStep("done");
      }
    } catch (err) {
      setError(extractErrorMessage(err));
      setStep("form");
    }
  };

  if (step === "awaiting-mpesa") {
    return (
      <div className="min-h-full bg-white dark:bg-[#0B1320] px-6 py-16 transition-colors">
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] p-8 text-center shadow-[0_10px_25px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#BF9A63]/15 text-[#BF9A63]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <rect x="6" y="2" width="12" height="20" rx="2" />
                <path d="M11 18h2" />
              </svg>
            </span>
            <h1 className="mt-4 text-xl font-semibold text-[#101B2C] dark:text-white">Check your phone</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#7C7669] dark:text-[#9FA8B8]">
              We've sent an M-Pesa prompt to{" "}
              <strong className="text-[#101B2C] dark:text-white">{mpesaPhone || newAddress.phone_number}</strong> for order{" "}
              <strong className="font-mono text-[#101B2C] dark:text-white">{placedOrder?.order_number}</strong>. Enter your M-Pesa
              PIN to complete payment — your order will confirm automatically once we hear back from Safaricom.
            </p>
            <Link
              to={`/orders/${placedOrder.id}`}
              className="mt-6 inline-block rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77]"
            >
              Track this order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (step === "done") {
    return (
      <div className="min-h-full bg-white dark:bg-[#0B1320] px-6 py-16 transition-colors">
        <div className="mx-auto max-w-lg">
          <div className="rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] p-8 text-center shadow-[0_10px_25px_rgba(0,0,0,0.1)] dark:shadow-[0_10px_25px_rgba(0,0,0,0.3)]">
            <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#BF9A63]/15 text-[#BF9A63]">
              <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M4 12.6 9 17l11-11" />
              </svg>
            </span>
            <h1 className="mt-4 text-xl font-semibold text-[#101B2C] dark:text-white">Order placed</h1>
            <p className="mt-3 text-sm leading-relaxed text-[#7C7669] dark:text-[#9FA8B8]">
              Order <strong className="font-mono text-[#101B2C] dark:text-white">{placedOrder?.order_number}</strong> is confirmed
              for Pay on Delivery. Our team will prepare it for dispatch.
            </p>
            <Link
              to={`/orders/${placedOrder.id}`}
              className="mt-6 inline-block rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77]"
            >
              Track this order
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-full bg-white dark:bg-[#0B1320] px-6 py-10 transition-colors">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white">Checkout</h1>

        {error && (
          <div className="mt-4">
            <ErrorAlert message={error} />
          </div>
        )}

        <div className="mt-8 grid gap-8 lg:grid-cols-[1.4fr_1fr]">
          <form onSubmit={handleSubmit}>
            <h2 className="text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]">
              Delivery address
            </h2>

            {addresses.length > 0 && (
              <div className="mt-3 flex flex-col gap-2">
                {addresses.map((a) => (
                  <label
                    key={a.id}
                    className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-[#FAF7F2] dark:bg-[#162235] p-3.5 text-sm transition-colors ${
                      addressId === a.id
                        ? "border-[#101B2C] dark:border-[#BF9A63] ring-1 ring-[#101B2C]/30 dark:ring-[#BF9A63]/30"
                        : "border-[#E7E2D8] dark:border-[#25344D] hover:border-[#101B2C]/40 dark:hover:border-[#BF9A63]/40"
                    }`}
                  >
                    <input
                      type="radio"
                      name="address"
                      checked={addressId === a.id}
                      onChange={() => setAddressId(a.id)}
                      className="h-4 w-4 accent-[#101B2C] dark:accent-[#BF9A63]"
                    />
                    <span className="text-[#374151] dark:text-[#D1D5DB]">
                      <strong className="text-[#101B2C] dark:text-white">{a.label || "Address"}</strong> — {a.recipient_name},{" "}
                      {a.street_address}, {a.town}, {a.county}
                    </span>
                  </label>
                ))}
                <label
                  className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-[#FAF7F2] dark:bg-[#162235] p-3.5 text-sm transition-colors ${
                    addressId === ""
                      ? "border-[#101B2C] dark:border-[#BF9A63] ring-1 ring-[#101B2C]/30 dark:ring-[#BF9A63]/30"
                      : "border-[#E7E2D8] dark:border-[#25344D] hover:border-[#101B2C]/40 dark:hover:border-[#BF9A63]/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="address"
                    checked={addressId === ""}
                    onChange={() => setAddressId("")}
                    className="h-4 w-4 accent-[#101B2C] dark:accent-[#BF9A63]"
                  />
                  <span className="text-[#374151] dark:text-[#D1D5DB]">Use a new address</span>
                </label>
              </div>
            )}

            {addressId === "" && (
              <div className="mt-4 rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] p-5">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClasses}>Recipient name</label>
                    <input
                      required
                      value={newAddress.recipient_name}
                      onChange={(e) => setNewAddress({ ...newAddress, recipient_name: e.target.value })}
                      className={fieldClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Phone number</label>
                    <input
                      required
                      placeholder="0712345678"
                      value={newAddress.phone_number}
                      onChange={(e) => setNewAddress({ ...newAddress, phone_number: e.target.value })}
                      className={fieldClasses}
                    />
                  </div>
                </div>

                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className={labelClasses}>County</label>
                    <input
                      required
                      value={newAddress.county}
                      onChange={(e) => setNewAddress({ ...newAddress, county: e.target.value })}
                      className={fieldClasses}
                    />
                  </div>
                  <div>
                    <label className={labelClasses}>Town</label>
                    <input
                      required
                      value={newAddress.town}
                      onChange={(e) => setNewAddress({ ...newAddress, town: e.target.value })}
                      className={fieldClasses}
                    />
                  </div>
                </div>

                <div className="mt-4">
                  <label className={labelClasses}>Street address</label>
                  <input
                    required
                    value={newAddress.street_address}
                    onChange={(e) => setNewAddress({ ...newAddress, street_address: e.target.value })}
                    className={fieldClasses}
                  />
                </div>

                <div className="mt-4">
                  <label className={labelClasses}>Building / estate (optional)</label>
                  <input
                    value={newAddress.building_or_estate}
                    onChange={(e) => setNewAddress({ ...newAddress, building_or_estate: e.target.value })}
                    className={fieldClasses}
                  />
                </div>
              </div>
            )}

            <h2 className="mt-8 text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]">
              Payment
            </h2>

            <div className="mt-3 flex flex-col gap-2">
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-[#FAF7F2] dark:bg-[#162235] p-3.5 text-sm transition-colors ${
                  paymentMethod === "mpesa"
                    ? "border-[#101B2C] dark:border-[#BF9A63] ring-1 ring-[#101B2C]/30 dark:ring-[#BF9A63]/30"
                    : "border-[#E7E2D8] dark:border-[#25344D] hover:border-[#101B2C]/40 dark:hover:border-[#BF9A63]/40"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "mpesa"}
                  onChange={() => setPaymentMethod("mpesa")}
                  className="h-4 w-4 accent-[#101B2C] dark:accent-[#BF9A63]"
                />
                <span className="text-[#374151] dark:text-[#D1D5DB]">
                  <strong className="text-[#101B2C] dark:text-white">M-Pesa</strong> — pay now via STK push
                </span>
              </label>
              <label
                className={`flex cursor-pointer items-center gap-3 rounded-lg border bg-[#FAF7F2] dark:bg-[#162235] p-3.5 text-sm transition-colors ${
                  paymentMethod === "cod"
                    ? "border-[#101B2C] dark:border-[#BF9A63] ring-1 ring-[#101B2C]/30 dark:ring-[#BF9A63]/30"
                    : "border-[#E7E2D8] dark:border-[#25344D] hover:border-[#101B2C]/40 dark:hover:border-[#BF9A63]/40"
                }`}
              >
                <input
                  type="radio"
                  name="payment"
                  checked={paymentMethod === "cod"}
                  onChange={() => setPaymentMethod("cod")}
                  className="h-4 w-4 accent-[#101B2C] dark:accent-[#BF9A63]"
                />
                <span className="text-[#374151] dark:text-[#D1D5DB]">
                  <strong className="text-[#101B2C] dark:text-white">Pay on Delivery</strong> — pay cash when your order arrives
                </span>
              </label>
            </div>

            {paymentMethod === "mpesa" && (
              <div className="mt-4">
                <label className={labelClasses}>M-Pesa number for the STK push</label>
                <input
                  placeholder="0712345678"
                  value={mpesaPhone}
                  onChange={(e) => setMpesaPhone(e.target.value)}
                  className={fieldClasses}
                />
              </div>
            )}

            <button
              type="submit"
              disabled={step === "placing"}
              className="mt-8 w-full rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-3 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77] disabled:cursor-not-allowed disabled:bg-[#E7E2D8] dark:disabled:bg-[#25344D] disabled:text-[#7C7669] dark:disabled:text-[#9FA8B8]"
            >
              {step === "placing"
                ? "Placing order…"
                : `Place order — ${paymentMethod === "mpesa" ? "pay with M-Pesa" : "pay on delivery"}`}
            </button>
          </form>

          <aside className="h-fit rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] p-5">
            <h3 className="text-sm font-semibold uppercase tracking-wide text-[#7C7669] dark:text-[#9FA8B8]">
              Order summary
            </h3>
            <div className="mt-4 flex flex-col gap-2.5">
              {cart.items.map((item) => (
                <div key={item.id} className="flex items-start justify-between gap-3 text-sm">
                  <span className="text-[#374151] dark:text-[#D1D5DB]">
                    {item.quantity} × {item.product.name}
                  </span>
                  <Price value={item.line_total} size="sm" />
                </div>
              ))}
            </div>
            <div className="mt-4 flex items-center justify-between border-t border-[#E7E2D8] dark:border-[#25344D] pt-4">
              <strong className="text-[#101B2C] dark:text-white">Total</strong>
              <Price value={cart.subtotal} size="lg" />
            </div>
          </aside>
        </div>
      </div>
    </div>
  );
}