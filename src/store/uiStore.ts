import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface Notification {
  id: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  timestamp: Date;
  read: boolean;
}

interface UIState {
  theme: 'dark' | 'light';
  language: string;
  notifications: Notification[];
  toggleTheme: () => void;
  setLanguage: (lang: string) => void;
  addNotification: (message: string, type: Notification['type']) => void;
  markAsRead: (id: string) => void;
  clearNotifications: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      theme: 'dark',
      language: 'en',
      notifications: [],
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      setLanguage: (lang) => set({ language: lang }),
      addNotification: (message, type) => set((state) => ({
        notifications: [
          {
            id: Math.random().toString(36).substring(7),
            message,
            type,
            timestamp: new Date(),
            read: false
          },
          ...state.notifications
        ].slice(0, 50) // Keep last 50
      })),
      markAsRead: (id) => set((state) => ({
        notifications: state.notifications.map(n => n.id === id ? { ...n, read: true } : n)
      })),
      clearNotifications: () => set({ notifications: [] }),
    }),
    {
      name: 'cyber-shield-ui-storage',
    }
  )
);
