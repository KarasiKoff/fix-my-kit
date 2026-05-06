import React, { useState } from 'react';

export function RepairRequestForm({ onSubmit }: { onSubmit: (data: { name: string; description: string }) => void }) {
    const [name, setName] = useState('');
    const [description, setDescription] = useState('');

    return (
        <form
            onSubmit={(event) => {
                event.preventDefault();
                onSubmit({ name, description });
            }}
        >
            <label>
                Имя
                <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label>
                Описание
                <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <button type="submit">Отправить заявку</button>
        </form>
    );
}
