import React, { useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { useToast } from '../context/ToastContext';
import { ConfirmDialog } from '../components/ConfirmDialog';
import { QrSheetSettingsModal } from '../components/QrSheetSettingsModal';
import { Device } from '../types/device';
import { deviceRepairStatusLabel, deviceRepairStatusPillClass } from '../utils/statusDisplay';
import { formatApiError } from '../utils/formatApiError';

export function DevicesList() {
    const navigate = useNavigate();
    const { devices, isLoading, error, removeDevice } = useAppData();
    const { showError, showSuccess } = useToast();
    const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
    const [sheetModalOpen, setSheetModalOpen] = useState(false);
    const [deleting, setDeleting] = useState(false);
    const [deleteTargets, setDeleteTargets] = useState<Device[] | null>(null);
    const [filters, setFilters] = useState({
        inventoryNumber: '',
        category: '',
        room: '',
        responsible: '',
        status: '',
    });

    const filteredDevices = devices.filter((device) => {
        const byInventory = device.inventoryNumber.toLowerCase().includes(filters.inventoryNumber.toLowerCase());
        const byCategory = device.category.toLowerCase().includes(filters.category.toLowerCase());
        const byRoom = device.room.toLowerCase().includes(filters.room.toLowerCase());
        const byResponsible = device.responsible.toLowerCase().includes(filters.responsible.toLowerCase());
        const byStatus = filters.status === '' || device.status === filters.status;
        return byInventory && byCategory && byRoom && byResponsible && byStatus;
    });

    const selectedDevicesList = useMemo(
        () => filteredDevices.filter((d) => selectedDevices.has(d.id)),
        [filteredDevices, selectedDevices],
    );

    const handleSelectAll = () => {
        if (selectedDevices.size === filteredDevices.length) {
            setSelectedDevices(new Set());
        } else {
            setSelectedDevices(new Set(filteredDevices.map((d) => d.id)));
        }
    };

    const handleSelectDevice = (id: string) => {
        const newSelected = new Set(selectedDevices);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedDevices(newSelected);
    };

    function openDevice(id: string) {
        navigate(`/devices/${id}`);
    }

    function requestDelete(targets: Device[], event?: React.MouseEvent) {
        event?.stopPropagation();
        if (targets.length === 0) {
            return;
        }
        setDeleteTargets(targets);
    }

    async function executeDelete() {
        if (!deleteTargets?.length) {
            return;
        }
        const count = deleteTargets.length;
        setDeleting(true);
        try {
            for (const device of deleteTargets) {
                await removeDevice(device.id);
            }
            setSelectedDevices((prev) => {
                const next = new Set(prev);
                for (const device of deleteTargets) {
                    next.delete(device.id);
                }
                return next;
            });
            showSuccess(count === 1 ? 'Устройство удалено' : `Удалено устройств: ${count}`);
            setDeleteTargets(null);
        } catch (err) {
            showError(formatApiError(err));
        } finally {
            setDeleting(false);
        }
    }

    const deleteDialogTitle =
        deleteTargets?.length === 1 ? 'Удалить устройство?' : `Удалить устройства (${deleteTargets?.length ?? 0})?`;

    const deleteDialogMessage =
        deleteTargets?.length === 1 ? (
            <>
                <p>Будут безвозвратно удалены все заявки и история ремонтов по этому устройству.</p>
                <p className="confirm-dialog__target">
                    <strong>{deleteTargets[0].name}</strong>
                    {deleteTargets[0].inventoryNumber ? ` · ${deleteTargets[0].inventoryNumber}` : null}
                </p>
            </>
        ) : (
            <>
                <p>Будут безвозвратно удалены заявки и история ремонтов по каждому выбранному устройству.</p>
                <ul className="confirm-dialog__list">
                    {deleteTargets?.slice(0, 6).map((device) => (
                        <li key={device.id}>
                            {device.name}
                            {device.inventoryNumber ? ` · ${device.inventoryNumber}` : ''}
                        </li>
                    ))}
                    {deleteTargets && deleteTargets.length > 6 ? (
                        <li>и ещё {deleteTargets.length - 6}</li>
                    ) : null}
                </ul>
            </>
        );

    return (
        <main className="page">
            <h2>Список устройств</h2>
            {isLoading && <p>Загрузка...</p>}
            {error && <p className="error-text">{error}</p>}
            <section className="card">
                <h3>Поиск и фильтрация</h3>
                <div className="grid grid-5">
                    <input
                        placeholder="Инвентарный номер"
                        value={filters.inventoryNumber}
                        onChange={(event) => setFilters((prev) => ({ ...prev, inventoryNumber: event.target.value }))}
                    />
                    <input
                        placeholder="Категория"
                        value={filters.category}
                        onChange={(event) => setFilters((prev) => ({ ...prev, category: event.target.value }))}
                    />
                    <input
                        placeholder="Кабинет"
                        value={filters.room}
                        onChange={(event) => setFilters((prev) => ({ ...prev, room: event.target.value }))}
                    />
                    <input
                        placeholder="Ответственный"
                        value={filters.responsible}
                        onChange={(event) => setFilters((prev) => ({ ...prev, responsible: event.target.value }))}
                    />
                    <select
                        value={filters.status}
                        onChange={(event) => setFilters((prev) => ({ ...prev, status: event.target.value }))}
                    >
                        <option value="">Любой статус</option>
                        <option value="not_in_repair">{deviceRepairStatusLabel('not_in_repair')}</option>
                        <option value="in_repair">{deviceRepairStatusLabel('in_repair')}</option>
                    </select>
                </div>
            </section>

            {selectedDevices.size > 0 && (
                <section className="card">
                    <h3>Действия с выбранными ({selectedDevices.size})</h3>
                    <div className="actions-row">
                        <button type="button" onClick={() => setSheetModalOpen(true)}>
                            Настройка и предпросмотр
                        </button>
                        <button
                            type="button"
                            className="btn-danger"
                            disabled={deleting}
                            onClick={() => requestDelete(selectedDevicesList)}
                        >
                            Удалить выбранные
                        </button>
                    </div>
                </section>
            )}

            <section className="card">
                <h3>Оборудование ({filteredDevices.length})</h3>
                <div className="table-wrap">
                    <table className="requests-table">
                        <thead>
                            <tr>
                                <th className="table-col-center">
                                    <input
                                        type="checkbox"
                                        checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th className="table-col-center">Инв. номер</th>
                                <th className="table-col-center">Название</th>
                                <th className="table-col-center">Категория</th>
                                <th className="table-col-center">Кабинет</th>
                                <th className="table-col-center">Ответственный</th>
                                <th className="table-col-center">Статус</th>
                                <th className="table-col-center">Карточка</th>
                                <th className="table-col-center">Удалить</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.map((device) => (
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
                                    <td
                                        className="table-col-center"
                                        onClick={(event) => event.stopPropagation()}
                                    >
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
                                        <span className={deviceRepairStatusPillClass(device.status)}>{deviceRepairStatusLabel(device.status)}</span>
                                    </td>
                                    <td
                                        className="table-col-center requests-row-actions-cell"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <Link to={`/devices/${device.id}`} onClick={(event) => event.stopPropagation()}>
                                            Открыть
                                        </Link>
                                    </td>
                                    <td
                                        className="table-col-center requests-row-actions-cell"
                                        onClick={(event) => event.stopPropagation()}
                                    >
                                        <button
                                            type="button"
                                            className="btn-danger btn-compact"
                                            disabled={deleting}
                                            onClick={(event) => requestDelete([device], event)}
                                        >
                                            Удалить
                                        </button>
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

            <ConfirmDialog
                open={deleteTargets !== null}
                title={deleteDialogTitle}
                message={deleteDialogMessage}
                confirmLabel="Удалить"
                cancelLabel="Отмена"
                confirmVariant="danger"
                busy={deleting}
                onConfirm={() => void executeDelete()}
                onCancel={() => {
                    if (!deleting) {
                        setDeleteTargets(null);
                    }
                }}
            />
        </main>
    );
}
