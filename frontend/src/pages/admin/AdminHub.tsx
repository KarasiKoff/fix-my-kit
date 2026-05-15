import React from 'react';
import { NavLink } from 'react-router-dom';
import { useAuth } from '../../hooks/useAuth';

const hubItems = [
    { to: '/admin/users', title: 'Пользователи', description: 'Список, роли, сброс пароля', adminOnly: false, titleOnly: false },
    { to: '/admin/add/category', title: 'Категории', description: 'Справочник типов оборудования', adminOnly: true, titleOnly: false },
    { to: '/admin/add/room', title: 'Кабинеты', description: 'Справочник кабинетов (audience)', adminOnly: true, titleOnly: false },
    { to: '/admin/add/device', title: 'Устройство', description: 'Добавить новое устройство', adminOnly: false, titleOnly: false },
] as const;

export function AdminHub() {
    const { user } = useAuth();
    const isAdmin = user?.role === 'admin';

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
                        const cardClass = [
                            'admin-hub-card',
                            item.titleOnly ? 'admin-hub-card--title-only' : '',
                        ]
                            .filter(Boolean)
                            .join(' ');
                        if (locked) {
                            return (
                                <span key={item.to} className={`${cardClass} admin-hub-card--disabled`} title="Доступно только администратору">
                                    <span className="admin-hub-card-title">{item.title}</span>
                                    {item.description ? <span className="admin-hub-card-desc">{item.description}</span> : null}
                                    <span className="admin-hub-card-action">Недоступно</span>
                                </span>
                            );
                        }
                        return (
                            <NavLink key={item.to} to={item.to} className={cardClass}>
                                <span className="admin-hub-card-title">{item.title}</span>
                                {item.description ? <span className="admin-hub-card-desc">{item.description}</span> : null}
                                <span className="admin-hub-card-action">Открыть →</span>
                            </NavLink>
                        );
                    })}
                </div>
            </section>
        </main>
    );
}
