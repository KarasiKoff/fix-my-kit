import React, { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';
import {
    createCategory,
    deleteCategory,
    deleteCategoryIcon,
    fetchCategories,
    updateCategory,
    uploadCategoryIcon,
    type CategoryDto,
} from '../../api/categories';
import { formatApiError } from '../../utils/formatApiError';

export function AdminAddCategory() {
    const { showSuccess, showError } = useToast();
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

    const [rows, setRows] = useState<CategoryDto[]>([]);
    const [newName, setNewName] = useState('');
    const newIconInputRef = useRef<HTMLInputElement>(null);
    const [loading, setLoading] = useState(true);

    const [editingId, setEditingId] = useState<string | null>(null);
    const [editName, setEditName] = useState('');
    const rowIconInputRefs = useRef<Record<string, HTMLInputElement | null>>({});

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
        if (!isAdmin) return;
        const n = newName.trim();
        if (!n) return;
        const file = newIconInputRef.current?.files?.[0] ?? null;
        try {
            const created = await createCategory(n);
            if (file) {
                await uploadCategoryIcon(created.id, file);
            }
            setNewName('');
            if (newIconInputRef.current) newIconInputRef.current.value = '';
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
        if (!isAdmin || !editingId) return;
        const n = editName.trim();
        if (!n) return;
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
        if (!isAdmin) return;
        if (!window.confirm(`Удалить категорию «${row.name}»? У связанных устройств поле категории будет сброшено.`)) {
            return;
        }
        try {
            await deleteCategory(row.id);
            if (editingId === row.id) setEditingId(null);
            showSuccess('Категория удалена');
            await reload();
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    async function onPickRowIcon(categoryId: string, fileList: FileList | null) {
        if (!isAdmin || !fileList?.[0]) return;
        try {
            await uploadCategoryIcon(categoryId, fileList[0]);
            const input = rowIconInputRefs.current[categoryId];
            if (input) input.value = '';
            showSuccess('Иконка обновлена');
            await reload();
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    async function onRemoveIcon(categoryId: string) {
        if (!isAdmin) return;
        if (!window.confirm('Удалить иконку категории?')) return;
        try {
            await deleteCategoryIcon(categoryId);
            showSuccess('Иконка удалена');
            await reload();
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    const sortedRows = [...rows].sort((a, b) => a.name.localeCompare(b.name, 'ru'));

    return (
        <main className="page page--centered">
            <div className="admin-page-head admin-page-head--edges">
                <Link to="/admin" className="admin-back-link">
                    ← К админке
                </Link>
                <h2 className="page-title">Категории</h2>
            </div>

            <section className="card admin-crud-sheet">
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
                    <div className="admin-inline-field admin-category-icon-field">
                        <span className="admin-inline-label">Иконка</span>
                        <input ref={newIconInputRef} type="file" accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg" disabled={!isAdmin} />
                        <span className="muted-text" style={{ fontSize: '0.75rem' }}>
                            PNG, JPEG, WebP или SVG, до 1 МБ
                        </span>
                    </div>
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
                                <th className="table-col-start">Название</th>
                                <th className="table-col-center">Активна</th>
                                <th className="table-col-center table-col--narrow">Действия</th>
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
                                        <td className="table-col-start admin-table-cell--input">
                                            {editingId === row.id ? (
                                                <input value={editName} onChange={(e) => setEditName(e.target.value)} disabled={!isAdmin} />
                                            ) : (
                                                row.name
                                            )}
                                        </td>
                                        <td className="table-col-center">{row.is_active ? 'да' : 'нет'}</td>
                                        <td className="admin-row-actions table-col-center">
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
                                                    {isAdmin ? (
                                                        <div className="admin-category-row-icon-actions" style={{ justifyContent: 'center' }}>
                                                            <label className="muted-text" style={{ fontSize: '0.72rem', cursor: 'pointer' }}>
                                                                Иконка
                                                                <input
                                                                    type="file"
                                                                    accept="image/png,image/jpeg,image/webp,image/svg+xml,.svg"
                                                                    className="admin-category-row-file"
                                                                    ref={(el) => {
                                                                        rowIconInputRefs.current[row.id] = el;
                                                                    }}
                                                                    onChange={(e) => void onPickRowIcon(row.id, e.target.files)}
                                                                    style={{ display: 'block', marginTop: 4, maxWidth: 140 }}
                                                                />
                                                            </label>
                                                            {row.has_icon ? (
                                                                <button type="button" className="btn-ghost btn-compact" onClick={() => void onRemoveIcon(row.id)}>
                                                                    Убрать иконку
                                                                </button>
                                                            ) : null}
                                                        </div>
                                                    ) : null}
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
