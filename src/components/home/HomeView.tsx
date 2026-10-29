import React, { useState, useEffect } from 'react';
import { MenuItem, Category, Order, CanteenConfig } from '../../types';
import { StorageService } from '../../lib/storage';
import { useAuth } from '../../context/AuthContext';
import { FoodCard } from '../common/FoodCard';
import { FoodArtVisual } from '../common/FoodArtVisual';
import {
  ArrowRight,
  Clock,
  Sparkles,
  BellRing,
  ChevronRight,
  Flame,
  CheckCircle2,
  Calendar,
  ShieldCheck,
  Megaphone,
} from 'lucide-react';

interface HomeViewProps {
  onNavigateToMenu: (categorySlug?: string) => void;
  onNavigateToSlots: () => void;
  onOpenOrderTracker: (order: Order) => void;
  onOpenDetails: (item: MenuItem) => void;
  onOpenPickupBoard: () => void;
}

export const HomeView: React.FC<HomeViewProps> = ({
  onNavigateToMenu,
  onNavigateToSlots,
  onOpenOrderTracker,
  onOpenDetails,
  onOpenPickupBoard,
}) => {
  const { user } = useAuth();
  const [categories, setCategories] = useState<Category[]>([]);
  const [popularItems, setPopularItems] = useState<MenuItem[]>([]);
  const [todaysSpecials, setTodaysSpecials] = useState<MenuItem[]>([]);
  const [activeOrder, setActiveOrder] = useState<Order | null>(null);
  const [config, setConfig] = useState<CanteenConfig>(() => StorageService.getConfig());

  const loadHomeData = () => {
    const allCategories = StorageService.getCategories();
    const allMenu = StorageService.getMenuItems().filter((i) => i.isActive);
    const allOrders = StorageService.getOrders();
    const currentConfig = StorageService.getConfig();

    setCategories(allCategories);
    setConfig(currentConfig);

    // Active order for student
    const studentActive = allOrders.find(
      (o) => o.studentId === user.id && ['placed', 'accepted', 'preparing', 'ready'].includes(o.orderStatus)
    );
    setActiveOrder(studentActive || null);

    // Popular items calculated from real totalSold
    const sorted = [...allMenu].sort((a, b) => (b.totalSold || 0) - (a.totalSold || 0));
    setPopularItems(sorted.slice(0, 4));

    // Today's specials
    const specials = allMenu.filter((i) => i.isSpecialToday);
    setTodaysSpecials(specials.slice(0, 4));
  };

  useEffect(() => {
    loadHomeData();
    const handleSync = () => loadHomeData();
    window.addEventListener('campusbite_storage_sync', handleSync);
    return () => window.removeEventListener('campusbite_storage_sync', handleSync);
  }, [user.id]);

  return (
    <div className="space-y-12 pb-12">
      {/* Canteen Announcement Banner if exists */}
      {config.announcement && (
        <div className="bg-emerald-800 text-emerald-50 text-xs py-2.5 px-4 text-center border-b border-emerald-900/60 flex items-center justify-center gap-2">
          <Megaphone className="w-3.5 h-3.5 text-emerald-300 shrink-0" />
          <span className="font-medium">{config.announcement}</span>
        </div>
      )}

      {/* Hero Welcome Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 pt-4">
        <div className="relative rounded-3xl bg-gradient-to-br from-stone-900 via-stone-900 to-emerald-950 text-white overflow-hidden p-6 sm:p-12 shadow-xl border border-stone-800">
          {/* Subtle geometric background accents */}
          <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-[radial-gradient(circle_at_top_right,rgba(16,185,129,0.18)_0%,transparent_70%)] pointer-events-none" />

          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-300 text-xs font-bold border border-emerald-500/30">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Canteen Express</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight leading-tight text-white">
              Good food. <br className="hidden sm:inline" />
              <span className="text-emerald-400">Less waiting.</span>
            </h1>

            <p className="text-stone-300 text-sm sm:text-base leading-relaxed max-w-lg">
              Order your favourite campus meals before the break begins. Select a pickup slot, pay securely, and collect hot food without standing in line.
            </p>

            <div className="pt-2 flex flex-wrap items-center gap-3">
              <button
                onClick={() => onNavigateToMenu()}
                className="px-6 py-3 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white font-bold text-xs sm:text-sm rounded-xl transition-all flex items-center gap-2 shadow-md"
              >
                <span>Explore Full Menu</span>
                <ArrowRight className="w-4 h-4" />
              </button>

              <button
                onClick={onNavigateToSlots}
                className="px-5 py-3 bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs sm:text-sm rounded-xl transition-colors border border-stone-700 flex items-center gap-2"
              >
                <Clock className="w-4 h-4 text-emerald-400" />
                <span>Pickup Schedule</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Active Order Status Card (Section 7.C) */}
      {activeOrder && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="bg-white rounded-2xl border-2 border-emerald-500/80 p-5 shadow-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div className="flex items-start gap-3.5">
              <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
                <BellRing className="w-6 h-6 animate-bounce" />
              </div>

              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-stone-900 text-base sm:text-lg">
                    {activeOrder.orderNumber}
                  </span>
                  <span
                    className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                      activeOrder.orderStatus === 'ready'
                        ? 'bg-amber-100 text-amber-900 animate-pulse font-extrabold'
                        : 'bg-emerald-100 text-emerald-900'
                    }`}
                  >
                    {activeOrder.orderStatus.replace('_', ' ')}
                  </span>
                </div>

                <div className="text-xs text-stone-600 mt-1 flex flex-wrap items-center gap-2">
                  <span>Pickup Slot: <strong>{activeOrder.pickupSlotDisplay}</strong></span>
                  <span aria-hidden="true" className="text-stone-300">·</span>
                  <span>Pickup Code: <strong className="font-mono text-emerald-700">{activeOrder.pickupCode}</strong></span>
                </div>

                <p className="text-xs text-stone-500 mt-0.5">
                  {activeOrder.items.map((i) => `${i.quantity}x ${i.itemName}`).join(', ')}
                </p>
              </div>
            </div>

            <button
              onClick={() => onOpenOrderTracker(activeOrder)}
              className="px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs whitespace-nowrap self-start md:self-auto"
            >
              <span>Track Live Preparation</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </section>
      )}

      {/* Food Categories (Section 7.D) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">Food Categories</h2>
            <p className="text-xs text-stone-500">Pick from freshly cooked morning items to evening chaat.</p>
          </div>
          <button
            onClick={() => onNavigateToMenu()}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
          >
            <span>View All</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => onNavigateToMenu(cat.slug)}
              className="p-3.5 bg-white rounded-xl border border-stone-200/90 hover:border-emerald-500 hover:bg-emerald-50/30 transition-all text-center flex flex-col items-center justify-center gap-2 shadow-2xs group"
            >
              <div className="w-10 h-10 rounded-full bg-stone-100 group-hover:bg-emerald-100 flex items-center justify-center text-lg transition-colors">
                {cat.slug === 'breakfast' && '🥞'}
                {cat.slug === 'meals' && '🍛'}
                {cat.slug === 'snacks' && '🥟'}
                {cat.slug === 'fast-food' && '🍔'}
                {cat.slug === 'beverages' && '🥤'}
                {cat.slug === 'healthy' && '🥗'}
                {cat.slug === 'desserts' && '🍨'}
              </div>
              <span className="font-semibold text-stone-800 text-xs group-hover:text-emerald-800 transition-colors">
                {cat.name}
              </span>
            </button>
          ))}
        </div>
      </section>

      {/* Today's Chef Specials (Section 7.F) */}
      {todaysSpecials.length > 0 && (
        <section className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <div className="flex items-center gap-1.5 text-xs font-bold text-amber-700 uppercase tracking-wider mb-0.5">
                <Flame className="w-3.5 h-3.5" />
                <span>Today's Specials</span>
              </div>
              <h2 className="text-lg sm:text-xl font-bold text-stone-900">
                Recommended by Canteen Chef
              </h2>
            </div>
            <button
              onClick={() => onNavigateToMenu()}
              className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
            >
              <span>See Menu</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {todaysSpecials.map((item) => (
              <FoodCard key={item.id} item={item} onOpenDetails={onOpenDetails} />
            ))}
          </div>
        </section>
      )}

      {/* Popular Items based on Real Order Data (Section 7.E) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-stone-900">Most Popular on Campus</h2>
            <p className="text-xs text-stone-500">Student favorites calculated from actual kitchen records.</p>
          </div>
          <button
            onClick={() => onNavigateToMenu()}
            className="text-xs font-bold text-emerald-800 hover:text-emerald-950 flex items-center gap-1"
          >
            <span>Full Catalog</span>
            <ChevronRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {popularItems.map((item) => (
            <FoodCard key={item.id} item={item} onOpenDetails={onOpenDetails} />
          ))}
        </div>
      </section>

      {/* How It Works (Section 7.G) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-white rounded-3xl border border-stone-200 p-6 sm:p-10 shadow-xs">
          <div className="text-center max-w-xl mx-auto mb-8">
            <span className="text-xs font-bold text-emerald-800 uppercase tracking-wider block mb-1">
              Zero Queuing Workflow
            </span>
            <h2 className="text-xl sm:text-2xl font-black text-stone-900 tracking-tight">
              How CampusBite Works
            </h2>
            <p className="text-stone-500 text-xs mt-1">
              Skip 15-minute counter rushes between classes in 4 easy steps.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 text-xs text-center">
            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-base">
                1
              </div>
              <h3 className="font-bold text-stone-900 text-sm">Choose Your Food</h3>
              <p className="text-stone-500 leading-relaxed">
                Browse hot dosas, thalis, sandwiches, beverages with live availability.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-base">
                2
              </div>
              <h3 className="font-bold text-stone-900 text-sm">Select Pickup Slot</h3>
              <p className="text-stone-500 leading-relaxed">
                Choose a 15-minute slot aligned with your class or lab break.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-base">
                3
              </div>
              <h3 className="font-bold text-stone-900 text-sm">Pay Securely</h3>
              <p className="text-stone-500 leading-relaxed">
                Pay online via Razorpay UPI/Cards or choose Cash on Pickup.
              </p>
            </div>

            <div className="p-4 rounded-2xl bg-stone-50 border border-stone-200/80 space-y-2">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-800 font-black flex items-center justify-center mx-auto text-base">
                4
              </div>
              <h3 className="font-bold text-stone-900 text-sm">Collect at Counter</h3>
              <p className="text-stone-500 leading-relaxed">
                Show your 4-digit code at Counter 1 or 2 when the screen dings ready.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Canteen Information strip (Section 7.H) */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6">
        <div className="bg-emerald-50/70 border border-emerald-200/80 rounded-2xl p-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-700 text-white flex items-center justify-center font-bold">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <span className="font-bold text-stone-900 text-sm block">
                {config.canteenName}
              </span>
              <span className="text-stone-600 block mt-0.5">
                {config.location} · Open Mon–Sat: {config.openingTime} AM – {config.closingTime} PM
              </span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={onOpenPickupBoard}
              className="px-4 py-2 bg-stone-900 hover:bg-stone-800 text-white rounded-xl text-xs font-bold transition-colors"
            >
              View Public Counter Board
            </button>
          </div>
        </div>
      </section>
    </div>
  );
};
