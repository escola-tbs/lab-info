import React, { useState, useEffect } from 'react';
import { X, MessageCircle, AlertCircle, ExternalLink, ShieldCheck } from 'lucide-react';
import { Reservation, UserContact, RESOURCE_DETAILS, ALL_SLOTS } from '../types';
import { getUserContactForNegotiation } from '../services/reservationService';
import { formatDateBR, formatDayOfWeek } from '../utils/date';
import { buildWhatsAppLink } from '../utils/phone';

interface NegotiateModalProps {
  isOpen: boolean;
  onClose: () => void;
  reservation: Reservation | null;
}

export const NegotiateModal: React.FC<NegotiateModalProps> = ({
  isOpen,
  onClose,
  reservation,
}) => {
  const [contact, setContact] = useState<UserContact | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen && reservation) {
      setIsLoading(true);
      setError(null);
      setContact(null);

      getUserContactForNegotiation(reservation.userId)
        .then((data) => {
          if (data) {
            setContact(data);
          } else {
            setError('O responsável ainda não cadastrou o número de WhatsApp no perfil.');
          }
        })
        .catch((err) => {
          console.error(err);
          setError('Não foi possível obter os dados de contato. Tente novamente.');
        })
        .finally(() => {
          setIsLoading(false);
        });
    }
  }, [isOpen, reservation]);

  if (!isOpen || !reservation) return null;

  const slotLabels = reservation.slots
    .map((s) => ALL_SLOTS.find((slot) => slot.id === s)?.label)
    .filter(Boolean)
    .join(', ');

  const dateBR = formatDateBR(reservation.date);
  const resourceLabel = RESOURCE_DETAILS[reservation.resource].label;
  const formattedDate = `${dateBR} (${formatDayOfWeek(reservation.date)})`;

  const waLink = contact?.whatsapp
    ? buildWhatsAppLink(
        contact.whatsapp,
        reservation.userName,
        dateBR,
        slotLabels
      )
    : '#';

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
              <MessageCircle className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Negociar Horário de Reserva
              </h3>
              <p className="text-xs text-slate-500">Contato direto com o responsável</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Reservation details */}
        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200/80 mb-4 space-y-2 text-xs">
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Responsável:</span>
            <span className="font-bold text-slate-900">{reservation.userName}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Recurso:</span>
            <span className="font-semibold text-slate-800">{resourceLabel}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Data:</span>
            <span className="font-semibold text-slate-800">{formattedDate}</span>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-slate-500 font-medium">Horários:</span>
            <span className="font-semibold text-slate-800">{slotLabels}</span>
          </div>
          <div className="pt-2 border-t border-slate-200">
            <span className="text-slate-500 block mb-0.5">Finalidade informada:</span>
            <p className="text-slate-800 italic">"{reservation.purpose}"</p>
          </div>
        </div>

        {/* WhatsApp section */}
        {isLoading ? (
          <div className="py-6 text-center text-sm text-slate-500">
            <div className="w-6 h-6 border-2 border-emerald-600 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
            Localizando contato seguro...
          </div>
        ) : error ? (
          <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-800 text-xs flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
        ) : contact ? (
          <div className="space-y-4">
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl">
              <div className="flex items-center gap-2 text-emerald-800 text-xs font-semibold mb-1">
                <ShieldCheck className="w-4 h-4 text-emerald-600" />
                Contato verificado no sistema TBS
              </div>
              <p className="text-[11px] text-emerald-700 mb-2">
                Mensagem rápida pronta para envio:
              </p>
              <div className="p-2.5 bg-white rounded-lg border border-emerald-200/90 text-[11px] text-slate-700 italic leading-relaxed">
                "Olá, {reservation.userName}! Vi sua reserva no Lab Info para o dia {dateBR} ({slotLabels}). Gostaria de verificar se haveria possibilidade de negociarmos ou ajustarmos esse horário. Desde já, muito obrigado(a)!"
              </div>
            </div>

            <a
              href={waLink}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 py-3 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm rounded-xl shadow-md transition-all active:scale-98"
            >
              <MessageCircle className="w-5 h-5" />
              Abrir Conversa no WhatsApp
              <ExternalLink className="w-4 h-4 ml-1 opacity-70" />
            </a>
          </div>
        ) : null}

        <p className="text-[11px] text-slate-400 text-center mt-4">
          Lembrete: trocas de horário devem ser acordadas amigavelmente entre os docentes e atualizadas no sistema.
        </p>
      </div>
    </div>
  );
};
