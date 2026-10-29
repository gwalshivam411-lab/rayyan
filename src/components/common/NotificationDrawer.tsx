import React from 'react';
import { useNotifications } from '../../context/NotificationContext';
import { X, Bell, BellRing, CheckCircle2, Clock } from 'lucide-react';

export const NotificationDrawer: React.FC = () => {
  const {
    notifications,
    isNotifDrawerOpen,
    setIsNotifDrawerOpen,
    markAsRead,
    markAllAsRead,
  } = useNotifications();

  if (!isNotifDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-stone-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-200">
      <div
        className="relative w-full max-w-sm bg-white h-full shadow-2xl flex flex-col justify-between overflow-hidden animate-in slide-in-from-right duration-300"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-4 border-b border-stone-200 flex items-center justify-between bg-stone-50">
          <div className="flex items-center gap-2">
            <Bell className="w-4 h-4 text-emerald-700" />
            <h3 className="font-bold text-stone-900 text-sm">Notifications</h3>
          </div>
          <div className="flex items-center gap-2">
            {notifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-900"
              >
                Mark all read
              </button>
            )}
            <button
              onClick={() => setIsNotifDrawerOpen(false)}
              className="p-1 text-stone-400 hover:text-stone-800 rounded-md"
              aria-label="Close notifications"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {notifications.length === 0 ? (
            <div className="text-center py-12 text-stone-400">
              <Bell className="w-8 h-8 mx-auto mb-2 opacity-50" />
              <span className="text-xs font-semibold block">No notifications yet</span>
              <span className="text-[11px] text-stone-500 block mt-0.5">
                Order updates and ready alerts will appear here.
              </span>
            </div>
          ) : (
            notifications.map((notif) => (
              <div
                key={notif.id}
                onClick={() => markAsRead(notif.id)}
                className={`p-3 rounded-xl border text-xs cursor-pointer transition-colors ${
                  notif.read
                    ? 'bg-white border-stone-200 text-stone-600'
                    : 'bg-emerald-50/70 border-emerald-300 text-stone-900 shadow-2xs'
                }`}
              >
                <div className="flex items-start justify-between gap-1 mb-1">
                  <span className="font-bold flex items-center gap-1.5">
                    {notif.type === 'ready' && <BellRing className="w-3.5 h-3.5 text-amber-600" />}
                    {notif.type === 'order' && <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />}
                    <span>{notif.title}</span>
                  </span>
                  <span className="text-[10px] text-stone-400">
                    {new Date(notif.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </span>
                </div>
                <p className="text-[11px] text-stone-600 leading-relaxed">{notif.message}</p>
              </div>
            ))
          )}
        </div>

        <div className="p-3 bg-stone-50 border-t border-stone-200 text-center">
          <span className="text-[11px] text-stone-500">Real-time canteen broadcast channel</span>
        </div>
      </div>
    </div>
  );
};
