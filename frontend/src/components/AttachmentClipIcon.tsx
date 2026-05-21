import React from 'react';
import type { AttachmentClipTone } from '../utils/attachmentSyncDisplay';

function IconPaperclip() {
    return (
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
                d="M16.5 10.5V6.75a4.5 4.5 0 0 0-9 0v11.25a3 3 0 0 0 6 0V8.25"
                stroke="currentColor"
                strokeWidth="1.75"
                strokeLinecap="round"
            />
        </svg>
    );
}

export function AttachmentClipIcon({ tone }: { tone: AttachmentClipTone }) {
    return (
        <span
            className={`attachment-clip-icon attachment-clip-icon--${tone}`}
            title={
                tone === 'complete'
                    ? 'Все файлы в Трекере'
                    : tone === 'partial'
                      ? 'Часть файлов ещё не в Трекере'
                      : 'Файлы не загружены в Трекер'
            }
        >
            <IconPaperclip />
        </span>
    );
}
