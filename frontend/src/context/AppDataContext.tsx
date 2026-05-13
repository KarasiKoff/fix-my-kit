import React, { createContext, ReactNode, useContext, useMemo, useState } from 'react';
import { Device } from '../types/device';
import { RepairRequest } from '../types/repairRequest';
import { RepairHistoryEntry } from '../types/repairHistory';
import { User } from '../types/user';

type NewRequestPayload = {
    deviceId: string;
    requesterName: string;
    description: string;
};

type AppDataContextValue = {
    devices: Device[];
    users: User[];
    categories: string[];
    cabinets: string[];
    repairRequests: RepairRequest[];
    repairHistory: RepairHistoryEntry[];
    createRepairRequest: (payload: NewRequestPayload) => void;
    setDeviceStatus: (deviceId: string, status: Device['status'], note?: string) => void;
    addDevice: (payload: Omit<Device, 'id' | 'takenBySysadmin'>) => void;
    createUser: (payload: Omit<User, 'id'>) => void;
    updateUser: (userId: string, payload: Partial<Omit<User, 'id'>>) => void;
    removeUser: (userId: string) => void;
    addCategory: (name: string) => void;
    addCabinet: (name: string) => void;
    removeCategory: (name: string) => void;
    renameCategory: (oldName: string, newName: string) => void;
    removeCabinet: (name: string) => void;
    renameCabinet: (oldName: string, newName: string) => void;
    updateDevice: (deviceId: string, payload: Partial<Omit<Device, 'id' | 'takenBySysadmin'>>) => void;
    removeDevice: (deviceId: string) => void;
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

const initialUsers: User[] = [
    {
        id: 'user-1',
        login: 'admin',
        fullName: 'Администратор системы',
        role: 'admin',
        isActive: true,
    },
    {
        id: 'user-2',
        login: 'sysadmin',
        fullName: 'Дежурный системный администратор',
        role: 'sysadmin',
        isActive: true,
    },
];

const initialCategories = ['Ноутбук', 'Принтер', 'Монитор'];
const initialCabinets = ['214', '305', '407'];

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
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [categories, setCategories] = useState<string[]>(initialCategories);
    const [cabinets, setCabinets] = useState<string[]>(initialCabinets);
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

    const addDevice = (payload: Omit<Device, 'id' | 'takenBySysadmin'>) => {
        setDevices((current) => [
            {
                ...payload,
                id: `dev-${Date.now()}`,
                takenBySysadmin: payload.status === 'in_repair',
            },
            ...current,
        ]);
    };

    const createUser = (payload: Omit<User, 'id'>) => {
        setUsers((current) => [{ ...payload, id: `user-${Date.now()}` }, ...current]);
    };

    const updateUser = (userId: string, payload: Partial<Omit<User, 'id'>>) => {
        setUsers((current) => current.map((user) => (user.id === userId ? { ...user, ...payload } : user)));
    };

    const removeUser = (userId: string) => {
        setUsers((current) => current.filter((user) => user.id !== userId));
    };

    const addCategory = (name: string) => {
        const normalized = name.trim();
        if (!normalized) {
            return;
        }
        setCategories((current) => (current.includes(normalized) ? current : [...current, normalized]));
    };

    const addCabinet = (name: string) => {
        const normalized = name.trim();
        if (!normalized) {
            return;
        }
        setCabinets((current) => (current.includes(normalized) ? current : [...current, normalized]));
    };

    const removeCategory = (name: string) => {
        setCategories((current) => {
            const next = current.filter((item) => item !== name);
            const fallback = next[0] ?? 'Прочее';
            setDevices((devs) =>
                devs.map((device) => (device.category === name ? { ...device, category: fallback } : device)),
            );
            return next.length === 0 ? ['Прочее'] : next;
        });
    };

    const renameCategory = (oldName: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === oldName) {
            return;
        }
        setCategories((current) => {
            if (current.some((c) => c === trimmed && c !== oldName)) {
                return current;
            }
            return current.map((c) => (c === oldName ? trimmed : c));
        });
        setDevices((devs) => devs.map((d) => (d.category === oldName ? { ...d, category: trimmed } : d)));
    };

    const removeCabinet = (name: string) => {
        setCabinets((current) => {
            const next = current.filter((item) => item !== name);
            const fallback = next[0] ?? '—';
            setDevices((devs) => devs.map((device) => (device.room === name ? { ...device, room: fallback } : device)));
            return next.length === 0 ? ['—'] : next;
        });
    };

    const renameCabinet = (oldName: string, newName: string) => {
        const trimmed = newName.trim();
        if (!trimmed || trimmed === oldName) {
            return;
        }
        setCabinets((current) => {
            if (current.some((c) => c === trimmed && c !== oldName)) {
                return current;
            }
            return current.map((c) => (c === oldName ? trimmed : c));
        });
        setDevices((devs) => devs.map((d) => (d.room === oldName ? { ...d, room: trimmed } : d)));
    };

    const updateDevice = (deviceId: string, payload: Partial<Omit<Device, 'id' | 'takenBySysadmin'>>) => {
        setDevices((current) =>
            current.map((item) => {
                if (item.id !== deviceId) {
                    return item;
                }
                const merged = { ...item, ...payload };
                const status = merged.status;
                const takenBySysadmin = payload.status !== undefined ? status === 'in_repair' : item.takenBySysadmin;
                return { ...merged, takenBySysadmin };
            }),
        );
    };

    const removeDevice = (deviceId: string) => {
        setDevices((current) => current.filter((item) => item.id !== deviceId));
    };

    const value = useMemo(
        () => ({
            devices,
            users,
            categories,
            cabinets,
            repairRequests,
            repairHistory,
            createRepairRequest,
            setDeviceStatus,
            addDevice,
            createUser,
            updateUser,
            removeUser,
            addCategory,
            addCabinet,
            removeCategory,
            renameCategory,
            removeCabinet,
            renameCabinet,
            updateDevice,
            removeDevice,
            getDeviceById,
        }),
        [devices, users, categories, cabinets, repairRequests, repairHistory],
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
