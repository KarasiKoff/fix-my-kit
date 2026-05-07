import React, { useEffect, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScanner({ onScan }: { onScan: (value: string) => void }) {
    const [manualValue, setManualValue] = useState('');
    const [scanStatus, setScanStatus] = useState('Ожидание запуска камеры');

    useEffect(() => {
        const scanner = new Html5Qrcode('scanner-root');
        let active = true;

        scanner
            .start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                (decodedText) => {
                    if (!active) {
                        return;
                    }
                    setScanStatus(`Считано: ${decodedText}`);
                    onScan(decodedText);
                },
                () => undefined,
            )
            .then(() => {
                setScanStatus('Камера активна');
            })
            .catch(() => {
                setScanStatus('Камера недоступна, используйте ручной ввод ниже');
            });

        return () => {
            active = false;
            scanner
                .stop()
                .then(() => scanner.clear())
                .catch(() => scanner.clear());
        };
    }, [onScan]);

    return (
        <div className="scanner-wrap">
            <div id="scanner-root" />
            <p>{scanStatus}</p>
            <form
                className="manual-qr-form"
                onSubmit={(event) => {
                    event.preventDefault();
                    if (manualValue.trim().length === 0) {
                        return;
                    }
                    onScan(manualValue.trim());
                }}
            >
                <input
                    placeholder="Ручной ввод: id устройства или инв. номер"
                    value={manualValue}
                    onChange={(event) => setManualValue(event.target.value)}
                />
                <button type="submit">Открыть устройство</button>
            </form>
        </div>
    );
}
