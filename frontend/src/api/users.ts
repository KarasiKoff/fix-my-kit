// API functions for users and management

export async function fetchUsers() {
    return fetch('/api/users').then((res) => res.json());
}
