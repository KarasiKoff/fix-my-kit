import React from 'react';
import { Link, NavLink, Outlet, useNavigate } from 'react-router-dom';

export function AdminLayout() {
    const navigate = useNavigate();
    const [isAdminAuthorized, setIsAdminAuthorized] = React.useState<boolean>(() => localStorage.getItem('admin_session') === '1');
    const [credentials, setCredentials] = React.useState({ login: 'admin', password: 'admin' });
    const [authError, setAuthError] = React.useState('');

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
            <main className="page page-admin-auth">
                <div className="admin-auth-inner">
                    <h2 className="admin-auth-title">Админ-панель</h2>
                    <section className="card admin-auth-card">
                        <p className="admin-auth-lead">Введите логин и пароль администратора для входа.</p>
                        <form className="request-form admin-auth-form" onSubmit={onAdminLogin}>
                            <label>
                                Логин
                                <input
                                    value={credentials.login}
                                    onChange={(event) => setCredentials((prev) => ({ ...prev, login: event.target.value }))}
                                    autoComplete="username"
                                />
                            </label>
                            <label>
                                Пароль
                                <input
                                    type="password"
                                    value={credentials.password}
                                    onChange={(event) => setCredentials((prev) => ({ ...prev, password: event.target.value }))}
                                    autoComplete="current-password"
                                />
                            </label>
                            {authError ? <p className="text-danger admin-auth-error">{authError}</p> : null}
                            <button type="submit" className="admin-auth-submit">
                                Войти
                            </button>
                        </form>
                    </section>
                </div>
            </main>
        );
    }

    return (
        <main className="page page-admin">
            <div className="admin-page-header">
                <h2 className="page-title-admin">Админка</h2>

                <section className="card admin-toolbar-card">
                    <div className="admin-toolbar admin-toolbar--compact">
                        <nav className="admin-toolbar-actions" aria-label="Действия администратора">
                            <Link to="/admin/devices/new" className="admin-link-btn">
                                Добавить устройство
                            </Link>
                            <Link to="/devices" className="admin-link-btn">
                                На сайт
                            </Link>
                            <button
                                type="button"
                                className="btn-inline btn-logout"
                                onClick={() => {
                                    localStorage.removeItem('admin_session');
                                    setIsAdminAuthorized(false);
                                    navigate('/admin');
                                }}
                            >
                                Выйти
                            </button>
                        </nav>
                    </div>
                </section>
            </div>

            <nav className="admin-subnav" aria-label="Разделы админки">
                <NavLink to="/admin/devices" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                    Устройства
                </NavLink>
                <NavLink to="/admin/categories" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                    Категории
                </NavLink>
                <NavLink to="/admin/cabinets" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                    Кабинеты
                </NavLink>
                <NavLink to="/admin/users" className={({ isActive }) => (isActive ? 'active' : undefined)}>
                    Пользователи
                </NavLink>
            </nav>

            <Outlet />
        </main>
    );
}
