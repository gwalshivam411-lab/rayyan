import React, { useState, useEffect } from 'react';
import { PickupSlot } from '../../types';
import { StorageService } from '../../lib/storage';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { Clock, CheckCircle2, Sparkles, AlertCircle, ArrowRight, ShieldCheck, Zap } from 'lucide-react';

interface PickupSlotsViewProps {
  onProceedToMenu: () => void;
}

export const PickupSlotsView: React.FC<PickupSlotsViewProps> = ({ onProceedToMenu }) => {
  const { selectedSlot, setSelectedSlot } = useCart();
  const { addToast } = useNotifications();
  const [slots, setSlots] = useState<PickupSlot[]>([]);

  const loadSlots = () => {
    setSlots(StorageService.getPickupSlots());
  };

  useEffect(() => {
    loadSlots();
    const handleSync = () => loadSlots();
    window.addEventListener('campusbite_storage_sync', handleSync);
    return () => window.removeEventListener('campusbite_storage_sync', handleSync);
  }, []);

  const handleSelectSlot = (slot: PickupSlot) => {
    const remaining = Math.max(0, slot.capacity - slot.reservedCount);
    if (remaining <= 0 || !slot.isOpen) return;

    setSelectedSlot(slot);
    addToast({
      title: 'Slot Selected',
      message: `Preferred pickup time set to ${slot.startTime} - ${slot.endTime}.`,
      type: 'info',
    });
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      {/* Title */}
      <div className="text-center max-w-2xl mx-auto mb-10">
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100/70 text-emerald-800 text-xs font-bold mb-3">
          <Clock className="w-3.5 h-3.5" />
          <span>Queue Elimination System</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
          Today's Canteen Pickup Schedule
        </h1>
        <p className="text-stone-500 text-xs sm:text-sm mt-2 leading-relaxed">
          Book your 15-minute express pickup slot before reaching the counter. Staff prioritize your order so you never stand in 20-minute break queues.
        </p>
      </div>

      {/* Selected Slot Callout */}
      {selectedSlot && (
        <div className="mb-8 p-4 bg-emerald-700 text-white rounded-2xl shadow-md flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center font-bold text-lg">
              ✓
            </div>
            <div>
              <span className="text-[11px] text-emerald-200 uppercase font-semibold tracking-wider block">
                Your Current Target Pickup Window
              </span>
              <span className="text-xl font-bold tracking-tight">
                {selectedSlot.startTime} – {selectedSlot.endTime}
              </span>
            </div>
          </div>

          <button
            onClick={onProceedToMenu}
            className="px-5 py-2.5 bg-white text-emerald-900 hover:bg-emerald-50 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 self-start sm:self-auto shadow-xs"
          >
            <span>Add Food to Tray</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Slots Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-10">
        {slots.map((slot) => {
          const remaining = Math.max(0, slot.capacity - slot.reservedCount);
          const isFull = remaining <= 0 || !slot.isOpen;
          const isChosen = selectedSlot?.id === slot.id;

          return (
            <div
              key={slot.id}
              onClick={() => !isFull && handleSelectSlot(slot)}
              className={`p-5 rounded-2xl border transition-all duration-200 flex flex-col justify-between ${
                isChosen
                  ? 'border-emerald-600 bg-emerald-50/60 ring-2 ring-emerald-600/30 shadow-md'
                  : isFull
                  ? 'border-stone-200 bg-stone-100/70 opacity-60 cursor-not-allowed'
                  : 'border-stone-200 bg-white hover:border-emerald-300 hover:shadow-xs cursor-pointer'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-base font-extrabold text-stone-900">
                    {slot.startTime} – {slot.endTime}
                  </span>
                  {slot.isRecommended && !isFull && (
                    <span className="text-[10px] font-bold text-emerald-700 bg-emerald-100 px-2 py-0.5 rounded flex items-center gap-0.5">
                      <Zap className="w-3 h-3" />
                      <span>Low Wait</span>
                    </span>
                  )}
                  {isFull && (
                    <span className="text-[10px] font-bold text-red-700 bg-red-100 px-2 py-0.5 rounded">
                      Full
                    </span>
                  )}
                </div>

                <div className="text-xs text-stone-500 mb-3">
                  {slot.startTime.startsWith('10')
                    ? 'Morning Break Rush'
                    : slot.startTime.startsWith('12') || slot.startTime.startsWith('13')
                    ? 'Lunch Break Window'
                    : 'Regular Campus Hours'}
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between text-xs mb-1.5">
                  <span className="text-stone-500">Slot Capacity</span>
                  <span className="font-bold text-stone-800 tabular-nums">
                    {slot.reservedCount} / {slot.capacity}
                  </span>
                </div>

                {/* Capacity Bar */}
                <div className="w-full h-2 bg-stone-200 rounded-full overflow-hidden mb-4">
                  <div
                    className={`h-full transition-all ${
                      isFull
                        ? 'bg-red-500'
                        : remaining <= 3
                        ? 'bg-amber-500'
                        : 'bg-emerald-600'
                    }`}
                    style={{ width: `${(slot.reservedCount / slot.capacity) * 100}%` }}
                  />
                </div>

                <button
                  disabled={isFull}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleSelectSlot(slot);
                  }}
                  className={`w-full py-2.5 rounded-xl text-xs font-bold transition-all ${
                    isChosen
                      ? 'bg-emerald-700 text-white shadow-2xs'
                      : isFull
                      ? 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      : 'bg-stone-100 hover:bg-emerald-50 hover:text-emerald-800 text-stone-700 border border-stone-200'
                  }`}
                >
                  {isChosen ? 'Selected Target Slot' : isFull ? 'Slot Full' : 'Select This Slot'}
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* How It Works banner */}
      <div className="bg-white rounded-2xl border border-stone-200 p-6 sm:p-8 shadow-xs">
        <h3 className="font-bold text-stone-900 text-base mb-4 text-center">
          How the Queue Elimination System Operates
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-6 text-center text-xs">
          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mx-auto text-sm">
              1
            </div>
            <strong className="block font-bold text-stone-800">Select Slot</strong>
            <span className="text-stone-500 leading-relaxed block">
              Choose an available 15-minute collection window before class breaks.
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mx-auto text-sm">
              2
            </div>
            <strong className="block font-bold text-stone-800">Tray & Pay</strong>
            <span className="text-stone-500 leading-relaxed block">
              Choose items and pay digitally or select Cash on Pickup.
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mx-auto text-sm">
              3
            </div>
            <strong className="block font-bold text-stone-800">Get Pickup Code</strong>
            <span className="text-stone-500 leading-relaxed block">
              Receive your order number & 4-digit code. Kitchen starts prep on time.
            </span>
          </div>

          <div className="space-y-1.5">
            <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-800 font-bold flex items-center justify-center mx-auto text-sm">
              4
            </div>
            <strong className="block font-bold text-stone-800">Instant Collect</strong>
            <span className="text-stone-500 leading-relaxed block">
              Walk straight to Counter 1 or 2, flash your code, and receive hot food.
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
