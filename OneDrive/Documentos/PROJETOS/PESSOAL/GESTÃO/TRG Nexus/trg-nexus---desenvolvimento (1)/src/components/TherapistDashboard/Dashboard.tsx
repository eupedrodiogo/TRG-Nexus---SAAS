import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';
import Sidebar from '../Sidebar';
import { AppView } from 'types';
import usePlanAccess from '../../hooks/usePlanAccess';
import UpgradeModal from '../Shared/UpgradeModal';
import MainDashboard from '../Dashboard';
import PatientsList from '../PatientsList';
import CalendarView from '../CalendarView';
import SessionView from '../SessionView';
import FinancialView from '../FinancialView';
import MarketingView from '../MarketingView';
import ReportsView from '../ReportsView';
import SettingsView from '../SettingsView';
import { Loader2 } from 'lucide-react';
import PasswordSetupModal from '../Auth/PasswordSetupModal';
import AiAssistant from '../AiAssistant';


import { useTheme } from '../../contexts/ThemeContext';

const TherapistDashboard: React.FC = () => {
    const navigate = useNavigate();
    const [searchParams, setSearchParams] = useSearchParams();

    const [currentView, setCurrentView] = useState<AppView>(() => {
        const viewParam = searchParams.get('view');
        // Check if the param is a valid AppView value
        if (viewParam && Object.values(AppView).includes(viewParam as AppView)) {
            return viewParam as AppView;
        }
        return AppView.DASHBOARD;
    });

    // Sync state to URL
    useEffect(() => {
        setSearchParams({ view: currentView });
    }, [currentView, setSearchParams]);

    // Protect against direct URL access to restricted views
    useEffect(() => {
        if (!hasAccess(currentView)) {
            const viewLabels: Record<AppView, string> = {
                [AppView.DASHBOARD]: 'Painel Geral',
                [AppView.AGENDA]: 'Agenda',
                [AppView.PATIENTS]: 'Clientes',
                [AppView.THERAPY]: 'Sessão TRG',
                [AppView.FINANCIAL]: 'Financeiro',
                [AppView.MARKETING]: 'Marketing & CRM',
                [AppView.REPORTS]: 'Relatórios',
                [AppView.SETTINGS]: 'Configurações',
            };
            setUpgradeModal({ isOpen: true, featureName: viewLabels[currentView] });
            setCurrentView(AppView.DASHBOARD); // Redirect to allowed view
        }
    }, [currentView, hasAccess]);

    const [isMobileOpen, setIsMobileOpen] = useState(false);
    const [isDesktopCollapsed, setIsDesktopCollapsed] = useState(false);
    // const [isDarkMode, setIsDarkMode] = useState(false); // Managed by Context
    const { isDarkMode, toggleTheme } = useTheme();

    const [therapist, setTherapist] = useState<any>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [showPasswordSetup, setShowPasswordSetup] = useState(false);
    const [upgradeModal, setUpgradeModal] = useState<{ isOpen: boolean; featureName?: string }>({ isOpen: false });

    // Plan access control
    const { hasAccess } = usePlanAccess();

    // Load therapist data and theme
    const { user } = useAuth();

    // Load therapist data and theme
    useEffect(() => {
        const fetchTherapist = async () => {
            try {
                if (!user) return;

                // Fetch Profile
                const { data: profile, error } = await supabase
                    .from('therapists')
                    .select('*')
                    .eq('id', user.id)
                    .single();

                if (error && error.code !== 'PGRST116') {
                    console.error('Error fetching profile:', error);
                }

                if (profile) {
                    setTherapist(profile);
                    localStorage.setItem('therapist', JSON.stringify(profile));
                } else {
                    // Fallback using Auth Metadata (Rich Data)
                    setTherapist({
                        name: user.user_metadata?.name || user.email?.split('@')[0] || 'Terapeuta',
                        email: user.email,
                        phone: user.user_metadata?.phone || '',
                        subscription_status: 'active' // Default or fetch from DB
                    });
                }

            } catch (err) {
                console.error(err);
            } finally {
                setIsLoading(false);
            }
        };

        if (user) {
            fetchTherapist();
        } else {
            // If accessed directly without auth (should be caught by ProtectedRoute, but safe fallback)
            setIsLoading(true);
        }

        // Check if user needs to set a password (for Magic Link users)
        if (user && user.user_metadata && !user.user_metadata.has_set_password) {
            // Delay slightly to ensure load
            setTimeout(() => setShowPasswordSetup(true), 1000);
        }

        // Theme check -> NOW HANDLED BY CONTEXT
    }, [user]);

    const handleNavigateToPatient = (id: string) => {
        // This function allows components to switch to the patient view
        // For now, we just switch to the Patients view, but ideally we would pass the ID
        setCurrentView(AppView.PATIENTS);
        // You might need to add a way to pass the selected patient ID to PatientsList
        // For example, using a context or a separate state variable lifted up here
    };

    if (isLoading) {
        return <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-slate-950"><Loader2 className="animate-spin text-primary-600" size={40} /></div>;
    }

    const renderView = () => {
        switch (currentView) {
            case AppView.DASHBOARD:
                return <MainDashboard onChangeView={setCurrentView} therapist={therapist} />;
            case AppView.PATIENTS:
                return <PatientsList onNavigateToSession={() => setCurrentView(AppView.THERAPY)} />;
            case AppView.AGENDA:
                return <CalendarView
                    onNavigateToPatient={handleNavigateToPatient}
                    onNavigateToSession={() => setCurrentView(AppView.THERAPY)}
                />;
            case AppView.THERAPY:
                return <SessionView />;
            case AppView.FINANCIAL:
                return <FinancialView />;
            case AppView.MARKETING:
                return <MarketingView />;
            case AppView.REPORTS:
                return <ReportsView />;
            case AppView.SETTINGS:
                return <SettingsView />;
            default:
                return <Dashboard onChangeView={setCurrentView} />;
        }
    };

    const handleLogout = async () => {
        try {
            await supabase.auth.signOut();
        } catch (error) {
            console.error('Error signing out:', error);
        } finally {
            localStorage.removeItem('therapist');
            navigate('/login', { replace: true });
        }
    };

    return (
        <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 transition-colors duration-300">
            <Sidebar
                isMobileOpen={isMobileOpen}
                toggleMobile={() => setIsMobileOpen(!isMobileOpen)}
                isDesktopCollapsed={isDesktopCollapsed}
                toggleDesktop={() => setIsDesktopCollapsed(!isDesktopCollapsed)}
                currentView={currentView}
                onChangeView={(view) => {
                    setCurrentView(view);
                    setIsMobileOpen(false);
                }}
                isDarkMode={isDarkMode}
                toggleTheme={toggleTheme}
                onLogout={handleLogout}
            />

            <main className={`flex-1 transition-all duration-300 ease-in-out ${isDesktopCollapsed ? 'md:ml-20' : 'md:ml-0'} overflow-x-hidden`}>
                {/* Mobile Header Spacer */}
                <div className="md:hidden h-16" />

                {/* Mobile Header */}
                <header className="md:hidden fixed top-0 left-0 right-0 h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 z-40">
                    <button onClick={() => setIsMobileOpen(true)} className="p-2 text-slate-600 dark:text-slate-300">
                        <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="3" y1="12" x2="21" y2="12"></line><line x1="3" y1="6" x2="21" y2="6"></line><line x1="3" y1="18" x2="21" y2="18"></line></svg>
                    </button>
                    <span className="font-bold text-slate-800 dark:text-white">TRG Nexus</span>
                    <div className="w-8" />
                </header>

                <div className="p-4 md:p-8 max-w-[1600px] mx-auto">
                    {renderView()}
                </div>
            </main>

            {/* Mobile Overlay */}
            {isMobileOpen && (
                <div
                    className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm"
                    onClick={() => setIsMobileOpen(false)}
                />
            )}

            <PasswordSetupModal
                isOpen={showPasswordSetup}
                onSuccess={() => setShowPasswordSetup(false)}
            />

            <AiAssistant currentView={currentView} />

            <UpgradeModal
                isOpen={upgradeModal.isOpen}
                onClose={() => setUpgradeModal({ isOpen: false })}
                featureName={upgradeModal.featureName}
            />
        </div>
    );
};

export default TherapistDashboard;
