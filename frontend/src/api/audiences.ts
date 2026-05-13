import { apiRequest } from './client';

export type AudienceApi = {
    id: number;
    name: string;
};

export async function fetchAudiences() {
    const response = await apiRequest<{ items: AudienceApi[] }>('/api/audiences');
    return response.items;
}
