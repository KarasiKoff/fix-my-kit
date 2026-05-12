import React from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Login } from '../pages/Login';
import { DevicesList } from '../pages/DevicesList';
import { DeviceDetail } from '../pages/DeviceDetail';
import { NewRepairRequest } from '../pages/NewRepairRequest';
import { RepairRequests } from '../pages/RepairRequests';
import { UsersManagement } from '../pages/UsersManagement';
import { QRScan } from '../pages/QRScan';
import { useAuth } from '../hooks/useAuth';

function RequireAuth({ children }: { children: JSX.Element }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <main className="page"><p>Загрузка...</p></main>;
    }

    if (!user) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function RequireGuest({ children }: { children: JSX.Element }) {
    const { user, isLoading } = useAuth();

    if (isLoading) {
        return <main className="page"><p>Загрузка...</p></main>;
    }

    if (user) {
        return <Navigate to="/devices" replace />;
    }

    return children;
}

export function AppRouter() {
    const { user, signOut } = useAuth();

    return (
        <BrowserRouter>
            <div className="app-shell">
                <header className="topbar">
                    <h1>Fix My Kit</h1>
                    <nav className="topbar-nav">
                        {user && <NavLink to="/devices">Оборудование</NavLink>}
                        <NavLink to="/scan">QR</NavLink>
                        <NavLink to="/repair">Заявка</NavLink>
                        {user && <NavLink to="/requests">Все заявки</NavLink>}
                        {user && <NavLink to="/users">Пользователи</NavLink>}
                        {user && (
                            <button type="button" className="nav-button" onClick={signOut}>
                                Выйти
                            </button>
                        )}
                    </nav>
                </header>
                <Routes>
                    <Route
                        path="/"
                        element={user ? <Navigate to="/devices" replace /> : <Navigate to="/repair" replace />}
                    />
                    <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
                    <Route path="/devices" element={<RequireAuth><DevicesList /></RequireAuth>} />
                    <Route path="/devices/:id" element={<RequireAuth><DeviceDetail /></RequireAuth>} />
                    <Route path="/repair" element={<NewRepairRequest />} />
                    <Route path="/requests" element={<RequireAuth><RepairRequests /></RequireAuth>} />
                    <Route path="/users" element={<RequireAuth><UsersManagement /></RequireAuth>} />
                    <Route path="/scan" element={<QRScan />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
