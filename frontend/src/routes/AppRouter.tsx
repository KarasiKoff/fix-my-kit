import React, { useContext } from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes, useLocation, useNavigate } from 'react-router-dom';
import { AuthContext } from '../context/AuthContext';
import { Login } from '../pages/Login';
import { DevicesList } from '../pages/DevicesList';
import { DeviceDetail } from '../pages/DeviceDetail';
import { NewRepairRequest } from '../pages/NewRepairRequest';
import { UsersManagement } from '../pages/UsersManagement';
import { QRScan } from '../pages/QRScan';
import { AdminAddDevice } from '../pages/AdminAddDevice';
import { AdminEditDevice } from '../pages/AdminEditDevice';
import { AdminLayout } from '../pages/admin/AdminLayout';
import { AdminCategories } from '../pages/admin/AdminCategories';
import { AdminCabinets } from '../pages/admin/AdminCabinets';
import { AdminDevicesManagement } from '../pages/admin/AdminDevicesManagement';

function AppShell() {
    const { pathname } = useLocation();
    const navigate = useNavigate();
    const { user, signOut } = useContext(AuthContext);
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
                        <NavLink to="/devices">Оборудование</NavLink>
                        <NavLink to="/scan">QR</NavLink>
                        <NavLink to="/repair">Заявки</NavLink>
                        <NavLink to="/admin">Админка</NavLink>
                        {user ? (
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
                <Route path="/" element={<Navigate to="/devices" replace />} />
                <Route path="/login" element={<Login />} />
                <Route path="/devices" element={<DevicesList />} />
                <Route path="/devices/:id" element={<DeviceDetail />} />
                <Route path="/repair" element={<NewRepairRequest />} />
                <Route path="/users" element={<Navigate to="/admin/users" replace />} />
                <Route path="/admin" element={<AdminLayout />}>
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
