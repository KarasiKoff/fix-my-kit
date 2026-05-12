import React from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { User } from '../types/user';

type StaffRole = Extract<User['role'], 'admin' | 'sysadmin'>;

export function UsersManagement() {
    const { users, categories, cabinets, createUser, updateUser, removeUser, addCategory, addCabinet } = useAppData();
    const [isAdminAuthorized, setIsAdminAuthorized] = React.useState<boolean>(() => localStorage.getItem('admin_session') === '1');
    const [credentials, setCredentials] = React.useState({ login: 'admin', password: 'admin' });
    const [authError, setAuthError] = React.useState('');
    const [query, setQuery] = React.useState('');
    const [roleFilter, setRoleFilter] = React.useState<'all' | User['role']>('all');
    const [newCategory, setNewCategory] = React.useState('');
    const [newCabinet, setNewCabinet] = React.useState('');
    const [draft, setDraft] = React.useState({
        login: '',
        fullName: '',
        email: '',
        role: 'sysadmin' as StaffRole,
    });

    const filteredUsers = users.filter((user) => {
        const normalizedQuery = query.trim().toLowerCase();
        const matchesRole = roleFilter === 'all' || user.role === roleFilter;
        const matchesQuery =
            normalizedQuery === '' ||
            user.login.toLowerCase().includes(normalizedQuery) ||
            user.fullName.toLowerCase().includes(normalizedQuery) ||
            user.email.toLowerCase().includes(normalizedQuery);
        return matchesRole && matchesQuery;
    });

    const canSubmit = draft.login.trim() && draft.fullName.trim() && draft.email.trim();

    const onSubmit: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if (!canSubmit) {
            return;
        }
        createUser({
            login: draft.login.trim(),
            fullName: draft.fullName.trim(),
            email: draft.email.trim(),
            role: draft.role,
            isActive: true,
        });
        setDraft({ login: '', fullName: '', email: '', role: 'sysadmin' });
    };

    const onAdminLogin: React.FormEventHandler<HTMLFormElement> = (event) => {
        event.preventDefault();
        if (credentials.login === 'admin' && credentials.password === 'admin') {
            localStorage.setItem('admin_session', '1');
            setIsAdminAuthorized(true);
            setAuthError('');
            return;
        }
        setAuthError('Неверный логин или пароль');
    };

    if (!isAdminAuthorized) {
        return (
            <main className="page">
                <h2>Админ-панель</h2>
                <section className="card">
                    <p>Введите логин и пароль администратора для входа.</p>
                    <form className="request-form" onSubmit={onAdminLogin}>
                        <label>
                            Логин
                            <input
                                value={credentials.login}
                                onChange={(event) => setCredentials((prev) => ({ ...prev, login: event.target.value }))}
                            />
                        </label>
                        <label>
                            Пароль
                            <input
                                type="password"
                                value={credentials.password}
                                onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
                            />
                        </label>
                        {authError ? <p className="text-danger">{authError}</p> : null}
                        <button type="submit">Войти в админ-панель</button>
                    </form>
                </section>
            </main>
        );
    }

    return (
        <main className="page page-admin">
            <h2 className="page-title-admin">Админ-панель</h2>

            <section className="card admin-toolbar-card">
                <div className="admin-toolbar">
                    <div className="admin-toolbar-main">
                        <strong className="admin-toolbar-title">Админ-панель</strong>
                        <span className="admin-toolbar-url">
                            <span className="admin-toolbar-url-label">раздел</span>{' '}
                            <code className="admin-code">/admin</code>
                        </span>
                        <nav className="admin-toolbar-actions" aria-label="Быстрые ссылки">
                            <Link to="/admin/devices/new" className="admin-link-btn">
                                Добавить устройство
                            </Link>
                            <Link to="/devices" className="admin-link-btn">
                                Интерфейс сайта
                            </Link>
                        </nav>
                    </div>
                    <button
                        type="button"
                        className="btn-inline btn-logout"
                        onClick={() => {
                            localStorage.removeItem('admin_session');
                            setIsAdminAuthorized(false);
                        }}
                    >
                        Выйти
                    </button>
                </div>
            </section>

            <section className="card dict-card">
                <h3 className="card-section-title">Справочники для фильтров</h3>
                <div className="dict-two-col">
                    <div className="dict-col">
                        <form
                            className="dict-inline-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                addCategory(newCategory);
                                setNewCategory('');
                            }}
                        >
                            <label className="dict-inline-label">
                                <span className="sr-only">Новая категория</span>
                                <input
                                    value={newCategory}
                                    onChange={(event) => setNewCategory(event.target.value)}
                                    placeholder="Категория, например Сервер"
                                />
                            </label>
                            <button type="submit" className="btn-compact-primary">
                                Добавить
                            </button>
                        </form>
                        <p className="dict-subheading">Категории</p>
                        <ul className="dict-chip-list">
                            {categories.map((category) => (
                                <li key={category}>{category}</li>
                            ))}
                        </ul>
                    </div>
                    <div className="dict-col">
                        <form
                            className="dict-inline-form"
                            onSubmit={(event) => {
                                event.preventDefault();
                                addCabinet(newCabinet);
                                setNewCabinet('');
                            }}
                        >
                            <label className="dict-inline-label">
                                <span className="sr-only">Новый кабинет</span>
                                <input
                                    value={newCabinet}
                                    onChange={(event) => setNewCabinet(event.target.value)}
                                    placeholder="Кабинет, например 118"
                                />
                            </label>
                            <button type="submit" className="btn-compact-primary">
                                Добавить
                            </button>
                        </form>
                        <p className="dict-subheading">Кабинеты</p>
                        <ul className="dict-chip-list">
                            {cabinets.map((cabinet) => (
                                <li key={cabinet}>{cabinet}</li>
                            ))}
                        </ul>
                    </div>
                </div>
            </section>

            <section className="card users-panel-card">
                <header className="users-panel-head">
                    <h3 className="users-panel-title">Пользователи ({filteredUsers.length})</h3>
                    <div className="users-panel-filters">
                        <input
                            className="filter-search"
                            placeholder="Поиск: логин, ФИО или email"
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
                                <th>Email</th>
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
                                    <td>{user.email}</td>
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
                        <label className="form-span-2">
                            Email
                            <input
                                type="email"
                                value={draft.email}
                                onChange={(event) => setDraft((prev) => ({ ...prev, email: event.target.value }))}
                                placeholder="ivan@example.com"
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
        </main>
    );
}
