import { apiRequest } from './client';

export type CategoryDto = {
    id: string;
    name: string;
    is_active: boolean;
    created_at: string;
};

export async function fetchCategories(isActive?: boolean) {
    const q = isActive === undefined ? '' : `?is_active=${isActive}`;
    const response = await apiRequest<{ items: CategoryDto[] }>(`/api/categories${q}`);
    return response.items;
}

export async function createCategory(name: string) {
    return apiRequest<CategoryDto>('/api/categories', {
        method: 'POST',
        body: JSON.stringify({ name }),
    });
}

export async function updateCategory(id: string, payload: { name?: string; is_active?: boolean }) {
    return apiRequest<CategoryDto>(`/api/categories/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(payload),
    });
}

export async function deleteCategory(id: string) {
    await apiRequest<void>(`/api/categories/${id}`, { method: 'DELETE' });
}
