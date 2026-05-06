import React from 'react';
import { QRScanner } from '../components/QRScanner';

export function QRScan() {
    return (
        <main>
            <h2>Сканирование QR</h2>
            <QRScanner />
        </main>
    );
}
