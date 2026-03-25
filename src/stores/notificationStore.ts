// ============================================
// DISPATCH NG - Notification Store (Zustand)
// ============================================

import { create } from 'zustand';
import type { Notification } from '@/types';

interface NotificationState {
  // State
  notifications: Notification[];
  unreadCount: number;
  isLoading: boolean;
  
  // Actions
  setNotifications: (notifications: Notification[]) => void;
  addNotification: (notification: Notification) => void;
  markAsRead: (notificationId: string) => void;
  markAllAsRead: () => void;
  removeNotification: (notificationId: string) => void;
  setLoading: (loading: boolean) => void;
  calculateUnreadCount: () => void;
  reset: () => void;
}

export const useNotificationStore = create<NotificationState>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  isLoading: false,

  // Set all notifications
  setNotifications: (notifications) => {
    set({ notifications });
    get().calculateUnreadCount();
  },

  // Add a new notification
  addNotification: (notification) => {
    const { notifications } = get();
    set({ notifications: [notification, ...notifications] });
    get().calculateUnreadCount();
  },

  // Mark a notification as read
  markAsRead: (notificationId) => {
    const { notifications } = get();
    const updatedNotifications = notifications.map(notif =>
      notif.id === notificationId ? { ...notif, is_read: true } : notif
    );
    set({ notifications: updatedNotifications });
    get().calculateUnreadCount();
  },

  // Mark all notifications as read
  markAllAsRead: () => {
    const { notifications } = get();
    const updatedNotifications = notifications.map(notif =>
      ({ ...notif, is_read: true })
    );
    set({ notifications: updatedNotifications });
    get().calculateUnreadCount();
  },

  // Remove a notification
  removeNotification: (notificationId) => {
    const { notifications } = get();
    set({ 
      notifications: notifications.filter(notif => notif.id !== notificationId) 
    });
    get().calculateUnreadCount();
  },

  setLoading: (loading) => set({ isLoading: loading }),

  // Calculate unread count
  calculateUnreadCount: () => {
    const { notifications } = get();
    const unreadCount = notifications.filter(notif => !notif.is_read).length;
    set({ unreadCount });
  },

  reset: () => set({
    notifications: [],
    unreadCount: 0,
    isLoading: false
  })
}));
