import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAppData } from '../../context/AppDataContext';
import { createDevice, fetchDevices } from '../../api/devices';
import { fetchCategories, type CategoryDto } from '../../api/categories';
import { fetchAudiences, type AudienceDto } from '../../api/audiences';
import { fetchUsers, type UserListItem } from '../../api/users';
import { Device } from '../../types/device';
import { deviceRepairStatusLabel } from '../../utils/statusDisplay';
import { formatApiError } from '../../utils/formatApiError';

const BULK_COUNT_MIN = 1;
const BULK_COUNT_MAX = 50;

async function nextBulkDeviceIndex(roomName: string): Promise<number> {
    const prefix = `${roomName}-`;
    let max = 0;
    let offset = 0;
    const limit = 50;

    while (true) {
        const { items, total } = await fetchDevices({ room: roomName, limit, offset });
        for (const device of items) {
            for (const value of [device.name, device.inventoryNumber]) {
                if (!value.startsWith(prefix)) {
                    continue;
                }
                const n = Number.parseInt(value.slice(prefix.length), 10);
                if (!Number.isNaN(n) && n > max) {
                    max = n;
                }
            }
        }
        offset += items.length;
        if (offset >= total || items.length === 0) {
            break;
        }
    }

    return max + 1;
}

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
    const [bulkMode, setBulkMode] = useState(false);
    const [bulkCount, setBulkCount] = useState(16);

    const selectedAudience = audiences.find((a) => String(a.id) === audienceId);

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

    function clampBulkCount(value: number) {
        return Math.min(BULK_COUNT_MAX, Math.max(BULK_COUNT_MIN, value));
    }

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();

        const sharedPayload = {
            serial_number: serialNumber.trim() || null,
            category_id: categoryId || null,
            audience_id: audienceId ? Number(audienceId) : null,
            responsible_id: responsibleId || null,
            repair_status: status,
        };

        try {
            if (bulkMode) {
                const roomName = selectedAudience?.name?.trim();
                if (!roomName) {
                    showError('Выберите кабинет для массового добавления');
                    return;
                }

                const startIndex = await nextBulkDeviceIndex(roomName);
                let created = 0;

                for (let i = 0; i < bulkCount; i += 1) {
                    const label = `${roomName}-${startIndex + i}`;
                    await createDevice({
                        inventory_number: label,
                        name: label,
                        ...sharedPayload,
                    });
                    created += 1;
                }

                showSuccess(
                    created === 1
                        ? 'Устройство добавлено'
                        : `Добавлено устройств: ${created} (${roomName}-${startIndex} … ${roomName}-${startIndex + created - 1})`,
                );
            } else {
                if (!inventoryNumber.trim() || !name.trim()) {
                    return;
                }
                await createDevice({
                    inventory_number: inventoryNumber.trim(),
                    name: name.trim(),
                    ...sharedPayload,
                });
                showSuccess('Устройство добавлено');
                setInventoryNumber('');
                setName('');
                setSerialNumber('');
                setStatus('not_in_repair');
            }

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
                    {!bulkMode ? (
                        <>
                            <label className="admin-device-field">
                                <span className="admin-inline-label">Инвентарный номер</span>
                                <input
                                    value={inventoryNumber}
                                    onChange={(e) => setInventoryNumber(e.target.value)}
                                    required
                                />
                            </label>
                            <label className="admin-device-field">
                                <span className="admin-inline-label">Название</span>
                                <input
                                    value={name}
                                    onChange={(e) => setName(e.target.value)}
                                    placeholder="Ноутбук Lenovo T14"
                                    required
                                />
                            </label>
                        </>
                    ) : null}
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
                        <select
                            value={audienceId}
                            onChange={(e) => setAudienceId(e.target.value)}
                            required={bulkMode}
                        >
                            <option value="">—</option>
                            {audiences.map((a) => (
                                <option key={a.id} value={String(a.id)}>
                                    {a.name}
                                </option>
                            ))}
                        </select>
                    </label>

                    <div className="admin-device-bulk-block">
                        <label className="checkbox-field admin-device-bulk-toggle">
                            <input
                                type="checkbox"
                                checked={bulkMode}
                                onChange={(e) => setBulkMode(e.target.checked)}
                            />
                            <span>Несколько ПК в этом кабинете</span>
                        </label>

                        {bulkMode ? (
                            <div className="admin-device-field admin-device-bulk-quantity">
                                <span className="admin-inline-label">Количество</span>
                                <input
                                    type="range"
                                    className="admin-bulk-range"
                                    min={BULK_COUNT_MIN}
                                    max={BULK_COUNT_MAX}
                                    value={bulkCount}
                                    onChange={(e) => setBulkCount(clampBulkCount(Number(e.target.value)))}
                                />
                                <div className="admin-bulk-count-row">
                                    <input
                                        type="number"
                                        min={BULK_COUNT_MIN}
                                        max={BULK_COUNT_MAX}
                                        value={bulkCount}
                                        onChange={(e) =>
                                            setBulkCount(clampBulkCount(Number(e.target.value) || BULK_COUNT_MIN))
                                        }
                                    />
                                    <span className="muted-text">шт.</span>
                                </div>
                                <p className="form-hint muted-text">
                                    {selectedAudience
                                        ? `Имена: ${selectedAudience.name}-1, ${selectedAudience.name}-2, …`
                                        : 'Сначала выберите кабинет выше'}
                                </p>
                            </div>
                        ) : null}
                    </div>

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
                        <button type="submit" className="btn-primary" disabled={bulkMode && !selectedAudience}>
                            {bulkMode ? `Добавить ${bulkCount} устройств` : 'Добавить устройство'}
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}
