import React from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { RepairQrModal } from '../components/RepairQrModal';
import { Device } from '../types/device';
import { deviceRepairStatusLabel, deviceRepairStatusPillClass } from '../utils/statusDisplay';

export function DevicesList() {
    const { devices, isLoading, error } = useAppData();
    const [qrDevice, setQrDevice] = React.useState<Device | null>(null);
    const [filters, setFilters] = React.useState({
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

            <section className="card">
                <h3>Оборудование ({filteredDevices.length})</h3>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>Инв. номер</th>
                                <th>Название</th>
                                <th>Категория</th>
                                <th>Кабинет</th>
                                <th>Ответственный</th>
                                <th>Статус</th>
                                <th>QR заявки</th>
                                <th>Карточка</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.map((device) => (
                                <tr key={device.id}>
                                    <td>{device.inventoryNumber}</td>
                                    <td>{device.name}</td>
                                    <td>{device.category}</td>
                                    <td>{device.room}</td>
                                    <td>{device.responsible}</td>
                                    <td className="status-cell">
                                        <span className={deviceRepairStatusPillClass(device.status)}>{deviceRepairStatusLabel(device.status)}</span>
                                    </td>
                                    <td>
                                        <button type="button" className="table-qr-btn" onClick={() => setQrDevice(device)}>
                                            QR
                                        </button>
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

            <RepairQrModal open={qrDevice !== null} device={qrDevice} onClose={() => setQrDevice(null)} />
        </main>
    );
}
