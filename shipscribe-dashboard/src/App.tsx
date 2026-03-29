import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import { AuthProvider } from './context/AuthContext';
import { ServerStatusProvider } from './context/ServerStatusContext';
import ProtectedRoute from './components/ProtectedRoute';
import DashboardLayout from './components/DashboardLayout';
import AdminRoute from './components/AdminRoute';
import Home from './pages/Home';
import ActivityPage from './pages/Activity';
import Tasks from './pages/Tasks';
import Summaries from './pages/Summaries';
import Posts from './pages/Posts';
import Integrations from './pages/Integrations';
import Landing from './pages/Landing';
import Login from './pages/Login';
import Signup from './pages/Signup';
import Settings from './pages/Settings';
import Onboarding from './pages/Onboarding';
import Analytics from './pages/Analytics';
import Chat from './pages/Chat';
import VoiceProjects from './pages/VoiceProjects';
import Admin from './pages/Admin';
import AuthCallback from './pages/auth/Callback';

const App: React.FC = () => {
  return (
    <AuthProvider>
      <ServerStatusProvider>
        <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Toaster 
          position="bottom-right" 
          toastOptions={{ 
            style: { 
              background: '#111111', 
              color: '#fff', 
              border: '1px solid #2A2A2A',
              borderRadius: '16px',
              fontSize: '13px',
              fontWeight: '600'
            } 
          }} 
        />
        <Routes>
          {/* Public Routes */}
          <Route path="/" element={<Landing />} />
          <Route path="/login" element={<Login />} />
          <Route path="/signup" element={<Signup />} />
          <Route path="/auth/callback" element={<AuthCallback />} />

          {/* Protected Dashboard Routes */}
          <Route element={<ProtectedRoute />}>
            <Route path="/dashboard" element={<DashboardLayout />}>
              <Route index element={<Home />} />
              <Route path="chat" element={<Chat />} />
              <Route path="activity" element={<ActivityPage />} />
              <Route path="tasks" element={<Tasks />} />
              <Route path="summaries" element={<Summaries />} />
              <Route path="voice" element={<VoiceProjects />} />
              <Route path="posts" element={<Posts />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="settings" element={<Settings />} />
            </Route>
            <Route path="/onboarding" element={<Onboarding />} />
          </Route>
          
          {/* Admin Routes */}
          <Route path="/admin" element={
            <AdminRoute>
              <Admin />
            </AdminRoute>
          } />

          {/* Catch-all redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        </Router>
      </ServerStatusProvider>
    </AuthProvider>
  );
};

export default App;
