import { apiRequest } from './client';
import { Device } from '../types/device';

type DeviceApi = {
    id: string;
    inventory_number: string;
    name: string;
    category?: { name: string } | null;
    serial_number?: string | null;
    audience_id?: number | null;
    audience?: { name: string } | null;
    responsible?: { full_name?: string | null; login: string } | null;
    repair_status: Device['status'];
};

function mapDevice(item: DeviceApi): Device {
    return {
        id: item.id,
        inventoryNumber: item.inventory_number,
        name: item.name,
        category: item.category?.name ?? '',
        serialNumber: item.serial_number ?? '',
        audienceId: item.audience_id ?? null,
        audienceName: item.audience?.name ?? '',
        responsible: item.responsible?.full_name ?? item.responsible?.login ?? '',
        status: item.repair_status,
        takenBySysadmin: item.repair_status === 'in_repair',
    };
}

export async function fetchDevices() {
    const response = await apiRequest<{ items: DeviceApi[]; total: number }>('/api/devices');
    return response.items.map(mapDevice);
}

export async function fetchDeviceById(id: string) {
    return mapDevice(await apiRequest<DeviceApi>(`/api/devices/${id}`));
}

export async function updateDeviceStatus(id: string, status: Device['status']) {
    return mapDevice(await apiRequest<DeviceApi>(`/api/devices/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ repair_status: status }),
    }));
}
