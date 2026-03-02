const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");
export const API_BASE_URL_PY = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL_PY ?? "");

export const apiUrl = (endpoint: string): string => {
  const trimmed = endpoint.trim();
  if (!trimmed) return API_BASE_URL || "/";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = API_BASE_URL ? `${API_BASE_URL}/` : "/";
  const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${base}${path}`;
};

export const apiPyUrl = (endpoint: string): string => {
  const trimmed = endpoint.trim();
  const useProxy = import.meta.env.DEV && !!API_BASE_URL_PY;
  if (!trimmed) {
    if (useProxy) return "/py";
    return API_BASE_URL_PY || "/";
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  const base = useProxy ? "/py/" : API_BASE_URL_PY ? `${API_BASE_URL_PY}/` : "/";
  const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  if (useProxy && path.startsWith("py/")) {
    return `/${path}`;
  }
  return `${base}${path}`;
};

const normalizeLocalhostImageUrl = (value: string): string => {
  if (!API_BASE_URL) return value;
  try {
    const parsed = new URL(value);
    const apiBase = new URL(API_BASE_URL);
    const isLocalhost = parsed.hostname === "localhost" || parsed.hostname === "127.0.0.1";
    const isDefaultPort = parsed.port === "" || parsed.port === "80";
    if (isLocalhost && isDefaultPort) {
      return new URL(`${parsed.pathname}${parsed.search}${parsed.hash}`, apiBase).toString();
    }
    return value;
  } catch {
    return value;
  }
};

export const normalizeImageUrl = (value?: string | null): string | undefined => {
  if (!value) return undefined;
  const trimmed = value.trim();
  if (!trimmed) return undefined;
  if (/^(data:|blob:)/i.test(trimmed)) return trimmed;
  if (/^https?:\/\//i.test(trimmed)) return normalizeLocalhostImageUrl(trimmed);
  return apiUrl(trimmed);
};
