"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { useAuth } from "@/context/AuthContext";

export interface CartItem {
  id: string; // cart item id (or variant id fallback)
  variantId?: string; // variant id (falls back to `id` in addToCart)
  productId: string;
  name: string;
  sku: string;
  price: number;
  promotionalPrice: number | null;
  size: string | null;
  color: string | null;
  quantity: number;
  imageUrl: string;
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (item: Omit<CartItem, "quantity">, qty?: number) => Promise<void>;
  removeFromCart: (id: string) => Promise<void>;
  updateQuantity: (id: string, qty: number) => Promise<void>;
  clearCart: () => Promise<void>;
  subtotal: number;
  discount: number;
  total: number;
  coupon: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  shipping: number;
  setShippingCost: (val: number) => void;
  loading: boolean;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { user, loading: authLoading } = useAuth();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);
  const [loading, setLoading] = useState(true);

  const isAuthed = !!user;

  // Hydrate: when authenticated, load the persisted cart from the server;
  // otherwise fall back to localStorage (guest cart).
  useEffect(() => {
    if (authLoading) return;

    if (isAuthed) {
      (async () => {
        try {
          const res = await fetch("/api/cart", { method: "GET" });
          const data = await res.json();
          if (res.ok && data?.cart) {
            setCartItems(
              data.cart.lines.map((l: any) => ({
                id: l.id,
                variantId: l.variantId,
                productId: l.productId,
                name: l.name,
                sku: l.sku,
                price: l.basePrice,
                promotionalPrice: l.unitPrice !== l.basePrice ? l.unitPrice : null,
                size: l.size,
                color: l.color,
                quantity: l.quantity,
                imageUrl: l.imageUrl,
              }))
            );
          }
        } catch (e) {
          console.error("Failed to load cart", e);
        } finally {
          setLoading(false);
        }
      })();
    } else {
      const saved = localStorage.getItem("acaiaba_cart");
      if (saved) {
        try {
          setCartItems(JSON.parse(saved));
        } catch (e) {
          console.error(e);
        }
      }
      setLoading(false);
    }
  }, [isAuthed, authLoading]);

  // Persist guest cart to localStorage on change.
  useEffect(() => {
    if (!isAuthed) {
      localStorage.setItem("acaiaba_cart", JSON.stringify(cartItems));
    }
  }, [cartItems, isAuthed]);

  const addToCart = useCallback(
    async (item: Omit<CartItem, "quantity">, qty: number = 1) => {
      if (isAuthed) {
        try {
          await fetch("/api/cart/items", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ variantId: item.variantId || item.id, quantity: qty }),
          });
          const res = await fetch("/api/cart", { method: "GET" });
          const data = await res.json();
          if (res.ok && data?.cart) {
            setCartItems(
              data.cart.lines.map((l: any) => ({
                id: l.id,
                variantId: l.variantId,
                productId: l.productId,
                name: l.name,
                sku: l.sku,
                price: l.basePrice,
                promotionalPrice: l.unitPrice !== l.basePrice ? l.unitPrice : null,
                size: l.size,
                color: l.color,
                quantity: l.quantity,
                imageUrl: l.imageUrl,
              }))
            );
          }
        } catch (e) {
          console.error("Failed to add to cart", e);
        }
      } else {
        setCartItems((prev) => {
          const existing = prev.find((i) => i.id === item.id || i.variantId === item.variantId);
          if (existing) {
            return prev.map((i) =>
              i.id === existing.id ? { ...i, quantity: i.quantity + qty } : i
            );
          }
          return [...prev, { ...item, id: item.id, quantity: qty }];
        });
      }
    },
    [isAuthed]
  );

  const removeFromCart = useCallback(
    async (id: string) => {
      if (isAuthed) {
        try {
          await fetch(`/api/cart/items/${id}`, { method: "DELETE" });
          const res = await fetch("/api/cart", { method: "GET" });
          const data = await res.json();
          if (res.ok && data?.cart) {
            setCartItems(
              data.cart.lines.map((l: any) => ({
                id: l.id,
                variantId: l.variantId,
                productId: l.productId,
                name: l.name,
                sku: l.sku,
                price: l.basePrice,
                promotionalPrice: l.unitPrice !== l.basePrice ? l.unitPrice : null,
                size: l.size,
                color: l.color,
                quantity: l.quantity,
                imageUrl: l.imageUrl,
              }))
            );
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setCartItems((prev) => prev.filter((i) => i.id !== id));
      }
    },
    [isAuthed]
  );

  const updateQuantity = useCallback(
    async (id: string, qty: number) => {
      if (qty <= 0) {
        await removeFromCart(id);
        return;
      }
      if (isAuthed) {
        try {
          await fetch(`/api/cart/items/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ quantity: qty }),
          });
          const res = await fetch("/api/cart", { method: "GET" });
          const data = await res.json();
          if (res.ok && data?.cart) {
            setCartItems(
              data.cart.lines.map((l: any) => ({
                id: l.id,
                variantId: l.variantId,
                productId: l.productId,
                name: l.name,
                sku: l.sku,
                price: l.basePrice,
                promotionalPrice: l.unitPrice !== l.basePrice ? l.unitPrice : null,
                size: l.size,
                color: l.color,
                quantity: l.quantity,
                imageUrl: l.imageUrl,
              }))
            );
          }
        } catch (e) {
          console.error(e);
        }
      } else {
        setCartItems((prev) => prev.map((i) => (i.id === id ? { ...i, quantity: qty } : i)));
      }
    },
    [isAuthed, removeFromCart]
  );

  const clearCart = useCallback(async () => {
    if (isAuthed) {
      try {
        await fetch("/api/cart", { method: "DELETE" });
      } catch (e) {
        console.error(e);
      }
    }
    setCartItems([]);
    setCoupon(null);
    setDiscount(0);
  }, [isAuthed]);

  // Server-authoritative pricing: recompute from cart items whenever they change.
  const subtotal = cartItems.reduce((sum, item) => {
    const activePrice = item.promotionalPrice ?? item.price;
    return sum + activePrice * item.quantity;
  }, 0);

  const applyCoupon = async (code: string): Promise<boolean> => {
    // Coupons are validated server-side at checkout. For the cart display we only
    // remember the code; the server is the authority for the actual discount.
    const codeClean = code.toUpperCase();
    if (codeClean === "ACAIABA10" && subtotal >= 50) {
      setCoupon(codeClean);
      setDiscount(subtotal * 0.1);
      return true;
    } else if (codeClean === "BEMVINDO50" && subtotal >= 200) {
      setCoupon(codeClean);
      setDiscount(50);
      return true;
    }
    return false;
  };

  const setShippingCost = (val: number) => setShipping(val);

  const total = Math.max(0, subtotal - discount + shipping);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        subtotal,
        discount,
        total,
        coupon,
        applyCoupon,
        shipping,
        setShippingCost,
        loading,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
