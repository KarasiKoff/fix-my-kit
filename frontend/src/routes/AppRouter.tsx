import React from 'react';
import { BrowserRouter, NavLink, Navigate, Route, Routes } from 'react-router-dom';
import { Login } from '../pages/Login';
import { DevicesList } from '../pages/DevicesList';
import { DeviceDetail } from '../pages/DeviceDetail';
import { NewRepairRequest } from '../pages/NewRepairRequest';
import { UsersManagement } from '../pages/UsersManagement';
import { QRScan } from '../pages/QRScan';

export function AppRouter() {
    return (
        <BrowserRouter>
            <div className="app-shell">
                <header className="topbar">
                    <h1>Fix My Kit</h1>
                    <nav className="topbar-nav">
                        <NavLink to="/devices">Оборудование</NavLink>
                        <NavLink to="/scan">QR</NavLink>
                        <NavLink to="/repair">Заявки</NavLink>
                        <NavLink to="/users">Пользователи</NavLink>
                    </nav>
                </header>
                <Routes>
                    <Route path="/" element={<Navigate to="/devices" replace />} />
                    <Route path="/login" element={<Login />} />
                    <Route path="/devices" element={<DevicesList />} />
                    <Route path="/devices/:id" element={<DeviceDetail />} />
                    <Route path="/repair" element={<NewRepairRequest />} />
                    <Route path="/users" element={<UsersManagement />} />
                    <Route path="/scan" element={<QRScan />} />
                </Routes>
            </div>
        </BrowserRouter>
    );
}
