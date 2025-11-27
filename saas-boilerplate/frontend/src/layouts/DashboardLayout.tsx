import React from 'react';
import { Outlet, Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/authStore';
import { Button } from '@/components/ui/button';
import {
  LayoutDashboard,
  User,
  Settings,
  LogOut,
  Building2
} from 'lucide-react';
import OrgSwitcher from '../components/OrgSwitcher';

export default function DashboardLayout() {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <aside className="w-64 bg-white shadow-md hidden md:flex flex-col">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold text-primary">SaaS App</h1>
        </div>

        <div className="p-4">
             <OrgSwitcher />
        </div>

        <nav className="flex-1 p-4 space-y-2">
          <Link to="/app" className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-gray-700">
            <LayoutDashboard size={20} />
            <span>Dashboard</span>
          </Link>
          <Link to="/app/profile" className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-gray-700">
            <User size={20} />
            <span>Profile</span>
          </Link>
          <Link to="/app/settings" className="flex items-center space-x-2 p-2 rounded-md hover:bg-gray-100 text-gray-700">
             <Settings size={20} />
             <span>Settings</span>
          </Link>
        </nav>

        <div className="p-4 border-t">
          <div className="flex items-center space-x-2 mb-4">
            <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center">
              {user?.full_name?.charAt(0) || 'U'}
            </div>
            <div className="overflow-hidden">
                <p className="text-sm font-medium truncate">{user?.full_name}</p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
            </div>
          </div>
          <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
            <LogOut size={20} className="mr-2" />
            Logout
          </Button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 overflow-auto">
        <header className="bg-white shadow-sm p-4 md:hidden flex justify-between items-center">
             <h1 className="text-xl font-bold text-primary">SaaS App</h1>
             {/* Mobile menu trigger would go here */}
        </header>
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
