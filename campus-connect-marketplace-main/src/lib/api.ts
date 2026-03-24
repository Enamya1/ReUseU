const normalizeBaseUrl = (value: string): string => value.trim().replace(/\/+$/, "");

export const API_BASE_URL = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL ?? "");
export const API_BASE_URL_PY = normalizeBaseUrl(import.meta.env.VITE_API_BASE_URL_PY ?? "");

export const apiUrl = (endpoint: string): string => {
  const trimmed = endpoint.trim();
  if (!trimmed) return API_BASE_URL || "/";
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // In dev mode with proxy (empty base URL), use relative paths
  if (!API_BASE_URL) {
    // Ensure path starts with / for relative URLs
    return trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  }
  
  // For production or when base URL is set
  const base = API_BASE_URL.endsWith('/') ? API_BASE_URL : `${API_BASE_URL}/`;
  const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${base}${path}`;
};

export const apiPyUrl = (endpoint: string): string => {
  const trimmed = endpoint.trim();
  // In dev mode, always use proxy if base URL is empty or not set
  const useProxy = import.meta.env.DEV || !API_BASE_URL_PY;
  if (!trimmed) {
    if (useProxy) return "/py";
    return API_BASE_URL_PY || "/";
  }
  if (/^https?:\/\//i.test(trimmed)) return trimmed;

  // For dev/proxy mode
  if (useProxy) {
    // Ensure path starts with / for relative URLs
    const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
    if (path.startsWith("py/")) {
      return `/${path}`;
    }
    return `/${path}`;
  }
  
  // For production
  const base = API_BASE_URL_PY.endsWith('/') ? API_BASE_URL_PY : `${API_BASE_URL_PY}/`;
  const path = trimmed.startsWith("/") ? trimmed.slice(1) : trimmed;
  return `${base}${path}`;
};

const normalizeApiImageUrl = (value: string): string => {
  // In dev mode with proxy, rewrite external API URLs to use proxy
  if (!import.meta.env.DEV) return value;
  
  try {
    const parsed = new URL(value);
    // Get API hosts from environment or use defaults
    const apiHost = import.meta.env.VITE_API_HOST || '10.29.14.209';
    // Check if this is an API URL (matching our backend hosts)
    const apiHosts = [
      'localhost',
      '127.0.0.1',
      apiHost,
    ];
    const isApiHost = apiHosts.includes(parsed.hostname) && 
                      (parsed.port === '8000' || parsed.port === '8001');
    
    if (isApiHost) {
      // Rewrite to use proxy - just return the path
      return parsed.pathname;
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
  if (/^https?:\/\//i.test(trimmed)) return normalizeApiImageUrl(trimmed);
  return apiUrl(trimmed);
};
