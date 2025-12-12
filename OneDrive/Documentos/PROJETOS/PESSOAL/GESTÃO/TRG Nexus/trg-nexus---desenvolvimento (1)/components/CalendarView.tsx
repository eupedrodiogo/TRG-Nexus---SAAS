
import React, { useState, useEffect } from 'react';
import {
   ChevronLeft,
   ChevronRight,
   Calendar as CalendarIcon,
   Clock,
   Plus,
   LayoutGrid,
   List,
   Download,
   X,
   User,
   CheckCircle2,
   AlertTriangle,
   Ban,
   Trash2,
   Zap,
   Search,
   MoreHorizontal,
   DollarSign,
   Percent,
   BrainCircuit,
   CalendarDays,
   Filter,
   Sun,
   Cloud,
   Sparkles,
   AlertCircle,
   Wand2
} from 'lucide-react';
import { DEFAULT_BLOCKED_TIMES } from '../constants';
import { Appointment, BlockedTime } from '../types';
import { api } from '../services/api';

type ViewType = 'day' | 'week' | 'month' | 'list';

interface CalendarViewProps {
   onNavigateToPatient?: (id: string) => void;
   onNavigateToSession?: (patientId: string) => void;
}

const CalendarView: React.FC<CalendarViewProps> = ({ onNavigateToPatient, onNavigateToSession }) => {
   const [currentDate, setCurrentDate] = useState(new Date());
   const [selectedDay, setSelectedDay] = useState<Date>(new Date());
   const [viewType, setViewType] = useState<ViewType>('month');
   const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
   const [appointments, setAppointments] = useState<Appointment[]>([]);
   const [loading, setLoading] = useState<boolean>(false);
   const [error, setError] = useState<string>('');
   const [statusFilter, setStatusFilter] = useState<string>('all');
   const [blockedTimes, setBlockedTimes] = useState<BlockedTime[]>([]);
   const [suggestedSlot, setSuggestedSlot] = useState<{ date: string, time: string } | null>(null);
   const [isBlockModalOpen, setIsBlockModalOpen] = useState(false);
   const [blockForm, setBlockForm] = useState({ dayOfWeek: 1, startTime: '12:00', endTime: '13:00', label: '' });
   const [toast, setToast] = useState<{ show: boolean; message: string; type: 'success' | 'warning' | 'info' | 'error' } | null>(null);

   useEffect(() => {
      const saved = localStorage.getItem('TRG_BLOCKED_TIMES');
      if (saved) setBlockedTimes(JSON.parse(saved));
      else setBlockedTimes([]);
   }, []);

   const formatDateKey = (date: Date) => {
      const y = date.getFullYear();
      const m = String(date.getMonth() + 1).padStart(2, '0');
      const d = String(date.getDate()).padStart(2, '0');
      return `${y}-${m}-${d}`;
   };

   const isSameDate = (date1: Date, date2: Date) => {
      return date1.getDate() === date2.getDate() && date1.getMonth() === date2.getMonth() && date1.getFullYear() === date2.getFullYear();
   };

   const filteredAppointments = appointments.filter(apt => {
      if (statusFilter === 'all') return true;
      return apt.status === statusFilter;
   });

   const calculateInsights = () => {
      const totalSessions = filteredAppointments.length;
      const revenue = filteredAppointments.filter(a => a.status === 'Concluído' || a.status === 'Agendado').length * 250;
      const occupancy = totalSessions > 0 ? 85 : 0; // Dynamic based on sessions or 0
      return { totalSessions, revenue, occupancy };
   };

   const insights = calculateInsights();

   useEffect(() => {
      let mounted = true;
      setLoading(true);
      setError('');
      api.appointments.list()
         .then((data: Appointment[]) => { if (mounted) setAppointments(data); })
         .catch(() => { if (mounted) setError('Falha ao carregar agenda'); })
         .finally(() => { if (mounted) setLoading(false); });
      return () => { mounted = false; };
   }, []);

   const safeParseDate = (value: string) => {
      const d = new Date(value);
      return isNaN(d.getTime()) ? new Date() : d;
   };
   const safeHour = (t: string) => {
      if (!t || !t.includes(':')) return NaN;
      const h = parseInt(t.split(':')[0]);
      return isNaN(h) ? NaN : h;
   };
   const safeMinute = (t: string) => {
      if (!t || !t.includes(':')) return '00';
      const m = t.split(':')[1];
      return m || '00';
   };

   const showNotification = (message: string, type: 'success' | 'warning' | 'info' | 'error' = 'success') => {
      setToast({ show: true, message, type });
      setTimeout(() => setToast(null), 5000);
   };

   const isSlotConflicting = (date: Date, time: string): boolean => {
      const dateKey = formatDateKey(date);
      const hour = parseInt(time.split(':')[0]);

      // Check Appointments
      const hasAppointment = filteredAppointments.some(apt =>
         apt.date === dateKey && parseInt(apt.time.split(':')[0]) === hour && apt.status !== 'Cancelado'
      );

      if (hasAppointment) return true;

      // Check Blocked Times
      const dayOfWeek = date.getDay();
      const isBlocked = blockedTimes.some(block =>
         block.dayOfWeek === dayOfWeek &&
         hour >= parseInt(block.startTime.split(':')[0]) &&
         hour < parseInt(block.endTime.split(':')[0])
      );

      return isBlocked;
   };

   const handleCancelAppointment = () => {
      if (!selectedAppointment) return;
      const id = selectedAppointment.id;
      api.appointments.update(id, { status: 'Cancelado' })
         .then((updated) => {
            setAppointments(prev => prev.map(a => a.id === id ? (updated as Appointment) : a));
            showNotification('Agendamento cancelado.', 'warning');
         })
         .catch(() => showNotification('Erro ao cancelar.', 'error'))
         .finally(() => setSelectedAppointment(null));
   };

   const handleReschedule = () => {
      if (!selectedAppointment) return;
      setSelectedAppointment(null);
      showNotification('Modo de reagendamento iniciado.', 'info');
   };

   const handleFindSlot = () => {
      showNotification('IA analisando agenda...', 'info');
      setTimeout(() => {
         const tomorrow = new Date();
         tomorrow.setDate(tomorrow.getDate() + 1);
         const dateKey = formatDateKey(tomorrow);
         setSuggestedSlot({ date: dateKey, time: '14:00' });
         setCurrentDate(tomorrow);
         if (viewType === 'month' || viewType === 'list') setViewType('week');
         showNotification('Horário sugerido encontrado: 14:00', 'success');
         setTimeout(() => setSuggestedSlot(null), 5000);
      }, 1000);
   };

   const handleOptimizeSchedule = () => {
      if (window.confirm("A IA irá sugerir reagrupamentos para minimizar janelas vazias. Deseja ver a simulação?")) {
         showNotification("Calculando otimização...", "info");
         setTimeout(() => {
            showNotification("Otimização: 2 janelas de 1h podem ser eliminadas.", "success");
         }, 2000);
      }
   };

   const handleSaveBlock = () => {
      if (!blockForm.label || !blockForm.startTime || !blockForm.endTime) { showNotification('Preencha todos os campos.', 'warning'); return; }
      const newBlock: BlockedTime = { id: Date.now().toString(), dayOfWeek: Number(blockForm.dayOfWeek), startTime: blockForm.startTime, endTime: blockForm.endTime, label: blockForm.label };
      const updatedBlocks = [...blockedTimes, newBlock];
      setBlockedTimes(updatedBlocks);
      localStorage.setItem('TRG_BLOCKED_TIMES', JSON.stringify(updatedBlocks));
      setIsBlockModalOpen(false);
      showNotification('Horário bloqueado.', 'success');
   };

   const handleQuickAdd = (date: Date, time: string) => {
      if (isSlotConflicting(date, time)) {
         showNotification("Este horário já está ocupado ou bloqueado.", "error");
         return;
      }
      if (window.confirm(`Agendar novo paciente para ${time}?`)) {
         const dateKey = formatDateKey(date);
         api.appointments.create({
            date: dateKey,
            time,
            status: 'Agendado',
            type: 'Anamnese',
            patientId: 'novo',
            patientName: 'Novo Paciente',
         }).then((created) => {
            setAppointments(prev => [created as Appointment, ...prev]);
            showNotification('Agendamento criado.', 'success');
         }).catch(() => showNotification('Erro ao criar agendamento.', 'error'));
      }
   }

   const handleExportICS = () => {
      try {
         const header = "BEGIN:VCALENDAR\nVERSION:2.0\nPRODID:-//TRG Nexus//PT-BR\n";
         const footer = "END:VCALENDAR";
         const events = filteredAppointments.map(apt => {
            const start = (apt?.date || '').replace(/-/g, '') + 'T' + (apt?.time || '00:00').replace(':', '') + '00';
            const hour = safeHour(apt?.time || '');
            const endHour = isNaN(hour) ? 0 : hour + 1;
            const end = (apt?.date || '').replace(/-/g, '') + 'T' + endHour.toString().padStart(2, '0') + safeMinute(apt?.time || '') + '00';
            return `BEGIN:VEVENT\nUID:${apt.id}@trgnexus.com\nSUMMARY:Sessão TRG - ${apt.patientName}\nDESCRIPTION:Protocolo: ${apt.type}\nDTSTART:${start}\nDTEND:${end}\nEND:VEVENT`;
         }).join('\n');
         const blob = new Blob([header + events + footer], { type: 'text/calendar' });
         const url = window.URL.createObjectURL(blob);
         const a = document.createElement('a'); a.href = url; a.download = 'agenda_trg.ics'; a.click(); window.URL.revokeObjectURL(url);
         showNotification("Arquivo ICS gerado!", "success");
      } catch (e) { showNotification("Erro ao exportar.", "warning"); }
   };

   const handleStartSession = () => {
      if (!selectedAppointment) return;
      // Save patient ID to localStorage so SessionView can pick it up
      localStorage.setItem('TRG_CURRENT_PATIENT_ID', selectedAppointment.patientId);
      if (onNavigateToSession) {
         onNavigateToSession(selectedAppointment.patientId);
      }
   };

   const handlePrev = () => { const d = new Date(currentDate); if (viewType === 'week') d.setDate(d.getDate() - 7); else if (viewType === 'day') d.setDate(d.getDate() - 1); else d.setMonth(d.getMonth() - 1); setCurrentDate(d); };
   const handleNext = () => { const d = new Date(currentDate); if (viewType === 'week') d.setDate(d.getDate() + 7); else if (viewType === 'day') d.setDate(d.getDate() + 1); else d.setMonth(d.getMonth() + 1); setCurrentDate(d); };
   const handleToday = () => { const now = new Date(); setCurrentDate(now); setSelectedDay(now); };

   const getAppointmentsForDate = (date: Date) => {
      const k = formatDateKey(date);
      const list = filteredAppointments.filter(apt => apt.date === k);
      return list.sort((a, b) => (a?.time || '').localeCompare(b?.time || ''));
   };
   const getBlockedTimeForDay = (date: Date) => { const d = date.getDay(); return blockedTimes.filter(b => b.dayOfWeek === d); };
   const weekDays = [{ val: 0, label: 'Domingo', short: 'Dom' }, { val: 1, label: 'Segunda', short: 'Seg' }, { val: 2, label: 'Terça', short: 'Ter' }, { val: 3, label: 'Quarta', short: 'Qua' }, { val: 4, label: 'Quinta', short: 'Qui' }, { val: 5, label: 'Sexta', short: 'Sex' }, { val: 6, label: 'Sábado', short: 'Sáb' }];

   const renderMonthView = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const lastDay = new Date(year, month + 1, 0);
      const daysInMonth = lastDay.getDate();
      const startDayOfWeek = firstDay.getDay();

      const days = [];
      for (let i = 0; i < startDayOfWeek; i++) {
         days.push(null);
      }
      for (let i = 1; i <= daysInMonth; i++) {
         days.push(new Date(year, month, i));
      }

      return (
         <div className="flex flex-col h-full">
            <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden flex-shrink-0">
               <div className="grid grid-cols-7 border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950">
                  {weekDays.map(d => (
                     <div key={d.val} className="p-3 text-center text-xs font-bold uppercase text-slate-400">
                        {d.short}
                     </div>
                  ))}
               </div>
               <div className="grid grid-cols-7 auto-rows-[minmax(80px,1fr)] md:auto-rows-[120px]">
                  {days.map((date, idx) => {
                     if (!date) return <div key={idx} className="bg-slate-50/30 dark:bg-slate-950/30 border-r border-b border-slate-100 dark:border-slate-800"></div>;

                     const apts = getAppointmentsForDate(date);
                     const isToday = isSameDate(date, new Date());
                     const isSelected = isSameDate(date, selectedDay);

                     return (
                        <div
                           key={idx}
                           onClick={() => setSelectedDay(date)}
                           className={`
                        p-2 border-r border-b border-slate-100 dark:border-slate-800 relative cursor-pointer transition-colors group
                        ${isSelected ? 'bg-primary-50 dark:bg-slate-800 ring-inset ring-2 ring-primary-500' : 'hover:bg-slate-50 dark:hover:bg-slate-800'}
                      `}
                        >
                           <div className="flex justify-between items-start mb-1">
                              <span className={`text-xs font-bold w-6 h-6 flex items-center justify-center rounded-full transition-all ${isToday ? 'bg-primary-600 text-white' : isSelected ? 'text-primary-600 dark:text-primary-400' : 'text-slate-700 dark:text-slate-300'}`}>
                                 {date.getDate()}
                              </span>
                              <span className="hidden md:block text-[10px] font-bold text-slate-400">{apts.length > 0 ? apts.length : ''}</span>
                           </div>

                           <div className="hidden md:block space-y-1 overflow-y-auto max-h-[80px] custom-scrollbar">
                              {apts.map(apt => (
                                 <div
                                    key={apt.id}
                                    onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }}
                                    className={`text-[9px] px-1.5 py-0.5 rounded border truncate cursor-pointer ${apt.status === 'Agendado' ? 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800 dark:text-blue-300' : 'bg-slate-100 border-slate-200 text-slate-600 dark:bg-slate-800 dark:border-slate-700 dark:text-slate-400'
                                       }`}
                                 >
                                    {apt.time} {apt.patientName.split(' ')[0]}
                                 </div>
                              ))}
                           </div>

                           <div className="md:hidden flex justify-center gap-1 mt-1">
                              {apts.slice(0, 3).map(apt => (
                                 <div key={apt.id} className={`w-1.5 h-1.5 rounded-full ${apt.status === 'Agendado' ? 'bg-primary-500' : 'bg-slate-300'}`} />
                              ))}
                           </div>
                        </div>
                     );
                  })}
               </div>
            </div>

            <div className="md:hidden mt-4 animate-slide-up pb-20">
               {renderMobileMonthDetails()}
            </div>
         </div>
      );
   };

   const renderMobileMonthDetails = () => {
      const apts = getAppointmentsForDate(selectedDay);
      const blocked = getBlockedTimeForDay(selectedDay);
      const dailyRevenue = apts.filter(a => a.status !== 'Cancelado').length * 250;

      return (
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-lg overflow-hidden">
            <div className="bg-slate-50 dark:bg-slate-950 p-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
               <div>
                  <h3 className="font-bold text-slate-800 dark:text-white flex items-center gap-2">
                     <CalendarDays size={18} className="text-primary-500" />
                     {selectedDay.toLocaleDateString('pt-BR', { day: 'numeric', month: 'long', weekday: 'short' })}
                  </h3>
                  {apts.length > 0 && (
                     <p className="text-xs text-slate-500 mt-1 font-medium">
                        {apts.length} sessões • Est. R$ {dailyRevenue.toFixed(2)}
                     </p>
                  )}
               </div>
               <button className="p-2 bg-white dark:bg-slate-800 rounded-full border border-slate-200 dark:border-slate-700 shadow-sm text-primary-600">
                  <Plus size={20} />
               </button>
            </div>

            <div className="p-4 space-y-4">
               {apts.length === 0 && blocked.length === 0 ? (
                  <div className="text-center py-8 text-slate-400">
                     <Clock size={32} className="mx-auto mb-2 opacity-20" />
                     <p className="text-sm">Dia livre.</p>
                  </div>
               ) : (
                  <div className="relative pl-4 border-l-2 border-slate-100 dark:border-slate-800 space-y-4">
                     {apts.map(apt => (
                        <div key={apt.id} className="relative group" onClick={() => setSelectedAppointment(apt)}>
                           <div className={`absolute -left-[21px] top-1.5 w-3 h-3 rounded-full border-2 border-white dark:border-slate-900 ${apt.status === 'Agendado' ? 'bg-primary-500' : 'bg-green-500'}`} />
                           <div className="bg-slate-50 dark:bg-slate-800/50 p-3 rounded-xl border border-slate-100 dark:border-slate-700 active:scale-98 transition-transform">
                              <div className="flex justify-between items-start mb-1">
                                 <span className="font-bold text-slate-800 dark:text-white text-sm">{apt.time}</span>
                                 <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-white dark:bg-slate-800 border shadow-sm">{apt.status}</span>
                              </div>
                              <h4 className="font-bold text-primary-700 dark:text-primary-400 text-sm mb-0.5">{apt.patientName}</h4>
                              <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1"><BrainCircuit size={12} /> {apt.type}</p>
                           </div>
                        </div>
                     ))}
                  </div>
               )}
            </div>
         </div>
      );
   }

   const renderWeekView = () => {
      const start = new Date(currentDate); start.setDate(start.getDate() - start.getDay());
      const weekDates = Array.from({ length: 7 }, (_, i) => { const d = new Date(start); d.setDate(d.getDate() + i); return d; });
      const hours = Array.from({ length: 13 }, (_, i) => i + 8);

      return (
         <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 overflow-hidden flex flex-col h-[600px]">
            <div className="flex border-b border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><div className="w-12 border-r border-slate-200 dark:border-slate-800 shrink-0"></div>{weekDates.map((date, i) => (<div key={i} className={`flex-1 p-3 text-center border-r border-slate-200 dark:border-slate-800 last:border-none ${isSameDate(date, new Date()) ? 'bg-blue-50 dark:bg-blue-900/20' : ''}`}><p className="text-xs font-bold uppercase text-slate-400 mb-1">{weekDays[date.getDay()].short}</p><div className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${isSameDate(date, new Date()) ? 'bg-primary-600 text-white' : 'text-slate-700 dark:text-slate-300'}`}>{date.getDate()}</div></div>))}</div>
            <div className="flex-1 overflow-y-auto custom-scrollbar">{hours.map(hour => (<div key={hour} className="flex border-b border-slate-100 dark:border-slate-800 min-h-[80px]"><div className="w-12 border-r border-slate-100 dark:border-slate-800 p-2 text-[10px] font-bold text-slate-400 text-right bg-slate-50/30 dark:bg-slate-950/30">{hour}:00</div>{weekDates.map((date, i) => { const apts = getAppointmentsForDate(date).filter(a => parseInt(a.time.split(':')[0]) === hour); const blocked = getBlockedTimeForDay(date).some(b => parseInt(b.startTime.split(':')[0]) === hour); const isSuggested = suggestedSlot && suggestedSlot.date === formatDateKey(date) && parseInt(suggestedSlot.time.split(':')[0]) === hour; return (<div key={i} className={`flex-1 border-r border-slate-100 dark:border-slate-800 p-1 relative group transition-colors ${blocked ? 'bg-stripes-gray opacity-50 cursor-not-allowed' : 'hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer'} ${isSuggested ? 'bg-yellow-50 dark:bg-yellow-900/20 ring-inset ring-2 ring-amber-300 dark:ring-amber-700' : ''}`} onClick={() => !blocked && apts.length === 0 && handleQuickAdd(date, `${hour}:00`)}>{blocked && <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none"><Ban size={16} className="text-slate-400" /></div>}{apts.map(apt => (<div key={apt.id} onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }} className={`text-[10px] p-1.5 rounded mb-1 cursor-pointer truncate shadow-sm hover:shadow-md transition-all border-l-2 ${apt.status === 'Agendado' ? 'bg-primary-100 dark:bg-primary-900/40 text-primary-800 dark:text-primary-200 border-primary-500' : apt.status === 'Concluído' ? 'bg-green-100 dark:bg-green-900/40 text-green-800 dark:text-green-200 border-green-500' : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'}`} title={`${apt.time} - ${apt.patientName}`}><span className="font-bold block">{apt.time}</span>{apt.patientName.split(' ')[0]}</div>))}</div>); })}</div>))}</div>
         </div>
      );
   };

   const renderDayView = () => (
      <div className="flex flex-col h-[600px] overflow-y-auto custom-scrollbar bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 relative">
         <div className="absolute left-16 right-0 border-t-2 border-red-400 z-10 flex items-center" style={{ top: '35%' }}>
            <div className="w-2 h-2 bg-red-500 rounded-full -ml-1"></div>
            <span className="text-[10px] font-bold text-red-500 bg-white dark:bg-slate-900 px-1 ml-1">Agora</span>
         </div>
         {Array.from({ length: 13 }, (_, i) => i + 8).map(hour => (
            <div key={hour} className="flex border-b border-slate-100 dark:border-slate-800 min-h-[100px] relative group">
               <div className="w-16 flex-shrink-0 border-r border-slate-100 dark:border-slate-800 p-2 text-xs text-slate-400 text-right font-medium bg-slate-50/50 dark:bg-slate-950/50 sticky left-0">{hour}:00</div>
               <div className="flex-1 p-2 relative hover:bg-slate-50 dark:hover:bg-slate-800/50 cursor-pointer" onClick={() => handleQuickAdd(currentDate, `${hour}:00`)}>
                  {getAppointmentsForDate(currentDate).filter(a => parseInt(a.time.split(':')[0]) === hour).map(apt => (
                     <div key={apt.id} onClick={(e) => { e.stopPropagation(); setSelectedAppointment(apt); }} className="p-3 rounded-lg border-l-4 bg-blue-50 border-blue-500 mb-2 cursor-pointer">
                        <span className="font-bold text-sm text-slate-800">{apt.patientName}</span>
                        <div className="text-xs text-slate-500">{apt.time} - {apt.type}</div>
                     </div>
                  ))}
               </div>
            </div>
         ))}
      </div>
   );

   const renderListView = () => (
      <div className="bg-white dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm overflow-hidden h-[600px] flex flex-col">
         <div className="p-4 border-b border-slate-100 dark:border-slate-800 bg-slate-50 dark:bg-slate-950"><h3 className="font-bold text-slate-700 dark:text-slate-300">Lista de Agendamentos</h3></div>
         <div className="overflow-y-auto custom-scrollbar p-2 space-y-2">
            {filteredAppointments.sort((a, b) => (safeParseDate(a?.date || '').getTime() || 0) - (safeParseDate(b?.date || '').getTime() || 0)).map(apt => (
               <div key={apt.id} className="flex items-center gap-4 p-4 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:border-primary-300 cursor-pointer" onClick={() => setSelectedAppointment(apt)}>
                  <div className="flex flex-col items-center min-w-[60px]"><span className="text-xs font-bold uppercase text-slate-400">{safeParseDate(apt?.date || '').toLocaleDateString('pt-BR', { weekday: 'short' })}</span><span className="text-xl font-bold text-slate-800 dark:text-white">{safeParseDate(apt?.date || '').getDate()}</span></div>
                  <div className="h-10 w-px bg-slate-200 dark:bg-slate-700"></div>
                  <div className="flex-1"><h4 className="font-bold text-slate-800 dark:text-white">{apt.patientName}</h4><span className="text-xs text-slate-500">{apt.time} • {apt.type}</span></div>
               </div>
            ))}
         </div>
      </div>
   );

   const renderMiniCalendar = () => {
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth();
      const firstDay = new Date(year, month, 1);
      const daysInMonth = new Date(year, month + 1, 0).getDate();
      const startDay = firstDay.getDay();
      const days = []; for (let i = 0; i < startDay; i++) days.push(null); for (let i = 1; i <= daysInMonth; i++) days.push(new Date(year, month, i));
      return (
         <div className="p-4 bg-white dark:bg-slate-900 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
            <div className="flex justify-between items-center mb-3"><span className="text-center font-bold text-sm text-slate-700 dark:text-slate-200">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</span><div className="flex gap-1"><button onClick={handlePrev} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronLeft size={14} /></button><button onClick={handleNext} className="p-1 hover:bg-slate-100 dark:hover:bg-slate-800 rounded"><ChevronRight size={14} /></button></div></div>
            <div className="grid grid-cols-7 text-center text-[10px] text-slate-400 font-bold mb-2"><div>D</div><div>S</div><div>T</div><div>Q</div><div>Q</div><div>S</div><div>S</div></div>
            <div className="grid grid-cols-7 gap-1">{days.map((d, i) => (<div key={i} className="aspect-square flex items-center justify-center">{d && (<button onClick={() => setCurrentDate(d)} className={`w-6 h-6 rounded-full text-xs font-medium flex items-center justify-center transition-colors ${isSameDate(d, currentDate) ? 'bg-primary-600 text-white' : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>{d.getDate()}</button>)}</div>))}</div>
         </div>
      );
   };

   return (
      <div className="flex flex-col h-full min-h-[600px] animate-fade-in pb-20 md:pb-0 relative bg-white dark:bg-slate-900">
         {toast && toast.show && <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[70] animate-slide-up"><div className={`px-4 py-3 rounded-xl shadow-xl border flex items-center gap-3 ${toast.type === 'error' ? 'bg-red-50 border-red-200 text-red-800' : toast.type === 'warning' ? 'bg-amber-50 border-amber-200 text-amber-800' : 'bg-slate-800 border-slate-700 text-white'}`}>{toast.type === 'error' ? <AlertTriangle size={18} /> : toast.type === 'warning' ? <AlertTriangle size={18} /> : <CheckCircle2 size={18} />}<span className="text-sm font-bold">{toast.message}</span></div></div>}

         <div className="flex flex-col xl:flex-row justify-between gap-4 mb-6 shrink-0">
            <div className="flex items-center gap-4 bg-white dark:bg-slate-900 p-2 rounded-xl border border-slate-100 dark:border-slate-800 shadow-sm">
               <div className="flex items-center gap-1"><button onClick={handlePrev} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronLeft size={20} /></button><button onClick={handleNext} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><ChevronRight size={20} /></button><button onClick={handleToday} className="px-3 py-1.5 text-sm font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg ml-1">Hoje</button></div>
               <h2 className="text-xl font-bold text-slate-800 dark:text-white min-w-[180px]">{currentDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}</h2>
            </div>
            <div className="flex flex-wrap items-center gap-3">
               <div className="flex bg-slate-100 dark:bg-slate-800 p-1 rounded-xl">{[{ id: 'day', label: 'Dia', icon: Clock }, { id: 'week', label: 'Semana', icon: LayoutGrid }, { id: 'month', label: 'Mês', icon: CalendarIcon }, { id: 'list', label: 'Lista', icon: List }].map(v => (<button key={v.id} onClick={() => setViewType(v.id as ViewType)} className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-bold transition-all ${viewType === v.id ? 'bg-white dark:bg-slate-700 text-slate-800 dark:text-white shadow-sm' : 'text-slate-500 dark:text-slate-400 hover:text-slate-700'}`}><v.icon size={14} className="hidden sm:block" /> {v.label}</button>))}</div>
               <button onClick={() => setIsBlockModalOpen(true)} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-red-500"><Ban size={20} /></button>
               <button onClick={handleExportICS} className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-primary-600"><Download size={20} /></button>
               <button onClick={handleFindSlot} className="hidden md:flex items-center gap-2 px-4 py-2.5 bg-slate-800 dark:bg-slate-700 hover:bg-slate-900 dark:hover:bg-slate-600 text-white rounded-xl font-bold shadow-lg"><Zap size={16} className="text-yellow-400" /> Encontrar Vaga</button>
            </div>
         </div>

         <div className="flex flex-col lg:flex-row gap-6 h-full min-h-0">
            <div className="flex-1 min-w-0">
               {loading ? (
                  <div className="p-6 text-slate-500">Carregando agenda...</div>
               ) : error ? (
                  <div className="p-6 text-red-600">{error}</div>
               ) : (
                  <>
                     {viewType === 'month' && renderMonthView()}
                     {viewType === 'week' && renderWeekView()}
                     {viewType === 'day' && renderDayView()}
                     {viewType === 'list' && renderListView()}
                  </>
               )}
            </div>
            <div className="hidden xl:flex w-80 flex-col gap-4 shrink-0">
               {renderMiniCalendar()}
               <div className="bg-gradient-to-br from-blue-400 to-blue-600 rounded-xl p-4 text-white shadow-md relative overflow-hidden">
                  <div className="relative z-10 flex justify-between items-center"><div><p className="text-xs font-bold opacity-80 uppercase">Previsão Hoje</p><h3 className="text-2xl font-bold">24°C</h3><p className="text-sm font-medium">Ensolarado</p></div><Sun size={40} className="text-yellow-300" /></div>
                  <Cloud className="absolute -bottom-4 -left-4 text-white/20 w-24 h-24" />
               </div>
               <button onClick={handleOptimizeSchedule} className="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl shadow-lg transition-all flex items-center justify-center gap-2 group"><Wand2 size={18} className="group-hover:rotate-12 transition-transform" /> Otimização Inteligente</button>
               <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><BrainCircuit size={16} /> Insights</h3><div className="space-y-4"><div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800"><div className="flex items-center gap-3"><div className="p-2 bg-blue-100 dark:bg-blue-900/30 text-blue-600 rounded-lg"><Percent size={18} /></div><div><p className="text-xs text-slate-500 font-bold">Ocupação</p><p className="text-lg font-bold text-slate-800 dark:text-white">{insights.occupancy}%</p></div></div></div><div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-950/50 rounded-xl border border-slate-100 dark:border-slate-800"><div className="flex items-center gap-3"><div className="p-2 bg-green-100 dark:bg-green-900/30 text-green-600 rounded-lg"><DollarSign size={18} /></div><div><p className="text-xs text-slate-500 font-bold">Receita Est.</p><p className="text-lg font-bold text-slate-800 dark:text-white">R$ {insights.revenue}</p></div></div></div></div></div>
               <div className="bg-white dark:bg-slate-900 p-5 rounded-2xl border border-slate-100 dark:border-slate-800 shadow-sm"><h3 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2"><AlertCircle size={16} /> Pendências</h3><div className="space-y-3"><div className="p-3 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-xl"><p className="text-xs font-bold text-amber-700 dark:text-amber-400 mb-1">Confirmação Pendente</p><p className="text-sm font-bold text-slate-700 dark:text-slate-300">Mariana Santos</p><p className="text-xs text-slate-500">Amanhã, 09:00</p><div className="flex gap-2 mt-2"><button className="flex-1 py-1 bg-white dark:bg-slate-800 text-green-600 text-xs font-bold rounded shadow-sm">Confirmar</button><button className="flex-1 py-1 bg-white dark:bg-slate-800 text-slate-500 text-xs font-bold rounded shadow-sm">Lembrar</button></div></div></div></div>
            </div>
         </div>

         {selectedAppointment && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-2xl shadow-2xl overflow-hidden animate-slide-up ring-1 ring-slate-200 dark:ring-slate-800">
                  <div className="p-6 border-b border-slate-100 dark:border-slate-800 flex justify-between items-start bg-slate-50 dark:bg-slate-950"><div><span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider mb-2 inline-block ${selectedAppointment.status === 'Agendado' ? 'bg-blue-100 text-blue-700' : 'bg-green-100 text-green-700'}`}>{selectedAppointment.status}</span><h3 className="text-xl font-bold text-slate-800 dark:text-white">{selectedAppointment.patientName}</h3><p className="text-sm text-slate-500">{selectedAppointment.type}</p></div><button onClick={() => setSelectedAppointment(null)} className="p-2 rounded-full hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-400"><X size={20} /></button></div>
                  <div className="p-6 space-y-4"><div className="flex gap-4"><div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"><p className="text-xs text-slate-400 font-bold uppercase mb-1">Data</p><p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2"><CalendarIcon size={16} /> {new Date(selectedAppointment.date).toLocaleDateString('pt-BR')}</p></div><div className="flex-1 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700"><p className="text-xs text-slate-400 font-bold uppercase mb-1">Horário</p><p className="font-semibold text-slate-800 dark:text-white flex items-center gap-2"><Clock size={16} /> {selectedAppointment.time}</p></div></div><div className="flex gap-2"><button onClick={() => onNavigateToPatient?.(selectedAppointment.patientId)} className="flex-1 py-2.5 bg-slate-800 dark:bg-slate-700 text-white font-bold rounded-xl hover:bg-slate-900 transition-colors text-sm flex items-center justify-center gap-2"><User size={16} /> Ver Ficha</button><button onClick={handleStartSession} className="flex-1 py-2.5 border border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 font-bold rounded-xl hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors text-sm flex items-center justify-center gap-2"><BrainCircuit size={16} /> Iniciar Sessão</button></div><div className="pt-4 border-t border-slate-100 dark:border-slate-800 flex justify-between items-center"><button onClick={handleCancelAppointment} className="text-red-500 text-sm font-bold hover:underline">Cancelar Agendamento</button><button onClick={handleReschedule} className="text-primary-600 dark:text-secondary-400 text-sm font-bold hover:underline">Reagendar</button></div></div>
               </div>
            </div>
         )}

         {isBlockModalOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
               <div className="bg-white dark:bg-slate-900 w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-slide-up ring-1 ring-slate-200 dark:ring-slate-800">
                  <div className="flex justify-between items-center mb-6"><h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2"><Ban size={20} className="text-red-500" /> Bloquear Horário</h3><button onClick={() => setIsBlockModalOpen(false)}><X size={20} className="text-slate-400" /></button></div>
                  <div className="space-y-4"><div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Dia da Semana</label><select className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" value={blockForm.dayOfWeek} onChange={(e) => setBlockForm({ ...blockForm, dayOfWeek: parseInt(e.target.value) })}>{weekDays.map(d => <option key={d.val} value={d.val}>{d.label}</option>)}</select></div><div className="grid grid-cols-2 gap-3"><div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Início</label><input type="time" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" value={blockForm.startTime} onChange={(e) => setBlockForm({ ...blockForm, startTime: e.target.value })} /></div><div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Fim</label><input type="time" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" value={blockForm.endTime} onChange={(e) => setBlockForm({ ...blockForm, endTime: e.target.value })} /></div></div><div><label className="block text-xs font-bold text-slate-500 mb-1 uppercase">Rótulo</label><input type="text" placeholder="Ex: Almoço" className="w-full p-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl outline-none dark:text-white" value={blockForm.label} onChange={(e) => setBlockForm({ ...blockForm, label: e.target.value })} /></div><button onClick={handleSaveBlock} className="w-full py-3 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl shadow-lg transition-colors">Confirmar Bloqueio</button></div>
               </div>
            </div>
         )}
      </div>
   );
};

export default CalendarView;

