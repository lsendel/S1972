import React from 'react';
import { Outlet } from 'react-router-dom';

export default function SettingsLayout() {
    return (
        <div className="space-y-6">
            <div className="space-y-0.5">
                <h2 className="text-2xl font-bold tracking-tight">Settings</h2>
                <p className="text-muted-foreground">
                    Manage your organization settings and preferences.
                </p>
            </div>
            <div className="flex flex-col space-y-8 lg:flex-row lg:space-x-12 lg:space-y-0">
                <div className="flex-1 lg:max-w-2xl">
                    <Outlet />
                </div>
            </div>
        </div>
    );
}
