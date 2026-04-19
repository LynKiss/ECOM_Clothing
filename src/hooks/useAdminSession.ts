import { useSyncExternalStore } from 'react';
import {
  getAdminSession,
  setAdminSession,
  subscribeAdminSession,
  type AdminSession,
} from '../lib/admin-session';

export function useAdminSession() {
  const session = useSyncExternalStore(
    subscribeAdminSession,
    getAdminSession,
    getAdminSession,
  );

  return {
    session,
    setSession: (nextSession: AdminSession | null) => setAdminSession(nextSession),
  };
}
