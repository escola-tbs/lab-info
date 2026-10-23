import React from 'react';
import { Calendar, Monitor, Laptop, ChevronRight } from 'lucide-react';
import { getWeekDates, formatDateBR, formatDayOfWeek, getTodayString } from '../utils/date';
import { Reservation, ALL_SLOTS } from '../types';

interface WeekScheduleViewProps {
  currentDate: string;
  onSelectDate: (date: string) => void;
  allReservations: Reservation[];
}

export const WeekScheduleView: React.FC<WeekScheduleViewProps> = ({
  currentDate,
  onSelectDate,
  allReservations,
}) => {
  const weekDates = getWeekDates(currentDate);
  const today = getTodayString();

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-3.5 sm:p-6 mb-6">
      <div className="flex items-center justify-between pb-3 sm:pb-4 mb-4 sm:mb-6 border-b border-slate-100">
        <div>
          <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
            <Calendar className="w-5 h-5 text-green-700 shrink-0" />
            <span>Visão Geral da Semana</span>
          </h2>
          <p className="text-xs text-slate-500">
            Clique em qualquer dia para ver os detalhes completos ou agendar
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
        {weekDates.map((dateStr) => {
          const isToday = dateStr === today;
          const isSelected = dateStr === currentDate;
          const dayName = formatDayOfWeek(dateStr);
          const dateBR = formatDateBR(dateStr);

          // Get active reservations on that day
          const dayRes = allReservations.filter(
            (r) => r.date === dateStr && r.status !== 'cancelada'
          );

          // Calculate booked slots for Lab and Chromebooks
          const labSlotsBooked = new Set<string>();
          const chromeSlotsBooked = new Set<string>();

          dayRes.forEach((r) => {
            r.slots.forEach((s) => {
              if (r.resource === 'both') {
                labSlotsBooked.add(s);
                chromeSlotsBooked.add(s);
              } else if (r.resource === 'lab') {
                labSlotsBooked.add(s);
              } else if (r.resource === 'chromebooks') {
                chromeSlotsBooked.add(s);
              }
            });
          });

          const totalSlots = ALL_SLOTS.length; // 12 (6 manhã + 6 tarde)
          const freeLab = totalSlots - labSlotsBooked.size;
          const freeChrome = totalSlots - chromeSlotsBooked.size;

          return (
            <div
              key={dateStr}
              onClick={() => onSelectDate(dateStr)}
              className={`rounded-xl border p-4 cursor-pointer transition-all hover:shadow-md flex flex-col justify-between ${
                isSelected
                  ? 'border-green-600/90 bg-green-50/40 ring-2 ring-green-600/20'
                  : isToday
                  ? 'border-amber-400/75 bg-amber-50/20 hover:border-amber-400 shadow-xs'
                  : 'border-slate-300/75 bg-white hover:border-slate-300 shadow-xs'
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                    {dayName.replace('-feira', '')}
                  </span>
                  {isToday && (
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800">
                      Hoje
                    </span>
                  )}
                </div>
                <p className="text-base font-bold text-slate-900 font-mono">{dateBR}</p>

                {/* Occupancy stats */}
                <div className="mt-4 space-y-2.5">
                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-700 font-medium mb-1">
                      <span className="flex items-center gap-1.5">
                        <Monitor className="w-3.5 h-3.5 text-green-700" />
                        Laboratório
                      </span>
                      <span className="font-bold">
                        {freeLab === 0 ? (
                          <span className="text-red-600">Lotado</span>
                        ) : (
                          <span className="text-emerald-700">{freeLab} livres</span>
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-green-700 h-1.5 rounded-full"
                        style={{ width: `${(labSlotsBooked.size / totalSlots) * 100}%` }}
                      />
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 text-xs">
                    <div className="flex items-center justify-between text-slate-700 font-medium mb-1">
                      <span className="flex items-center gap-1.5">
                        <Laptop className="w-3.5 h-3.5 text-amber-600" />
                        Chromebooks
                      </span>
                      <span className="font-bold">
                        {freeChrome === 0 ? (
                          <span className="text-red-600">Lotado</span>
                        ) : (
                          <span className="text-emerald-700">{freeChrome} livres</span>
                        )}
                      </span>
                    </div>
                    <div className="w-full bg-slate-200 rounded-full h-1.5 overflow-hidden">
                      <div
                        className="bg-amber-600 h-1.5 rounded-full"
                        style={{ width: `${(chromeSlotsBooked.size / totalSlots) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-green-700 font-semibold group">
                <span>Ver horários</span>
                <ChevronRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
