export type DeviceOnMap = {
    deviceId: string;
    xPct: number;
    yPct: number;
    deviceName: string;
    inventoryNumber: string;
    repairStatus: 'not_in_repair' | 'in_repair';
};

export type RoomMapData = {
    audienceId: number;
    positions: DeviceOnMap[];
};

export type RoomDeviceListItem = {
    id: string;
    name: string;
    inventoryNumber: string;
    repairStatus: 'not_in_repair' | 'in_repair';
    isOnMap: boolean;
};
