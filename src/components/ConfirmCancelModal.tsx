import React from 'react';
import { AlertTriangle } from 'lucide-react';
import { Reservation, ALL_SLOTS, RESOURCE_DETAILS } from '../types';
import { formatDateBR, formatDayOfWeek } from '../utils/date';

interface ConfirmCancelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  reservation: Reservation | null;
  isLoading?: boolean;
}

export const ConfirmCancelModal: React.FC<ConfirmCancelModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  reservation,
  isLoading = false,
}) => {
  if (!isOpen || !reservation) return null;

  const slotLabels = reservation.slots
    .map((s) => ALL_SLOTS.find((slot) => slot.id === s)?.label)
    .join(', ');

  const resourceInfo = RESOURCE_DETAILS[reservation.resource];

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 animate-in fade-in zoom-in-95">
        <div className="flex items-center gap-3 text-amber-600 mb-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 flex items-center justify-center shrink-0">
            <AlertTriangle className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">
              Confirmar cancelamento de reserva?
            </h3>
            <p className="text-xs text-slate-500">Esta ação não pode ser desfeita</p>
          </div>
        </div>

        <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200/80 mb-4 space-y-1.5 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Data:</span>
            <span className="font-bold text-slate-900">
              {formatDateBR(reservation.date)} ({formatDayOfWeek(reservation.date)})
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Turno:</span>
            <span className="font-semibold text-slate-800">
              {reservation.period === 'manha' ? 'Manhã' : 'Tarde'}
            </span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Recurso:</span>
            <span className="font-semibold text-slate-800">{resourceInfo.label}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Horários:</span>
            <span className="font-semibold text-slate-800">{slotLabels}</span>
          </div>
        </div>

        <p className="text-xs text-slate-600 mb-5 leading-relaxed">
          Ao cancelar esta reserva, os horários ficarão <strong>imediatamente liberados</strong> para que outros professores da escola possam utilizá-los.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
          <button
            type="button"
            disabled={isLoading}
            onClick={onClose}
            className="px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
          >
            Voltar
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className="px-5 py-2.5 text-xs font-bold text-white bg-red-600 hover:bg-red-700 disabled:opacity-60 rounded-lg shadow-sm transition-all cursor-pointer active:scale-95"
          >
            {isLoading ? 'Cancelando...' : 'Sim, cancelar reserva'}
          </button>
        </div>
      </div>
    </div>
  );
};
