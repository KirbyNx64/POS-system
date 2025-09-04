import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useApp } from '../contexts/AppContext';
import { useFirebaseAuth } from '../hooks/useFirebaseAuth';
import Login from './Auth/Login';
import EmailVerificationGuard from './Auth/EmailVerificationGuard';
import Dashboard from './Dashboard/Dashboard';
import Products from './Products/Products';
import Sales from './Sales/Sales';
import Reports from './Reports/Reports';
import Settings from './Settings/Settings';
import FirestoreTest from './FirestoreTest';
import FirebaseDebug from './FirebaseDebug';
import Layout from './Layout/Layout';

function AppRouter() {
  const { state } = useApp();
  const { user, loading } = useFirebaseAuth();

  // Mostrar loading mientras se verifica la autenticación
  if (loading) {
    return (
      <div style={{ 
        display: 'flex', 
        justifyContent: 'center', 
        alignItems: 'center', 
        height: '100vh',
        fontSize: '18px'
      }}>
        Verificando autenticación...
      </div>
    );
  }

  // Si no hay usuario autenticado, mostrar login
  if (!user && !state.user) {
    return <Login />;
  }

  // Si hay usuario pero no está verificado, el EmailVerificationGuard lo manejará
  // No hacer nada aquí, dejar que el guard decida qué mostrar

  return (
    <EmailVerificationGuard>
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/products" element={<Products />} />
          <Route path="/sales" element={<Sales />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/firestore-test" element={<FirestoreTest />} />
          <Route path="/firebase-debug" element={<FirebaseDebug />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Routes>
      </Layout>
    </EmailVerificationGuard>
  );
}

export default AppRouter;
