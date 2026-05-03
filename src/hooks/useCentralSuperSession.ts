import { useSyncExternalStore } from 'react';
import {
  getCentralSuperSession,
  setCentralSuperSession,
  subscribeCentralSuperSession,
  type CentralSuperSession,
} from '../lib/central-super-session';

export function useCentralSuperSession() {
  const session = useSyncExternalStore(
    subscribeCentralSuperSession,
    getCentralSuperSession,
    getCentralSuperSession,
  );

  return {
    session,
    setSession: (next: CentralSuperSession | null) => setCentralSuperSession(next),
  };
}
