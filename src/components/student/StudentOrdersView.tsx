import React, { useState, useEffect } from 'react';
import { Order } from '../../types';
import { StorageService } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { OrderTrackerModal } from '../orders/OrderTrackerModal';
import { Clock, CheckCircle2, ChevronRight, PackageCheck, AlertCircle, RefreshCw } from 'lucide-react';

export const StudentOrdersView: React.FC = () => {
  const { user } = useAuth();
  const { addItem, setIsCartDrawerOpen } = useCart();
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [filter, setFilter] = useState<'all' | 'active' | 'completed'>('all');

  const loadOrders = () => {
    const all = StorageService.getOrders();
    // Filter for current student's orders
    const mine = all.filter((o) => o.studentId === user.id);
    setOrders(mine);
  };

  useEffect(() => {
    loadOrders();
    const handleSync = () => loadOrders();
    window.addEventListener('campusbite_storage_sync', handleSync);
    return () => window.removeEventListener('campusbite_storage_sync', handleSync);
  }, [user.id]);

  const activeOrders = orders.filter((o) => ['placed', 'accepted', 'preparing', 'ready'].includes(o.orderStatus));
  const completedOrders = orders.filter((o) => ['collected', 'cancelled', 'rejected'].includes(o.orderStatus));

  const displayedOrders = filter === 'active' ? activeOrders : filter === 'completed' ? completedOrders : orders;

  const handleReorder = (order: Order) => {
    const allMenu = StorageService.getMenuItems();
    for (const item of order.items) {
      const match = allMenu.find((m) => m.id === item.menuItemId);
      if (match && match.isAvailable && match.stockQuantity > 0) {
        addItem(match, item.quantity);
      }
    }
    setIsCartDrawerOpen(true);
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight">My Orders</h1>
          <p className="text-xs text-stone-500 mt-1">
            Track active canteen food orders and pickup codes in real-time.
          </p>
        </div>

        {/* Filter controls */}
        <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-lg self-start">
          <button
            onClick={() => setFilter('all')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filter === 'all' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            All ({orders.length})
          </button>
          <button
            onClick={() => setFilter('active')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filter === 'active' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            Active ({activeOrders.length})
          </button>
          <button
            onClick={() => setFilter('completed')}
            className={`px-3 py-1.5 text-xs font-semibold rounded-md transition-colors ${
              filter === 'completed' ? 'bg-white text-stone-900 shadow-2xs' : 'text-stone-600 hover:text-stone-900'
            }`}
          >
            History ({completedOrders.length})
          </button>
        </div>
      </div>

      {/* Orders List */}
      {displayedOrders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
          <div className="w-14 h-14 rounded-full bg-stone-100 flex items-center justify-center text-stone-400 mx-auto mb-3">
            <Clock className="w-7 h-7" />
          </div>
          <h3 className="font-bold text-stone-800 text-base">No orders in this category</h3>
          <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
            Order your campus meals in advance to bypass peak queue delays!
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {displayedOrders.map((order) => {
            const isActive = ['placed', 'accepted', 'preparing', 'ready'].includes(order.orderStatus);

            return (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order)}
                className={`bg-white rounded-xl border transition-all duration-200 p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:shadow-md ${
                  order.orderStatus === 'ready'
                    ? 'border-amber-400 bg-amber-50/20 shadow-xs'
                    : isActive
                    ? 'border-emerald-300'
                    : 'border-stone-200 hover:border-stone-300'
                }`}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold text-stone-900 text-base">{order.orderNumber}</span>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                        order.orderStatus === 'ready'
                          ? 'bg-amber-100 text-amber-900 animate-pulse'
                          : order.orderStatus === 'collected'
                          ? 'bg-emerald-100 text-emerald-900'
                          : ['cancelled', 'rejected'].includes(order.orderStatus)
                          ? 'bg-red-100 text-red-900'
                          : 'bg-stone-100 text-stone-700'
                      }`}
                    >
                      {order.orderStatus.replace('_', ' ')}
                    </span>
                  </div>

                  <div className="text-xs text-stone-500 flex flex-wrap items-center gap-x-2 gap-y-1">
                    <span>Slot: {order.pickupSlotDisplay}</span>
                    <span aria-hidden="true">·</span>
                    <span>{new Date(order.createdAt).toLocaleDateString()}</span>
                    <span aria-hidden="true">·</span>
                    <span className="capitalize">{order.paymentStatus.replace('_', ' ')}</span>
                  </div>

                  <div className="text-xs text-stone-700 font-medium line-clamp-1">
                    {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                  </div>
                </div>

                {/* Right side actions */}
                <div className="flex items-center gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-stone-100">
                  <div className="text-right">
                    <span className="text-[10px] text-stone-400 block uppercase">Total</span>
                    <span className="text-base font-extrabold text-stone-900 tabular-nums">
                      ₹{order.totalAmount.toFixed(2)}
                    </span>
                  </div>

                  {isActive ? (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedOrder(order);
                      }}
                      className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-semibold transition-all flex items-center gap-1 shadow-2xs"
                    >
                      <span>Track</span>
                      <ChevronRight className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleReorder(order);
                      }}
                      className="px-3 py-1.5 text-stone-600 bg-stone-100 hover:bg-stone-200 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                    >
                      <RefreshCw className="w-3 h-3" />
                      <span>Reorder</span>
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tracker Modal */}
      <OrderTrackerModal
        order={selectedOrder}
        onClose={() => setSelectedOrder(null)}
        onOrderUpdated={loadOrders}
      />
    </div>
  );
};
