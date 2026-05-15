import { getStoredAuthToken } from './auth';
import { apiRequest } from './client';
import { RepairRequest, RepairRequestDetail } from '../types/repairRequest';

type RepairRequestApi = {
    id: string;
    device_id: string;
    applicant_name?: string | null;
    description: string;
    status: 'open' | 'in_progress' | 'closed';
    taken_by_sysadmin_at?: string | null;
    created_at: string;
    tracker_ticket_id?: string | null;
    tracker_ticket_key?: string | null;
    tracker_ticket_url?: string | null;
    last_sync_at?: string | null;
    resolution_note?: string | null;
    closed_at?: string | null;
    closed_by_user_id?: string | null;
    closed_by_tracker_display?: string | null;
    device_inventory_number?: string | null;
    device_name?: string | null;
};

function mapRepairRequest(item: RepairRequestApi): RepairRequest {
    return {
        id: item.id,
        deviceId: item.device_id,
        requesterName: item.applicant_name ?? '',
        description: item.description,
        status: item.status === 'open' ? 'new' : item.status,
        takenBySysadmin: Boolean(item.taken_by_sysadmin_at),
        createdAt: item.created_at,
        ticketId: item.tracker_ticket_id ?? undefined,
        ticketKey: item.tracker_ticket_key ?? undefined,
        ticketUrl: item.tracker_ticket_url ?? undefined,
        lastSyncedAt: item.last_sync_at ?? undefined,
        deviceInventoryNumber: item.device_inventory_number ?? undefined,
        deviceName: item.device_name ?? undefined,
    };
}

function mapDetail(item: RepairRequestApi): RepairRequestDetail {
    const base = mapRepairRequest(item);
    return {
        ...base,
        resolutionNote: item.resolution_note ?? undefined,
        closedAt: item.closed_at ?? undefined,
        closedByUserId: item.closed_by_user_id ?? undefined,
        closedByTrackerDisplay: item.closed_by_tracker_display ?? undefined,
    };
}

export function isRepairRequestSynced(r: Pick<RepairRequest, 'ticketId' | 'ticketKey' | 'lastSyncedAt'>): boolean {
    return Boolean(r.ticketKey || r.ticketId || r.lastSyncedAt);
}

export async function createRepairRequest(payload: {
    deviceId: string;
    requesterName: string;
    description: string;
    syncToTracker?: boolean;
}) {
    const token = getStoredAuthToken();
    if (token) {
        const response = await apiRequest<RepairRequestApi>('/api/repair-requests', {
            method: 'POST',
            body: JSON.stringify({
                device_id: payload.deviceId,
                applicant_name: payload.requesterName?.trim() || null,
                description: payload.description,
                sync_to_tracker: payload.syncToTracker ?? true,
            }),
        });
        return mapRepairRequest(response);
    }

    const pub = await apiRequest<{ id: string; status: string }>('/api/public/repair-requests', {
        method: 'POST',
        body: JSON.stringify({
            device_id: payload.deviceId,
            applicant_name: payload.requesterName,
            description: payload.description,
        }),
        skipAuth: true,
    });

    const statusMap: Record<string, RepairRequestApi['status']> = {
        open: 'open',
        in_progress: 'in_progress',
        closed: 'closed',
    };
    const st = statusMap[pub.status] ?? 'open';

    return mapRepairRequest({
        id: pub.id,
        device_id: payload.deviceId,
        applicant_name: payload.requesterName,
        description: payload.description,
        status: st,
        taken_by_sysadmin_at: null,
        created_at: new Date().toISOString(),
        tracker_ticket_id: null,
        tracker_ticket_key: null,
        tracker_ticket_url: null,
        last_sync_at: null,
    });
}

export type RepairRequestListParams = {
    device?: string;
    applicant?: string;
    status?: 'open' | 'in_progress' | 'closed';
    sort_by?: string;
    sort_dir?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
};

function buildRepairRequestQuery(params: Record<string, string | number | undefined>): string {
    const search = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
        if (value !== undefined && value !== '') {
            search.set(key, String(value));
        }
    }
    const q = search.toString();
    return q ? `?${q}` : '';
}

export async function fetchRepairRequests(params?: RepairRequestListParams) {
    const query = buildRepairRequestQuery({
        device: params?.device,
        applicant: params?.applicant,
        status: params?.status,
        sort_by: params?.sort_by,
        sort_dir: params?.sort_dir,
        limit: params?.limit ?? 50,
        offset: params?.offset ?? 0,
    });
    const response = await apiRequest<{ items: RepairRequestApi[]; total: number }>(`/api/repair-requests${query}`);
    return { items: response.items.map(mapRepairRequest), total: response.total };
}

export type RepairRequestSuggestField = 'device' | 'applicant';

export async function suggestRepairRequests(field: RepairRequestSuggestField, q: string) {
    const params = new URLSearchParams({ field, q });
    const response = await apiRequest<{ items: string[] }>(`/api/repair-requests/suggest?${params.toString()}`);
    return response.items;
}

export async function fetchRepairRequest(id: string) {
    return mapDetail(await apiRequest<RepairRequestApi>(`/api/repair-requests/${id}`));
}

export async function patchRepairRequestStatus(id: string, status: 'open' | 'in_progress' | 'closed', resolutionNote?: string | null) {
    const body: Record<string, unknown> = { status };
    if (resolutionNote !== undefined && resolutionNote !== null) {
        body.resolution_note = resolutionNote;
    }
    return mapDetail(
        await apiRequest<RepairRequestApi>(`/api/repair-requests/${id}/status`, {
            method: 'PATCH',
            body: JSON.stringify(body),
        }),
    );
}

export async function patchRepairRequestTake(id: string, taken: boolean) {
    return mapDetail(
        await apiRequest<RepairRequestApi>(`/api/repair-requests/${id}/take`, {
            method: 'PATCH',
            body: JSON.stringify({ taken }),
        }),
    );
}

export async function patchRepairRequestClose(id: string, resolutionNote?: string | null) {
    return mapDetail(
        await apiRequest<RepairRequestApi>(`/api/repair-requests/${id}/close`, {
            method: 'PATCH',
            body: JSON.stringify({ resolution_note: resolutionNote }),
        }),
    );
}

export async function syncRepairRequestTracker(id: string) {
    return apiRequest<{
        tracker_ticket_id: string;
        tracker_ticket_key: string;
        tracker_ticket_url: string;
        last_sync_at: string;
    }>(`/api/repair-requests/${id}/tracker/sync`, { method: 'POST' });
}

export async function syncAllUnsynchronizedRepairRequests() {
    return apiRequest<{ attempted: number; synced: number; failed: number }>(
        '/api/repair-requests/tracker/sync-unsynchronized',
        { method: 'POST' },
    );
}
