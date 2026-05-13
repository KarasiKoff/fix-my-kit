import React from 'react';
import { NavLink } from 'react-router-dom';

const items = [
    { to: '/admin/users', title: 'Пользователь' },
    { to: '/admin/add/category', title: 'Категории' },
    { to: '/admin/add/room', title: 'Кабинет' },
    { to: '/admin/add/device', title: 'Устройство' },
] as const;

export function AdminHub() {
    return (
        <main className="page page--wide page--admin-dashboard">
            <div className="page-intro page-intro--wide">
                <h2 className="page-title">Администрирование</h2>
            </div>

            <section className="card card--hub card--stretch">
                <h3 className="card-heading">Разделы</h3>
                <div className="admin-hub-grid admin-hub-grid--row">
                    {items.map((item) => (
                        <NavLink key={item.to} to={item.to} className="admin-hub-card">
                            <span className="admin-hub-card-title">{item.title}</span>
                            <span className="admin-hub-card-action">Открыть →</span>
                        </NavLink>
                    ))}
                </div>
            </section>
        </main>
    );
}
