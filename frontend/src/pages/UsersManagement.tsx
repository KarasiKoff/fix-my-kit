import React from 'react';

export function UsersManagement() {
    return (
        <main className="page">
            <h2>Управление пользователями</h2>
            <section className="card">
                <p>MVP-раздел с ролями проекта:</p>
                <ul className="history-list">
                    <li>admin — управляет оборудованием и пользователями</li>
                    <li>sysadmin — берет заявки в работу и закрывает ремонт</li>
                    <li>user — создает внутренние заявки</li>
                    <li>guest — отправляет публичные заявки без авторизации</li>
                </ul>
            </section>
        </main>
    );
}
