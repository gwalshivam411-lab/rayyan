import React, { createContext, useContext, useState, useEffect } from 'react';
import { MenuItem, PickupSlot } from '../types';
import { StorageService } from '../lib/storage';

export interface CartItem {
  menuItem: MenuItem;
  quantity: number;
  specialInstructions?: string;
}

interface CartContextType {
  items: CartItem[];
  addItem: (item: MenuItem, quantity?: number, specialInstructions?: string) => { success: boolean; message?: string };
  updateQuantity: (itemId: string, quantity: number) => void;
  removeItem: (itemId: string) => void;
  clearCart: () => void;
  selectedSlot: PickupSlot | null;
  setSelectedSlot: (slot: PickupSlot | null) => void;
  itemCount: number;
  subtotal: number;
  taxAmount: number;
  fees: number;
  totalAmount: number;
  orderNote: string;
  setOrderNote: (note: string) => void;
  isCartDrawerOpen: boolean;
  setIsCartDrawerOpen: (open: boolean) => void;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'cb_active_cart_v1';
const CART_SLOT_KEY = 'cb_active_slot_v1';

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [selectedSlot, setSelectedSlotState] = useState<PickupSlot | null>(() => {
    try {
      const saved = localStorage.getItem(CART_SLOT_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  const [orderNote, setOrderNote] = useState('');
  const [isCartDrawerOpen, setIsCartDrawerOpen] = useState(false);

  useEffect(() => {
    try {
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
    } catch (e) {
      console.error(e);
    }
  }, [items]);

  const setSelectedSlot = (slot: PickupSlot | null) => {
    setSelectedSlotState(slot);
    try {
      if (slot) {
        localStorage.setItem(CART_SLOT_KEY, JSON.stringify(slot));
      } else {
        localStorage.removeItem(CART_SLOT_KEY);
      }
    } catch (e) {
      console.error(e);
    }
  };

  const addItem = (item: MenuItem, quantity: number = 1, specialInstructions?: string) => {
    // Check if item is available
    if (!item.isAvailable || item.stockQuantity <= 0) {
      return { success: false, message: `${item.name} is currently sold out!` };
    }

    // Check canteen pause status
    const config = StorageService.getConfig();
    if (config.isRushHourPaused) {
      return { success: false, message: 'Canteen is temporarily pausing new orders for rush hour.' };
    }

    setItems((prev) => {
      const existingIdx = prev.findIndex((i) => i.menuItem.id === item.id);
      if (existingIdx >= 0) {
        const currentQty = prev[existingIdx].quantity;
        const newQty = Math.min(item.stockQuantity, currentQty + quantity);
        const updated = [...prev];
        updated[existingIdx] = {
          ...updated[existingIdx],
          quantity: newQty,
          specialInstructions: specialInstructions || updated[existingIdx].specialInstructions,
        };
        return updated;
      } else {
        const allowedQty = Math.min(item.stockQuantity, quantity);
        return [...prev, { menuItem: item, quantity: allowedQty, specialInstructions }];
      }
    });

    return { success: true };
  };

  const updateQuantity = (itemId: string, quantity: number) => {
    if (quantity <= 0) {
      removeItem(itemId);
      return;
    }
    setItems((prev) =>
      prev.map((item) => {
        if (item.menuItem.id === itemId) {
          const clamped = Math.min(item.menuItem.stockQuantity, quantity);
          return { ...item, quantity: clamped };
        }
        return item;
      })
    );
  };

  const removeItem = (itemId: string) => {
    setItems((prev) => prev.filter((item) => item.menuItem.id !== itemId));
  };

  const clearCart = () => {
    setItems([]);
    setSelectedSlot(null);
    setOrderNote('');
    localStorage.removeItem(CART_STORAGE_KEY);
    localStorage.removeItem(CART_SLOT_KEY);
  };

  const itemCount = items.reduce((acc, curr) => acc + curr.quantity, 0);
  const subtotal = items.reduce((acc, curr) => acc + curr.menuItem.price * curr.quantity, 0);
  const config = StorageService.getConfig();
  const taxAmount = Math.round(subtotal * (config.gstRate || 0.05) * 100) / 100;
  const fees = 0; // ₹0 convenience fee for students
  const totalAmount = subtotal + taxAmount + fees;

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        selectedSlot,
        setSelectedSlot,
        itemCount,
        subtotal,
        taxAmount,
        fees,
        totalAmount,
        orderNote,
        setOrderNote,
        isCartDrawerOpen,
        setIsCartDrawerOpen,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};
