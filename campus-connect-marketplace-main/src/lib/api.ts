const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");

export const apiUrl = (endpoint: string): string => {
  const trimmed = endpoint.trim();
  if (!trimmed) return API_BASE_URL || "/";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = API_BASE_URL ? `${API_BASE_URL}/` : "/";
  const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${base}${path}`;
};

