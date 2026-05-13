export type User = {
    id: string;
    name: string;
    login?: string;
    role: 'guest' | 'admin' | 'sysadmin';
    isActive?: boolean;
};
