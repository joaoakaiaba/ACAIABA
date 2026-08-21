"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export interface CartItem {
  id: string; // SKU or Variant ID
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
  addToCart: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  removeFromCart: (id: string) => void;
  updateQuantity: (id: string, qty: number) => void;
  clearCart: () => void;
  subtotal: number;
  discount: number;
  total: number;
  coupon: string | null;
  applyCoupon: (code: string) => Promise<boolean>;
  shipping: number;
  setShippingCost: (val: number) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [coupon, setCoupon] = useState<string | null>(null);
  const [discount, setDiscount] = useState(0);
  const [shipping, setShipping] = useState(0);

  useEffect(() => {
    const saved = localStorage.getItem("acaiaba_cart");
    if (saved) {
      try {
        setCartItems(JSON.parse(saved));
      } catch (e) {
        console.error(e);
      }
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("acaiaba_cart", JSON.stringify(cartItems));
  }, [cartItems]);

  const addToCart = (item: Omit<CartItem, "quantity">, qty: number = 1) => {
    setCartItems(prev => {
      const existing = prev.find(i => i.id === item.id);
      if (existing) {
        return prev.map(i => i.id === item.id ? { ...i, quantity: i.quantity + qty } : i);
      }
      return [...prev, { ...item, quantity: qty }];
    });
  };

  const removeFromCart = (id: string) => {
    setCartItems(prev => prev.filter(i => i.id !== id));
  };

  const updateQuantity = (id: string, qty: number) => {
    if (qty <= 0) {
      removeFromCart(id);
      return;
    }
    setCartItems(prev => prev.map(i => i.id === id ? { ...i, quantity: qty } : i));
  };

  const clearCart = () => {
    setCartItems([]);
    setCoupon(null);
    setDiscount(0);
  };

  const subtotal = cartItems.reduce((sum, item) => {
    const activePrice = item.promotionalPrice ?? item.price;
    return sum + (activePrice * item.quantity);
  }, 0);

  const applyCoupon = async (code: string): Promise<boolean> => {
    // Simulated validation against seed coupons
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

  const setShippingCost = (val: number) => {
    setShipping(val);
  };

  const total = Math.max(0, subtotal - discount + shipping);

  return (
    <CartContext.Provider value={{
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
      setShippingCost
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (!context) throw new Error("useCart must be used within CartProvider");
  return context;
}
