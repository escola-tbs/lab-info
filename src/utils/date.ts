/**
 * Date manipulation and formatting utilities for Brazilian Portuguese (DD/MM/AAAA)
 */
import { ALL_SLOTS, TimeSlot } from '../types';

export function getTodayString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function formatDateBR(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-');
  if (!year || !month || !day) return dateString;
  return `${day}/${month}/${year}`;
}

export function formatDayOfWeek(dateString: string): string {
  if (!dateString) return '';
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  const days = [
    'Domingo',
    'Segunda-feira',
    'Terça-feira',
    'Quarta-feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado'
  ];
  return days[date.getDay()];
}

export function addDays(dateString: string, daysToAdd: number): string {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  date.setDate(date.getDate() + daysToAdd);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function getWeekDates(baseDateString: string): string[] {
  const [year, month, day] = baseDateString.split('-').map(Number);
  const date = new Date(year, month - 1, day);
  // Get Monday of current week
  const dayOfWeek = date.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = new Date(date);
  monday.setDate(date.getDate() + distanceToMonday);

  const week: string[] = [];
  // Monday to Friday (school days) or Saturday if desired
  for (let i = 0; i < 5; i++) {
    const current = new Date(monday);
    current.setDate(monday.getDate() + i);
    const y = current.getFullYear();
    const m = String(current.getMonth() + 1).padStart(2, '0');
    const d = String(current.getDate()).padStart(2, '0');
    week.push(`${y}-${m}-${d}`);
  }
  return week;
}

/**
 * Checks if a time slot on a given date has already passed
 */
export function isSlotConcluded(dateString: string, endTime: string): boolean {
  const now = new Date();
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = endTime.split(':').map(Number);

  const slotEnd = new Date(year, month - 1, day, hours, minutes);
  return now > slotEnd;
}

/**
 * Checks if an entire reservation has already passed (either past date or today with all slots ended)
 */
export function isReservationPast(reservation: { date: string; slots: string[] }): boolean {
  if (!reservation.date) return false;
  const now = new Date();
  const today = getTodayString();

  if (reservation.date < today) return true;
  if (reservation.date > today) return false;

  // Reservation is today: check if all of its slots have finished
  const slots = (reservation.slots || [])
    .map((id) => ALL_SLOTS.find((s) => s.id === id))
    .filter((s): s is TimeSlot => Boolean(s));

  if (slots.length === 0) return false;

  const latestEndTime = slots.reduce((latest, current) => {
    return current.endTime > latest ? current.endTime : latest;
  }, '00:00');

  const [year, month, day] = reservation.date.split('-').map(Number);
  const [hours, minutes] = latestEndTime.split(':').map(Number);
  const endDateTime = new Date(year, month - 1, day, hours, minutes);

  return now > endDateTime;
}
