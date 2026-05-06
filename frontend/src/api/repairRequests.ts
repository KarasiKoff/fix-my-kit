// API functions for repair request operations

export async function createRepairRequest(payload: unknown) {
    return fetch('/api/repair-requests', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    }).then((res) => res.json());
}

export async function fetchRepairRequests() {
    return fetch('/api/repair-requests').then((res) => res.json());
}
