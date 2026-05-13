import React, { createContext, useCallback, useContext, useMemo, useRef, useState } from 'react';

type ToastContextValue = {
    showSuccess: (message: string) => void;
};

const ToastContext = createContext<ToastContextValue | null>(null);

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [message, setMessage] = useState<string | null>(null);
    const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const showSuccess = useCallback((msg: string) => {
        if (timerRef.current) {
            clearTimeout(timerRef.current);
        }
        setMessage(msg);
        timerRef.current = setTimeout(() => {
            setMessage(null);
            timerRef.current = null;
        }, 4000);
    }, []);

    const value = useMemo(() => ({ showSuccess }), [showSuccess]);

    return (
        <ToastContext.Provider value={value}>
            {children}
            {message ? (
                <div className="toast toast--success" role="status" aria-live="polite">
                    {message}
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
