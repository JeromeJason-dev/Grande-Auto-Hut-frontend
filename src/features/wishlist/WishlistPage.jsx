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
    <div className="min-h-full bg-white dark:bg-[#0B1320] px-6 py-10 transition-colors">
      <div className="mx-auto max-w-6xl">
        <h1 className="text-2xl font-semibold text-[#101B2C] dark:text-white mb-6">Wishlist</h1>
        
        {error && (
          <div className="mb-6">
            <ErrorAlert message={error} />
          </div>
        )}

        {isLoading && <Spinner label="Loading wishlist" />}

        {!isLoading && items.length === 0 && (
          <div className="rounded-xl border border-dashed border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] px-6 py-16">
            <EmptyState
              title="Nothing saved yet"
              body="Save parts you're considering so you can find them again later."
              action={
                <Link
                  to="/catalog"
                  className="mt-3 inline-block rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-4 py-2 text-sm font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77]"
                >
                  Browse catalog
                </Link>
              }
            />
          </div>
        )}

        {items.length > 0 && (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {items.map((item) => (
              <div
                key={item.id}
                className="flex flex-col justify-between rounded-xl border border-[#E7E2D8] dark:border-[#25344D] bg-[#FAF7F2] dark:bg-[#162235] p-3"
              >
                <div>
                  <ProductCard product={item.product} />
                </div>
                <div className="mt-3 flex gap-2">
                  <button
                    className="flex-1 rounded-md bg-[#101B2C] dark:bg-[#BF9A63] px-3 py-2 text-xs font-medium text-white dark:text-[#0B1320] transition-colors hover:bg-[#1B2C46] dark:hover:bg-[#D4AF77]"
                    onClick={() => handleAddToCart(item.product.id)}
                  >
                    Add to cart
                  </button>
                  <button
                    className="rounded-md border border-[#E7E2D8] dark:border-[#25344D] bg-transparent px-3 py-2 text-xs font-medium text-[#7C7669] dark:text-[#9FA8B8] transition-colors hover:bg-white dark:hover:bg-[#0B1320] hover:text-[#101B2C] dark:hover:text-white"
                    onClick={() => handleRemove(item.product.id)}
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}