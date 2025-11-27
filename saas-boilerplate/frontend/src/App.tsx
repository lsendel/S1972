import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from './pages/auth/Login';
import Signup from './pages/auth/Signup';
import ForgotPassword from './pages/auth/ForgotPassword';
import ResetPassword from './pages/auth/ResetPassword';
import VerifyEmail from './pages/auth/VerifyEmail';
import CreateOrganization from './pages/onboarding/CreateOrganization';
import Dashboard from './pages/dashboard/Dashboard';
import ProfileSettings from './pages/settings/Profile';
import SecuritySettings from './pages/settings/Security';
import TeamSettings from './pages/settings/Team';
import BillingSettings from './pages/settings/Billing';
import AppLayout from './components/layout/AppLayout';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient();

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <div>Loading...</div>;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password/:token" element={<ResetPassword />} />
          <Route path="/verify-email/:token" element={<VerifyEmail />} />

          {/* Onboarding */}
          <Route path="/onboarding" element={
            <RequireAuth>
              <CreateOrganization />
            </RequireAuth>
          } />

          {/* Organization Routes with AppLayout */}
          <Route path="/app/:orgSlug" element={
            <RequireAuth>
              <AppLayout />
            </RequireAuth>
          }>
            <Route index element={<Dashboard />} />
            <Route path="settings/profile" element={<ProfileSettings />} />
            <Route path="settings/security" element={<SecuritySettings />} />
            <Route path="settings/team" element={<TeamSettings />} />
            <Route path="settings/billing" element={<BillingSettings />} />
          </Route>

          {/* Redirects */}
          <Route path="/" element={<Navigate to="/login" />} />
          <Route path="/app" element={<Navigate to="/onboarding" />} />
        </Routes>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
