export type PeriodType = 'manha' | 'tarde';
export type ResourceType = 'both' | 'lab' | 'chromebooks';
export type ReservationStatus = 'pendente' | 'confirmada' | 'cancelada' | 'concluida';

export interface TimeSlot {
  id: string; // e.g. "m1", "m2", "t1"
  period: PeriodType;
  order: number;
  label: string; // e.g. "1º Horário"
  startTime: string; // "07:00"
  endTime: string; // "07:50"
  displayTime: string; // "07:00 às 07:50"
}

export interface BreakSlot {
  period: PeriodType;
  label: string;
  startTime: string;
  endTime: string;
  displayTime: string;
  afterSlotId: string;
}

export interface Reservation {
  id: string;
  userId: string;
  userName: string;
  date: string; // YYYY-MM-DD
  period: PeriodType;
  slots: string[]; // array of slot IDs, e.g. ["m1", "m2"]
  resource: ResourceType;
  purpose: string;
  status: 'pendente' | 'confirmada' | 'cancelada';
  createdAt: string;
  updatedAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  whatsapp: string; // Standard format 55DDD9XXXXXXXX
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
}

export interface UserContact {
  uid: string;
  displayName: string;
  whatsapp: string;
  updatedAt: string;
}

export interface SystemSettings {
  accessPassword: string; // Default 'tbs2026'
  requireAdminApproval: boolean; // Default false
  adminEmails: string[];
  updatedAt?: string;
  updatedBy?: string;
}

export const MORNING_SLOTS: TimeSlot[] = [
  { id: 'm1', period: 'manha', order: 1, label: '1º Horário', startTime: '07:00', endTime: '07:50', displayTime: '07:00 às 07:50' },
  { id: 'm2', period: 'manha', order: 2, label: '2º Horário', startTime: '07:50', endTime: '08:40', displayTime: '07:50 às 08:40' },
  { id: 'm3', period: 'manha', order: 3, label: '3º Horário', startTime: '08:40', endTime: '09:30', displayTime: '08:40 às 09:30' },
  { id: 'm4', period: 'manha', order: 4, label: '4º Horário', startTime: '09:45', endTime: '10:30', displayTime: '09:45 às 10:30' },
  { id: 'm5', period: 'manha', order: 5, label: '5º Horário', startTime: '10:30', endTime: '11:15', displayTime: '10:30 às 11:15' },
  { id: 'm6', period: 'manha', order: 6, label: '6º Horário', startTime: '11:15', endTime: '12:00', displayTime: '11:15 às 12:00' },
];

export const AFTERNOON_SLOTS: TimeSlot[] = [
  { id: 't1', period: 'tarde', order: 1, label: '1º Horário', startTime: '13:30', endTime: '14:20', displayTime: '13:30 às 14:20' },
  { id: 't2', period: 'tarde', order: 2, label: '2º Horário', startTime: '14:20', endTime: '15:10', displayTime: '14:20 às 15:10' },
  { id: 't3', period: 'tarde', order: 3, label: '3º Horário', startTime: '15:10', endTime: '16:00', displayTime: '15:10 às 16:00' },
  { id: 't4', period: 'tarde', order: 4, label: '4º Horário', startTime: '16:15', endTime: '17:00', displayTime: '16:15 às 17:00' },
  { id: 't5', period: 'tarde', order: 5, label: '5º Horário', startTime: '17:00', endTime: '17:45', displayTime: '17:00 às 17:45' },
  { id: 't6', period: 'tarde', order: 6, label: '6º Horário', startTime: '17:45', endTime: '18:30', displayTime: '17:45 às 18:30' },
];

export const ALL_SLOTS = [...MORNING_SLOTS, ...AFTERNOON_SLOTS];

export const MORNING_BREAK: BreakSlot = {
  period: 'manha',
  label: 'Intervalo / Recreio',
  startTime: '09:30',
  endTime: '09:45',
  displayTime: '09:30 às 09:45',
  afterSlotId: 'm3'
};

export const AFTERNOON_BREAK: BreakSlot = {
  period: 'tarde',
  label: 'Intervalo / Recreio',
  startTime: '16:00',
  endTime: '16:15',
  displayTime: '16:00 às 16:15',
  afterSlotId: 't3'
};

export const RESOURCE_DETAILS: Record<ResourceType, { label: string; short: string; badge: string; description: string }> = {
  both: {
    label: 'Laboratório + Chromebooks',
    short: 'Lab + Chromebooks',
    badge: 'bg-green-100 text-green-900 border-green-300',
    description: 'Reserva completa do espaço físico e dos equipamentos de informática'
  },
  lab: {
    label: 'Apenas Laboratório',
    short: 'Apenas Laboratório',
    badge: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    description: 'Reserva do espaço físico do laboratório (outros podem usar os Chromebooks)'
  },
  chromebooks: {
    label: 'Apenas Chromebooks',
    short: 'Apenas Chromebooks',
    badge: 'bg-amber-100 text-amber-800 border-amber-200',
    description: 'Reserva dos computadores portáteis para uso na sala de aula'
  }
};

export const INITIAL_ADMIN_EMAILS = [
  'marcio.magalhaes.432@gmail.com',
  'marxiosmagal@gmail.com',
  'alunoteresa665@gmail.com'
];

export const DEFAULT_ACCESS_PASSWORD = 'tbs2026';
