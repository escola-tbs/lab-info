import React, { useState, useEffect } from 'react';
import { X, UserCircle, Save, CheckCircle2, AlertCircle } from 'lucide-react';
import { UserProfile } from '../types';
import { formatPhoneInput, validateAndNormalizeBRPhone } from '../utils/phone';
import { saveUserProfile } from '../services/reservationService';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  userProfile: UserProfile | null;
  onProfileUpdated: (updated: UserProfile) => void;
  isFirstAccess?: boolean;
  photoURL?: string | null;
}

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  userProfile,
  onProfileUpdated,
  isFirstAccess = false,
  photoURL = null,
}) => {
  const [displayName, setDisplayName] = useState('');
  const [phoneRaw, setPhoneRaw] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setPhoneRaw(formatPhoneInput(userProfile.whatsapp || ''));
    }
  }, [userProfile, isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !userProfile) return null;

  const phoneValidation = validateAndNormalizeBRPhone(phoneRaw);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);

    if (!displayName.trim()) {
      setError('O nome completo é obrigatório.');
      return;
    }

    if (!phoneValidation.isValid) {
      setError(phoneValidation.error || 'Número de WhatsApp inválido.');
      return;
    }

    setIsLoading(true);

    try {
      const updated: UserProfile = {
        ...userProfile,
        displayName: displayName.trim(),
        whatsapp: phoneValidation.normalized,
        updatedAt: new Date().toISOString()
      };

      await saveUserProfile(updated);
      onProfileUpdated(updated);
      setSuccess(true);
      setTimeout(() => {
        onClose();
      }, 1000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erro ao salvar perfil.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4"
    >
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-2xl border border-slate-200 dark:border-slate-800 transition-colors">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/60 text-green-800 dark:text-green-400 flex items-center justify-center overflow-hidden shrink-0 border border-green-200 dark:border-green-800/80">
              {photoURL ? (
                <img
                  src={photoURL}
                  alt={displayName || 'Foto do Perfil'}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                  onError={(e) => {
                    (e.currentTarget as HTMLElement).style.display = 'none';
                    const fallback = e.currentTarget.parentElement?.querySelector('.profile-modal-fallback') as HTMLElement;
                    if (fallback) fallback.classList.remove('hidden');
                  }}
                />
              ) : null}
              <UserCircle className={`w-6 h-6 profile-modal-fallback ${photoURL ? 'hidden' : 'block'}`} />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                {isFirstAccess ? 'Cadastro Inicial do Usuário' : 'Meu Perfil'}
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {isFirstAccess
                  ? 'Complete seus dados para poder reservar no TBS'
                  : 'Atualize seus dados de contato'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            title="Fechar"
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {isFirstAccess && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800/80 rounded-xl text-xs text-green-800 dark:text-green-300">
            Bem-vindo(a)! Para realizar reservas no laboratório e permitir que colegas possam negociar horários amigavelmente, precisamos do seu nome e WhatsApp.
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/80 rounded-xl text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 dark:text-red-400 shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {success && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl text-xs text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <span>Dados salvos com sucesso!</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-sm">
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Nome Completo *
            </label>
            <input
              type="text"
              required
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              placeholder="Ex: Prof. Maria da Silva"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-hidden"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1 flex items-center justify-between gap-1">
              <span>WhatsApp de Contato *</span>
              <span className="text-[9px] sm:text-[10px] text-green-700 dark:text-green-400 font-medium shrink-0">Ex: (91) 9 0000-0000</span>
            </label>
            <input
              type="tel"
              required
              value={phoneRaw}
              onChange={(e) => setPhoneRaw(formatPhoneInput(e.target.value))}
              placeholder="Ex: (91) 9 0000-0000"
              className="w-full px-3 py-2 text-sm bg-white dark:bg-slate-800 text-slate-900 dark:text-slate-100 border border-slate-300 dark:border-slate-700 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-hidden font-mono"
            />
            <p className="text-[10px] sm:text-[11px] text-slate-500 dark:text-slate-400 mt-1">
              Atenção: precisa ser o número do WhatsApp com DDD.
            </p>

            {/* Normalization check display */}
            {phoneValidation.isValid && (
              <div className="mt-2 px-2.5 sm:px-3 py-2 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-lg text-emerald-800 dark:text-emerald-300 flex items-center justify-between gap-2 whitespace-nowrap overflow-hidden">
                <span className="truncate max-[350px]:text-[10px] text-[11px] sm:text-xs">Formato conferido para WhatsApp:</span>
                <span className="font-mono font-bold shrink-0 pr-0.5 max-[350px]:text-[10px] text-[11px] sm:text-xs">{phoneValidation.formattedDisplay}</span>
              </div>
            )}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-850 p-3 rounded-xl border border-slate-200 dark:border-slate-800">
            <span className="font-semibold block text-slate-700 dark:text-slate-300 mb-0.5">Conta Google Vinculada:</span>
            <span className="font-mono">{userProfile.email}</span>
          </div>

          <div className="flex items-center justify-between gap-2 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer transition-colors"
            >
              Fechar
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-5 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2 cursor-pointer transition-all active:scale-95"
            >
              <Save className="w-4 h-4" />
              {isLoading ? 'Salvando...' : 'Salvar Dados'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
