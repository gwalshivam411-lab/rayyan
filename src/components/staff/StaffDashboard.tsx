import React, { useState, useEffect } from 'react';
import { Order, MenuItem, OrderStatus } from '../../types';
import { StorageService } from '../../lib/storage';
import { useNotifications } from '../../context/NotificationContext';
import {
  ChefHat,
  Clock,
  CheckCircle2,
  BellRing,
  XCircle,
  PackageCheck,
  Search,
  Filter,
  Volume2,
  VolumeX,
  ShieldCheck,
  AlertTriangle,
  RotateCcw,
  Sparkles,
} from 'lucide-react';

export const StaffDashboard: React.FC = () => {
  const { addToast, soundEnabled, setSoundEnabled, playChime } = useNotifications();

  const [orders, setOrders] = useState<Order[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeTab, setActiveTab] = useState<'queue' | 'slots' | 'inventory' | 'verify'>('queue');
  const [statusFilter, setStatusFilter] = useState<'all' | 'placed' | 'accepted' | 'preparing' | 'ready'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  // Rejection modal
  const [rejectOrder, setRejectOrder] = useState<Order | null>(null);
  const [rejectReason, setRejectReason] = useState('Ingredients finished');

  // Verify pickup code modal
  const [verifyCodeInput, setVerifyCodeInput] = useState('');
  const [verifyResult, setVerifyResult] = useState<{ success?: boolean; message?: string; order?: Order } | null>(null);

  const loadData = () => {
    setOrders(StorageService.getOrders());
    setMenuItems(StorageService.getMenuItems());
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('campusbite_storage_sync', handleSync);
    return () => window.removeEventListener('campusbite_storage_sync', handleSync);
  }, []);

  const handleUpdateStatus = (orderId: string, newStatus: OrderStatus, counter?: string) => {
    StorageService.updateOrderStatus(orderId, newStatus, counter ? { pickupCounter: counter } : {});
    loadData();
    addToast({
      title: 'Status Updated',
      message: `Order status shifted to ${newStatus}.`,
      type: newStatus === 'ready' ? 'ready' : 'info',
    });
    if (newStatus === 'ready') playChime('ready');
  };

  const handleRejectSubmit = () => {
    if (!rejectOrder) return;
    StorageService.updateOrderStatus(rejectOrder.id, 'rejected', {
      rejectionReason: rejectReason,
    });
    loadData();
    addToast({
      title: 'Order Rejected',
      message: `Order ${rejectOrder.orderNumber} rejected. Customer notified.`,
      type: 'error',
    });
    setRejectOrder(null);
  };

  const handleVerifyCodeSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = verifyCodeInput.trim();
    if (trimmed.length !== 4) {
      setVerifyResult({ success: false, message: 'Please enter the 4-digit code.' });
      return;
    }

    const matched = orders.find(
      (o) => o.pickupCode === trimmed && ['ready', 'preparing', 'accepted', 'placed'].includes(o.orderStatus)
    );

    if (matched) {
      StorageService.updateOrderStatus(matched.id, 'collected');
      loadData();
      setVerifyResult({
        success: true,
        message: `Verified! Order ${matched.orderNumber} for ${matched.studentName} marked COLLECTED.`,
        order: matched,
      });
      setVerifyCodeInput('');
    } else {
      setVerifyResult({
        success: false,
        message: 'Invalid code or order already collected!',
      });
    }
  };

  const handleToggleItemAvailability = (item: MenuItem) => {
    const updated = { ...item, isAvailable: !item.isAvailable };
    StorageService.updateMenuItem(updated);
    loadData();
    addToast({
      title: 'Inventory Updated',
      message: `${item.name} marked as ${updated.isAvailable ? 'AVAILABLE' : 'SOLD OUT'}.`,
      type: 'info',
    });
  };

  // Group by status
  const queueOrders = orders.filter((o) => ['placed', 'accepted', 'preparing', 'ready'].includes(o.orderStatus));
  const filteredOrders = queueOrders
    .filter((o) => (statusFilter === 'all' ? true : o.orderStatus === statusFilter))
    .filter((o) =>
      searchQuery
        ? o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.studentName.toLowerCase().includes(searchQuery.toLowerCase()) ||
          o.pickupCode.includes(searchQuery)
        : true
    );

  // Group by slot
  const slotGroups = queueOrders.reduce((acc, order) => {
    const key = order.pickupSlotDisplay;
    if (!acc[key]) acc[key] = [];
    acc[key].push(order);
    return acc;
  }, {} as Record<string, Order[]>);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded uppercase tracking-wider">
              Staff Kitchen Terminal
            </span>
            <span className="text-xs text-stone-500">Live order processing</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-1">
            Canteen Kitchen Operations
          </h1>
        </div>

        {/* Top Controls */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSoundEnabled(!soundEnabled)}
            className={`px-3 py-2 text-xs font-semibold rounded-lg border transition-colors flex items-center gap-1.5 ${
              soundEnabled
                ? 'bg-emerald-50 text-emerald-800 border-emerald-300'
                : 'bg-stone-100 text-stone-500 border-stone-200'
            }`}
            title="Toggle sound chime alerts for new orders"
          >
            {soundEnabled ? <Volume2 className="w-4 h-4 text-emerald-600" /> : <VolumeX className="w-4 h-4" />}
            <span>{soundEnabled ? 'Chimes Active' : 'Muted'}</span>
          </button>

          <button
            onClick={() => setActiveTab('verify')}
            className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-xs"
          >
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Verify Pickup Code</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 mb-6">
        <button
          onClick={() => setActiveTab('queue')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative ${
            activeTab === 'queue'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Live Kitchen Queue ({queueOrders.length})
        </button>
        <button
          onClick={() => setActiveTab('slots')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative ${
            activeTab === 'slots'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Orders by Pickup Slot ({Object.keys(slotGroups).length} slots)
        </button>
        <button
          onClick={() => setActiveTab('inventory')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative ${
            activeTab === 'inventory'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Item Stock & Availability ({menuItems.length})
        </button>
        <button
          onClick={() => setActiveTab('verify')}
          className={`pb-3 px-3 text-xs font-bold transition-colors relative ${
            activeTab === 'verify'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Pickup Verification Scanner
        </button>
      </div>

      {/* TAB 1: LIVE QUEUE */}
      {activeTab === 'queue' && (
        <div className="space-y-4">
          {/* Filters & Search */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-xl border border-stone-200">
            <div className="flex items-center gap-1 overflow-x-auto w-full sm:w-auto">
              {(['all', 'placed', 'accepted', 'preparing', 'ready'] as const).map((st) => (
                <button
                  key={st}
                  onClick={() => setStatusFilter(st)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize whitespace-nowrap transition-colors ${
                    statusFilter === st
                      ? 'bg-stone-900 text-white'
                      : 'text-stone-600 hover:bg-stone-100'
                  }`}
                >
                  {st === 'all' ? 'All Active' : st}
                </button>
              ))}
            </div>

            <div className="relative w-full sm:w-64">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search order #, code, name..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs border border-stone-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-emerald-600"
              />
            </div>
          </div>

          {/* Cards Grid */}
          {filteredOrders.length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
              <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto mb-2 opacity-80" />
              <h3 className="font-bold text-stone-800 text-base">All Caught Up!</h3>
              <p className="text-xs text-stone-500 mt-1">No orders in this status queue.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredOrders.map((order) => {
                const minutesElapsed = Math.floor(
                  (Date.now() - new Date(order.createdAt).getTime()) / (60 * 1000)
                );

                return (
                  <div
                    key={order.id}
                    className={`bg-white rounded-xl border p-4 flex flex-col justify-between shadow-xs transition-all ${
                      order.orderStatus === 'placed'
                        ? 'border-blue-300 ring-1 ring-blue-100'
                        : order.orderStatus === 'ready'
                        ? 'border-amber-300 bg-amber-50/20'
                        : 'border-stone-200'
                    }`}
                  >
                    <div>
                      {/* Top Header */}
                      <div className="flex items-center justify-between pb-2 border-b border-stone-100">
                        <div>
                          <span className="font-extrabold text-base text-stone-900">
                            {order.orderNumber}
                          </span>
                          <span className="text-[11px] text-stone-500 block">
                            {order.studentName}
                          </span>
                        </div>
                        <div className="text-right">
                          <span className="text-[10px] font-mono font-bold bg-stone-900 text-emerald-400 px-2 py-0.5 rounded">
                            Code: {order.pickupCode}
                          </span>
                          <span className="text-[10px] text-stone-400 block mt-0.5">
                            {minutesElapsed}m ago
                          </span>
                        </div>
                      </div>

                      {/* Pickup Slot */}
                      <div className="mt-2.5 flex items-center justify-between text-xs bg-stone-50 p-2 rounded-lg">
                        <span className="text-stone-500 flex items-center gap-1">
                          <Clock className="w-3.5 h-3.5 text-stone-400" />
                          <span>Slot:</span>
                        </span>
                        <span className="font-bold text-stone-900">{order.pickupSlotDisplay}</span>
                      </div>

                      {/* Food items list */}
                      <div className="mt-3 space-y-1.5">
                        {order.items.map((i) => (
                          <div key={i.id} className="text-xs text-stone-800 flex justify-between font-medium">
                            <span>
                              {i.quantity}x {i.itemName}
                              {i.specialInstructions && (
                                <span className="block text-[11px] text-amber-700 italic">
                                  "{i.specialInstructions}"
                                </span>
                              )}
                            </span>
                          </div>
                        ))}
                      </div>

                      {order.specialInstructions && (
                        <div className="mt-2 p-2 bg-amber-50 rounded-lg text-[11px] text-amber-900">
                          <strong>Order Note:</strong> {order.specialInstructions}
                        </div>
                      )}
                    </div>

                    {/* Action buttons based on status */}
                    <div className="mt-4 pt-3 border-t border-stone-100">
                      <div className="flex items-center justify-between mb-2 text-xs">
                        <span className="text-stone-400">Payment:</span>
                        <span className="font-semibold text-stone-700 capitalize">
                          {order.paymentStatus === 'completed' ? 'Paid Online' : 'Cash on Pickup'}
                        </span>
                      </div>

                      <div className="flex items-center gap-2">
                        {order.orderStatus === 'placed' && (
                          <>
                            <button
                              onClick={() => handleUpdateStatus(order.id, 'accepted')}
                              className="flex-1 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-bold transition-colors"
                            >
                              Accept Order
                            </button>
                            <button
                              onClick={() => setRejectOrder(order)}
                              className="px-3 py-2 bg-stone-100 hover:bg-red-50 text-red-600 rounded-lg text-xs font-semibold transition-colors"
                            >
                              Reject
                            </button>
                          </>
                        )}

                        {order.orderStatus === 'accepted' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'preparing')}
                            className="w-full py-2 bg-amber-600 hover:bg-amber-700 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <ChefHat className="w-4 h-4" />
                            <span>Start Cooking</span>
                          </button>
                        )}

                        {order.orderStatus === 'preparing' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'ready', 'Counter 1')}
                            className="w-full py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <BellRing className="w-4 h-4" />
                            <span>Mark Ready for Pickup</span>
                          </button>
                        )}

                        {order.orderStatus === 'ready' && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, 'collected')}
                            className="w-full py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-lg text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                          >
                            <PackageCheck className="w-4 h-4 text-emerald-400" />
                            <span>Mark Handed Over / Collected</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 2: ORDERS BY PICKUP SLOT */}
      {activeTab === 'slots' && (
        <div className="space-y-6">
          {Object.keys(slotGroups).length === 0 ? (
            <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center text-stone-500">
              <Clock className="w-8 h-8 text-stone-400 mx-auto mb-2" />
              <h3 className="font-bold text-stone-800">No scheduled slot batches</h3>
            </div>
          ) : (
            Object.entries(slotGroups).map(([slotName, slotOrders]) => (
              <div key={slotName} className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs">
                <div className="p-4 bg-stone-50 border-b border-stone-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Clock className="w-4 h-4 text-emerald-700" />
                    <h3 className="font-extrabold text-stone-900 text-sm">
                      Pickup Window: {slotName}
                    </h3>
                  </div>
                  <span className="text-xs font-bold text-stone-600 bg-stone-200/80 px-2 py-0.5 rounded">
                    {slotOrders.length} {slotOrders.length === 1 ? 'order' : 'orders'} scheduled
                  </span>
                </div>

                <div className="divide-y divide-stone-100 p-2">
                  {slotOrders.map((order) => (
                    <div key={order.id} className="p-3 flex items-center justify-between text-xs">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-stone-900">{order.orderNumber}</span>
                          <span className="font-mono text-stone-500">({order.pickupCode})</span>
                          <span className="text-stone-600">· {order.studentName}</span>
                        </div>
                        <span className="text-stone-500 block mt-0.5">
                          {order.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                        </span>
                      </div>
                      <span className="capitalize font-semibold text-stone-700">
                        {order.orderStatus.replace('_', ' ')}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      )}

      {/* TAB 3: INVENTORY TOGGLE */}
      {activeTab === 'inventory' && (
        <div className="bg-white rounded-2xl border border-stone-200 overflow-hidden shadow-xs">
          <div className="p-4 bg-stone-50 border-b border-stone-200">
            <h3 className="font-bold text-stone-900 text-sm">Quick Counter Availability Controls</h3>
            <p className="text-xs text-stone-500 mt-0.5">
              Toggle items unavailable instantly when kitchen runs out. Customers cannot order sold-out items.
            </p>
          </div>

          <div className="divide-y divide-stone-100">
            {menuItems.map((item) => (
              <div key={item.id} className="p-4 flex items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{item.name}</span>
                    <span className="text-xs text-stone-500">₹{item.price}</span>
                    <span className="text-xs text-stone-400">· Stock: {item.stockQuantity}</span>
                  </div>
                  <span className="text-xs text-stone-500 line-clamp-1">{item.description}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span
                    className={`text-xs font-bold px-2 py-1 rounded ${
                      item.isAvailable && item.stockQuantity > 0
                        ? 'bg-emerald-100 text-emerald-900'
                        : 'bg-red-100 text-red-900'
                    }`}
                  >
                    {item.isAvailable && item.stockQuantity > 0 ? 'In Stock' : 'Unavailable'}
                  </span>

                  <button
                    onClick={() => handleToggleItemAvailability(item)}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors ${
                      item.isAvailable
                        ? 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                        : 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100 border border-emerald-200'
                    }`}
                  >
                    {item.isAvailable ? 'Mark Sold Out' : 'Mark Available'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: VERIFY PICKUP CODE */}
      {activeTab === 'verify' && (
        <div className="max-w-md mx-auto bg-white rounded-2xl border border-stone-200 p-6 shadow-sm">
          <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center mx-auto mb-3">
            <ShieldCheck className="w-7 h-7" />
          </div>

          <h2 className="text-lg font-bold text-center text-stone-900">
            Counter Pickup Code Verification
          </h2>
          <p className="text-xs text-stone-500 text-center mt-1 mb-6">
            Ask student for their 4-digit secret code to prevent duplicate collections.
          </p>

          <form onSubmit={handleVerifyCodeSubmit} className="space-y-4">
            <div>
              <label htmlFor="staffVerifyCodeInput" className="block text-xs font-bold text-stone-700 mb-1">
                Enter 4-Digit Pickup Code
              </label>
              <input
                id="staffVerifyCodeInput"
                type="text"
                maxLength={4}
                placeholder="e.g. 4892"
                value={verifyCodeInput}
                onChange={(e) => setVerifyCodeInput(e.target.value.replace(/\D/g, ''))}
                className="w-full text-center text-2xl font-mono tracking-widest font-black py-3 border border-stone-300 rounded-xl focus:ring-2 focus:ring-emerald-600 focus:outline-none"
              />
            </div>

            <button
              type="submit"
              className="w-full py-3 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl text-xs transition-colors shadow-xs"
            >
              Verify & Mark Handed Over
            </button>
          </form>

          {verifyResult && (
            <div
              className={`mt-4 p-3 rounded-xl text-xs ${
                verifyResult.success
                  ? 'bg-emerald-50 border border-emerald-200 text-emerald-900'
                  : 'bg-red-50 border border-red-200 text-red-900'
              }`}
            >
              <span className="font-bold block">{verifyResult.success ? 'Success!' : 'Verification Error'}</span>
              <span>{verifyResult.message}</span>
            </div>
          )}
        </div>
      )}

      {/* Rejection Dialog */}
      {rejectOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-sm w-full p-5 space-y-4 border border-stone-200 shadow-xl">
            <h3 className="font-bold text-base text-stone-900">
              Reject Order {rejectOrder.orderNumber}
            </h3>
            <p className="text-xs text-stone-600">
              State the reason. The student will be notified and any slot reservation will be released.
            </p>
            <div>
              <label htmlFor="staffRejectReasonSelect" className="block text-xs font-medium text-stone-700 mb-1">Reason</label>
              <select
                id="staffRejectReasonSelect"
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                className="w-full text-xs p-2 border border-stone-300 rounded-lg bg-white"
              >
                <option value="Ingredients finished for this item">Ingredients finished for this item</option>
                <option value="Kitchen overloaded / extreme delay">Kitchen overloaded / extreme delay</option>
                <option value="Item not available during current shift">Item not available during current shift</option>
                <option value="Counter closed for sanitization">Counter closed for sanitization</option>
              </select>
            </div>
            <div className="flex items-center gap-2 pt-2">
              <button
                onClick={handleRejectSubmit}
                className="flex-1 py-2 bg-red-600 hover:bg-red-700 text-white text-xs font-bold rounded-lg"
              >
                Confirm Rejection
              </button>
              <button
                onClick={() => setRejectOrder(null)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-medium rounded-lg"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
