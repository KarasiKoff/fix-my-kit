import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastContextValue = {
    showSuccess: (message: string) => void;
    showError: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toast, setToast] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const hide = useCallback(() => {
        setToast(null);
        if (timerRef.current) {
            clearTimeout(timerRef.current);
            timerRef.current = null;
        }
    }, []);

    const push = useCallback((type: 'success' | 'error', msg: string) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setToast({ type, message: msg });
        timerRef.current = setTimeout(() => {
            setToast(null);
            timerRef.current = null;
        }, 5000);
    }, []);

    const showSuccess = useCallback((msg: string) => push('success', msg), [push]);
    const showError = useCallback((msg: string) => push('error', msg), [push]);

    const value = useMemo(() => ({ showSuccess, showError }), [showSuccess, showError]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {toast ? (
                <div className={`toast toast--${toast.type === 'success' ? 'success' : 'error'}`} role="status" aria-live="assertive">
                    {toast.message}
                </div>
            ) : null}
        </ToastContext.Provider>
    );
}

export function useToast() {
    const ctx = useContext(ToastContext);
    if (!ctx) {
        throw new Error('useToast must be used within ToastProvider');
    }
    return ctx;
}
