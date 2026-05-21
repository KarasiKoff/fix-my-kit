import { getStoredAuthToken } from './auth';
import { apiRequest } from './client';
import type { TrackerAttachment } from '../types/repairRequest';

type TrackerAttachmentApi = {
    id: string;
    name: string;
    kind: string;
    mimetype?: string | null;
    size?: number | null;
    has_thumbnail: boolean;
    created_at?: string | null;
};

function mapAttachment(row: TrackerAttachmentApi): TrackerAttachment {
    return {
        id: row.id,
        name: row.name,
        kind: row.kind === 'video' ? 'video' : 'image',
        mimetype: row.mimetype,
        size: row.size,
        hasThumbnail: row.has_thumbnail,
        createdAt: row.created_at,
    };
}

export function repairAttachmentContentUrl(
    requestId: string,
    attachmentId: string,
    variant: 'content' | 'thumbnail' = 'content',
): string {
    const raw = import.meta.env.VITE_API_BASE_URL;
    const base =
        raw === undefined || raw === null || String(raw).trim() === ''
            ? ''
            : String(raw).replace(/\/+$/, '');
    const path = `/api/repair-requests/${requestId}/attachments/${attachmentId}/content?variant=${variant}`;
    return base === '' ? path : `${base}${path}`;
}

export async function fetchRepairRequestAttachments(requestId: string): Promise<TrackerAttachment[]> {
    const res = await apiRequest<{ items: TrackerAttachmentApi[] }>(
        `/api/repair-requests/${requestId}/attachments`,
    );
    return res.items.map(mapAttachment);
}

export async function runAttachmentCleanup() {
    return apiRequest<{
        orphan_dirs_removed: number;
        stale_files_removed: number;
        empty_dirs_removed: number;
    }>('/api/admin/attachments/cleanup', { method: 'POST' });
}

/** Заголовок Authorization для URL превью (img/video src не шлёт Bearer). */
export function attachmentPreviewHeaders(): HeadersInit | undefined {
    const token = getStoredAuthToken();
    if (!token) {
        return undefined;
    }
    return { Authorization: `Bearer ${token}` };
}
