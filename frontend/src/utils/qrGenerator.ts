/**
 * Ссылка на публичную страницу заявки с предвыбранным устройством (по UUID).
 */
export function buildRepairRequestUrl(deviceId: string, inventoryNumber?: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    const params = new URLSearchParams({ deviceId });
    if (inventoryNumber) {
        params.set('inventoryNumber', inventoryNumber);
    }
    return `${origin}/repair?${params.toString()}`;
}

/** Имя файла для PNG: без символов, недопустимых в Windows / Unix. */
export function repairQrDownloadBasename(inventoryNumber: string, deviceId: string): string {
    const raw = inventoryNumber.trim() || deviceId;
    const safe = raw.replace(/[\u0000-\u001f<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_');
    const trimmed = safe.slice(0, 120);
    return trimmed.length > 0 ? trimmed : 'device';
}
