"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

// Cart store with localStorage persistence so the buyer doesn't lose
// their cart on page refresh or when toggling the chat modal.
export interface CartItem {
  id: string;
  name: string;
  price: number;
  imageBase64?: string;
  category?: string;
  qty: number;
}

interface CartState {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">) => void;
  remove: (id: string) => void;
  setQty: (id: string, qty: number) => void;
  clear: () => void;
  count: () => number;
  total: () => number;
}

// Unique storage key per agent handle so two agents in the same browser
// don't share carts. The shop-view reads its own handle and passes a
// namespaced key (see useCartStore below).
function namespacedKey(handle: string) {
  return `lovon-cart-v1:${handle.toLowerCase()}`;
}

export function createCartStore(handle: string) {
  return create<CartState>()(
    persist(
      (set, get) => ({
        items: [],
        add: (item) =>
          set((s) => {
            const existing = s.items.find((i) => i.id === item.id);
            if (existing) {
              return {
                items: s.items.map((i) =>
                  i.id === item.id ? { ...i, qty: i.qty + 1 } : i
                ),
              };
            }
            return { items: [...s.items, { ...item, qty: 1 }] };
          }),
        remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
        setQty: (id, qty) =>
          set((s) => ({
            items:
              qty <= 0
                ? s.items.filter((i) => i.id !== id)
                : s.items.map((i) => (i.id === id ? { ...i, qty } : i)),
          })),
        clear: () => set({ items: [] }),
        count: () => get().items.reduce((acc, i) => acc + i.qty, 0),
        total: () => get().items.reduce((acc, i) => acc + i.price * i.qty, 0),
      }),
      {
        name: namespacedKey(handle),
        // Bump this if the shape of CartItem ever changes incompatibly
        version: 1,
      }
    )
  );
}