import React from 'react';
import { Device } from '../types/device';

export function DeviceCard({ device }: { device: Device }) {
    return (
        <article>
            <h3>{device.name}</h3>
            <p>Инвентарный номер: {device.inventoryNumber}</p>
            <p>Статус: {device.status}</p>
        </article>
    );
}
