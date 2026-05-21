import React, { useEffect, useRef, useState } from 'react';
import { fetchRoomMap } from '../api/audiences';
import { useFixedMapCanvas } from '../hooks/useFixedMapCanvas';
import { useRoomMapDisplay } from '../hooks/useRoomMapDisplay';
import { MapCanvasStack } from './MapCanvasStack';
import { MapDeviceChip } from './MapDeviceChip';
import { formatApiError } from '../utils/formatApiError';
import type { MapDoorEdge } from '../types/roomMap';

type Props = {
    audienceId: number;
    audienceName: string;
    highlightedDeviceId: string;
    onClose: () => void;
};

export function RoomMapModal({ audienceId, audienceName, highlightedDeviceId, onClose }: Props) {
    const [positions, setPositions] = useState<Awaited<ReturnType<typeof fetchRoomMap>>['positions']>([]);
    const [gridCols, setGridCols] = useState(4);
    const [gridRows, setGridRows] = useState(4);
    const [doorEdge, setDoorEdge] = useState<MapDoorEdge>('bottom');
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const overlayRef = useRef<HTMLDivElement>(null);
    const { canvasStyle, wrapStyle } = useFixedMapCanvas(gridCols, gridRows);
    const { displayDevices } = useRoomMapDisplay(gridCols, gridRows, positions);

    useEffect(() => {
        setLoading(true);
        fetchRoomMap(audienceId)
            .then((data) => {
                setPositions(data.positions);
                setGridCols(data.gridCols);
                setGridRows(data.gridRows);
                setDoorEdge(data.doorEdge);
            })
            .catch((err: unknown) => setError(formatApiError(err)))
            .finally(() => setLoading(false));
    }, [audienceId]);

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
                    <div className="map-canvas-slot map-canvas-slot--modal">
                        <MapCanvasStack
                            doorEdge={doorEdge}
                            gridCols={gridCols}
                            gridRows={gridRows}
                            canvasStyle={{ pointerEvents: 'none', ...canvasStyle }}
                            wrapStyle={wrapStyle}
                            canvasClassName="map-canvas map-canvas--map-light map-canvas--editor-fill map-canvas--fixed-grid map-canvas--modal-view"
                        >
                            {displayDevices.map((p) => (
                                <MapDeviceChip
                                    key={p.deviceId}
                                    device={p}
                                    xPct={p.xPct}
                                    yPct={p.yPct}
                                    highlighted={p.deviceId === highlightedDeviceId}
                                    cursor="default"
                                />
                            ))}
                        </MapCanvasStack>
                    </div>
                )}
            </div>
        </div>
    );
}
