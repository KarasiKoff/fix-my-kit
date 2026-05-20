import { apiRequest } from './client';
import type { DeviceOnMap, RoomDeviceListItem, RoomMapData } from '../types/roomMap';

export type AudienceDto = {
    id: number;
    name: string;
};

export async function fetchAudiences(name?: string) {
    const q = name ? `?name=${encodeURIComponent(name)}` : '';
    const response = await apiRequest<{ items: AudienceDto[] }>(`/api/audiences${q}`);
    return response.items;
}

export async function createAudience(name: string) {
    return apiRequest<AudienceDto>('/api/audiences', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}

export async function updateAudience(id: number, payload: { name: string }) {
    return apiRequest<AudienceDto>(`/api/audiences/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

export async function deleteAudience(id: number) {
    await apiRequest<void>(`/api/audiences/${id}`, { method: 'DELETE' });
}

// ── Room map API ──────────────────────────────────────────────────────────────

type DeviceOnMapApi = {
    device_id: string;
    x_pct: number;
    y_pct: number;
    device_name: string;
    inventory_number: string;
    repair_status: string;
    category_id?: string | null;
    category_has_icon?: boolean;
};

function mapDeviceOnMap(item: DeviceOnMapApi): DeviceOnMap {
    return {
        deviceId: item.device_id,
        xPct: item.x_pct,
        yPct: item.y_pct,
        deviceName: item.device_name,
        inventoryNumber: item.inventory_number,
        repairStatus: item.repair_status as DeviceOnMap['repairStatus'],
        categoryId: item.category_id ?? null,
        categoryHasIcon: Boolean(item.category_has_icon),
    };
}

export async function fetchRoomMap(audienceId: number): Promise<RoomMapData> {
    const data = await apiRequest<{ audience_id: number; positions: DeviceOnMapApi[] }>(
        `/api/audiences/${audienceId}/map`,
    );
    return { audienceId: data.audience_id, positions: data.positions.map(mapDeviceOnMap) };
}

export async function saveRoomMap(
    audienceId: number,
    positions: Array<{ device_id: string; x_pct: number; y_pct: number }>,
): Promise<RoomMapData> {
    const data = await apiRequest<{ audience_id: number; positions: DeviceOnMapApi[] }>(
        `/api/audiences/${audienceId}/map`,
        { method: 'PUT', body: JSON.stringify({ positions }) },
    );
    return { audienceId: data.audience_id, positions: data.positions.map(mapDeviceOnMap) };
}

export async function fetchAudienceDevices(audienceId: number): Promise<RoomDeviceListItem[]> {
    const data = await apiRequest<{
        items: Array<{
            id: string;
            name: string;
            inventory_number: string;
            repair_status: string;
            is_on_map: boolean;
            category_id?: string | null;
            category_has_icon?: boolean;
        }>;
    }>(`/api/audiences/${audienceId}/devices`);
    return data.items.map((item) => ({
        id: item.id,
        name: item.name,
        inventoryNumber: item.inventory_number,
        repairStatus: item.repair_status as RoomDeviceListItem['repairStatus'],
        isOnMap: item.is_on_map,
        categoryId: item.category_id ?? null,
        categoryHasIcon: Boolean(item.category_has_icon),
    }));
}
