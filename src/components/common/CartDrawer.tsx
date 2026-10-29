import React, { useState } from 'react';
import { useCart } from '../../context/CartContext';
import { FoodArtVisual } from './FoodArtVisual';
import { X, Trash2, Plus, Minus, ArrowRight, ShoppingBag, Clock, ShieldCheck } from 'lucide-react';

interface CartDrawerProps {
  onProceedToCheckout: () => void;
}

export const CartDrawer: React.FC<CartDrawerProps> = ({ onProceedToCheckout }) => {
  const {
    items,
    updateQuantity,
    removeItem,
    clearCart,
    subtotal,
    taxAmount,
    fees,
    totalAmount,
    selectedSlot,
    isCartDrawerOpen,
    setIsCartDrawerOpen,
    orderNote,
    setOrderNote,
  } = useCart();

  const [confirmClear, setConfirmClear] = useState(false);

  if (!isCartDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-md bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Drawer Header */}
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50/70">
          <div className="flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-emerald-700" />
            <h2 className="font-bold text-stone-900 text-base">Your Food Tray</h2>
            <span className="text-xs text-stone-500 font-medium">
              ({items.length} {items.length === 1 ? 'item' : 'items'})
            </span>
          </div>

          <div className="flex items-center gap-1">
            {items.length > 0 && (
              <button
                onClick={() => setConfirmClear(true)}
                className="p-1.5 text-stone-400 hover:text-red-600 rounded-md transition-colors"
                title="Clear tray"
                aria-label="Clear all items from tray"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="p-1.5 text-stone-500 hover:text-stone-900 rounded-md transition-colors"
              aria-label="Close cart tray"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Clear Confirmation Banner */}
        {confirmClear && (
          <div className="bg-red-50 p-3 border-b border-red-200 flex items-center justify-between text-xs text-red-900 animate-in fade-in">
            <span>Clear all items from tray?</span>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  clearCart();
                  setConfirmClear(false);
                }}
                className="px-2.5 py-1 bg-red-600 text-white rounded font-medium hover:bg-red-700"
              >
                Yes, Clear
              </button>
              <button
                onClick={() => setConfirmClear(false)}
                className="px-2.5 py-1 bg-white border border-stone-300 rounded font-medium hover:bg-stone-50 text-stone-700"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Drawer Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center">
            <div className="w-16 h-16 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mb-4">
              <ShoppingBag className="w-8 h-8" />
            </div>
            <h3 className="font-semibold text-stone-800 text-base mb-1">Your tray is empty</h3>
            <p className="text-stone-500 text-xs max-w-xs leading-relaxed mb-6">
              Browse the campus canteen menu and add your favorite snacks, meals, or drinks.
            </p>
            <button
              onClick={() => setIsCartDrawerOpen(false)}
              className="px-5 py-2.5 text-xs font-semibold text-emerald-800 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors border border-emerald-200"
            >
              Explore Today's Menu
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {/* Pickup slot banner if selected */}
            <div className="p-3 bg-emerald-50/80 border border-emerald-200/70 rounded-xl flex items-center justify-between text-xs">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-emerald-700 shrink-0" />
                <div>
                  <span className="font-semibold text-emerald-950 block">
                    {selectedSlot ? `Pickup: ${selectedSlot.startTime} - ${selectedSlot.endTime}` : 'No slot chosen yet'}
                  </span>
                  <span className="text-emerald-700">
                    {selectedSlot ? 'Slot reserved during checkout' : 'Select your pickup time on next screen'}
                  </span>
                </div>
              </div>
            </div>

            {/* Item list */}
            <div className="divide-y divide-stone-100">
              {items.map((cartItem) => (
                <div key={cartItem.menuItem.id} className="py-3 flex items-start gap-3">
                  <div className="w-16 h-14 rounded-lg overflow-hidden shrink-0 border border-stone-200">
                    <FoodArtVisual item={cartItem.menuItem} size="sm" />
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-1">
                      <h4 className="text-xs font-semibold text-stone-900 truncate">
                        {cartItem.menuItem.name}
                      </h4>
                      <button
                        onClick={() => removeItem(cartItem.menuItem.id)}
                        className="text-stone-400 hover:text-red-500 transition-colors p-0.5"
                        aria-label="Remove item"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    <div className="text-xs font-bold text-stone-800 mt-0.5 tabular-nums">
                      ₹{cartItem.menuItem.price * cartItem.quantity}
                    </div>

                    {cartItem.specialInstructions && (
                      <p className="text-[11px] text-stone-500 italic truncate mt-0.5">
                        "{cartItem.specialInstructions}"
                      </p>
                    )}

                    <div className="mt-2 flex items-center justify-between">
                      <span className="text-[11px] text-stone-400">
                        ₹{cartItem.menuItem.price} each
                      </span>

                      <div className="flex items-center bg-stone-100 border border-stone-200 rounded-md">
                        <button
                          onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity - 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-200 rounded-l transition-colors"
                          aria-label="Decrease quantity"
                        >
                          <Minus className="w-3 h-3" />
                        </button>
                        <span className="w-6 text-center text-xs font-bold text-stone-800 tabular-nums">
                          {cartItem.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(cartItem.menuItem.id, cartItem.quantity + 1)}
                          className="w-6 h-6 flex items-center justify-center text-stone-600 hover:bg-stone-200 rounded-r transition-colors"
                          aria-label="Increase quantity"
                        >
                          <Plus className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Note to kitchen */}
            <div className="pt-2">
              <label htmlFor="cartOrderNote" className="block text-xs font-medium text-stone-600 mb-1">
                Order note for canteen counter
              </label>
              <input
                id="cartOrderNote"
                type="text"
                placeholder="e.g. Please keep pack separate, extra napkins"
                value={orderNote}
                onChange={(e) => setOrderNote(e.target.value)}
                className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-800"
              />
            </div>
          </div>
        )}

        {/* Drawer Footer with calculation */}
        {items.length > 0 && (
          <div className="p-4 border-t border-stone-200 bg-stone-50/70 space-y-3">
            <div className="space-y-1.5 text-xs text-stone-600">
              <div className="flex items-center justify-between">
                <span>Subtotal</span>
                <span className="font-semibold text-stone-800 tabular-nums">₹{subtotal.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>GST (5% campus food tax)</span>
                <span className="font-semibold text-stone-800 tabular-nums">₹{taxAmount.toFixed(2)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span>Campus Convenience Fee</span>
                <span className="text-emerald-700 font-semibold">FREE (₹0)</span>
              </div>
              <div className="pt-2 border-t border-stone-200 flex items-center justify-between text-sm font-bold text-stone-900">
                <span>To Pay</span>
                <span className="text-base text-emerald-800 tabular-nums">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 text-[11px] text-stone-500">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Zero cancellation fee prior to kitchen acceptance</span>
            </div>

            <button
              onClick={() => {
                setIsCartDrawerOpen(false);
                onProceedToCheckout();
              }}
              className="w-full py-3 px-4 bg-emerald-700 hover:bg-emerald-800 active:scale-98 transition-all rounded-xl text-white font-semibold text-sm flex items-center justify-center gap-2 shadow-sm"
            >
              <span>Proceed to Pickup & Pay</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
