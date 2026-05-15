import { apiRequest, ApiRequestOptions } from './client';
import { Device } from '../types/device';
import { RepairHistoryEntry } from '../types/repairHistory';

type DeviceApi = {
    id: string;
    inventory_number: string;
    name: string;
    category?: { id: string; name: string } | null;
    serial_number?: string | null;
    audience?: { id: number; name: string } | null;
    responsible?: { id: string; full_name?: string | null; login: string } | null;
    repair_status: Device['status'];
    taken_by_sysadmin?: boolean;
};

export function mapDevice(item: DeviceApi): Device {
    return {
        id: item.id,
        inventoryNumber: item.inventory_number,
        name: item.name,
        category: item.category?.name ?? '',
        categoryId: item.category?.id ?? null,
        serialNumber: item.serial_number ?? '',
        room: item.audience?.name ?? '',
        audienceId: item.audience?.id ?? null,
        responsible: item.responsible?.full_name ?? item.responsible?.login ?? '',
        responsibleId: item.responsible?.id ?? null,
        status: item.repair_status,
        takenBySysadmin: item.taken_by_sysadmin ?? false,
    };
}

type HistoryApi = {
    id: string;
    device_id: string;
    repair_request_id?: string | null;
    old_status?: string | null;
    new_status?: string | null;
    note?: string | null;
    created_at: string;
    tracker_ticket_key?: string | null;
    tracker_ticket_url?: string | null;
};

function mapHistoryRow(item: HistoryApi): RepairHistoryEntry {
    return {
        id: item.id,
        deviceId: item.device_id,
        repairRequestId: item.repair_request_id ?? undefined,
        oldStatus: (item.old_status as RepairHistoryEntry['oldStatus']) ?? undefined,
        newStatus: (item.new_status as RepairHistoryEntry['newStatus']) ?? undefined,
        note: item.note ?? undefined,
        createdAt: item.created_at,
        ticketKey: item.tracker_ticket_key ?? undefined,
        ticketUrl: item.tracker_ticket_url ?? undefined,
    };
}

export async function fetchDevices() {
    const response = await apiRequest<{ items: DeviceApi[]; total: number }>('/api/devices');
    return response.items.map(mapDevice);
}

export async function fetchDeviceById(id: string) {
    return mapDevice(await apiRequest<DeviceApi>(`/api/devices/${id}`));
}

export async function fetchPublicDeviceById(id: string, init?: ApiRequestOptions) {
    return mapDevice(
        await apiRequest<DeviceApi>(`/api/public/devices/${id}`, {
            ...init,
            skipAuth: true,
        }),
    );
}

export async function fetchPublicDeviceByInventory(inventoryNumber: string) {
    const params = new URLSearchParams({ number: inventoryNumber.trim() });
    return mapDevice(
        await apiRequest<DeviceApi>(`/api/public/devices/by-inventory?${params.toString()}`, {
            skipAuth: true,
        }),
    );
}

export async function fetchDeviceHistory(deviceId: string) {
    const response = await apiRequest<{ items: HistoryApi[] }>(`/api/devices/${deviceId}/history`);
    return response.items.map(mapHistoryRow);
}

export async function createDevice(payload: {
    inventory_number: string;
    name: string;
    serial_number?: string | null;
    audience_id?: number | null;
    category_id?: string | null;
    responsible_id?: string | null;
    repair_status: Device['status'];
}) {
    return mapDevice(
        await apiRequest<DeviceApi>('/api/devices', {
            method: 'POST',
            body: JSON.stringify(payload),
        }),
    );
}

export async function fetchDeviceQrUrl(deviceId: string) {
    const response = await apiRequest<{ device_id: string; url: string }>(`/api/devices/${deviceId}/qr`);
    return response.url;
}

export async function updateDeviceStatus(id: string, status: Device['status']) {
    return mapDevice(
        await apiRequest<DeviceApi>(`/api/devices/${id}`, {
            method: 'PATCH',
            body: JSON.stringify({ repair_status: status }),
        }),
    );
}
