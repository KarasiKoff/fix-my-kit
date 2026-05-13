import React from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

export function AdminEditDevice() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { categories, cabinets, getDeviceById, updateDevice, removeDevice } = useAppData();
    const isAdminAuthorized = localStorage.getItem('admin_session') === '1';
    const device = id ? getDeviceById(id) : undefined;

    const [draft, setDraft] = React.useState({
        inventoryNumber: '',
        name: '',
        category: '',
        serialNumber: '',
        room: '',
        responsible: '',
        status: 'not_in_repair' as 'not_in_repair' | 'in_repair',
    });

    React.useEffect(() => {
        if (!device) {
            return;
        }
        setDraft({
            inventoryNumber: device.inventoryNumber,
            name: device.name,
            category: device.category,
            serialNumber: device.serialNumber,
            room: device.room,
            responsible: device.responsible,
            status: device.status,
        });
    }, [device]);

    if (!isAdminAuthorized) {
        return <Navigate to="/admin" replace />;
    }

    if (!device) {
        return (
            <>
                <h2 className="admin-section-title">Устройство не найдено</h2>
                <p>
                    <Link to="/admin/devices">Вернуться к списку устройств</Link>
                </p>
            </>
        );
    }

    return (
        <>
            <h2 className="admin-section-title">Изменение устройства</h2>
            <section className="card">
                <form
                    className="request-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!draft.inventoryNumber.trim() || !draft.name.trim()) {
                            return;
                        }
                        updateDevice(device.id, {
                            inventoryNumber: draft.inventoryNumber.trim(),
                            name: draft.name.trim(),
                            category: draft.category,
                            serialNumber: draft.serialNumber.trim(),
                            room: draft.room,
                            responsible: draft.responsible.trim(),
                            status: draft.status,
                        });
                        navigate('/admin/devices');
                    }}
                >
                    <label>
                        Инвентарный номер
                        <input
                            value={draft.inventoryNumber}
                            onChange={(event) => setDraft((prev) => ({ ...prev, inventoryNumber: event.target.value }))}
                        />
                    </label>
                    <label>
                        Название
                        <input value={draft.name} onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))} />
                    </label>
                    <label>
                        Категория
                        <select
                            value={draft.category}
                            onChange={(event) => setDraft((prev) => ({ ...prev, category: event.target.value }))}
                        >
                            {categories.map((category) => (
                                <option key={category} value={category}>
                                    {category}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Серийный номер
                        <input
                            value={draft.serialNumber}
                            onChange={(event) => setDraft((prev) => ({ ...prev, serialNumber: event.target.value }))}
                        />
                    </label>
                    <label>
                        Кабинет
                        <select value={draft.room} onChange={(event) => setDraft((prev) => ({ ...prev, room: event.target.value }))}>
                            {cabinets.map((cabinet) => (
                                <option key={cabinet} value={cabinet}>
                                    {cabinet}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Ответственный
                        <input
                            value={draft.responsible}
                            onChange={(event) => setDraft((prev) => ({ ...prev, responsible: event.target.value }))}
                        />
                    </label>
                    <label>
                        Статус
                        <select
                            value={draft.status}
                            onChange={(event) =>
                                setDraft((prev) => ({ ...prev, status: event.target.value as typeof prev.status }))
                            }
                        >
                            <option value="not_in_repair">not_in_repair</option>
                            <option value="in_repair">in_repair</option>
                        </select>
                    </label>
                    <button type="submit">Сохранить</button>
                </form>
            </section>
            <section className="card">
                <p className="text-danger" style={{ marginBottom: 12 }}>
                    Удаление необратимо (в демо без бэкенда заявки на устройство останутся в списке).
                </p>
                <button
                    type="button"
                    className="btn-action-danger"
                    style={{ width: '100%' }}
                    onClick={() => {
                        if (window.confirm('Удалить устройство из каталога?')) {
                            removeDevice(device.id);
                            navigate('/admin/devices');
                        }
                    }}
                >
                    Удалить устройство
                </button>
            </section>
            <section className="card">
                <div className="actions-row">
                    <Link to="/admin/devices">Назад к списку устройств</Link>
                    <Link to="/devices">Список оборудования</Link>
                </div>
            </section>
        </>
    );
}
