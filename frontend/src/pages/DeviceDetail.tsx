import React, { useCallback, useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { fetchDeviceById, fetchDeviceHistory, updateDeviceStatus } from '../api/devices';
import { Device } from '../types/device';
import { RepairHistoryEntry } from '../types/repairHistory';
import { useToast } from '../context/ToastContext';
import { deviceHistoryStatusLabel, deviceRepairStatusLabel, deviceRepairStatusPillClass } from '../utils/statusDisplay';

function formatApiError(err: unknown): string {
    if (err instanceof ApiError) {
        if (typeof err.detail === 'string') {
            return err.detail;
        }
        return JSON.stringify(err.detail);
    }
    if (err instanceof Error) {
        return err.message;
    }
    return 'Ошибка запроса';
}

function formatHistoryLine(entry: RepairHistoryEntry): string {
    return `${deviceHistoryStatusLabel(entry.oldStatus)} → ${deviceHistoryStatusLabel(entry.newStatus)}`;
}

export function DeviceDetail() {
    const { id } = useParams();
    const { showError } = useToast();
    const [device, setDevice] = useState<Device | null>(null);
    const [history, setHistory] = useState<RepairHistoryEntry[]>([]);
    const [loading, setLoading] = useState(true);

    const reload = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        try {
            const [d, h] = await Promise.all([fetchDeviceById(id), fetchDeviceHistory(id)]);
            setDevice(d);
            setHistory(h);
        } catch (err) {
            setDevice(null);
            setHistory([]);
            showError(formatApiError(err));
        } finally {
            setLoading(false);
        }
    }, [id, showError]);

    useEffect(() => {
        void reload();
    }, [reload]);

    async function handleStatusChange(status: Device['status'], note: string) {
        if (!id) {
            return;
        }
        try {
            await updateDeviceStatus(id, status);
            await reload();
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    if (loading) {
        return (
            <main className="page">
                <h2>Карточка устройства</h2>
                <p>Загрузка…</p>
            </main>
        );
    }

    if (!device) {
        return (
            <main className="page">
                <h2>Карточка устройства</h2>
                <p>Устройство не найдено.</p>
                <Link to="/devices">Вернуться к списку</Link>
            </main>
        );
    }

    return (
        <main className="page">
            <h2>Карточка устройства</h2>
            <section className="card">
                <div className="device-title-row">
                    <h3>{device.name}</h3>
                    <span className={deviceRepairStatusPillClass(device.status)}>{deviceRepairStatusLabel(device.status)}</span>
                </div>
                <div className="grid grid-2">
                    <p>
                        <strong>Инвентарный номер:</strong> {device.inventoryNumber}
                    </p>
                    <p>
                        <strong>Категория:</strong> {device.category}
                    </p>
                    <p>
                        <strong>Серийный номер:</strong> {device.serialNumber}
                    </p>
                    <p>
                        <strong>Кабинет:</strong> {device.room}
                    </p>
                    <p>
                        <strong>Ответственный:</strong> {device.responsible || '—'}
                    </p>
                    <p>
                        <strong>Забрал сисадмин:</strong> {device.takenBySysadmin ? 'Да' : 'Нет'}
                    </p>
                </div>
                <div className="actions-row">
                    <button type="button" onClick={() => void handleStatusChange('in_repair', '')}>
                        Перевести в «В ремонте»
                    </button>
                    <button type="button" onClick={() => void handleStatusChange('not_in_repair', '')}>
                        Перевести в «Исправно»
                    </button>
                    <Link to={`/repair?deviceId=${device.id}`}>Создать заявку</Link>
                </div>
            </section>

            <section className="card">
                <h3>История ремонтов</h3>
                {history.length === 0 ? (
                    <p>Записей пока нет.</p>
                ) : (
                    <ul className="history-list">
                        {history.map((entry) => (
                            <li key={entry.id}>
                                <strong>{new Date(entry.createdAt).toLocaleString('ru-RU')}</strong> — {formatHistoryLine(entry)}
                                {entry.note ? ` (${entry.note})` : ''}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
