export type Device = {
    id: string;
    inventoryNumber: string;
    name: string;
    category: string;
    serialNumber: string;
    room: string;
    responsible: string;
    status: 'not_in_repair' | 'in_repair';
    takenBySysadmin: boolean;
};
