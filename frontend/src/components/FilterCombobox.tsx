import React, { useCallback, useEffect, useId, useRef, useState } from 'react';
import { flushSync } from 'react-dom';

type FilterComboboxProps = {
    label: string;
    value: string;
    placeholder?: string;
    onChange: (value: string) => void;
    fetchSuggestions: (query: string) => Promise<string[]>;
    disabled?: boolean;
};

export function FilterCombobox({
    label,
    value,
    placeholder,
    onChange,
    fetchSuggestions,
    disabled = false,
}: FilterComboboxProps) {
    const listId = useId();
    const rootRef = useRef<HTMLDivElement>(null);
    const [open, setOpen] = useState(false);
    const [suggestions, setSuggestions] = useState<string[]>([]);
    const [loading, setLoading] = useState(false);
    const [highlight, setHighlight] = useState(-1);

    useEffect(() => {
        const trimmed = value.trim();
        if (!trimmed) {
            setSuggestions([]);
            setOpen(false);
            setHighlight(-1);
            return;
        }

        let active = true;
        setLoading(true);
        const timer = window.setTimeout(() => {
            fetchSuggestions(trimmed)
                .then((items) => {
                    if (!active) {
                        return;
                    }
                    setSuggestions(items);
                    setOpen(items.length > 0);
                    setHighlight(items.length > 0 ? 0 : -1);
                })
                .catch(() => {
                    if (active) {
                        setSuggestions([]);
                        setOpen(false);
                        setHighlight(-1);
                    }
                })
                .finally(() => {
                    if (active) {
                        setLoading(false);
                    }
                });
        }, 300);

        return () => {
            active = false;
            window.clearTimeout(timer);
        };
    }, [value, fetchSuggestions]);

    useEffect(() => {
        function onDocClick(event: MouseEvent) {
            if (!rootRef.current?.contains(event.target as Node)) {
                setOpen(false);
            }
        }
        document.addEventListener('mousedown', onDocClick);
        return () => document.removeEventListener('mousedown', onDocClick);
    }, []);

    const pick = useCallback(
        (item: string) => {
            flushSync(() => onChange(item));
            setOpen(false);
            setHighlight(-1);
        },
        [onChange],
    );

    function onKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
        if (event.key === 'Escape') {
            setOpen(false);
            setHighlight(-1);
            return;
        }

        if (event.key === 'Enter') {
            event.preventDefault();
            if (open && suggestions.length > 0 && highlight >= 0) {
                pick(suggestions[highlight]);
            }
            return;
        }

        if (!open || suggestions.length === 0) {
            return;
        }

        if (event.key === 'ArrowDown') {
            event.preventDefault();
            setHighlight((prev) => (prev + 1) % suggestions.length);
            return;
        }

        if (event.key === 'ArrowUp') {
            event.preventDefault();
            setHighlight((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
            return;
        }

        if (event.key === 'Tab' && !event.shiftKey) {
            event.preventDefault();
            setHighlight((prev) => (prev + 1) % suggestions.length);
            return;
        }

        if (event.key === 'Tab' && event.shiftKey) {
            event.preventDefault();
            setHighlight((prev) => (prev <= 0 ? suggestions.length - 1 : prev - 1));
        }
    }

    return (
        <div className="filter-combobox" ref={rootRef}>
            <label className="filter-combobox-label">{label}</label>
            <input
                type="text"
                className="filter-combobox-input"
                value={value}
                placeholder={placeholder}
                disabled={disabled}
                onChange={(event) => onChange(event.target.value)}
                onFocus={() => {
                    if (suggestions.length > 0) {
                        setOpen(true);
                    }
                }}
                onKeyDown={onKeyDown}
                role="combobox"
                aria-expanded={open}
                aria-controls={listId}
                aria-autocomplete="list"
            />
            {open && suggestions.length > 0 ? (
                <ul id={listId} className="filter-combobox-list" role="listbox">
                    {suggestions.map((item, index) => (
                        <li key={item}>
                            <button
                                type="button"
                                role="option"
                                aria-selected={index === highlight}
                                className={index === highlight ? 'is-active' : undefined}
                                onMouseDown={(event) => event.preventDefault()}
                                onClick={() => pick(item)}
                            >
                                {item}
                            </button>
                        </li>
                    ))}
                </ul>
            ) : null}
            {loading ? <span className="filter-combobox-hint">…</span> : null}
        </div>
    );
}
