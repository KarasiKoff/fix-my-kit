import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

export function QRScanner({ onScan }: { onScan: (value: string) => void }) {
    const [manualValue, setManualValue] = useState('');
    const [scanStatus, setScanStatus] = useState('Ожидание запуска камеры');
    const scannerRef = useRef<Html5Qrcode | null>(null);

    useEffect(() => {
        const scanner = new Html5Qrcode('scanner-root');
        scannerRef.current = scanner;
        let mounted = true;

        scanner
            .start(
                { facingMode: 'environment' },
                { fps: 10, qrbox: { width: 240, height: 240 } },
                (decodedText) => {
                    if (!mounted) {
                        return;
                    }
                    setScanStatus(`Считано: ${decodedText}`);
                    onScan(decodedText);
                },
                () => undefined,
            )
            .then(() => {
                if (!mounted) {
                    return;
                }
                setScanStatus('Камера активна');
            })
            .catch((error) => {
                console.error('QRScanner start failed:', error);
                if (!mounted) {
                    return;
                }
                setScanStatus('Камера недоступна, используйте ручной ввод ниже');
            });

        return () => {
            mounted = false;
            const currentScanner = scannerRef.current;
            if (!currentScanner) {
                return;
            }

            if (currentScanner.isScanning) {
                currentScanner
                    .stop()
                    .then(() => currentScanner.clear())
                    .catch(() => currentScanner.clear());
            } else {
                currentScanner.clear();
            }
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
