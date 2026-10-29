import React, { useState } from 'react';
import { useAuth } from '../../context/AuthContext';
import { useCart } from '../../context/CartContext';
import { useNotifications } from '../../context/NotificationContext';
import { ShoppingBag, Bell, User, Check, ChevronDown, Menu as MenuIcon, X } from 'lucide-react';
import { UserRole } from '../../types';

interface HeaderProps {
  activeView: 'home' | 'menu' | 'slots' | 'orders' | 'staff' | 'admin';
  setActiveView: (view: 'home' | 'menu' | 'slots' | 'orders' | 'staff' | 'admin') => void;
  onOpenPickupBoard: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeView,
  setActiveView,
  onOpenPickupBoard,
}) => {
  const { user, role, switchRole } = useAuth();
  const { itemCount, setIsCartDrawerOpen } = useCart();
  const { unreadCount, setIsNotifDrawerOpen } = useNotifications();

  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleRoleSelect = (newRole: UserRole) => {
    switchRole(newRole);
    setRoleMenuOpen(false);
    if (newRole === 'staff') {
      setActiveView('staff');
    } else if (newRole === 'admin') {
      setActiveView('admin');
    } else {
      setActiveView('menu');
    }
  };

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-stone-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
        {/* Zone 1: Brand Wordmark (Single text element wordmark) */}
        <button
          onClick={() => setActiveView('home')}
          className="text-lg font-black tracking-tight text-stone-900 whitespace-nowrap shrink-0 flex items-center gap-2 text-left"
        >
          <span className="w-8 h-8 rounded-lg bg-emerald-700 text-white flex items-center justify-center font-extrabold text-sm shadow-2xs">
            CB
          </span>
          <span className="flex flex-col">
            <span className="leading-none text-stone-900">CampusBite</span>
            <span className="text-[10px] font-semibold text-emerald-700 tracking-wide leading-none mt-0.5">
              Digital Canteen
            </span>
          </span>
        </button>

        {/* Zone 2: 4-5 Nav Links (Single line, text with hover underlines) */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold text-stone-600">
          <button
            onClick={() => setActiveView('home')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'home'
                ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            Home
          </button>
          <button
            onClick={() => setActiveView('menu')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'menu'
                ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            Digital Menu
          </button>
          <button
            onClick={() => setActiveView('slots')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'slots'
                ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            Pickup Schedule
          </button>
          <button
            onClick={() => setActiveView('orders')}
            className={`whitespace-nowrap shrink-0 transition-colors py-1 ${
              activeView === 'orders'
                ? 'text-emerald-800 font-bold border-b-2 border-emerald-700'
                : 'hover:text-stone-900'
            }`}
          >
            My Orders
          </button>
          <button
            onClick={onOpenPickupBoard}
            className="whitespace-nowrap shrink-0 transition-colors py-1 hover:text-stone-900 text-stone-500"
          >
            Counter Board
          </button>
        </nav>

        {/* Zone 3: 1 Primary Action (Tray) + Role & Account Switcher */}
        <div className="flex items-center gap-2.5 shrink-0">
          {/* Notifications Button */}
          <button
            onClick={() => setIsNotifDrawerOpen(true)}
            className="relative p-2 text-stone-600 hover:text-stone-900 rounded-lg hover:bg-stone-100 transition-colors"
            aria-label="View notifications"
          >
            <Bell className="w-4 h-4" />
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-500 ring-2 ring-white" />
            )}
          </button>

          {/* Cart Tray Button (Primary CTA) */}
          <button
            onClick={() => setIsCartDrawerOpen(true)}
            className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 active:scale-95 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-xs whitespace-nowrap shrink-0"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Tray</span>
            {itemCount > 0 && (
              <span className="bg-emerald-900/60 text-white font-mono text-[11px] px-1.5 py-0.2 rounded font-black tabular-nums">
                {itemCount}
              </span>
            )}
          </button>

          {/* Role / User Switcher */}
          <div className="relative">
            <button
              onClick={() => setRoleMenuOpen(!roleMenuOpen)}
              className="flex items-center gap-1.5 p-1.5 sm:px-2.5 sm:py-1.5 text-xs font-semibold text-stone-700 hover:bg-stone-100 rounded-xl transition-colors border border-stone-200"
            >
              <div
                className={`w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-bold text-white uppercase ${
                  role === 'admin' ? 'bg-purple-700' : role === 'staff' ? 'bg-amber-700' : 'bg-stone-800'
                }`}
              >
                {user.fullName[0]}
              </div>
              <span className="hidden sm:inline max-w-[90px] truncate text-stone-800">
                {role === 'student' ? 'Student' : role === 'staff' ? 'Staff' : 'Admin'}
              </span>
              <ChevronDown className="w-3.5 h-3.5 text-stone-400" />
            </button>

            {roleMenuOpen && (
              <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-xl border border-stone-200 py-1.5 z-50 animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-stone-100">
                  <span className="text-[11px] text-stone-400 uppercase tracking-wider block">Signed in as</span>
                  <span className="font-bold text-xs text-stone-900 block truncate">{user.fullName}</span>
                  <span className="text-[11px] text-stone-500 block truncate">{user.email}</span>
                </div>

                <div className="py-1">
                  <span className="px-3 py-1 text-[10px] font-bold text-stone-400 uppercase tracking-wider block">
                    Switch Active Persona:
                  </span>
                  <button
                    onClick={() => handleRoleSelect('student')}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-stone-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-stone-800 block">Rahul (Student)</span>
                      <span className="text-[11px] text-stone-500">Order, pay & schedule pickup</span>
                    </div>
                    {role === 'student' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => handleRoleSelect('staff')}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-stone-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-stone-800 block">Chef Murugan (Staff)</span>
                      <span className="text-[11px] text-stone-500">Kitchen queue & pickup verify</span>
                    </div>
                    {role === 'staff' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>

                  <button
                    onClick={() => handleRoleSelect('admin')}
                    className="w-full px-3 py-2 text-xs text-left hover:bg-stone-50 flex items-center justify-between"
                  >
                    <div>
                      <span className="font-semibold text-stone-800 block">Prof. Sen (Admin)</span>
                      <span className="text-[11px] text-stone-500">Catalog, slot limits & reports</span>
                    </div>
                    {role === 'admin' && <Check className="w-3.5 h-3.5 text-emerald-600" />}
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger menu toggle */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="md:hidden p-2 text-stone-600 hover:text-stone-900 rounded-lg"
            aria-label="Toggle mobile menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <MenuIcon className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile navigation drop */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-stone-200 bg-white p-4 space-y-2 text-xs font-semibold text-stone-700 animate-in slide-in-from-top-2">
          <button
            onClick={() => {
              setActiveView('home');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-stone-50"
          >
            Home
          </button>
          <button
            onClick={() => {
              setActiveView('menu');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-stone-50"
          >
            Digital Menu
          </button>
          <button
            onClick={() => {
              setActiveView('slots');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-stone-50"
          >
            Pickup Schedule
          </button>
          <button
            onClick={() => {
              setActiveView('orders');
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-stone-50"
          >
            My Orders
          </button>
          <button
            onClick={() => {
              onOpenPickupBoard();
              setMobileMenuOpen(false);
            }}
            className="w-full text-left py-2 px-3 rounded-lg hover:bg-stone-50"
          >
            Public Counter Board
          </button>
          {role === 'staff' && (
            <button
              onClick={() => {
                setActiveView('staff');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg bg-amber-50 text-amber-900 font-bold"
            >
              Kitchen Operations
            </button>
          )}
          {role === 'admin' && (
            <button
              onClick={() => {
                setActiveView('admin');
                setMobileMenuOpen(false);
              }}
              className="w-full text-left py-2 px-3 rounded-lg bg-purple-50 text-purple-900 font-bold"
            >
              Administration Portal
            </button>
          )}
        </div>
      )}
    </header>
  );
};
