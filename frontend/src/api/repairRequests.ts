import { apiRequest } from './client';
import { RepairRequest } from '../types/repairRequest';

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
    };
}

export async function createRepairRequest(payload: { deviceId: string; requesterName: string; description: string }) {
    const response = await apiRequest<RepairRequestApi>('/api/repair-requests', {
        method: 'POST',
        body: JSON.stringify({
            device_id: payload.deviceId,
            applicant_name: payload.requesterName,
            description: payload.description,
        }),
    });
    return mapRepairRequest(response);
}

export async function fetchRepairRequests() {
    const response = await apiRequest<{ items: RepairRequestApi[]; total: number }>('/api/repair-requests');
    return response.items.map(mapRepairRequest);
}
