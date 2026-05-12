import { clearStoredAuthToken, getStoredAuthToken } from './auth';

export class ApiError extends Error {
    status: number;
    detail: unknown;

    constructor(status: number, detail: unknown) {
        super(typeof detail === 'string' ? detail : `API request failed with status ${status}`);
        this.status = status;
        this.detail = detail;
    }
}

export async function apiRequest<T>(path: string, init: RequestInit = {}): Promise<T> {
    const method = (init.method ?? 'GET').toUpperCase();
    const headers = new Headers(init.headers);

    if (init.body && !headers.has('Content-Type')) {
        headers.set('Content-Type', 'application/json');
    }

    if (!headers.has('Authorization')) {
        const token = getStoredAuthToken();
        if (token) {
            headers.set('Authorization', `Bearer ${token}`);
        }
    }

    const response = await fetch(path, {
        ...init,
        method,
        headers,
    });

    if (response.status === 204) {
        return undefined as T;
    }

    const contentType = response.headers.get('content-type') ?? '';
    const payload = contentType.includes('application/json') ? await response.json() : await response.text();

    if (!response.ok) {
        if (response.status === 401) {
            clearStoredAuthToken();
        }
        throw new ApiError(response.status, typeof payload === 'object' && payload !== null && 'detail' in payload ? payload.detail : payload);
    }

    return payload as T;
}
