
import { Patient, SessionStats, Appointment, BlockedTime, NotificationItem } from './types';

// Helper to format date as YYYY-MM-DD
const formatDate = (date: Date) => date.toISOString().split('T')[0];

const today = new Date();
const tomorrow = new Date(today);
tomorrow.setDate(today.getDate() + 1);
const nextWeek = new Date(today);
nextWeek.setDate(today.getDate() + 5);
const lastWeek = new Date(today);
lastWeek.setDate(today.getDate() - 3);

export const MOCK_PATIENTS: Patient[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana.silva@email.com',
    phone: '(11) 99887-6655',
    status: 'Ativo',
    nextSession: `${formatDate(today)}T14:00:00`,
    lastSession: '2023-10-18',
    notes: 'Paciente responde bem ao reprocessamento temático.',
  },
  {
    id: '2',
    name: 'Carlos Oliveira',
    email: 'carlos.o@email.com',
    phone: '(21) 98765-4321',
    status: 'Ativo',
    nextSession: `${formatDate(tomorrow)}T10:00:00`,
    lastSession: '2023-10-19',
    notes: 'Foco em traumas de infância.',
  },
  {
    id: '3',
    name: 'Mariana Santos',
    email: 'mari.santos@email.com',
    phone: '(31) 99999-8888',
    status: 'Em Pausa',
    lastSession: '2023-09-15',
    notes: 'Viagem a trabalho.',
  },
  {
    id: '4',
    name: 'Roberto Costa',
    email: 'beto.costa@email.com',
    phone: '(41) 97777-6666',
    status: 'Ativo',
    nextSession: `${formatDate(nextWeek)}T16:00:00`,
    lastSession: '2023-10-20',
    notes: 'Alta sensibilidade somática.',
  },
];

export const MOCK_STATS: SessionStats[] = [
  { month: 'Mai', sessions: 12, anxietyAvg: 8.5 },
  { month: 'Jun', sessions: 15, anxietyAvg: 7.8 },
  { month: 'Jul', sessions: 18, anxietyAvg: 6.5 },
  { month: 'Ago', sessions: 22, anxietyAvg: 5.2 },
  { month: 'Set', sessions: 25, anxietyAvg: 4.5 },
  { month: 'Out', sessions: 28, anxietyAvg: 3.8 },
];

export const MOCK_APPOINTMENTS: Appointment[] = [
  { id: '101', patientId: '1', patientName: 'Ana Silva', date: formatDate(today), time: '14:00', status: 'Agendado', type: 'Reprocessamento' },
  { id: '102', patientId: '2', patientName: 'Carlos Oliveira', date: formatDate(tomorrow), time: '10:00', status: 'Agendado', type: 'Somático' },
  { id: '103', patientId: '4', patientName: 'Roberto Costa', date: formatDate(nextWeek), time: '16:00', status: 'Agendado', type: 'Anamnese' },
  { id: '104', patientId: '1', patientName: 'Ana Silva', date: formatDate(lastWeek), time: '14:00', status: 'Concluído', type: 'Reprocessamento' },
  { id: '105', patientId: '3', patientName: 'Mariana Santos', date: formatDate(today), time: '09:00', status: 'Agendado', type: 'Anamnese' },
  { id: '106', patientId: '2', patientName: 'Carlos Oliveira', date: formatDate(tomorrow), time: '15:30', status: 'Agendado', type: 'Reprocessamento' },
];

export const DEFAULT_BLOCKED_TIMES: BlockedTime[] = [
  { id: '1', dayOfWeek: 1, startTime: '12:00', endTime: '13:00', label: 'Almoço' }, // Monday
  { id: '2', dayOfWeek: 2, startTime: '12:00', endTime: '13:00', label: 'Almoço' }, // Tuesday
  { id: '3', dayOfWeek: 3, startTime: '12:00', endTime: '13:00', label: 'Almoço' }, // Wednesday
  { id: '4', dayOfWeek: 4, startTime: '12:00', endTime: '13:00', label: 'Almoço' }, // Thursday
  { id: '5', dayOfWeek: 5, startTime: '12:00', endTime: '13:00', label: 'Almoço' }, // Friday
];

export const MOCK_NOTIFICATIONS: NotificationItem[] = [
  { id: '1', title: 'Pagamento Recebido', message: 'Fatura #1234 paga por Carlos Oliveira', time: '2h atrás', read: false, type: 'success' },
  { id: '2', title: 'Sessão Cancelada', message: 'Mariana Santos cancelou o agendamento de amanhã.', time: '5h atrás', read: true, type: 'alert' },
  { id: '3', title: 'Atualização do Sistema', message: 'Nova versão do TRG Nexus disponível com correções.', time: '1d atrás', read: true, type: 'info' },
];