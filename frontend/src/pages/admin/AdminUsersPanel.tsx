import React, { useMemo, useState } from 'react';
import { usePersistentJson } from '../../hooks/usePersistentJson';
import { useToast } from '../../context/ToastContext';

export type LocalAdminUser = {
    id: string;
    login: string;
    fullName: string;
    role: 'admin' | 'sysadmin';
    status: 'active' | 'disabled';
    createdAt: string;
};

const STORAGE_KEY = 'fix-my-kit-admin-users-v1';

function nowIso() {
    return new Date().toISOString();
}

export function AdminUsersPanel() {
    const { showSuccess } = useToast();
    const [users, setUsers] = usePersistentJson<LocalAdminUser[]>(STORAGE_KEY, []);
    const [login, setLogin] = useState('');
    const [_password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [role, setRole] = useState<'admin' | 'sysadmin'>('admin');
    const [search, setSearch] = useState('');
    const [editingId, setEditingId] = useState<string | null>(null);
    const [editDraft, setEditDraft] = useState({ login: '', fullName: '', role: 'admin' as 'admin' | 'sysadmin' });

    const filtered = useMemo(() => {
        const q = search.trim().toLowerCase();
        if (!q) {
            return users;
        }
        return users.filter((u) => u.login.toLowerCase().includes(q) || u.fullName.toLowerCase().includes(q));
    }, [users, search]);

    function handleCreate(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (!login.trim()) {
            return;
        }
        setUsers((prev) => [
            ...prev,
            {
                id: crypto.randomUUID(),
                login: login.trim(),
                fullName: fullName.trim(),
                role,
                status: 'active',
                createdAt: nowIso(),
            },
        ]);
        setLogin('');
        setPassword('');
        setFullName('');
        setRole('admin');
        showSuccess('Пользователь добавлен');
    }

    function startEdit(user: LocalAdminUser) {
        setEditingId(user.id);
        setEditDraft({ login: user.login, fullName: user.fullName, role: user.role });
    }

    function saveEdit() {
        if (!editingId) {
            return;
        }
        setUsers((prev) =>
            prev.map((u) =>
                u.id === editingId
                    ? { ...u, login: editDraft.login.trim() || u.login, fullName: editDraft.fullName.trim(), role: editDraft.role }
                    : u,
            ),
        );
        setEditingId(null);
    }

    function cancelEdit() {
        setEditingId(null);
    }

    function removeUser(id: string) {
        setUsers((prev) => prev.filter((u) => u.id !== id));
        if (editingId === id) {
            setEditingId(null);
        }
    }

    function toggleDisabled(id: string) {
        setUsers((prev) =>
            prev.map((u) => (u.id === id ? { ...u, status: u.status === 'active' ? 'disabled' : 'active' } : u)),
        );
    }

    const activeCount = filtered.filter((u) => u.status === 'active').length;

    return (
        <>
            <section className="card card--admin-block">
                <div className="admin-block-head">
                    <h3 className="admin-block-title">Пользователи</h3>
                    <div className="admin-stats-row">
                        <div className="admin-stat-pill">
                            <span className="admin-stat-value">{filtered.length}</span>
                            <span className="admin-stat-label">по запросу</span>
                        </div>
                        <div className="admin-stat-pill">
                            <span className="admin-stat-value">{users.length}</span>
                            <span className="admin-stat-label">всего в каталоге</span>
                        </div>
                        <div className="admin-stat-pill">
                            <span className="admin-stat-value">{activeCount}</span>
                            <span className="admin-stat-label">активных (в списке)</span>
                        </div>
                    </div>
                </div>

                <form className="admin-inline-form" onSubmit={handleCreate}>
                    <label className="admin-inline-field">
                        <span className="admin-inline-label">Логин</span>
                        <input value={login} onChange={(e) => setLogin(e.target.value)} required />
                    </label>
                    <label className="admin-inline-field">
                        <span className="admin-inline-label">Пароль</span>
                        <input type="password" value={_password} onChange={(e) => setPassword(e.target.value)} autoComplete="new-password" />
                    </label>
                    <label className="admin-inline-field">
                        <span className="admin-inline-label">ФИО</span>
                        <input value={fullName} onChange={(e) => setFullName(e.target.value)} placeholder="Имя" />
                    </label>
                    <label className="admin-inline-field admin-inline-field--narrow">
                        <span className="admin-inline-label">Роль</span>
                        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)}>
                            <option value="admin">Администратор</option>
                            <option value="sysadmin">Сисадмин</option>
                        </select>
                    </label>
                    <div className="admin-inline-actions">
                        <button type="submit" className="btn-primary">
                            Создать
                        </button>
                    </div>
                </form>

                <div className="admin-table-toolbar">
                    <label className="admin-search-field">
                        <span className="admin-inline-label">Поиск</span>
                        <input
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            placeholder="Логин или ФИО..."
                        />
                    </label>
                </div>

                <div className="table-wrap admin-table-wrap">
                    <table className="admin-table">
                        <thead>
                            <tr>
                                <th>Логин</th>
                                <th>ФИО</th>
                                <th>Роль</th>
                                <th>Статус</th>
                                <th>Создан</th>
                                <th />
                            </tr>
                        </thead>
                        <tbody>
                            {filtered.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="admin-table-empty">
                                        Нет записей
                                    </td>
                                </tr>
                            ) : (
                                filtered.map((user) => (
                                    <tr key={user.id} className={user.status === 'disabled' ? 'row-disabled' : undefined}>
                                        <td>
                                            {editingId === user.id ? (
                                                <input value={editDraft.login} onChange={(e) => setEditDraft((d) => ({ ...d, login: e.target.value }))} />
                                            ) : (
                                                user.login
                                            )}
                                        </td>
                                        <td>
                                            {editingId === user.id ? (
                                                <input value={editDraft.fullName} onChange={(e) => setEditDraft((d) => ({ ...d, fullName: e.target.value }))} />
                                            ) : (
                                                user.fullName || '—'
                                            )}
                                        </td>
                                        <td>
                                            {editingId === user.id ? (
                                                <select value={editDraft.role} onChange={(e) => setEditDraft((d) => ({ ...d, role: e.target.value as typeof d.role }))}>
                                                    <option value="admin">Администратор</option>
                                                    <option value="sysadmin">Сисадмин</option>
                                                </select>
                                            ) : user.role === 'admin' ? (
                                                'Администратор'
                                            ) : (
                                                'Сисадмин'
                                            )}
                                        </td>
                                        <td>
                                            <span className={`status-badge ${user.status === 'disabled' ? 'status-badge--off' : 'status-badge--on'}`}>
                                                {user.status === 'disabled' ? 'отключён' : 'активен'}
                                            </span>
                                        </td>
                                        <td>{new Date(user.createdAt).toLocaleString('ru-RU')}</td>
                                        <td className="admin-row-actions">
                                            {editingId === user.id ? (
                                                <>
                                                    <button type="button" className="btn-ghost btn-compact" onClick={saveEdit}>
                                                        Сохранить
                                                    </button>
                                                    <button type="button" className="btn-ghost btn-compact" onClick={cancelEdit}>
                                                        Отмена
                                                    </button>
                                                </>
                                            ) : (
                                                <>
                                                    <button type="button" className="btn-ghost btn-compact" onClick={() => startEdit(user)}>
                                                        Изменить
                                                    </button>
                                                    <button type="button" className="btn-ghost btn-compact" onClick={() => toggleDisabled(user.id)}>
                                                        {user.status === 'disabled' ? 'Включить' : 'Отключить'}
                                                    </button>
                                                    <button type="button" className="btn-danger btn-compact" onClick={() => removeUser(user.id)}>
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
        </>
    );
}
