// API functions for authentication

type LoginCredentials = {
    login: string;
    password: string;
};

type TokenResponse = {
    access_token: string;
    token_type: string;
};

type UserResponse = {
    id: string;
    login: string;
    role: 'admin' | 'sysadmin';
    full_name: string | null;
};

const AUTH_TOKEN_KEY = 'fix-my-kit-auth-token';

export async function login(credentials: LoginCredentials): Promise<TokenResponse> {
    const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    });

    if (!response.ok) {
        const error = await response.json().catch(() => null);
        throw new Error(error?.detail ?? 'Login failed');
    }

    return response.json();
}

export async function getCurrentUser(token: string): Promise<UserResponse> {
    const response = await fetch('/api/auth/me', {
        headers: {
            Authorization: `Bearer ${token}`,
        },
    });

    if (!response.ok) {
        throw new Error('Unable to load user');
    }

    return response.json();
}

export function getStoredAuthToken(): string | null {
    return localStorage.getItem(AUTH_TOKEN_KEY);
}

export function setStoredAuthToken(token: string) {
    localStorage.setItem(AUTH_TOKEN_KEY, token);
}

export function clearStoredAuthToken() {
    localStorage.removeItem(AUTH_TOKEN_KEY);
}
