import React from 'react';
import { MenuItem } from '../../types';

interface FoodArtVisualProps {
  item: MenuItem;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export const FoodArtVisual: React.FC<FoodArtVisualProps> = ({ item, className = '', size = 'md' }) => {
  // Size classes
  const sizeClasses = {
    sm: 'h-24',
    md: 'h-44',
    lg: 'h-64',
  }[size];

  // Specific visual styling based on food type
  const getVisualConfig = () => {
    switch (item.imageType) {
      case 'dosa':
        return {
          bg: 'from-amber-100 via-amber-50 to-orange-100/70',
          accent: 'text-amber-800',
          emoji: '🥞',
          badge: 'Golden Crispy',
          svg: (
            <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-md">
              <ellipse cx="100" cy="85" rx="85" ry="25" fill="#4ade80" fillOpacity="0.25" />
              <path d="M 30 75 Q 100 25 170 75 Z" fill="#d97706" />
              <path d="M 40 73 Q 100 35 160 73 Z" fill="#b45309" fillOpacity="0.4" />
              {/* Chutney katoris */}
              <circle cx="50" cy="88" r="14" fill="#f8fafc" stroke="#e2e8f0" strokeWidth="2" />
              <circle cx="50" cy="88" r="10" fill="#f1f5f9" />
              <circle cx="85" cy="94" r="15" fill="#ea580c" stroke="#fed7aa" strokeWidth="2" />
            </svg>
          ),
        };
      case 'thali':
        return {
          bg: 'from-orange-100 via-amber-50 to-stone-100',
          accent: 'text-orange-800',
          emoji: '🍛',
          badge: 'Executive Platter',
          svg: (
            <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-md">
              <ellipse cx="100" cy="65" rx="75" ry="45" fill="#e2e8f0" stroke="#cbd5e1" strokeWidth="4" />
              <circle cx="70" cy="48" r="18" fill="#f97316" stroke="#fdba74" strokeWidth="2" />
              <circle cx="110" cy="45" r="18" fill="#eab308" stroke="#fef08a" strokeWidth="2" />
              <circle cx="138" cy="62" r="16" fill="#f8fafc" stroke="#cbd5e1" strokeWidth="2" />
              <ellipse cx="95" cy="80" rx="28" ry="16" fill="#ffffff" stroke="#e2e8f0" strokeWidth="1.5" />
              <ellipse cx="62" cy="78" rx="16" ry="10" fill="#b45309" />
            </svg>
          ),
        };
      case 'burger':
        return {
          bg: 'from-amber-100 via-yellow-50 to-orange-100',
          accent: 'text-amber-900',
          emoji: '🍔',
          badge: 'Toasted Bun',
          svg: (
            <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-md">
              <ellipse cx="100" cy="90" rx="46" ry="14" fill="#d97706" />
              <ellipse cx="100" cy="80" rx="48" ry="12" fill="#78350f" />
              <path d="M 52 74 Q 100 80 148 74" stroke="#eab308" strokeWidth="6" strokeLinecap="round" />
              <path d="M 50 68 Q 100 62 150 68" stroke="#22c55e" strokeWidth="5" strokeLinecap="round" />
              <path d="M 54 60 Q 100 20 146 60 Z" fill="#f59e0b" />
              <circle cx="85" cy="45" r="1.5" fill="#fffbeb" />
              <circle cx="105" cy="42" r="1.5" fill="#fffbeb" />
              <circle cx="120" cy="48" r="1.5" fill="#fffbeb" />
            </svg>
          ),
        };
      case 'coffee':
        return {
          bg: 'from-stone-200 via-amber-100 to-amber-200/60',
          accent: 'text-amber-950',
          emoji: '🥤',
          badge: 'Chilled Espresso',
          svg: (
            <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-md">
              <path d="M 80 35 L 86 98 Q 100 106 114 98 L 120 35 Z" fill="#78350f" stroke="#e2e8f0" strokeWidth="2" />
              <path d="M 82 45 L 86 95 Q 100 102 114 95 L 118 45 Z" fill="#451a03" />
              <ellipse cx="100" cy="35" rx="22" ry="7" fill="#fef3c7" />
              <path d="M 100 32 L 108 12" stroke="#ea580c" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ),
        };
      case 'snack':
        return {
          bg: 'from-orange-100 via-amber-50 to-yellow-100',
          accent: 'text-orange-900',
          emoji: '🥟',
          badge: 'Hot Savoury',
          svg: (
            <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-md">
              <polygon points="100,28 60,88 140,88" fill="#d97706" />
              <polygon points="100,34 68,85 132,85" fill="#b45309" fillOpacity="0.35" />
              <circle cx="145" cy="85" r="6" fill="#16a34a" />
            </svg>
          ),
        };
      case 'noodle':
        return {
          bg: 'from-red-100 via-orange-50 to-amber-100',
          accent: 'text-red-900',
          emoji: '🍜',
          badge: 'Wok Tossed',
          svg: (
            <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-md">
              <ellipse cx="100" cy="72" rx="55" ry="32" fill="#ef4444" />
              <ellipse cx="100" cy="65" rx="48" ry="24" fill="#fef08a" />
              <path d="M 75 42 L 135 22" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
              <path d="M 82 48 L 140 28" stroke="#78350f" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ),
        };
      case 'beverage':
        return {
          bg: 'from-emerald-100 via-teal-50 to-emerald-200/60',
          accent: 'text-emerald-900',
          emoji: '🧃',
          badge: 'Refreshing',
          svg: (
            <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-md">
              <path d="M 82 30 L 88 95 Q 100 102 112 95 L 118 30 Z" fill="#34d399" />
              <circle cx="100" cy="50" r="3" fill="#ffffff" fillOpacity="0.6" />
              <circle cx="95" cy="70" r="2" fill="#ffffff" fillOpacity="0.6" />
              <circle cx="105" cy="80" r="2.5" fill="#ffffff" fillOpacity="0.6" />
              <path d="M 108 26 L 118 10" stroke="#047857" strokeWidth="3" strokeLinecap="round" />
            </svg>
          ),
        };
      default:
        return {
          bg: 'from-stone-100 via-amber-50 to-stone-200',
          accent: 'text-stone-800',
          emoji: '🍽️',
          badge: 'Chef Special',
          svg: (
            <svg viewBox="0 0 200 120" className="w-full h-full drop-shadow-md">
              <ellipse cx="100" cy="70" rx="60" ry="30" fill="#f1f5f9" stroke="#cbd5e1" strokeWidth="2" />
              <circle cx="100" cy="65" r="18" fill="#d97706" />
            </svg>
          ),
        };
    }
  };

  const visual = getVisualConfig();

  return (
    <div
      className={`relative w-full ${sizeClasses} overflow-hidden bg-gradient-to-br ${visual.bg} flex items-center justify-center p-3 select-none ${className}`}
    >
      {/* Background radial accent glow */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.7)_0%,transparent_75%)] pointer-events-none" />

      {/* Stylized vector SVG illustration */}
      <div className="relative z-10 w-full max-w-[170px] h-full flex items-center justify-center transition-transform duration-300 group-hover:scale-105">
        {visual.svg}
      </div>

      {/* Floating subtle emoji cue */}
      <span className="absolute top-2.5 right-2.5 text-base sm:text-lg z-20 filter drop-shadow-sm opacity-90">
        {visual.emoji}
      </span>
    </div>
  );
};
