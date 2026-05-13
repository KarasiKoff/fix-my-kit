import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RepairRequestForm } from '../components/RepairRequestForm';
import { useAppData } from '../context/AppDataContext';

export function NewRepairRequest() {
    const [searchParams] = useSearchParams();
    const preselectedDeviceId = searchParams.get('deviceId') ?? undefined;
    const { devices, createRepairRequest } = useAppData();
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
        <main className="page page--wide">
            <h2>Новая заявка на ремонт</h2>
            <section className="card card-form card--narrow-device">
                <div className="repair-filters-row">
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
        </main>
    );
}
