import React from 'react';
import { MenuItem } from '../../types';
import { useCart } from '../../context/CartContext';
import { FoodArtVisual } from './FoodArtVisual';
import { Plus, Minus, Clock, Flame } from 'lucide-react';

interface FoodCardProps {
  item: MenuItem;
  onOpenDetails: (item: MenuItem) => void;
}

export const FoodCard: React.FC<FoodCardProps> = ({ item, onOpenDetails }) => {
  const { items, addItem, updateQuantity } = useCart();

  const cartEntry = items.find((ci) => ci.menuItem.id === item.id);
  const currentQty = cartEntry?.quantity || 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addItem(item, 1);
  };

  const handleIncrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(item.id, currentQty + 1);
  };

  const handleDecrement = (e: React.MouseEvent) => {
    e.stopPropagation();
    updateQuantity(item.id, currentQty - 1);
  };

  const isSoldOut = !item.isAvailable || item.stockQuantity <= 0;

  return (
    <div
      onClick={() => onOpenDetails(item)}
      className={`group relative flex flex-col justify-between bg-white rounded-xl border border-stone-200/80 hover:border-emerald-500/50 shadow-xs hover:shadow-md transition-all duration-200 cursor-pointer overflow-hidden ${
        isSoldOut ? 'opacity-70 grayscale-[30%]' : ''
      }`}
    >
      {/* Visual illustration top */}
      <div className="relative">
        <FoodArtVisual item={item} size="md" />

        {/* Dietary indicator dot */}
        <div className="absolute top-2.5 left-2.5 z-20 bg-white/90 backdrop-blur-xs p-1 rounded-sm border border-stone-200 shadow-2xs">
          <div
            className={`w-3.5 h-3.5 border flex items-center justify-center ${
              item.dietaryType === 'veg' || item.dietaryType === 'vegan'
                ? 'border-emerald-700'
                : 'border-red-700'
            }`}
          >
            <div
              className={`w-2 h-2 rounded-full ${
                item.dietaryType === 'veg' || item.dietaryType === 'vegan'
                  ? 'bg-emerald-600'
                  : 'bg-red-600'
              }`}
            />
          </div>
        </div>

        {/* Sold out overlay tag */}
        {isSoldOut && (
          <div className="absolute inset-0 bg-stone-900/40 backdrop-blur-[1px] flex items-center justify-center z-20">
            <span className="bg-stone-900 text-white text-xs font-semibold px-3 py-1 rounded-md uppercase tracking-wider">
              Sold Out Today
            </span>
          </div>
        )}
      </div>

      {/* Card Body */}
      <div className="p-4 flex flex-col flex-1 justify-between">
        <div>
          {/* Unboxed metadata row */}
          <div className="flex items-center gap-1.5 text-xs text-stone-500 mb-1">
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3 text-stone-400" />
              <span>{item.preparationTimeMinutes}m prep</span>
            </span>
            <span aria-hidden="true" className="text-stone-300">·</span>
            <span className="capitalize">{item.dietaryType}</span>
            {item.isSpicy && (
              <>
                <span aria-hidden="true" className="text-stone-300">·</span>
                <span className="flex items-center gap-0.5 text-amber-700">
                  <Flame className="w-3 h-3" />
                  <span>Spicy</span>
                </span>
              </>
            )}
          </div>

          {/* Title */}
          <h3 className="font-semibold text-stone-900 text-base group-hover:text-emerald-700 transition-colors line-clamp-1">
            {item.name}
          </h3>

          {/* Description */}
          <p className="text-stone-500 text-xs mt-1 line-clamp-2 leading-relaxed">
            {item.description}
          </p>
        </div>

        {/* Pricing and Cart Stepper Row */}
        <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between">
          <div>
            <span className="text-xs text-stone-400 block leading-none mb-0.5">Price</span>
            <div className="text-lg font-bold text-stone-900 tabular-nums">
              ₹{item.price}
            </div>
          </div>

          <div>
            {isSoldOut ? (
              <button
                disabled
                className="px-3 py-1.5 text-xs font-medium text-stone-400 bg-stone-100 rounded-lg cursor-not-allowed"
              >
                Unavailable
              </button>
            ) : currentQty === 0 ? (
              <button
                onClick={handleAdd}
                className="px-4 py-1.5 text-xs font-semibold text-white bg-emerald-700 hover:bg-emerald-800 active:scale-95 transition-all rounded-lg flex items-center gap-1 shadow-2xs"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add</span>
              </button>
            ) : (
              <div
                onClick={(e) => e.stopPropagation()}
                className="flex items-center bg-emerald-50 border border-emerald-200 rounded-lg p-0.5"
              >
                <button
                  onClick={handleDecrement}
                  aria-label="Decrease quantity"
                  className="w-7 h-7 flex items-center justify-center text-emerald-800 hover:bg-emerald-100 rounded-md transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="w-7 text-center font-bold text-xs text-emerald-900 tabular-nums">
                  {currentQty}
                </span>
                <button
                  onClick={handleIncrement}
                  aria-label="Increase quantity"
                  className="w-7 h-7 flex items-center justify-center text-emerald-800 hover:bg-emerald-100 rounded-md transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
