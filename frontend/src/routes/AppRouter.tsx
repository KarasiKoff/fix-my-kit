import React from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { Login } from '../pages/Login';
import { DevicesList } from '../pages/DevicesList';
import { DeviceDetail } from '../pages/DeviceDetail';
import { NewRepairRequest } from '../pages/NewRepairRequest';
import { RepairRequests } from '../pages/RepairRequests';
import { UsersManagement } from '../pages/UsersManagement';
import { QRScan } from '../pages/QRScan';
import { AdminAddDevice } from '../pages/AdminAddDevice';
import { AdminEditDevice } from '../pages/AdminEditDevice';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { AdminCategories } from '../pages/admin/AdminCategories';
import { AdminCabinets } from '../pages/admin/AdminCabinets';
import { AdminDevicesManagement } from '../pages/admin/AdminDevicesManagement';
import { useAuth } from '../hooks/useAuth';

function RequireAuth({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <main className="page">
                <p>Загрузка...</p>
            </main>
        );
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    return children;
}

function RequireGuest({ children }: { children: JSX.Element }) {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <main className="page">
                <p>Загрузка...</p>
            </main>
        );
    }

    if (isAuthenticated) {
        return <Navigate to="/devices" replace />;
    }

    return children;
}

function AppShell() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { isAuthenticated, signOut } = useAuth();
    const hideMainTopbar = pathname === '/login';

    function handleLogout() {
        signOut();
        navigate('/login');
    }

    return (
        <div className="app-shell">
            {!hideMainTopbar && (
                <header className="topbar">
                    <h1>Fix My Kit</h1>
                    <nav className="topbar-nav">
                        {isAuthenticated && <NavLink to="/devices">Оборудование</NavLink>}
                        <NavLink to="/scan">QR</NavLink>
                        <NavLink to="/repair">Заявка</NavLink>
                        {isAuthenticated && <NavLink to="/requests">Все заявки</NavLink>}
                        {isAuthenticated && <NavLink to="/admin">Админка</NavLink>}
                        {isAuthenticated ? (
                            <button type="button" className="topbar-nav-logout" onClick={handleLogout}>
                                Выход
                            </button>
                        ) : (
                            <NavLink to="/login">Вход</NavLink>
                        )}
                    </nav>
                </header>
            )}
            <Routes>
                <Route path="/" element={isAuthenticated ? <Navigate to="/devices" replace /> : <Navigate to="/repair" replace />} />
                <Route path="/login" element={<RequireGuest><Login /></RequireGuest>} />
                <Route path="/devices" element={<RequireAuth><DevicesList /></RequireAuth>} />
                <Route path="/devices/:id" element={<RequireAuth><DeviceDetail /></RequireAuth>} />
                <Route path="/repair" element={<NewRepairRequest />} />
                <Route path="/requests" element={<RequireAuth><RepairRequests /></RequireAuth>} />
                <Route path="/users" element={<Navigate to="/admin/users" replace />} />
                <Route path="/admin" element={<RequireAuth><AdminLayout /></RequireAuth>}>
                    <Route index element={<Navigate to="devices" replace />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="cabinets" element={<AdminCabinets />} />
                    <Route path="devices" element={<AdminDevicesManagement />} />
                    <Route path="devices/new" element={<AdminAddDevice />} />
                    <Route path="devices/:id/edit" element={<AdminEditDevice />} />
                    <Route path="users" element={<UsersManagement />} />
                </Route>
                <Route path="/scan" element={<QRScan />} />
            </Routes>
        </div>
    );
}

export function AppRouter() {
    return (
        <BrowserRouter>
            <AppShell />
        </BrowserRouter>
    );
}
