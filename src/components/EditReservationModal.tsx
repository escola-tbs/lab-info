import React, { useState, useEffect } from 'react';
import { X, Edit3, AlertCircle, Check } from 'lucide-react';
import {
  Reservation,
  ResourceType,
  PeriodType,
  TimeSlot,
  MORNING_SLOTS,
  AFTERNOON_SLOTS,
  RESOURCE_DETAILS
} from '../types';
import { updateReservationAtomic, checkResourceConflict } from '../services/reservationService';
import { formatDateBR, formatDayOfWeek, isSlotConcluded } from '../utils/date';

interface EditReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
  allReservations: Reservation[];
  onSuccess: () => void;
}

export const EditReservationModal: React.FC<EditReservationModalProps> = ({
  isOpen,
  onClose,
  reservation,
  allReservations,
  onSuccess,
}) => {
  const [date, setDate] = useState('');
  const [period, setPeriod] = useState<PeriodType>('manha');
  const [resource, setResource] = useState<ResourceType>('both');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [purpose, setPurpose] = useState('');

  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isPurposeTouched, setIsPurposeTouched] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (reservation) {
      setDate(reservation.date);
      setPeriod(reservation.period);
      setResource(reservation.resource);
      setSelectedSlots(reservation.slots);
      setPurpose(reservation.purpose);
      setErrorMessage(null);
      setHasAttemptedSubmit(false);
      setIsPurposeTouched(false);
    }
  }, [reservation, isOpen]);

  if (!isOpen || !reservation) return null;

  const isPurposeEmpty = (hasAttemptedSubmit || isPurposeTouched) && !purpose.trim();

  const currentSlots = period === 'manha' ? MORNING_SLOTS : AFTERNOON_SLOTS;

  const isSlotDisabled = (slot: TimeSlot): { disabled: boolean; reason?: string } => {
    if (isSlotConcluded(date, slot.endTime)) {
      return { disabled: true, reason: 'Encerrado' };
    }

    // Check conflict excluding current reservation
    const dayRes = allReservations.filter(
      (r) => r.date === date && r.status !== 'cancelada' && r.id !== reservation.id
    );

    for (const r of dayRes) {
      if (r.slots.includes(slot.id)) {
        if (checkResourceConflict(r.resource, resource)) {
          return {
            disabled: true,
            reason: `Reservado por ${r.userName}`
          };
        }
      }
    }

    return { disabled: false };
  };

  const toggleSlot = (slotId: string) => {
    if (selectedSlots.includes(slotId)) {
      setSelectedSlots(selectedSlots.filter((s) => s !== slotId));
    } else {
      setSelectedSlots([...selectedSlots, slotId]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (selectedSlots.length === 0) {
      setErrorMessage('Selecione pelo menos um horário disponível.');
      return;
    }

    if (!purpose.trim()) {
      setErrorMessage('A finalidade da reserva é obrigatória.');
      return;
    }

    setIsLoading(true);

    try {
      await updateReservationAtomic(reservation.id, {
        date,
        period,
        slots: selectedSlots,
        resource,
        purpose: purpose.trim()
      });

      onSuccess();
      onClose();
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao atualizar reserva.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-200">
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div>
            <h2 className="text-xl font-bold text-slate-900 flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-green-700" />
              Editar Reserva
            </h2>
            <p className="text-xs text-slate-500">
              Modifique data, horários ou finalidade mantendo as regras de disponibilidade
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5 text-sm">
          {errorMessage && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Date & Period */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Data *
              </label>
              <input
                type="date"
                required
                value={date}
                onChange={(e) => {
                  setDate(e.target.value);
                  setSelectedSlots([]);
                }}
                className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-hidden"
              />
              <p className="text-[11px] text-slate-500 mt-1">
                {formatDateBR(date)} ({formatDayOfWeek(date)})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Turno *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('manha');
                    setSelectedSlots([]);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    period === 'manha'
                      ? 'bg-amber-500 text-white border-amber-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Manhã
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('tarde');
                    setSelectedSlots([]);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all ${
                    period === 'tarde'
                      ? 'bg-orange-500 text-white border-orange-500'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Tarde
                </button>
              </div>
            </div>
          </div>

          {/* Resource */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Recurso *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['both', 'lab', 'chromebooks'] as ResourceType[]).map((resKey) => {
                const info = RESOURCE_DETAILS[resKey];
                const isSelected = resource === resKey;
                return (
                  <button
                    type="button"
                    key={resKey}
                    onClick={() => setResource(resKey)}
                    className={`p-2.5 rounded-lg border text-xs font-bold transition-all text-center ${
                      isSelected
                        ? 'border-green-700 bg-green-50 text-green-800'
                        : 'border-slate-200 bg-white text-slate-700 hover:border-slate-300'
                    }`}
                  >
                    {info.short}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Slots */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Horários Desejados *
            </label>
            <div className="grid grid-cols-2 gap-2">
              {currentSlots.map((slot) => {
                const { disabled, reason } = isSlotDisabled(slot);
                const isChecked = selectedSlots.includes(slot.id);

                return (
                  <button
                    type="button"
                    key={slot.id}
                    disabled={disabled}
                    onClick={() => toggleSlot(slot.id)}
                    className={`p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between ${
                      disabled
                        ? 'bg-slate-100 border-slate-200 opacity-60 cursor-not-allowed'
                        : isChecked
                        ? 'bg-green-700 text-white border-green-700 font-bold'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-green-400'
                    }`}
                  >
                    <div>
                      <span className="block">{slot.label}</span>
                      <span className="text-[10px] opacity-80 font-mono">{slot.displayTime}</span>
                    </div>
                    {disabled && <span className="text-[9px] text-red-600">{reason}</span>}
                    {isChecked && <Check className="w-3.5 h-3.5" />}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Finalidade da Reserva *
            </label>
            <textarea
              required
              rows={2}
              maxLength={500}
              value={purpose}
              onChange={(e) => {
                setPurpose(e.target.value);
                if (e.target.value.trim()) setIsPurposeTouched(false);
              }}
              onBlur={() => {
                if (!purpose.trim()) setIsPurposeTouched(true);
              }}
              className={`w-full px-3 py-2 text-sm bg-white border rounded-lg focus:ring-2 focus:outline-hidden transition-colors ${
                isPurposeEmpty
                  ? 'border-red-400 focus:border-red-500 focus:ring-red-400/30 bg-red-50/10'
                  : 'border-slate-300 focus:border-green-600 focus:ring-green-500'
              }`}
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-lg"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={() => setHasAttemptedSubmit(true)}
              disabled={isLoading}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2"
            >
              {isLoading ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
