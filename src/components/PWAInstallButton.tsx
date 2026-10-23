import React, { useState } from 'react';
import { usePWAInstall } from '../hooks/usePWAInstall';
import { Share, PlusSquare, X, Smartphone } from 'lucide-react';

interface PWAInstallButtonProps {
  variant?: 'banner';
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);
  const [isDismissed, setIsDismissed] = useState(false);

  // If already installed as a standalone PWA or user dismissed the prompt in this session
  if (isInstalled || isDismissed) {
    return null;
  }

  // Not installable yet and not on iOS Safari
  if (!isInstallable && !isIOS) {
    return null;
  }

  const handleInstallClick = () => {
    if (isInstallable) {
      install();
    } else if (isIOS) {
      setShowIOSGuide(true);
    }
  };

  return (
    <>
      <div className="bg-gradient-to-r from-emerald-800 to-green-900 text-white px-4 py-2.5 rounded-2xl shadow-sm mb-4 flex items-center justify-between gap-3 border border-emerald-700/60">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/10 flex items-center justify-center shrink-0 border border-white/10">
              <Smartphone className="w-5 h-5 text-emerald-300" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold text-white truncate">Instale o aplicativo na sua tela inicial</p>
              <p className="text-[11px] text-emerald-200/90 truncate">Acesse horários e reservas direto do seu dispositivo, sem abrir navegador</p>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={handleInstallClick}
              className="px-3 py-1.5 bg-white text-emerald-900 text-xs font-bold rounded-lg hover:bg-emerald-50 transition shadow-2xs"
            >
              Instalar
            </button>
            <button
              onClick={() => setIsDismissed(true)}
              className="p-1 text-emerald-300 hover:text-white rounded-md transition"
              title="Fechar aviso"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

      {/* iOS Safari Guided Instructions Modal */}
      {showIOSGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-sm rounded-2xl bg-white p-5 sm:p-6 shadow-2xl border border-slate-100 text-slate-800">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center text-emerald-800">
                  <Smartphone className="w-4 h-4" />
                </div>
                <h3 className="text-base font-bold text-slate-900">Instalar no iPhone / iPad</h3>
              </div>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 hover:bg-slate-100 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <p className="mt-3 text-xs text-slate-600">
              Para instalar este aplicativo no seu dispositivo Apple (iOS):
            </p>

            <div className="mt-3 space-y-2.5 text-xs text-slate-700 bg-slate-50 p-3.5 rounded-xl border border-slate-200/70">
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  1
                </div>
                <p className="pt-0.5">
                  Toque no botão <strong>Compartilhar</strong> (<Share className="inline w-3.5 h-3.5 text-blue-600 mx-0.5" />) na barra inferior do Safari.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  2
                </div>
                <p className="pt-0.5">
                  Role o menu para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (<PlusSquare className="inline w-3.5 h-3.5 text-slate-700 mx-0.5" />).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <div className="w-6 h-6 rounded-full bg-emerald-600 text-white font-bold flex items-center justify-center shrink-0 text-[11px]">
                  3
                </div>
                <p className="pt-0.5">
                  Toque em <strong>Adicionar</strong> no canto superior direito. Pronto!
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowIOSGuide(false)}
              className="mt-4 w-full rounded-xl bg-emerald-700 py-2.5 text-xs font-bold text-white hover:bg-emerald-800 transition"
            >
              Entendido
            </button>
          </div>
        </div>
      )}
    </>
  );
};
