import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Navbar from './components/Navbar';
import Sidebar from './components/Sidebar';
import Login from './pages/Login';
import ReceptionDashboard from './pages/reception/Dashboard';
import RegisterVisitor from './pages/reception/RegisterVisitor';
import VisitorHistory from './pages/reception/VisitorHistory';
import EmployeeDashboard from './pages/employee/Dashboard';
import VisitorDetail from './pages/VisitorDetail';

function AppLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      <Sidebar />
      <main className="ml-64 pt-6 px-6 pb-8">
        {children}
      </main>
    </div>
  );
}

export default function App() {
  const { isAuthenticated, user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-primary-500 border-t-transparent"></div>
      </div>
    );
  }

  return (
    <Routes>
      <Route path="/login" element={
        isAuthenticated ? (
          <Navigate to={user?.role === 'receptionist' ? '/reception/dashboard' : '/employee/dashboard'} replace />
        ) : (
          <Login />
        )
      } />

      {/* Reception Routes */}
      <Route path="/reception/dashboard" element={
        <ProtectedRoute allowedRoles={['receptionist']}>
          <AppLayout><ReceptionDashboard /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/reception/register" element={
        <ProtectedRoute allowedRoles={['receptionist']}>
          <AppLayout><RegisterVisitor /></AppLayout>
        </ProtectedRoute>
      } />
      <Route path="/reception/history" element={
        <ProtectedRoute allowedRoles={['receptionist']}>
          <AppLayout><VisitorHistory /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Employee Routes */}
      <Route path="/employee/dashboard" element={
        <ProtectedRoute allowedRoles={['employee']}>
          <AppLayout><EmployeeDashboard /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Shared Routes */}
      <Route path="/visitors/:id" element={
        <ProtectedRoute>
          <AppLayout><VisitorDetail /></AppLayout>
        </ProtectedRoute>
      } />

      {/* Default redirect */}
      <Route path="*" element={
        <Navigate to={
          isAuthenticated
            ? user?.role === 'receptionist' ? '/reception/dashboard' : '/employee/dashboard'
            : '/login'
        } replace />
      } />
    </Routes>
  );
}
