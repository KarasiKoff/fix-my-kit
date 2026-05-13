import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { fetchDevices, updateDeviceStatus } from '../api/devices';
import { createRepairRequest as createRepairRequestApi, fetchRepairRequests } from '../api/repairRequests';
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
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    createRepairRequest: (payload: NewRequestPayload) => Promise<void>;
    setDeviceStatus: (deviceId: string, status: Device['status'], note?: string) => Promise<void>;
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

const initialUsers: User[] = [
    {
        id: 'user-1',
        login: 'admin',
        name: 'Администратор системы',
        role: 'admin',
        isActive: true,
    },
    {
        id: 'user-2',
        login: 'sysadmin',
        name: 'Дежурный системный администратор',
        role: 'sysadmin',
        isActive: true,
    },
];

const initialCategories = ['Ноутбук', 'Принтер', 'Монитор'];
const initialCabinets = ['214', '305', '407'];

export function AppDataProvider({ children }: { children: ReactNode }) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [users, setUsers] = useState<User[]>(initialUsers);
    const [categories, setCategories] = useState<string[]>(initialCategories);
    const [cabinets, setCabinets] = useState<string[]>(initialCabinets);
    const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
    const [repairHistory, setRepairHistory] = useState<RepairHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setError(null);
        const [nextDevices, nextRequests] = await Promise.all([fetchDevices(), fetchRepairRequests()]);
        setDevices(nextDevices);
        setRepairRequests(nextRequests);
    }, []);

    useEffect(() => {
        let active = true;

        refresh()
            .catch((err) => {
                if (active) {
                    setError(err instanceof Error ? err.message : 'Не удалось загрузить данные');
                }
            })
            .finally(() => {
                if (active) {
                    setIsLoading(false);
                }
            });

        return () => {
            active = false;
        };
    }, [refresh]);

    const getDeviceById = (id: string) => devices.find((item) => item.id === id);

    const setDeviceStatus = async (deviceId: string, status: Device['status'], note?: string) => {
        const prev = getDeviceById(deviceId);
        if (!prev || prev.status === status) {
            return;
        }
        const updated = await updateDeviceStatus(deviceId, status);
        setDevices((current) => current.map((item) => (item.id === deviceId ? updated : item)));
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

    const createRepairRequest = async (payload: NewRequestPayload) => {
        const newRequest = await createRepairRequestApi(payload);

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
                note: `Создана заявка ${newRequest.ticketKey ?? newRequest.id}.`,
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
            isLoading,
            error,
            refresh,
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
        [
            devices,
            users,
            categories,
            cabinets,
            repairRequests,
            repairHistory,
            isLoading,
            error,
            refresh,
        ],
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
