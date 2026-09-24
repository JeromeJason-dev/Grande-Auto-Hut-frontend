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
    <span style={{ color: "var(--accent)", letterSpacing: "1px" }}>
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
    <form onSubmit={handleSubmit} className="card" style={{ padding: "1rem", marginBottom: "1.5rem" }}>
      <ErrorAlert message={error} />
      <div className="field">
        <label htmlFor="rating">Your rating</label>
        <select id="rating" value={rating} onChange={(e) => setRating(e.target.value)}>
          {[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{n} star{n !== 1 && "s"}</option>)}
        </select>
      </div>
      <div className="field">
        <label htmlFor="comment">Comment (optional)</label>
        <textarea id="comment" rows={3} value={comment} onChange={(e) => setComment(e.target.value)} />
      </div>
      <button type="submit" className="btn btn-secondary" disabled={submitting}>
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

  if (productQuery.isLoading) return <div className="container" style={{ padding: "2.5rem 1.5rem" }}><Spinner label="Loading part" /></div>;
  if (productQuery.isError || !product) return <div className="container" style={{ padding: "2.5rem 1.5rem" }}><ErrorAlert message="That part couldn't be found." /></div>;

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
    <div className="container" style={{ padding: "2.5rem 1.5rem", display: "grid", gridTemplateColumns: "1fr 1fr", gap: "2.5rem" }}>
      <div style={{ aspectRatio: "4/3", background: "var(--surface)", border: "1px solid var(--line)", borderRadius: "var(--radius)" }}>
        {product.images?.[0]?.image ? (
          <img src={product.images[0].image} alt={product.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
        ) : (
          <div className="row" style={{ height: "100%", justifyContent: "center", color: "var(--line-strong)" }}>No image</div>
        )}
      </div>

      <div>
        <span className="badge badge-neutral mono">{product.sku}</span>
        <h1 style={{ marginTop: "0.5rem" }}>{product.name}</h1>
        <p style={{ color: "var(--ink-soft)" }}>{product.brand?.name} · {product.category?.name} · {product.condition === "genuine" ? "Genuine (OEM)" : "Aftermarket"}</p>

        <div className="row" style={{ gap: "1rem", margin: "1rem 0" }}>
          <Price value={product.price} size="lg" />
          <StockBadge inStock={product.is_in_stock} lowStock={product.is_low_stock} />
        </div>

        <p>{product.description || "No description provided for this part yet."}</p>

        {product.fitments?.length > 0 && (
          <div style={{ margin: "1rem 0" }}>
            <h3>Confirmed fitment</h3>
            <div className="row" style={{ gap: "0.4rem", flexWrap: "wrap" }}>
              {product.fitments.map((f, i) => (
                <span key={i} className="badge badge-steel">{f.make} {f.model} {f.year}</span>
              ))}
            </div>
          </div>
        )}

        <ErrorAlert message={cartError} />
        {cartMessage && <div className="alert alert-success">{cartMessage}</div>}

        {status === "authenticated" ? (
          <div className="row" style={{ gap: "0.75rem" }}>
            <input
              type="number" min={1} value={qty} style={{ width: 70 }}
              onChange={(e) => setQty(Math.max(1, Number(e.target.value)))}
              className="field" 
            />
            <button className="btn btn-primary" disabled={!product.is_in_stock} onClick={handleAddToCart}>
              {product.is_in_stock ? "Add to cart" : "Out of stock"}
            </button>
            <button className="btn btn-secondary" onClick={handleWishlist}>Save for later</button>
          </div>
        ) : (
          <p><a href="/login">Log in</a> to add this part to your cart.</p>
        )}
      </div>

      <div style={{ gridColumn: "1 / -1", borderTop: "1px solid var(--line)", paddingTop: "2rem" }}>
        <h2>Reviews {reviews.length > 0 && `(${reviews.length})`}</h2>

        {status === "authenticated" && (
          <ReviewForm productId={product.id} onPosted={() => queryClient.invalidateQueries({ queryKey: ["reviews", product.id] })} />
        )}

        {reviews.length === 0 ? (
          <p style={{ color: "var(--ink-soft)" }}>No reviews yet. Reviews are only available from customers whose orders have been delivered.</p>
        ) : (
          <div className="stack" style={{ gap: "1rem" }}>
            {reviews.map((r) => (
              <div key={r.id} className="card" style={{ padding: "1rem" }}>
                <div className="spread">
                  <strong>{r.user_name}</strong>
                  <Stars value={r.rating} />
                </div>
                {r.verified_purchase && <span className="badge badge-success" style={{ marginTop: "0.35rem" }}>Verified purchase</span>}
                {r.comment && <p style={{ marginTop: "0.5rem", marginBottom: 0 }}>{r.comment}</p>}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
