import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { ApiError } from '../api/client';
import { isRepairRequestSynced, syncAllUnsynchronizedRepairRequests, syncRepairRequestTracker } from '../api/repairRequests';
import { repairRequestStatusLabel, repairRequestStatusPillClass } from '../utils/statusDisplay';
import { yandexTrackerIssueWebHref } from '../utils/yandexTracker';

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

export function RepairRequests() {
    const { repairRequests, getDeviceById, refresh } = useAppData();
    const { showSuccess, showError } = useToast();
    const [bulkLoading, setBulkLoading] = useState(false);

    async function handleBulkSync() {
        setBulkLoading(true);
        try {
            const res = await syncAllUnsynchronizedRepairRequests();
            showSuccess(`Готово: синхронизировано ${res.synced} из ${res.attempted}, ошибок: ${res.failed}`);
            await refresh();
        } catch (err) {
            showError(formatApiError(err));
        } finally {
            setBulkLoading(false);
        }
    }

    async function handleRowSync(id: string) {
        try {
            await syncRepairRequestTracker(id);
            showSuccess('Синхронизировано');
            await refresh();
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    return (
        <main className="page page--wide">
            <h2>Все заявки</h2>
            <section className="card">
                <div className="requests-toolbar">
                    <button type="button" className="btn-primary" disabled={bulkLoading} onClick={() => void handleBulkSync()}>
                        {bulkLoading ? 'Синхронизация…' : 'Синхронизировать все несинхронизированные'}
                    </button>
                </div>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Устройство</th>
                                <th>Заявитель</th>
                                <th>Статус</th>
                                <th>Трекер</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {repairRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={6}>Заявок пока нет.</td>
                                </tr>
                            ) : (
                                repairRequests.map((request) => {
                                    const synced = isRepairRequestSynced(request);
                                    const canSync = !synced && request.status !== 'closed';
                                    const trackerHref = yandexTrackerIssueWebHref(request.ticketKey, request.ticketUrl);
                                    return (
                                        <tr key={request.id}>
                                            <td>{new Date(request.createdAt).toLocaleString('ru-RU')}</td>
                                            <td>
                                                <Link to={`/requests/${request.id}`}>
                                                    {getDeviceById(request.deviceId)?.inventoryNumber ?? request.deviceId}
                                                </Link>
                                            </td>
                                            <td>{request.requesterName}</td>
                                            <td className="status-cell">
                                                <span className={repairRequestStatusPillClass(request.status)}>
                                                    {repairRequestStatusLabel(request.status)}
                                                </span>
                                            </td>
                                            <td>
                                                {synced ? (
                                                    trackerHref ? (
                                                        <a href={trackerHref} target="_blank" rel="noreferrer">
                                                            {request.ticketKey ?? 'открыть'}
                                                        </a>
                                                    ) : (
                                                        'да'
                                                    )
                                                ) : (
                                                    'нет'
                                                )}
                                            </td>
                                            <td>
                                                {canSync ? (
                                                    <button type="button" className="btn-ghost btn-compact" onClick={() => void handleRowSync(request.id)}>
                                                        В трекер
                                                    </button>
                                                ) : null}
                                            </td>
                                        </tr>
                                    );
                                })
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
