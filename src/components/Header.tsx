import React, { useState, useRef, useEffect } from 'react';
import {
  LogIn,
  LogOut,
  Shield,
  UserCircle,
  Laptop,
  School,
  QrCode,
  Info,
  ShieldCheck,
  Sun,
  Moon
} from 'lucide-react';
import { Theme } from '../hooks/useTheme';

interface HeaderProps {
  user: {
    uid: string;
    displayName: string | null;
    email: string | null;
    photoURL?: string | null;
  } | null;
  isAdmin: boolean;
  theme: Theme;
  onToggleTheme: () => void;
  onLogin: () => void;
  onRequestLogout: () => void;
  onOpenMyReservations: () => void;
  onOpenProfile: () => void;
  onOpenAdmin: () => void;
  onOpenShare: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  user,
  isAdmin,
  theme,
  onToggleTheme,
  onLogin,
  onRequestLogout,
  onOpenMyReservations,
  onOpenProfile,
  onOpenAdmin,
  onOpenShare,
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
    <header className="bg-white dark:bg-slate-900 border-b border-slate-300 dark:border-slate-800 sticky top-0 z-30 shadow-xs transition-colors duration-200">
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
                <div className="absolute top-full left-0 mt-2 w-64 sm:w-72 bg-white dark:bg-slate-900 rounded-2xl shadow-2xl border border-slate-200 dark:border-slate-800 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                  <div className="px-3.5 py-2 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-900 dark:text-slate-100">Lab Info TBS</p>
                    </div>
                    {/* Theme Toggle Button (Light/Dark mode) */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onToggleTheme();
                      }}
                      title={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
                      aria-label={theme === 'dark' ? 'Alternar para Modo Claro' : 'Alternar para Modo Escuro'}
                      className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold transition-all cursor-pointer bg-slate-100 hover:bg-slate-200 text-slate-700 dark:bg-slate-800 dark:hover:bg-slate-700 dark:text-slate-200 border border-slate-200 dark:border-slate-700 active:scale-95 shadow-2xs"
                    >
                      {theme === 'dark' ? (
                        <>
                          <Sun className="w-3.5 h-3.5 text-amber-400" />
                          <span>Modo Claro</span>
                        </>
                      ) : (
                        <>
                          <Moon className="w-3.5 h-3.5 text-slate-600" />
                          <span>Modo Escuro</span>
                        </>
                      )}
                    </button>
                  </div>

                  <div className="p-1.5 space-y-1">
                    {/* Option 1: Compartilhar o app */}
                    <button
                      type="button"
                      onClick={() => {
                        setIsAppMenuOpen(false);
                        onOpenShare();
                      }}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-green-800 dark:hover:text-green-400 hover:bg-green-50/80 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-green-100 dark:bg-green-950/60 text-green-700 dark:text-green-300 flex items-center justify-center shrink-0">
                        <QrCode className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-900 dark:text-slate-100">Compartilhar o App</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
                          QR Code e link para outros professores
                        </span>
                      </div>
                    </button>

                    {/* Option 2: Acessar a página sobre */}
                    <a
                      href="./sobre.html"
                      onClick={() => setIsAppMenuOpen(false)}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-green-800 dark:hover:text-green-400 hover:bg-green-50/80 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 flex items-center justify-center shrink-0">
                        <Info className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-900 dark:text-slate-100">Página Sobre o Sistema</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
                          Escola TBS, PIBID e objetivos
                        </span>
                      </div>
                    </a>

                    {/* Option 3: Acessar a página de políticas de privacidade */}
                    <a
                      href="./privacidade.html"
                      onClick={() => setIsAppMenuOpen(false)}
                      className="w-full px-3 py-2 text-left text-xs font-semibold text-slate-700 dark:text-slate-200 hover:text-green-800 dark:hover:text-green-400 hover:bg-green-50/80 dark:hover:bg-slate-800/80 rounded-xl flex items-center gap-2.5 transition-colors cursor-pointer"
                    >
                      <div className="w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center justify-center shrink-0">
                        <ShieldCheck className="w-4 h-4" />
                      </div>
                      <div className="min-w-0">
                        <span className="block font-bold text-slate-900 dark:text-slate-100">Políticas de Privacidade</span>
                        <span className="block text-[10px] text-slate-500 dark:text-slate-400 font-normal truncate">
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
                <span className="text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full bg-green-100 dark:bg-green-950/70 text-green-800 dark:text-green-300 tracking-wide uppercase truncate max-w-full">
                  RESERVAS
                </span>
                <span className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 hidden md:inline truncate">EEEFM Prof. TBS</span>
              </div>
              <h1 className="text-sm sm:text-base md:text-lg lg:text-xl font-bold text-slate-900 dark:text-white leading-tight truncate">
                Laboratório de Informática
              </h1>
              <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 truncate block">
                Agenda Oficial de Reservas do Laboratório e Chromebooks
              </p>
            </div>
          </div>

          {/* Right Actions */}
          <div className="flex items-center gap-1.5 sm:gap-2.5 shrink-0">
            {user ? (
              <div className="flex items-center gap-1 sm:gap-1.5">
                {/* Minhas Reservas */}
                <button
                  onClick={onOpenMyReservations}
                  title="Minhas Reservas"
                  className="px-2.5 sm:px-3 py-2 text-slate-700 dark:text-slate-200 hover:text-green-700 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-xs sm:text-sm font-medium transition-colors inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <Laptop className="w-4 h-4 text-green-700 dark:text-green-400" />
                  <span className="hidden md:inline">Minhas Reservas</span>
                </button>

                <button
                  onClick={onOpenProfile}
                  title={`Meu Perfil (${user.displayName || user.email})`}
                  className="p-1 sm:p-1.5 text-slate-700 dark:text-slate-200 hover:text-green-700 dark:hover:text-green-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors cursor-pointer flex items-center justify-center"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'Foto do Perfil'}
                      referrerPolicy="no-referrer"
                      className="w-6 h-6 sm:w-7 sm:h-7 rounded-full object-cover border border-slate-200 dark:border-slate-700"
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
                    className="p-2 text-amber-700 dark:text-amber-300 hover:text-amber-800 dark:hover:text-amber-200 bg-amber-50 dark:bg-amber-950/40 hover:bg-amber-100 dark:hover:bg-amber-900/50 rounded-lg transition-colors flex items-center gap-1 text-xs font-medium border border-amber-200 dark:border-amber-800/60 cursor-pointer"
                  >
                    <Shield className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                    <span className="hidden lg:inline">Painel ADM</span>
                  </button>
                )}

                <div className="h-5 w-px bg-slate-200 dark:bg-slate-700 mx-0.5 hidden sm:block" />

                <div className="flex items-center gap-1.5">
                  <div className="text-right hidden xl:block">
                    <p className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate max-w-[130px]">
                      {user.displayName || user.email}
                    </p>
                    <p className="text-[10px] text-slate-500 dark:text-slate-400">Conectado</p>
                  </div>
                  <button
                    onClick={onRequestLogout}
                    title="Sair da conta"
                    className="p-2 text-slate-400 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition-colors cursor-pointer"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={onLogin}
                className="inline-flex items-center gap-1.5 px-3 sm:px-4 py-2 border border-slate-300 dark:border-slate-700 hover:border-slate-400 dark:hover:border-slate-600 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:text-slate-900 dark:hover:text-white text-xs sm:text-sm font-medium rounded-lg shadow-2xs transition-colors cursor-pointer whitespace-nowrap"
              >
                <LogIn className="w-4 h-4 text-green-700 dark:text-green-400 shrink-0" />
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
