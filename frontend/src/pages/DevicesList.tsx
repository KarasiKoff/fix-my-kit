import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { DeviceSuggestField, fetchDevices, suggestDevices } from '../api/devices';
import { FilterCombobox } from '../components/FilterCombobox';
import { ListPagination } from '../components/ListPagination';
import { QrSheetSettingsModal } from '../components/QrSheetSettingsModal';
import { SortableTh } from '../components/SortableTh';
import { Device } from '../types/device';
import type { DeviceSortBy, PageSize, SortDir } from '../types/listQuery';
import { deviceRepairStatusLabel, deviceRepairStatusPillClass } from '../utils/statusDisplay';
import { formatApiError } from '../utils/formatApiError';
import { filtersEqual } from '../utils/filtersMatch';

type DeviceFilters = {
    inventoryNumber: string;
    name: string;
    category: string;
    room: string;
    responsible: string;
    status: '' | Device['status'];
};

const DEFAULT_SORT: DeviceSortBy = 'inventory_number';
const DEFAULT_DIR: SortDir = 'asc';

const EMPTY_FILTERS: DeviceFilters = {
    inventoryNumber: '',
    name: '',
    category: '',
    room: '',
    responsible: '',
    status: '',
};

export function DevicesList() {
    const navigate = useNavigate();
    const [items, setItems] = useState<Device[]>([]);
    const [total, setTotal] = useState(0);
    const [fetching, setFetching] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState<PageSize>(20);
    const [sortBy, setSortBy] = useState<DeviceSortBy>(DEFAULT_SORT);
    const [sortDir, setSortDir] = useState<SortDir>(DEFAULT_DIR);
    const [draftFilters, setDraftFilters] = useState<DeviceFilters>(EMPTY_FILTERS);
    const [appliedFilters, setAppliedFilters] = useState<DeviceFilters>(EMPTY_FILTERS);
    const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
    const [sheetModalOpen, setSheetModalOpen] = useState(false);

    const applyFilters = useCallback(() => {
        setAppliedFilters({ ...draftFilters });
        setPage(1);
    }, [draftFilters]);

    const load = useCallback(async () => {
        setFetching(true);
        setError(null);
        try {
            const result = await fetchDevices({
                inventory_number: appliedFilters.inventoryNumber || undefined,
                name: appliedFilters.name || undefined,
                category: appliedFilters.category || undefined,
                room: appliedFilters.room || undefined,
                responsible: appliedFilters.responsible || undefined,
                repair_status: appliedFilters.status || undefined,
                sort_by: sortBy,
                sort_dir: sortDir,
                limit: pageSize,
                offset: (page - 1) * pageSize,
            });
            setItems(result.items);
            setTotal(result.total);
        } catch (err) {
            setError(formatApiError(err));
        } finally {
            setFetching(false);
        }
    }, [appliedFilters, page, pageSize, sortBy, sortDir]);

    useEffect(() => {
        void load();
    }, [load]);

    const suggest = useCallback((field: DeviceSuggestField) => {
        return (query: string) => suggestDevices(field, query);
    }, []);

    function handleSort(key: string) {
        const col = key as DeviceSortBy;
        setPage(1);
        if (sortBy === col) {
            setSortDir((d) => (d === 'asc' ? 'desc' : 'asc'));
        } else {
            setSortBy(col);
            setSortDir('asc');
        }
    }

    const filtersPending = !filtersEqual(draftFilters, appliedFilters);

    const selectedDevicesList = useMemo(() => items.filter((d) => selectedDevices.has(d.id)), [items, selectedDevices]);

    const handleSelectAll = () => {
        if (selectedDevices.size === items.length) {
            setSelectedDevices(new Set());
        } else {
            setSelectedDevices(new Set(items.map((d) => d.id)));
        }
    };

    const handleSelectDevice = (id: string) => {
        const next = new Set(selectedDevices);
        if (next.has(id)) {
            next.delete(id);
        } else {
            next.add(id);
        }
        setSelectedDevices(next);
    };

    function openDevice(id: string) {
        navigate(`/devices/${id}`);
    }

    return (
        <main className="page">
            <h2>Список устройств</h2>
            {error && <p className="error-text">{error}</p>}
            <section className="card">
                <h3>Поиск и фильтрация</h3>
                <p className="filter-hint">
                    Поиск по части текста (например, «303» найдёт 303-1 и 303-GIFD). Инв. номер ищет также в названии.
                </p>
                <div className="grid grid-filters">
                    <FilterCombobox
                        label="Инв. номер"
                        value={draftFilters.inventoryNumber}
                        placeholder="Инвентарный номер"
                        onChange={(v) => setDraftFilters((p) => ({ ...p, inventoryNumber: v }))}
                        fetchSuggestions={suggest('inventory_number')}
                    />
                    <FilterCombobox
                        label="Название"
                        value={draftFilters.name}
                        placeholder="Название устройства"
                        onChange={(v) => setDraftFilters((p) => ({ ...p, name: v }))}
                        fetchSuggestions={suggest('name')}
                    />
                    <FilterCombobox
                        label="Категория"
                        value={draftFilters.category}
                        placeholder="Категория"
                        onChange={(v) => setDraftFilters((p) => ({ ...p, category: v }))}
                        fetchSuggestions={suggest('category')}
                    />
                    <FilterCombobox
                        label="Кабинет"
                        value={draftFilters.room}
                        placeholder="Кабинет"
                        onChange={(v) => setDraftFilters((p) => ({ ...p, room: v }))}
                        fetchSuggestions={suggest('room')}
                    />
                    <FilterCombobox
                        label="Ответственный"
                        value={draftFilters.responsible}
                        placeholder="ФИО или логин"
                        onChange={(v) => setDraftFilters((p) => ({ ...p, responsible: v }))}
                        fetchSuggestions={suggest('responsible')}
                    />
                    <label className="filter-select-field">
                        Статус
                        <select
                            value={draftFilters.status}
                            onChange={(event) =>
                                setDraftFilters((p) => ({ ...p, status: event.target.value as DeviceFilters['status'] }))
                            }
                        >
                            <option value="">Любой статус</option>
                            <option value="not_in_repair">{deviceRepairStatusLabel('not_in_repair')}</option>
                            <option value="in_repair">{deviceRepairStatusLabel('in_repair')}</option>
                        </select>
                    </label>
                </div>
                <div className="filter-actions">
                    <button type="button" className="btn-primary" disabled={!filtersPending} onClick={applyFilters}>
                        Применить фильтры
                    </button>
                </div>
            </section>

            <ListPagination
                page={page}
                pageSize={pageSize}
                total={total}
                loading={fetching}
                onPageChange={setPage}
                onPageSizeChange={(size) => {
                    setPageSize(size);
                    setPage(1);
                }}
            />

            {selectedDevices.size > 0 && (
                <section className="card">
                    <h3>Действия с выбранными ({selectedDevices.size})</h3>
                    <div className="actions-row">
                        <button type="button" onClick={() => setSheetModalOpen(true)}>
                            Настройка и предпросмотр
                        </button>
                    </div>
                </section>
            )}

            <section className="card">
                <h3>Оборудование ({total})</h3>
                <div className="table-wrap">
                    <table className="requests-table">
                        <thead>
                            <tr>
                                <th className="table-col-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedDevices.size === items.length && items.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <SortableTh
                                    label="Инв. номер"
                                    sortKey="inventory_number"
                                    activeSortBy={sortBy}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                    className="table-col-center"
                                />
                                <SortableTh
                                    label="Название"
                                    sortKey="name"
                                    activeSortBy={sortBy}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                    className="table-col-center"
                                />
                                <SortableTh
                                    label="Категория"
                                    sortKey="category_name"
                                    activeSortBy={sortBy}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                    className="table-col-center"
                                />
                                <SortableTh
                                    label="Кабинет"
                                    sortKey="audience_name"
                                    activeSortBy={sortBy}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                    className="table-col-center"
                                />
                                <SortableTh
                                    label="Ответственный"
                                    sortKey="responsible_name"
                                    activeSortBy={sortBy}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                    className="table-col-center"
                                />
                                <SortableTh
                                    label="Статус"
                                    sortKey="repair_status"
                                    activeSortBy={sortBy}
                                    sortDir={sortDir}
                                    onSort={handleSort}
                                    className="table-col-center"
                                />
                                <th className="table-col-center">Карточка</th>
                            </tr>
                        </thead>
                        <tbody>
                            {items.map((device) => (
                                <tr
                                    key={device.id}
                                    className="requests-row-clickable"
                                    tabIndex={0}
                                    onClick={() => openDevice(device.id)}
                                    onKeyDown={(event) => {
                                        if (event.key === 'Enter' || event.key === ' ') {
                                            event.preventDefault();
                                            openDevice(device.id);
                                        }
                                    }}
                                >
                                    <td className="table-col-center" onClick={(event) => event.stopPropagation()}>
                                        <input
                                            type="checkbox"
                                            checked={selectedDevices.has(device.id)}
                                            onChange={() => handleSelectDevice(device.id)}
                                        />
                                    </td>
                                    <td className="table-col-center">{device.inventoryNumber}</td>
                                    <td className="table-col-center">{device.name}</td>
                                    <td className="table-col-center">{device.category}</td>
                                    <td className="table-col-center">{device.room}</td>
                                    <td className="table-col-center">{device.responsible}</td>
                                    <td className="status-cell table-col-center">
                                        <span className={deviceRepairStatusPillClass(device.status)}>
                                            {deviceRepairStatusLabel(device.status)}
                                        </span>
                                    </td>
                                    <td
                                        className="table-col-center requests-row-actions-cell"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <Link to={`/devices/${device.id}`} onClick={(event) => event.stopPropagation()}>
                                            Открыть
                                        </Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <QrSheetSettingsModal
                open={sheetModalOpen}
                onClose={() => setSheetModalOpen(false)}
                devices={selectedDevicesList}
            />
        </main>
    );
}
