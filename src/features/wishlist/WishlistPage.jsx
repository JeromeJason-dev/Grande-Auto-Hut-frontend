import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import * as wishlistApi from "../../api/wishlist";
import { useCart } from "../cart/CartContext";
import { unwrapList, extractErrorMessage } from "../../api/client";
import ProductCard from "../../components/ProductCard";
import Spinner from "../../components/Spinner";
import EmptyState from "../../components/EmptyState";
import ErrorAlert from "../../components/ErrorAlert";
import { useState } from "react";

export default function WishlistPage() {
  const queryClient = useQueryClient();
  const { addItem } = useCart();
  const [error, setError] = useState("");
  const { data, isLoading } = useQuery({ queryKey: ["wishlist"], queryFn: wishlistApi.getWishlist });
  const items = unwrapList(data);

  const handleRemove = async (productId) => {
    setError("");
    try {
      await wishlistApi.removeFromWishlist(productId);
      queryClient.invalidateQueries({ queryKey: ["wishlist"] });
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  const handleAddToCart = async (productId) => {
    setError("");
    try {
      await addItem(productId, 1);
    } catch (err) {
      setError(extractErrorMessage(err));
    }
  };

  return (
    <div className="container" style={{ padding: "2.5rem 1.5rem" }}>
      <h1>Wishlist</h1>
      <ErrorAlert message={error} />

      {isLoading && <Spinner label="Loading wishlist" />}

      {!isLoading && items.length === 0 && (
        <EmptyState
          title="Nothing saved yet"
          body="Save parts you're considering so you can find them again later."
          action={<Link to="/catalog" className="btn btn-primary btn-sm" style={{ marginTop: "0.75rem" }}>Browse catalog</Link>}
        />
      )}

      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(220px, 1fr))", gap: "1rem" }}>
        {items.map((item) => (
          <div key={item.id} className="stack" style={{ gap: "0.5rem" }}>
            <ProductCard product={item.product} />
            <div className="row" style={{ gap: "0.5rem" }}>
              <button className="btn btn-primary btn-sm" style={{ flex: 1 }} onClick={() => handleAddToCart(item.product.id)}>Add to cart</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleRemove(item.product.id)}>Remove</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
