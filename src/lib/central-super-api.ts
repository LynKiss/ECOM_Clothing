import {
  getCentralSuperSession,
  setCentralSuperSession,
  type CentralSuperSession,
} from './central-super-session';

const BASE_URL =
  (import.meta.env.VITE_CENTRAL_SUPER_ADMIN_URL as string | undefined)?.replace(/\/+$/, '') ??
  'http://localhost:8100/api/super-admin';

type Envelope<T> = { statusCode: number; message: string; data: T };

async function parseEnvelope<T>(res: Response): Promise<T> {
  const body = (await res.json()) as Envelope<T> | { message?: string | string[] };
  if (!res.ok) {
    const msg = 'message' in body && body.message ? body.message : `HTTP ${res.status}`;
    throw new Error(Array.isArray(msg) ? msg[0] : msg);
  }
  return (body as Envelope<T>).data;
}

async function req<T>(path: string, init?: RequestInit, retry = true): Promise<T> {
  const session = getCentralSuperSession();
  const headers = new Headers(init?.headers);
  if (!headers.has('Content-Type') && init?.body) {
    headers.set('Content-Type', 'application/json');
  }
  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const res = await fetch(`${BASE_URL}${path}`, { ...init, headers, credentials: 'include' });

  if (res.status === 401 && retry && session?.accessToken) {
    try {
      await refreshCentralSuperSession();
      return req<T>(path, init, false);
    } catch {
      setCentralSuperSession(null);
    }
  }

  return parseEnvelope<T>(res);
}

// ── Auth ────────────────────────────────────────────────────────────────────

export async function loginCentralSuper(email: string, password: string) {
  const res = await fetch(`${BASE_URL}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
    credentials: 'include',
  });
  const data = await parseEnvelope<{
    access_token: string;
    user: CentralSuperSession['user'];
  }>(res);
  const session: CentralSuperSession = { accessToken: data.access_token, user: data.user };
  setCentralSuperSession(session);
  return session;
}

export async function refreshCentralSuperSession() {
  const res = await fetch(`${BASE_URL}/auth/refresh`, { method: 'GET', credentials: 'include' });
  const data = await parseEnvelope<{ access_token: string; user: CentralSuperSession['user'] }>(res);
  const session: CentralSuperSession = { accessToken: data.access_token, user: data.user };
  setCentralSuperSession(session);
  return session;
}

export async function logoutCentralSuper() {
  try {
    await req('/auth/logout', { method: 'POST' }, false);
  } finally {
    setCentralSuperSession(null);
  }
}

// ── Projects ────────────────────────────────────────────────────────────────

export type Project = {
  projectId: string;
  name: string;
  baseUrl: string;
  status: 'active' | 'disabled';
  syncSecretConfigured: boolean;
  createdAt: string;
};

export type ProjectPermission = {
  permissionId: string;
  permissionKey: string;
  permissionName: string;
};

export type ProjectAdmin = {
  userId: string;
  username: string;
  email: string;
  fullName: string | null;
  role: string;
  isActive: boolean;
  hasOverride: boolean;
  permissionKeys: string[] | null;
};

export const centralSuperApi = {
  listProjects: () => req<Project[]>('/projects'),

  createProject: (body: {
    projectId: string;
    name: string;
    baseUrl: string;
    syncSecret: string;
  }) => req<Project>('/projects', { method: 'POST', body: JSON.stringify(body) }),

  listPermissions: (projectId: string) =>
    req<ProjectPermission[]>(`/projects/${projectId}/permissions`),

  listAdmins: (projectId: string) =>
    req<ProjectAdmin[]>(`/projects/${projectId}/admins`),

  applyPermissions: (projectId: string, userId: string, permissionKeys: string[]) =>
    req(`/projects/${projectId}/admins/${userId}/permissions`, {
      method: 'PUT',
      body: JSON.stringify({ permissionKeys }),
    }),
};
