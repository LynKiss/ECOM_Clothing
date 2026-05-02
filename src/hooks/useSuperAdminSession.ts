import { useSyncExternalStore } from 'react';
import {
  getSuperAdminSession,
  setSuperAdminSession,
  subscribeSuperAdminSession,
  type SuperAdminSession,
} from '../lib/super-admin-session';

export function useSuperAdminSession() {
  const session = useSyncExternalStore(
    subscribeSuperAdminSession,
    getSuperAdminSession,
    getSuperAdminSession,
  );

  return {
    session,
    setSession: (nextSession: SuperAdminSession | null) =>
      setSuperAdminSession(nextSession),
  };
}
