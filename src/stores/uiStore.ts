// ============================================
// DISPATCH NG - UI State Store (Zustand)
// ============================================

import { create } from 'zustand';

export type ToastType = 'success' | 'error' | 'warning' | 'info';

export interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message: string;
  duration?: number;
}

interface UIState {
  // Sidebar state
  sidebarOpen: boolean;
  
  // Modal states
  activeModal: string | null;
  modalData: Record<string, unknown> | null;
  
  // Toast notifications
  toasts: Toast[];
  
  // Loading states
  globalLoading: boolean;
  loadingMessage: string;
  
  // Actions
  toggleSidebar: () => void;
  setSidebarOpen: (open: boolean) => void;
  openModal: (modalName: string, data?: Record<string, unknown>) => void;
  closeModal: () => void;
  addToast: (toast: Omit<Toast, 'id'>) => void;
  removeToast: (toastId: string) => void;
  setGlobalLoading: (loading: boolean, message?: string) => void;
  reset: () => void;
}

export const useUIStore = create<UIState>((set, get) => ({
  // Initial state
  sidebarOpen: false,
  activeModal: null,
  modalData: null,
  toasts: [],
  globalLoading: false,
  loadingMessage: '',

  // Sidebar actions
  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  setSidebarOpen: (open) => set({ sidebarOpen: open }),

  // Modal actions
  openModal: (modalName, data) => set({ 
    activeModal: modalName, 
    modalData: data || null 
  }),
  closeModal: () => set({ activeModal: null, modalData: null }),

  // Toast actions
  addToast: (toast) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast = { ...toast, id, duration: toast.duration || 5000 };
    
    set((state) => ({ toasts: [...state.toasts, newToast] }));
    
    // Auto remove toast after duration
    setTimeout(() => {
      get().removeToast(id);
    }, newToast.duration);
  },

  removeToast: (toastId) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== toastId)
    }));
  },

  // Loading actions
  setGlobalLoading: (loading, message = '') => {
    set({ globalLoading: loading, loadingMessage: message });
  },

  reset: () => set({
    sidebarOpen: false,
    activeModal: null,
    modalData: null,
    toasts: [],
    globalLoading: false,
    loadingMessage: ''
  })
}));

// Helper function to show toast
export const showToast = (type: ToastType, title: string, message: string, duration?: number) => {
  useUIStore.getState().addToast({ type, title, message, duration });
};
