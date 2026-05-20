import React, { useLayoutEffect, useRef } from 'react';
import { useCategoryIconSrc } from '../hooks/useCategoryIconSrc';
import type { DeviceOnMap } from '../types/roomMap';

function chipClass(repairStatus: string, highlighted = false): string {
    const base = 'device-chip device-chip--map-square';
    const status = repairStatus === 'in_repair' ? ' device-chip--in-repair' : '';
    const hl = highlighted ? ' device-chip--highlighted' : '';
    return base + status + hl;
}

function InventoryFit({ text }: { text: string }) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const spanRef = useRef<HTMLSpanElement>(null);

    useLayoutEffect(() => {
        const wrap = wrapRef.current;
        const span = spanRef.current;
        if (!wrap || !span) return;
        span.style.fontSize = '0.78rem';
        if (text.length <= 10) return;
        const max = wrap.clientWidth;
        if (max <= 0) return;
        let lo = 0.35;
        let hi = 0.78;
        for (let i = 0; i < 22; i++) {
            const mid = (lo + hi) / 2;
            span.style.fontSize = `${mid}rem`;
            if (span.scrollWidth <= max) hi = mid;
            else lo = mid;
        }
        span.style.fontSize = `${hi}rem`;
    }, [text]);

    return (
        <div
            ref={wrapRef}
            className="device-chip__inv-wrap"
        >
            <span ref={spanRef} className="device-chip__inv" title={text}>
                {text}
            </span>
        </div>
    );
}

export type MapDeviceChipProps = {
    device: DeviceOnMap;
    xPct: number;
    yPct: number;
    highlighted?: boolean;
    /** Редактор: перетаскивание мышью (не путать с HTML draggable) */
    allowDrag?: boolean;
    onMouseDown?: (deviceId: string, e: React.MouseEvent) => void;
    onRemove?: (deviceId: string) => void;
    /** Плавное «прилипание» к ячейке */
    snapTransition?: boolean;
    cursor?: string;
};

export function MapDeviceChip({
    device,
    xPct,
    yPct,
    highlighted = false,
    allowDrag = false,
    onMouseDown,
    onRemove,
    snapTransition = false,
    cursor,
}: MapDeviceChipProps) {
    const showRemove = Boolean(onRemove);
    const iconSrc = useCategoryIconSrc(device.categoryId ?? null, Boolean(device.categoryHasIcon));

    return (
        <div
            className={
                chipClass(device.repairStatus, highlighted) +
                (snapTransition ? ' device-chip--snap-transition' : '')
            }
            style={{
                left: `${xPct}%`,
                top: `${yPct}%`,
                cursor: cursor ?? (allowDrag ? 'grab' : 'default'),
            }}
            onMouseDown={allowDrag && onMouseDown ? (e) => onMouseDown(device.deviceId, e) : undefined}
        >
            {showRemove && (
                <button
                    type="button"
                    className="device-chip__remove"
                    title="Убрать с карты"
                    onMouseDown={(e) => e.stopPropagation()}
                    onClick={() => onRemove?.(device.deviceId)}
                >
                    ✕
                </button>
            )}
            <div className="device-chip__map-body">
                <div className="device-chip__icon-wrap">
                    <img src={iconSrc} alt="" className="device-chip__icon" draggable={false} />
                </div>
                <InventoryFit text={device.inventoryNumber} />
            </div>
        </div>
    );
}
