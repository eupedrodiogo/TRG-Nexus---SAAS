export type User = { id: string; email: string; password: string; name: string }
export type Patient = { id: string; name: string; email: string; phone: string; status: string; lastSession?: string; createdAt: string }
export type Session = { id: string; therapistId: string; date: string; patientId: string; notes?: string }

export const users: User[] = [
  { id: '1', email: 'admin@trgnexus.com', password: '123', name: 'Dr. Ricardo' },
]

export let patients: Patient[] = [
  {
    id: '1',
    name: 'Ana Silva',
    email: 'ana.silva@email.com',
    phone: '(11) 99887-6655',
    status: 'Ativo',
    lastSession: '2023-10-18',
    createdAt: new Date().toISOString(),
  },
]

export let sessions: Session[] = []

export type Appointment = {
  id: string
  patientId: string
  patientName: string
  date: string // YYYY-MM-DD
  time: string // HH:MM
  status: 'Agendado' | 'Concluído' | 'Cancelado'
  type: 'Anamnese' | 'Cronológico' | 'Reprocessamento' | 'Somático' | 'Temático' | 'Futuro' | 'Potencialização'
}

const fmt = (d: Date) => d.toISOString().split('T')[0]
const today = new Date()
const tomorrow = new Date(today); tomorrow.setDate(today.getDate() + 1)
const nextWeek = new Date(today); nextWeek.setDate(today.getDate() + 5)
const lastWeek = new Date(today); lastWeek.setDate(today.getDate() - 3)

export let appointments: Appointment[] = [
  { id: '101', patientId: '1', patientName: 'Ana Silva', date: fmt(today), time: '14:00', status: 'Agendado', type: 'Reprocessamento' },
  { id: '102', patientId: '2', patientName: 'Carlos Oliveira', date: fmt(tomorrow), time: '10:00', status: 'Agendado', type: 'Somático' },
  { id: '103', patientId: '4', patientName: 'Roberto Costa', date: fmt(nextWeek), time: '16:00', status: 'Agendado', type: 'Anamnese' },
  { id: '104', patientId: '1', patientName: 'Ana Silva', date: fmt(lastWeek), time: '14:00', status: 'Concluído', type: 'Reprocessamento' },
  { id: '105', patientId: '3', patientName: 'Mariana Santos', date: fmt(today), time: '09:00', status: 'Agendado', type: 'Anamnese' },
  { id: '106', patientId: '2', patientName: 'Carlos Oliveira', date: fmt(tomorrow), time: '15:30', status: 'Agendado', type: 'Reprocessamento' },
]

