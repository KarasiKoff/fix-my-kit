import React from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { Login } from '../pages/Login';
import { DevicesList } from '../pages/DevicesList';
import { DeviceDetail } from '../pages/DeviceDetail';
import { NewRepairRequest } from '../pages/NewRepairRequest';
import { UsersManagement } from '../pages/UsersManagement';
import { QRScan } from '../pages/QRScan';

export function AppRouter() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/login" element={<Login />} />
                <Route path="/devices" element={<DevicesList />} />
                <Route path="/devices/:id" element={<DeviceDetail />} />
                <Route path="/repair" element={<NewRepairRequest />} />
                <Route path="/users" element={<UsersManagement />} />
                <Route path="/scan" element={<QRScan />} />
            </Routes>
        </BrowserRouter>
    );
}
