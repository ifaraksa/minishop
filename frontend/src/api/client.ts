import type { ApiErrorResponse, ApiSuccessResponse, PaginationMeta, StockShortage } from '../types';

const API_BASE_URL = (import.meta.env.VITE_API_URL || 'http://localhost:8000/api').replace(/\/+$/, '');
const TOKEN_KEY = 'minishop_admin_token';

export function getStoredToken(): string | null {
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

export function setStoredToken(token: string | null): void {
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage quota or private-mode errors
  }
}

export class ApiRequestError extends Error {
  status: number;
  code: string;
  errors: Record<string, unknown>;

  constructor(status: number, code: string, message: string, errors: Record<string, unknown> = {}) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = code;
    this.errors = errors;
  }

  getFieldErrors(): Record<string, string> {
    const result: Record<string, string> = {};
    for (const [key, value] of Object.entries(this.errors)) {
      if (Array.isArray(value) && typeof value[0] === 'string') {
        result[key] = value[0];
      }
    }
    return result;
  }

  getStockShortages(): StockShortage[] {
    if (this.code !== 'INSUFFICIENT_STOCK') {
      return [];
    }
    const items = this.errors.items;
    return Array.isArray(items) ? (items as StockShortage[]) : [];
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';
  body?: unknown;
  auth?: boolean;
  signal?: AbortSignal;
}

export async function apiRequest<T>(
  path: string,
  options: RequestOptions = {},
): Promise<{ data: T; meta: PaginationMeta; message: string }> {
  const { method = 'GET', body, auth = false, signal } = options;

  const headers: Record<string, string> = {
    Accept: 'application/json',
  };

  if (body !== undefined) {
    headers['Content-Type'] = 'application/json';
  }

  if (auth) {
    const token = getStoredToken();
    if (token) {
      headers.Authorization = `Bearer ${token}`;
    }
  }

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch (err) {
    if (err instanceof DOMException && err.name === 'AbortError') {
      throw err;
    }
    throw new ApiRequestError(
      0,
      'NETWORK_ERROR',
      'Tidak dapat terhubung ke server API. Pastikan backend Laravel berjalan.',
    );
  }

  let payload: ApiSuccessResponse<T> | ApiErrorResponse | null = null;
  try {
    payload = await response.json();
  } catch {
    payload = null;
  }

  if (!response.ok || !payload || !payload.success) {
    const errPayload = payload && !payload.success ? payload : null;
    throw new ApiRequestError(
      response.status,
      errPayload?.code || 'HTTP_ERROR',
      errPayload?.message || `Permintaan gagal (HTTP ${response.status})`,
      errPayload?.errors || {},
    );
  }

  return {
    data: payload.data,
    meta: payload.meta || {},
    message: payload.message,
  };
}
