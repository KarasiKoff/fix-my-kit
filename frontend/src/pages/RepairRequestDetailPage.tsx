import React, { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { ApiError } from '../api/client';
import { fetchDeviceById } from '../api/devices';
import {
    fetchRepairRequest,
    isRepairRequestSynced,
    patchRepairRequestClose,
    patchRepairRequestStatus,
    patchRepairRequestTake,
    syncRepairRequestTracker,
} from '../api/repairRequests';
import { Device } from '../types/device';
import { RepairRequestDetail } from '../types/repairRequest';
import { useToast } from '../context/ToastContext';

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

function apiStatusFromUi(s: RepairRequestDetail['status']): 'open' | 'in_progress' | 'closed' {
    if (s === 'new') {
        return 'open';
    }
    return s;
}

export function RepairRequestDetailPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { showSuccess, showError } = useToast();
    const [request, setRequest] = useState<RepairRequestDetail | null>(null);
    const [device, setDevice] = useState<Device | null>(null);
    const [loading, setLoading] = useState(true);
    const [closeNote, setCloseNote] = useState('');

    const reload = useCallback(async () => {
        if (!id) {
            return;
        }
        setLoading(true);
        try {
            const req = await fetchRepairRequest(id);
            setRequest(req);
            const dev = await fetchDeviceById(req.deviceId);
            setDevice(dev);
        } catch (err) {
            setRequest(null);
            setDevice(null);
            showError(formatApiError(err));
        } finally {
            setLoading(false);
        }
    }, [id, showError]);

    useEffect(() => {
        void reload();
    }, [reload]);

    async function trySync() {
        if (!id) {
            return;
        }
        try {
            await syncRepairRequestTracker(id);
            showSuccess('Синхронизация с Трекером выполнена');
            await reload();
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    async function setStatus(next: 'open' | 'in_progress' | 'closed') {
        if (!id) {
            return;
        }
        try {
            const note = next === 'closed' ? closeNote || null : undefined;
            const updated =
                next === 'closed'
                    ? await patchRepairRequestClose(id, note)
                    : await patchRepairRequestStatus(id, next, note);
            setRequest(updated);
            setDevice(await fetchDeviceById(updated.deviceId));
            if (next === 'closed') {
                setCloseNote('');
            }
            showSuccess('Сохранено');
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    async function markTaken() {
        if (!id) {
            return;
        }
        try {
            const updated = await patchRepairRequestTake(id, true);
            setRequest(updated);
            showSuccess('Отмечено');
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    if (loading) {
        return (
            <main className="page page--wide page--centered">
                <h2>Заявка</h2>
                <p>Загрузка…</p>
            </main>
        );
    }

    if (!request) {
        return (
            <main className="page page--wide page--centered">
                <h2>Заявка</h2>
                <p>Не найдена.</p>
                <button type="button" className="btn-ghost" onClick={() => navigate('/requests')}>
                    К списку заявок
                </button>
            </main>
        );
    }

    const synced = isRepairRequestSynced(request);
    const apiSt = apiStatusFromUi(request.status);
    const canAct = apiSt !== 'closed';

    return (
        <main className="page page--wide page--centered">
            <div className="admin-page-head admin-page-head--edges">
                <button type="button" className="admin-back-link" onClick={() => navigate('/requests')}>
                    ← К заявкам
                </button>
                <h2 className="page-title">Заявка на ремонт</h2>
            </div>

            <section className="card card-form card--narrow-device">
                <div className="device-title-row">
                    <p>
                        <strong>Статус:</strong> {request.status}
                        {synced ? (
                            <span className="badge ok" style={{ marginLeft: 8 }}>
                                Трекер
                            </span>
                        ) : (
                            <span className="badge danger" style={{ marginLeft: 8 }}>
                                Нет в Трекере
                            </span>
                        )}
                    </p>
                    {!synced && canAct ? (
                        <button type="button" className="btn-primary" onClick={() => void trySync()}>
                            Синхронизировать с Трекером
                        </button>
                    ) : null}
                </div>
                <div className="repair-request-detail-stack">
                    <div className="repair-detail-line">
                        <span className="repair-detail-line__label">Устройство:</span>
                        <span className="repair-detail-line__value">
                            {device ? (
                                <Link to={`/devices/${device.id}`}>
                                    {device.inventoryNumber} — {device.name}
                                </Link>
                            ) : (
                                request.deviceId
                            )}
                        </span>
                    </div>
                    <div className="repair-detail-line">
                        <span className="repair-detail-line__label">Заявитель:</span>
                        <span className="repair-detail-line__value">{request.requesterName || '—'}</span>
                    </div>
                    <div className="repair-detail-line">
                        <span className="repair-detail-line__label">Создана:</span>
                        <span className="repair-detail-line__value">{new Date(request.createdAt).toLocaleString('ru-RU')}</span>
                    </div>
                    {request.ticketUrl ? (
                        <div className="repair-detail-line">
                            <span className="repair-detail-line__label">Тикет:</span>
                            <span className="repair-detail-line__value">
                                <a href={request.ticketUrl} target="_blank" rel="noreferrer">
                                    {request.ticketKey ?? request.ticketUrl}
                                </a>
                            </span>
                        </div>
                    ) : null}
                    <div className="repair-detail-description">
                        <span className="repair-detail-line__label">Описание:</span>
                        <p className="request-description-block">{request.description}</p>
                    </div>
                    {request.resolutionNote ? (
                        <div className="repair-detail-line">
                            <span className="repair-detail-line__label">Итог:</span>
                            <span className="repair-detail-line__value">{request.resolutionNote}</span>
                        </div>
                    ) : null}
                </div>
            </section>

            {canAct ? (
                <section className="card card-form card--narrow-device request-actions-panel">
                    <h3>Действия</h3>
                    <div className="actions-row request-actions">
                        {apiSt === 'open' ? (
                            <button type="button" className="btn-primary" onClick={() => void setStatus('in_progress')}>
                                Взять в работу (in_progress)
                            </button>
                        ) : null}
                        <button type="button" className="btn-primary" onClick={() => void markTaken()}>
                            Забрал сисадмин
                        </button>
                        <div className="request-close-row">
                            <label>
                                Примечание при закрытии
                                <input value={closeNote} onChange={(e) => setCloseNote(e.target.value)} placeholder="Необязательно" />
                            </label>
                            <button type="button" className="btn-danger" onClick={() => void setStatus('closed')}>
                                Закрыть заявку
                            </button>
                        </div>
                    </div>
                </section>
            ) : null}
        </main>
    );
}
