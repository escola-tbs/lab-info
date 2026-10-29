import React, { useState } from 'react';
import {
  X,
  Laptop,
  Calendar,
  Trash2,
  Edit3,
  AlertTriangle,
  Clock
} from 'lucide-react';
import { Reservation, RESOURCE_DETAILS, ALL_SLOTS } from '../types';
import { formatDateBR, formatDayOfWeek, isReservationPast } from '../utils/date';
import { cancelReservation } from '../services/reservationService';

interface MyReservationsModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservations: Reservation[];
  currentUserId: string;
  onEditReservation: (res: Reservation) => void;
  onRefresh: () => void;
}

export const MyReservationsModal: React.FC<MyReservationsModalProps> = ({
  isOpen,
  onClose,
  reservations,
  currentUserId,
  onEditReservation,
  onRefresh,
}) => {
  const [cancellingRes, setCancellingRes] = useState<Reservation | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const myReservations = reservations
    .filter((r) => r.userId === currentUserId)
    .sort((a, b) => (a.date < b.date ? 1 : -1));

  const handleConfirmCancel = async () => {
    if (!cancellingRes) return;
    setIsProcessing(true);
    setError(null);

    try {
      await cancelReservation(cancellingRes.id);
      setCancellingRes(null);
      onRefresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao cancelar reserva.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Laptop className="w-5 h-5 text-green-700" />
              Minhas Reservas
            </h2>
            <p className="text-xs text-slate-500">
              Histórico e gerenciamento das suas solicitações no laboratório
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {error && (
          <div className="mx-6 mt-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <div className="p-6">
          {myReservations.length === 0 ? (
            <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
              <Calendar className="w-10 h-10 text-slate-300 mx-auto mb-2" />
              <p className="text-sm font-semibold text-slate-700">Você ainda não tem reservas cadastradas</p>
              <p className="text-xs text-slate-500 mt-1">
                Utilize o botão "Nova Reserva" para agendar o laboratório ou Chromebooks.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {myReservations.map((res) => {
                const isCancelled = res.status === 'cancelada';
                const isConfirmed = res.status === 'confirmada';
                const isPast = isReservationPast(res);
                const slotLabels = res.slots
                  .map((s) => ALL_SLOTS.find((slot) => slot.id === s)?.label)
                  .join(', ');

                const resourceInfo = RESOURCE_DETAILS[res.resource];

                return (
                  <div
                    key={res.id}
                    className={`p-4 rounded-xl border transition-all ${
                      isCancelled
                        ? 'bg-slate-50 border-slate-200 opacity-60'
                        : isPast
                        ? 'bg-slate-50/70 border-slate-200 opacity-80'
                        : 'bg-white border-slate-200/90 shadow-xs hover:border-slate-300'
                    }`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 mb-2">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-bold text-slate-900 font-mono">
                          {formatDateBR(res.date)}
                        </span>
                        <span className="text-xs text-slate-500">
                          ({formatDayOfWeek(res.date)})
                        </span>
                        <span className="text-xs text-slate-400">• {res.period === 'manha' ? 'Manhã' : 'Tarde'}</span>
                      </div>

                      <div className="flex items-center gap-2">
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            isCancelled
                              ? 'bg-red-100 text-red-800'
                              : isPast
                              ? 'bg-slate-100 text-slate-700 border border-slate-200'
                              : isConfirmed
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {isCancelled ? 'Cancelada' : isPast ? 'Finalizada' : isConfirmed ? 'Confirmada' : 'Pendente'}
                        </span>
                      </div>
                    </div>

                    <div className="text-xs space-y-1 mb-3">
                      <p className="text-slate-700">
                        <span className="font-semibold">Recurso:</span> {resourceInfo.label}
                      </p>
                      <p className="text-slate-700">
                        <span className="font-semibold">Horários:</span> {slotLabels}
                      </p>
                      <p className="text-slate-600 italic">
                        <span className="font-semibold not-italic">Motivo:</span> "{res.purpose}"
                      </p>
                    </div>

                    {!isCancelled && !isPast && (
                      <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                        <button
                          onClick={() => {
                            onClose();
                            onEditReservation(res);
                          }}
                          className="px-3 py-1.5 text-xs font-semibold text-green-700 hover:text-green-800 hover:bg-green-50 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Edit3 className="w-3.5 h-3.5" />
                          Editar
                        </button>
                        <button
                          onClick={() => setCancellingRes(res)}
                          className="px-3 py-1.5 text-xs font-semibold text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg flex items-center gap-1 cursor-pointer transition-colors"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          Cancelar Reserva
                        </button>
                      </div>
                    )}

                    {!isCancelled && isPast && (
                      <div className="flex items-center justify-end pt-2 border-t border-slate-100">
                        <span className="text-[11px] text-slate-400 font-medium flex items-center gap-1">
                          <Clock className="w-3 h-3 text-slate-400" />
                          Horário já concluído
                        </span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Confirmation Sub-Modal for Cancellation */}
      {cancellingRes && (
        <div className="fixed inset-0 z-60 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-center gap-3 text-amber-600 mb-3">
              <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <h3 className="text-base font-bold text-slate-900">
                Confirmar cancelamento de reserva?
              </h3>
            </div>
            <p className="text-xs text-slate-600 mb-4 leading-relaxed">
              Ao cancelar a reserva do dia <strong>{formatDateBR(cancellingRes.date)}</strong>, os horários ficarão imediatamente liberados para que outros professores da escola possam utilizá-los.
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                disabled={isProcessing}
                onClick={() => setCancellingRes(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
              >
                Voltar
              </button>
              <button
                disabled={isProcessing}
                onClick={handleConfirmCancel}
                className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm"
              >
                {isProcessing ? 'Cancelando...' : 'Sim, cancelar reserva'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
