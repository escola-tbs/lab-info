import React, { useState, useEffect } from 'react';
import {
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  User as FirebaseUser
} from 'firebase/auth';
import { auth, googleProvider, testConnection } from './firebase';
import {
  Reservation,
  UserProfile,
  SystemSettings,
  INITIAL_ADMIN_EMAILS,
  PeriodType
} from './types';
import {
  subscribeReservationsByDate,
  subscribeAllReservations,
  getUserProfile,
  saveUserProfile,
  getSystemSettings,
  cancelReservation
} from './services/reservationService';
import { getTodayString, formatDateBR } from './utils/date';

import { Header } from './components/Header';
import { DateNavigator } from './components/DateNavigator';
import { DayScheduleView } from './components/DayScheduleView';
import { WeekScheduleView } from './components/WeekScheduleView';
import { ReservationModal } from './components/ReservationModal';
import { NegotiateModal } from './components/NegotiateModal';
import { MyReservationsModal } from './components/MyReservationsModal';
import { ProfileModal } from './components/ProfileModal';
import { AdminModal } from './components/AdminModal';
import { EditReservationModal } from './components/EditReservationModal';
import { AuthModal } from './components/AuthModal';
import { ConfirmCancelModal } from './components/ConfirmCancelModal';
import { ConfirmLogoutModal } from './components/ConfirmLogoutModal';
import { PWAInstallButton } from './components/PWAInstallButton';
import { ShareModal } from './components/ShareModal';
import { useAdminNotification } from './hooks/useAdminNotification';
import { useTheme } from './hooks/useTheme';

import {
  CalendarCheck2,
  School,
  CheckCircle2
} from 'lucide-react';

const AUTH_CACHE_KEY = 'tbs_auth_cached_user';

interface CachedAuthUser {
  uid: string;
  displayName: string | null;
  email: string | null;
  photoURL?: string | null;
  role?: 'admin' | 'user';
  isAdmin?: boolean;
}

export default function App() {
  const { theme, toggleTheme } = useTheme();

  // Optimistic cached auth to eliminate login button flicker on page load
  const [cachedUser, setCachedUser] = useState<CachedAuthUser | null>(() => {
    try {
      const saved = localStorage.getItem(AUTH_CACHE_KEY);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });

  // Current user & profile
  const [currentUser, setCurrentUser] = useState<FirebaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [systemSettings, setSystemSettings] = useState<SystemSettings | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);

  // Active Date & View state
  const [currentDate, setCurrentDate] = useState<string>(getTodayString());
  const [periodFilter, setPeriodFilter] = useState<'all' | 'manha' | 'tarde'>('all');
  const [viewMode, setViewMode] = useState<'day' | 'week'>('day');

  // Real-time Reservations
  const [dateReservations, setDateReservations] = useState<Reservation[]>([]);
  const [allReservations, setAllReservations] = useState<Reservation[]>([]);

  // Modals state
  const [isReservationModalOpen, setIsReservationModalOpen] = useState(false);
  const [prefillSlotId, setPrefillSlotId] = useState<string | undefined>();
  const [prefillPeriod, setPrefillPeriod] = useState<PeriodType | undefined>();

  const [isNegotiateModalOpen, setIsNegotiateModalOpen] = useState(false);
  const [negotiationReservation, setNegotiationReservation] = useState<Reservation | null>(null);

  const [isMyReservationsModalOpen, setIsMyReservationsModalOpen] = useState(false);
  const [isProfileModalOpen, setIsProfileModalOpen] = useState(false);
  const [isFirstAccessModal, setIsFirstAccessModal] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);

  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingReservation, setEditingReservation] = useState<Reservation | null>(null);

  const [isShareModalOpen, setIsShareModalOpen] = useState(false);

  // Authentication prompt modal
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [authModalDetails, setAuthModalDetails] = useState({
    title: 'Entrar no Sistema',
    description: 'Entre com sua conta Google para continuar.'
  });
  const [isLoggingIn, setIsLoggingIn] = useState(false);

  // Cancellation confirmation modal
  const [reservationToCancel, setReservationToCancel] = useState<Reservation | null>(null);
  const [isCancellingReservation, setIsCancellingReservation] = useState(false);

  // Logout confirmation modal
  const [isLogoutModalOpen, setIsLogoutModalOpen] = useState(false);

  // Success Toast Banner
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  // Pending intent when login is requested
  const [pendingAction, setPendingAction] = useState<
    | { type: 'booking'; slotId?: string; period?: PeriodType }
    | { type: 'negotiate'; reservation: Reservation }
    | null
  >(null);

  // Check connection & load initial settings
  useEffect(() => {
    testConnection();
    getSystemSettings().then((s) => setSystemSettings(s));
  }, []);

  // Listen to Auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      setIsAuthLoading(false);

      if (user) {
        setIsAuthModalOpen(false);
        const currentAdmins = (systemSettings?.adminEmails || INITIAL_ADMIN_EMAILS).map((e) =>
          e.toLowerCase()
        );
        const userEmailLower = user.email?.toLowerCase() || '';
        const isUserAdmin = currentAdmins.includes(userEmailLower);

        // Immediate cache snapshot to ensure instant recognition on subsequent reloads
        const initialCache: CachedAuthUser = {
          uid: user.uid,
          displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
          email: userEmailLower,
          photoURL: user.photoURL,
          isAdmin: isUserAdmin
        };
        try {
          localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(initialCache));
        } catch {}
        setCachedUser(initialCache);

        let activeProfile: UserProfile | null = null;
        // Fetch user profile from Firestore
        try {
          const profile = await getUserProfile(user.uid);
          if (profile) {
            setUserProfile(profile);
            activeProfile = profile;
            if (!profile.email && user.email) {
              await saveUserProfile({ ...profile, email: user.email.toLowerCase() });
            }
            const refinedCache: CachedAuthUser = {
              ...initialCache,
              displayName: profile.displayName || initialCache.displayName,
              role: profile.role,
              isAdmin: isUserAdmin || profile.role === 'admin'
            };
            try {
              localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(refinedCache));
            } catch {}
            setCachedUser(refinedCache);
          } else {
            // First time login: create profile and register user in collection without forcing modal popup
            const draftProfile: UserProfile = {
              uid: user.uid,
              displayName: user.displayName || user.email?.split('@')[0] || 'Usuário',
              email: userEmailLower,
              whatsapp: '',
              role: isUserAdmin ? 'admin' : 'user'
            };
            setUserProfile(draftProfile);
            activeProfile = draftProfile;
            const refinedCache: CachedAuthUser = {
              ...initialCache,
              role: draftProfile.role,
              isAdmin: isUserAdmin
            };
            try {
              localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(refinedCache));
            } catch {}
            setCachedUser(refinedCache);
            // Auto save initial user doc so admin sees them in the user selection list right away
            await saveUserProfile(draftProfile);
          }
        } catch (err) {
          console.error('Error fetching profile:', err);
        }

        // Resume pending action if user clicked while unauthenticated
        if (pendingAction) {
          if (pendingAction.type === 'booking') {
            setPrefillSlotId(pendingAction.slotId);
            setPrefillPeriod(pendingAction.period);
            if (!activeProfile?.whatsapp) {
              setIsFirstAccessModal(true);
              setIsProfileModalOpen(true);
            } else {
              setIsReservationModalOpen(true);
            }
          } else if (pendingAction.type === 'negotiate') {
            setNegotiationReservation(pendingAction.reservation);
            setIsNegotiateModalOpen(true);
          }
          setPendingAction(null);
        }
      } else {
        setUserProfile(null);
        try {
          localStorage.removeItem(AUTH_CACHE_KEY);
        } catch {}
        setCachedUser(null);
      }
    });

    return () => unsubscribe();
  }, [pendingAction]);

  // Subscribe to reservations on the selected date
  useEffect(() => {
    const unsub = subscribeReservationsByDate(
      currentDate,
      (data) => setDateReservations(data),
      (err) => console.error('Subscription error for date:', err)
    );
    return () => unsub();
  }, [currentDate]);

  // Subscribe to all reservations (for week overview & user history)
  useEffect(() => {
    const unsub = subscribeAllReservations(
      (data) => setAllReservations(data),
      (err) => console.error('Subscription error for all:', err)
    );
    return () => unsub();
  }, []);

  // Check if current user is admin (checking live auth or fallback to cached state)
  const userEmail = currentUser?.email?.toLowerCase() || cachedUser?.email?.toLowerCase() || '';
  const adminList = (systemSettings?.adminEmails || INITIAL_ADMIN_EMAILS).map((e) =>
    e.toLowerCase()
  );
  const isAdminUser = currentUser
    ? (adminList.includes(userEmail) || userProfile?.role === 'admin')
    : Boolean(cachedUser?.isAdmin || (cachedUser?.email && adminList.includes(cachedUser.email.toLowerCase())));

  // Effective user for Header: uses live user when available, or cached user during initial load
  const effectiveUser = currentUser
    ? {
        uid: currentUser.uid,
        displayName: userProfile?.displayName || currentUser.displayName || cachedUser?.displayName || null,
        email: currentUser.email || cachedUser?.email || null,
        photoURL: currentUser.photoURL || cachedUser?.photoURL || null,
      }
    : cachedUser
    ? {
        uid: cachedUser.uid,
        displayName: cachedUser.displayName,
        email: cachedUser.email,
        photoURL: cachedUser.photoURL,
      }
    : null;

  // Admin Notification Hook (strictly active for admin users only)
  const {
    permission: adminNotifPermission,
    requestPermission: requestAdminNotifPermission,
    sendTestNotification: sendAdminTestNotification,
  } = useAdminNotification({
    isAdmin: isAdminUser,
    currentUserUid: currentUser?.uid,
    onNewReservationAlert: (res) => {
      showToast(`🔔 [ADM] Nova reserva de ${res.userName} recebida!`);
    },
  });

  // Robust Login handler that gracefully manages popup lifecycle
  const handleLogin = async (): Promise<boolean> => {
    if (isLoggingIn) return false;
    setIsLoggingIn(true);
    try {
      await signInWithPopup(auth, googleProvider);
      return true;
    } catch (err: unknown) {
      const errorObj = err as { code?: string; message?: string };
      const code = errorObj?.code || '';

      // Gracefully handle standard user cancellation of the popup
      if (code === 'auth/popup-closed-by-user' || code === 'auth/cancelled-popup-request') {
        // User closed or cancelled popup; no need to throw fatal errors
        return false;
      }

      if (code === 'auth/popup-blocked') {
        showToast('O pop-up de login foi bloqueado pelo seu navegador. Por favor, permita pop-ups.');
        return false;
      }

      console.warn('Informação de login:', code || err);
      showToast('Não foi possível conectar ao Google. Tente novamente.');
      return false;
    } finally {
      setIsLoggingIn(false);
    }
  };

  // Logout handler
  const handleLogout = async () => {
    try {
      try {
        localStorage.removeItem(AUTH_CACHE_KEY);
      } catch {}
      setCachedUser(null);
      setCurrentUser(null);
      setUserProfile(null);
      await signOut(auth);
      showToast('Sessão encerrada com sucesso.');
    } catch (err) {
      console.warn('Logout error:', err);
    }
  };

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4500);
  };

  // Action: Open New Reservation
  const handleOpenNewReservation = (slotId?: string, period?: PeriodType) => {
    if (!currentUser) {
      setPendingAction({ type: 'booking', slotId, period });
      setAuthModalDetails({
        title: 'Login Necessário para Reservar',
        description: 'Para agendar o Laboratório de Informática ou os Chromebooks na Escola Terezinha, é necessário entrar com sua conta Google.'
      });
      setIsAuthModalOpen(true);
      return;
    }

    // If profile missing whatsapp, force profile completion first
    if (!userProfile?.whatsapp) {
      setIsFirstAccessModal(true);
      setIsProfileModalOpen(true);
      return;
    }

    setPrefillSlotId(slotId);
    setPrefillPeriod(period);
    setIsReservationModalOpen(true);
  };

  // Action: Open Negotiation WhatsApp
  const handleNegotiate = (res: Reservation) => {
    if (!currentUser) {
      setPendingAction({ type: 'negotiate', reservation: res });
      setAuthModalDetails({
        title: 'Login Necessário para Contato',
        description: 'Para negociar um horário com o responsável pela reserva via WhatsApp de forma segura, acesse com sua conta Google.'
      });
      setIsAuthModalOpen(true);
      return;
    }
    setNegotiationReservation(res);
    setIsNegotiateModalOpen(true);
  };

  // Action: Open cancellation confirmation modal from day view
  const handleCancelReservationFromDay = (res: Reservation) => {
    setReservationToCancel(res);
  };

  const handleExecuteCancelReservation = async () => {
    if (!reservationToCancel) return;
    setIsCancellingReservation(true);
    try {
      await cancelReservation(reservationToCancel.id);
      showToast('Reserva cancelada com sucesso. Os horários foram liberados.');
      setReservationToCancel(null);
    } catch (err) {
      showToast('Erro ao cancelar reserva. Tente novamente.');
    } finally {
      setIsCancellingReservation(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#edf2f7] dark:bg-slate-950 text-slate-900 dark:text-slate-100 flex flex-col font-sans transition-colors duration-200">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-6 right-6 z-50 bg-slate-900 text-white px-5 py-3 rounded-xl shadow-xl flex items-center gap-3 border border-slate-700 animate-in fade-in slide-in-from-bottom-4">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span className="text-sm font-medium">{toastMessage}</span>
        </div>
      )}

      {/* Main Header */}
      <Header
        user={effectiveUser}
        isAdmin={isAdminUser}
        theme={theme}
        onToggleTheme={toggleTheme}
        onLogin={handleLogin}
        onRequestLogout={() => setIsLogoutModalOpen(true)}
        onOpenMyReservations={() => setIsMyReservationsModalOpen(true)}
        onOpenProfile={() => {
          setIsFirstAccessModal(false);
          setIsProfileModalOpen(true);
        }}
        onOpenAdmin={() => setIsAdminModalOpen(true)}
        onOpenShare={() => setIsShareModalOpen(true)}
      />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {/* PWA Install Banner (dismissible, auto-suppressed if already installed or unsupported) */}
        <PWAInstallButton variant="banner" />

        {/* Banner Alert for Public / Institutional Context */}
        <div className="bg-linear-to-r from-[#166534] via-[#15803d] to-[#14532d] text-white rounded-2xl p-5 mb-6 shadow-md relative overflow-hidden">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-white/20 text-white text-xs font-semibold mb-2 backdrop-blur-xs">
                <School className="w-3.5 h-3.5" />
                Escola • Profª Terezinha Bezerra Siqueira
              </div>
              <h2 className="text-lg sm:text-xl font-bold tracking-tight">
                Espaço Tecnológico & Recursos de Informática
              </h2>
              <p className="text-xs sm:text-sm text-emerald-100 max-w-2xl mt-1">
                Consulte horários disponíveis, reserve o laboratório ou os Chromebooks para sua turma, e negocie horários de forma transparente e colaborativa.
              </p>
            </div>

            <button
              onClick={() => handleOpenNewReservation()}
              className="px-5 py-2.5 bg-white text-green-900 hover:bg-green-50 font-bold text-sm rounded-xl shadow-md transition-all active:scale-95 shrink-0 flex items-center gap-2 cursor-pointer"
            >
              <CalendarCheck2 className="w-4 h-4 text-green-800" />
              Fazer Reserva Agora
            </button>
          </div>
        </div>

        {/* Date & Shift Navigation Controls */}
        <DateNavigator
          currentDate={currentDate}
          onDateChange={(newDate) => setCurrentDate(newDate)}
          periodFilter={periodFilter}
          onPeriodFilterChange={(filter) => setPeriodFilter(filter)}
          viewMode={viewMode}
          onViewModeChange={(mode) => setViewMode(mode)}
        />

        {/* Schedule View: Day or Week */}
        {viewMode === 'day' ? (
          <DayScheduleView
            currentDate={currentDate}
            periodFilter={periodFilter}
            reservations={dateReservations}
            currentUserId={currentUser?.uid}
            onOpenBooking={(slotId, period) => handleOpenNewReservation(slotId, period)}
            onNegotiate={(res) => handleNegotiate(res)}
            onCancelReservation={(res) => handleCancelReservationFromDay(res)}
            onEditReservation={(res) => {
              setEditingReservation(res);
              setIsEditModalOpen(true);
            }}
          />
        ) : (
          <WeekScheduleView
            currentDate={currentDate}
            onSelectDate={(selected) => {
              setCurrentDate(selected);
              setViewMode('day');
            }}
            allReservations={allReservations}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white dark:bg-slate-900 border-t border-slate-300 dark:border-slate-800 py-4 sm:py-6 mt-12 text-slate-500 dark:text-slate-400 shadow-xs transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col items-center justify-center gap-2.5">
          <div className="flex flex-nowrap items-center justify-center gap-1.5 sm:gap-2 text-center text-[10px] sm:text-xs whitespace-nowrap">
            <img
              src="./logo-tbs.png"
              alt="Logo Escola Profª Terezinha Bezerra Siqueira"
              className="w-4 h-4 sm:w-6 sm:h-6 object-contain shrink-0 rounded-full shadow-2xs"
            />
            <span className="whitespace-nowrap">
              <strong>&copy; EEEFM Prof. Terezinha Bezerra Siqueira</strong> — PIBID 2026 / UFRA.LC
            </span>
            <img
              src="./logo-ufra2.png"
              alt="Logo UFRA"
              className="h-4 sm:h-6 w-auto object-contain shrink-0 drop-shadow-2xs"
            />
          </div>

          <div className="flex flex-wrap items-center justify-center gap-2.5 sm:gap-3.5 text-[11px] text-slate-500 dark:text-slate-400">
            <button
              type="button"
              onClick={() => setIsShareModalOpen(true)}
              className="hover:text-green-800 dark:hover:text-green-400 hover:underline cursor-pointer font-medium"
            >
              Compartilhar App
            </button>
            <span>&bull;</span>
            <a href="./sobre.html" className="hover:text-green-800 dark:hover:text-green-400 hover:underline font-medium">
              Sobre o Sistema
            </a>
            <span>&bull;</span>
            <a href="./privacidade.html" className="hover:text-green-800 dark:hover:text-green-400 hover:underline font-medium">
              Políticas de Privacidade
            </a>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <ReservationModal
        isOpen={isReservationModalOpen}
        onClose={() => setIsReservationModalOpen(false)}
        userProfile={userProfile}
        onSaveProfile={(p) => setUserProfile(p)}
        onOpenProfile={() => {
          setIsFirstAccessModal(false);
          setIsProfileModalOpen(true);
        }}
        existingReservations={allReservations}
        initialDate={currentDate}
        initialSlotId={prefillSlotId}
        initialPeriod={prefillPeriod}
        onSuccess={(res) => {
          showToast(`Reserva realizada com sucesso para o dia ${formatDateBR(res.date)}!`);
        }}
      />

      <NegotiateModal
        isOpen={isNegotiateModalOpen}
        onClose={() => {
          setIsNegotiateModalOpen(false);
          setNegotiationReservation(null);
        }}
        reservation={negotiationReservation}
      />

      <MyReservationsModal
        isOpen={isMyReservationsModalOpen}
        onClose={() => setIsMyReservationsModalOpen(false)}
        reservations={allReservations}
        currentUserId={currentUser?.uid || cachedUser?.uid || ''}
        onEditReservation={(res) => {
          setEditingReservation(res);
          setIsEditModalOpen(true);
        }}
        onRefresh={() => {
          showToast('Reserva atualizada.');
        }}
      />

      <ProfileModal
        isOpen={isProfileModalOpen}
        onClose={() => {
          setIsProfileModalOpen(false);
          setIsFirstAccessModal(false);
        }}
        userProfile={userProfile}
        photoURL={currentUser?.photoURL || cachedUser?.photoURL}
        onProfileUpdated={(updated) => {
          setUserProfile(updated);
          if (cachedUser) {
            const updatedCache: CachedAuthUser = {
              ...cachedUser,
              displayName: updated.displayName,
              role: updated.role,
              isAdmin: updated.role === 'admin' || cachedUser.isAdmin
            };
            try {
              localStorage.setItem(AUTH_CACHE_KEY, JSON.stringify(updatedCache));
            } catch {}
            setCachedUser(updatedCache);
          }
          showToast('Perfil atualizado com sucesso.');
          if (isFirstAccessModal) {
            setIsFirstAccessModal(false);
            setIsReservationModalOpen(true);
          }
        }}
        isFirstAccess={isFirstAccessModal}
      />

      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        allReservations={allReservations}
        onRefresh={() => {
          showToast('Ações administrativas sincronizadas.');
        }}
        onContactUser={(res) => {
          setNegotiationReservation(res);
          setIsNegotiateModalOpen(true);
        }}
        notificationPermission={adminNotifPermission}
        onRequestNotificationPermission={requestAdminNotifPermission}
        onSendTestNotification={sendAdminTestNotification}
      />

      <EditReservationModal
        isOpen={isEditModalOpen}
        onClose={() => {
          setIsEditModalOpen(false);
          setEditingReservation(null);
        }}
        reservation={editingReservation}
        allReservations={allReservations}
        onSuccess={() => {
          showToast('Reserva editada com sucesso!');
        }}
      />

      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => {
          setIsAuthModalOpen(false);
          setPendingAction(null);
        }}
        onLogin={handleLogin}
        actionTitle={authModalDetails.title}
        actionDescription={authModalDetails.description}
      />

      <ConfirmCancelModal
        isOpen={Boolean(reservationToCancel)}
        onClose={() => setReservationToCancel(null)}
        onConfirm={handleExecuteCancelReservation}
        reservation={reservationToCancel}
        isLoading={isCancellingReservation}
      />

      <ShareModal
        isOpen={isShareModalOpen}
        onClose={() => setIsShareModalOpen(false)}
      />

      <ConfirmLogoutModal
        isOpen={isLogoutModalOpen}
        onClose={() => setIsLogoutModalOpen(false)}
        onConfirm={handleLogout}
        userEmail={currentUser?.email}
      />
    </div>
  );
}
