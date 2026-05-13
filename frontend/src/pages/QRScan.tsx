import React from 'react';
import { useNavigate } from 'react-router-dom';
import { QRScanner } from '../components/QRScanner';
import { useAppData } from '../context/AppDataContext';

export function QRScan() {
    const navigate = useNavigate();
    const { devices } = useAppData();

    function handleScan(value: string) {
        const normalized = value.trim().toLowerCase();
        const byId = devices.find((device) => device.id.toLowerCase() === normalized);
        const byInventory = devices.find((device) => device.inventoryNumber.toLowerCase() === normalized);
        const device = byId ?? byInventory;
        if (device) {
            navigate(`/devices/${device.id}`);
        }
    }

    return (
        <main className="page">
            <h2>Сканирование QR</h2>
            <section className="card">
                <QRScanner onScan={handleScan} />
            </section>
        </main>
    );
}
