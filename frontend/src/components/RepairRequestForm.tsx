import React, { useState } from 'react';
import { Device } from '../types/device';

type FormData = {
    deviceId: string;
    name: string;
    description: string;
    applicantType: 'public' | 'internal';
};

export function RepairRequestForm({
    devices,
    initialDeviceId,
    onSubmit,
}: {
    devices: Device[];
    initialDeviceId?: string;
    onSubmit: (data: FormData) => void;
}) {
    const [deviceId, setDeviceId] = useState(initialDeviceId ?? devices[0]?.id ?? '');
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');
    const [applicantType, setApplicantType] = useState<'public' | 'internal'>('public');

    return (
        <form
            className="request-form"
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit({ deviceId, name, description, applicantType });
                setDescription('');
            }}
        >
            <label>
                Устройство
                <select value={deviceId} onChange={(event) => setDeviceId(event.target.value)} required>
                    {devices.map((device) => (
                        <option key={device.id} value={device.id}>
                            {device.inventoryNumber} - {device.name}
                        </option>
                    ))}
                </select>
            </label>
            <label>
                Фамилия и имя
                <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
                Тип заявки
                <select value={applicantType} onChange={(event) => setApplicantType(event.target.value as 'public' | 'internal')}>
                    <option value="public">Публичная (без авторизации)</option>
                    <option value="internal">Внутренняя (авторизованный)</option>
                </select>
            </label>
            <label>
                Описание
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} required />
            </label>
            <button type="submit">Отправить заявку</button>
        </form>
    );
}
