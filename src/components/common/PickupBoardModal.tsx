import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { StorageService } from '../../lib/storage';
import { X, BellRing, PackageCheck, Monitor, Clock } from 'lucide-react';

interface PickupBoardModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const PickupBoardModal: React.FC<PickupBoardModalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    if (!isOpen) return;

    const loadOrders = () => {
      setOrders(StorageService.getOrders());
    };

    loadOrders();
    const handleSync = () => loadOrders();
    window.addEventListener('campusbite_storage_sync', handleSync);

    const clockTimer = setInterval(() => {
      setCurrentTime(
        new Date().toLocaleTimeString('en-IN', {
          hour: '2-digit',
          minute: '2-digit',
          second: '2-digit',
        })
      );
    }, 1000);

    return () => {
      window.removeEventListener('campusbite_storage_sync', handleSync);
      clearInterval(clockTimer);
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const readyOrders = orders.filter((o) => o.orderStatus === 'ready');
  const preparingOrders = orders.filter((o) => o.orderStatus === 'preparing');
  const collectedOrders = orders
    .filter((o) => o.orderStatus === 'collected')
    .slice(0, 8);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-stone-950/90 backdrop-blur-md overflow-hidden animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-6xl bg-stone-900 rounded-3xl shadow-2xl border border-stone-800 overflow-hidden flex flex-col h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* TV Header */}
        <div className="p-4 sm:p-6 border-b border-stone-800 bg-stone-950 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-black text-xl">
              CB
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest text-emerald-400 font-bold block">
                Digital Pickup Board
              </span>
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                CampusBite Counter Screen
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 text-stone-400 bg-stone-900 px-3 py-1.5 rounded-lg border border-stone-800 font-mono text-sm tabular-nums">
              <Clock className="w-4 h-4 text-emerald-400" />
              <span>{currentTime || 'Live Counter'}</span>
            </div>

            <button
              onClick={onClose}
              className="p-2 text-stone-400 hover:text-white rounded-lg bg-stone-800 transition-colors"
              aria-label="Close board"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Board Content */}
        <div className="flex-1 p-4 sm:p-6 grid grid-cols-1 md:grid-cols-3 gap-6 overflow-y-auto">
          {/* Column 1: NOW READY (Prominent) */}
          <div className="md:col-span-2 flex flex-col bg-stone-950/60 rounded-2xl border border-emerald-900/60 p-5 overflow-hidden">
            <div className="flex items-center justify-between pb-3 border-b border-stone-800 mb-4">
              <div className="flex items-center gap-2">
                <BellRing className="w-5 h-5 text-amber-400 animate-bounce" />
                <h3 className="text-lg font-black text-emerald-400 uppercase tracking-wider">
                  Ready for Collection ({readyOrders.length})
                </h3>
              </div>
              <span className="text-xs font-semibold text-stone-400">Head to Counter with Code</span>
            </div>

            {readyOrders.length === 0 ? (
              <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                <Clock className="w-12 h-12 text-stone-700 mb-2" />
                <span className="text-stone-400 font-bold text-sm">All ready orders collected!</span>
                <span className="text-stone-600 text-xs mt-1">
                  Kitchen is currently preparing next slot batches.
                </span>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 overflow-y-auto pr-1">
                {readyOrders.map((ro) => (
                  <div
                    key={ro.id}
                    className="p-4 rounded-xl bg-stone-900 border-2 border-emerald-500/80 shadow-lg flex items-center justify-between"
                  >
                    <div>
                      <span className="text-2xl font-black text-white font-mono tracking-tight block">
                        {ro.orderNumber}
                      </span>
                      <span className="text-xs text-stone-400 block mt-0.5">
                        Slot: {ro.pickupSlotDisplay}
                      </span>
                    </div>

                    <div className="text-right">
                      <span className="text-[10px] text-stone-400 uppercase tracking-wider block">
                        Collect At
                      </span>
                      <span className="text-sm font-bold text-amber-400 bg-amber-950/60 px-2 py-1 rounded inline-block mt-0.5 border border-amber-800/60">
                        {ro.pickupCounter || 'Counter 1'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Column 2: IN PREPARATION & RECENTLY COMPLETED */}
          <div className="flex flex-col gap-5">
            {/* Cooking in kitchen */}
            <div className="flex-1 bg-stone-950/60 rounded-2xl border border-stone-800 p-4 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800 mb-3">
                <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                  Cooking in Kitchen ({preparingOrders.length})
                </h4>
              </div>
              <div className="space-y-2 overflow-y-auto flex-1">
                {preparingOrders.length === 0 ? (
                  <span className="text-xs text-stone-600 block text-center py-4">
                    No orders currently in skillet
                  </span>
                ) : (
                  preparingOrders.map((po) => (
                    <div
                      key={po.id}
                      className="p-2.5 rounded-lg bg-stone-900/80 border border-stone-800 flex items-center justify-between text-xs"
                    >
                      <span className="font-bold text-stone-200">{po.orderNumber}</span>
                      <span className="text-stone-400">{po.pickupSlotDisplay}</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recently collected */}
            <div className="flex-1 bg-stone-950/60 rounded-2xl border border-stone-800 p-4 flex flex-col">
              <div className="flex items-center justify-between pb-2 border-b border-stone-800 mb-3">
                <h4 className="text-xs font-bold text-stone-400 uppercase tracking-wider">
                  Recently Collected
                </h4>
              </div>
              <div className="space-y-1.5 overflow-y-auto flex-1">
                {collectedOrders.map((co) => (
                  <div
                    key={co.id}
                    className="p-2 rounded-lg bg-stone-900/40 text-stone-400 text-xs flex items-center justify-between"
                  >
                    <span className="font-medium line-through opacity-70">{co.orderNumber}</span>
                    <span className="text-[11px] text-emerald-400">✓ Collected</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
