import { useCallback, useRef, useState } from 'react';
import type { DeviceOnMap } from '../types/roomMap';

export type DraftPositions = Record<string, { xPct: number; yPct: number }>;

type DragState = {
    deviceId: string;
    startClientX: number;
    startClientY: number;
    origXPct: number;
    origYPct: number;
};

export function useMapDrag(initialPositions: DeviceOnMap[]) {
    const [positions, setPositions] = useState<DraftPositions>(() =>
        Object.fromEntries(
            initialPositions.map((p) => [p.deviceId, { xPct: p.xPct, yPct: p.yPct }]),
        ),
    );

    const canvasRef = useRef<HTMLDivElement>(null);
    const dragging = useRef<DragState | null>(null);

    const onChipMouseDown = useCallback(
        (deviceId: string, e: React.MouseEvent) => {
            e.preventDefault();
            e.stopPropagation();
            const pos = positions[deviceId];
            if (!pos) return;
            dragging.current = {
                deviceId,
                startClientX: e.clientX,
                startClientY: e.clientY,
                origXPct: pos.xPct,
                origYPct: pos.yPct,
            };
        },
        [positions],
    );

    const onCanvasMouseMove = useCallback((e: React.MouseEvent) => {
        if (!dragging.current || !canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const dx = ((e.clientX - dragging.current.startClientX) / rect.width) * 100;
        const dy = ((e.clientY - dragging.current.startClientY) / rect.height) * 100;
        const newX = Math.max(0, Math.min(100, dragging.current.origXPct + dx));
        const newY = Math.max(0, Math.min(100, dragging.current.origYPct + dy));
        setPositions((prev) => ({
            ...prev,
            [dragging.current!.deviceId]: { xPct: newX, yPct: newY },
        }));
    }, []);

    const onCanvasMouseUp = useCallback(() => {
        dragging.current = null;
    }, []);

    const dropDevice = useCallback((deviceId: string, e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        if (!canvasRef.current) return;
        const rect = canvasRef.current.getBoundingClientRect();
        const xPct = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
        const yPct = Math.max(0, Math.min(100, ((e.clientY - rect.top) / rect.height) * 100));
        setPositions((prev) => ({ ...prev, [deviceId]: { xPct, yPct } }));
    }, []);

    const removeDevice = useCallback((deviceId: string) => {
        setPositions((prev) => {
            const next = { ...prev };
            delete next[deviceId];
            return next;
        });
    }, []);

    const resetPositions = useCallback((incoming: DeviceOnMap[]) => {
        setPositions(
            Object.fromEntries(incoming.map((p) => [p.deviceId, { xPct: p.xPct, yPct: p.yPct }])),
        );
    }, []);

    return {
        positions,
        canvasRef,
        onChipMouseDown,
        onCanvasMouseMove,
        onCanvasMouseUp,
        dropDevice,
        removeDevice,
        resetPositions,
    };
}
