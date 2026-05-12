export type User = {
    id: string;
    login: string;
    fullName: string;
    email: string;
    role: 'guest' | 'admin' | 'sysadmin';
    isActive: boolean;
};
