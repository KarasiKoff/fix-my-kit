import { apiRequest } from './client';

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
