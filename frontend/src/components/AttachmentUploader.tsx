import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
    MAX_ATTACHMENT_BYTES,
    MAX_ATTACHMENTS_PER_REQUEST,
    attachmentPreviewKind,
    isAllowedAttachmentFile,
} from '../utils/attachmentLimits';

export type AttachmentDraft = {
    id: string;
    file: File;
    previewUrl: string | null;
    kind: 'image' | 'video' | 'other';
};

function newDraft(file: File): AttachmentDraft {
    const kind = attachmentPreviewKind(file);
    const previewUrl = kind === 'image' || kind === 'video' ? URL.createObjectURL(file) : null;
    return { id: `${file.name}-${file.size}-${file.lastModified}`, file, previewUrl, kind };
}

export function AttachmentUploader({
    files,
    onChange,
    maxFiles = MAX_ATTACHMENTS_PER_REQUEST,
    disabled = false,
    label = 'Фото и видео',
}: {
    files: AttachmentDraft[];
    onChange: (next: AttachmentDraft[]) => void;
    maxFiles?: number;
    disabled?: boolean;
    label?: string;
}) {
    const inputRef = useRef<HTMLInputElement>(null);
    const [error, setError] = useState<string | null>(null);

    const remaining = maxFiles - files.length;

    useEffect(() => {
        return () => {
            for (const item of files) {
                if (item.previewUrl) {
                    URL.revokeObjectURL(item.previewUrl);
                }
            }
        };
    }, [files]);

    const hint = useMemo(() => {
        return `До ${maxFiles} файлов, максимум 1 ГБ каждый. Фото и видео.`;
    }, [maxFiles]);

    function addFiles(list: FileList | File[]) {
        setError(null);
        const incoming = Array.from(list);
        if (incoming.length === 0) {
            return;
        }
        if (files.length + incoming.length > maxFiles) {
            setError(`Можно прикрепить не более ${maxFiles} файлов.`);
            return;
        }
        const next = [...files];
        for (const file of incoming) {
            if (!isAllowedAttachmentFile(file)) {
                setError('Допустимы только фото и видео.');
                return;
            }
            if (file.size > MAX_ATTACHMENT_BYTES) {
                setError('Файл больше 1 ГБ.');
                return;
            }
            const draft = newDraft(file);
            if (next.some((d) => d.id === draft.id)) {
                continue;
            }
            next.push(draft);
        }
        onChange(next);
    }

    function removeDraft(id: string) {
        const target = files.find((f) => f.id === id);
        if (target?.previewUrl) {
            URL.revokeObjectURL(target.previewUrl);
        }
        onChange(files.filter((f) => f.id !== id));
    }

    return (
        <div className="attachment-uploader">
            <div className="attachment-uploader__head">
                <span className="attachment-uploader__label">{label}</span>
                <span className="attachment-uploader__hint">{hint}</span>
            </div>
            {files.length > 0 ? (
                <ul className="attachment-uploader__previews">
                    {files.map((item) => (
                        <li key={item.id} className="attachment-uploader__preview">
                            {item.kind === 'image' && item.previewUrl ? (
                                <img src={item.previewUrl} alt="" className="attachment-uploader__thumb" />
                            ) : item.kind === 'video' && item.previewUrl ? (
                                <video
                                    src={item.previewUrl}
                                    className="attachment-uploader__thumb"
                                    muted
                                    playsInline
                                    preload="metadata"
                                />
                            ) : (
                                <span className="attachment-uploader__file-icon" aria-hidden="true">
                                    ▶
                                </span>
                            )}
                            <span className="attachment-uploader__name" title={item.file.name}>
                                {item.file.name}
                            </span>
                            <button
                                type="button"
                                className="attachment-uploader__remove"
                                disabled={disabled}
                                onClick={() => removeDraft(item.id)}
                                aria-label={`Удалить ${item.file.name}`}
                            >
                                ×
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
            {remaining > 0 ? (
                <div
                    className="attachment-uploader__dropzone"
                    role="button"
                    tabIndex={0}
                    onClick={() => inputRef.current?.click()}
                    onKeyDown={(e) => {
                        if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            inputRef.current?.click();
                        }
                    }}
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                        e.preventDefault();
                        if (!disabled) {
                            addFiles(e.dataTransfer.files);
                        }
                    }}
                >
                    <input
                        ref={inputRef}
                        type="file"
                        accept="image/*,video/*"
                        multiple
                        hidden
                        disabled={disabled}
                        onChange={(e) => {
                            if (e.target.files) {
                                addFiles(e.target.files);
                            }
                            e.target.value = '';
                        }}
                    />
                    <span>Добавить файлы ({remaining} осталось)</span>
                </div>
            ) : null}
            {error ? <p className="attachment-uploader__error">{error}</p> : null}
        </div>
    );
}

export function draftsToFiles(drafts: AttachmentDraft[]): File[] {
    return drafts.map((d) => d.file);
}
