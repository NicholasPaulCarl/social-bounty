const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    public statusCode: number,
    public override message: string,
    public details?: Array<{ field: string; message: string }>,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

type GetAccessTokenFn = () => string | null;
type OnUnauthorizedFn = () => Promise<string | null>;

let getAccessToken: GetAccessTokenFn = () => null;
let onUnauthorized: OnUnauthorizedFn = async () => null;

export function configureApiClient(
  tokenGetter: GetAccessTokenFn,
  unauthorizedHandler: OnUnauthorizedFn,
) {
  getAccessToken = tokenGetter;
  onUnauthorized = unauthorizedHandler;
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getAccessToken();
  const headers: Record<string, string> = {
    ...(options.headers as Record<string, string>),
  };

  if (!(options.body instanceof FormData)) {
    headers['Content-Type'] = 'application/json';
  }

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  let response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers,
    credentials: 'include',
  });

  if (response.status === 401) {
    const newToken = await onUnauthorized();
    if (newToken) {
      headers['Authorization'] = `Bearer ${newToken}`;
      response = await fetch(`${API_BASE_URL}${path}`, {
        ...options,
        headers,
        credentials: 'include',
      });
    }
  }

  if (!response.ok) {
    let error: { message: string; details?: Array<{ field: string; message: string }> };
    try {
      error = await response.json();
    } catch {
      error = { message: 'An unexpected error occurred' };
    }
    throw new ApiError(response.status, error.message, error.details);
  }

  if (response.status === 204) {
    return undefined as T;
  }

  return response.json();
}

function buildQueryString(params: Record<string, unknown>): string {
  const searchParams = new URLSearchParams();
  Object.entries(params).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== '') {
      searchParams.set(key, String(value));
    }
  });
  return searchParams.toString();
}

export const apiClient = {
  get<T>(path: string, params?: Record<string, unknown>): Promise<T> {
    const qs = params ? buildQueryString(params) : '';
    const url = qs ? `${path}?${qs}` : path;
    return request<T>(url, { method: 'GET' });
  },

  post<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'POST',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  patch<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PATCH',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  put<T>(path: string, body?: unknown): Promise<T> {
    return request<T>(path, {
      method: 'PUT',
      body: body instanceof FormData ? body : JSON.stringify(body),
    });
  },

  delete<T>(path: string): Promise<T> {
    return request<T>(path, { method: 'DELETE' });
  },
};
