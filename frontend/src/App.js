import React from 'react';
import './App.css';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { DarkModeProvider } from './context/DarkModeContext';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Register from './pages/Register';
import NewReport from './pages/NewReport';
import Admin from './pages/Admin';

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }
  if (user) return <Navigate to="/" replace />;
  return children;
};

function AppContent() {
  return (
    <div className="App">
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/iniciar-sesion" element={<PublicRoute><Login /></PublicRoute>} />
        <Route path="/registro" element={<PublicRoute><Register /></PublicRoute>} />
        <Route path="/nuevo-reporte" element={<ProtectedRoute><NewReport /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute adminOnly><Admin /></ProtectedRoute>} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <DarkModeProvider>
          <AppContent />
        </DarkModeProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}

export default App;