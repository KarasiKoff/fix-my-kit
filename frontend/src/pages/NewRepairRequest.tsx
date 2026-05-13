import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RepairRequestForm } from '../components/RepairRequestForm';
import { useAppData } from '../context/AppDataContext';

export function NewRepairRequest() {
    const [searchParams] = useSearchParams();
    const preselectedDeviceId = searchParams.get('deviceId') ?? undefined;
    const { devices, createRepairRequest, repairRequests, getDeviceById } = useAppData();
    const [selectedRoom, setSelectedRoom] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const rooms = useMemo(() => Array.from(new Set(devices.map((device) => device.room))).sort(), [devices]);
    const categories = useMemo(
        () => Array.from(new Set(devices.map((device) => device.category))).sort(),
        [devices],
    );

    const filteredDevices = useMemo(
        () =>
            devices.filter((device) => {
                const roomMatches = selectedRoom === '' || device.room === selectedRoom;
                const categoryMatches = selectedCategory === '' || device.category === selectedCategory;
                return roomMatches && categoryMatches;
            }),
        [devices, selectedRoom, selectedCategory],
    );

    function handleSubmit(data: { deviceId: string; name: string; description: string }) {
        void createRepairRequest({
            deviceId: data.deviceId,
            requesterName: data.name,
            description: data.description,
        });
    }

    return (
        <main className="page page-repair">
            <div className="repair-page-inner">
                <h2>Новая заявка на ремонт</h2>
                <section className="card">
                    <div className="grid grid-2">
                        <label>
                            Кабинет
                            <select value={selectedRoom} onChange={(event) => setSelectedRoom(event.target.value)}>
                                <option value="">Все кабинеты</option>
                                {rooms.map((room) => (
                                    <option key={room} value={room}>
                                        {room}
                                    </option>
                                ))}
                            </select>
                        </label>
                        <label>
                            Тип устройства
                            <select value={selectedCategory} onChange={(event) => setSelectedCategory(event.target.value)}>
                                <option value="">Все категории</option>
                                {categories.map((category) => (
                                    <option key={category} value={category}>
                                        {category}
                                    </option>
                                ))}
                            </select>
                        </label>
                    </div>
                    <RepairRequestForm devices={filteredDevices} initialDeviceId={preselectedDeviceId} onSubmit={handleSubmit} />
                </section>
                <section className="card">
                    <h3>Созданные заявки</h3>
                    <div className="table-wrap">
                        <table>
                            <thead>
                                <tr>
                                    <th>Дата</th>
                                    <th>Устройство</th>
                                    <th>Категория</th>
                                    <th>Кабинет</th>
                                    <th>Заявитель</th>
                                    <th>Статус</th>
                                    <th>Tracker</th>
                                </tr>
                            </thead>
                            <tbody>
                                {repairRequests.map((request) => {
                                    const dev = getDeviceById(request.deviceId);
                                    return (
                                        <tr key={request.id}>
                                            <td>{new Date(request.createdAt).toLocaleString('ru-RU')}</td>
                                            <td>{dev?.inventoryNumber ?? request.deviceId}</td>
                                            <td>{dev?.category ?? '—'}</td>
                                            <td>{dev?.room ?? '—'}</td>
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
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </section>
            </div>
        </main>
    );
}
