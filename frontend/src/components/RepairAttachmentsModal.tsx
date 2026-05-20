import React, { useCallback, useEffect, useState } from 'react';
import {
    fetchRepairRequestAttachments,
    repairAttachmentContentUrl,
} from '../api/repairRequestAttachments';
import { getStoredAuthToken } from '../api/auth';
import type { TrackerAttachment } from '../types/repairRequest';
import { formatApiError } from '../utils/formatApiError';

function resolveApiUrl(path: string): string {
    const raw = import.meta.env.VITE_API_BASE_URL;
    if (raw === undefined || raw === null || String(raw).trim() === '') {
        return path;
    }
    const base = String(raw).replace(/\/+$/, '');
    return `${base}${path.startsWith('/') ? path : `/${path}`}`;
}

async function loadBlobUrl(requestId: string, item: TrackerAttachment, variant: 'content' | 'thumbnail'): Promise<string> {
    const useThumb = variant === 'thumbnail' && item.hasThumbnail && item.kind === 'image';
    const url = repairAttachmentContentUrl(requestId, item.id, useThumb ? 'thumbnail' : 'content');
    const token = getStoredAuthToken();
    const headers: HeadersInit = {};
    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }
    const res = await fetch(resolveApiUrl(url), { headers });
    if (!res.ok) {
        throw new Error('load_failed');
    }
    const blob = await res.blob();
    return URL.createObjectURL(blob);
}

export function RepairAttachmentsModal({
    requestId,
    open,
    onClose,
}: {
    requestId: string;
    open: boolean;
    onClose: () => void;
}) {
    const [items, setItems] = useState<TrackerAttachment[]>([]);
    const [index, setIndex] = useState(0);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [blobUrl, setBlobUrl] = useState<string | null>(null);

    const active = items[index] ?? null;

    const loadList = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const list = await fetchRepairRequestAttachments(requestId);
            setItems(list);
            setIndex(0);
        } catch (err) {
            setError(formatApiError(err));
            setItems([]);
        } finally {
            setLoading(false);
        }
    }, [requestId]);

    useEffect(() => {
        if (!open) {
            return;
        }
        void loadList();
    }, [open, loadList]);

    useEffect(() => {
        if (!open || !active) {
            return;
        }
        let cancelled = false;
        let objectUrl: string | null = null;
        setBlobUrl(null);
        void loadBlobUrl(requestId, active, 'content')
            .then((url) => {
                if (!cancelled) {
                    objectUrl = url;
                    setBlobUrl(url);
                } else {
                    URL.revokeObjectURL(url);
                }
            })
            .catch(() => {
                if (!cancelled) {
                    setError('Не удалось загрузить файл для просмотра');
                }
            });
        return () => {
            cancelled = true;
            if (objectUrl) {
                URL.revokeObjectURL(objectUrl);
            }
        };
    }, [open, active, requestId]);

    useEffect(() => {
        if (!open) {
            return;
        }
        function onKey(e: KeyboardEvent) {
            if (e.key === 'Escape') {
                onClose();
            }
            if (e.key === 'ArrowLeft') {
                setIndex((i) => (items.length ? (i - 1 + items.length) % items.length : 0));
            }
            if (e.key === 'ArrowRight') {
                setIndex((i) => (items.length ? (i + 1) % items.length : 0));
            }
        }
        window.addEventListener('keydown', onKey);
        return () => window.removeEventListener('keydown', onKey);
    }, [open, items.length, onClose]);

    if (!open) {
        return null;
    }

    return (
        <div className="attachments-modal-backdrop" role="presentation" onClick={onClose}>
            <div
                className="attachments-modal"
                role="dialog"
                aria-modal="true"
                aria-label="Вложения заявки"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="attachments-modal__header">
                    <h3>Вложения</h3>
                    <button type="button" className="btn-ghost" onClick={onClose}>
                        Закрыть
                    </button>
                </header>
                {loading ? <p className="attachments-modal__status">Загрузка…</p> : null}
                {error ? <p className="attachments-modal__error">{error}</p> : null}
                {!loading && items.length === 0 && !error ? (
                    <p className="attachments-modal__status">В Трекере пока нет вложений.</p>
                ) : null}
                {active && blobUrl ? (
                    <div className="attachments-modal__stage">
                        {active.kind === 'video' ? (
                            <video src={blobUrl} controls className="attachments-modal__media" />
                        ) : (
                            <img src={blobUrl} alt={active.name} className="attachments-modal__media" />
                        )}
                        <p className="attachments-modal__caption">
                            {active.name}
                            {items.length > 1 ? ` (${index + 1} / ${items.length})` : ''}
                        </p>
                        {items.length > 1 ? (
                            <div className="attachments-modal__nav">
                                <button type="button" className="btn-ghost" onClick={() => setIndex((i) => (i - 1 + items.length) % items.length)}>
                                    ←
                                </button>
                                <button type="button" className="btn-ghost" onClick={() => setIndex((i) => (i + 1) % items.length)}>
                                    →
                                </button>
                            </div>
                        ) : null}
                    </div>
                ) : null}
                {items.length > 1 ? (
                    <ul className="attachments-modal__thumbs">
                        {items.map((item, i) => (
                            <li key={item.id}>
                                <button
                                    type="button"
                                    className={`attachments-modal__thumb-btn${i === index ? ' attachments-modal__thumb-btn--active' : ''}`}
                                    onClick={() => setIndex(i)}
                                >
                                    {item.name}
                                </button>
                            </li>
                        ))}
                    </ul>
                ) : null}
            </div>
        </div>
    );
}
