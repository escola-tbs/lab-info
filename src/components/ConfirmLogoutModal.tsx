import React from 'react';
import { LogOut, X } from 'lucide-react';

interface ConfirmLogoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  userEmail?: string | null;
}

export const ConfirmLogoutModal: React.FC<ConfirmLogoutModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  userEmail,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-70 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 animate-in fade-in zoom-in-95">
        <div className="flex items-center justify-between pb-2 mb-3">
          <div className="w-10 h-10 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center">
            <LogOut className="w-5 h-5" />
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 mb-1">
          Deseja encerrar a sessão?
        </h3>
        <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed mb-4">
          Você será desconectado da conta <strong>{userEmail || 'Google'}</strong>. Será necessário fazer login novamente para cadastrar reservas ou acessar dados de contato.
        </p>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg cursor-pointer"
          >
            Cancelar
          </button>
          <button
            onClick={() => {
              onClose();
              onConfirm();
            }}
            className="px-4 py-2 text-xs font-bold text-white bg-red-600 hover:bg-red-700 rounded-lg shadow-sm cursor-pointer active:scale-95 transition-all"
          >
            Sair da Conta
          </button>
        </div>
      </div>
    </div>
  );
};
