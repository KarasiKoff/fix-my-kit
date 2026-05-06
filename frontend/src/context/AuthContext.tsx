import React, { createContext, useState, ReactNode } from 'react';

type AuthContextValue = {
    user: null | { id: string; name: string };
    signIn: (username: string, password: string) => Promise<void>;
    signOut: () => void;
};

export const AuthContext = createContext<AuthContextValue>({
    user: null,
    signIn: async () => { },
    signOut: () => { },
});

export function AuthProvider({ children }: { children: ReactNode }) {
    const [user, setUser] = useState<AuthContextValue['user']>(null);

    async function signIn(username: string, password: string) {
        // TODO: реализовать login
        setUser({ id: '1', name: username });
    }

    function signOut() {
        setUser(null);
    }

    return (
        <AuthContext.Provider value={{ user, signIn, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}
