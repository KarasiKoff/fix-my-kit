import React, { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAudienceDevices, fetchAudiences, fetchRoomMap, saveRoomMap } from '../../api/audiences';
import { useMapDrag } from '../../hooks/useMapDrag';
import { useToast } from '../../context/ToastContext';
import { formatApiError } from '../../utils/formatApiError';
import type { DeviceOnMap, RoomDeviceListItem } from '../../types/roomMap';

function chipClass(repairStatus: string, highlighted = false): string {
    const base = 'device-chip';
    const status = repairStatus === 'in_repair' ? ' device-chip--in-repair' : '';
    const hl = highlighted ? ' device-chip--highlighted' : '';
    return base + status + hl;
}

type DeviceChipProps = {
    device: DeviceOnMap;
    xPct: number;
    yPct: number;
    onMouseDown: (deviceId: string, e: React.MouseEvent) => void;
    onRemove: (deviceId: string) => void;
};

function DeviceChip({ device, xPct, yPct, onMouseDown, onRemove }: DeviceChipProps) {
    return (
        <div
            className={chipClass(device.repairStatus)}
            style={{ left: `${xPct}%`, top: `${yPct}%` }}
            onMouseDown={(e) => onMouseDown(device.deviceId, e)}
        >
            <span>{device.inventoryNumber}</span>
            <button
                type="button"
                className="device-chip__remove"
                title="Убрать с карты"
                onMouseDown={(e) => e.stopPropagation()}
                onClick={() => onRemove(device.deviceId)}
            >
                ✕
            </button>
        </div>
    );
}

type SidebarItemProps = {
    item: RoomDeviceListItem;
};

function SidebarItem({ item }: SidebarItemProps) {
    return (
        <div
            className={`sidebar-device-chip${item.repairStatus === 'in_repair' ? ' sidebar-device-chip--in-repair' : ''}`}
            draggable
            onDragStart={(e) => e.dataTransfer.setData('deviceId', item.id)}
        >
            <div style={{ fontWeight: 600, fontSize: '0.82rem' }}>{item.inventoryNumber}</div>
            <div style={{ fontSize: '0.78rem', color: 'var(--text-muted)', marginTop: 2 }}>{item.name}</div>
        </div>
    );
}

export function RoomMapEditor() {
    const { id } = useParams<{ id: string }>();
    const audienceId = Number(id);
    const { showSuccess, showError } = useToast();

    const [mapDevices, setMapDevices] = useState<DeviceOnMap[]>([]);
    const [allDevices, setAllDevices] = useState<RoomDeviceListItem[]>([]);
    const [audienceName, setAudienceName] = useState('');
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);

    const { positions, canvasRef, onChipMouseDown, onCanvasMouseMove, onCanvasMouseUp, dropDevice, removeDevice, resetPositions } =
        useMapDrag(mapDevices);

    useEffect(() => {
        if (!audienceId) return;
        setLoading(true);
        Promise.all([fetchRoomMap(audienceId), fetchAudienceDevices(audienceId), fetchAudiences()])
            .then(([mapData, devices, audiences]) => {
                setMapDevices(mapData.positions);
                resetPositions(mapData.positions);
                setAllDevices(devices);
                const found = audiences.find((a) => a.id === audienceId);
                setAudienceName(found?.name ?? String(audienceId));
            })
            .catch((err: unknown) => showError(formatApiError(err)))
            .finally(() => setLoading(false));
    }, [audienceId]); // eslint-disable-line react-hooks/exhaustive-deps

    const placedIds = new Set(Object.keys(positions));
    const unplacedDevices = allDevices.filter((d) => !placedIds.has(d.id));

    function getDeviceInfo(deviceId: string): DeviceOnMap | undefined {
        return mapDevices.find((d) => d.deviceId === deviceId) ??
            (() => {
                const found = allDevices.find((d) => d.id === deviceId);
                if (!found) return undefined;
                return {
                    deviceId: found.id,
                    xPct: 0,
                    yPct: 0,
                    deviceName: found.name,
                    inventoryNumber: found.inventoryNumber,
                    repairStatus: found.repairStatus,
                };
            })();
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        const deviceId = e.dataTransfer.getData('deviceId');
        if (!deviceId) return;
        dropDevice(deviceId, e);
        // Если устройство ещё не в mapDevices — добавим его
        if (!mapDevices.find((d) => d.deviceId === deviceId)) {
            const found = allDevices.find((d) => d.id === deviceId);
            if (found) {
                setMapDevices((prev) => [
                    ...prev,
                    {
                        deviceId: found.id,
                        xPct: 0,
                        yPct: 0,
                        deviceName: found.name,
                        inventoryNumber: found.inventoryNumber,
                        repairStatus: found.repairStatus,
                    },
                ]);
            }
        }
    }

    async function handleSave() {
        setSaving(true);
        try {
            const payload = Object.entries(positions).map(([device_id, pos]) => ({
                device_id,
                x_pct: pos.xPct,
                y_pct: pos.yPct,
            }));
            const saved = await saveRoomMap(audienceId, payload);
            setMapDevices(saved.positions);
            resetPositions(saved.positions);
            showSuccess('Карта сохранена');
        } catch (err: unknown) {
            showError(formatApiError(err));
        } finally {
            setSaving(false);
        }
    }

    function handleReset() {
        resetPositions(mapDevices);
    }

    if (loading) {
        return (
            <main className="page page--centered">
                <p className="muted-text">Загрузка…</p>
            </main>
        );
    }

    return (
        <main className="page page--wide">
            <div className="admin-page-head admin-page-head--edges">
                <Link to="/admin/add/room" className="admin-back-link">
                    ← Кабинеты
                </Link>
                <h2 className="page-title" style={{ margin: 0 }}>
                    Карта кабинета {audienceName}
                </h2>
            </div>

            <div className="map-editor-layout">
                {/* Sidebar: unplaced devices */}
                <aside className="map-device-sidebar">
                    <p className="map-device-sidebar__title">Не размещено</p>
                    {unplacedDevices.length === 0 ? (
                        <p className="muted-text" style={{ fontSize: '0.82rem', margin: 0 }}>
                            Все устройства размещены
                        </p>
                    ) : (
                        unplacedDevices.map((d) => <SidebarItem key={d.id} item={d} />)
                    )}
                    {allDevices.length === 0 && (
                        <p className="muted-text" style={{ fontSize: '0.82rem', margin: 0 }}>
                            В этом кабинете нет устройств
                        </p>
                    )}
                </aside>

                {/* Canvas */}
                <div className="map-canvas-wrap">
                    <div
                        className="map-canvas"
                        onMouseMove={onCanvasMouseMove}
                        onMouseUp={onCanvasMouseUp}
                        onMouseLeave={onCanvasMouseUp}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    >
                        <div className="map-canvas-inner" ref={canvasRef}>
                            {Object.keys(positions).length === 0 && (
                                <div className="map-empty-hint">
                                    Перетащите устройства из панели слева
                                </div>
                            )}
                            {Object.entries(positions).map(([deviceId, pos]) => {
                                const info = getDeviceInfo(deviceId);
                                if (!info) return null;
                                return (
                                    <DeviceChip
                                        key={deviceId}
                                        device={info}
                                        xPct={pos.xPct}
                                        yPct={pos.yPct}
                                        onMouseDown={onChipMouseDown}
                                        onRemove={removeDevice}
                                    />
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>

            <div className="map-editor-footer">
                <button type="button" className="btn-ghost btn-compact" onClick={handleReset} disabled={saving}>
                    Сбросить
                </button>
                <button type="button" className="btn-primary btn-compact" onClick={() => void handleSave()} disabled={saving}>
                    {saving ? 'Сохранение…' : 'Сохранить карту'}
                </button>
            </div>
        </main>
    );
}
