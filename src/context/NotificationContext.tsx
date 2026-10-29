import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { AppNotification } from '../types';
import { StorageService } from '../lib/storage';
import { useAuth } from './AuthContext';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type: 'success' | 'info' | 'ready' | 'error';
}

interface NotificationContextType {
  notifications: AppNotification[];
  unreadCount: number;
  markAsRead: (id: string) => void;
  markAllAsRead: () => void;
  toasts: ToastItem[];
  addToast: (toast: Omit<ToastItem, 'id'>) => void;
  removeToast: (id: string) => void;
  soundEnabled: boolean;
  setSoundEnabled: (enabled: boolean) => void;
  playChime: (type?: 'ready' | 'normal') => void;
  isNotifDrawerOpen: boolean;
  setIsNotifDrawerOpen: (open: boolean) => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [soundEnabled, setSoundEnabled] = useState(true);
  const [isNotifDrawerOpen, setIsNotifDrawerOpen] = useState(false);

  // Play pleasant web audio chime
  const playChime = useCallback((type: 'ready' | 'normal' = 'normal') => {
    if (!soundEnabled) return;
    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.connect(gain);
      gain.connect(ctx.destination);

      const now = ctx.currentTime;
      if (type === 'ready') {
        // High double-tone chime for "Food Ready"
        osc.frequency.setValueAtTime(587.33, now); // D5
        osc.frequency.setValueAtTime(880.0, now + 0.12); // A5
        gain.gain.setValueAtTime(0.2, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);
        osc.start(now);
        osc.stop(now + 0.45);
      } else {
        // Subtle single blip
        osc.frequency.setValueAtTime(523.25, now); // C5
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);
      }
    } catch {
      // Audio context might be restricted before first click
    }
  }, [soundEnabled]);

  const loadNotifications = useCallback(() => {
    const all = StorageService.getNotifications();
    const userNotifs = all.filter((n) => n.userId === user.id || user.role !== 'student');
    setNotifications(userNotifs);
  }, [user]);

  useEffect(() => {
    loadNotifications();
    const handleSync = () => {
      loadNotifications();
    };
    window.addEventListener('campusbite_storage_sync', handleSync);
    return () => window.removeEventListener('campusbite_storage_sync', handleSync);
  }, [loadNotifications]);

  const addToast = useCallback((toast: Omit<ToastItem, 'id'>) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts((prev) => [...prev, { ...toast, id }]);
    if (toast.type === 'ready') {
      playChime('ready');
    } else {
      playChime('normal');
    }

    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4500);
  }, [playChime]);

  const removeToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  const markAsRead = (id: string) => {
    StorageService.markNotificationRead(id);
    loadNotifications();
  };

  const markAllAsRead = () => {
    StorageService.markAllNotificationsRead(user.role === 'student' ? user.id : undefined);
    loadNotifications();
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <NotificationContext.Provider
      value={{
        notifications,
        unreadCount,
        markAsRead,
        markAllAsRead,
        toasts,
        addToast,
        removeToast,
        soundEnabled,
        setSoundEnabled,
        playChime,
        isNotifDrawerOpen,
        setIsNotifDrawerOpen,
      }}
    >
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) throw new Error('useNotifications must be used within NotificationProvider');
  return context;
};
