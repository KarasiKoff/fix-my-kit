import React from 'react';
import { useSearchParams } from 'react-router-dom';
import { RepairRequestForm } from '../components/RepairRequestForm';
import { useAppData } from '../context/AppDataContext';

export function NewRepairRequest() {
    const [searchParams] = useSearchParams();
    const preselectedDeviceId = searchParams.get('deviceId') ?? undefined;
    const { devices, repairRequests, getDeviceById, createRepairRequest } = useAppData();

    function handleSubmit(data: { deviceId: string; name: string; description: string }) {
        void createRepairRequest({
            deviceId: data.deviceId,
            requesterName: data.name,
            description: data.description,
        });
    }

    return (
        <main className="page">
            <h2>Новая заявка на ремонт</h2>
            <section className="card">
                <RepairRequestForm devices={devices} initialDeviceId={preselectedDeviceId} onSubmit={handleSubmit} />
            </section>
            <section className="card">
                <h3>Созданные заявки</h3>
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
                            {repairRequests.map((request) => (
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
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
