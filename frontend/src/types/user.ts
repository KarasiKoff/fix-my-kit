export type User = {
    id: string;
    name: string;
    role: 'guest' | 'admin' | 'sysadmin';
};
