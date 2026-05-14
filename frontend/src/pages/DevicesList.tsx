import React from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { deviceRepairStatusLabel, deviceRepairStatusPillClass } from '../utils/statusDisplay';

export function DevicesList() {
    const { devices, isLoading, error } = useAppData();
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
                                <th className="table-col-center">Инв. номер</th>
                                <th className="table-col-center">Название</th>
                                <th className="table-col-center">Категория</th>
                                <th className="table-col-center">Кабинет</th>
                                <th className="table-col-center">Ответственный</th>
                                <th className="table-col-center">Статус</th>
                                <th className="table-col-center">Карточка</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.map((device) => (
                                <tr key={device.id}>
                                    <td className="table-col-center">{device.inventoryNumber}</td>
                                    <td className="table-col-center">{device.name}</td>
                                    <td className="table-col-center">{device.category}</td>
                                    <td className="table-col-center">{device.room}</td>
                                    <td className="table-col-center">{device.responsible}</td>
                                    <td className="status-cell table-col-center">
                                        <span className={deviceRepairStatusPillClass(device.status)}>{deviceRepairStatusLabel(device.status)}</span>
                                    </td>
                                    <td className="table-col-center">
                                        <Link to={`/devices/${device.id}`}>Открыть</Link>
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
