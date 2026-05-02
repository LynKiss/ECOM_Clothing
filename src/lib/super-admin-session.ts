export type SuperAdminSession = {
  accessToken: string;
  user: {
    _id: string;
    username: string;
    email: string;
    authType: 'super_admin';
    role?: {
      _id: string;
      name: string;
    };
    permissions?: Array<{
      _id?: string;
      key?: string;
      name?: string;
    }>;
  };
};

const STORAGE_KEY = 'fe_super_admin_session';

let currentSession: SuperAdminSession | null = readSession();
const listeners = new Set<() => void>();

function readSession(): SuperAdminSession | null {
  if (typeof window === 'undefined') return null;
  const raw = window.localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  try {
    return JSON.parse(raw) as SuperAdminSession;
  } catch {
    window.localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

function emitChange() {
  for (const listener of listeners) listener();
}

export function getSuperAdminSession() {
  return currentSession;
}

export function setSuperAdminSession(session: SuperAdminSession | null) {
  currentSession = session;

  if (typeof window !== 'undefined') {
    if (session) {
      window.localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    } else {
      window.localStorage.removeItem(STORAGE_KEY);
    }
  }

  emitChange();
}

export function subscribeSuperAdminSession(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
