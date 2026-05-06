// API functions for equipment data

export async function fetchDevices() {
    return fetch('/api/devices').then((res) => res.json());
}

export async function fetchDeviceById(id: string) {
    return fetch(`/api/devices/${id}`).then((res) => res.json());
}
