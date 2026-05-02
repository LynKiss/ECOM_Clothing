import {
  getSuperAdminSession,
  setSuperAdminSession,
  type SuperAdminSession,
} from './super-admin-session';

const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ??
  'http://localhost:8000/api/v1';

type ApiEnvelope<T> = {
  statusCode: number;
  message: string;
  data: T;
};

type SuperLoginResponse = {
  access_token: string;
  access_token_expires_in: number;
  refresh_token: string;
  refresh_token_expires_in: number;
  user: SuperAdminSession['user'];
};

async function parseEnvelope<T>(response: Response): Promise<ApiEnvelope<T>> {
  const payload = (await response.json()) as
    | ApiEnvelope<T>
    | { message?: string | string[] };

  if (!response.ok) {
    const message =
      'message' in payload && payload.message
        ? payload.message
        : `API request failed with ${response.status}`;
    throw new Error(Array.isArray(message) ? message[0] : message);
  }

  return payload as ApiEnvelope<T>;
}

async function request<T>(
  path: string,
  init?: RequestInit,
  allowRefresh = true,
): Promise<T> {
  const session = getSuperAdminSession();
  const headers = new Headers(init?.headers);

  if (!headers.has('Content-Type') && init?.body) {
    const isFormData =
      typeof FormData !== 'undefined' && init.body instanceof FormData;
    if (!isFormData) headers.set('Content-Type', 'application/json');
  }

  if (session?.accessToken) {
    headers.set('Authorization', `Bearer ${session.accessToken}`);
  }

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...init,
    headers,
    credentials: 'include',
  });

  if (response.status === 401 && allowRefresh && session?.accessToken) {
    try {
      await refreshSuperAdminSession();
      return request<T>(path, init, false);
    } catch {
      setSuperAdminSession(null);
    }
  }

  const envelope = await parseEnvelope<T>(response);
  return envelope.data;
}

export async function loginSuperAdmin(username: string, password: string) {
  const response = await fetch(`${API_BASE_URL}/super-auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });

  const envelope = await parseEnvelope<SuperLoginResponse>(response);
  const session: SuperAdminSession = {
    accessToken: envelope.data.access_token,
    user: envelope.data.user,
  };

  setSuperAdminSession(session);
  return session;
}

export async function refreshSuperAdminSession() {
  const response = await fetch(`${API_BASE_URL}/super-auth/refresh`, {
    method: 'GET',
    credentials: 'include',
  });

  const envelope = await parseEnvelope<{
    access_token: string;
    user: SuperAdminSession['user'];
  }>(response);

  const session: SuperAdminSession = {
    accessToken: envelope.data.access_token,
    user: envelope.data.user,
  };

  setSuperAdminSession(session);
  return session;
}

export async function logoutSuperAdmin() {
  try {
    await request('/super-auth/logout', { method: 'POST' }, false);
  } finally {
    setSuperAdminSession(null);
  }
}

export const superApiClient = {
  get: <T>(path: string) => request<T>(path),
  post: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: body ? JSON.stringify(body) : undefined,
    }),
  put: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
