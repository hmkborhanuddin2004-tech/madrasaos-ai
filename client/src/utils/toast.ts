// Kitabkhana Toast & Modal Notification System
// Strictly replaces native browser alert() and confirm() across the platform

export type ToastType = 'success' | 'error' | 'info' | 'warning';

export interface ToastItem {
  id: string;
  message: string;
  type: ToastType;
}

type ToastListener = (toasts: ToastItem[]) => void;

let toasts: ToastItem[] = [];
const listeners: Set<ToastListener> = new Set();

function notify() {
  listeners.forEach((listener) => listener([...toasts]));
}

export const toast = {
  show(message: string, type: ToastType = 'info') {
    const id = 'toast_' + Date.now() + '_' + Math.random().toString(36).substring(2, 6);
    toasts = [...toasts, { id, message, type }];
    notify();

    setTimeout(() => {
      toasts = toasts.filter((t) => t.id !== id);
      notify();
    }, 4500);
  },
  success(message: string) {
    toast.show(message, 'success');
  },
  error(message: string) {
    toast.show(message, 'error');
  },
  warning(message: string) {
    toast.show(message, 'warning');
  },
  info(message: string) {
    toast.show(message, 'info');
  }
};

export function subscribeToasts(listener: ToastListener): () => void {
  listeners.add(listener);
  listener([...toasts]);
  return () => {
    listeners.delete(listener);
  };
}

// Global window.alert interceptor to guarantee zero native popup disruption
if (typeof window !== 'undefined') {
  window.alert = (message?: any) => {
    toast.info(String(message || ''));
  };
}
