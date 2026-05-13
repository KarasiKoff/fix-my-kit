import React from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

export function DevicesList() {
    const { devices, categories, cabinets, users, isLoading, error } = useAppData();
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
                    <select
                        value={filters.category}
                        onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                    >
                        <option value="">Любая категория</option>
                        {categories.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.room}
                        onChange={(event) => setFilters((prev) => ({ ...prev, room: event.target.value }))}
                    >
                        <option value="">Любой кабинет</option>
                        {cabinets.map((cabinet) => (
                            <option key={cabinet} value={cabinet}>
                                {cabinet}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.responsible}
                        onChange={(event) => setFilters((prev) => ({ ...prev, responsible: event.target.value }))}
                    >
                        <option value="">Любой ответственный</option>
                        {users.map((user) => (
                            <option key={user.id} value={user.name}>
                                {user.name}
                            </option>
                        ))}
                    </select>
                    <select
                        value={filters.status}
                        onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                    >
                        <option value="">Любой статус</option>
                        <option value="not_in_repair">not_in_repair</option>
                        <option value="in_repair">in_repair</option>
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
                                    <td>{device.status}</td>
                                    <td>
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
