import React, { useState, useEffect } from 'react';
import {
  Users,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Plus,
  Wallet,
  BrainCircuit,
  FileText,
  CheckCircle2,
  DollarSign,
  Zap,
  Bell,
  Sparkles,
  Lightbulb,
  X,
  Network,
  Check
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import NotificationBell from './NotificationBell';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar
} from 'recharts';
import AddPatientModal from './AddPatientModal';
import PushNotificationManager from './PushNotificationManager';

interface DashboardProps {
  isDarkMode?: boolean;
  onOpenNotifications?: () => void;
  privacyMode?: boolean;
  onChangeView?: (view: any) => void;
  therapist?: any;
}

const Dashboard: React.FC<DashboardProps> = ({ isDarkMode = false, onOpenNotifications, privacyMode = false, therapist }) => {
  const [showAiInsights, setShowAiInsights] = useState(true);
  const [isAddPatientModalOpen, setIsAddPatientModalOpen] = useState(false);
  const [stats, setStats] = useState({
    patients: 0,
    sessionsToday: 0,
    revenue: 0,
    productivity: 0
  });
  const [weeklyActivity, setWeeklyActivity] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [referrals, setReferrals] = useState<any[]>([]);

  useEffect(() => {
    const fetchStats = async () => {
      if (!therapist?.id) return;
      try {
        const response = await fetch(`/api/dashboard?therapistId=${therapist.id}`);
        if (response.ok) {
          const data = await response.json();
          setStats(data.stats);
          setWeeklyActivity(data.weeklyActivity || []);
        }
      } catch (error) {
        console.error("Error fetching dashboard stats:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchStats();

    // Fetch Pending Referrals (Transbordo)
    const fetchReferrals = async () => {
      if (!therapist?.id) return;
      const { data, error } = await supabase
        .from('referrals')
        .select('*')
        .eq('target_therapist_id', therapist.id)
        .eq('status', 'pending');

      if (data) setReferrals(data);
    };
    fetchReferrals();
  }, [therapist]);

  const handleReferralAction = async (id: string, action: 'accepted' | 'rejected') => {
    try {
      const { error } = await supabase
        .from('referrals')
        .update({ status: action, updated_at: new Date().toISOString() })
        .eq('id', id);

      if (error) throw error;

      setReferrals(prev => prev.filter(r => r.id !== id));

      if (action === 'accepted') {
        alert('Indicação aceita! Entre em contato com o paciente.');
      }
    } catch (err) {
      console.error('Error updating referral:', err);
      alert('Erro ao processar indicação.');
    }
  };

  const formatValue = (val: string, isPrivate: boolean) => {
    return privacyMode && isPrivate ? '••••' : val;
  };

  const bookingLink = therapist?.id ? `${window.location.origin}/agendar/${therapist.id}` : '';

  const copyLink = () => {
    if (bookingLink) {
      navigator.clipboard.writeText(bookingLink);
      alert('Link copiado!');
    }
  };

  return (
    <div className="space-y-6 animate-fade-in pb-20 md:pb-0">
      <PushNotificationManager />

      {/* Header & Quick Actions */}
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="flex items-start justify-between w-full lg:w-auto">
          <div>
            <h1 className="text-2xl font-bold text-slate-800 dark:text-white">Painel Geral</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm md:text-base mt-1">
              Bem-vindo de volta, {therapist?.name || 'Terapeuta'}.
            </p>
          </div>
        </div>

        {/* Quick Actions Bar */}
        <div className="flex items-center gap-3 overflow-x-auto lg:overflow-visible pb-2 lg:pb-0 no-scrollbar w-full lg:w-auto">
          <button
            onClick={() => setIsAddPatientModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2 bg-primary-600 dark:bg-secondary-600 text-white rounded-xl shadow-lg shadow-primary-500/20 dark:shadow-secondary-600/20 hover:bg-primary-700 dark:hover:bg-secondary-700 transition-all active:scale-95 whitespace-nowrap"
          >
            <Plus size={18} />
            <span className="font-bold text-sm">Novo Paciente</span>
          </button>

          <NotificationBell
            role="therapist"
            className="p-2.5 bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200 dark:border-slate-700 rounded-xl hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors relative group flex items-center justify-center"
          />
        </div>
      </div>

      {/* Referrals / Transbordo Section - ONLY SHOW IF PENDING ITEMS EXIST */}
      {referrals.length > 0 && (
        <div className="bg-gradient-to-r from-violet-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10">
            <Network size={120} />
          </div>

          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-white/20 rounded-lg backdrop-blur-sm">
                <Network size={24} className="text-white" />
              </div>
              <h3 className="text-xl font-bold">Oportunidades de Transbordo</h3>
              <span className="bg-white/20 px-2 py-0.5 rounded text-xs font-medium backdrop-blur-sm">
                {referrals.length} pendente{referrals.length > 1 ? 's' : ''}
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {referrals.map((referral) => (
                <div key={referral.id} className="bg-white/10 backdrop-blur-md rounded-xl p-4 border border-white/10 hover:bg-white/20 transition-colors">
                  <p className="font-semibold text-lg">{referral.patient_name}</p>
                  <p className="text-sm opacity-80 mb-3 line-clamp-2">{referral.patient_needs || 'Sem descrição'}</p>
                  <div className="flex items-center justify-between text-xs opacity-70 mb-4">
                    <span>Contato: {referral.patient_contact?.slice(0, 4)}...</span>
                    <span>Comissão: 10%</span>
                  </div>

                  <div className="flex gap-2">
                    <button
                      onClick={() => handleReferralAction(referral.id, 'accepted')}
                      className="flex-1 bg-white text-indigo-600 py-2 rounded-lg font-bold text-sm hover:bg-indigo-50 transition-colors flex items-center justify-center gap-1"
                    >
                      <Check size={14} /> Aceitar
                    </button>
                    <button
                      onClick={() => handleReferralAction(referral.id, 'rejected')}
                      className="px-3 py-2 bg-white/10 rounded-lg hover:bg-red-500/20 text-white transition-colors"
                    >
                      <X size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: 'Clientes Ativos', value: stats.patients.toString(), sub: 'Total cadastrado', icon: Users, color: 'bg-blue-500', trend: 'neutral', isPrivate: false },
          { label: 'Receita (Estimada)', value: `R$ ${stats.revenue}`, sub: 'Baseado em agendamentos', icon: Wallet, color: 'bg-emerald-500', trend: 'neutral', isPrivate: true },
          { label: 'Sessões Hoje', value: stats.sessionsToday.toString(), sub: 'Agendadas para hoje', icon: Calendar, color: 'bg-primary-500', trend: 'neutral', isPrivate: false },
          { label: 'Produtividade', value: `${stats.productivity}%`, sub: 'Taxa de ocupação', icon: Activity, color: 'bg-amber-500', trend: 'neutral', isPrivate: false },
        ].map((stat, i) => (
          <div key={i} className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:shadow-md transition-all group">
            <div className="flex justify-between items-start mb-4">
              <div className={`p-3 rounded-xl text-white shadow-lg shadow-opacity-20 ${stat.color} group-hover:scale-110 transition-transform`}>
                <stat.icon size={22} />
              </div>
            </div>
            <h3 className="text-2xl font-bold text-slate-800 dark:text-white mb-1">{formatValue(stat.value, stat.isPrivate)}</h3>
            <p className="text-xs font-medium text-slate-500 dark:text-slate-400 uppercase tracking-wider">{stat.label}</p>
            <p className="text-xs text-slate-400 mt-1">{stat.sub}</p>
          </div>
        ))}
      </div>

      {/* Activity & Financial Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Weekly Activity Bar Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6">Atividade Semanal</h3>
          {weeklyActivity.length > 0 ? (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyActivity}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#334155" opacity={0.1} />
                  <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#94a3b8', fontSize: 12 }} />
                  <Tooltip cursor={{ fill: 'transparent' }} contentStyle={{ borderRadius: '8px', border: 'none', backgroundColor: '#1e293b', color: '#fff' }} />
                  <Bar dataKey="sessions" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="h-[250px] w-full flex flex-col items-center justify-center text-slate-400">
              <Activity size={48} className="mb-2 opacity-20" />
              <p>Sem atividade recente</p>
            </div>
          )}
        </div>
      </div>

      <AddPatientModal
        isOpen={isAddPatientModalOpen}
        onClose={() => setIsAddPatientModalOpen(false)}
        therapistId={therapist?.id}
        onSuccess={() => window.location.reload()}
      />
    </div>
  );
};

export default Dashboard;