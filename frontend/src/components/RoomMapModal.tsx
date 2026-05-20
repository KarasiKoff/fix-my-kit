import React, { useEffect, useRef, useState } from 'react';
import { fetchRoomMap } from '../api/audiences';
import { MapDeviceChip } from './MapDeviceChip';
import { formatApiError } from '../utils/formatApiError';
import type { DeviceOnMap } from '../types/roomMap';

type Props = {
    audienceId: number;
    audienceName: string;
    highlightedDeviceId: string;
    onClose: () => void;
};

export function RoomMapModal({ audienceId, audienceName, highlightedDeviceId, onClose }: Props) {
    const [positions, setPositions] = useState<DeviceOnMap[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        setLoading(true);
        fetchRoomMap(audienceId)
            .then((data) => setPositions(data.positions))
            .catch((err: unknown) => setError(formatApiError(err)))
            .finally(() => setLoading(false));
    }, [audienceId]);

    // Закрытие по Escape
    useEffect(() => {
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') onClose();
        }
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    function handleOverlayClick(e: React.MouseEvent<HTMLDivElement>) {
        if (e.target === overlayRef.current) onClose();
    }

    const highlighted = positions.find((p) => p.deviceId === highlightedDeviceId);

    return (
        <div className="room-map-modal-overlay" ref={overlayRef} onClick={handleOverlayClick}>
            <div className="room-map-modal card">
                <div className="room-map-modal__head">
                    <h3 className="room-map-modal__title">Карта кабинета {audienceName}</h3>
                    <button type="button" className="room-map-modal__close" onClick={onClose} aria-label="Закрыть">
                        ✕
                    </button>
                </div>

                {highlighted && (
                    <p className="muted-text" style={{ margin: '0 0 8px', fontSize: '0.875rem' }}>
                        Устройство:{' '}
                        <strong style={{ color: 'var(--accent)' }}>
                            {highlighted.inventoryNumber} — {highlighted.deviceName}
                        </strong>
                    </p>
                )}

                {loading ? (
                    <p className="muted-text">Загрузка карты…</p>
                ) : error ? (
                    <p className="error-text">{error}</p>
                ) : positions.length === 0 ? (
                    <p className="muted-text">Карта не настроена для этого кабинета.</p>
                ) : (
                    <div className="map-canvas map-canvas--map-light map-canvas--editor-fill" style={{ pointerEvents: 'none' }}>
                        <div className="map-canvas-inner">
                            {positions.map((p) => (
                                <MapDeviceChip
                                    key={p.deviceId}
                                    device={p}
                                    xPct={p.xPct}
                                    yPct={p.yPct}
                                    highlighted={p.deviceId === highlightedDeviceId}
                                    cursor="default"
                                />
                            ))}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
