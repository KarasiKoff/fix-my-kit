export type User = {
    id: string;
    login: string;
    fullName: string;
    role: 'guest' | 'admin' | 'sysadmin';
    isActive: boolean;
};
