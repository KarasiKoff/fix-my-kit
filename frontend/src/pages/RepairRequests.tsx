import React from 'react';
import { useAppData } from '../context/AppDataContext';

export function RepairRequests() {
    const { repairRequests, getDeviceById } = useAppData();

    return (
        <main className="page">
            <h2>Все заявки</h2>
            <section className="card">
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Дата</th>
                                <th>Устройство</th>
                                <th>Заявитель</th>
                                <th>Статус</th>
                                <th>Tracker</th>
                            </tr>
                        </thead>
                        <tbody>
                            {repairRequests.length === 0 ? (
                                <tr>
                                    <td colSpan={5}>Заявок пока нет.</td>
                                </tr>
                            ) : (
                                repairRequests.map((request) => (
                                    <tr key={request.id}>
                                        <td>{new Date(request.createdAt).toLocaleString('ru-RU')}</td>
                                        <td>{getDeviceById(request.deviceId)?.inventoryNumber ?? request.deviceId}</td>
                                        <td>{request.requesterName}</td>
                                        <td>{request.status}</td>
                                        <td>
                                            {request.ticketUrl ? (
                                                <a href={request.ticketUrl} target="_blank" rel="noreferrer">
                                                    {request.ticketKey}
                                                </a>
                                            ) : (
                                                'нет'
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
