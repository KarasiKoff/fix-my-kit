/**
 * Ссылка на публичную страницу заявки с предвыбранным устройством (по UUID).
 */
export function buildRepairRequestUrl(deviceId: string): string {
    const origin = typeof window !== 'undefined' ? window.location.origin : '';
    return `${origin}/repair?deviceId=${encodeURIComponent(deviceId)}`;
}

/** Имя файла для PNG: без символов, недопустимых в Windows / Unix. */
export function repairQrDownloadBasename(inventoryNumber: string, deviceId: string): string {
    const raw = inventoryNumber.trim() || deviceId;
    const safe = raw.replace(/[\u0000-\u001f<>:"/\\|?*]+/g, '_').replace(/\s+/g, '_');
    const trimmed = safe.slice(0, 120);
    return trimmed.length > 0 ? trimmed : 'device';
}
