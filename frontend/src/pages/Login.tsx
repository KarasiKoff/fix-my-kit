import React, { useContext, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';

export function Login() {
    const { isAuthenticated, signIn } = useContext(AuthContext);
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

    return (
        <main className="page">
            <h2>Вход</h2>
            <section className="card">
                {isAuthenticated ? (
                    <p>Вы уже вошли в систему.</p>
                ) : (
                    <form className="request-form" onSubmit={handleSubmit}>
                        {error ? <p className="error-text">{error}</p> : null}
                        <label>
                            Логин
                            <input value={username} onChange={(event) => setUsername(event.target.value)} />
                        </label>
                        <label>
                            Пароль
                            <input type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
                        </label>
                        <button type="submit">Войти</button>
                    </form>
                )}
            </section>
        </main>
    );
}
