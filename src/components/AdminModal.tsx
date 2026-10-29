import React, { useState, useEffect, useMemo } from 'react';
import {
  X,
  Shield,
  KeyRound,
  CheckCircle2,
  Trash2,
  UserPlus,
  AlertCircle,
  Save,
  Check,
  Search,
  MessageCircle,
  Users,
  ChevronDown,
  Bell,
  Volume2
} from 'lucide-react';
import {
  SystemSettings,
  Reservation,
  ALL_SLOTS,
  RESOURCE_DETAILS,
  UserProfile
} from '../types';
import {
  getSystemSettings,
  updateSystemSettings,
  approveReservation,
  getAllRegisteredUsers
} from '../services/reservationService';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc } from 'firebase/firestore';
import { formatDateBR, isSlotConcluded } from '../utils/date';
import { NotificationStatus } from '../hooks/useAdminNotification';

const PRIMARY_ADMIN_EMAIL = 'marcio.magalhaes.432@gmail.com';

interface AdminModalProps {
  isOpen: boolean;
  onClose: () => void;
  allReservations: Reservation[];
  onRefresh: () => void;
  onContactUser: (res: Reservation) => void;
  notificationPermission?: NotificationStatus;
  onRequestNotificationPermission?: () => Promise<string | 'unsupported'>;
  onSendTestNotification?: () => void;
}

export const AdminModal: React.FC<AdminModalProps> = ({
  isOpen,
  onClose,
  allReservations,
  onRefresh,
  onContactUser,
  notificationPermission = 'default',
  onRequestNotificationPermission,
  onSendTestNotification,
}) => {
  const [activeTab, setActiveTab] = useState<'settings' | 'reservations' | 'admins'>('settings');
  const [settings, setSettings] = useState<SystemSettings | null>(null);
  const [registeredUsers, setRegisteredUsers] = useState<UserProfile[]>([]);
  const [passwordInput, setPasswordInput] = useState('');
  const [requireApproval, setRequireApproval] = useState(false);

  // Dropdown & Selection state
  const [isUserSelectOpen, setIsUserSelectOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Reservation filter
  const [statusFilter, setStatusFilter] = useState<'all' | 'pendente' | 'confirmada' | 'cancelada'>('all');
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    if (isOpen) {
      loadSettings();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const [settingsData, usersData] = await Promise.all([
        getSystemSettings(),
        getAllRegisteredUsers()
      ]);
      setSettings(settingsData);
      setRegisteredUsers(usersData);
      setPasswordInput(settingsData.accessPassword || 'tbs2026');
      setRequireApproval(settingsData.requireAdminApproval || false);
    } catch (err) {
      setErrorMessage('Erro ao carregar configurações administrativas.');
    } finally {
      setIsLoading(false);
    }
  };

  // Only users who actually logged into the platform, completely hiding the primary admin
  const allAvailableAccounts = useMemo(() => {
    const map = new Map<string, { email: string; displayName: string; uid?: string }>();

    registeredUsers.forEach((u) => {
      if (u.email) {
        const emailLow = u.email.toLowerCase().trim();
        // Ocultar completamente o administrador principal da listagem
        if (emailLow === PRIMARY_ADMIN_EMAIL.toLowerCase()) return;

        map.set(emailLow, {
          email: emailLow,
          displayName: u.displayName || emailLow.split('@')[0],
          uid: u.uid
        });
      }
    });

    return Array.from(map.values());
  }, [registeredUsers]);

  // Lista de administradores visíveis no painel (ocultando o admin principal)
  const visibleAdmins = useMemo(() => {
    return (settings?.adminEmails || []).filter(
      (email) => email.toLowerCase() !== PRIMARY_ADMIN_EMAIL.toLowerCase()
    );
  }, [settings?.adminEmails]);

  // Contagem de reservas ativas/não finalizadas (não canceladas e cujo horário final ainda não passou)
  const activeReservationsCount = useMemo(() => {
    return allReservations.filter((res) => {
      // Desconsiderar canceladas
      if (res.status === 'cancelada') return false;

      // Obter o horário final do último horário da reserva
      let maxEndTime = '00:00';
      for (const slotId of res.slots) {
        const slotObj = ALL_SLOTS.find((s) => s.id === slotId);
        if (slotObj && slotObj.endTime > maxEndTime) {
          maxEndTime = slotObj.endTime;
        }
      }
      if (maxEndTime === '00:00') {
        maxEndTime = res.period === 'manha' ? '12:00' : '18:00';
      }

      // Se já passou o horário de término, considera finalizada
      return !isSlotConcluded(res.date, maxEndTime);
    }).length;
  }, [allReservations]);

  if (!isOpen) return null;

  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!passwordInput.trim()) {
      setErrorMessage('A senha de acesso não pode ser vazia.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      await updateSystemSettings({
        accessPassword: passwordInput.trim(),
        requireAdminApproval: requireApproval
      });
      setSuccessMessage('Configurações salvas com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : 'Erro ao salvar configurações.');
    } finally {
      setIsLoading(false);
    }
  };

  // Toggle admin status for an account (check/uncheck)
  const handleToggleAdmin = async (targetEmail: string, userUid?: string) => {
    if (!settings) return;
    const email = targetEmail.trim().toLowerCase();

    // Prevent any action on the primary admin
    if (email === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
      setErrorMessage('O administrador principal é permanente e não pode ser alterado.');
      setTimeout(() => setErrorMessage(null), 3500);
      return;
    }

    const currentList = settings.adminEmails.map((e) => e.toLowerCase());
    const isCurrentlyAdmin = currentList.includes(email);

    if (isCurrentlyAdmin) {
      // Removing admin
      setIsLoading(true);
      try {
        const updatedList = settings.adminEmails.filter((e) => e.toLowerCase() !== email);
        await updateSystemSettings({ adminEmails: updatedList });
        if (userUid) {
          try {
            await deleteDoc(doc(db, 'admins', userUid));
          } catch (e) {
            console.warn('Sync admin doc:', e);
          }
        }
        setSettings({ ...settings, adminEmails: updatedList });
        setSuccessMessage(`Administrador ${email} desmarcado com sucesso.`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setErrorMessage('Erro ao desmarcar administrador.');
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setIsLoading(false);
      }
    } else {
      // Adding as admin
      setIsLoading(true);
      try {
        const updatedList = [...settings.adminEmails, email];
        await updateSystemSettings({ adminEmails: updatedList });
        if (userUid) {
          try {
            await setDoc(doc(db, 'admins', userUid), {
              email: email,
              updatedAt: new Date().toISOString()
            }, { merge: true });
          } catch (e) {
            console.warn('Sync admin doc:', e);
          }
        }
        setSettings({ ...settings, adminEmails: updatedList });
        setSuccessMessage(`Administrador ${email} marcado e autorizado com sucesso!`);
        setTimeout(() => setSuccessMessage(null), 3000);
      } catch (err) {
        setErrorMessage('Erro ao marcar administrador.');
        setTimeout(() => setErrorMessage(null), 3000);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleAdminApproveRes = async (id: string) => {
    try {
      await approveReservation(id);
      setSuccessMessage('Reserva aprovada com sucesso!');
      setTimeout(() => setSuccessMessage(null), 3000);
      onRefresh();
    } catch (err) {
      setErrorMessage('Erro ao aprovar reserva.');
      setTimeout(() => setErrorMessage(null), 3000);
    }
  };

  // Filtered reservations
  const filteredReservations = allReservations.filter((r) => {
    if (statusFilter !== 'all' && r.status !== statusFilter) return false;
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      return (
        r.userName.toLowerCase().includes(term) ||
        r.purpose.toLowerCase().includes(term) ||
        r.date.includes(term)
      );
    }
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[92vh] overflow-y-auto overflow-x-hidden shadow-2xl border border-slate-200">
        {/* Header */}
        <div className="px-3.5 sm:px-6 py-3 sm:py-4 border-b border-slate-100 flex items-center justify-between sticky top-0 bg-white z-10">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-xl bg-amber-100 text-amber-700 flex items-center justify-center font-bold shrink-0">
              <Shield className="w-5 h-5 sm:w-6 sm:h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-base sm:text-xl font-bold text-slate-900 truncate">
                Painel Administrativo
              </h2>
              <p className="text-[10px] sm:text-xs text-slate-500 truncate">
                Controle de segurança, aprovações e lista de administradores
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors shrink-0"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switcher */}
        <div className="flex border-b border-slate-200 px-1 sm:px-6 bg-slate-50 items-center justify-between sm:justify-start">
          <button
            onClick={() => setActiveTab('settings')}
            className={`flex-1 sm:flex-initial py-2 sm:py-3 px-1 sm:px-4 text-[10px] sm:text-xs font-bold border-b-2 transition-all whitespace-nowrap text-center ${
              activeTab === 'settings'
                ? 'border-green-700 text-green-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Configurações
          </button>
          <button
            onClick={() => setActiveTab('admins')}
            className={`flex-1 sm:flex-initial py-2 sm:py-3 px-1 sm:px-4 text-[10px] sm:text-xs font-bold border-b-2 transition-all whitespace-nowrap text-center ${
              activeTab === 'admins'
                ? 'border-green-700 text-green-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            Administradores
          </button>
          <button
            onClick={() => setActiveTab('reservations')}
            className={`flex-1 sm:flex-initial py-2 sm:py-3 px-1 sm:px-4 text-[10px] sm:text-xs font-bold border-b-2 transition-all whitespace-nowrap text-center ${
              activeTab === 'reservations'
                ? 'border-green-700 text-green-800'
                : 'border-transparent text-slate-500 hover:text-slate-700'
            }`}
          >
            {activeReservationsCount > 0 ? `Reservas (${activeReservationsCount})` : 'Reservas'}
          </button>
        </div>

        {/* Feedback banners */}
        {errorMessage && (
          <div className="mx-3.5 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-xl flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-500 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}
        {successMessage && (
          <div className="mx-3.5 sm:mx-6 mt-3 sm:mt-4 p-2.5 sm:p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs rounded-xl flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        <div className="p-3.5 sm:p-6">
          {/* TAB 1: Settings */}
          {activeTab === 'settings' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1 flex items-center gap-1.5">
                    <KeyRound className="w-4 h-4 text-amber-600" />
                    Senha de Acesso para Novas Reservas
                  </label>
                  <input
                    type="text"
                    required
                    value={passwordInput}
                    onChange={(e) => setPasswordInput(e.target.value)}
                    className="w-full sm:w-72 px-3 py-2 text-sm bg-white border border-slate-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:outline-hidden font-mono font-bold"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Esta é a senha que qualquer professor ou bolsista deve digitar para criar reservas.
                  </p>
                </div>

                <div className="pt-3 border-t border-slate-200">
                  <label className="flex items-start gap-3 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={requireApproval}
                      onChange={(e) => setRequireApproval(e.target.checked)}
                      className="mt-0.5 w-4 h-4 text-green-700 rounded border-slate-300 focus:ring-green-500"
                    />
                    <div>
                      <span className="text-xs font-bold text-slate-800 block">
                        Exigir aprovação prévia de um administrador
                      </span>
                      <span className="text-[11px] text-slate-500 leading-normal block">
                        Se desmarcado (padrão), as reservas ficam automaticamente confirmadas assim que criadas. Se marcado, novas reservas começam como "Pendente" aguardando liberação do ADM.
                      </span>
                    </div>
                  </label>
                </div>

                {/* Admin Notifications Section */}
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <Bell className="w-4 h-4 text-green-700" />
                        <span className="text-xs font-bold text-slate-800">
                          Notificações de Novas Reservas (ADM)
                        </span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                            notificationPermission === 'granted'
                              ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              : notificationPermission === 'denied'
                              ? 'bg-rose-100 text-rose-800 border border-rose-200'
                              : 'bg-amber-100 text-amber-800 border border-amber-200'
                          }`}
                        >
                          {notificationPermission === 'granted'
                            ? 'Ativadas ✅'
                            : notificationPermission === 'denied'
                            ? 'Bloqueadas no Navegador ❌'
                            : 'Aguardando Ativação ⚠️'}
                        </span>
                      </div>
                      <p className="text-[11px] text-slate-500 leading-normal">
                        Receba avisos instantâneos e sinal sonoro no seu aparelho sempre que professores ou bolsistas criarem novas reservas.
                      </p>
                    </div>

                    <div className="shrink-0 flex items-center gap-2">
                      {notificationPermission !== 'granted' ? (
                        <button
                          type="button"
                          onClick={onRequestNotificationPermission}
                          className="px-3 py-1.5 bg-green-700 hover:bg-green-800 text-white text-xs font-semibold rounded-lg shadow-2xs transition-all flex items-center gap-1.5 cursor-pointer active:scale-95"
                        >
                          <Bell className="w-3.5 h-3.5" />
                          <span>Ativar Notificações</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={onSendTestNotification}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-300 text-xs font-semibold rounded-lg shadow-2xs transition-colors flex items-center gap-1.5 cursor-pointer"
                          title="Dispara um aviso de teste para confirmar"
                        >
                          <Volume2 className="w-3.5 h-3.5 text-green-700" />
                          <span>Testar Alerta</span>
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-5 py-2.5 bg-green-700 hover:bg-green-800 disabled:bg-green-400 text-white text-xs font-bold rounded-lg shadow-sm flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  Salvar Alterações
                </button>
              </div>
            </form>
          )}

          {/* TAB 2: Administrators */}
          {activeTab === 'admins' && (
            <div className="space-y-6">
              {/* Dropdown / Selection Field */}
              <div className="space-y-2">
                <label className="block text-xs font-bold text-slate-800 flex items-center justify-between">
                  <span className="flex items-center gap-1.5">
                    <UserPlus className="w-4 h-4 text-green-700" />
                    Selecionar Usuários Cadastrados para Marcar como ADM
                  </span>
                  <span className="text-[11px] font-normal text-slate-500">
                    {allAvailableAccounts.length} conta(s) encontrada(s)
                  </span>
                </label>

                {/* Clickable selection button */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setIsUserSelectOpen(!isUserSelectOpen)}
                    className="w-full flex items-center justify-between px-3.5 py-2.5 bg-slate-50 hover:bg-slate-100/80 border border-slate-300 hover:border-green-400 focus:border-green-500 rounded-xl shadow-2xs text-left transition-all cursor-pointer"
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <div className="w-7 h-7 rounded-lg bg-green-100 text-green-800 flex items-center justify-center shrink-0">
                        <Users className="w-4 h-4" />
                      </div>
                      <div className="truncate">
                        <span className="text-xs font-semibold text-slate-800 block truncate">
                          Clique aqui para selecionar os e-mails cadastrados
                        </span>
                        <span className="text-[11px] text-slate-500 block truncate">
                          {visibleAdmins.length} de {allAvailableAccounts.length} marcados como administrador
                        </span>
                      </div>
                    </div>
                    <ChevronDown
                      className={`w-4 h-4 text-slate-500 shrink-0 transition-transform duration-200 ${
                        isUserSelectOpen ? 'rotate-180' : ''
                      }`}
                    />
                  </button>

                  {/* Dropdown menu displaying list of registered users */}
                  {isUserSelectOpen && (
                    <div className="mt-2 bg-white rounded-xl border border-slate-200 shadow-xl overflow-hidden z-30 transition-all">
                      {/* List of registered users with checkboxes */}
                      <div className="max-h-64 overflow-y-auto divide-y divide-slate-100">
                        {allAvailableAccounts.length === 0 ? (
                          <div className="p-6 text-center text-xs text-slate-500 space-y-1">
                            <p className="font-semibold text-slate-700">Nenhum usuário cadastrado encontrado</p>
                            <p className="text-[11px]">
                              Apenas usuários que já fizeram login com o Google na plataforma aparecem nesta lista.
                            </p>
                          </div>
                        ) : (
                          allAvailableAccounts.map((account) => {
                            const isAdmin = visibleAdmins
                              .map((e) => e.toLowerCase())
                              .includes(account.email.toLowerCase());

                            return (
                              <div
                                key={account.email}
                                onClick={() => !isLoading && handleToggleAdmin(account.email, account.uid)}
                                className={`p-3 flex items-center justify-between gap-3 transition-colors select-none ${
                                  isAdmin
                                    ? 'bg-green-50/40 hover:bg-green-50/70 cursor-pointer'
                                    : 'hover:bg-slate-50 cursor-pointer'
                                }`}
                              >
                                <div className="flex items-center gap-3 min-w-0">
                                  <input
                                    type="checkbox"
                                    checked={isAdmin}
                                    disabled={isLoading}
                                    onChange={() => !isLoading && handleToggleAdmin(account.email, account.uid)}
                                    className="w-4 h-4 text-green-700 rounded border-slate-300 focus:ring-green-500 cursor-pointer shrink-0"
                                  />
                                  <div className="min-w-0">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <p className="text-xs font-bold text-slate-800 truncate">
                                        {account.displayName}
                                      </p>
                                    </div>
                                    <p className="text-[11px] font-mono text-slate-500 truncate">
                                      {account.email}
                                    </p>
                                  </div>
                                </div>

                                <div className="shrink-0 flex items-center gap-1.5">
                                  {isAdmin ? (
                                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                                      <Shield className="w-3 h-3 text-amber-600" />
                                      Administrador
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-slate-100 text-slate-600">
                                      Usuário Comum
                                    </span>
                                  )}
                                </div>
                              </div>
                            );
                          })
                        )}
                      </div>

                      {/* Dropdown footer info */}
                      <div className="p-2.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500">
                        <span>Clique em qualquer linha ou marque a caixinha para conceder ou remover acesso ADM.</span>
                        <button
                          type="button"
                          onClick={() => setIsUserSelectOpen(false)}
                          className="px-2.5 py-1 text-xs font-semibold bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 rounded-lg shadow-2xs cursor-pointer"
                        >
                          Fechar Lista
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* List of currently authorized administrators (excluding primary admin) */}
              <div className="space-y-2 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-slate-500 flex items-center gap-1.5">
                    <Shield className="w-3.5 h-3.5 text-amber-600" />
                    Administradores Autorizados ({visibleAdmins.length})
                  </h4>
                  <span className="text-[11px] text-slate-400">
                    Gerenciado via lista acima
                  </span>
                </div>

                <div className="space-y-1.5">
                  {visibleAdmins.length === 0 ? (
                    <div className="p-4 bg-slate-50 rounded-xl border border-dashed border-slate-200 text-center text-xs text-slate-500">
                      Nenhum administrador adicional autorizado. Abra o campo de seleção acima para marcar um usuário cadastrado como administrador.
                    </div>
                  ) : (
                    visibleAdmins.map((email) => {
                      // Find user profile name if available
                      const foundAccount = allAvailableAccounts.find(
                        (a) => a.email.toLowerCase() === email.toLowerCase()
                      );

                      return (
                        <div
                          key={email}
                          className="p-3 bg-slate-50 hover:bg-slate-100/60 rounded-xl border border-slate-200 flex items-center justify-between text-xs transition-colors"
                        >
                          <div className="flex items-center gap-2.5 min-w-0">
                            <div className="w-7 h-7 rounded-lg bg-amber-100 text-amber-800 flex items-center justify-center shrink-0">
                              <Shield className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-slate-800 truncate">
                                  {foundAccount?.displayName || email.split('@')[0]}
                                </span>
                              </div>
                              <span className="font-mono text-[11px] text-slate-500 truncate block">
                                {email}
                              </span>
                            </div>
                          </div>

                          <button
                            type="button"
                            onClick={() => handleToggleAdmin(email, foundAccount?.uid)}
                            className="text-red-500 hover:text-red-700 hover:bg-red-50 p-1.5 rounded-lg transition-colors cursor-pointer"
                            title="Desmarcar / Remover acesso de administrador"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: Manage All Reservations */}
          {activeTab === 'reservations' && (
            <div className="space-y-4">
              {/* Filters */}
              <div className="flex flex-col sm:flex-row gap-2 justify-between">
                <div className="relative flex-1">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    placeholder="Filtrar por nome, finalidade ou data (AAAA-MM-DD)..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-hidden focus:bg-white"
                  />
                </div>

                <div className="grid grid-cols-4 sm:flex gap-1 bg-slate-100 p-1 rounded-lg text-xs">
                  {(['all', 'pendente', 'confirmada', 'cancelada'] as const).map((st) => (
                    <button
                      key={st}
                      onClick={() => setStatusFilter(st)}
                      className={`px-1.5 sm:px-2.5 py-1 rounded-md capitalize transition-all text-center text-[10px] sm:text-xs ${
                        statusFilter === st
                          ? 'bg-white font-bold text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {st === 'all' ? 'Todas' : st}
                    </button>
                  ))}
                </div>
              </div>

              {/* Reservations list */}
              <div className="space-y-3 max-h-[50vh] overflow-y-auto pr-1">
                {filteredReservations.length === 0 ? (
                  <p className="text-center py-8 text-xs text-slate-500">
                    Nenhuma reserva encontrada com os filtros selecionados.
                  </p>
                ) : (
                  filteredReservations.map((res) => {
                    const slotLabels = res.slots
                      .map((s) => ALL_SLOTS.find((slot) => slot.id === s)?.label)
                      .join(', ');

                    return (
                      <div
                        key={res.id}
                        className="p-3 bg-white rounded-xl border border-slate-200 text-xs space-y-1.5 shadow-2xs"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-1">
                          <span className="font-bold text-slate-900">
                            {res.userName} • {formatDateBR(res.date)} ({res.period === 'manha' ? 'Manhã' : 'Tarde'})
                          </span>
                          <span
                            className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                              res.status === 'cancelada'
                                ? 'bg-red-100 text-red-800'
                                : res.status === 'confirmada'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800'
                            }`}
                          >
                            {res.status}
                          </span>
                        </div>

                        <p className="text-slate-600">
                          <strong>Recurso:</strong> {RESOURCE_DETAILS[res.resource].short} | <strong>Horários:</strong> {slotLabels}
                        </p>
                        <p className="text-slate-500 italic">
                          "{res.purpose}"
                        </p>

                        <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                          {res.status === 'pendente' && (
                            <button
                              onClick={() => handleAdminApproveRes(res.id)}
                              className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded font-bold text-[11px] flex items-center gap-1"
                            >
                              <Check className="w-3.5 h-3.5" />
                              Aprovar Reserva
                            </button>
                          )}
                          {res.status !== 'cancelada' && (
                            <button
                              type="button"
                              onClick={() => {
                                onClose();
                                onContactUser(res);
                              }}
                              className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg font-bold text-[11px] flex items-center gap-1.5 shadow-xs transition-all active:scale-95 cursor-pointer"
                            >
                              <MessageCircle className="w-3.5 h-3.5" />
                              Entrar em contato
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
