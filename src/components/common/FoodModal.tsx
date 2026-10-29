import React, { useState } from 'react';
import { MenuItem } from '../../types';
import { useCart } from '../../context/CartContext';
import { FoodArtVisual } from './FoodArtVisual';
import { X, Clock, Flame, ShieldAlert, Plus, Minus, Check } from 'lucide-react';

interface FoodModalProps {
  item: MenuItem | null;
  onClose: () => void;
}

export const FoodModal: React.FC<FoodModalProps> = ({ item, onClose }) => {
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const [specialNote, setSpecialNote] = useState('');
  const [addedSuccess, setAddedSuccess] = useState(false);

  if (!item) return null;

  const isSoldOut = !item.isAvailable || item.stockQuantity <= 0;

  const handleAddToCart = () => {
    if (isSoldOut) return;
    const sanitizedNote = specialNote.trim().slice(0, 100);
    addItem(item, quantity, sanitizedNote || undefined);
    setAddedSuccess(true);
    setTimeout(() => {
      setAddedSuccess(false);
      onClose();
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-lg bg-white rounded-2xl shadow-xl overflow-hidden border border-stone-200 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-30 p-2 rounded-full bg-white/80 hover:bg-white text-stone-600 hover:text-stone-900 transition-colors shadow-xs"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Hero Visual */}
        <div className="relative">
          <FoodArtVisual item={item} size="lg" />
          <div className="absolute top-3 left-3 z-20 bg-white/95 backdrop-blur-xs px-2.5 py-1 rounded-md border border-stone-200 text-xs font-semibold text-stone-700 flex items-center gap-1.5 shadow-xs">
            <div
              className={`w-3 h-3 border flex items-center justify-center ${
                item.dietaryType === 'veg' || item.dietaryType === 'vegan'
                  ? 'border-emerald-700'
                  : 'border-red-700'
              }`}
            >
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  item.dietaryType === 'veg' || item.dietaryType === 'vegan'
                    ? 'bg-emerald-600'
                    : 'bg-red-600'
                }`}
              />
            </div>
            <span className="capitalize">{item.dietaryType}</span>
          </div>
        </div>

        {/* Modal Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div>
            <div className="flex items-center gap-2 text-xs text-stone-500 mb-1">
              <span className="flex items-center gap-1">
                <Clock className="w-3.5 h-3.5 text-stone-400" />
                <span>{item.preparationTimeMinutes} mins preparation</span>
              </span>
              <span aria-hidden="true">·</span>
              <span>In Stock: {item.stockQuantity} servings</span>
              {item.isSpicy && (
                <>
                  <span aria-hidden="true">·</span>
                  <span className="flex items-center gap-0.5 text-amber-700 font-medium">
                    <Flame className="w-3.5 h-3.5" />
                    <span>Spicy</span>
                  </span>
                </>
              )}
            </div>

            <h2 className="text-xl font-bold text-stone-900">{item.name}</h2>
            <div className="text-2xl font-extrabold text-emerald-800 mt-1 tabular-nums">
              ₹{item.price}
            </div>
          </div>

          <p className="text-stone-600 text-sm leading-relaxed">{item.description}</p>

          {/* Allergen advisory */}
          {item.allergenInformation && (
            <div className="p-3 bg-amber-50/70 border border-amber-200/60 rounded-xl text-xs text-amber-900 flex items-start gap-2.5">
              <ShieldAlert className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
              <div>
                <strong className="font-semibold block text-amber-950 mb-0.5">Kitchen Allergen Note:</strong>
                <span>{item.allergenInformation}</span>
              </div>
            </div>
          )}

          {/* Special instructions */}
          <div>
            <label htmlFor="specialInstructions" className="block text-xs font-semibold text-stone-700 mb-1.5">
              Cooking Instructions (Optional, max 100 chars)
            </label>
            <input
              id="specialInstructions"
              type="text"
              maxLength={100}
              placeholder="e.g. Less spicy, pack sambar separately, extra crispy"
              value={specialNote}
              onChange={(e) => setSpecialNote(e.target.value)}
              className="w-full text-xs px-3 py-2 border border-stone-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-600/30 focus:border-emerald-600 text-stone-800 placeholder:text-stone-400"
            />
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 bg-stone-50 border-t border-stone-200 flex items-center justify-between gap-4">
          {/* Quantity selector */}
          <div className="flex items-center bg-white border border-stone-300 rounded-lg p-1">
            <button
              onClick={() => setQuantity((q) => Math.max(1, q - 1))}
              disabled={quantity <= 1 || isSoldOut}
              aria-label="Decrease quantity"
              className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-30 rounded-md transition-colors"
            >
              <Minus className="w-4 h-4" />
            </button>
            <span className="w-10 text-center font-bold text-sm text-stone-900 tabular-nums">
              {quantity}
            </span>
            <button
              onClick={() => setQuantity((q) => Math.min(item.stockQuantity, q + 1))}
              disabled={quantity >= item.stockQuantity || isSoldOut}
              aria-label="Increase quantity"
              className="w-8 h-8 flex items-center justify-center text-stone-700 hover:bg-stone-100 disabled:opacity-30 rounded-md transition-colors"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {/* Add button */}
          <button
            onClick={handleAddToCart}
            disabled={isSoldOut}
            className={`flex-1 py-3 px-5 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all shadow-sm ${
              isSoldOut
                ? 'bg-stone-200 text-stone-500 cursor-not-allowed'
                : addedSuccess
                ? 'bg-emerald-600 text-white'
                : 'bg-emerald-700 hover:bg-emerald-800 active:scale-98 text-white'
            }`}
          >
            {addedSuccess ? (
              <>
                <Check className="w-4 h-4" />
                <span>Added to Tray</span>
              </>
            ) : isSoldOut ? (
              <span>Item Sold Out</span>
            ) : (
              <span>Add to Tray · ₹{item.price * quantity}</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};
