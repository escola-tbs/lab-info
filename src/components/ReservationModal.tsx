import React, { useState, useEffect } from 'react';
import {
  X,
  Calendar,
  Clock,
  Check,
  AlertCircle,
  KeyRound,
  User,
  FileText,
  Info,
  CheckCircle2,
  Eye,
  EyeOff
} from 'lucide-react';
import {
  ResourceType,
  PeriodType,
  TimeSlot,
  MORNING_SLOTS,
  AFTERNOON_SLOTS,
  RESOURCE_DETAILS,
  UserProfile,
  Reservation
} from '../types';
import { formatPhoneInput, validateAndNormalizeBRPhone, formatNormalizedDisplay } from '../utils/phone';
import { formatDateBR, formatDayOfWeek, isSlotConcluded } from '../utils/date';
import {
  createReservationAtomic,
  saveUserProfile,
  checkResourceConflict
} from '../services/reservationService';

interface ReservationModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onSaveProfile: (profile: UserProfile) => void;
  onOpenProfile?: () => void;
  existingReservations: Reservation[];
  initialDate?: string;
  initialSlotId?: string;
  initialPeriod?: PeriodType;
  onSuccess: (reservation: Reservation) => void;
}

export const ReservationModal: React.FC<ReservationModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onSaveProfile,
  onOpenProfile,
  existingReservations,
  initialDate,
  initialSlotId,
  initialPeriod,
  onSuccess,
}) => {
  // Check if user already has identification in profile
  const hasSavedProfile = Boolean(
    userProfile?.displayName?.trim() && userProfile?.whatsapp?.trim()
  );

  // Form State
  const [name, setName] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [phoneError, setPhoneError] = useState<string | null>(null);

  const [date, setDate] = useState(initialDate || new Date().toISOString().split('T')[0]);
  const [period, setPeriod] = useState<PeriodType>(initialPeriod || 'manha');
  const [resource, setResource] = useState<ResourceType>('both');
  const [selectedSlots, setSelectedSlots] = useState<string[]>([]);
  const [purpose, setPurpose] = useState('');
  const [accessPassword, setAccessPassword] = useState('');
  const [showAccessPassword, setShowAccessPassword] = useState(false);

  // Field validation tracking
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);
  const [isPurposeTouched, setIsPurposeTouched] = useState(false);
  const [isPasswordTouched, setIsPasswordTouched] = useState(false);
  const [isPasswordInvalid, setIsPasswordInvalid] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sync initial props
  useEffect(() => {
    if (userProfile) {
      setName(userProfile.displayName || '');
      setPhoneRaw(formatPhoneInput(userProfile.whatsapp || ''));
    }
  }, [userProfile]);

  useEffect(() => {
    if (initialDate) setDate(initialDate);
    if (initialPeriod) setPeriod(initialPeriod);
    if (initialSlotId) {
      setSelectedSlots([initialSlotId]);
    } else {
      setSelectedSlots([]);
    }
    setErrorMessage(null);
    setHasAttemptedSubmit(false);
    setIsPurposeTouched(false);
    setIsPasswordTouched(false);
    setIsPasswordInvalid(false);
    setShowAccessPassword(false);
  }, [initialDate, initialPeriod, initialSlotId, isOpen]);

  if (!isOpen) return null;

  const isPurposeEmpty = (hasAttemptedSubmit || isPurposeTouched) && !purpose.trim();
  const isPasswordEmpty = (hasAttemptedSubmit || isPasswordTouched) && !accessPassword.trim();
  const hasPasswordError = isPasswordEmpty || isPasswordInvalid;

  const currentSlots = period === 'manha' ? MORNING_SLOTS : AFTERNOON_SLOTS;

  // Real-time conflict inspection for each slot
  const isSlotDisabled = (slot: TimeSlot): { disabled: boolean; reason?: string } => {
    // 1. Is it concluded?
    if (isSlotConcluded(date, slot.endTime)) {
      return { disabled: true, reason: 'Horário já encerrado' };
    }

    // 2. Check collision with existing reservations on this date
    const dayRes = existingReservations.filter(
      (r) => r.date === date && r.status !== 'cancelada'
    );

    for (const r of dayRes) {
      if (r.slots.includes(slot.id)) {
        if (checkResourceConflict(r.resource, resource)) {
          return {
            disabled: true,
            reason: `Reservado por ${r.userName} (${RESOURCE_DETAILS[r.resource].short})`
          };
        }
      }
    }

    return { disabled: false };
  };

  const handlePhoneChange = (val: string) => {
    const formatted = formatPhoneInput(val);
    setPhoneRaw(formatted);
    const validation = validateAndNormalizeBRPhone(formatted);
    if (!validation.isValid && formatted.length > 5) {
      setPhoneError(validation.error || 'Número inválido');
    } else {
      setPhoneError(null);
    }
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

    let finalName = '';
    let finalPhoneNormalized = '';

    // 1. Check Identification
    if (hasSavedProfile && userProfile) {
      finalName = userProfile.displayName.trim();
      finalPhoneNormalized = userProfile.whatsapp.trim();
    } else {
      if (!name.trim()) {
        setErrorMessage('Por favor, informe seu nome completo.');
        return;
      }

      const phoneValidation = validateAndNormalizeBRPhone(phoneRaw);
      if (!phoneValidation.isValid) {
        setErrorMessage(phoneValidation.error || 'Por favor, informe um WhatsApp válido.');
        return;
      }
      finalName = name.trim();
      finalPhoneNormalized = phoneValidation.normalized;
    }

    // 2. Validate Slots
    if (selectedSlots.length === 0) {
      setErrorMessage('Por favor, selecione pelo menos um horário disponível.');
      return;
    }

    // 3. Validate Purpose
    if (!purpose.trim()) {
      setIsPurposeTouched(true);
      setHasAttemptedSubmit(true);
      setErrorMessage('A finalidade da reserva é obrigatória (ex: turma, disciplina, atividade).');
      return;
    }

    // 4. Validate Access Password
    if (!accessPassword.trim()) {
      setIsPasswordTouched(true);
      setHasAttemptedSubmit(true);
      setErrorMessage('A senha de acesso do laboratório é obrigatória.');
      return;
    }

    setIsLoading(true);

    try {
      // Save user profile if it was the first time
      if (!hasSavedProfile && userProfile) {
        const updatedProfile: UserProfile = {
          ...userProfile,
          displayName: finalName,
          whatsapp: finalPhoneNormalized
        };
        await saveUserProfile(updatedProfile);
        onSaveProfile(updatedProfile);
      }

      // Execute Atomic Booking with Firestore transaction
      const newReservation = await createReservationAtomic({
        date,
        period,
        slots: selectedSlots,
        resource,
        purpose: purpose.trim(),
        userName: finalName,
        accessPasswordInput: accessPassword.trim()
      });

      onSuccess(newReservation);
      onClose();
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Erro ao processar reserva.';
      setErrorMessage(msg);
      if (msg.toLowerCase().includes('senha')) {
        setIsPasswordInvalid(true);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-2xl w-full max-h-[92vh] overflow-y-auto shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        {/* Modal Header */}
        <div className="px-5 sm:px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between sticky top-0 bg-white dark:bg-slate-900 z-10 transition-colors">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-green-700 dark:text-green-400 shrink-0" />
              <span>Nova Reserva do Laboratório TBS</span>
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Preencha os dados abaixo para agendar horários
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-4 sm:p-6 space-y-5 sm:space-y-6">
          {errorMessage && (
            <div className="p-3.5 bg-red-50 border border-red-200 rounded-xl text-red-700 text-xs sm:text-sm flex items-start gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">Não foi possível confirmar a reserva</p>
                <p className="text-xs mt-0.5 leading-relaxed">{errorMessage}</p>
              </div>
            </div>
          )}

          {/* Section 1: User Identification (Shown only if NOT saved yet; otherwise compact banner) */}
          {hasSavedProfile ? (
            <div className="flex items-center justify-between p-3 sm:p-3.5 bg-green-50/70 rounded-xl border border-green-200/80 text-xs">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-green-700 text-white flex items-center justify-center font-bold text-xs shrink-0">
                  <User className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <span className="font-bold text-slate-800 block text-xs sm:text-sm truncate">
                    {userProfile?.displayName}
                  </span>
                  <span className="text-[10px] sm:text-[11px] text-slate-600 font-mono truncate block">
                    WhatsApp: {formatNormalizedDisplay(userProfile?.whatsapp || '')}
                  </span>
                </div>
              </div>
              {onOpenProfile && (
                <button
                  type="button"
                  onClick={() => {
                    onClose();
                    onOpenProfile();
                  }}
                  className="text-[10px] sm:text-[11px] font-semibold text-green-700 hover:text-green-800 hover:underline px-2 py-1 cursor-pointer shrink-0 ml-2 whitespace-nowrap"
                >
                  Alterar no Perfil
                </button>
              )}
            </div>
          ) : (
            <div className="bg-slate-50/80 p-4 rounded-xl border border-slate-200/70 space-y-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                <User className="w-3.5 h-3.5 text-green-700" />
                Identificação do Responsável (Primeiro Acesso)
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Nome Completo *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ex: Prof. Carlos Oliveira"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-hidden"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between gap-1">
                    <span>WhatsApp *</span>
                    <span className="text-[9px] sm:text-[10px] text-green-700 font-normal shrink-0">Ex: (91) 9 0000-0000</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Ex: (91) 9 0000-0000"
                    value={phoneRaw}
                    onChange={(e) => handlePhoneChange(e.target.value)}
                    className="w-full px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-hidden font-mono"
                  />
                  <p className="text-[10px] text-slate-500 mt-1">
                    Atenção: precisa ser número de WhatsApp válido para negociação de horários.
                  </p>
                  {phoneError && <p className="text-[11px] text-red-600 mt-1">{phoneError}</p>}
                </div>
              </div>
            </div>
          )}

          {/* Section 2: Date & Shift */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                Data da Reserva *
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
                {formatDayOfWeek(date)} ({formatDateBR(date)})
              </p>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-slate-500" />
                Turno de Funcionamento *
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('manha');
                    setSelectedSlots([]);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    period === 'manha'
                      ? 'bg-amber-500 text-white border-amber-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Manhã (07h - 12h)
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setPeriod('tarde');
                    setSelectedSlots([]);
                  }}
                  className={`py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer ${
                    period === 'tarde'
                      ? 'bg-orange-500 text-white border-orange-500 shadow-xs'
                      : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-50'
                  }`}
                >
                  Tarde (13h30 - 18h30)
                </button>
              </div>
            </div>
          </div>

          {/* Section 3: Resource selection */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-2">
              Recurso Desejado *
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
              {(['both', 'lab', 'chromebooks'] as ResourceType[]).map((resKey) => {
                const info = RESOURCE_DETAILS[resKey];
                const isSelected = resource === resKey;
                return (
                  <div
                    key={resKey}
                    onClick={() => setResource(resKey)}
                    className={`p-3 rounded-xl border cursor-pointer transition-all ${
                      isSelected
                        ? 'border-green-700 bg-green-50/60 ring-2 ring-green-600/20'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-slate-900">{info.short}</span>
                      {isSelected ? (
                        <Check className="w-4 h-4 text-green-700" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300" />
                      )}
                    </div>
                    <p className="text-[11px] text-slate-500 leading-tight">
                      {info.description}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Section 4: Available Slots selection */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-xs font-semibold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-3.5 h-3.5 text-green-700" />
                Horários Desejados (Selecione um ou mais) *
              </label>
              <span className="text-[11px] text-slate-500">
                {selectedSlots.length} selecionado(s)
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {currentSlots.map((slot) => {
                const { disabled, reason } = isSlotDisabled(slot);
                const isChecked = selectedSlots.includes(slot.id);

                return (
                  <button
                    type="button"
                    key={slot.id}
                    disabled={disabled}
                    onClick={() => toggleSlot(slot.id)}
                    className={`p-2.5 rounded-lg border text-left transition-all flex items-center justify-between cursor-pointer ${
                      disabled
                        ? 'bg-slate-100/70 border-slate-200 opacity-60 cursor-not-allowed'
                        : isChecked
                        ? 'bg-green-700 text-white border-green-700 shadow-xs'
                        : 'bg-white text-slate-800 border-slate-200 hover:border-green-400'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block">{slot.label}</span>
                      <span
                        className={`text-[11px] font-mono ${
                          isChecked ? 'text-green-100' : 'text-slate-500'
                        }`}
                      >
                        {slot.displayTime}
                      </span>
                    </div>

                    <div>
                      {disabled ? (
                        <span className="text-[10px] text-red-600 font-semibold max-w-[120px] truncate block">
                          {reason}
                        </span>
                      ) : isChecked ? (
                        <Check className="w-4 h-4 text-white" />
                      ) : (
                        <div className="w-4 h-4 rounded border border-slate-300" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Section 5: Purpose */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
              <FileText className="w-3.5 h-3.5 text-slate-500" />
              Finalidade da Reserva *
            </label>
            <textarea
              required
              rows={2}
              maxLength={500}
              placeholder="Ex: Turma 3º Ano B - Pesquisa de História e uso do software educativo com PIBID"
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
            <p className="text-[10px] text-slate-400 mt-1">
              Descreva brevemente a atividade para que a coordenação e outros professores fiquem cientes.
            </p>
          </div>

          {/* Section 6: Access Password */}
          <div className="bg-amber-50/70 border border-amber-200 p-3.5 rounded-xl">
            <label className="block text-xs font-bold text-amber-900 mb-1 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-600" />
              Senha de Acesso do Laboratório *
            </label>
            <div className="relative flex items-center">
              <input
                type={showAccessPassword ? 'text' : 'password'}
                required
                placeholder="Digite a senha de acesso"
                value={accessPassword}
                onChange={(e) => {
                  setAccessPassword(e.target.value);
                  setIsPasswordInvalid(false);
                  if (e.target.value.trim()) setIsPasswordTouched(false);
                  if (errorMessage?.toLowerCase().includes('senha')) setErrorMessage(null);
                }}
                onBlur={() => {
                  if (!accessPassword.trim()) setIsPasswordTouched(true);
                }}
                className={`w-full pl-3 pr-10 py-2 text-xs sm:text-sm placeholder:text-xs sm:placeholder:text-sm bg-white border rounded-lg focus:ring-2 focus:outline-hidden font-mono transition-colors ${
                  hasPasswordError
                    ? 'border-red-400 focus:border-red-500 focus:ring-red-400/30 bg-red-50/10'
                    : 'border-amber-300 focus:border-amber-500 focus:ring-amber-500'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowAccessPassword((prev) => !prev)}
                className="absolute right-2.5 p-1 text-slate-400 hover:text-slate-600 rounded cursor-pointer transition-colors focus:outline-hidden"
                title={showAccessPassword ? 'Ocultar senha' : 'Visualizar senha'}
                aria-label={showAccessPassword ? 'Ocultar senha' : 'Visualizar senha'}
              >
                {showAccessPassword ? (
                  <EyeOff className="w-4 h-4 text-slate-500" />
                ) : (
                  <Eye className="w-4 h-4 text-slate-500" />
                )}
              </button>
            </div>
            <p className={`text-[11px] mt-1 transition-colors ${isPasswordInvalid ? 'text-red-600 font-semibold' : 'text-amber-700'}`}>
              {isPasswordInvalid
                ? 'Senha de acesso incorreta! Verifique com a coordenação ou bolsistas e tente novamente.'
                : 'Segurança interna da escola. Solicite a senha de acesso à coordenação ou aos bolsistas do PIBID.'}
            </p>
          </div>

          {/* Summary Box */}
          <div className="bg-slate-50 p-3.5 rounded-xl border border-slate-200 text-xs space-y-1">
            <p className="font-bold text-slate-700 flex items-center gap-1">
              <Info className="w-3.5 h-3.5 text-green-700" />
              Resumo da Reserva:
            </p>
            <div className="grid grid-cols-2 gap-2 text-slate-600 pt-1">
              <div>
                <span className="font-semibold text-slate-800">Data:</span>{' '}
                {formatDateBR(date)} ({formatDayOfWeek(date)})
              </div>
              <div>
                <span className="font-semibold text-slate-800">Turno:</span>{' '}
                {period === 'manha' ? 'Manhã' : 'Tarde'}
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-slate-800">Recurso:</span>{' '}
                {RESOURCE_DETAILS[resource].label}
              </div>
              <div className="col-span-2">
                <span className="font-semibold text-slate-800">Horários:</span>{' '}
                {selectedSlots.length > 0
                  ? selectedSlots
                      .map((s) => currentSlots.find((cs) => cs.id === s)?.label)
                      .join(', ')
                  : 'Nenhum selecionado'}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2.5 text-sm font-semibold text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            >
              Cancelar
            </button>
            <button
              type="submit"
              onClick={() => setHasAttemptedSubmit(true)}
              disabled={isLoading}
              className="px-6 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white text-sm font-semibold rounded-lg shadow-sm transition-all flex items-center gap-2 active:scale-95 cursor-pointer"
            >
              {isLoading ? (
                <>Processando...</>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4" />
                  Confirmar Reserva
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
