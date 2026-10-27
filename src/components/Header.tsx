import React, { useState, useRef, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  Shield,
  CalendarCheck,
  UserCircle,
  Laptop,
  School,
  QrCode,
  Info,
  ShieldCheck,
  ChevronDown
} from 'lucide-react';

interface HeaderProps {
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL?: string | null;
  } | null;
  isAdmin: boolean;
  onLogin: () => void;
  onRequestLogout: () => void;
  onOpenMyReservations: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenNewReservation: () => void;
  onOpenShare: () => void;
  isScrolledPastHero?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isAdmin,
  onLogin,
  onRequestLogout,
  onOpenMyReservations,
  onOpenProfile,
  onOpenAdmin,
  onOpenNewReservation,
  onOpenShare,
  isScrolledPastHero = false,
}) => {
  const [isAppMenuOpen, setIsAppMenuOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);

  // Close menu on click outside or escape key
  useEffect(() => {
    if (!isAppMenuOpen) return;

    const handleClickOutside = (event: MouseEvent | TouchEvent) => {
      if (
        menuContainerRef.current &&
        !menuContainerRef.current.contains(event.target as Node)
      ) {
        setIsAppMenuOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsAppMenuOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    document.addEventListener('touchstart', handleClickOutside);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('touchstart', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isAppMenuOpen]);

  return (
    <header className="bg-white border-b border-slate-300 sticky top-0 z-30 shadow-xs">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between py-2 sm:py-0 sm:h-20 gap-2">
          {/* School Brand & PIBID Badge with Interactive App Icon Menu */}
          <div className="flex items-center space-x-2.5 sm:space-x-3 min-w-0 flex-1">
            <div className="relative shrink-0" ref={menuContainerRef}>
              <button
                type="button"
                onClick={() => setIsAppMenuOpen((prev) => !prev)}
                title="Menu do aplicativo: Compartilhar, Sobre e Privacidade"
                className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl bg-green-700 text-white flex items-center justify-center shadow-md shrink-0 overflow-hidden p-0.5 hover:ring-2 hover:ring-green-500 hover:ring-offset-1 transition-all active:scale-95 cursor-pointer group focus:outline-hidden"
              >
                <img
                  src="./favicon.svg"
                  alt="Ícone do Sistema"
                  className="w-full h-full object-contain rounded-lg group-hover:scale-105 transition-transform"
                  onError={(e) => {
                    (e.target as HTMLElement).style.display = 'none';
                  }}
                />
                <School className="w-5 h-5 sm:w-7 sm:h-7 hidden" />
              </button>

              {/* App Icon Menu Dropdown */}
              {isAppMenuOpen && (
                <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900">Lab Info TBS</p>
                    </div>
                    <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-md bg-green-100 text-green-800">
                      v2026
                    </span>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {/* Option 1: Compartilhar o app */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAppMenuOpen(false);
                        onOpenShare();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-green-800 hover:bg-green-50/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 text-green-700 flex items-center justify-center shrink-0">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-900">Compartilhar o App</span>
                        <span className="block text-[10px] text-slate-500 font-normal truncate">
                          QR Code e link para outros professores
                        </span>
                      </div>
                    </button>

                    {/* Option 2: Acessar a página sobre */}
                    <a
                      href="./sobre.html"
                      onClick={() => setIsAppMenuOpen(false)}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-green-800 hover:bg-green-50/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-700 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-900">Página Sobre o Sistema</span>
                        <span className="block text-[10px] text-slate-500 font-normal truncate">
                          Escola TBS, PIBID e objetivos
                        </span>
                      </div>
                    </a>

                    {/* Option 3: Acessar a página de políticas de privacidade */}
                    <a
                      href="./privacidade.html"
                      onClick={() => setIsAppMenuOpen(false)}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 hover:text-green-800 hover:bg-green-50/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 text-slate-700 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-900">Políticas de Privacidade</span>
                        <span className="block text-[10px] text-slate-500 font-normal truncate">
                          Proteção de dados e LGPD
                        </span>
                      </div>
                    </a>
                  </div>
                </div>
              )}
            </div>

            {/* Header Text: Always visible, truncating with ellipsis (...) when space is constrained */}
            <div className="min-w-0 flex-1 overflow-hidden">
              <div className="flex items-center gap-1.5 min-w-0 overflow-hidden">
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 text-green-800 tracking-wide uppercase truncate max-w-full">
                  RESERVAS
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 hidden md:inline truncate">EEEFM Prof. TBS</span>
              </div>
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 leading-tight truncate">
                Laboratório de Informática
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate block">
                Agenda Oficial de Reservas do Laboratório e Chromebooks
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {/* Nova Reserva Button: Hidden on mobile when at the top, shown when hero button disappears */}
            <button
              onClick={onOpenNewReservation}
              className={`items-center gap-1.5 sm:gap-2 px-3 sm:px-4 py-2 sm:py-2.5 bg-green-700 hover:bg-green-800 text-white text-xs sm:text-sm font-semibold rounded-lg shadow-sm transition-all focus:ring-2 focus:ring-green-600 focus:ring-offset-2 active:scale-95 cursor-pointer whitespace-nowrap ${
                isScrolledPastHero ? 'inline-flex' : 'hidden sm:inline-flex'
              }`}
            >
              <CalendarCheck className="w-4 h-4 shrink-0" />
              <span>Nova Reserva</span>
            </button>

            {user ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Minhas Reservas */}
                <button
                  onClick={onOpenMyReservations}
                  title="Minhas Reservas"
                  className="px-2.5 sm:px-3 py-2 text-slate-700 hover:text-green-700 hover:bg-slate-100 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Laptop className="w-4 h-4 text-green-700" />
                  <span className="hidden md:inline">Minhas Reservas</span>
                </button>

                <button
                  onClick={onOpenProfile}
                  title={`Meu Perfil (${user.displayName || user.email})`}
                  className="p-1 sm:p-1.5 text-slate-700 hover:text-green-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Foto do Perfil'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-slate-200"
                      onError={(e) => {
                        (e.currentTarget as HTMLElement).style.display = 'none';
                        const fallback = e.currentTarget.parentElement?.querySelector('.profile-fallback-icon') as HTMLElement;
                        if (fallback) fallback.classList.remove('hidden');
                      }}
                    />
                  ) : null}
                  <UserCircle className={`w-5 h-5 profile-fallback-icon ${user.photoURL ? 'hidden' : 'block'}`} />
                </button>

                {isAdmin && (
                  <button
                    onClick={onOpenAdmin}
                    title="Painel Administrativo"
                    className="p-2 text-amber-700 hover:text-amber-800 bg-amber-50 hover:bg-amber-100 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium border border-amber-200 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-amber-600" />
                    <span className="hidden lg:inline">Painel ADM</span>
                  </button>
                )}

                <div className="h-5 w-px bg-slate-200 mx-0.5 hidden sm:block" />

                <div className="flex items-center gap-1.5">
                  <div className="text-right hidden xl:block">
                    <p className="text-xs font-semibold text-slate-800 truncate max-w-[130px]">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-[10px] text-slate-500">Conectado</p>
                  </div>
                  <button
                    onClick={onRequestLogout}
                    title="Sair da conta"
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-slate-300 hover:border-slate-400 bg-white text-slate-700 hover:text-slate-900 text-xs sm:text-sm font-medium rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 text-green-700 shrink-0" />
                <span className="hidden sm:inline">Entrar com Google</span>
                <span className="sm:hidden">Entrar</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
