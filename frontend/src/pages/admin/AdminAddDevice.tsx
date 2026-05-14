import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAppData } from '../../context/AppDataContext';
import { createDevice } from '../../api/devices';
import { fetchCategories, type CategoryDto } from '../../api/categories';
import { fetchAudiences, type AudienceDto } from '../../api/audiences';
import { fetchUsers, type UserListItem } from '../../api/users';
import { Device } from '../../types/device';
import { deviceRepairStatusLabel } from '../../utils/statusDisplay';
import { formatApiError } from '../../utils/formatApiError';

export function AdminAddDevice() {
    const { showSuccess, showError } = useToast();
    const { refresh } = useAppData();

    const [categories, setCategories] = useState<CategoryDto[]>([]);
    const [audiences, setAudiences] = useState<AudienceDto[]>([]);
    const [usersList, setUsersList] = useState<UserListItem[]>([]);
    const [loadError, setLoadError] = useState<string | null>(null);

    const [inventoryNumber, setInventoryNumber] = useState('');
    const [name, setName] = useState('');
    const [categoryId, setCategoryId] = useState('');
    const [serialNumber, setSerialNumber] = useState('');
    const [audienceId, setAudienceId] = useState<string>('');
    const [responsibleId, setResponsibleId] = useState('');
    const [status, setStatus] = useState<Device['status']>('not_in_repair');

    useEffect(() => {
        let cancelled = false;
        void Promise.all([fetchCategories(), fetchAudiences(), fetchUsers({ limit: 100 })])
            .then(([cats, auds, usersRes]) => {
                if (cancelled) {
                    return;
                }
                setCategories(cats);
                setAudiences(auds);
                setUsersList(usersRes.items);
                setLoadError(null);
                if (cats[0]) {
                    setCategoryId((prev) => prev || cats[0].id);
                }
                if (auds[0]) {
                    setAudienceId((prev) => prev || String(auds[0].id));
                }
            })
            .catch((err) => {
                if (!cancelled) {
                    setLoadError(formatApiError(err));
                }
            });
        return () => {
            cancelled = true;
        };
    }, []);

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!inventoryNumber.trim() || !name.trim()) {
            return;
        }
        try {
            await createDevice({
                inventory_number: inventoryNumber.trim(),
                name: name.trim(),
                serial_number: serialNumber.trim() || null,
                category_id: categoryId || null,
                audience_id: audienceId ? Number(audienceId) : null,
                responsible_id: responsibleId || null,
                repair_status: status,
            });
            showSuccess('Устройство добавлено');
            setInventoryNumber('');
            setName('');
            setSerialNumber('');
            setStatus('not_in_repair');
            await refresh();
        } catch (err) {
            showError(formatApiError(err));
        }
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
                {loadError ? <p className="error-text">{loadError}</p> : null}
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
                        <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)}>
                            <option value="">—</option>
                            {categories.map((c) => (
                                <option key={c.id} value={c.id}>
                                    {c.name}
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
                        <select value={audienceId} onChange={(e) => setAudienceId(e.target.value)}>
                            <option value="">—</option>
                            {audiences.map((a) => (
                                <option key={a.id} value={String(a.id)}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-device-field">
                        <span className="admin-inline-label">Ответственный</span>
                        <select value={responsibleId} onChange={(e) => setResponsibleId(e.target.value)}>
                            <option value="">—</option>
                            {usersList.map((u) => (
                                <option key={u.id} value={u.id}>
                                    {u.name === u.login ? u.login : `${u.name} (${u.login})`}
                                </option>
                            ))}
                        </select>
                    </label>
                    <label className="admin-device-field">
                        <span className="admin-inline-label">Статус</span>
                        <select value={status} onChange={(e) => setStatus(e.target.value as Device['status'])}>
                            <option value="not_in_repair">{deviceRepairStatusLabel('not_in_repair')}</option>
                            <option value="in_repair">{deviceRepairStatusLabel('in_repair')}</option>
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
