import React, { useState, useEffect } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { get } from '../services/api';
import { AppNotification } from '../types';
import {
  LayoutDashboard, ArrowRightLeft, PiggyBank, Target, RefreshCcw,
  BarChart3, LineChart, Bell, UserCircle, LogOut, Menu, X, ChevronRight,
} from 'lucide-react';

const NAV = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/transactions', label: 'Transactions', icon: ArrowRightLeft },
  { to: '/budgets', label: 'Budgets', icon: PiggyBank },
  { to: '/goals', label: 'Savings Goals', icon: Target },
  { to: '/subscriptions', label: 'Subscriptions', icon: RefreshCcw },
  { to: '/reports', label: 'Reports', icon: BarChart3 },
  { to: '/analytics', label: 'Analytics', icon: LineChart },
  { to: '/notifications', label: 'Notifications', icon: Bell },
  { to: '/profile', label: 'Settings', icon: UserCircle },
];

export const DashboardLayout = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [notifCount, setNotifCount] = useState(0);

  useEffect(() => {
    get<AppNotification[]>('/notifications').then((n) => setNotifCount(n?.length || 0)).catch(() => {});
  }, []);

  const handleLogout = async () => { await logout(); navigate('/'); };

  const SidebarContent = () => (
    <>
      <div className="flex items-center gap-2 px-5 py-5 border-b border-slate-200">
        <span className="text-2xl">💰</span>
        <span className="text-lg font-bold text-slate-900">FinanceFlow</span>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto" aria-label="Main navigation">
        {NAV.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to} to={to} onClick={() => setSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                isActive ? 'bg-emerald-50 text-emerald-700' : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
              }`
            }
          >
            <Icon className="w-5 h-5" />
            <span>{label}</span>
            {to === '/notifications' && notifCount > 0 && (
              <span className="ml-auto bg-red-500 text-white text-xs font-bold px-2 py-0.5 rounded-full">{notifCount}</span>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 border-t border-slate-200">
        <button onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 w-full rounded-lg text-sm font-medium text-slate-600 hover:bg-red-50 hover:text-red-700 transition-colors">
          <LogOut className="w-5 h-5" /><span>Logout</span>
        </button>
      </div>
    </>
  );

  return (
    <div className="min-h-screen bg-slate-50 flex">
      {/* Desktop sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 bg-white border-r border-slate-200 fixed inset-y-0 z-30">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div className="fixed inset-0 bg-black/50" onClick={() => setSidebarOpen(false)} />
          <aside className="fixed inset-y-0 left-0 w-64 bg-white z-50 flex flex-col shadow-xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 lg:ml-64">
        {/* Top bar */}
        <header className="sticky top-0 z-20 bg-white border-b border-slate-200 px-4 lg:px-8 py-3 flex items-center justify-between">
          <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 rounded-lg hover:bg-slate-100" aria-label="Open menu">
            <Menu className="w-5 h-5" />
          </button>
          <div className="flex-1" />
          <div className="flex items-center gap-4">
            <NavLink to="/notifications" className="relative p-2 rounded-lg hover:bg-slate-100">
              <Bell className="w-5 h-5 text-slate-600" />
              {notifCount > 0 && <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full" />}
            </NavLink>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-emerald-100 rounded-full flex items-center justify-center">
                <span className="text-sm font-bold text-emerald-700">{user?.name?.charAt(0) || 'U'}</span>
              </div>
              <span className="hidden sm:block text-sm font-medium text-slate-700">{user?.name}</span>
            </div>
          </div>
        </header>
        {/* Page content */}
        <main className="p-4 lg:p-8 max-w-7xl mx-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
};
