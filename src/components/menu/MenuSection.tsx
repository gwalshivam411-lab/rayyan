import React, { useState, useEffect, useMemo } from 'react';
import { MenuItem, Category, DietaryType } from '../../types';
import { StorageService } from '../../lib/storage';
import { FoodCard } from '../common/FoodCard';
import { Search, SlidersHorizontal, Flame, Sparkles, X, ArrowUpDown } from 'lucide-react';

interface MenuSectionProps {
  onOpenDetails: (item: MenuItem) => void;
  selectedCategorySlug?: string;
}

export const MenuSection: React.FC<MenuSectionProps> = ({
  onOpenDetails,
  selectedCategorySlug,
}) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>(selectedCategorySlug || 'all');
  const [searchQuery, setSearchQuery] = useState('');
  const [dietaryFilter, setDietaryFilter] = useState<'all' | 'veg' | 'vegan' | 'non-veg'>('all');
  const [sortBy, setSortBy] = useState<'popular' | 'price_low' | 'price_high' | 'prep_time'>('popular');
  const [maxPrice, setMaxPrice] = useState<number>(200);

  const loadData = () => {
    setCategories(StorageService.getCategories());
    setMenuItems(StorageService.getMenuItems().filter((i) => i.isActive));
  };

  useEffect(() => {
    loadData();
    const handleSync = () => loadData();
    window.addEventListener('campusbite_storage_sync', handleSync);
    return () => window.removeEventListener('campusbite_storage_sync', handleSync);
  }, []);

  useEffect(() => {
    if (selectedCategorySlug) {
      setActiveCategory(selectedCategorySlug);
    }
  }, [selectedCategorySlug]);

  // Filter & sort logic
  const filteredItems = useMemo(() => {
    return menuItems
      .filter((item) => {
        // Category filter
        if (activeCategory !== 'all') {
          const cat = categories.find((c) => c.slug === activeCategory);
          if (cat && item.categoryId !== cat.id) return false;
        }

        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchName = item.name.toLowerCase().includes(q);
          const matchDesc = item.description.toLowerCase().includes(q);
          const matchTag = item.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchName && !matchDesc && !matchTag) return false;
        }

        // Dietary filter
        if (dietaryFilter !== 'all') {
          if (dietaryFilter === 'veg' && item.dietaryType !== 'veg' && item.dietaryType !== 'vegan') {
            return false;
          }
          if (dietaryFilter === 'vegan' && item.dietaryType !== 'vegan') {
            return false;
          }
          if (dietaryFilter === 'non-veg' && item.dietaryType !== 'non-veg') {
            return false;
          }
        }

        // Price range
        if (item.price > maxPrice) return false;

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price_low') return a.price - b.price;
        if (sortBy === 'price_high') return b.price - a.price;
        if (sortBy === 'prep_time') return a.preparationTimeMinutes - b.preparationTimeMinutes;
        // Default: popularity by actual sales
        return (b.totalSold || 0) - (a.totalSold || 0);
      });
  }, [menuItems, categories, activeCategory, searchQuery, dietaryFilter, sortBy, maxPrice]);

  return (
    <section id="menu-section" className="py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6">
        {/* Section Heading */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-emerald-800 tracking-wider uppercase mb-1">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Campus Digital Menu</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-stone-900 tracking-tight">
              Fresh Daily Food & Beverages
            </h2>
            <p className="text-stone-500 text-xs sm:text-sm mt-1 max-w-xl">
              Cooked fresh upon order. Choose your items, pick a convenient collection time, and pick up your meal piping hot.
            </p>
          </div>

          {/* Quick Dietary Filters (Segmented controls) */}
          <div className="flex items-center gap-1 p-1 bg-stone-200/70 rounded-xl self-start md:self-auto">
            <button
              onClick={() => setDietaryFilter('all')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                dietaryFilter === 'all'
                  ? 'bg-white text-stone-900 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              All Items
            </button>
            <button
              onClick={() => setDietaryFilter('veg')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                dietaryFilter === 'veg'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              <span className="w-2 h-2 rounded-full bg-emerald-600" />
              <span>Pure Veg</span>
            </button>
            <button
              onClick={() => setDietaryFilter('vegan')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap ${
                dietaryFilter === 'vegan'
                  ? 'bg-white text-emerald-800 shadow-2xs'
                  : 'text-stone-600 hover:text-stone-900'
              }`}
            >
              Vegan
            </button>
          </div>
        </div>

        {/* Filter Bar: Category Tabs & Search & Sort */}
        <div className="space-y-4 mb-8">
          {/* Category Horizontal Scroll Tab Bar */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setActiveCategory('all')}
              className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                activeCategory === 'all'
                  ? 'bg-stone-900 text-white shadow-xs'
                  : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
              }`}
            >
              All Categories ({menuItems.length})
            </button>
            {categories.map((cat) => {
              const count = menuItems.filter((i) => i.categoryId === cat.id).length;
              const isSelected = activeCategory === cat.slug;

              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.slug)}
                  className={`px-4 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                    isSelected
                      ? 'bg-emerald-700 text-white shadow-xs'
                      : 'bg-white text-stone-700 hover:bg-stone-100 border border-stone-200'
                  }`}
                >
                  {cat.name} ({count})
                </button>
              );
            })}
          </div>

          {/* Search & Sort Controls Row */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 bg-white p-3 rounded-2xl border border-stone-200 shadow-2xs">
            {/* Search Input */}
            <div className="relative w-full sm:w-80">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
              <input
                type="text"
                placeholder="Search food by name, snack, chaat..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-8 py-2 text-xs border border-stone-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-emerald-600 text-stone-800 placeholder:text-stone-400"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-stone-400 hover:text-stone-700"
                  aria-label="Clear search"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort & Price Filter */}
            <div className="flex items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
              {/* Max Price Slider Display */}
              <div className="hidden lg:flex items-center gap-2 text-xs text-stone-600">
                <span>Max Price:</span>
                <input
                  type="range"
                  min={30}
                  max={200}
                  step={10}
                  value={maxPrice}
                  onChange={(e) => setMaxPrice(Number(e.target.value))}
                  className="w-24 accent-emerald-700"
                />
                <span className="font-bold text-stone-800 tabular-nums">₹{maxPrice}</span>
              </div>

              {/* Sort Dropdown */}
              <div className="flex items-center gap-1.5 text-xs text-stone-600 w-full sm:w-auto justify-end">
                <ArrowUpDown className="w-3.5 h-3.5 text-stone-400 shrink-0" />
                <span className="hidden sm:inline">Sort:</span>
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-stone-50 border border-stone-200 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-stone-800 focus:outline-none"
                >
                  <option value="popular">Most Popular</option>
                  <option value="price_low">Price: Low to High</option>
                  <option value="price_high">Price: High to Low</option>
                  <option value="prep_time">Fastest Prep Time</option>
                </select>
              </div>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredItems.length === 0 ? (
          <div className="bg-white rounded-2xl border border-stone-200 p-12 text-center shadow-xs">
            <Search className="w-10 h-10 text-stone-300 mx-auto mb-3" />
            <h3 className="font-bold text-stone-800 text-base">No food items found</h3>
            <p className="text-xs text-stone-500 mt-1 max-w-sm mx-auto">
              Try adjusting your search keywords, price range, or dietary filters.
            </p>
            <button
              onClick={() => {
                setSearchQuery('');
                setActiveCategory('all');
                setDietaryFilter('all');
                setMaxPrice(200);
              }}
              className="mt-4 px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 rounded-lg text-xs font-semibold transition-colors"
            >
              Reset Filters
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
            {filteredItems.map((item) => (
              <FoodCard key={item.id} item={item} onOpenDetails={onOpenDetails} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};
