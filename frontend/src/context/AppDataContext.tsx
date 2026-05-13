import React, { createContext, ReactNode, useContext, useEffect, useMemo, useState } from 'react';
import { fetchDevices, updateDeviceStatus } from '../api/devices';
import { createRepairRequest as createRepairRequestApi, fetchRepairRequests } from '../api/repairRequests';
import { Device } from '../types/device';
import { RepairRequest } from '../types/repairRequest';
import { RepairHistoryEntry } from '../types/repairHistory';

type NewRequestPayload = {
    deviceId: string;
    requesterName: string;
    description: string;
};

type AppDataContextValue = {
    devices: Device[];
    repairRequests: RepairRequest[];
    repairHistory: RepairHistoryEntry[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    createRepairRequest: (payload: NewRequestPayload) => Promise<void>;
    setDeviceStatus: (deviceId: string, status: Device['status'], note?: string) => Promise<void>;
    getDeviceById: (id: string) => Device | undefined;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
    const [devices, setDevices] = useState<Device[]>([]);
    const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
    const [repairHistory, setRepairHistory] = useState<RepairHistoryEntry[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = async () => {
        setError(null);
        const [nextDevices, nextRequests] = await Promise.all([fetchDevices(), fetchRepairRequests()]);
        setDevices(nextDevices);
        setRepairRequests(nextRequests);
    };

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
    }, []);

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

    const value = useMemo(
        () => ({
            devices,
            repairRequests,
            repairHistory,
            isLoading,
            error,
            refresh,
            createRepairRequest,
            setDeviceStatus,
            getDeviceById,
        }),
        [devices, repairRequests, repairHistory, isLoading, error],
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
