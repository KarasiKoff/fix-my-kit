import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { usePersistentJson } from '../../hooks/usePersistentJson';
import { useToast } from '../../context/ToastContext';

type RoomRow = { id: string; number: string };
type RoomCatalog = {
    rows: RoomRow[];
    suppressedDevice: string[];
};

const ROOMS_STORAGE_KEY = 'fix-my-kit-rooms-catalog-v1';

const emptyCatalog = (): RoomCatalog => ({ rows: [], suppressedDevice: [] });

function stripLegacyRows(rows: unknown[]): RoomRow[] {
    return rows.map((raw) => {
        const r = raw as { id?: string; number?: string };
        return { id: r.id ?? crypto.randomUUID(), number: String(r.number ?? '') };
    });
}

export function AdminAddRoom() {
    const { showSuccess } = useToast();
    const { devices } = useAppData();
    const [catalog, setCatalog] = usePersistentJson<RoomCatalog>(ROOMS_STORAGE_KEY, emptyCatalog());
    const [newRoom, setNewRoom] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editNumber, setEditNumber] = useState('');
    const normalizedRef = useRef(false);

    useEffect(() => {
        if (normalizedRef.current) {
            return;
        }
        normalizedRef.current = true;
        setCatalog((prev) => ({
            suppressedDevice: prev.suppressedDevice ?? [],
            rows: stripLegacyRows(prev.rows as unknown[]),
        }));
    }, [setCatalog]);

    const deviceRoomSet = useMemo(() => {
        const s = new Set<string>();
        for (const d of devices) {
            const r = d.room?.trim();
            if (r) {
                s.add(r);
            }
        }
        return s;
    }, [devices]);

    useEffect(() => {
        setCatalog((prev) => {
            const rows = [...prev.rows];
            const nums = new Set(rows.map((row) => row.number));
            let changed = false;
            for (const num of deviceRoomSet) {
                if (prev.suppressedDevice.includes(num) || nums.has(num)) {
                    continue;
                }
                rows.push({ id: `dev-${encodeURIComponent(num)}`, number: num });
                nums.add(num);
                changed = true;
            }
            return changed ? { ...prev, rows } : prev;
        });
    }, [deviceRoomSet, setCatalog]);

    const sortedRows = useMemo(() => [...catalog.rows].sort((a, b) => a.number.localeCompare(b.number, 'ru')), [catalog.rows]);

    function handleAdd(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const n = newRoom.trim();
        if (!n || catalog.rows.some((row) => row.number === n)) {
            return;
        }
        setCatalog((prev) => ({
            ...prev,
            rows: [...prev.rows, { id: `manual-${crypto.randomUUID()}`, number: n }],
        }));
        setNewRoom('');
        showSuccess('Кабинет успешно добавлен');
    }

    function startEdit(row: RoomRow) {
        setEditingId(row.id);
        setEditNumber(row.number);
    }

    function saveEdit() {
        if (!editingId) {
            return;
        }
        const n = editNumber.trim();
        if (!n) {
            return;
        }
        setCatalog((prev) => ({
            ...prev,
            rows: prev.rows.map((row) => (row.id === editingId ? { ...row, number: n } : row)),
        }));
        setEditingId(null);
    }

    function removeRow(row: RoomRow) {
        setCatalog((prev) => {
            const fromDevice = row.id.startsWith('dev-');
            const suppressed = fromDevice ? [...new Set([...prev.suppressedDevice, row.number])] : prev.suppressedDevice;
            return {
                suppressedDevice: suppressed,
                rows: prev.rows.filter((r) => r.id !== row.id),
            };
        });
        if (editingId === row.id) {
            setEditingId(null);
        }
    }

    return (
        <main className="page page--wide">
            <div className="admin-page-head admin-page-head--edges">
                <Link to="/admin" className="admin-back-link">
                    ← К админке
                </Link>
                <h2 className="page-title">Кабинеты</h2>
            </div>

            <section className="card card--stretch">
                <form className="admin-inline-form admin-inline-form--room" onSubmit={handleAdd}>
                    <label className="admin-inline-field admin-inline-field--grow">
                        <span className="admin-inline-label">Номер кабинета</span>
                        <input value={newRoom} onChange={(e) => setNewRoom(e.target.value)} placeholder="Например: 305" />
                    </label>
                    <div className="admin-inline-actions">
                        <button type="submit" className="btn-primary">
                            Добавить
                        </button>
                    </div>
                </form>

                <div className="table-wrap admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Номер</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {sortedRows.length === 0 ? (
                                <tr className="admin-table-placeholder-row">
                                    <td colSpan={2} />
                                </tr>
                            ) : (
                                sortedRows.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            {editingId === row.id ? (
                                                <input value={editNumber} onChange={(e) => setEditNumber(e.target.value)} />
                                            ) : (
                                                row.number
                                            )}
                                        </td>
                                        <td className="admin-row-actions">
                                            {editingId === row.id ? (
                                                <>
                                                    <button type="button" className="btn-ghost btn-compact" onClick={saveEdit}>
                                                        Сохранить
                                                    </button>
                                                    <button type="button" className="btn-ghost btn-compact" onClick={() => setEditingId(null)}>
                                                        Отмена
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" className="btn-ghost btn-compact" onClick={() => startEdit(row)}>
                                                        Изменить
                                                    </button>
                                                    <button type="button" className="btn-danger btn-compact" onClick={() => removeRow(row)}>
                                                        Удалить
                                                    </button>
                                                </>
                                            )}
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </section>
        </main>
    );
}
