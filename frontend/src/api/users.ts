import { apiRequest } from './client';
import { User } from '../types/user';

type UserApi = {
    id: string;
    login: string;
    full_name?: string | null;
    role: User['role'];
};

function mapUser(item: UserApi): User {
    return {
        id: item.id,
        name: item.full_name ?? item.login,
        login: item.login,
        role: item.role,
    };
}

export async function fetchUsers() {
    const response = await apiRequest<{ items: UserApi[]; total: number }>('/api/users');
    return response.items.map(mapUser);
}
