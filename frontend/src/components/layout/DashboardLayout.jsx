import React, { useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { TransactionModal } from '../common/TransactionModal';

const PAGE_TITLES = {
  '/dashboard': 'Financial Dashboard',
  '/transactions': 'Transaction History',
  '/income': 'Income Management',
  '/expenses': 'Expense Management',
  '/budgets': 'Budget & Spending Limits',
  '/reports': 'Financial Reports & Analytics',
  '/profile': 'Profile & Account Settings',
};

export const DashboardLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalDefaultType, setModalDefaultType] = useState('EXPENSE');
  const [refreshKey, setRefreshKey] = useState(0);

  const location = useLocation();
  const title = PAGE_TITLES[location.pathname] || 'FinFlow Dashboard';

  const handleOpenAddModal = (type = 'EXPENSE') => {
    setModalDefaultType(type);
    setModalOpen(true);
  };

  const handleTransactionSaved = () => {
    setRefreshKey((prev) => prev + 1);
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex transition-colors duration-200">
      {/* Sidebar */}
      <Sidebar
        isOpen={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
        onOpenAddModal={() => handleOpenAddModal('EXPENSE')}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        <Navbar
          onOpenSidebar={() => setSidebarOpen(true)}
          onOpenAddModal={() => handleOpenAddModal('EXPENSE')}
          title={title}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-fade-in">
          {/* We pass triggerAddModal and refreshKey to nested routes */}
          <Outlet context={{ openAddModal: handleOpenAddModal, refreshKey, onTransactionSaved: handleTransactionSaved }} />
        </main>
      </div>

      {/* Global Add/Edit Transaction Modal */}
      <TransactionModal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={handleTransactionSaved}
        defaultType={modalDefaultType}
      />
    </div>
  );
};
