import { useState } from "react";
import { useParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as catalogApi from "../../api/catalog";
import * as reviewsApi from "../../api/reviews";
import * as wishlistApi from "../../api/wishlist";
import { unwrapList, extractErrorMessage } from "../../api/client";
import { useAuth } from "../auth/AuthContext";
import { useCart } from "../cart/CartContext";
import Price from "../../components/Price";
import StockBadge from "../../components/StockBadge";
import Spinner from "../../components/Spinner";
import ErrorAlert from "../../components/ErrorAlert";

function Stars({ value }) {
  return (
    <span className="text-[#BF9A63] tracking-[1px]">
      {"★".repeat(value)}{"☆".repeat(5 - value)}
    </span>
  );
}

function ReviewForm({ productId, onPosted }) {
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);
    try {
      await reviewsApi.createReview(productId, { product: productId, rating: Number(rating), comment });
      setComment("");
      onPosted();
    } catch (err) {
      setError(extractErrorMessage(err));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] p-5 shadow-sm mb-6">
      <ErrorAlert message={error} />
      <div className="mb-4">
        <label htmlFor="rating" className="block text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-slate-400 mb-1.5">
          Your rating
        </label>
        <select
          id="rating"
          value={rating}
          onChange={(e) => setRating(e.target.value)}
          className="w-full rounded-md border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#0B121F] px-3 py-2 text-sm text-[#1E2430] dark:text-slate-100 focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25"
        >
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n !== 1 && "s"}</option>)}
        </select>
      </div>
      <div className="mb-4">
        <label htmlFor="comment" className="block text-xs font-semibold uppercase tracking-wide text-[#7C7669] dark:text-slate-400 mb-1.5">
          Comment (optional)
        </label>
        <textarea
          id="comment"
          rows={3}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-md border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#0B121F] px-3 py-2 text-sm text-[#1E2430] dark:text-slate-100 focus:border-[#BF9A63] focus:outline-none focus:ring-2 focus:ring-[#BF9A63]/25"
        />
      </div>
      <button
        type="submit"
        disabled={submitting}
        className="rounded-md border border-[#E7E2D8] dark:border-white/20 bg-white dark:bg-white/5 px-4 py-2 text-sm font-medium text-[#1E2430] dark:text-white transition-colors hover:border-[#BF9A63] hover:text-[#BF9A63]"
      >
        {submitting ? "Posting…" : "Post review"}
      </button>
    </form>
  );
}

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { status } = useAuth();
  const { addItem } = useCart();
  const queryClient = useQueryClient();
  const [qty, setQty] = useState(1);
  const [cartMessage, setCartMessage] = useState("");
  const [cartError, setCartError] = useState("");

  const productQuery = useQuery({ queryKey: ["product", slug], queryFn: () => catalogApi.getProduct(slug) });
  const product = productQuery.data;

  const reviewsQuery = useQuery({
    queryKey: ["reviews", product?.id],
    queryFn: () => reviewsApi.listReviews(product.id),
    enabled: !!product,
  });
  const reviews = unwrapList(reviewsQuery.data);

  if (productQuery.isLoading) return <div className="max-w-7xl mx-auto px-8 py-10"><Spinner label="Loading part" /></div>;
  if (productQuery.isError || !product) return <div className="max-w-7xl mx-auto px-8 py-10"><ErrorAlert message="That part couldn't be found." /></div>;

  const handleAddToCart = async () => {
    setCartError("");
    setCartMessage("");
    try {
      await addItem(product.id, qty);
      setCartMessage(`Added ${qty} to your cart.`);
    } catch (err) {
      setCartError(extractErrorMessage(err));
    }
  };

  const handleWishlist = async () => {
    try {
      await wishlistApi.addToWishlist(product.id);
      setCartMessage("Saved to your wishlist.");
    } catch (err) {
      setCartError(extractErrorMessage(err));
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF7F2] dark:bg-[#0B121F] text-[#1E2430] dark:text-slate-100 transition-colors duration-200 py-12 px-8">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-10">
        <div className="aspect-[4/3] overflow-hidden rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-[#FAF7F2] dark:bg-[#101B2C]">
          {product.images?.[0]?.image ? (
            <img src={product.images[0].image} alt={product.name} className="h-full w-full object-cover" />
          ) : (
            <div className="flex h-full items-center justify-center text-[#7C7669] dark:text-slate-500">No image</div>
          )}
        </div>

        <div>
          <span className="inline-block rounded border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] px-2 py-0.5 font-mono text-[11px] text-[#7C7669] dark:text-slate-300">
            {product.sku}
          </span>
          <h1 className="mt-2 text-3xl font-semibold text-[#101B2C] dark:text-white">{product.name}</h1>
          <p className="mt-1 text-sm text-[#7C7669] dark:text-slate-400">
            {product.brand?.name} · {product.category?.name} · {product.condition === "genuine" ? "Genuine (OEM)" : "Aftermarket"}
          </p>

          <div className="my-6 flex items-center gap-4">
            <Price value={product.price} size="lg" />
            <StockBadge inStock={product.is_in_stock} lowStock={product.is_low_stock} />
          </div>

          <p className="text-sm leading-relaxed text-slate-700 dark:text-slate-300 mb-6">
            {product.description || "No description provided for this part yet."}
          </p>

          {product.fitments?.length > 0 && (
            <div className="mb-6">
              <h3 className="text-sm font-semibold uppercase tracking-wider text-[#101B2C] dark:text-white mb-2">Confirmed fitment</h3>
              <div className="flex flex-wrap gap-2">
                {product.fitments.map((f, i) => (
                  <span key={i} className="rounded-full border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] px-3 py-1 text-xs font-medium text-[#7C7669] dark:text-slate-300">
                    {f.make} {f.model} {f.year}
                  </span>
                ))}
              </div>
            </div>
          )}

          <ErrorAlert message={cartError} />
          {cartMessage && (
            <div className="mb-4 rounded-md bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 p-3 text-sm text-emerald-800 dark:text-emerald-300">
              {cartMessage}
            </div>
          )}

          {status === "authenticated" ? (
            <div className="flex items-center gap-3">
              <input
                type="number"
                min={1}
                value={qty}
                onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
                className="w-20 rounded-md border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] px-3 py-2 text-center text-sm text-[#1E2430] dark:text-slate-100 focus:border-[#BF9A63] focus:outline-none"
              />
              <button
                disabled={!product.is_in_stock}
                onClick={handleAddToCart}
                className="rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-5 py-2.5 text-sm font-medium text-white dark:text-slate-950 transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#A9834E] disabled:cursor-not-allowed disabled:opacity-50"
              >
                {product.is_in_stock ? "Add to cart" : "Out of stock"}
              </button>
              <button
                onClick={handleWishlist}
                className="rounded-md border border-[#E7E2D8] dark:border-white/20 bg-white dark:bg-[#101B2C] px-4 py-2.5 text-sm font-medium text-[#1E2430] dark:text-slate-200 transition-colors hover:border-[#BF9A63] hover:text-[#BF9A63]"
              >
                Save for later
              </button>
            </div>
          ) : (
            <p className="text-sm text-[#7C7669] dark:text-slate-400">
              <a href="/login" className="text-[#BF9A63] underline hover:text-[#A9834E]">Log in</a> to add this part to your cart.
            </p>
          )}
        </div>

        <div className="col-span-1 md:col-span-2 border-t border-[#E7E2D8] dark:border-white/10 pt-10 mt-6">
          <h2 className="text-xl font-semibold text-[#101B2C] dark:text-white mb-6">
            Reviews {reviews.length > 0 && `(${reviews.length})`}
          </h2>

          {status === "authenticated" && (
            <ReviewForm productId={product.id} onPosted={() => queryClient.invalidateQueries({ queryKey: ["reviews", product.id] })} />
          )}

          {reviews.length === 0 ? (
            <p className="text-sm text-[#7C7669] dark:text-slate-400">
              No reviews yet. Reviews are only available from customers whose orders have been delivered.
            </p>
          ) : (
            <div className="space-y-4">
              {reviews.map((r) => (
                <div key={r.id} className="rounded-xl border border-[#E7E2D8] dark:border-white/10 bg-white dark:bg-[#101B2C] p-5 shadow-sm">
                  <div className="flex items-center justify-between">
                    <strong className="text-sm font-semibold text-[#101B2C] dark:text-white">{r.user_name}</strong>
                    <Stars value={r.rating} />
                  </div>
                  {r.verified_purchase && (
                    <span className="mt-2 inline-block rounded-full bg-emerald-50 dark:bg-emerald-950/40 px-2.5 py-0.5 text-[11px] font-medium text-emerald-700 dark:text-emerald-400">
                      Verified purchase
                    </span>
                  )}
                  {r.comment && <p className="mt-3 text-sm leading-relaxed text-slate-700 dark:text-slate-300">{r.comment}</p>}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}