import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../../context/AppDataContext';
import { usePersistentJson } from '../../hooks/usePersistentJson';
import { useToast } from '../../context/ToastContext';

type CategoryRow = { id: string; name: string };
type CategoryCatalog = {
    rows: CategoryRow[];
    suppressedDevice: string[];
};

const CATEGORIES_STORAGE_KEY = 'fix-my-kit-categories-catalog-v1';

const emptyCatalog = (): CategoryCatalog => ({ rows: [], suppressedDevice: [] });

function deviceCategoryId(name: string) {
    return `dev-${encodeURIComponent(name)}`;
}

function stripLegacyCategoryRows(rows: unknown[]): CategoryRow[] {
    return rows.map((raw) => {
        const r = raw as { id?: string; name?: string };
        return {
            id: r.id ?? crypto.randomUUID(),
            name: String(r.name ?? ''),
        };
    });
}

export function AdminAddCategory() {
    const { showSuccess } = useToast();
    const { devices } = useAppData();
    const [catalog, setCatalog] = usePersistentJson<CategoryCatalog>(CATEGORIES_STORAGE_KEY, emptyCatalog());
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const normalizedRef = useRef(false);

    useEffect(() => {
        if (normalizedRef.current) {
            return;
        }
        normalizedRef.current = true;
        setCatalog((prev) => ({
            suppressedDevice: prev.suppressedDevice ?? [],
            rows: stripLegacyCategoryRows(prev.rows as unknown[]),
        }));
    }, [setCatalog]);

    const deviceCategorySet = useMemo(() => {
        const s = new Set<string>();
        for (const d of devices) {
            const c = d.category?.trim();
            if (c) {
                s.add(c);
            }
        }
        return s;
    }, [devices]);

    useEffect(() => {
        setCatalog((prev) => {
            const rows = [...prev.rows];
            const names = new Set(rows.map((row) => row.name.toLowerCase()));
            let changed = false;
            for (const catName of deviceCategorySet) {
                const key = catName.toLowerCase();
                if (prev.suppressedDevice.some((x) => x.toLowerCase() === key) || names.has(key)) {
                    continue;
                }
                rows.push({
                    id: deviceCategoryId(catName),
                    name: catName,
                });
                names.add(key);
                changed = true;
            }
            return changed ? { ...prev, rows } : prev;
        });
    }, [deviceCategorySet, setCatalog]);

    const sortedRows = useMemo(() => [...catalog.rows].sort((a, b) => a.name.localeCompare(b.name, 'ru')), [catalog.rows]);

    function handleAdd(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        const n = newName.trim();
        if (!n) {
            return;
        }
        const key = n.toLowerCase();
        if (catalog.rows.some((row) => row.name.trim().toLowerCase() === key)) {
            return;
        }
        setCatalog((prev) => ({
            ...prev,
            rows: [...prev.rows, { id: `manual-${crypto.randomUUID()}`, name: n }],
        }));
        setNewName('');
        showSuccess('Категория успешно добавлена');
    }

    function startEdit(row: CategoryRow) {
        setEditingId(row.id);
        setEditName(row.name);
    }

    function saveEdit() {
        if (!editingId) {
            return;
        }
        const n = editName.trim();
        if (!n) {
            return;
        }
        const key = n.toLowerCase();
        const clash = catalog.rows.some((row) => row.id !== editingId && row.name.trim().toLowerCase() === key);
        if (clash) {
            return;
        }
        setCatalog((prev) => ({
            ...prev,
            rows: prev.rows.map((row) => (row.id === editingId ? { ...row, name: n } : row)),
        }));
        setEditingId(null);
    }

    function removeRow(row: CategoryRow) {
        setCatalog((prev) => {
            const fromDevice = row.id.startsWith('dev-');
            const suppressed = fromDevice
                ? [...new Set([...prev.suppressedDevice, row.name])]
                : prev.suppressedDevice;
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
                <h2 className="page-title">Категории</h2>
            </div>

            <section className="card card--stretch">
                <form className="admin-inline-form admin-inline-form--tight admin-category-page-form" onSubmit={handleAdd}>
                    <label className="admin-inline-field admin-inline-field--grow">
                        <span className="admin-inline-label">Название</span>
                        <input value={newName} onChange={(e) => setNewName(e.target.value)} placeholder="Например: Ноутбуки" required />
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
                                <th>Название</th>
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
                                                <input value={editName} onChange={(e) => setEditName(e.target.value)} />
                                            ) : (
                                                row.name
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
