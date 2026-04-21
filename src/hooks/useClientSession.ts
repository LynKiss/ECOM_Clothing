import { useSyncExternalStore } from 'react';
import { getClientSession, subscribeClientSession } from '../lib/client-session';

export function useClientSession() {
  const session = useSyncExternalStore(
    subscribeClientSession,
    getClientSession,
    () => null,
  );
  return { session };
}
