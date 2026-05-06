// API functions for authentication

export async function login(credentials: { username: string; password: string }) {
    return fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(credentials),
    }).then((res) => res.json());
}
