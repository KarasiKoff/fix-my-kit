import React, { useMemo, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { RepairRequestForm } from '../components/RepairRequestForm';
import { useAppData } from '../context/AppDataContext';

export function NewRepairRequest() {
    const [searchParams] = useSearchParams();
    const preselectedDeviceId = searchParams.get('deviceId') ?? undefined;
    const { devices, createRepairRequest } = useAppData();
    const [selectedAudience, setSelectedAudience] = useState('');
    const [selectedCategory, setSelectedCategory] = useState('');

    const audiences = useMemo(() => Array.from(new Set(devices.map((device) => device.audienceName))).sort(), [devices]);
    const categories = useMemo(
        () => Array.from(new Set(devices.map((device) => device.category))).sort(),
        [devices],
    );

    const filteredDevices = useMemo(
        () =>
            devices.filter((device) => {
                const audienceMatches = selectedAudience === '' || device.audienceName === selectedAudience;
                const categoryMatches = selectedCategory === '' || device.category === selectedCategory;
                return audienceMatches && categoryMatches;
            }),
        [devices, selectedAudience, selectedCategory],
    );

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
                <div className="grid grid-3">
                    <label>
                        Аудитория
                        <select value={selectedAudience} onChange={(event) => setSelectedAudience(event.target.value)}>
                            <option value="">Все аудитории</option>
                            {audiences.map((audience) => (
                                <option key={audience} value={audience}>
                                    {audience}
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
