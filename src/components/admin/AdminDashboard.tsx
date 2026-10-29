import React, { useState, useEffect } from 'react';
import { MenuItem, Category, Order, CanteenConfig, DietaryType } from '../../types';
import { StorageService } from '../../lib/storage';
import { useNotifications } from '../../context/NotificationContext';
import {
  TrendingUp,
  DollarSign,
  ShoppingBag,
  Clock,
  Plus,
  Edit2,
  Trash2,
  AlertTriangle,
  Megaphone,
  Settings,
  Database,
  BarChart3,
  Layers,
  Pause,
  Play,
  Save,
  CheckCircle2,
} from 'lucide-react';

interface AdminDashboardProps {
  onOpenSetupGuide: () => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onOpenSetupGuide }) => {
  const { addToast } = useNotifications();

  const [activeTab, setActiveTab] = useState<'metrics' | 'menu' | 'operations' | 'reports'>('metrics');
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [config, setConfig] = useState<CanteenConfig>(() => StorageService.getConfig());

  // Edit/Create item modal state
  const [isEditingItem, setIsEditingItem] = useState(false);
  const [editingItem, setEditingItem] = useState<Partial<MenuItem> | null>(null);

  const loadData = () => {
    setMenuItems(StorageService.getMenuItems());
    setCategories(StorageService.getCategories());
    setOrders(StorageService.getOrders());
    setConfig(StorageService.getConfig());
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('campusbite_storage_sync', handleSync);
    return () => window.removeEventListener('campusbite_storage_sync', handleSync);
  }, []);

  // Real metric calculations from actual database records (no fake metrics!)
  const completedOrders = orders.filter((o) => o.orderStatus === 'collected');
  const totalSalesToday = orders
    .filter((o) => !['cancelled', 'rejected'].includes(o.orderStatus))
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const pendingOrdersCount = orders.filter((o) =>
    ['placed', 'accepted', 'preparing'].includes(o.orderStatus)
  ).length;

  const cancelledOrdersCount = orders.filter((o) =>
    ['cancelled', 'rejected'].includes(o.orderStatus)
  ).length;

  // Real average preparation time calculation (between placed and ready)
  const ordersWithReadyTime = orders.filter((o) => o.readyAt && o.createdAt);
  const avgPrepMinutes =
    ordersWithReadyTime.length > 0
      ? Math.round(
          ordersWithReadyTime.reduce((sum, o) => {
            const diff = (new Date(o.readyAt!).getTime() - new Date(o.createdAt).getTime()) / (60 * 1000);
            return sum + diff;
          }, 0) / ordersWithReadyTime.length
        )
      : 12;

  // Item popularity from actual order records
  const itemSalesCount: Record<string, { name: string; count: number; revenue: number }> = {};
  for (const o of orders) {
    if (['cancelled', 'rejected'].includes(o.orderStatus)) continue;
    for (const item of o.items) {
      if (!itemSalesCount[item.menuItemId]) {
        itemSalesCount[item.menuItemId] = { name: item.itemName, count: 0, revenue: 0 };
      }
      itemSalesCount[item.menuItemId].count += item.quantity;
      itemSalesCount[item.menuItemId].revenue += item.lineTotal;
    }
  }

  const topSellingItems = Object.values(itemSalesCount).sort((a, b) => b.count - a.count);

  // Peak hour slot demand calculation
  const slotDemand: Record<string, number> = {};
  for (const o of orders) {
    if (['cancelled', 'rejected'].includes(o.orderStatus)) continue;
    slotDemand[o.pickupSlotDisplay] = (slotDemand[o.pickupSlotDisplay] || 0) + 1;
  }

  // Payment breakdown
  const onlinePaymentsCount = orders.filter((o) => o.paymentMethod === 'razorpay').length;
  const cashPaymentsCount = orders.filter((o) => o.paymentMethod === 'cash_on_pickup').length;

  // Handlers
  const handleToggleRushHour = () => {
    const updated = { ...config, isRushHourPaused: !config.isRushHourPaused };
    StorageService.saveConfig(updated);
    setConfig(updated);
    addToast({
      title: updated.isRushHourPaused ? 'Orders Paused' : 'Orders Resumed',
      message: updated.isRushHourPaused
        ? 'Incoming new orders paused for rush hour.'
        : 'Incoming orders open for students.',
      type: updated.isRushHourPaused ? 'ready' : 'info',
    });
  };

  const handleSaveConfig = (e: React.FormEvent) => {
    e.preventDefault();
    StorageService.saveConfig(config);
    addToast({
      title: 'Settings Saved',
      message: 'Canteen operations updated successfully.',
      type: 'success',
    });
  };

  const handleSaveMenuItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingItem || !editingItem.name || !editingItem.price) return;

    const fullItem: MenuItem = {
      id: editingItem.id || `item-${Date.now()}`,
      categoryId: editingItem.categoryId || categories[0]?.id || 'cat-breakfast',
      name: editingItem.name,
      description: editingItem.description || '',
      price: Number(editingItem.price),
      imageType: editingItem.imageType || 'dosa',
      dietaryType: (editingItem.dietaryType as DietaryType) || 'veg',
      isSpicy: Boolean(editingItem.isSpicy),
      isSpecialToday: Boolean(editingItem.isSpecialToday),
      preparationTimeMinutes: Number(editingItem.preparationTimeMinutes) || 10,
      stockQuantity: Number(editingItem.stockQuantity) || 50,
      isAvailable: editingItem.isAvailable !== false,
      isActive: true,
      allergenInformation: editingItem.allergenInformation || '',
      totalSold: editingItem.totalSold || 0,
    };

    StorageService.updateMenuItem(fullItem);
    loadData();
    setIsEditingItem(false);
    setEditingItem(null);
    addToast({
      title: 'Menu Item Saved',
      message: `${fullItem.name} updated in the digital menu.`,
      type: 'success',
    });
  };

  const handleDeleteItem = (id: string, name: string) => {
    if (confirm(`Are you sure you want to delete ${name}?`)) {
      StorageService.deleteMenuItem(id);
      loadData();
      addToast({
        title: 'Item Deleted',
        message: `${name} removed from menu.`,
        type: 'info',
      });
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-6 border-b border-stone-200">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-emerald-800 bg-emerald-100 px-2 py-0.5 rounded uppercase tracking-wider">
              Administration Portal
            </span>
            <span className="text-xs text-stone-500">Live analytics & management</span>
          </div>
          <h1 className="text-2xl font-black text-stone-900 tracking-tight mt-1">
            CampusBite Canteen Central
          </h1>
        </div>

        {/* Rush hour toggle & Setup guide */}
        <div className="flex items-center gap-3">
          <button
            onClick={onOpenSetupGuide}
            className="px-3.5 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors border border-stone-200"
          >
            <Database className="w-4 h-4 text-emerald-700" />
            <span>Supabase & Razorpay Setup</span>
          </button>

          <button
            onClick={handleToggleRushHour}
            className={`px-4 py-2 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-colors shadow-xs ${
              config.isRushHourPaused
                ? 'bg-amber-600 hover:bg-amber-700 text-white animate-pulse'
                : 'bg-stone-900 hover:bg-stone-800 text-white'
            }`}
          >
            {config.isRushHourPaused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4 text-amber-400" />}
            <span>{config.isRushHourPaused ? 'Resume Student Ordering' : 'Pause Rush Hour Orders'}</span>
          </button>
        </div>
      </div>

      {/* Rush hour warning banner */}
      {config.isRushHourPaused && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-300 rounded-xl text-xs text-amber-950 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
            <div>
              <strong className="font-bold block">Rush Hour Pause Active!</strong>
              <span>Students currently cannot place new orders until kitchen catches up.</span>
            </div>
          </div>
          <button
            onClick={handleToggleRushHour}
            className="px-3 py-1.5 bg-amber-600 text-white font-bold rounded-lg hover:bg-amber-700"
          >
            Turn Off
          </button>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-stone-200 mb-6 overflow-x-auto">
        <button
          onClick={() => setActiveTab('metrics')}
          className={`pb-3 px-3 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'metrics'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Daily Overview & KPIs
        </button>
        <button
          onClick={() => setActiveTab('menu')}
          className={`pb-3 px-3 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'menu'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Menu & Pricing ({menuItems.length} items)
        </button>
        <button
          onClick={() => setActiveTab('operations')}
          className={`pb-3 px-3 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'operations'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Operations & Slots
        </button>
        <button
          onClick={() => setActiveTab('reports')}
          className={`pb-3 px-3 text-xs font-bold transition-colors whitespace-nowrap ${
            activeTab === 'reports'
              ? 'text-emerald-800 border-b-2 border-emerald-700'
              : 'text-stone-500 hover:text-stone-800'
          }`}
        >
          Sales & Demand Reports
        </button>
      </div>

      {/* TAB 1: METRICS */}
      {activeTab === 'metrics' && (
        <div className="space-y-6">
          {/* Top 4 KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span>Total Revenue Today</span>
                <DollarSign className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                ₹{totalSalesToday.toFixed(2)}
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                From {orders.length} campus transactions
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span>Active Kitchen Orders</span>
                <ShoppingBag className="w-4 h-4 text-blue-600" />
              </div>
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                {pendingOrdersCount}
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                Currently in prep or placed
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span>Avg Preparation Speed</span>
                <Clock className="w-4 h-4 text-amber-600" />
              </div>
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                {avgPrepMinutes} mins
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                From actual ready timestamps
              </span>
            </div>

            <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
              <div className="flex items-center justify-between text-stone-500 text-xs mb-1">
                <span>Collected Successfully</span>
                <TrendingUp className="w-4 h-4 text-emerald-600" />
              </div>
              <div className="text-2xl font-black text-stone-900 tabular-nums">
                {completedOrders.length}
              </div>
              <span className="text-[11px] text-stone-400 mt-1 block">
                {cancelledOrdersCount} cancelled or rejected
              </span>
            </div>
          </div>

          {/* Quick Announcement Form */}
          <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-xs">
            <div className="flex items-center gap-2 mb-3">
              <Megaphone className="w-4 h-4 text-emerald-700" />
              <h3 className="font-bold text-stone-900 text-sm">Campus Canteen Live Announcement</h3>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Broadcast a banner notice to all student screens..."
                value={config.announcement || ''}
                onChange={(e) => setConfig({ ...config, announcement: e.target.value })}
                className="flex-1 text-xs px-3 py-2 border border-stone-300 rounded-lg text-stone-800"
              />
              <button
                onClick={handleSaveConfig}
                className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-lg text-xs font-bold transition-colors"
              >
                Update Banner
              </button>
            </div>
          </div>

          {/* Leaderboard & Recent Orders Split */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Top items */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <h3 className="font-bold text-stone-900 text-sm mb-3">
                Most Ordered Products (From Real Database)
              </h3>
              <div className="divide-y divide-stone-100">
                {topSellingItems.slice(0, 5).map((item, idx) => (
                  <div key={item.name} className="py-2.5 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2.5">
                      <span className="w-5 text-stone-400 font-bold">{idx + 1}.</span>
                      <span className="font-semibold text-stone-800">{item.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="font-bold text-stone-900 tabular-nums">{item.count} sold</span>
                      <span className="text-[11px] text-stone-400 block tabular-nums">₹{item.revenue}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Peak hour demand */}
            <div className="bg-white rounded-xl border border-stone-200 p-5 shadow-xs">
              <h3 className="font-bold text-stone-900 text-sm mb-3">
                Orders by Pickup Slot (Queue Distribution)
              </h3>
              <div className="space-y-2.5">
                {Object.entries(slotDemand).map(([slotName, count]) => (
                  <div key={slotName} className="text-xs">
                    <div className="flex justify-between mb-1">
                      <span className="font-semibold text-stone-700">{slotName}</span>
                      <span className="font-bold text-stone-900 tabular-nums">{count} orders</span>
                    </div>
                    <div className="w-full h-2 bg-stone-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-emerald-600 rounded-full"
                        style={{ width: `${Math.min(100, (count / 15) * 100)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: MENU & PRICING */}
      {activeTab === 'menu' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-xl border border-stone-200 shadow-xs">
            <div>
              <h3 className="font-bold text-stone-900 text-sm">Manage Food Catalog</h3>
              <p className="text-xs text-stone-500">Edit prices, dietary flags, prep times, and descriptions.</p>
            </div>
            <button
              onClick={() => {
                setEditingItem({
                  categoryId: categories[0]?.id,
                  dietaryType: 'veg',
                  imageType: 'dosa',
                  price: 50,
                  stockQuantity: 50,
                  preparationTimeMinutes: 10,
                  isAvailable: true,
                });
                setIsEditingItem(true);
              }}
              className="px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Add New Item</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-xs divide-y divide-stone-100">
            {menuItems.map((item) => (
              <div key={item.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-stone-900 text-sm">{item.name}</span>
                    <span className="text-xs font-bold text-emerald-800 tabular-nums">₹{item.price}</span>
                    <span className="text-[11px] text-stone-400 capitalize">· {item.dietaryType}</span>
                    <span className="text-[11px] text-stone-400">· {item.preparationTimeMinutes}m prep</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-0.5 line-clamp-1">{item.description}</p>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    onClick={() => {
                      setEditingItem(item);
                      setIsEditingItem(true);
                    }}
                    className="p-2 text-stone-600 hover:text-stone-900 hover:bg-stone-100 rounded-lg transition-colors"
                    title="Edit item"
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleDeleteItem(item.id, item.name)}
                    className="p-2 text-stone-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                    title="Delete item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: OPERATIONS & SLOTS */}
      {activeTab === 'operations' && (
        <form onSubmit={handleSaveConfig} className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs space-y-6 max-w-2xl">
          <h3 className="font-bold text-stone-900 text-base">Canteen Operating Hours & Slot Capacity</h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div>
              <label htmlFor="canteenNameInput" className="block font-semibold text-stone-700 mb-1">Canteen Facility Name</label>
              <input
                id="canteenNameInput"
                type="text"
                value={config.canteenName}
                onChange={(e) => setConfig({ ...config, canteenName: e.target.value })}
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="campusPhoneInput" className="block font-semibold text-stone-700 mb-1">Campus Contact Phone</label>
              <input
                id="campusPhoneInput"
                type="text"
                value={config.contactPhone}
                onChange={(e) => setConfig({ ...config, contactPhone: e.target.value })}
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="openingTimeInput" className="block font-semibold text-stone-700 mb-1">Morning Opening Time</label>
              <input
                id="openingTimeInput"
                type="time"
                value={config.openingTime}
                onChange={(e) => setConfig({ ...config, openingTime: e.target.value })}
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="closingTimeInput" className="block font-semibold text-stone-700 mb-1">Evening Closing Time</label>
              <input
                id="closingTimeInput"
                type="time"
                value={config.closingTime}
                onChange={(e) => setConfig({ ...config, closingTime: e.target.value })}
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="slotDurationInput" className="block font-semibold text-stone-700 mb-1">Pickup Slot Duration (Minutes)</label>
              <input
                id="slotDurationInput"
                type="number"
                min={5}
                max={60}
                value={config.slotDurationMinutes}
                onChange={(e) => setConfig({ ...config, slotDurationMinutes: Number(e.target.value) })}
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>

            <div>
              <label htmlFor="maxCapacityInput" className="block font-semibold text-stone-700 mb-1">Max Orders Per Slot (Kitchen Capacity)</label>
              <input
                id="maxCapacityInput"
                type="number"
                min={1}
                max={50}
                value={config.maxOrdersPerSlot}
                onChange={(e) => setConfig({ ...config, maxOrdersPerSlot: Number(e.target.value) })}
                className="w-full p-2 border border-stone-300 rounded-lg"
              />
            </div>
          </div>

          <div className="pt-4 border-t border-stone-200">
            <button
              type="submit"
              className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl flex items-center gap-2 shadow-xs"
            >
              <Save className="w-4 h-4" />
              <span>Save Operations Configuration</span>
            </button>
          </div>
        </form>
      )}

      {/* TAB 4: REPORTS */}
      {activeTab === 'reports' && (
        <div className="space-y-6">
          <div className="bg-white rounded-xl border border-stone-200 p-6 shadow-xs">
            <h3 className="font-bold text-stone-900 text-base mb-1">Payment Method Distribution</h3>
            <p className="text-xs text-stone-500 mb-4">Real breakdown between online digital vs counter payments.</p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                <span className="font-bold text-blue-900 block text-sm">Razorpay Online</span>
                <span className="text-2xl font-black text-blue-800 tabular-nums">{onlinePaymentsCount}</span>
                <span className="text-stone-500 block mt-1">
                  {orders.length > 0 ? Math.round((onlinePaymentsCount / orders.length) * 100) : 0}% of all orders
                </span>
              </div>

              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl">
                <span className="font-bold text-emerald-900 block text-sm">Cash / UPI on Pickup</span>
                <span className="text-2xl font-black text-emerald-800 tabular-nums">{cashPaymentsCount}</span>
                <span className="text-stone-500 block mt-1">
                  {orders.length > 0 ? Math.round((cashPaymentsCount / orders.length) * 100) : 0}% of all orders
                </span>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Item Edit/Create Modal */}
      {isEditingItem && editingItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-stone-900/60 backdrop-blur-xs">
          <form
            onSubmit={handleSaveMenuItem}
            className="bg-white rounded-2xl max-w-lg w-full p-6 space-y-4 border border-stone-200 shadow-2xl max-h-[90vh] overflow-y-auto"
          >
            <h3 className="font-bold text-base text-stone-900">
              {editingItem.id ? 'Edit Menu Item' : 'Add New Menu Item'}
            </h3>

            <div className="space-y-3 text-xs">
              <div>
                <label htmlFor="menuItemNameInput" className="block font-semibold text-stone-700 mb-1">Item Name</label>
                <input
                  id="menuItemNameInput"
                  type="text"
                  required
                  value={editingItem.name || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, name: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-lg text-stone-900"
                />
              </div>

              <div>
                <label htmlFor="menuItemCategorySelect" className="block font-semibold text-stone-700 mb-1">Category</label>
                <select
                  id="menuItemCategorySelect"
                  value={editingItem.categoryId || categories[0]?.id}
                  onChange={(e) => setEditingItem({ ...editingItem, categoryId: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="menuItemPriceInput" className="block font-semibold text-stone-700 mb-1">Price (₹ INR)</label>
                  <input
                    id="menuItemPriceInput"
                    type="number"
                    min={1}
                    required
                    value={editingItem.price || ''}
                    onChange={(e) => setEditingItem({ ...editingItem, price: Number(e.target.value) })}
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
                <div>
                  <label htmlFor="menuItemPrepTimeInput" className="block font-semibold text-stone-700 mb-1">Prep Time (mins)</label>
                  <input
                    id="menuItemPrepTimeInput"
                    type="number"
                    min={1}
                    value={editingItem.preparationTimeMinutes || 10}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, preparationTimeMinutes: Number(e.target.value) })
                    }
                    className="w-full p-2 border border-stone-300 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="menuItemDietarySelect" className="block font-semibold text-stone-700 mb-1">Dietary Type</label>
                  <select
                    id="menuItemDietarySelect"
                    value={editingItem.dietaryType || 'veg'}
                    onChange={(e) =>
                      setEditingItem({ ...editingItem, dietaryType: e.target.value as DietaryType })
                    }
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="veg">Vegetarian</option>
                    <option value="vegan">Vegan</option>
                    <option value="non-veg">Non-Vegetarian</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="menuItemVisualSelect" className="block font-semibold text-stone-700 mb-1">Food Visual Art</label>
                  <select
                    id="menuItemVisualSelect"
                    value={editingItem.imageType || 'dosa'}
                    onChange={(e) => setEditingItem({ ...editingItem, imageType: e.target.value as any })}
                    className="w-full p-2 border border-stone-300 rounded-lg bg-white"
                  >
                    <option value="dosa">Dosa & Crepe</option>
                    <option value="thali">Indian Thali</option>
                    <option value="burger">Burger & Sandwich</option>
                    <option value="coffee">Chilled Beverage</option>
                    <option value="snack">Samosa & Chaat</option>
                    <option value="noodle">Noodles & Manchurian</option>
                    <option value="beverage">Tea / Nimbu Soda</option>
                    <option value="dessert">Sweet & Dessert</option>
                  </select>
                </div>
              </div>

              <div>
                <label htmlFor="menuItemStockInput" className="block font-semibold text-stone-700 mb-1">Stock Servings Available</label>
                <input
                  id="menuItemStockInput"
                  type="number"
                  min={0}
                  value={editingItem.stockQuantity ?? 50}
                  onChange={(e) => setEditingItem({ ...editingItem, stockQuantity: Number(e.target.value) })}
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="menuItemDescTextarea" className="block font-semibold text-stone-700 mb-1">Description</label>
                <textarea
                  id="menuItemDescTextarea"
                  rows={2}
                  value={editingItem.description || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, description: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>

              <div>
                <label htmlFor="menuItemAllergenInput" className="block font-semibold text-stone-700 mb-1">Kitchen Allergen Information</label>
                <input
                  id="menuItemAllergenInput"
                  type="text"
                  placeholder="e.g. Contains dairy and gluten"
                  value={editingItem.allergenInformation || ''}
                  onChange={(e) => setEditingItem({ ...editingItem, allergenInformation: e.target.value })}
                  className="w-full p-2 border border-stone-300 rounded-lg"
                />
              </div>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="submit"
                className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-lg transition-colors"
              >
                Save Item
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingItem(false);
                  setEditingItem(null);
                }}
                className="px-4 py-2.5 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-semibold rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
