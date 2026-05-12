import { apiRequest } from './client';

export async function login(credentials: { login: string; password: string }) {
    return apiRequest<{ access_token: string; token_type: string }>('/api/auth/login', {
        method: 'POST',
        body: JSON.stringify(credentials),
    });
}
