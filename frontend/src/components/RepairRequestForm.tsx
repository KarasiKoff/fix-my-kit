import React, { useEffect, useState } from 'react';
import { Device } from '../types/device';

type FormData = {
    deviceId: string;
    name: string;
    description: string;
};

export function RepairRequestForm({
    devices,
    initialDeviceId,
    deviceSelectDisabled = false,
    nameRequired = false,
    onSubmit,
}: {
    devices: Device[];
    initialDeviceId?: string;
    deviceSelectDisabled?: boolean;
    nameRequired?: boolean;
    onSubmit: (data: FormData) => void | Promise<void>;
}) {
    const [deviceId, setDeviceId] = useState(initialDeviceId ?? devices[0]?.id ?? '');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    useEffect(() => {
        if (initialDeviceId) {
            setDeviceId(initialDeviceId);
        }
    }, [initialDeviceId]);

    useEffect(() => {
        if (devices.length === 0) {
            setDeviceId('');
            return;
        }

        if (!devices.some((device) => device.id === deviceId)) {
            setDeviceId(devices[0].id);
        }
    }, [devices, deviceId]);

    return (
        <form
            className="repair-request-form"
            onSubmit={async (event) => {
                event.preventDefault();
                if (!deviceId) {
                    return;
                }
                if (nameRequired && !name.trim()) {
                    return;
                }
                try {
                    await Promise.resolve(onSubmit({ deviceId, name, description }));
                    setDescription('');
                    if (nameRequired) {
                        setName('');
                    }
                } catch {
                    /* ошибку показывает родитель */
                }
            }}
        >
            <label>
                Устройство
                <select
                    value={deviceId}
                    onChange={(event) => setDeviceId(event.target.value)}
                    required
                    disabled={devices.length === 0 || deviceSelectDisabled}
                >
                    {devices.length === 0 ? (
                        <option value="">Нет доступных устройств</option>
                    ) : (
                        devices.map((device) => (
                            <option key={device.id} value={device.id}>
                                {device.inventoryNumber} — {device.name}
                            </option>
                        ))
                    )}
                </select>
            </label>
            {nameRequired ? (
                <label>
                    Фамилия и имя
                    <input value={name} onChange={(e) => setName(e.target.value)} required />
                </label>
            ) : null}
            <label>
                Описание
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </label>
            <button type="submit" disabled={devices.length === 0}>
                Отправить заявку
            </button>
        </form>
    );
}
