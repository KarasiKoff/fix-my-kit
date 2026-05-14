import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppData } from '../context/AppDataContext';
import { RepairQrModal } from '../components/RepairQrModal';
import { Device } from '../types/device';
import { deviceRepairStatusLabel, deviceRepairStatusPillClass } from '../utils/statusDisplay';
import QRCode from 'qrcode';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import { buildRepairRequestUrl } from '../utils/qrGenerator';

export function DevicesList() {
    const { devices, isLoading, error } = useAppData();
    const [qrDevice, setQrDevice] = useState<Device | null>(null);
    const [selectedDevices, setSelectedDevices] = useState<Set<string>>(new Set());
    const [qrSize, setQrSize] = useState(100);
    const [qrSpacing, setQrSpacing] = useState(0);
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

    const handleSelectAll = () => {
        if (selectedDevices.size === filteredDevices.length) {
            setSelectedDevices(new Set());
        } else {
            setSelectedDevices(new Set(filteredDevices.map(d => d.id)));
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

    const generateQRs = async (devices: Device[], size: number) => {
        const results = [];
        for (const device of devices) {
            const url = buildRepairRequestUrl(device.id, device.inventoryNumber);
            const dataUrl = await QRCode.toDataURL(url, { width: size, margin: 0, errorCorrectionLevel: 'M' });
            results.push({ dataUrl, inventoryNumber: device.inventoryNumber });
        }
        return results;
    };

    const buildPrintPageContent = (qrs: Array<{ dataUrl: string; inventoryNumber: string }>, qrSizeMm: number, spacingMm: number) => {
        const textHeightMm = 5;
        const itemHeightMm = qrSizeMm + textHeightMm;

        return `
            <div class="print-page">
                ${qrs.map(qr => `<div class="qr-item"><img src="${qr.dataUrl}" alt="QR-код" /><p>${qr.inventoryNumber}</p></div>`).join('')}
            </div>
        `;
    };

    const buildPrintDocumentHtml = (content: string, qrSizeMm: number, spacingMm: number) => {
        return `
            <!DOCTYPE html>
            <html lang="ru">
            <head>
                <meta charset="UTF-8" />
                <title>QR-коды для печати</title>
                <style>
                    @page { size: A4; margin: 0; }
                    html, body { margin: 0; padding: 0; width: 210mm; height: 297mm; }
                    body { font-family: sans-serif; color: #000; }
                    .print-page {
                        display: grid;
                        grid-template-columns: repeat(auto-fill, minmax(${qrSizeMm}mm, 1fr));
                        gap: ${spacingMm}mm;
                        width: 210mm;
                        padding: 0;
                        margin: 0;
                        box-sizing: border-box;
                    }
                    .qr-item {
                        display: flex;
                        flex-direction: column;
                        align-items: center;
                        justify-content: flex-start;
                        padding: 0;
                        margin: 0;
                        min-height: ${qrSizeMm + 5}mm;
                        box-sizing: border-box;
                    }
                    .qr-item img {
                        width: ${qrSizeMm}mm;
                        height: ${qrSizeMm}mm;
                    }
                    .qr-item p {
                        margin: 0;
                        margin-top: 2mm;
                        font-size: 10pt;
                        line-height: 1.1;
                        text-align: center;
                        word-break: break-word;
                        width: ${qrSizeMm}mm;
                    }
                </style>
            </head>
            <body>
                ${content}
            </body>
            </html>
        `;
    };

    const handlePrint = async () => {
        const selected = filteredDevices.filter(d => selectedDevices.has(d.id));
        if (selected.length === 0) {
            return;
        }
        const qrs = await generateQRs(selected, qrSize);
        const qrSizeMm = (qrSize / 72) * 25.4;
        const spacingMm = qrSpacing;
        const printWindow = window.open('', '_blank');
        if (!printWindow) {
            return;
        }
        const content = buildPrintPageContent(qrs, qrSizeMm, spacingMm);
        printWindow.document.open();
        printWindow.document.write(buildPrintDocumentHtml(content, qrSizeMm, spacingMm));
        printWindow.document.close();
        printWindow.focus();
        printWindow.addEventListener('load', () => {
            printWindow.print();
            printWindow.close();
        });
    };

    const handleSavePdf = async () => {
        const selected = filteredDevices.filter(d => selectedDevices.has(d.id));
        if (selected.length === 0) {
            return;
        }
        const qrs = await generateQRs(selected, qrSize);
        const qrSizeMm = (qrSize / 72) * 25.4;
        const spacingMm = qrSpacing;
        const pdf = new jsPDF('p', 'mm', 'a4');

        const pdfContainer = document.createElement('div');
        pdfContainer.style.position = 'absolute';
        pdfContainer.style.left = '-9999px';
        pdfContainer.style.top = '0';
        pdfContainer.style.width = '210mm';
        pdfContainer.style.background = '#fff';
        pdfContainer.style.color = '#000';
        pdfContainer.style.padding = '0';
        pdfContainer.style.margin = '0';
        pdfContainer.innerHTML = `
            <style>
                .print-page { display: grid; grid-template-columns: repeat(auto-fill, minmax(${qrSizeMm}mm, 1fr)); gap: ${spacingMm}mm; width: 210mm; padding: 0; margin: 0; box-sizing: border-box; }
                .qr-item { display: flex; flex-direction: column; align-items: center; justify-content: flex-start; padding: 0; margin: 0; min-height: ${qrSizeMm + 5}mm; box-sizing: border-box; }
                .qr-item img { width: ${qrSizeMm}mm; height: ${qrSizeMm}mm; }
                .qr-item p { margin: 0; margin-top: 2mm; font-size: 10pt; line-height: 1.1; text-align: center; word-break: break-word; width: ${qrSizeMm}mm; }
            </style>
            ${buildPrintPageContent(qrs, qrSizeMm, spacingMm)}
        `;
        document.body.appendChild(pdfContainer);

        const canvas = await html2canvas(pdfContainer, {
            scale: 2,
            useCORS: true,
            backgroundColor: '#ffffff',
            scrollY: -window.scrollY,
        });

        const imgData = canvas.toDataURL('image/png');
        const pageWidthMm = 210;
        const pageHeightMm = 297;
        const pxPerMm = canvas.width / pageWidthMm;
        const pageHeightPx = Math.floor(pageHeightMm * pxPerMm);
        let pageCount = Math.ceil(canvas.height / pageHeightPx);

        for (let page = 0; page < pageCount; page++) {
            const y = page * pageHeightPx;
            const pageCanvas = document.createElement('canvas');
            pageCanvas.width = canvas.width;
            pageCanvas.height = Math.min(pageHeightPx, canvas.height - y);
            const context = pageCanvas.getContext('2d');
            if (context) {
                context.fillStyle = '#ffffff';
                context.fillRect(0, 0, pageCanvas.width, pageCanvas.height);
                context.drawImage(canvas, 0, y, canvas.width, pageCanvas.height, 0, 0, pageCanvas.width, pageCanvas.height);
            }
            const pageDataUrl = pageCanvas.toDataURL('image/png');
            if (page > 0) {
                pdf.addPage();
            }
            pdf.addImage(pageDataUrl, 'PNG', 0, 0, pageWidthMm, Math.min(pageHeightMm, (pageCanvas.height / pxPerMm)));
        }

        pdf.save('qr-codes.pdf');
        document.body.removeChild(pdfContainer);
    };

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
                        <button type="button" onClick={handleSelectAll}>
                            {selectedDevices.size === filteredDevices.length ? 'Снять выделение' : 'Выбрать всё'}
                        </button>
                        <label>
                            Размер QR (px):
                            <input
                                type="number"
                                value={qrSize}
                                onChange={(e) => setQrSize(Number(e.target.value))}
                                min="50"
                                max="200"
                                style={{ marginLeft: '5px', width: '60px' }}
                            />
                        </label>
                        <label>
                            Отступ (мм):
                            <input
                                type="number"
                                value={qrSpacing}
                                onChange={(e) => setQrSpacing(Number(e.target.value))}
                                min="0"
                                max="20"
                                style={{ marginLeft: '5px', width: '60px' }}
                            />
                        </label>
                        <button type="button" onClick={handlePrint}>
                            Печать
                        </button>
                        <button type="button" onClick={handleSavePdf}>
                            Сохранить в PDF (QR-коды)
                        </button>
                    </div>
                </section>
            )}

            <section className="card">
                <h3>Оборудование ({filteredDevices.length})</h3>
                <div className="table-wrap">
                    <table>
                        <thead>
                            <tr>
                                <th>
                                    <input
                                        type="checkbox"
                                        checked={selectedDevices.size === filteredDevices.length && filteredDevices.length > 0}
                                        onChange={handleSelectAll}
                                    />
                                </th>
                                <th>Инв. номер</th>
                                <th>Название</th>
                                <th>Категория</th>
                                <th>Кабинет</th>
                                <th>Ответственный</th>
                                <th>Статус</th>
                                <th>QR заявки</th>
                                <th>Карточка</th>
                            </tr>
                        </thead>
                        <tbody>
                            {filteredDevices.map((device) => (
                                <tr key={device.id}>
                                    <td>
                                        <input
                                            type="checkbox"
                                            checked={selectedDevices.has(device.id)}
                                            onChange={() => handleSelectDevice(device.id)}
                                        />
                                    </td>
                                    <td>{device.inventoryNumber}</td>
                                    <td>{device.name}</td>
                                    <td>{device.category}</td>
                                    <td>{device.room}</td>
                                    <td>{device.responsible}</td>
                                    <td className="status-cell">
                                        <span className={deviceRepairStatusPillClass(device.status)}>{deviceRepairStatusLabel(device.status)}</span>
                                    </td>
                                    <td>
                                        <button type="button" className="table-qr-btn" onClick={() => setQrDevice(device)}>
                                            QR
                                        </button>
                                    </td>
                                    <td>
                                        <Link to={`/devices/${device.id}`}>Открыть</Link>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </section>

            <RepairQrModal open={qrDevice !== null} device={qrDevice} onClose={() => setQrDevice(null)} />
        </main>
    );
}
