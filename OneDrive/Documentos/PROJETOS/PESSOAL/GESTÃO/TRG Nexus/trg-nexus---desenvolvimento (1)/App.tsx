import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Moon, Sun } from 'lucide-react';

// Components
import BookingWizard from './components/PatientBooking/BookingWizard';
import PatientLandingPage from './components/PatientBooking/PatientLandingPage';
import LoginPage from './components/Auth/LoginPage';
import RegisterPage from './components/Auth/RegisterPage';
import TherapistDashboard from './components/TherapistDashboard/Dashboard';
import LandingPage from './components/LandingPage';
import PaymentSuccess from './components/PaymentSuccess';
import ClientSessionView from './components/ClientSession/ClientSessionView';
import { ClientProvider } from './components/ClientPortal/ClientContext';
import ClientLogin from './components/ClientPortal/ClientLogin';
import ClientAuthHandler from './components/ClientPortal/ClientAuthHandler';
import ClientDashboard from './components/ClientPortal/ClientDashboard';
import ClientAppointments from './components/ClientPortal/ClientAppointments';
import ClientResources from './components/ClientPortal/ClientResources';
import ClientRecordings from './components/ClientPortal/ClientRecordings';
import ClientProfile from './components/ClientPortal/ClientProfile';
import ForgotPasswordPage from './components/Auth/ForgotPasswordPage';
import UpdatePasswordPage from './components/Auth/UpdatePasswordPage';
import SystemTest from './components/Admin/SystemTest';

// Protected Route Component
const ProtectedRoute = () => {
  const { user, loading } = useAuth();

  console.log('ProtectedRoute: Check', { user: user?.email, loading });

  if (loading) return <div className="min-h-screen flex items-center justify-center">Carregando...</div>;

  if (!user) {
    console.log('ProtectedRoute: No user, redirecting to login');
    return <Navigate to="/login" replace />;
  }

  return <Outlet />;
};

function AppContent() {
  const [darkMode, setDarkMode] = useState(false);

  useEffect(() => {
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches) {
      setDarkMode(true);
    }
  }, []);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [darkMode]);

  return (
    <div className={`min-h-screen transition-colors duration-300 ${darkMode ? 'dark' : ''}`}>
      {/* Theme Toggle - Floating */}
      <button
        onClick={() => setDarkMode(!darkMode)}
        className="fixed bottom-6 right-6 z-[100] p-3 rounded-full bg-white dark:bg-slate-800 text-slate-800 dark:text-white shadow-xl border border-slate-200 dark:border-slate-700 hover:scale-110 transition-all duration-300"
        title={darkMode ? "Ativar Modo Claro" : "Ativar Modo Escuro"}
      >
        {darkMode ? <Sun size={24} className="text-yellow-500" /> : <Moon size={24} className="text-slate-600" />}
      </button>

      <Routes>
        {/* Public Routes */}
        <Route path="/" element={<LandingPage onLoginClick={() => window.location.href = '/login'} isDarkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />} />
        <Route path="/success" element={<PaymentSuccess />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/update-password" element={<UpdatePasswordPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/agendar" element={<BookingWizard />} />
        <Route path="/agendar/:step" element={<BookingWizard />} />
        <Route path="/paciente/:id" element={<PatientLandingPage isDarkMode={darkMode} toggleTheme={() => setDarkMode(!darkMode)} />} />

        {/* System Test Tool */}
        <Route path="/system-test" element={<SystemTest />} />

        {/* Client Portal Routes */}
        <Route path="/sessao-cliente" element={<ClientProvider><ClientSessionView /></ClientProvider>} />
        <Route path="/sessao-cliente/:id" element={<ClientProvider><ClientSessionView /></ClientProvider>} />

        <Route path="/portal-paciente/login" element={<ClientProvider><ClientLogin /></ClientProvider>} />
        <Route path="/portal-paciente/autenticar" element={<ClientProvider><ClientAuthHandler /></ClientProvider>} />

        {/* Client Portal Protected Area (Simulated for now, should be real protected route later) */}
        <Route path="/portal-paciente" element={<ClientProvider><Outlet /></ClientProvider>}>
          <Route index element={<ClientDashboard />} />
          <Route path="agendamentos" element={<ClientAppointments />} />
          <Route path="recursos" element={<ClientResources />} />
          <Route path="gravacoes" element={<ClientRecordings />} />
          <Route path="perfil" element={<ClientProfile />} />
        </Route>

        {/* Protected Therapist Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/dashboard" element={<TherapistDashboard />} />
          {/* Add more protected routes here */}
        </Route>

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </Router>
  );
}

export default App;
