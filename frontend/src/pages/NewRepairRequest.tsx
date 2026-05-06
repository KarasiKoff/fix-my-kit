import React from 'react';
import { RepairRequestForm } from '../components/RepairRequestForm';

export function NewRepairRequest() {
    function handleSubmit(data: { name: string; description: string }) {
        console.log('Создать заявку', data);
    }

    return (
        <main>
            <h2>Новая заявка на ремонт</h2>
            <RepairRequestForm onSubmit={handleSubmit} />
        </main>
    );
}
