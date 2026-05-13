import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useAuth } from '../hooks/useAuth';
import { fetchDevices, updateDeviceStatus } from '../api/devices';
import { createRepairRequest as createRepairRequestApi, fetchRepairRequests } from '../api/repairRequests';
import { Device } from '../types/device';
import { RepairRequest } from '../types/repairRequest';

type NewRequestPayload = {
    deviceId: string;
    requesterName: string;
    description: string;
    syncToTracker?: boolean;
};

type AppDataContextValue = {
    devices: Device[];
    repairRequests: RepairRequest[];
    isLoading: boolean;
    error: string | null;
    refresh: () => Promise<void>;
    createRepairRequest: (payload: NewRequestPayload) => Promise<void>;
    setDeviceStatus: (deviceId: string, status: Device['status'], note?: string) => Promise<void>;
    getDeviceById: (id: string) => Device | undefined;
};

const AppDataContext = createContext<AppDataContextValue | null>(null);

export function AppDataProvider({ children }: { children: ReactNode }) {
    const { isAuthenticated } = useAuth();
    const [devices, setDevices] = useState<Device[]>([]);
    const [repairRequests, setRepairRequests] = useState<RepairRequest[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const refresh = useCallback(async () => {
        setError(null);
        const [nextDevices, nextRequests] = await Promise.all([fetchDevices(), fetchRepairRequests()]);
        setDevices(nextDevices);
        setRepairRequests(nextRequests);
    }, []);

    useEffect(() => {
        if (!isAuthenticated) {
            setDevices([]);
            setRepairRequests([]);
            setError(null);
            setIsLoading(false);
            return;
        }

        let active = true;
        setIsLoading(true);
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
    }, [isAuthenticated, refresh]);

    const getDeviceById = useCallback((id: string) => devices.find((item) => item.id === id), [devices]);

    const setDeviceStatus = useCallback(
        async (deviceId: string, status: Device['status'], _note?: string) => {
            const prev = devices.find((item) => item.id === deviceId);
            if (!prev || prev.status === status) {
                return;
            }
            const updated = await updateDeviceStatus(deviceId, status);
            setDevices((current) => current.map((item) => (item.id === deviceId ? updated : item)));
            void _note;
        },
        [devices],
    );

    const createRepairRequest = useCallback(async (payload: NewRequestPayload) => {
        await createRepairRequestApi({
            deviceId: payload.deviceId,
            requesterName: payload.requesterName,
            description: payload.description,
            syncToTracker: payload.syncToTracker,
        });
        await refresh();
    }, [refresh]);

    const value = useMemo(
        () => ({
            devices,
            repairRequests,
            isLoading,
            error,
            refresh,
            createRepairRequest,
            setDeviceStatus,
            getDeviceById,
        }),
        [devices, repairRequests, isLoading, error, refresh, createRepairRequest, setDeviceStatus, getDeviceById],
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
