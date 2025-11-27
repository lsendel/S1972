import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import Login from '@/pages/auth/Login';
import Signup from '@/pages/auth/Signup';
import { useAuth } from '@/hooks/useAuth';

const queryClient = new QueryClient();

// Placeholder for protected route wrapper
function RequireAuth() {
    const { user, isLoading } = useAuth();

    if (isLoading) return <div>Loading...</div>;
    if (!user) return <Navigate to="/login" replace />;

    return <Outlet />;
}

function AppRoutes() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/signup" element={<Signup />} />

      {/* Protected Routes */}
      <Route element={<RequireAuth />}>
        <Route path="/app" element={<div>Dashboard Placeholder</div>} />
        {/* Add more app routes here */}
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
