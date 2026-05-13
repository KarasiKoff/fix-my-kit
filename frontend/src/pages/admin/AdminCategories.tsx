import React from 'react';
import { useAppData } from '../../context/AppDataContext';

export function AdminCategories() {
    const { categories, addCategory, removeCategory, renameCategory } = useAppData();
    const [newCategory, setNewCategory] = React.useState('');
    const [editingCategory, setEditingCategory] = React.useState<string | null>(null);
    const [categoryEditValue, setCategoryEditValue] = React.useState('');

    return (
        <>
            <h2 className="admin-section-title">Категории</h2>
            <section className="card dict-card dict-card--single">
                <p className="dict-lead text-muted">
                    Добавление, переименование и удаление. У устройств в каталоге значения обновятся автоматически.
                </p>
                <form
                    className="dict-inline-form"
                    onSubmit={(event) => {
                        event.preventDefault();
                        addCategory(newCategory);
                        setNewCategory('');
                    }}
                >
                    <label className="dict-inline-label">
                        <span className="sr-only">Новая категория</span>
                        <input
                            value={newCategory}
                            onChange={(event) => setNewCategory(event.target.value)}
                            placeholder="Новая категория, например Сервер"
                        />
                    </label>
                    <button type="submit" className="btn-compact-primary">
                        Добавить
                    </button>
                </form>
                <ul className="dict-chip-list dict-chip-list-crud dict-chip-list--spaced">
                    {categories.map((category) => (
                        <li key={category} className="dict-chip-item">
                            {editingCategory === category ? (
                                <form
                                    className="dict-chip-edit"
                                    onSubmit={(event) => {
                                        event.preventDefault();
                                        renameCategory(category, categoryEditValue.trim());
                                        setEditingCategory(null);
                                    }}
                                >
                                    <input
                                        value={categoryEditValue}
                                        onChange={(event) => setCategoryEditValue(event.target.value)}
                                        aria-label="Новое название категории"
                                    />
                                    <button type="submit" className="btn-chip">
                                        Сохранить
                                    </button>
                                    <button
                                        type="button"
                                        className="btn-chip"
                                        onClick={() => {
                                            setEditingCategory(null);
                                        }}
                                    >
                                        Отмена
                                    </button>
                                </form>
                            ) : (
                                <div className="dict-chip-row">
                                    <span className="dict-chip-text">{category}</span>
                                    <div className="dict-chip-actions">
                                        <button
                                            type="button"
                                            className="btn-chip"
                                            onClick={() => {
                                                setEditingCategory(category);
                                                setCategoryEditValue(category);
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
                                                        `Удалить категорию «${category}»? Устройства с этой категорией получат другую.`,
                                                    )
                                                ) {
                                                    removeCategory(category);
                                                    if (editingCategory === category) {
                                                        setEditingCategory(null);
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
