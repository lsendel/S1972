import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet, useParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import Dashboard from '@/pages/dashboard/Dashboard';
import SettingsLayout from '@/pages/settings/SettingsLayout';
import ProfileSettings from '@/pages/settings/Profile';
import SecuritySettings from '@/pages/settings/Security';
import TeamSettings from '@/pages/settings/Team';
import BillingSettings from '@/pages/settings/Billing';
import AppLayout from '@/components/layout/AppLayout';
import { useAuth } from '@/hooks/useAuth';
import { useOrganization } from '@/hooks/useOrganization';

const queryClient = new QueryClient();

function RequireAuth() {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return <Outlet />;
}

function RequireOrg() {
    const { orgSlug } = useParams();
    const { organization, isLoadingDetail, error } = useOrganization(orgSlug);

    if (isLoadingDetail) return <div className="flex h-screen items-center justify-center">Loading Organization...</div>;
    if (error) return <Navigate to="/app" replace />;
    // If we're at /app and have orgs but no slug, we might want to redirect to the first one?
    // This logic is usually handled in an OrgRedirect component.

    return <Outlet />;
}

// Redirect to first org or onboarding
function OrgRedirect() {
    const { organizations, isLoadingList } = useOrganization();

    if (isLoadingList) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    if (organizations && organizations.length > 0) {
        return <Navigate to={`/app/${organizations[0].slug}`} replace />;
    }

    return <Navigate to="/onboarding" replace />; // Assuming we have onboarding
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<OrgRedirect />} />

        <Route path="/app/:orgSlug" element={<RequireOrg />}>
             <Route element={<AppLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="settings" element={<SettingsLayout />}>
                    <Route path="profile" element={<ProfileSettings />} />
                    <Route path="security" element={<SecuritySettings />} />
                    <Route path="team" element={<TeamSettings />} />
                    <Route path="billing" element={<BillingSettings />} />
                </Route>
             </Route>
        </Route>
      </Route>

      <Route path="/" element={<Navigate to="/app" />} />
    </Routes>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AppRoutes />
      </Router>
    </QueryClientProvider>
  );
}

export default App;
