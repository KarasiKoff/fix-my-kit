import React, { useContext, useState } from 'react';
import { AuthContext } from '../context/AuthContext';

export function Login() {
    const { user, signIn, signOut } = useContext(AuthContext);
    const [username, setUsername] = useState('admin');
    const [password, setPassword] = useState('password');

    return (
        <main className="page">
            <h2>Вход</h2>
            <section className="card">
                {user ? (
                    <>
                        <p>Вы вошли как: {user.name}</p>
                        <button type="button" onClick={signOut}>Выйти</button>
                    </>
                ) : (
                    <form
                        className="request-form"
                        onSubmit={(event) => {
                            event.preventDefault();
                            signIn(username, password);
                        }}
                    >
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
