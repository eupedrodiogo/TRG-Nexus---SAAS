import React, { useState, useEffect } from 'react';
import { Menu, BrainCircuit, Bell, X, Info, CheckCircle2 } from 'lucide-react';
import { Suspense } from 'react';
import ErrorBoundary from './components/ErrorBoundary';
import Sidebar from './components/Sidebar';
import Dashboard from './components/Dashboard';
import PatientsList from './components/PatientsList';
import SessionView from './components/SessionView';
import CalendarView from './components/CalendarView';
import FinancialView from './components/FinancialView';
import SettingsView from './components/SettingsView';
import MarketingView from './components/MarketingView';
import LoginView from './components/LoginView';
import LandingPage from './components/LandingPage';
import AiAssistant from './components/AiAssistant';
import ReportsView from './components/ReportsView';
import BookingWizard from './components/PatientBooking/BookingWizard';
import PatientLandingPage from './components/PatientBooking/PatientLandingPage';
import { AppView, NotificationItem } from './types';
import { MOCK_APPOINTMENTS, MOCK_NOTIFICATIONS } from './constants';

interface Notification {
  visible: boolean;
  title: string;
  message: string;
}

const App: React.FC = () => {
  // Check for public booking routes
  const [currentPublicRoute, setCurrentPublicRoute] = useState<string | null>(() => {
    if (typeof window !== 'undefined') {
      if (window.location.pathname === '/agendar') return '/agendar';
      if (window.location.pathname === '/inicio') return '/inicio';
    }
    return null;
  });

  // Auth State
  const [isAuthenticated, setIsAuthenticated] = useState(() => {
    return localStorage.getItem('TRG_AUTH') === 'true';
  });

  // View State for Unauthenticated Users: 'landing' or 'login'
  const [authView, setAuthView] = useState<'landing' | 'login'>('landing');

  // Theme State
  const [isDarkMode, setIsDarkMode] = useState(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('theme');
      return saved === 'dark' || (!saved && window.matchMedia('(prefers-color-scheme: dark)').matches);
    }
    return false;
  });

  // Privacy Mode State
  const [isPrivacyMode, setIsPrivacyMode] = useState(false);

  // State for Mobile Drawer
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // State for Desktop Sidebar (Collapsed vs Expanded)
  const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);

  // State for Right Notification Drawer
  const [isNotificationDrawerOpen, setIsNotificationDrawerOpen] = useState(false);

  const [currentView, setCurrentView] = useState<AppView>(AppView.DASHBOARD);

  const [patientIdToView, setPatientIdToView] = useState<string | null>(null);
  const [notification, setNotification] = useState<Notification | null>(null);
  const [notificationsHistory, setNotificationsHistory] = useState<NotificationItem[]>(MOCK_NOTIFICATIONS);

  useEffect(() => {
    const handlePopState = () => {
      const path = window.location.pathname;
      if (path === '/agendar' || path === '/inicio') {
        setCurrentPublicRoute(path);
      } else {
        setCurrentPublicRoute(null);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  useEffect(() => {
    const root = window.document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDarkMode]);

  const toggleTheme = () => setIsDarkMode(!isDarkMode);
  const togglePrivacy = () => setIsPrivacyMode(!isPrivacyMode);

  const handleLogin = () => {
    localStorage.setItem('TRG_AUTH', 'true');
    setIsAuthenticated(true);
  };

  const handleLogout = () => {
    localStorage.removeItem('TRG_AUTH');
    setIsAuthenticated(false);
    setAuthView('landing');
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    const checkUpcomingAppointments = () => {
      const todayStr = new Date().toISOString().split('T')[0];
      const upcoming = MOCK_APPOINTMENTS.find(apt =>
        apt.date === todayStr && apt.status === 'Agendado'
      );

      if (upcoming) {
        const timer = setTimeout(() => {
          setNotification({
            visible: true,
            title: 'Lembrete de Sessão',
            message: `Sessão com ${upcoming.patientName} (${upcoming.type}) agendada para às ${upcoming.time}.`
          });

          const newNotif: NotificationItem = {
            id: Date.now().toString(),
            title: 'Lembrete de Sessão',
            message: `Sessão com ${upcoming.patientName} hoje às ${upcoming.time}`,
            time: 'Agora',
            read: false,
            type: 'info'
          };
          setNotificationsHistory(prev => [newNotif, ...prev]);

        }, 2000);

        return () => clearTimeout(timer);
      }
    };

    const cleanup = checkUpcomingAppointments();
    return cleanup;
  }, [isAuthenticated]);

  const handleViewChange = (view: AppView) => {
    setCurrentView(view);
    setPatientIdToView(null);
    setIsMobileMenuOpen(false);
  };

  const handleNavigateToPatient = (patientId: string) => {
    setPatientIdToView(patientId);
    setCurrentView(AppView.PATIENTS);
    setIsMobileMenuOpen(false);
  };

  const renderContent = () => {
    switch (currentView) {
      case AppView.DASHBOARD:
        return <Dashboard isDarkMode={isDarkMode} onOpenNotifications={() => setIsNotificationDrawerOpen(true)} privacyMode={isPrivacyMode} />;
      case AppView.AGENDA:
        return <CalendarView onNavigateToPatient={handleNavigateToPatient} />;
      case AppView.PATIENTS:
        return <PatientsList highlightPatientId={patientIdToView} />;
      case AppView.THERAPY:
        return <SessionView />;
      case AppView.REPORTS:
        return <ReportsView />;
      case AppView.FINANCIAL:
        return <FinancialView />;
      case AppView.MARKETING:
        return <MarketingView />;
      case AppView.SETTINGS:
        return <SettingsView />;
      default:
        return <Dashboard isDarkMode={isDarkMode} onOpenNotifications={() => setIsNotificationDrawerOpen(true)} privacyMode={isPrivacyMode} />;
    }
  };

  const dismissNotification = () => {
    setNotification(prev => prev ? { ...prev, visible: false } : null);
  };

  const markAllAsRead = () => {
    setNotificationsHistory(prev => prev.map(n => ({ ...n, read: true })));
  };

  if (currentPublicRoute === '/agendar') {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>}>
        <BookingWizard />
      </Suspense>
    );
  }

  if (currentPublicRoute === '/inicio') {
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>}>
        <PatientLandingPage />
      </Suspense>
    );
  }

  if (!isAuthenticated) {
    if (authView === 'landing') {
      return (
        <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>}>
          <LandingPage onLoginClick={() => setAuthView('login')} />
        </Suspense>
      );
    }
    return (
      <Suspense fallback={<div className="min-h-screen flex items-center justify-center text-slate-500">Carregando...</div>}>
        <LoginView onLogin={handleLogin} onBack={() => setAuthView('landing')} />
      </Suspense>
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden font-sans transition-colors duration-300 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-50 text-slate-900'}`}>

      {/* Integrate AI Assistant - Pass Current Context */}
      <AiAssistant currentView={currentView} />

      {isMobileMenuOpen && (
        <div
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden transition-opacity duration-300"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {isNotificationDrawerOpen && (
        <div
          className="fixed inset-0 bg-slate-900/20 backdrop-blur-sm z-50 transition-opacity"
          onClick={() => setIsNotificationDrawerOpen(false)}
        ></div>
      )}

      <Sidebar
        isMobileOpen={isMobileMenuOpen}
        toggleMobile={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        isDesktopCollapsed={isDesktopCollapsed}
        toggleDesktop={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
        currentView={currentView}
        onChangeView={handleViewChange}
        isDarkMode={isDarkMode}
        toggleTheme={toggleTheme}
        isPrivacyMode={isPrivacyMode}
        togglePrivacy={togglePrivacy}
      />

      <main className="flex-1 flex flex-col h-full w-full overflow-hidden relative transition-all duration-300">

        <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 md:hidden shrink-0 z-30 transition-colors">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 -ml-2 flex items-center justify-center text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full active:scale-95 transition-all"
              aria-label="Abrir Menu"
            >
              <Menu size={24} />
            </button>
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-500 to-primary-700 flex items-center justify-center shadow-primary-500/20">
                <BrainCircuit size={18} className="text-white" />
              </div>
              <span className="font-bold text-lg text-slate-800 dark:text-white tracking-tight">TRG<span className="text-primary-500 dark:text-secondary-400">Nexus</span></span>
            </div>
          </div>
          <button
            onClick={() => setIsNotificationDrawerOpen(true)}
            className="w-8 h-8 rounded-full bg-slate-200 dark:bg-slate-800 border border-slate-300 dark:border-slate-700 flex items-center justify-center text-slate-600 dark:text-slate-300 relative"
          >
            <Bell size={16} />
            <div className="absolute top-0 right-0 w-2 h-2 bg-red-500 rounded-full"></div>
          </button>
        </header>

        <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 md:p-6 lg:p-8 scroll-smooth">
          <div className="max-w-7xl mx-auto min-h-full">
            <ErrorBoundary fallback={<div className="p-6 text-red-600">Falha ao renderizar conteúdo. Tente novamente.</div>}>
              {renderContent()}
            </ErrorBoundary>
          </div>
        </div>

        <div className={`fixed inset-y-0 right-0 w-80 bg-white dark:bg-slate-900 shadow-2xl z-[60] transform transition-transform duration-300 ease-in-out border-l border-slate-100 dark:border-slate-800 ${isNotificationDrawerOpen ? 'translate-x-0' : 'translate-x-full'}`}>
          <div className="flex flex-col h-full">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50 dark:bg-slate-950">
              <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                <Bell size={18} /> Notificações
              </h3>
              <button onClick={() => setIsNotificationDrawerOpen(false)} className="text-slate-400 hover:text-slate-600 dark:hover:text-white">
                <X size={20} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {notificationsHistory.map((notif) => (
                <div key={notif.id} className={`p-3 rounded-xl border transition-colors ${notif.read ? 'bg-white dark:bg-slate-900 border-slate-100 dark:border-slate-800 opacity-70' : 'bg-blue-50 dark:bg-blue-900/10 border-blue-100 dark:border-blue-900/30'}`}>
                  <div className="flex justify-between items-start mb-1">
                    <span className={`text-[10px] font-bold uppercase tracking-wider ${notif.type === 'alert' ? 'text-red-500' : notif.type === 'success' ? 'text-green-500' : 'text-blue-500'}`}>
                      {notif.type === 'alert' ? 'Alerta' : notif.type === 'success' ? 'Sucesso' : 'Info'}
                    </span>
                    <span className="text-[10px] text-slate-400">{notif.time}</span>
                  </div>
                  <h4 className="font-bold text-sm text-slate-800 dark:text-white">{notif.title}</h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">{notif.message}</p>
                </div>
              ))}

              {notificationsHistory.length === 0 && (
                <div className="text-center py-10 text-slate-400">
                  <Bell size={32} className="mx-auto mb-2 opacity-20" />
                  <p className="text-sm">Nenhuma notificação.</p>
                </div>
              )}
            </div>

            <div className="p-4 border-t border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
              <button
                onClick={markAllAsRead}
                className="w-full py-2 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-lg text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors"
              >
                Marcar todas como lidas
              </button>
            </div>
          </div>
        </div>

        {notification && notification.visible && (
          <div className="fixed bottom-6 right-4 md:right-8 z-[70] animate-slide-up">
            <div className="bg-white dark:bg-slate-900 rounded-xl shadow-2xl shadow-slate-200/50 dark:shadow-black/50 border border-slate-100 dark:border-slate-800 p-4 flex items-start gap-4 max-w-[90vw] sm:max-w-sm ring-1 ring-black/5 dark:ring-white/10">
              <div className="bg-secondary-500/10 p-2 rounded-full shrink-0">
                <Bell size={20} className="text-secondary-500" />
              </div>
              <div className="flex-1 pt-0.5">
                <h4 className="text-sm font-bold text-slate-800 dark:text-white">{notification.title}</h4>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">{notification.message}</p>
                <div className="mt-3 flex gap-3">
                  <button
                    onClick={dismissNotification}
                    className="text-xs font-semibold text-primary-600 dark:text-secondary-400 hover:text-primary-700 dark:hover:text-secondary-300 transition-colors"
                  >
                    Confirmar
                  </button>
                  <button
                    onClick={dismissNotification}
                    className="text-xs font-semibold text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors"
                  >
                    Dispensar
                  </button>
                </div>
              </div>
              <button
                onClick={dismissNotification}
                className="text-slate-300 hover:text-slate-500 dark:hover:text-slate-200 transition-colors -mr-1 -mt-1 p-1"
              >
                <X size={16} />
              </button>
            </div>
          </div>
        )}

      </main>
    </div>
  );
};

export default App;
