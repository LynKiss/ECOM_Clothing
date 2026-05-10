const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL?.replace(/\/+$/, '') ?? 'http://localhost:8000/api/v1';

function getApiOrigin() {
  try {
    return new URL(API_BASE_URL).origin;
  } catch {
    return '';
  }
}

export function resolveMediaUrl(value?: string | null) {
  const trimmed = value?.trim();
  if (!trimmed) {
    return null;
  }

  if (/^(https?:)?\/\//i.test(trimmed) || trimmed.startsWith('data:') || trimmed.startsWith('blob:')) {
    return trimmed;
  }

  if (!trimmed.startsWith('/')) {
    return trimmed;
  }

  const apiOrigin = getApiOrigin();
  return apiOrigin ? `${apiOrigin}${trimmed}` : trimmed;
}
