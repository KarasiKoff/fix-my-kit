import React from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';

export function AdminAddDevice() {
    const { categories, cabinets, addDevice } = useAppData();
    const isAdminAuthorized = localStorage.getItem('admin_session') === '1';
    const [draft, setDraft] = React.useState({
        inventoryNumber: '',
        name: '',
        category: categories[0] ?? '',
        serialNumber: '',
        room: cabinets[0] ?? '',
    });

    if (!isAdminAuthorized) {
        return <Navigate to="/admin" replace />;
    }

    return (
        <main className="page">
            <h2>Добавление устройства</h2>
            <section className="card">
                <form
                    className="request-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        if (!draft.inventoryNumber.trim() || !draft.name.trim()) {
                            return;
                        }
                        addDevice({
                            inventoryNumber: draft.inventoryNumber.trim(),
                            name: draft.name.trim(),
                            category: draft.category,
                            serialNumber: draft.serialNumber.trim(),
                            room: draft.room,
                            responsible: '',
                            status: 'not_in_repair',
                        });
                        setDraft((prev) => ({ ...prev, inventoryNumber: '', name: '', serialNumber: '' }));
                    }}
                >
                    <label>
                        Инвентарный номер
                        <input
                            value={draft.inventoryNumber}
                            onChange={(event) => setDraft((prev) => ({ ...prev, inventoryNumber: event.target.value }))}
                            placeholder="INV-1200"
                        />
                    </label>
                    <label>
                        Название устройства
                        <input
                            value={draft.name}
                            onChange={(event) => setDraft((prev) => ({ ...prev, name: event.target.value }))}
                            placeholder="Рабочая станция Dell"
                        />
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
                            placeholder="SN-0001"
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
                    <button type="submit">Добавить устройство</button>
                </form>
            </section>
            <section className="card">
                <div className="actions-row">
                    <Link to="/admin">Вернуться в админ-панель</Link>
                    <Link to="/devices">Открыть список оборудования</Link>
                </div>
            </section>
        </main>
    );
}
