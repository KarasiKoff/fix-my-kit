import React from 'react';
import { Link, useParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

export function DeviceDetail() {
    const { id } = useParams();
    const { getDeviceById, repairHistory, setDeviceStatus } = useAppData();
    const device = id ? getDeviceById(id) : undefined;

    if (!device) {
        return (
            <main className="page">
                <h2>Карточка устройства</h2>
                <p>Устройство не найдено.</p>
                <Link to="/devices">Вернуться к списку</Link>
            </main>
        );
    }

    const deviceHistory = repairHistory.filter((item) => item.deviceId === device.id);

    return (
        <main className="page">
            <h2>Карточка устройства</h2>
            <section className="card">
                <div className="device-title-row">
                    <h3>{device.name}</h3>
                    <span className={`badge ${device.status === 'in_repair' ? 'danger' : 'ok'}`}>{device.status}</span>
                </div>
                <div className="grid grid-2">
                    <p><strong>Инвентарный номер:</strong> {device.inventoryNumber}</p>
                    <p><strong>Категория:</strong> {device.category}</p>
                    <p><strong>Серийный номер:</strong> {device.serialNumber}</p>
                    <p><strong>Кабинет:</strong> {device.room}</p>
                    <p><strong>Ответственный:</strong> {device.responsible}</p>
                    <p><strong>Забрал сисадмин:</strong> {device.takenBySysadmin ? 'Да' : 'Нет'}</p>
                </div>
                <div className="actions-row">
                    <button type="button" onClick={() => void setDeviceStatus(device.id, 'in_repair', 'Статус изменен вручную.')}>
                        Перевести в in_repair
                    </button>
                    <button type="button" onClick={() => void setDeviceStatus(device.id, 'not_in_repair', 'Ремонт завершен.')}>
                        Перевести в not_in_repair
                    </button>
                    <Link to={`/repair?deviceId=${device.id}`}>Создать заявку</Link>
                </div>
            </section>

            <section className="card">
                <h3>История ремонтов</h3>
                {deviceHistory.length === 0 ? (
                    <p>Записей пока нет.</p>
                ) : (
                    <ul className="history-list">
                        {deviceHistory.map((entry) => (
                            <li key={entry.id}>
                                <strong>{new Date(entry.createdAt).toLocaleString('ru-RU')}</strong> - {entry.oldStatus ?? 'n/a'} → {entry.newStatus}
                                {entry.note ? ` (${entry.note})` : ''}
                            </li>
                        ))}
                    </ul>
                )}
            </section>
        </main>
    );
}
