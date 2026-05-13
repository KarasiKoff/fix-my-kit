export type Device = {
    id: string;
    inventoryNumber: string;
    name: string;
    category: string;
    serialNumber: string;
    audienceId?: number | null;
    audienceName: string;
    responsible: string;
    status: 'not_in_repair' | 'in_repair';
    takenBySysadmin: boolean;
};
