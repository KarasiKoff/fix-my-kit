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

