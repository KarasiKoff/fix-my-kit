import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Device } from '../types/device';
import { RepairRequest } from '../types/repairRequest';
import { RepairHistoryEntry } from '../types/repairHistory';

type NewRequestPayload = {
    deviceId: string;
    requesterName: string;
    description: string;
    applicantType: 'public' | 'internal';
};

type AppDataContextValue = {
    devices: Device[];
    repairRequests: RepairRequest[];
    repairHistory: RepairHistoryEntry[];
    createRepairRequest: (payload: NewRequestPayload) => void;
    setDeviceStatus: (deviceId: string, status: Device['status'], note?: string) => void;
    getDeviceById: (id: string) => Device | undefined;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

const initialDevices: Device[] = [
    { id: 'dev-1', inventoryNumber: 'INV-1001', name: 'Ноутбук Lenovo T14', category: 'Ноутбук', serialNumber: 'LNV-T14-2391', room: '305', responsible: 'Иван Петров', status: 'not_in_repair', takenBySysadmin: false },
    { id: 'dev-2', inventoryNumber: 'INV-1002', name: 'Принтер HP LaserJet', category: 'Принтер', serialNumber: 'HP-LJ-7722', room: '214', responsible: 'Ольга Смирнова', status: 'in_repair', takenBySysadmin: true },
    { id: 'dev-3', inventoryNumber: 'INV-1003', name: 'Монитор Dell 24', category: 'Монитор', serialNumber: 'DLL-24-1122', room: '407', responsible: 'Алексей Ким', status: 'not_in_repair', takenBySysadmin: false },
];

const initialRequests: RepairRequest[] = [
    {
        id: 'req-1',
        deviceId: 'dev-2',
        requesterName: 'Мария Кузнецова',
        description: 'Зажевывает бумагу и не печатает после перезапуска.',
        status: 'in_progress',
        applicantType: 'internal',
        takenBySysadmin: true,
        createdAt: '2026-05-06T08:30:00.000Z',
        ticketId: '44102',
        ticketKey: 'FMK-17',
        ticketUrl: 'https://tracker.yandex.ru/FMK-17',
    },
];

const initialHistory: RepairHistoryEntry[] = [
    {
        id: 'hist-1',
        deviceId: 'dev-2',
        repairRequestId: 'req-1',
        oldStatus: 'not_in_repair',
        newStatus: 'in_repair',
        note: 'Принтер забрал системный администратор.',
        createdAt: '2026-05-06T08:45:00.000Z',
    },
];

function createYandexTicketMeta() {
    const numeric = Math.floor(Math.random() * 9000) + 1000;
    const key = `FMK-${numeric}`;
    return {
        ticketId: `${100000 + numeric}`,
        ticketKey: key,
        ticketUrl: `https://tracker.yandex.ru/${key}`,
    };
}

export function AppDataProvider({ children }: { children: ReactNode }) {
    const [devices, setDevices] = useState<Device[]>(initialDevices);
    const [repairRequests, setRepairRequests] = useState<RepairRequest[]>(initialRequests);
    const [repairHistory, setRepairHistory] = useState<RepairHistoryEntry[]>(initialHistory);

    const getDeviceById = (id: string) => devices.find((item) => item.id === id);

    const setDeviceStatus = (deviceId: string, status: Device['status'], note?: string) => {
        const prev = getDeviceById(deviceId);
        if (!prev || prev.status === status) {
            return;
        }
        setDevices((current) =>
            current.map((item) =>
                item.id === deviceId
                    ? {
                          ...item,
                          status,
                          takenBySysadmin: status === 'in_repair',
                      }
                    : item,
            ),
        );
        setRepairHistory((current) => [
            {
                id: `hist-${Date.now()}`,
                deviceId,
                oldStatus: prev.status,
                newStatus: status,
                note,
                createdAt: new Date().toISOString(),
            },
            ...current,
        ]);
    };

    const createRepairRequest = (payload: NewRequestPayload) => {
        const ticket = createYandexTicketMeta();
        const newRequest: RepairRequest = {
            id: `req-${Date.now()}`,
            deviceId: payload.deviceId,
            requesterName: payload.requesterName,
            description: payload.description,
            status: 'new',
            applicantType: payload.applicantType,
            takenBySysadmin: false,
            createdAt: new Date().toISOString(),
            ticketId: ticket.ticketId,
            ticketKey: ticket.ticketKey,
            ticketUrl: ticket.ticketUrl,
        };

        setRepairRequests((current) => [newRequest, ...current]);
        setDevices((current) =>
            current.map((device) =>
                device.id === payload.deviceId
                    ? {
                          ...device,
                          status: 'in_repair',
                          takenBySysadmin: true,
                      }
                    : device,
            ),
        );
        setRepairHistory((current) => [
            {
                id: `hist-${Date.now()}-request`,
                deviceId: payload.deviceId,
                repairRequestId: newRequest.id,
                oldStatus: 'not_in_repair',
                newStatus: 'in_repair',
                note: `Создана заявка ${newRequest.ticketKey}.`,
                createdAt: new Date().toISOString(),
            },
            ...current,
        ]);
    };

    const value = useMemo(
        () => ({
            devices,
            repairRequests,
            repairHistory,
            createRepairRequest,
            setDeviceStatus,
            getDeviceById,
        }),
        [devices, repairRequests, repairHistory],
    );

    return <AppDataContext.Provider value={value}>{children}</AppDataContext.Provider>;
}

export function useAppData() {
    const context = useContext(AppDataContext);
    if (!context) {
        throw new Error('useAppData must be used inside AppDataProvider');
    }
    return context;
}
