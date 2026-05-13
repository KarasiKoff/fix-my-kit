import React from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';

export function AdminDevicesManagement() {
    const { devices, removeDevice } = useAppData();

    return (
        <>
            <h2 className="admin-section-title">Устройства в каталоге</h2>
            <section className="card">
                <div className="table-wrap">
                    <table className="table-devices-admin">
                        <thead>
                            <tr>
                                <th>Инв. номер</th>
                                <th>Название</th>
                                <th>Категория</th>
                                <th>Кабинет</th>
                                <th className="th-actions">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {devices.map((device) => (
                                <tr key={device.id}>
                                    <td>{device.inventoryNumber}</td>
                                    <td>{device.name}</td>
                                    <td>{device.category}</td>
                                    <td>{device.room}</td>
                                    <td className="td-actions">
                                        <div className="action-toolbar">
                                            <Link to={`/admin/devices/${device.id}/edit`} className="admin-link-btn btn-action-link">
                                                Изменить
                                            </Link>
                                            <button
                                                type="button"
                                                className="btn-action btn-action-danger"
                                                onClick={() => {
                                                    if (window.confirm(`Удалить «${device.name}» из каталога?`)) {
                                                        removeDevice(device.id);
                                                    }
                                                }}
                                            >
                                                Удалить
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>
        </>
    );
}
