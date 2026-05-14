import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { isRepairRequestSynced, syncAllUnsynchronizedRepairRequests, syncRepairRequestTracker } from '../api/repairRequests';
import { repairRequestStatusLabel, repairRequestStatusPillClass } from '../utils/statusDisplay';
import { formatApiError } from '../utils/formatApiError';
import { yandexTrackerIssueWebHref } from '../utils/yandexTracker';

export function RepairRequests() {
    const navigate = useNavigate();
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

    function goToRequest(id: string) {
        navigate(`/requests/${id}`);
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
                    <table className="requests-table">
                        <thead>
                            <tr>
                                <th className="table-col-center">Дата</th>
                                <th className="table-col-center">Устройство</th>
                                <th className="table-col-center">Заявитель</th>
                                <th className="table-col-center">Статус</th>
                                <th className="table-col-center">Трекер</th>
                                <th className="table-col-center table-col--narrow" />
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
                                        <tr
                                            key={request.id}
                                            className="requests-row-clickable"
                                            tabIndex={0}
                                            onClick={() => goToRequest(request.id)}
                                            onKeyDown={(event) => {
                                                if (event.key === 'Enter' || event.key === ' ') {
                                                    event.preventDefault();
                                                    goToRequest(request.id);
                                                }
                                            }}
                                        >
                                            <td className="table-col-center">{new Date(request.createdAt).toLocaleString('ru-RU')}</td>
                                            <td className="table-col-center">
                                                {getDeviceById(request.deviceId)?.inventoryNumber ?? request.deviceId}
                                            </td>
                                            <td className="table-col-center">{request.requesterName}</td>
                                            <td className="status-cell table-col-center">
                                                <span className={repairRequestStatusPillClass(request.status)}>
                                                    {repairRequestStatusLabel(request.status)}
                                                </span>
                                            </td>
                                            <td className="table-col-center">
                                                {synced ? (request.ticketKey ? request.ticketKey : 'да') : 'нет'}
                                            </td>
                                            <td
                                                className="table-cell-actions table-col-center requests-row-actions-cell"
                                                onClick={(event) => event.stopPropagation()}
                                                onKeyDown={(event) => event.stopPropagation()}
                                            >
                                                {trackerHref ? (
                                                    <a
                                                        href={trackerHref}
                                                        target="_blank"
                                                        rel="noreferrer"
                                                        className="btn-ghost btn-compact"
                                                        onClick={(event) => event.stopPropagation()}
                                                    >
                                                        Перейти в Tracker
                                                    </a>
                                                ) : canSync ? (
                                                    <button type="button" className="btn-ghost btn-compact" onClick={() => void handleRowSync(request.id)}>
                                                        Синхронизировать
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
