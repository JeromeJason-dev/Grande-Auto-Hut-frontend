import { createContext, useContext, useCallback, useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";
import * as cartApi from "../../api/cart";

const CartContext = createContext(null);

export function CartProvider({ children }) {
  const { status } = useAuth();
  const [cart, setCart] = useState(null);
  const [loading, setLoading] = useState(false);

  const refresh = useCallback(async () => {
    if (status !== "authenticated") return;
    setLoading(true);
    try {
      const data = await cartApi.getCart();
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [status]);

  useEffect(() => {
    if (status === "authenticated") refresh();
    if (status === "anonymous") setCart(null);
  }, [status, refresh]);

  // Accepts either a bare product id, or a product-like object carrying
  // the real backend product id (ProductCard passes { id: <real UUID
  // of the selected condition's Product row>, ... }).
  const addItem = useCallback(async (product, quantity = 1) => {
    const isObject = product !== null && typeof product === "object";
    const productId = isObject ? product.id : product;

    if (!productId) {
      throw new Error("addItem: missing product id");
    }

    const data = await cartApi.addCartItem(productId, quantity);
    setCart(data);
    return data;
  }, []);

  const updateItem = useCallback(async (itemId, quantity) => {
    const data = await cartApi.updateCartItem(itemId, quantity);
    setCart(data);
    return data;
  }, []);

  const removeItem = useCallback(async (itemId) => {
    const data = await cartApi.removeCartItem(itemId);
    setCart(data);
    return data;
  }, []);

  const itemCount = cart?.items?.reduce((sum, i) => sum + i.quantity, 0) || 0;

  return (
    <CartContext.Provider value={{ cart, loading, itemCount, refresh, addItem, updateItem, removeItem }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}