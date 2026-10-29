import React from 'react';
import { StorageService } from '../../lib/storage';
import { MapPin, Phone, Clock, ShieldCheck, Heart } from 'lucide-react';

interface FooterProps {
  onOpenSetupGuide: () => void;
  onOpenPickupBoard: () => void;
}

export const Footer: React.FC<FooterProps> = ({ onOpenSetupGuide, onOpenPickupBoard }) => {
  const config = StorageService.getConfig();

  return (
    <footer className="bg-stone-900 text-stone-300 border-t border-stone-800 text-xs mt-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
          {/* Brand */}
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="w-7 h-7 rounded-lg bg-emerald-600 text-white flex items-center justify-center font-bold text-xs">
                CB
              </span>
              <span className="font-bold text-base text-white">CampusBite</span>
            </div>
            <p className="text-stone-400 text-xs leading-relaxed">
              Order Smart. Eat Fresh. Skip the Queue. Built for college break hours so students and faculty enjoy hot meals on time.
            </p>
          </div>

          {/* Canteen Information */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Canteen Timings</h4>
            <div className="flex items-start gap-2 text-stone-400">
              <Clock className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>
                Mon - Sat: {config.openingTime} AM – {config.closingTime} PM
              </span>
            </div>
            <div className="flex items-start gap-2 text-stone-400">
              <MapPin className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{config.location}</span>
            </div>
            <div className="flex items-start gap-2 text-stone-400">
              <Phone className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <span>{config.contactPhone}</span>
            </div>
          </div>

          {/* Quick Features */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">Smart Campus</h4>
            <ul className="space-y-1.5 text-stone-400">
              <li>
                <button onClick={onOpenPickupBoard} className="hover:text-white transition-colors">
                  Digital Pickup Board
                </button>
              </li>
              <li>15-Minute Slot Scheduling</li>
              <li>Express UPI & Cash on Pickup</li>
              <li>Zero Student Convenience Fees</li>
            </ul>
          </div>

          {/* Integration & Setup */}
          <div className="space-y-2.5">
            <h4 className="font-bold text-white uppercase text-[11px] tracking-wider">System Architecture</h4>
            <p className="text-stone-400 text-[11px] leading-relaxed">
              Designed for Supabase PostgreSQL & Razorpay. Fully operational with instant local reactive state.
            </p>
            <button
              onClick={onOpenSetupGuide}
              className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-stone-800 hover:bg-stone-700 text-stone-200 rounded-lg text-xs font-semibold transition-colors border border-stone-700"
            >
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
              <span>Database & Keys Guide</span>
            </button>
          </div>
        </div>

        <div className="pt-8 border-t border-stone-800 flex flex-col sm:flex-row items-center justify-between gap-4 text-stone-500 text-[11px]">
          <div>
            © {new Date().getFullYear()} CampusBite — Digital College Canteen Platform. All rights reserved.
          </div>
          <div className="flex items-center gap-1">
            <span>Crafted for high-efficiency campus food services</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
