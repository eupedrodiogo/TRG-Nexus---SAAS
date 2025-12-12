
import React, { useState, useEffect } from 'react';

import {
  User,
  Building,
  Bell,
  Shield,
  Save,
  Camera,
  Mail,
  Phone,
  MapPin,
  Globe,
  CheckCircle2,
  X,
  LogOut,
  Clock,
  Plus,
  Trash2,
  HelpCircle,
  MessageSquare,
  ChevronDown,
  ChevronUp,
  Book,
  Send,
  UploadCloud,
  Palette,
  QrCode,
  FileText,
  Calendar as CalendarIcon,
  Video,
  Database,
  Download,
  Smartphone,
  Laptop,
  Search,
  PlayCircle,
  BookOpen,
  LifeBuoy,
  ExternalLink,
  AlertCircle,
  BrainCircuit,
  LayoutDashboard,
  Users,
  Wallet,
  ArrowRight,
  Menu,
  Network // Import Network Icon
} from 'lucide-react';
import { createClient } from '@supabase/supabase-js';

/* ... imports ... */

// ... (Inside Component)

const SettingsView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'profile' | 'clinic' | 'financial' | 'integrations' | 'schedule' | 'security' | 'notifications' | 'help' | 'network'>('profile');

  // Initialize Supabase Client (Frontend)
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
  const supabase = createClient(supabaseUrl, supabaseKey);

  // Load initial settings from DB
  useEffect(() => {
    const loadSettings = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        // Fetch Therapist Profile
        const { data: profile, error } = await supabase
          .from('therapists')
          .select('*')
          .eq('id', user.id) // Assuming therapist ID matches Auth ID (1:1 mapping)
          .single();

        if (profile) {
          setFormData(prev => ({
            ...prev,
            name: profile.name || prev.name,
            specialty: profile.specialty || 'Geral',
            is_verified: profile.is_verified || false,
            is_overflow_source: profile.is_overflow_source || false,
            is_overflow_target: profile.is_overflow_target || true,
            // Map other fields if they exist in DB schema...
          }));
        }
      }
    };
    loadSettings();

    // Keep existing localStorage logic for preferences that are NOT in DB yet (like theme colors etc)
    const savedSettings = localStorage.getItem('TRG_SETTINGS');
    if (savedSettings) {
      const parsed = JSON.parse(savedSettings);
      // Merge but prefer DB values for critical fields if we just loaded them? 
      // Actually simply merging non-conflicting keys:
      setFormData(prev => ({ ...prev, ...parsed, ...prev }));
    }
  }, []);

  const handleSave = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();

      if (user) {
        // 1. Update Real DB Profile
        const { error } = await supabase
          .from('therapists')
          .update({
            name: formData.name,
            specialty: formData.specialty,
            is_overflow_source: formData.is_overflow_source,
            is_overflow_target: formData.is_overflow_target,
            // Add other profile fields if your schema has them (e.g. phone, bio)
          })
          .eq('id', user.id);

        if (error) throw error;
      }

      // 2. Save Preferences to LocalStorage
      localStorage.setItem('TRG_BLOCKED_TIMES', JSON.stringify(blockedTimes));
      localStorage.setItem('TRG_SETTINGS', JSON.stringify(formData));
      showNotification('Configurações salvas no Banco de Dados!');

    } catch (err) {
      console.error('Save Error:', err);
      showNotification('Erro ao salvar. Verifique sua conexão.');
    }
  };
  // ... (State)

  const [formData, setFormData] = useState({
    // ... existing fields
    name: '',
    email: '',
    phone: '',
    crp: '',
    bio: '',
    clinicName: '',
    cnpj: '',
    address: '',
    website: '',
    brandColor: '#0ea5e9',
    pixKey: '',
    pixType: 'cpf',
    invoiceNotes: '',

    // Network / Transbordo Settings
    specialty: 'Geral',
    is_verified: false, // Read-only usually
    is_overflow_source: false,
    is_overflow_target: true,

    notifications: {
      email: true,
      push: true,
      whatsapp: false,
      marketing: false
    },
    security: {
      twoFactor: false,
      sessionTimeout: '30'
    }
  });

  // ...

  const menuItems = [
    { id: 'profile', label: 'Meu Perfil', icon: User },
    { id: 'clinic', label: 'Dados da Clínica', icon: Building },
    { id: 'network', label: 'Rede de Transbordo', icon: Network }, // New Item
    { id: 'financial', label: 'Financeiro & Fiscal', icon: FileText },
    { id: 'integrations', label: 'Integrações', icon: Globe },
    { id: 'schedule', label: 'Agenda e Horários', icon: Clock },
    { id: 'notifications', label: 'Notificações', icon: Bell },
    { id: 'security', label: 'Segurança & Dados', icon: Shield },
    { id: 'help', label: 'Ajuda e Suporte', icon: HelpCircle },
  ];

  /* ... Render Logic ... */

  {/* NETWORK TAB */ }
  {
    activeTab === 'network' && (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800 bg-gradient-to-r from-indigo-500 to-purple-600 text-white">
          <div className="flex items-center gap-4">
            <div className="p-3 bg-white/20 rounded-xl backdrop-blur-sm">
              <Network size={32} className="text-white" />
            </div>
            <div>
              <h3 className="font-bold text-xl">Rede de Transbordo</h3>
              <p className="text-indigo-100 text-sm">Conecte-se com outros terapeutas para enviar ou receber pacientes.</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-8">

          {/* 1. Receive Patients (Target) */}
          <div className="flex flex-col md:flex-row gap-6 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-2xl border border-slate-100 dark:border-slate-800">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <h4 className="font-bold text-slate-800 dark:text-white text-lg">Receber Indicações</h4>
                {formData.is_verified ? (
                  <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-bold rounded-full border border-green-200">Verificado</span>
                ) : (
                  <span className="px-2 py-0.5 bg-slate-200 text-slate-600 text-xs font-bold rounded-full">Não Verificado</span>
                )}
              </div>
              <p className="text-slate-600 dark:text-slate-400 text-sm leading-relaxed mb-4">
                Ao ativar esta opção, você aparecerá nas buscas quando outros terapeutas precisarem encaminhar pacientes (Transbordo).
                Você receberá as indicações via WhatsApp.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Sua Especialidade Principal</label>
                  <select
                    value={formData.specialty}
                    onChange={(e) => setFormData({ ...formData, specialty: e.target.value })}
                    className="w-full p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm"
                  >
                    <option value="Geral">Clínica Geral / TRG Padrão</option>
                    <option value="Ansiedade">Ansiedade e Pânico</option>
                    <option value="Depressão">Depressão</option>
                    <option value="Traumas">Traumas Complexos</option>
                    <option value="Relacionamentos">Relacionamentos</option>
                    <option value="Infantil">Infantil</option>
                  </select>
                </div>
              </div>
            </div>
            <div className="flex items-center justify-center md:border-l border-slate-200 dark:border-slate-700 md:pl-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold uppercase text-slate-400">Status</span>
                <ToggleSwitch
                  checked={formData.is_overflow_target}
                  onChange={() => setFormData({ ...formData, is_overflow_target: !formData.is_overflow_target })}
                />
                <span className={`text-sm font-bold ${formData.is_overflow_target ? 'text-green-600' : 'text-slate-400'}`}>
                  {formData.is_overflow_target ? 'Disponível' : 'Indisponível'}
                </span>
              </div>
            </div>
          </div>

          {/* 2. Send Patients (Source) */}
          <div className="flex flex-col md:flex-row gap-6 p-6 bg-red-50 dark:bg-red-900/10 rounded-2xl border border-red-100 dark:border-red-900/30">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg text-red-600">
                  <LogOut size={20} />
                </div>
                <h4 className="font-bold text-red-900 dark:text-red-200 text-lg">Modo Transbordo (Fechar Agenda)</h4>
              </div>
              <p className="text-red-800 dark:text-red-300 text-sm leading-relaxed mb-4">
                Ative esta opção quando sua agenda estiver lotada.
                Seus pacientes verão um aviso de "Agenda Lotada" e serão oferecidos a opção de buscar um
                <strong> Terapeuta Parceiro Certificado</strong> da sua confiança (Rede de Transbordo).
              </p>
            </div>
            <div className="flex items-center justify-center md:border-l border-red-200 md:pl-6">
              <div className="flex flex-col items-center gap-2">
                <span className="text-xs font-bold uppercase text-red-400">Status</span>
                <ToggleSwitch
                  checked={formData.is_overflow_source}
                  onChange={() => setFormData({ ...formData, is_overflow_source: !formData.is_overflow_source })}
                />
                <span className={`text-sm font-bold ${formData.is_overflow_source ? 'text-red-600' : 'text-slate-400'}`}>
                  {formData.is_overflow_source ? 'ATIVADO' : 'Desativado'}
                </span>
              </div>
            </div>
          </div>

        </div>
      </div>
    )
  }

  {/* FINANCIAL TAB */ }

  {
    activeTab === 'financial' && (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Dados Fiscais & Pagamento</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 dark:bg-green-900/30 rounded-lg text-green-600">
                <QrCode size={20} />
              </div>
              <div>
                <h4 className="font-bold text-green-800 dark:text-green-200">Chave PIX Padrão</h4>
                <p className="text-xs text-green-700 dark:text-green-400">Esta chave será impressa nos recibos para facilitar o pagamento.</p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Tipo de Chave</label>
                <select
                  value={formData.pixType}
                  onChange={(e) => setFormData({ ...formData, pixType: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-xl dark:text-white"
                >
                  <option value="cpf">CPF / CNPJ</option>
                  <option value="email">Email</option>
                  <option value="phone">Telefone</option>
                  <option value="random">Chave Aleatória</option>
                </select>
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Chave PIX</label>
                <input
                  type="text"
                  value={formData.pixKey}
                  onChange={(e) => setFormData({ ...formData, pixKey: e.target.value })}
                  className="w-full p-2.5 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-xl dark:text-white font-mono"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Notas de Rodapé (Recibos)</label>
            <textarea
              rows={3}
              className="w-full p-4 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-primary-500 dark:text-white resize-none"
              value={formData.invoiceNotes}
              onChange={(e) => setFormData({ ...formData, invoiceNotes: e.target.value })}
              placeholder="Ex: Documento para fins de reembolso..."
            />
          </div>
        </div>
      </div>
    )
  }

  {/* INTEGRATIONS TAB */ }
  {
    activeTab === 'integrations' && (
      <div className="space-y-6 animate-fade-in">
        <div className="grid grid-cols-1 gap-4">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 rounded-xl flex items-center justify-center text-blue-600">
                <CalendarIcon size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">Google Calendar</h4>
                <p className="text-sm text-slate-500">Sincronize agendamentos automaticamente.</p>
              </div>
            </div>
            <ToggleSwitch checked={integrations.googleCalendar} onChange={() => setIntegrations({ ...integrations, googleCalendar: !integrations.googleCalendar })} />
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center text-white">
                <Video size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">Zoom Meetings</h4>
                <p className="text-sm text-slate-500">Gera links de reunião para sessões remotas.</p>
              </div>
            </div>
            <ToggleSwitch checked={integrations.zoom} onChange={() => setIntegrations({ ...integrations, zoom: !integrations.zoom })} />
          </div>

          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-[#635BFF] rounded-xl flex items-center justify-center text-white">
                <Globe size={24} />
              </div>
              <div>
                <h4 className="font-bold text-slate-800 dark:text-white">Stripe Payments</h4>
                <p className="text-sm text-slate-500">Processe cartões de crédito e boletos.</p>
              </div>
            </div>
            <ToggleSwitch checked={integrations.stripe} onChange={() => setIntegrations({ ...integrations, stripe: !integrations.stripe })} />
          </div>
        </div>
      </div>
    )
  }

  {/* SCHEDULE TAB */ }
  {
    activeTab === 'schedule' && (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden transition-colors">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Bloqueios de Agenda</h3>
          </div>

          <div className="p-6 bg-slate-50 dark:bg-slate-950/50 border-b border-slate-100 dark:border-slate-800">
            <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-3">Adicionar Novo Bloqueio</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <select
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                value={newBlock.day}
                onChange={(e) => setNewBlock({ ...newBlock, day: e.target.value })}
              >
                {weekDays.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}
              </select>
              <div className="flex items-center gap-2">
                <input
                  type="time"
                  className="flex-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  value={newBlock.start}
                  onChange={(e) => setNewBlock({ ...newBlock, start: e.target.value })}
                />
                <span className="text-slate-400">-</span>
                <input
                  type="time"
                  className="flex-1 p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                  value={newBlock.end}
                  onChange={(e) => setNewBlock({ ...newBlock, end: e.target.value })}
                />
              </div>
              <input
                type="text"
                placeholder="Rótulo (ex: Almoço)"
                className="p-2.5 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white"
                value={newBlock.label}
                onChange={(e) => setNewBlock({ ...newBlock, label: e.target.value })}
              />
              <button
                onClick={addBlockedTime}
                className="bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
              >
                <Plus size={18} /> Adicionar
              </button>
            </div>
          </div>

          <div className="p-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4">Bloqueios Ativos</h4>
            <div className="space-y-2">
              {blockedTimes.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum horário bloqueado.</p>}
              {blockedTimes.map(block => (
                <div key={block.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl">
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-900/20 text-red-500 flex items-center justify-center">
                      <Clock size={16} />
                    </div>
                    <div>
                      <p className="font-bold text-slate-800 dark:text-white text-sm">{weekDays.find(d => d.val === block.dayOfWeek)?.label}</p>
                      <p className="text-xs text-slate-500 dark:text-slate-400">{block.startTime} às {block.endTime} • {block.label}</p>
                    </div>
                  </div>
                  <button
                    onClick={() => removeBlockedTime(block.id)}
                    className="p-2 text-slate-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  {/* SECURITY & DATA TAB */ }
  {
    activeTab === 'security' && (
      <div className="space-y-6 animate-fade-in">
        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white">Segurança da Conta</h3>
          </div>
          <div className="p-6 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-bold text-slate-800 dark:text-white">Autenticação de Dois Fatores (2FA)</p>
                <p className="text-xs text-slate-500">Adiciona uma camada extra de segurança ao login.</p>
              </div>
              <ToggleSwitch checked={formData.security.twoFactor} onChange={() => setFormData({ ...formData, security: { ...formData.security, twoFactor: !formData.security.twoFactor } })} />
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-slate-800">
              <h4 className="text-sm font-bold text-slate-700 dark:text-slate-300 mb-4">Dispositivos Ativos</h4>
              <div className="space-y-3">
                <div className="flex items-center gap-4 p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-200 dark:border-slate-800">
                  <div className="p-2 bg-white dark:bg-slate-800 rounded-lg text-primary-500">
                    <Laptop size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800 dark:text-white">MacBook Pro (Este dispositivo)</p>
                    <p className="text-xs text-slate-500">São Paulo, BR • Ativo agora</p>
                  </div>
                  <div className="w-2 h-2 rounded-full bg-green-500"></div>
                </div>
                <div className="flex items-center gap-4 p-3 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 opacity-60">
                  <div className="p-2 bg-slate-100 dark:bg-slate-800 rounded-lg text-slate-500">
                    <Smartphone size={20} />
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-sm text-slate-800 dark:text-white">iPhone 14</p>
                    <p className="text-xs text-slate-500">São Paulo, BR • 2h atrás</p>
                  </div>
                  <button className="text-xs text-red-500 hover:underline">Desconectar</button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
          <div className="p-6 border-b border-slate-100 dark:border-slate-800">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">
              <Database size={18} /> Gestão de Dados (LGPD)
            </h3>
          </div>
          <div className="p-6">
            <p className="text-sm text-slate-500 mb-4">Você pode exportar todos os seus dados para backup ou conformidade legal.</p>
            <button
              onClick={handleExportData}
              className="w-full py-3 border border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-300 font-bold flex items-center justify-center gap-2 transition-colors"
            >
              <Download size={18} /> Baixar Cópia dos Dados (JSON)
            </button>
          </div>
        </div>
      </div>
    )
  }

  {/* NOTIFICATIONS TAB */ }
  {
    activeTab === 'notifications' && (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-fade-in transition-colors">
        <div className="p-6 border-b border-slate-100 dark:border-slate-800">
          <h3 className="font-bold text-lg text-slate-800 dark:text-white">Preferências de Notificação</h3>
        </div>
        <div className="p-6 space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Email</p>
              <p className="text-xs text-slate-500">Receber resumos semanais e alertas de segurança.</p>
            </div>
            <ToggleSwitch checked={formData.notifications.email} onChange={() => setFormData({ ...formData, notifications: { ...formData.notifications, email: !formData.notifications.email } })} />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800 dark:text-white">Push (Navegador)</p>
              <p className="text-xs text-slate-500">Alertas de próxima sessão e mensagens.</p>
            </div>
            <ToggleSwitch checked={formData.notifications.push} onChange={() => setFormData({ ...formData, notifications: { ...formData.notifications, push: !formData.notifications.push } })} />
          </div>

          <div className="border-t border-slate-100 dark:border-slate-800 pt-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                  <MessageSquare size={16} className="text-green-500" /> Integração WhatsApp
                </p>
                <p className="text-xs text-slate-500">Enviar lembretes automáticos para pacientes.</p>
              </div>
              <ToggleSwitch checked={formData.notifications.whatsapp} onChange={() => setFormData({ ...formData, notifications: { ...formData.notifications, whatsapp: !formData.notifications.whatsapp } })} />
            </div>

            {formData.notifications.whatsapp && (
              <div className="bg-green-50 dark:bg-green-900/10 border border-green-100 dark:border-green-900/30 rounded-xl p-4 animate-slide-up">
                <label className="block text-xs font-bold text-green-700 dark:text-green-400 mb-2 uppercase">Modelo de Mensagem</label>
                <textarea
                  className="w-full p-3 bg-white dark:bg-slate-800 border border-green-200 dark:border-green-800 rounded-lg text-sm text-slate-700 dark:text-slate-300 focus:ring-2 focus:ring-green-500 outline-none"
                  rows={3}
                  value={whatsappTemplate}
                  onChange={(e) => setWhatsappTemplate(e.target.value)}
                />
                <div className="flex justify-end mt-2">
                  <button
                    onClick={() => showNotification("Mensagem de teste enviada!")}
                    className="flex items-center gap-2 px-3 py-1.5 bg-green-600 text-white rounded-lg text-xs font-bold hover:bg-green-700 transition-colors shadow-sm"
                  >
                    <Send size={12} /> Testar Envio
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    )
  }

  {/* HELP & KNOWLEDGE BASE TAB */ }
  {
    activeTab === 'help' && (
      <div className="space-y-6 animate-fade-in">

        {/* --- Home View --- */}
        {helpView === 'home' && (
          <div className="space-y-6">
            {/* Search Banner */}
            <div className="bg-gradient-to-r from-slate-800 to-slate-900 dark:from-slate-900 dark:to-black rounded-2xl p-8 text-center shadow-lg relative overflow-hidden">
              <div className="relative z-10 max-w-lg mx-auto">
                <h2 className="text-2xl font-bold text-white mb-2">Central de Conhecimento</h2>
                <p className="text-slate-300 mb-6 text-sm">Como podemos ajudar você hoje?</p>
                <div className="relative">
                  <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
                  <input
                    type="text"
                    placeholder="Buscar tutoriais, guias ou dúvidas..."
                    className="w-full pl-12 pr-4 py-3 rounded-xl bg-white/10 backdrop-blur-sm border border-white/10 text-white placeholder-slate-400 focus:bg-white focus:text-slate-900 focus:outline-none transition-all"
                    value={helpSearch}
                    onChange={(e) => setHelpSearch(e.target.value)}
                  />
                </div>
              </div>
              {/* Decorative Circles */}
              <div className="absolute -top-10 -left-10 w-32 h-32 bg-primary-500/20 rounded-full blur-2xl"></div>
              <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-secondary-500/20 rounded-full blur-2xl"></div>
            </div>

            {/* Quick Links Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-primary-200 dark:hover:border-secondary-700 transition-all group cursor-pointer flex items-center gap-4"
                onClick={() => setHelpView('guide')}
              >
                <div className="w-12 h-12 bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <BookOpen size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white">Manual do Usuário</h4>
                  <p className="text-sm text-slate-500 mt-1">Guia passo a passo do sistema.</p>
                </div>
              </div>

              <div
                className="p-6 bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm hover:border-blue-200 dark:hover:border-blue-700 transition-all group cursor-pointer flex items-center gap-4"
                onClick={() => setHelpView('ticket')}
              >
                <div className="w-12 h-12 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform">
                  <LifeBuoy size={24} />
                </div>
                <div>
                  <h4 className="font-bold text-lg text-slate-800 dark:text-white">Suporte Técnico</h4>
                  <p className="text-sm text-slate-500 mt-1">Abra um chamado para nossa equipe.</p>
                </div>
              </div>
            </div>

            {/* Articles List */}
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden">
              <div className="p-6 border-b border-slate-100 dark:border-slate-800">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Dúvidas Frequentes</h3>
              </div>
              <div className="divide-y divide-slate-100 dark:divide-slate-800">
                {HELP_ARTICLES.filter(a => a.title.toLowerCase().includes(helpSearch.toLowerCase())).map((article) => (
                  <div
                    key={article.id}
                    className="p-6 hover:bg-slate-50 dark:hover:bg-slate-950/50 transition-colors cursor-pointer flex items-start gap-4"
                    onClick={() => { setSelectedArticle(article); setHelpView('article'); }}
                  >
                    <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl text-slate-600 dark:text-slate-400 shrink-0">
                      <article.icon size={24} />
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="px-2 py-0.5 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-500 text-[10px] font-bold uppercase tracking-wider">
                          {article.category}
                        </span>
                      </div>
                      <h4 className="font-bold text-slate-800 dark:text-white text-base">{article.title}</h4>
                      <p className="text-sm text-slate-500 mt-1 line-clamp-2">{article.description}</p>
                    </div>
                    <div className="self-center text-slate-300">
                      <ChevronDown className="transform -rotate-90" size={20} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- System Guide View --- */}
        {helpView === 'guide' && (
          <div className="flex flex-col h-[600px] bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50 dark:bg-slate-950/50">
              <div className="flex items-center gap-3">
                <button onClick={() => setHelpView('home')} className="p-2 hover:bg-slate-200 dark:hover:bg-slate-800 rounded-full text-slate-500">
                  <ChevronDown className="transform rotate-90" size={20} />
                </button>
                <div>
                  <h3 className="font-bold text-lg text-slate-800 dark:text-white">Manual do Usuário</h3>
                  <p className="text-xs text-slate-500">Guia completo do sistema TRG Nexus</p>
                </div>
              </div>
            </div>

            <div className="flex flex-1 overflow-hidden">
              {/* Guide Sidebar */}
              <div className="w-64 border-r border-slate-100 dark:border-slate-800 overflow-y-auto p-4 space-y-1 bg-slate-50/30 dark:bg-slate-900">
                {SYSTEM_GUIDE.map(section => (
                  <button
                    key={section.id}
                    onClick={() => setGuideSection(section.id)}
                    className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-bold transition-all ${guideSection === section.id
                      ? 'bg-primary-100 text-primary-700 dark:bg-secondary-900/30 dark:text-secondary-400'
                      : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
                      }`}
                  >
                    <section.icon size={18} />
                    {section.title}
                  </button>
                ))}
              </div>

              {/* Guide Content */}
              <div className="flex-1 overflow-y-auto p-8">
                {SYSTEM_GUIDE.map(section => (
                  guideSection === section.id && (
                    <div key={section.id} className="animate-fade-in max-w-2xl">
                      <div className="flex items-center gap-4 mb-6 pb-4 border-b border-slate-100 dark:border-slate-800">
                        <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-xl">
                          <section.icon size={32} className="text-slate-700 dark:text-slate-200" />
                        </div>
                        <h2 className="text-3xl font-bold text-slate-800 dark:text-white">{section.title}</h2>
                      </div>
                      <div className="prose dark:prose-invert">
                        {section.content}
                      </div>
                    </div>
                  )
                ))}
              </div>
            </div>
          </div>
        )}

        {/* --- Article View --- */}
        {helpView === 'article' && selectedArticle && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button onClick={() => setHelpView('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                <ChevronDown className="transform rotate-90" size={20} />
              </button>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Voltar para Central</span>
            </div>
            <div className="p-8 max-w-3xl mx-auto">
              <div className="flex items-center gap-4 mb-6">
                <div className="p-4 bg-primary-50 dark:bg-primary-900/20 rounded-2xl text-primary-600 dark:text-primary-400">
                  <selectedArticle.icon size={32} />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-slate-800 dark:text-white mb-2">{selectedArticle.title}</h1>
                  <p className="text-slate-500">{selectedArticle.description}</p>
                </div>
              </div>
              <div className="prose dark:prose-invert max-w-none">
                <p className="text-lg leading-relaxed text-slate-700 dark:text-slate-300">{selectedArticle.content}</p>

                {/* Placeholder for more structured content */}
                <div className="my-8 p-6 bg-slate-50 dark:bg-slate-950/50 rounded-xl border-l-4 border-primary-500">
                  <h4 className="font-bold text-slate-800 dark:text-white mb-2 flex items-center gap-2">
                    <AlertCircle size={18} /> Dica Pro
                  </h4>
                  <p className="text-sm text-slate-600 dark:text-slate-400">
                    Para mais detalhes, assista aos nossos tutoriais em vídeo na página anterior ou entre em contato com o suporte.
                  </p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* --- Ticket View --- */}
        {helpView === 'ticket' && (
          <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden animate-slide-up">
            <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center gap-2">
              <button onClick={() => setHelpView('home')} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-500">
                <ChevronDown className="transform rotate-90" size={20} />
              </button>
              <span className="text-sm font-bold text-slate-500 uppercase tracking-wider">Voltar</span>
            </div>
            <div className="p-8 max-w-2xl mx-auto">
              <h2 className="text-2xl font-bold text-slate-800 dark:text-white mb-2">Abrir Chamado de Suporte</h2>
              <p className="text-slate-500 mb-8 text-sm">Descreva seu problema ou dúvida. Nossa equipe responderá em até 24h úteis.</p>

              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Categoria</label>
                    <select
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                      value={supportForm.category}
                      onChange={(e) => setSupportForm({ ...supportForm, category: e.target.value })}
                    >
                      <option value="duvida">Dúvida de Uso</option>
                      <option value="bug">Reportar Erro (Bug)</option>
                      <option value="financeiro">Financeiro / Cobrança</option>
                      <option value="sugestao">Sugestão de Melhoria</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Prioridade</label>
                    <select
                      className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm dark:text-white outline-none"
                      value={supportForm.priority}
                      onChange={(e) => setSupportForm({ ...supportForm, priority: e.target.value })}
                    >
                      <option value="baixa">Baixa</option>
                      <option value="normal">Normal</option>
                      <option value="alta">Alta (Sistema Parado)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Assunto</label>
                  <input
                    type="text"
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none"
                    value={supportForm.subject}
                    onChange={(e) => setSupportForm({ ...supportForm, subject: e.target.value })}
                    placeholder="Resumo do problema..."
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 dark:text-slate-400 mb-1.5 uppercase">Mensagem Detalhada</label>
                  <textarea
                    rows={6}
                    className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-sm focus:ring-2 focus:ring-primary-500 dark:text-white outline-none resize-none"
                    value={supportForm.message}
                    onChange={(e) => setSupportForm({ ...supportForm, message: e.target.value })}
                    placeholder="Descreva o que aconteceu, passos para reproduzir, etc."
                  />
                </div>

                <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-xl flex gap-3 text-sm text-blue-800 dark:text-blue-200">
                  <LifeBuoy className="shrink-0" size={20} />
                  <p>Ao enviar este ticket, você concorda em compartilhar logs técnicos do seu navegador para ajudar no diagnóstico.</p>
                </div>

                <button
                  onClick={handleSendSupport}
                  className="w-full py-3 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl shadow-lg hover:bg-slate-900 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                >
                  <Send size={18} /> Enviar Ticket
                </button>
              </div>
            </div>
          </div>
        )}

      </div>
    )
  }

        </div >
      </div >
    </div >
  );
};

export default SettingsView;
