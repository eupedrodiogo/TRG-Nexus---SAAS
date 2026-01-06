import React from 'react';
import { AppView } from '../enums';
import { useAuth } from '../contexts/AuthContext';
import {
  Users,
  Calendar,
  DollarSign,
  TrendingUp,
  Clock,
  Activity
} from 'lucide-react';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import NotificationBell from './NotificationBell';
import PushNotificationManager from './PushNotificationManager';

interface MainDashboardViewProps {
  onChangeView: (view: AppView) => void;
  therapist?: any;
}

const MainDashboardView: React.FC<MainDashboardViewProps> = ({ onChangeView, therapist }) => {
  const { user } = useAuth();

  // Mock data for charts - to be replaced with real data later
  const sessionData = [
    { name: 'Jan', sessions: 12 },
    { name: 'Fev', sessions: 19 },
    { name: 'Mar', sessions: 15 },
    { name: 'Abr', sessions: 22 },
    { name: 'Mai', sessions: 28 },
    { name: 'Jun', sessions: 35 },
  ];

  const stats = [
    {
      label: 'Pacientes Ativos',
      value: '12',
      change: '+2',
      icon: Users,
      color: 'bg-blue-500',
      onClick: () => onChangeView(AppView.PATIENTS)
    },
    {
      label: 'Sessões este Mês',
      value: '28',
      change: '+15%',
      icon: Calendar,
      color: 'bg-purple-500',
      onClick: () => onChangeView(AppView.AGENDA)
    },
    {
      label: 'Faturamento',
      value: 'R$ 4.200',
      change: '+8%',
      icon: DollarSign,
      color: 'bg-green-500',
      onClick: () => onChangeView(AppView.FINANCIAL)
    },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800 dark:text-white">
            Olá, {therapist?.name?.split(' ')[0] || 'Terapeuta'} 👋
          </h1>
          <p className="text-slate-500 dark:text-slate-400">
            Aqui está o resumo do seu consultório hoje.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <PushNotificationManager />
          <NotificationBell role="therapist" />
          <button
            onClick={() => onChangeView(AppView.AGENDA)}
            className="bg-primary-600 hover:bg-primary-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2"
          >
            <Calendar size={16} />
            Nova Sessão
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {stats.map((stat, index) => (
          <div
            key={index}
            onClick={stat.onClick}
            className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-md transition-all cursor-pointer group"
          >
            <div className="flex items-start justify-between">
              <div>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400">
                  {stat.label}
                </p>
                <h3 className="text-2xl font-bold text-slate-800 dark:text-white mt-1 group-hover:text-primary-600 transition-colors">
                  {stat.value}
                </h3>
              </div>
              <div className={`p-3 rounded-lg ${stat.color} bg-opacity-10 text-${stat.color.replace('bg-', '')}`}>
                <stat.icon size={20} className={stat.color.replace('bg-', 'text-')} />
              </div>
            </div>
            <div className="mt-4 flex items-center text-sm">
              <span className="text-green-500 font-medium flex items-center gap-1">
                <TrendingUp size={14} />
                {stat.change}
              </span>
              <span className="text-slate-400 ml-2">vs. mês passado</span>
            </div>
          </div>
        ))}
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Sessions Chart */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Evolução de Sessões
            </h3>
            <Activity size={18} className="text-slate-400" />
          </div>
          <div className="h-[300px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={sessionData}>
                <defs>
                  <linearGradient id="colorSessions" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#818cf8" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#818cf8" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis
                  dataKey="name"
                  tick={{ fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: '#94a3b8' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#fff',
                    borderRadius: '8px',
                    border: '1px solid #e2e8f0',
                    boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)'
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="sessions"
                  stroke="#6366f1"
                  strokeWidth={3}
                  fillOpacity={1}
                  fill="url(#colorSessions)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Recent Activity / Next Appointments */}
        <div className="bg-white dark:bg-slate-900 p-6 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
          <div className="flex items-center justify-between mb-6">
            <h3 className="font-semibold text-slate-800 dark:text-white">
              Próximos Agendamentos
            </h3>
            <Clock size={18} className="text-slate-400" />
          </div>

          <div className="space-y-4">
            {[
              { time: '09:00', patient: 'Maria Silva', type: 'Sessão Regular', status: 'confirmed' },
              { time: '11:00', patient: 'João Santos', type: 'Primeira Consulta', status: 'pending' },
              { time: '14:30', patient: 'Ana Oliveira', type: 'Retorno', status: 'confirmed' },
            ].map((apt, i) => (
              <div key={i} className="flex items-center p-3 rounded-lg hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors border border-transparent hover:border-slate-100 dark:hover:border-slate-700">
                <div className="bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold px-3 py-2 rounded text-sm">
                  {apt.time}
                </div>
                <div className="ml-4 flex-1">
                  <h4 className="text-sm font-medium text-slate-800 dark:text-white">{apt.patient}</h4>
                  <p className="text-xs text-slate-500">{apt.type}</p>
                </div>
                <div className={`w-2 h-2 rounded-full ${apt.status === 'confirmed' ? 'bg-green-500' : 'bg-yellow-500'}`} />
              </div>
            ))}

            <button
              onClick={() => onChangeView(AppView.AGENDA)}
              className="w-full mt-4 py-2 text-sm text-primary-600 hover:text-primary-700 font-medium text-center border border-dashed border-primary-200 rounded-lg hover:bg-primary-50 transition-colors"
            >
              Ver Agenda Completa
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MainDashboardView;