import React, { useState } from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

export function Login() {
    const { isAuthenticated, user, signIn, signOut, isLoading } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState<string | null>(null);
    const navigate = useNavigate();

    async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        setError(null);

        try {
            await signIn(username, password);
            navigate('/devices', { replace: true });
        } catch (err) {
            setError(err instanceof Error ? err.message : 'Ошибка входа');
        }
    }

    if (isLoading) {
        return (
            <div className="login-shell">
                <main className="login-main">
                    <p className="text-muted">Загрузка...</p>
                </main>
            </div>
        );
    }

    return (
        <div className="login-shell">
            <header className="login-topbar">
                <span className="login-brand">Fix My Kit</span>
                <nav className="login-topbar-nav" aria-label="Навигация">
                    <NavLink to="/devices" className="login-nav-pill">
                        Главная
                    </NavLink>
                    <span className="login-nav-current" aria-current="page">
                        Вход
                    </span>
                </nav>
            </header>

            <main className="login-main">
                <div className="login-stack">
                    <section className="login-card login-card-intro">
                        <h1 className="login-card-title">Учёт оборудования</h1>
                        <p className="login-card-lead">
                            Каталог устройств, QR-коды и заявки на ремонт. Войдите ниже — после входа откроются нужные
                            разделы в соответствии с вашей ролью в организации.
                        </p>
                    </section>

                    <section className="login-card login-card-form">
                        <h2 className="login-form-heading">Вход в систему</h2>
                        <p className="login-form-hint">
                            Учётные записи по умолчанию и пароли см. в README проекта (при пустой БД могут создаваться
                            автоматически).
                        </p>

                        {isAuthenticated && user ? (
                            <div className="login-logged">
                                <p className="login-logged-text">
                                    Вы вошли как <strong>{user.name}</strong>
                                </p>
                                <button type="button" className="login-btn login-btn-secondary" onClick={signOut}>
                                    Выйти
                                </button>
                                <NavLink to="/devices" className="login-btn login-btn-primary">
                                    Перейти к каталогу
                                </NavLink>
                            </div>
                        ) : (
                            <form className="login-form" onSubmit={handleSubmit}>
                                {error ? <p className="text-danger">{error}</p> : null}
                                <label className="login-field">
                                    <span className="login-label">Логин</span>
                                    <input
                                        className="login-input"
                                        name="username"
                                        autoComplete="username"
                                        value={username}
                                        onChange={(event) => setUsername(event.target.value)}
                                    />
                                </label>
                                <label className="login-field">
                                    <span className="login-label">Пароль</span>
                                    <input
                                        className="login-input"
                                        name="password"
                                        type="password"
                                        autoComplete="current-password"
                                        value={password}
                                        onChange={(event) => setPassword(event.target.value)}
                                    />
                                </label>
                                <button type="submit" className="login-btn login-btn-primary">
                                    Войти
                                </button>
                            </form>
                        )}
                    </section>
                </div>
            </main>
        </div>
    );
}
