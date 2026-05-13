import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { changeOwnPassword } from '../../api/auth';
import { ApiError } from '../../api/client';
import { useToast } from '../../context/ToastContext';
import { useAuth } from '../../hooks/useAuth';

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

const hubItems = [
    { to: '/admin/users', title: 'Пользователи', description: 'Список, роли, сброс пароля', adminOnly: false },
    { to: '/admin/add/category', title: 'Категории', description: 'Справочник типов оборудования', adminOnly: true },
    { to: '/admin/add/room', title: 'Кабинеты', description: 'Справочник кабинетов (audience)', adminOnly: true },
    { to: '/admin/add/device', title: 'Устройство', description: 'Добавление на склад', adminOnly: false },
] as const;

export function AdminHub() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';
    const { showSuccess, showError } = useToast();
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');

    async function handlePasswordChange(event: React.FormEvent<HTMLFormElement>) {
        event.preventDefault();
        if (newPassword.length < 8) {
            showError('Новый пароль не короче 8 символов');
            return;
        }
        try {
            await changeOwnPassword(currentPassword, newPassword);
            setCurrentPassword('');
            setNewPassword('');
            showSuccess('Пароль изменён');
        } catch (err) {
            showError(formatApiError(err));
        }
    }

    return (
        <main className="page page--wide page--admin-dashboard">
            <div className="page-intro page-intro--wide">
                <h2 className="page-title">Администрирование</h2>
            </div>

            <section className="card card--hub card--stretch">
                <h3 className="card-heading">Разделы</h3>
                <div className="admin-hub-grid admin-hub-grid--row">
                    {hubItems.map((item) => {
                        const locked = item.adminOnly && !isAdmin;
                        if (locked) {
                            return (
                                <span key={item.to} className="admin-hub-card admin-hub-card--disabled" title="Доступно только администратору">
                                    <span className="admin-hub-card-title">{item.title}</span>
                                    <span className="admin-hub-card-desc">{item.description}</span>
                                    <span className="admin-hub-card-action">Недоступно</span>
                                </span>
                            );
                        }
                        return (
                            <NavLink key={item.to} to={item.to} className="admin-hub-card">
                                <span className="admin-hub-card-title">{item.title}</span>
                                <span className="admin-hub-card-desc">{item.description}</span>
                                <span className="admin-hub-card-action">Открыть →</span>
                            </NavLink>
                        );
                    })}
                </div>
            </section>

            <section className="card card--stretch admin-password-self">
                <h3 className="card-heading">Сменить свой пароль</h3>
                <form className="admin-inline-form admin-password-self-form" onSubmit={handlePasswordChange}>
                    <label className="admin-inline-field">
                        <span className="admin-inline-label">Текущий пароль</span>
                        <input
                            type="password"
                            value={currentPassword}
                            onChange={(e) => setCurrentPassword(e.target.value)}
                            autoComplete="current-password"
                            required
                        />
                    </label>
                    <label className="admin-inline-field">
                        <span className="admin-inline-label">Новый пароль</span>
                        <input
                            type="password"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            autoComplete="new-password"
                            required
                            minLength={8}
                        />
                    </label>
                    <div className="admin-inline-actions">
                        <button type="submit" className="btn-primary">
                            Сохранить новый пароль
                        </button>
                    </div>
                </form>
            </section>
        </main>
    );
}
