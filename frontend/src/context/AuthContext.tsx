import React, { createContext, useEffect, useState, ReactNode } from 'react';
import { login as loginApi, getCurrentUser, getStoredAuthToken, setStoredAuthToken, clearStoredAuthToken } from '../api/auth';
import { User } from '../types/user';

type AuthContextValue = {
    user: null | User;
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => void;
    isLoading: boolean;
};

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    signIn: async () => { },
    signOut: () => { },
    isLoading: true,
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthContextValue['user']>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const token = getStoredAuthToken();
        if (!token) {
            setIsLoading(false);
            return;
        }

        getCurrentUser(token)
            .then((currentUser) => {
                setUser({
                    id: currentUser.id,
                    name: currentUser.full_name ?? currentUser.login,
                    role: currentUser.role,
                });
            })
            .catch(() => {
                clearStoredAuthToken();
                setUser(null);
            })
            .finally(() => setIsLoading(false));
    }, []);

    async function signIn(username: string, password: string) {
        const result = await loginApi({ login: username, password });
        setStoredAuthToken(result.access_token);
        const currentUser = await getCurrentUser(result.access_token);
        setUser({
            id: currentUser.id,
            name: currentUser.full_name ?? currentUser.login,
            role: currentUser.role,
        });
    }

    function signOut() {
        clearStoredAuthToken();
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut, isLoading }}>
            {children}
        </AuthContext.Provider>
    );
}
