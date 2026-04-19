import { useSyncExternalStore } from 'react';
import { dismissToast, getToasts, showToast, subscribeToasts } from '../lib/toast-store';

export function useToast() {
  const toasts = useSyncExternalStore(subscribeToasts, getToasts, getToasts);

  return {
    toasts,
    showToast,
    dismissToast,
  };
}
