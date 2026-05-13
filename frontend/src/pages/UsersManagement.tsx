import React from 'react';
import { useAppData } from '../context/AppDataContext';
import { User } from '../types/user';

type StaffRole = Extract<User['role'], 'admin' | 'sysadmin'>;

export function UsersManagement() {
    const { users, createUser, updateUser, removeUser } = useAppData();
    const [query, setQuery] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<'all' | User['role']>('all');
    const [draft, setDraft] = React.useState({
        login: '',
        fullName: '',
        role: 'sysadmin' as StaffRole,
    });

    const filteredUsers = users.filter((user) => {
        const normalizedQuery = query.trim().toLowerCase();
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesQuery =
            normalizedQuery === '' ||
            user.login.toLowerCase().includes(normalizedQuery) ||
            user.fullName.toLowerCase().includes(normalizedQuery);
        return matchesRole && matchesQuery;
    });

    const canSubmit = draft.login.trim() && draft.fullName.trim();

    const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if (!canSubmit) {
            return;
        }
        createUser({
            login: draft.login.trim(),
            fullName: draft.fullName.trim(),
            role: draft.role,
            isActive: true,
        });
        setDraft({ login: '', fullName: '', role: 'sysadmin' });
    };

    return (
        <>
            <h2 className="admin-section-title">Пользователи</h2>

            <section className="card users-panel-card">
                <header className="users-panel-head">
                    <h3 className="users-panel-title">Пользователи ({filteredUsers.length})</h3>
                    <div className="users-panel-filters">
                        <input
                            className="filter-search"
                            placeholder="Поиск: логин или ФИО"
                            value={query}
                            onChange={(event) => setQuery(event.target.value)}
                            aria-label="Поиск пользователей"
                        />
                        <select
                            className="filter-role"
                            value={roleFilter}
                            onChange={(event) => setRoleFilter(event.target.value as 'all' | User['role'])}
                            aria-label="Фильтр по роли"
                        >
                            <option value="all">Все роли</option>
                            <option value="admin">admin</option>
                            <option value="sysadmin">sysadmin</option>
                        </select>
                    </div>
                </header>
                <div className="table-wrap users-table-wrap">
                    <table className="table-users">
                        <thead>
                            <tr>
                                <th>Логин</th>
                                <th>ФИО</th>
                                <th>Роль</th>
                                <th>Статус</th>
                                <th className="th-actions">Действия</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredUsers.map((user) => (
                                <tr key={user.id}>
                                    <td>{user.login}</td>
                                    <td>{user.fullName}</td>
                                    <td>
                                        <span className={`role-pill role-${user.role}`}>{user.role}</span>
                                    </td>
                                    <td>{user.isActive ? 'Активен' : 'Выключен'}</td>
                                    <td className="td-actions">
                                        <div className="action-toolbar">
                                            <button
                                                type="button"
                                                className="btn-action"
                                                onClick={() => updateUser(user.id, { isActive: !user.isActive })}
                                            >
                                                {user.isActive ? 'Отключить' : 'Включить'}
                                            </button>
                                            <select
                                                className="role-select-compact"
                                                value={user.role === 'guest' ? 'guest' : user.role}
                                                onChange={(event) => {
                                                    const next = event.target.value as User['role'];
                                                    updateUser(user.id, { role: next });
                                                }}
                                                aria-label={`Роль пользователя ${user.login}`}
                                            >
                                                {user.role === 'guest' ? <option value="guest">guest</option> : null}
                                                <option value="admin">admin</option>
                                                <option value="sysadmin">sysadmin</option>
                                            </select>
                                            <button type="button" className="btn-action btn-action-danger" onClick={() => removeUser(user.id)}>
                                                Удалить
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <section className="card form-card-wide">
                <h3 className="card-heading-compact">Новый пользователь</h3>
                <form className="request-form form-add-user" onSubmit={onSubmit}>
                    <div className="form-grid-2 form-grid-fluid">
                        <label>
                            Логин
                            <input
                                value={draft.login}
                                onChange={(event) => setDraft((prev) => ({ ...prev, login: event.target.value }))}
                                placeholder="new.user"
                            />
                        </label>
                        <label>
                            ФИО
                            <input
                                value={draft.fullName}
                                onChange={(event) => setDraft((prev) => ({ ...prev, fullName: event.target.value }))}
                                placeholder="Иван Иванов"
                            />
                        </label>
                        <label className="form-field-role">
                            Роль
                            <select
                                value={draft.role}
                                onChange={(event) => setDraft((prev) => ({ ...prev, role: event.target.value as StaffRole }))}
                            >
                                <option value="sysadmin">Системный администратор</option>
                                <option value="admin">Администратор</option>
                            </select>
                        </label>
                        <div className="form-actions">
                            <button type="submit" className="btn-primary-inline" disabled={!canSubmit}>
                                Создать
                            </button>
                        </div>
                    </div>
                </form>
            </section>
        </>
    );
}
