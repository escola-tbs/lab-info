import React from 'react';
import {
  Clock,
  Coffee,
  CheckCircle2,
  Lock,
  MessageCircle,
  Plus,
  Laptop,
  MonitorCheck,
  Check,
  User as UserIcon,
  Sparkles
} from 'lucide-react';
import {
  TimeSlot,
  MORNING_SLOTS,
  AFTERNOON_SLOTS,
  MORNING_BREAK,
  AFTERNOON_BREAK,
  Reservation,
  RESOURCE_DETAILS
} from '../types';
import { isSlotConcluded } from '../utils/date';

interface DayScheduleViewProps {
  currentDate: string;
  periodFilter: 'all' | 'manha' | 'tarde';
  reservations: Reservation[];
  currentUserId?: string | null;
  onOpenBooking: (prefillSlotId?: string, prefillPeriod?: 'manha' | 'tarde') => void;
  onNegotiate: (reservation: Reservation) => void;
  onCancelReservation: (reservation: Reservation) => void;
  onEditReservation: (reservation: Reservation) => void;
}

export const DayScheduleView: React.FC<DayScheduleViewProps> = ({
  currentDate,
  periodFilter,
  reservations,
  currentUserId,
  onOpenBooking,
  onNegotiate,
  onCancelReservation,
  onEditReservation,
}) => {
  // Filter active reservations (ignoring canceladas)
  const activeReservations = reservations.filter((r) => r.status !== 'cancelada');

  // Helper to find who booked lab or chromebooks for a slot
  const getSlotOccupants = (slotId: string) => {
    let labRes: Reservation | null = null;
    let chromeRes: Reservation | null = null;

    for (const res of activeReservations) {
      if (res.slots.includes(slotId)) {
        if (res.resource === 'both') {
          labRes = res;
          chromeRes = res;
        } else if (res.resource === 'lab') {
          labRes = res;
        } else if (res.resource === 'chromebooks') {
          chromeRes = res;
        }
      }
    }

    return { labRes, chromeRes };
  };

  const renderSlotCard = (slot: TimeSlot) => {
    const { labRes, chromeRes } = getSlotOccupants(slot.id);
    const isLabOccupied = !!labRes;
    const isChromeOccupied = !!chromeRes;
    const isFullyOccupied = isLabOccupied && isChromeOccupied;
    const isFullyFree = !isLabOccupied && !isChromeOccupied;
    const isPast = isSlotConcluded(currentDate, slot.endTime);
    const hasAvailableResource = !isLabOccupied || !isChromeOccupied;
    const isBothBooked = Boolean(labRes && chromeRes && labRes.id === chromeRes.id);

    const myReservation =
      (labRes && labRes.userId === currentUserId)
        ? labRes
        : (chromeRes && chromeRes.userId === currentUserId)
        ? chromeRes
        : null;

    return (
      <div
        key={slot.id}
        className={`rounded-xl border transition-all duration-200 overflow-hidden ${
          isPast
            ? 'bg-slate-50/80 border-slate-300/70 opacity-90'
            : isFullyOccupied
            ? 'bg-red-50/30 border-red-300/75 shadow-xs'
            : isFullyFree
            ? 'bg-white border-emerald-300/75 hover:border-emerald-400/80 shadow-xs'
            : 'bg-amber-50/30 border-amber-300/75 shadow-xs'
        }`}
      >
        {/* Slot Header */}
        <div className="px-3 sm:px-4 py-2 sm:py-3 bg-slate-50/90 border-b border-slate-200/80 flex items-center justify-between gap-1.5 sm:gap-2">
          <div className="flex items-center gap-1.5 sm:gap-2.5 min-w-0">
            <span className="w-6 h-6 sm:w-7 sm:h-7 rounded-md sm:rounded-lg bg-green-100 text-green-800 flex items-center justify-center font-bold text-[11px] sm:text-xs shrink-0">
              {slot.order}º
            </span>
            <div className="min-w-0 flex items-baseline gap-1 sm:gap-2 flex-wrap sm:flex-nowrap">
              <span className="text-xs sm:text-sm font-bold text-slate-800 truncate">Horário</span>
              <span className="text-[10px] sm:text-xs text-slate-500 font-mono whitespace-nowrap">{slot.displayTime}</span>
            </div>
          </div>

          <div className="flex items-center gap-1 sm:gap-2 shrink-0">
            {isPast && (
              <span className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-medium px-1.5 sm:px-2 py-0.5 rounded-md bg-slate-200 text-slate-700 whitespace-nowrap">
                <Clock className="w-2.5 h-2.5 sm:w-3 sm:h-3" />
                Finalizado
              </span>
            )}

            {myReservation && !isPast && (
              <button
                type="button"
                onClick={() => onEditReservation(myReservation)}
                title="Clique para editar sua reserva"
                className="inline-flex items-center gap-0.5 sm:gap-1 text-[10px] sm:text-[11px] font-bold px-1.5 sm:px-2.5 py-0.5 sm:py-1 rounded-md bg-green-100 hover:bg-green-200 text-green-800 border border-green-300 transition-all cursor-pointer active:scale-95 shadow-2xs whitespace-nowrap"
              >
                <Sparkles className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-green-700" />
                <span className="hidden xs:inline">Minha Reserva</span>
                <span className="inline xs:hidden sm:inline">Minha Reserva</span>
              </button>
            )}

            {hasAvailableResource && !isPast && (
              <button
                type="button"
                onClick={() => onOpenBooking(slot.id, slot.period)}
                className="inline-flex items-center gap-0.5 sm:gap-1 text-[11px] sm:text-xs font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <Plus className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Reservar</span>
              </button>
            )}

            {isBothBooked && !isPast && labRes && labRes.userId !== currentUserId && (
              <button
                type="button"
                onClick={() => onNegotiate(labRes)}
                title="Negociar horário via WhatsApp"
                className="inline-flex items-center gap-1 text-[10px] sm:text-[11px] font-semibold px-2 py-0.5 sm:px-2.5 sm:py-1 rounded-md sm:rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs active:scale-95 cursor-pointer whitespace-nowrap"
              >
                <MessageCircle className="w-3 h-3 sm:w-3.5 sm:h-3.5" />
                <span>Negociar via WhatsApp</span>
              </button>
            )}
          </div>
        </div>

        {/* Slot Body: Lab & Chromebook status */}
        <div className="p-4 grid grid-cols-1 md:grid-cols-2 gap-3">
          {/* Lab Resource Box */}
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              isLabOccupied
                ? 'bg-white border-red-200 shadow-2xs'
                : 'bg-emerald-50/50 border-emerald-200/60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <MonitorCheck className="w-4 h-4 text-slate-600" />
                  Espaço do Laboratório
                </span>
                {isLabOccupied ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Reservado
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Livre
                  </span>
                )}
              </div>

              {labRes ? (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-semibold text-slate-900 flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    {labRes.userName}
                  </p>
                  <p className="text-slate-600 italic line-clamp-2">
                    "{labRes.purpose}"
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        labRes.status === 'confirmada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Status: {labRes.status === 'confirmada' ? 'Confirmada' : 'Pendente'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {labRes.resource === 'both' ? 'Uso com Chromebooks' : 'Apenas Laboratório'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-700 mt-1">
                  Espaço físico disponível para aulas e atividades.
                </p>
              )}
            </div>

            {/* Negotiation / Action Button */}
            {labRes && (labRes.userId === currentUserId ? !isPast : !isBothBooked) && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                {labRes.userId === currentUserId ? (
                  <button
                    onClick={() => onCancelReservation(labRes)}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium cursor-pointer"
                  >
                    Cancelar minha reserva
                  </button>
                ) : (
                  <button
                    onClick={() => onNegotiate(labRes)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Negociar via WhatsApp
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Chromebooks Resource Box */}
          <div
            className={`p-3 rounded-lg border flex flex-col justify-between ${
              isChromeOccupied
                ? 'bg-white border-red-200 shadow-2xs'
                : 'bg-emerald-50/50 border-emerald-200/60'
            }`}
          >
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                  <Laptop className="w-4 h-4 text-slate-600" />
                  Carrinho de Chromebooks
                </span>
                {isChromeOccupied ? (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-red-100 text-red-800 flex items-center gap-1">
                    <Lock className="w-3 h-3" /> Reservado
                  </span>
                ) : (
                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 flex items-center gap-1">
                    <CheckCircle2 className="w-3 h-3" /> Livre
                  </span>
                )}
              </div>

              {chromeRes ? (
                <div className="mt-2 space-y-1 text-xs">
                  <p className="font-semibold text-slate-900 flex items-center gap-1">
                    <UserIcon className="w-3.5 h-3.5 text-slate-400" />
                    {chromeRes.userName}
                  </p>
                  <p className="text-slate-600 italic line-clamp-2">
                    "{chromeRes.purpose}"
                  </p>
                  <div className="flex items-center gap-2 pt-1">
                    <span
                      className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                        chromeRes.status === 'confirmada'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-amber-100 text-amber-800'
                      }`}
                    >
                      Status: {chromeRes.status === 'confirmada' ? 'Confirmada' : 'Pendente'}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {chromeRes.resource === 'both' ? 'Uso com Laboratório' : 'Apenas Chromebooks'}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-xs text-emerald-700 mt-1">
                  Chromebooks livres para reserva ou empréstimo em sala.
                </p>
              )}
            </div>

            {/* Negotiation / Action Button */}
            {chromeRes && (chromeRes.userId === currentUserId ? (!isPast && !isBothBooked) : !isBothBooked) && (
              <div className="mt-3 pt-2 border-t border-slate-100 flex items-center justify-between">
                {chromeRes.userId === currentUserId ? (
                  <button
                    onClick={() => onCancelReservation(chromeRes)}
                    className="text-xs text-red-600 hover:text-red-700 hover:underline font-medium cursor-pointer"
                  >
                    Cancelar minha reserva
                  </button>
                ) : (
                  <button
                    onClick={() => onNegotiate(chromeRes)}
                    className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-md bg-emerald-600 hover:bg-emerald-700 text-white transition-colors shadow-2xs cursor-pointer"
                  >
                    <MessageCircle className="w-3.5 h-3.5" />
                    Negociar via WhatsApp
                  </button>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    );
  };

  const renderBreakCard = (label: string, time: string) => (
    <div
      key={`break-${time}`}
      className="bg-amber-50/80 border border-dashed border-amber-400 rounded-xl p-3 flex items-center justify-center gap-2 text-amber-900"
    >
      <Coffee className="w-4 h-4 text-amber-600" />
      <span className="text-xs font-bold uppercase tracking-wider">{label}</span>
      <span className="text-xs font-mono font-semibold">({time})</span>
      <span className="text-[11px] text-amber-700 font-medium hidden sm:inline">
        • Horário exclusivo de recreio (não reservável)
      </span>
    </div>
  );

  return (
    <div className="space-y-8">
      {/* Morning Shift */}
      {(periodFilter === 'all' || periodFilter === 'manha') && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold">
                M
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Turno da Manhã</h2>
                <p className="text-xs text-slate-500">07:00 às 12:00 • 6 Horários Letivos</p>
              </div>
            </div>
            <button
              onClick={() => onOpenBooking(undefined, 'manha')}
              className="text-xs font-semibold text-green-700 hover:text-green-800 hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Reservar na Manhã
            </button>
          </div>

          <div className="space-y-4">
            {MORNING_SLOTS.slice(0, 3).map((slot) => renderSlotCard(slot))}
            {renderBreakCard(MORNING_BREAK.label, MORNING_BREAK.displayTime)}
            {MORNING_SLOTS.slice(3).map((slot) => renderSlotCard(slot))}
          </div>
        </section>
      )}

      {/* Afternoon Shift */}
      {(periodFilter === 'all' || periodFilter === 'tarde') && (
        <section className="bg-white rounded-2xl border border-slate-200/80 shadow-xs p-5 sm:p-6">
          <div className="flex items-center justify-between border-b border-slate-100 pb-4 mb-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                T
              </div>
              <div>
                <h2 className="text-lg font-bold text-slate-900">Turno da Tarde</h2>
                <p className="text-xs text-slate-500">13:30 às 18:30 • 6 Horários Letivos</p>
              </div>
            </div>
            <button
              onClick={() => onOpenBooking(undefined, 'tarde')}
              className="text-xs font-semibold text-green-700 hover:text-green-800 hover:underline flex items-center gap-1"
            >
              <Plus className="w-4 h-4" />
              Reservar na Tarde
            </button>
          </div>

          <div className="space-y-4">
            {AFTERNOON_SLOTS.slice(0, 3).map((slot) => renderSlotCard(slot))}
            {renderBreakCard(AFTERNOON_BREAK.label, AFTERNOON_BREAK.displayTime)}
            {AFTERNOON_SLOTS.slice(3).map((slot) => renderSlotCard(slot))}
          </div>
        </section>
      )}
    </div>
  );
};
