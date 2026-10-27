import React, { useState } from 'react';
import {
  X,
  Share2,
  Copy,
  Check,
  Download,
  MessageCircle,
  ExternalLink,
  QrCode
} from 'lucide-react';

interface ShareModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  // Official app share link
  const appUrl = 'https://escola-tbs.github.io/lab-info';

  const shareText = 'Acesse o Sistema de Reservas do Laboratório de Informática da Escola Terezinha Bezerra Siqueira: https://escola-tbs.github.io/lab-info';

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(appUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      // Fallback
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Sistema de Reservas - Lab Info TBS',
          text: shareText,
          url: appUrl,
        });
      } catch (err) {
        // User cancelled or not supported
      }
    } else {
      handleCopyLink();
    }
  };

  const handleWhatsAppShare = () => {
    const waUrl = `https://api.whatsapp.com/send?text=${encodeURIComponent(shareText)}`;
    window.open(waUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in duration-150">
      <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200 dark:border-slate-800 relative transition-colors">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800 mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-400 flex items-center justify-center shrink-0">
              <QrCode className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Compartilhar o Aplicativo
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Laboratório de Informática &bull; Escola TBS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
            title="Fechar"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* QR Code Card */}
        <div className="bg-slate-50 dark:bg-slate-850 p-4 rounded-2xl border border-slate-200/90 dark:border-slate-800 text-center mb-4">
          <div className="bg-white p-3 rounded-xl shadow-xs border border-slate-200 inline-block mx-auto mb-2">
            <img
              src="./qr-code.png"
              alt="QR Code para acesso ao sistema"
              className="w-52 h-52 sm:w-60 sm:h-60 object-contain mx-auto rounded-lg"
              onError={(e) => {
                // Fallback to local asset
                (e.target as HTMLImageElement).src = './assets/aistudio/qr-code_81afada0.png';
              }}
            />
          </div>
          <p className="text-xs font-semibold text-slate-700 dark:text-slate-200">
            Aponte a câmera do celular para abrir
          </p>
          <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-0.5">
            Acesso direto à agenda oficial de reservas
          </p>
        </div>

        {/* URL Box & Copy */}
        <div className="mb-4">
          <label className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 mb-1.5">
            Link de Acesso Direto:
          </label>
          <div className="flex items-center gap-1.5 bg-slate-50 dark:bg-slate-850 border border-slate-200 dark:border-slate-750 rounded-xl p-1.5 pl-3">
            <span className="text-xs font-mono text-slate-700 dark:text-slate-200 truncate select-all flex-1">
              {appUrl}
            </span>
            <button
              onClick={handleCopyLink}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg flex items-center gap-1 transition-all shrink-0 cursor-pointer ${
                copied
                  ? 'bg-emerald-600 text-white'
                  : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-2xs'
              }`}
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>Copiado!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copiar</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mb-3">
          <button
            onClick={handleWhatsAppShare}
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Enviar no WhatsApp</span>
          </button>

          <a
            href="./qr-code.png"
            download="qr-code-lab-tbs.png"
            className="flex items-center justify-center gap-1.5 py-2.5 px-3 bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 border border-slate-300 dark:border-slate-700 text-xs font-semibold rounded-xl shadow-2xs transition-colors cursor-pointer"
          >
            <Download className="w-4 h-4 text-slate-500 dark:text-slate-400" />
            <span>Baixar QR Code</span>
          </a>
        </div>

        {typeof navigator !== 'undefined' && 'share' in navigator && (
          <button
            onClick={handleNativeShare}
            className="w-full flex items-center justify-center gap-1.5 py-2 px-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-750 text-slate-700 dark:text-slate-200 text-xs font-semibold rounded-xl transition-colors cursor-pointer mb-2"
          >
            <Share2 className="w-4 h-4" />
            <span>Outras Opções de Compartilhamento</span>
          </button>
        )}

        <p className="text-[11px] text-slate-400 dark:text-slate-500 text-center mt-3">
          Dica: Imprima o QR Code para colocar na porta do laboratório e na sala dos professores!
        </p>
      </div>
    </div>
  );
};
