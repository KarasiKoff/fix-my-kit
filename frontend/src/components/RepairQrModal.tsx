import React, { useCallback, useEffect, useState } from 'react';
import QRCode from 'qrcode';
import { buildRepairRequestUrl, repairQrDownloadBasename } from '../utils/qrGenerator';

type QrDevice = {
    id: string;
    inventoryNumber: string;
    name: string;
};

type RepairQrModalProps = {
    open: boolean;
    device: QrDevice | null;
    onClose: () => void;
};

export function RepairQrModal({ open, device, onClose }: RepairQrModalProps) {
    const [dataUrl, setDataUrl] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!open || !device) {
            setDataUrl(null);
            setError(null);
            setLoading(false);
            return;
        }

        let cancelled = false;
        const url = buildRepairRequestUrl(device.id);
        setLoading(true);
        setError(null);
        setDataUrl(null);

        QRCode.toDataURL(url, { width: 280, margin: 2, errorCorrectionLevel: 'M', color: { dark: '#000000', light: '#ffffff' } })
            .then((png) => {
                if (!cancelled) {
                    setDataUrl(png);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Не удалось сформировать QR-код');
                }
            })
            .finally(() => {
                if (!cancelled) {
                    setLoading(false);
                }
            });

        return () => {
            cancelled = true;
        };
    }, [open, device]);

    const handleDownload = useCallback(() => {
        if (!dataUrl || !device) {
            return;
        }
        const base = repairQrDownloadBasename(device.inventoryNumber, device.id);
        const anchor = document.createElement('a');
        anchor.href = dataUrl;
        anchor.download = `repair-qr-${base}.png`;
        anchor.rel = 'noopener';
        anchor.click();
    }, [dataUrl, device]);

    useEffect(() => {
        if (!open) {
            return;
        }
        const onKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        window.addEventListener('keydown', onKeyDown);
        return () => window.removeEventListener('keydown', onKeyDown);
    }, [open, onClose]);

    if (!open || !device) {
        return null;
    }

    return (
        <div className="modal-backdrop" role="presentation" onClick={onClose}>
            <div
                className="modal-panel card"
                role="dialog"
                aria-modal="true"
                aria-labelledby="repair-qr-modal-title"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="modal-panel__head">
                    <h3 id="repair-qr-modal-title">QR заявки на ремонт</h3>
                    <button type="button" className="modal-panel__close" onClick={onClose} aria-label="Закрыть">
                        ×
                    </button>
                </div>
                <p className="modal-panel__meta">
                    <strong>{device.name}</strong>
                    <span className="modal-panel__inv"> · инв. {device.inventoryNumber}</span>
                </p>
                <p className="modal-panel__hint">Ссылка ведёт на страницу создания заявки для этого устройства.</p>
                <div className="modal-panel__qr">
                    {loading && <p>Генерация…</p>}
                    {error && <p className="error-text">{error}</p>}
                    {!loading && !error && dataUrl && <img src={dataUrl} alt="QR-код со ссылкой на заявку" width={280} height={280} />}
                </div>
                <div className="modal-panel__actions">
                    <button type="button" onClick={handleDownload} disabled={!dataUrl}>
                        Скачать PNG
                    </button>
                    <button type="button" className="modal-panel__btn-ghost" onClick={onClose}>
                        Закрыть
                    </button>
                </div>
            </div>
        </div>
    );
}
