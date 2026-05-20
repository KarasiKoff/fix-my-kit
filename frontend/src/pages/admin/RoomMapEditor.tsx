import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { fetchAudienceDevices, fetchAudiences, fetchRoomMap, saveRoomMap } from '../../api/audiences';
import { useMapDrag } from '../../hooks/useMapDrag';
import { MapDeviceChip } from '../../components/MapDeviceChip';
import { useToast } from '../../context/ToastContext';
import { formatApiError } from '../../utils/formatApiError';
import type { DeviceOnMap, RoomDeviceListItem } from '../../types/roomMap';

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
    const [gridCols, setGridCols] = useState(4);
    const [gridRows, setGridRows] = useState(4);
    const [chipSizePx, setChipSizePx] = useState(0);
    const chipProbeRef = useRef<HTMLDivElement>(null);

    const { positions, canvasRef, onChipMouseDown, onCanvasMouseMove, onCanvasMouseUp, dropDevice, removeDevice, resetPositions, draggingDeviceId } =
        useMapDrag({ initialPositions: mapDevices, gridCols, gridRows, chipSizePx });

    useLayoutEffect(() => {
        const el = chipProbeRef.current;
        if (!el) return;
        function measure() {
            const probe = chipProbeRef.current;
            if (!probe) return;
            const w = probe.offsetWidth;
            if (w > 0) setChipSizePx(w);
        }
        measure();
        const ro = new ResizeObserver(measure);
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

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
        return (
            mapDevices.find((d) => d.deviceId === deviceId) ??
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
                    categoryId: found.categoryId ?? null,
                    categoryHasIcon: found.categoryHasIcon ?? false,
                };
            })()
        );
    }

    function handleDragOver(e: React.DragEvent<HTMLDivElement>) {
        e.preventDefault();
    }

    function handleDrop(e: React.DragEvent<HTMLDivElement>) {
        const deviceId = e.dataTransfer.getData('deviceId');
        if (!deviceId) return;
        const { ok } = dropDevice(deviceId, e);
        if (!ok) {
            showError('Эта ячейка уже занята. Выберите другую.');
            return;
        }
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
                        categoryId: found.categoryId ?? null,
                        categoryHasIcon: found.categoryHasIcon ?? false,
                    },
                ]);
            }
        }
    }

    function clampGridDim(raw: string): number {
        const n = Number.parseInt(raw, 10);
        if (Number.isNaN(n)) return 1;
        return Math.min(10, Math.max(1, n));
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

    const mapCanvasMinStyle =
        chipSizePx > 0
            ? ({ ['--map-canvas-min-h' as string]: `${chipSizePx * 10 + 48}px` } as React.CSSProperties)
            : undefined;

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

                <div className="map-editor-main-column">
                    <div className="map-canvas-wrap">
                        <div
                            className="map-canvas map-canvas--map-light map-canvas--editor-fill"
                            style={mapCanvasMinStyle}
                            onMouseMove={onCanvasMouseMove}
                            onMouseUp={onCanvasMouseUp}
                            onMouseLeave={onCanvasMouseUp}
                            onDragOver={handleDragOver}
                            onDrop={handleDrop}
                        >
                            <div className="map-canvas-inner" ref={canvasRef}>
                                <div ref={chipProbeRef} className="map-chip-size-probe" aria-hidden />
                                {Object.keys(positions).length === 0 && (
                                    <div className="map-empty-hint">Перетащите устройства из панели слева</div>
                                )}
                                {Object.entries(positions).map(([deviceId, pos]) => {
                                    const info = getDeviceInfo(deviceId);
                                    if (!info) return null;
                                    return (
                                        <MapDeviceChip
                                            key={deviceId}
                                            device={info}
                                            xPct={pos.xPct}
                                            yPct={pos.yPct}
                                            allowDrag
                                            snapTransition={draggingDeviceId === deviceId}
                                            onMouseDown={onChipMouseDown}
                                            onRemove={removeDevice}
                                        />
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="map-editor-footer-row">
                        <div className="map-editor-footer__grid-controls">
                            <label className="map-grid-field">
                                <span className="map-grid-field__label">Столбцы</span>
                                <input
                                    type="number"
                                    className="map-grid-field__input"
                                    min={1}
                                    max={10}
                                    value={gridCols}
                                    onChange={(ev) => setGridCols(clampGridDim(ev.target.value))}
                                />
                            </label>
                            <label className="map-grid-field">
                                <span className="map-grid-field__label">Ряды</span>
                                <input
                                    type="number"
                                    className="map-grid-field__input"
                                    min={1}
                                    max={10}
                                    value={gridRows}
                                    onChange={(ev) => setGridRows(clampGridDim(ev.target.value))}
                                />
                            </label>
                        </div>
                        <div className="map-editor-footer__actions">
                            <button type="button" className="btn-ghost btn-compact" onClick={handleReset} disabled={saving}>
                                Сбросить
                            </button>
                            <button type="button" className="btn-primary btn-compact" onClick={() => void handleSave()} disabled={saving}>
                                {saving ? 'Сохранение…' : 'Сохранить карту'}
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </main>
    );
}
