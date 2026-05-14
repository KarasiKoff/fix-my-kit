import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { QrSheetSettingsModal } from '../components/QrSheetSettingsModal';
import { deviceRepairStatusLabel, deviceRepairStatusPillClass } from '../utils/statusDisplay';

export function DevicesList() {
    const { devices, isLoading, error } = useAppData();
    const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
    const [sheetModalOpen, setSheetModalOpen] = useState(false);
    const [filters, setFilters] = useState({
        inventoryNumber: '',
        category: '',
        room: '',
        responsible: '',
        status: '',
    });

    const filteredDevices = devices.filter((device) => {
        const byInventory = device.inventoryNumber.toLowerCase().includes(filters.inventoryNumber.toLowerCase());
        const byCategory = device.category.toLowerCase().includes(filters.category.toLowerCase());
        const byRoom = device.room.toLowerCase().includes(filters.room.toLowerCase());
        const byResponsible = device.responsible.toLowerCase().includes(filters.responsible.toLowerCase());
        const byStatus = filters.status === '' || device.status === filters.status;
        return byInventory && byCategory && byRoom && byResponsible && byStatus;
    });

    const selectedDevicesList = useMemo(
        () => filteredDevices.filter((d) => selectedDevices.has(d.id)),
        [filteredDevices, selectedDevices],
    );

    const handleSelectAll = () => {
        if (selectedDevices.size === filteredDevices.length) {
            setSelectedDevices(new Set());
        } else {
            setSelectedDevices(new Set(filteredDevices.map((d) => d.id)));
        }
    };

    const handleSelectDevice = (id: string) => {
        const newSelected = new Set(selectedDevices);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedDevices(newSelected);
    };

    return (
        <main className="page">
            <h2>Список устройств</h2>
            {isLoading && <p>Загрузка...</p>}
            {error && <p className="error-text">{error}</p>}
            <section className="card">
                <h3>Поиск и фильтрация</h3>
                <div className="grid grid-5">
                    <input
                        placeholder="Инвентарный номер"
                        value={filters.inventoryNumber}
                        onChange={(event) => setFilters((prev) => ({ ...prev, inventoryNumber: event.target.value }))}
                    />
                    <input
                        placeholder="Категория"
                        value={filters.category}
                        onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                    />
                    <input
                        placeholder="Кабинет"
                        value={filters.room}
                        onChange={(event) => setFilters((prev) => ({ ...prev, room: event.target.value }))}
                    />
                    <input
                        placeholder="Ответственный"
                        value={filters.responsible}
                        onChange={(event) => setFilters((prev) => ({ ...prev, responsible: event.target.value }))}
                    />
                    <select
                        value={filters.status}
                        onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                    >
                        <option value="">Любой статус</option>
                        <option value="not_in_repair">{deviceRepairStatusLabel('not_in_repair')}</option>
                        <option value="in_repair">{deviceRepairStatusLabel('in_repair')}</option>
                    </select>
                </div>
            </section>

            {selectedDevices.size > 0 && (
                <section className="card">
                    <h3>Действия с выбранными ({selectedDevices.size})</h3>
                    <div className="actions-row">
                        <button type="button" onClick={() => setSheetModalOpen(true)}>
                            Настройка и предпросмотр
                        </button>
                    </div>
                </section>
            )}

            <section className="card">
                <h3>Оборудование ({filteredDevices.length})</h3>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Инв. номер</th>
                                <th>Название</th>
                                <th>Категория</th>
                                <th>Кабинет</th>
                                <th>Ответственный</th>
                                <th>Статус</th>
                                <th>Карточка</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.map((device) => (
                                <tr key={device.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedDevices.has(device.id)}
                                            onChange={() => handleSelectDevice(device.id)}
                                        />
                                    </td>
                                    <td>{device.inventoryNumber}</td>
                                    <td>{device.name}</td>
                                    <td>{device.category}</td>
                                    <td>{device.room}</td>
                                    <td>{device.responsible}</td>
                                    <td className="status-cell">
                                        <span className={deviceRepairStatusPillClass(device.status)}>{deviceRepairStatusLabel(device.status)}</span>
                                    </td>
                                    <td>
                                        <Link to={`/devices/${device.id}`}>Открыть</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <QrSheetSettingsModal
                open={sheetModalOpen}
                onClose={() => setSheetModalOpen(false)}
                devices={selectedDevicesList}
            />
        </main>
    );
}
