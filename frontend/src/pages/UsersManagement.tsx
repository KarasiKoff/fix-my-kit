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
                    <li>guest — гостевая роль без внутренних прав управления</li>
                </ul>
            </section>
        </main>
    );
}
