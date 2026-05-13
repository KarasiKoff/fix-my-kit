import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import { ApiError } from '../../api/client';
import { createCategory, deleteCategory, fetchCategories, updateCategory, type CategoryDto } from '../../api/categories';

function formatApiError(err: unknown): string {
    if (err instanceof ApiError) {
        if (typeof err.detail === 'string') {
            return err.detail;
        }
        return JSON.stringify(err.detail);
    }
    if (err instanceof Error) {
        return err.message;
    }
    return 'Ошибка запроса';
}

export function AdminAddCategory() {
    const { showSuccess, showError } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [rows, setRows] = useState<CategoryDto[]>([]);
    const [newName, setNewName] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const [loading, setLoading] = useState(true);

    async function reload() {
        setLoading(true);
        try {
            const items = await fetchCategories();
            setRows(items);
        } catch (err) {
            showError(formatApiError(err));
        } finally {
            setLoading(false);
        }
    }

    useEffect(() => {
        void reload();
    }, []);

    async function handleAdd(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!isAdmin) {
            return;
        }
        const n = newName.trim();
        if (!n) {
            return;
        }
        try {
            await createCategory(n);
            setNewName('');
            showSuccess('Категория добавлена');
            await reload();
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    function startEdit(row: CategoryDto) {
        setEditingId(row.id);
        setEditName(row.name);
    }

    async function saveEdit() {
        if (!isAdmin || !editingId) {
            return;
        }
        const n = editName.trim();
        if (!n) {
            return;
        }
        try {
            await updateCategory(editingId, { name: n });
            setEditingId(null);
            showSuccess('Сохранено');
            await reload();
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    async function removeRow(row: CategoryDto) {
        if (!isAdmin) {
            return;
        }
        if (!window.confirm(`Удалить категорию «${row.name}»? У связанных устройств поле категории будет сброшено.`)) {
            return;
        }
        try {
            await deleteCategory(row.id);
            if (editingId === row.id) {
                setEditingId(null);
            }
            showSuccess('Категория удалена');
            await reload();
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    const sortedRows = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'ru'));

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
                        <input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            placeholder="Например: Ноутбуки"
                            required
                            disabled={!isAdmin}
                        />
                    </label>
                    <div className="admin-inline-actions">
                        <button type="submit" className="btn-primary" disabled={!isAdmin}>
                            Добавить
                        </button>
                    </div>
                </form>

                <div className="table-wrap admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Название</th>
                                <th>Активна</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr className="admin-table-placeholder-row">
                                    <td colSpan={3}>Загрузка…</td>
                                </tr>
                            ) : sortedRows.length === 0 ? (
                                <tr className="admin-table-placeholder-row">
                                    <td colSpan={3} />
                                </tr>
                            ) : (
                                sortedRows.map((row) => (
                                    <tr key={row.id}>
                                        <td>
                                            {editingId === row.id ? (
                                                <input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={!isAdmin} />
                                            ) : (
                                                row.name
                                            )}
                                        </td>
                                        <td>{row.is_active ? 'да' : 'нет'}</td>
                                        <td className="admin-row-actions">
                                            {editingId === row.id ? (
                                                <>
                                                    <button type="button" className="btn-ghost btn-compact" disabled={!isAdmin} onClick={() => void saveEdit()}>
                                                        Сохранить
                                                    </button>
                                                    <button type="button" className="btn-ghost btn-compact" onClick={() => setEditingId(null)}>
                                                        Отмена
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" className="btn-ghost btn-compact" disabled={!isAdmin} onClick={() => startEdit(row)}>
                                                        Изменить
                                                    </button>
                                                    <button type="button" className="btn-danger btn-compact" disabled={!isAdmin} onClick={() => void removeRow(row)}>
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
