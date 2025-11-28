import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { trackPageView } from './lib/analytics';
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
import AdminLayout from './pages/admin/AdminLayout';
import AdminDashboard from './pages/admin/Dashboard';
import ActivityLogs from './pages/admin/ActivityLogs';
import ErrorBoundary from './components/ErrorBoundary';
import RouteErrorBoundary from './components/RouteErrorBoundary';
import { PageLoadingSkeleton } from './components/LoadingSkeletons';
import { ToastProvider } from './components/ToastContainer';
import { CookieConsentBanner } from './components/CookieConsent/CookieConsentBanner';
import { useAuth } from './hooks/useAuth';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

function RequireAuth({ children }: { children: React.ReactNode }) {
  const { user, isLoading } = useAuth();

  if (isLoading) return <PageLoadingSkeleton />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
}

// Component to track page views
function PageViewTracker() {
  const location = useLocation();

  useEffect(() => {
    // Track page view on route change
    trackPageView(location.pathname + location.search);
  }, [location]);

  return null;
}

function App() {
  return (
    <ErrorBoundary>
      <HelmetProvider>
        <QueryClientProvider client={queryClient}>
          <ToastProvider>
            <Router>
              <PageViewTracker />
              <Routes>
                {/* Public Routes */}
                <Route path="/login" element={<Login />} errorElement={<RouteErrorBoundary />} />
                <Route path="/signup" element={<Signup />} errorElement={<RouteErrorBoundary />} />
                <Route path="/forgot-password" element={<ForgotPassword />} errorElement={<RouteErrorBoundary />} />
                <Route path="/reset-password/:uid/:token" element={<ResetPassword />} errorElement={<RouteErrorBoundary />} />
                <Route path="/verify-email/:token" element={<VerifyEmail />} errorElement={<RouteErrorBoundary />} />

                {/* Onboarding */}
                <Route
                  path="/onboarding"
                  element={
                    <RequireAuth>
                      <CreateOrganization />
                    </RequireAuth>
                  }
                  errorElement={<RouteErrorBoundary />}
                />

                {/* Organization Routes with AppLayout */}
                <Route
                  path="/app/:orgSlug"
                  element={
                    <RequireAuth>
                      <AppLayout />
                    </RequireAuth>
                  }
                  errorElement={<RouteErrorBoundary />}
                >
                  <Route index element={<Dashboard />} />
                  <Route path="settings/profile" element={<ProfileSettings />} />
                  <Route path="settings/security" element={<SecuritySettings />} />
                  <Route path="settings/team" element={<TeamSettings />} />
                  <Route path="settings/billing" element={<BillingSettings />} />
                </Route>

                {/* Admin Routes */}
                <Route
                  path="/admin"
                  element={
                    <RequireAuth>
                      <AdminLayout />
                    </RequireAuth>
                  }
                  errorElement={<RouteErrorBoundary />}
                >
                  <Route index element={<AdminDashboard />} />
                  <Route path="activity" element={<ActivityLogs />} />
                </Route>

                {/* Redirects */}
                <Route path="/" element={<Navigate to="/login" />} />
                <Route path="/app" element={<Navigate to="/onboarding" />} />

                {/* 404 Catch-all */}
                <Route path="*" element={<RouteErrorBoundary />} />
              </Routes>
              <CookieConsentBanner />
            </Router>
          </ToastProvider>
        </QueryClientProvider>
      </HelmetProvider>
    </ErrorBoundary>
  );
}

export default App;
