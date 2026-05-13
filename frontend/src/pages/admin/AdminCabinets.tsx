import React from 'react';
import { useAppData } from '../../context/AppDataContext';

export function AdminCabinets() {
    const { cabinets, addCabinet, removeCabinet, renameCabinet } = useAppData();
    const [newCabinet, setNewCabinet] = React.useState('');
    const [editingCabinet, setEditingCabinet] = React.useState<string | null>(null);
    const [cabinetEditValue, setCabinetEditValue] = React.useState('');

    return (
        <>
            <h2 className="admin-section-title">Кабинеты</h2>
            <section className="card dict-card dict-card--single">
                <p className="dict-lead text-muted">
                    Добавление, переименование и удаление. У устройств в каталоге значения обновятся автоматически.
                </p>
                <form
                    className="dict-inline-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        addCabinet(newCabinet);
                        setNewCabinet('');
                    }}
                >
                    <label className="dict-inline-label">
                        <span className="sr-only">Новый кабинет</span>
                        <input
                            value={newCabinet}
                            onChange={(event) => setNewCabinet(event.target.value)}
                            placeholder="Кабинет, например 118"
                        />
                    </label>
                    <button type="submit" className="btn-compact-primary">
                        Добавить
                    </button>
                </form>
                <ul className="dict-chip-list dict-chip-list-crud dict-chip-list--spaced">
                    {cabinets.map((cabinet) => (
                        <li key={cabinet} className="dict-chip-item">
                            {editingCabinet === cabinet ? (
                                <form
                                    className="dict-chip-edit"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        renameCabinet(cabinet, cabinetEditValue.trim());
                                        setEditingCabinet(null);
                                    }}
                                >
                                    <input
                                        value={cabinetEditValue}
                                        onChange={(event) => setCabinetEditValue(event.target.value)}
                                        aria-label="Новое обозначение кабинета"
                                    />
                                    <button type="submit" className="btn-chip">
                                        Сохранить
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-chip"
                                        onClick={() => {
                                            setEditingCabinet(null);
                                        }}
                                    >
                                        Отмена
                                    </button>
                                </form>
                            ) : (
                                <div className="dict-chip-row">
                                    <span className="dict-chip-text">{cabinet}</span>
                                    <div className="dict-chip-actions">
                                        <button
                                            type="button"
                                            className="btn-chip"
                                            onClick={() => {
                                                setEditingCabinet(cabinet);
                                                setCabinetEditValue(cabinet);
                                            }}
                                        >
                                            Изменить
                                        </button>
                                        <button
                                            type="button"
                                            className="btn-chip btn-chip-danger"
                                            onClick={() => {
                                                if (
                                                    window.confirm(
                                                        `Удалить кабинет «${cabinet}»? У устройств в этом кабинете будет подставлено другое значение.`,
                                                    )
                                                ) {
                                                    removeCabinet(cabinet);
                                                    if (editingCabinet === cabinet) {
                                                        setEditingCabinet(null);
                                                    }
                                                }
                                            }}
                                        >
                                            Удалить
                                        </button>
                                    </div>
                                </div>
                            )}
                        </li>
                    ))}
                </ul>
            </section>
        </>
    );
}
