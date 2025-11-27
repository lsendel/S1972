import React from 'react';
import { NavLink, Outlet, useParams } from 'react-router-dom';
import { useUIStore } from '@/stores/uiStore';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';

export default function AppLayout() {
    const { sidebarOpen, toggleSidebar } = useUIStore();
    const { logout } = useAuth();
    const { orgSlug } = useParams();
    const { organization } = useOrganization(orgSlug);

    const handleLogout = async () => {
        await logout();
        window.location.href = '/login';
    };

    return (
        <div className="flex h-screen bg-gray-100">
            {/* Sidebar */}
            <aside
                className={cn(
                    "fixed inset-y-0 left-0 z-50 w-64 bg-white shadow-lg transform transition-transform duration-200 ease-in-out md:relative md:translate-x-0",
                    !sidebarOpen && "-translate-x-full"
                )}
            >
                <div className="flex h-16 items-center justify-center border-b px-6">
                    <span className="text-xl font-bold text-gray-800">
                        {organization?.name || 'SaaS App'}
                    </span>
                </div>
                <nav className="mt-6 px-4 space-y-2">
                    <NavLink
                        to={`/app/${orgSlug}`}
                        end
                        className={({ isActive }) => cn(
                            "flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100",
                            isActive && "bg-primary/10 text-primary font-medium"
                        )}
                    >
                        Dashboard
                    </NavLink>

                    <div className="pt-4 pb-2">
                        <p className="px-4 text-xs font-semibold text-gray-400 uppercase">Settings</p>
                    </div>

                    <NavLink
                        to={`/app/${orgSlug}/settings/profile`}
                        className={({ isActive }) => cn(
                            "flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100",
                            isActive && "bg-primary/10 text-primary font-medium"
                        )}
                    >
                        Profile
                    </NavLink>
                    <NavLink
                        to={`/app/${orgSlug}/settings/team`}
                        className={({ isActive }) => cn(
                            "flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100",
                            isActive && "bg-primary/10 text-primary font-medium"
                        )}
                    >
                        Team
                    </NavLink>
                    <NavLink
                        to={`/app/${orgSlug}/settings/billing`}
                        className={({ isActive }) => cn(
                            "flex items-center px-4 py-2 text-gray-700 rounded-lg hover:bg-gray-100",
                            isActive && "bg-primary/10 text-primary font-medium"
                        )}
                    >
                        Billing
                    </NavLink>
                </nav>
                <div className="absolute bottom-0 w-full p-4 border-t">
                    <Button variant="ghost" className="w-full justify-start text-red-600 hover:text-red-700 hover:bg-red-50" onClick={handleLogout}>
                        Log out
                    </Button>
                </div>
            </aside>

            {/* Main Content */}
            <div className="flex-1 flex flex-col overflow-hidden">
                <header className="flex h-16 items-center justify-between bg-white shadow-sm px-6">
                    <Button variant="ghost" size="icon" onClick={toggleSidebar} className="md:hidden">
                        <span className="sr-only">Toggle sidebar</span>
                        <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                    </Button>
                    <div className="flex items-center space-x-4">
                        {/* User Dropdown or info could go here */}
                        <div className="h-8 w-8 rounded-full bg-gray-200"></div>
                    </div>
                </header>
                <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-50 p-6">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}
