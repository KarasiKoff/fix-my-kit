import React from 'react';
import type { PageSize } from '../types/listQuery';

type ListPaginationProps = {
    page: number;
    pageSize: PageSize;
    total: number;
    loading?: boolean;
    onPageChange: (page: number) => void;
    onPageSizeChange: (size: PageSize) => void;
};

const PAGE_SIZES: PageSize[] = [10, 20, 50];

export function ListPagination({
    page,
    pageSize,
    total,
    loading = false,
    onPageChange,
    onPageSizeChange,
}: ListPaginationProps) {
    const totalPages = total > 0 ? Math.ceil(total / pageSize) : 1;
    const safePage = Math.min(Math.max(page, 1), totalPages);
    const showNav = totalPages > 1;
    const canGoBack = showNav && safePage > 1;
    const canGoForward = showNav && safePage < totalPages;

    return (
        <div className={`list-pagination${loading ? ' list-pagination--loading' : ''}`} aria-busy={loading}>
            <div className="list-pagination__content">
                <label className="list-pagination-size">
                    ╨Э╨░ ╤Б╤В╤А╨░╨╜╨╕╤Ж╨╡
                    <select
                        value={pageSize}
                        disabled={loading}
                        onChange={(event) => onPageSizeChange(Number(event.target.value) as PageSize)}
                    >
                        {PAGE_SIZES.map((size) => (
                            <option key={size} value={size}>
                                {size}
                            </option>
                        ))}
                    </select>
                </label>
                {showNav ? (
                    <span className="list-pagination-status">
                        ╨б╤В╤А╨░╨╜╨╕╤Ж╨░ {safePage} ╨╕╨╖ {totalPages}
                        {total > 0 ? ` (╨▓╤Б╨╡╨│╨╛ ${total})` : ''}
                    </span>
                ) : (
                    <span className="list-pagination-status">{total > 0 ? `╨Т╤Б╨╡╨│╨╛ ${total}` : '╨Э╨╡╤В ╨╖╨░╨┐╨╕╤Б╨╡╨╣'}</span>
                )}
                {canGoBack || canGoForward ? (
                    <div className="list-pagination-actions">
                        {canGoBack ? (
                            <button type="button" className="btn-ghost" disabled={loading} onClick={() => onPageChange(safePage - 1)}>
                                ╨Э╨░╨╖╨░╨┤
                            </button>
                        ) : null}
                        {canGoForward ? (
                            <button
                                type="button"
                                className="btn-ghost"
                                disabled={loading}
                                onClick={() => onPageChange(safePage + 1)}
                            >
                                ╨Т╨┐╨╡╤А╤С╨┤
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
            {loading ? (
                <div className="list-pagination__overlay" aria-label="╨Ч╨░╨│╤А╤Г╨╖╨║╨░">
                    <span className="list-pagination__spinner" />
                </div>
            ) : null}
        </div>
    );
}
