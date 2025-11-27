import React, { useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import DashboardLayout from '@/layouts/DashboardLayout';
import DashboardPage from '@/pages/DashboardPage';
import ProfilePage from '@/pages/ProfilePage';
import { useAuthStore } from '@/stores/authStore';

const queryClient = new QueryClient();

// Protected route wrapper
function RequireAuth() {
    const { isAuthenticated, isLoading, checkAuth } = useAuthStore();

    useEffect(() => {
        checkAuth();
    }, [checkAuth]);

    if (isLoading) return <div className="flex h-screen items-center justify-center">Loading...</div>;

    // We might need a better way to handle initial load vs unauthenticated
    // For now, if not authenticated after loading, redirect.
    if (!isAuthenticated) return <Navigate to="/login" replace />;

    return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<DashboardLayout />}>
             <Route index element={<DashboardPage />} />
             <Route path="profile" element={<ProfilePage />} />
             <Route path="settings" element={<div>Settings Placeholder</div>} />
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
