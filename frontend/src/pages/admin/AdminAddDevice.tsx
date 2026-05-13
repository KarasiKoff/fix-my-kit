import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { useToast } from '../../context/ToastContext';

const CATEGORY_OPTIONS = ['Ноутбук', 'Монитор', 'Принтер', 'Проектор'] as const;
const RESPONSIBLE_OPTIONS = [
    { value: 'admin_ipetrov', label: 'Иван Петров (администратор)' },
    { value: 'sysadmin_mkozlova', label: 'Мария Козлова (сисадмин)' },
] as const;

export function AdminAddDevice() {
    const { showSuccess } = useToast();
    const { devices } = useAppData();
    const roomOptions = useMemo(() => {
        const s = [...new Set(devices.map((d) => d.room.trim()).filter(Boolean))].sort((a, b) => a.localeCompare(b, 'ru'));
        return s.length > 0 ? s : ['101', '305', '312'];
    }, [devices]);

    const [inventoryNumber, setInventoryNumber] = useState('');
    const [name, setName] = useState('');
    const [category, setCategory] = useState<string>(CATEGORY_OPTIONS[0]);
    const [serialNumber, setSerialNumber] = useState('');
    const [room, setRoom] = useState<string>(roomOptions[0] ?? '305');
    const [responsible, setResponsible] = useState<string>(RESPONSIBLE_OPTIONS[0].value);
    const [status, setStatus] = useState<'not_in_repair' | 'in_repair'>('not_in_repair');

    React.useEffect(() => {
        if (roomOptions.includes(room)) {
            return;
        }
        setRoom(roomOptions[0] ?? '305');
    }, [roomOptions, room]);

    function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!inventoryNumber.trim() || !name.trim()) {
            return;
        }
        showSuccess('Устройство добавлено');
        setInventoryNumber('');
        setName('');
        setSerialNumber('');
        setCategory(CATEGORY_OPTIONS[0]);
        setStatus('not_in_repair');
        setResponsible(RESPONSIBLE_OPTIONS[0].value);
        setRoom(roomOptions[0] ?? '305');
    }

    return (
        <main className="page page--wide">
            <div className="admin-page-head admin-page-head--edges">
                <Link to="/admin" className="admin-back-link">
                    ← К админке
                </Link>
                <h2 className="page-title">Добавить устройство</h2>
            </div>

            <section className="card card-form card--narrow-device">
                <form className="admin-device-form" onSubmit={handleSubmit}>
                    <label className="admin-device-field">
                        <span className="admin-inline-label">Инвентарный номер</span>
                        <input value={inventoryNumber} onChange={(e) => setInventoryNumber(e.target.value)} required />
                    </label>
                    <label className="admin-device-field">
                        <span className="admin-inline-label">Название</span>
                        <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Ноутбук Lenovo T14" required />
                    </label>
                    <label className="admin-device-field">
                        <span className="admin-inline-label">Категория</span>
                        <select value={category} onChange={(e) => setCategory(e.target.value)}>
                            {CATEGORY_OPTIONS.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-device-field">
                        <span className="admin-inline-label">Серийный номер</span>
                        <input value={serialNumber} onChange={(e) => setSerialNumber(e.target.value)} placeholder="LNV-T14-2391" />
                    </label>
                    <label className="admin-device-field">
                        <span className="admin-inline-label">Кабинет</span>
                        <select value={room} onChange={(e) => setRoom(e.target.value)}>
                            {roomOptions.map((opt) => (
                                <option key={opt} value={opt}>
                                    {opt}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-device-field">
                        <span className="admin-inline-label">Ответственный</span>
                        <select value={responsible} onChange={(e) => setResponsible(e.target.value)}>
                            {RESPONSIBLE_OPTIONS.map((opt) => (
                                <option key={opt.value} value={opt.value}>
                                    {opt.label}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-device-field">
                        <span className="admin-inline-label">Статус</span>
                        <select value={status} onChange={(e) => setStatus(e.target.value as typeof status)}>
                            <option value="not_in_repair">not_in_repair</option>
                            <option value="in_repair">in_repair</option>
                        </select>
                    </label>
                    <div className="admin-device-actions">
                        <button type="submit" className="btn-primary">
                            Добавить устройство
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}
