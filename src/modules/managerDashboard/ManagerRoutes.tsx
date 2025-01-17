import React from 'react';
import { Route, Routes, Navigate } from 'react-router-dom';
import ManagerLayout from './ManagerLayout';
import CustomerInfoPage from './components/pages/CustomerInfoPage'; // Assuming this is your dashboard component
import DashboardPage from './components/pages/DashboardPage'; // Assuming this is your dashboard component
import EmployeeStaffPage from './components/pages/EmployeeStaffPage'; // Assuming this is your dashboard component
import InventoryPage from './components/pages/InventoryPage'; // Assuming this is your dashboard component
import NotificationPage from './components/pages/NotificationPage'; // Assuming this is your dashboard component
import ReportsPage from './components/pages/ReportsPage'; // Assuming this is your dashboard component
import SettingsPage from './components/pages/SettingsPage'; // Assuming this is your dashboard component
import MedicinesAvailablePage from './components/pages/InventorySubPages/MedicinesAvailablePage';
import ViewMedicineDescription  from './components/pages/InventorySubPages/VIewMedicineDescription';
import MedicineGroupPage from './components/pages/InventorySubPages/MedicineGroupPage';
import ViewGroupDetails from './components/pages/InventorySubPages/ViewGroupDetails';
import MedicineShortage from './components/pages/InventorySubPages/MedicineShortage';
import ViewAllTransaction from './components/pages/reportSubPages/ViewAllTransaction'; 
import EditMedicineDescription from './components/pages/InventorySubPages/EditMedicineDescription';

const ManagerRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Admin Layout wrapper */}
      <Route path="/" element={<ManagerLayout />}>
        {/* Default route redirects to dashboard */}
        <Route index element={<Navigate to="dashboard" replace />} /> {/* index is the default route */}

        {/* Admin nested routes */}
        <Route path="dashboard" element={<DashboardPage />} />


        <Route path="inventory" element={<InventoryPage />} />

        {/* Dynamic Routes for Item Details */}
        <Route path="inventory/view-medicines-available" element={<MedicinesAvailablePage />} />
        <Route path="inventory/view-medicines-description/:medicineName" element={<ViewMedicineDescription />} />
        <Route path="inventory/view-medicines-description/:medicineName/edit-details" element={<EditMedicineDescription />} />

        <Route path="inventory/view-medicines-group" element={<MedicineGroupPage />} />
        <Route path="inventory/view-medicines-group/:groupName" element={<ViewGroupDetails />} />

        <Route path="inventory/medicine-shortage" element={<MedicineShortage />} />

        
        <Route path="sales-report" element={<ReportsPage />} />
        <Route path="sales-report/view-all-transactions" element={<ViewAllTransaction />} />

        <Route path="employee-staff" element={<EmployeeStaffPage />} />
        <Route path="customer-info" element={<CustomerInfoPage />} />
        <Route path="settings" element={<SettingsPage />} />
        <Route path="notifications" element={<NotificationPage />} />
      </Route>
    </Routes>
  );
};

export default ManagerRoutes;
