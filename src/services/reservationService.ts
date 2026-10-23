import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  onSnapshot,
  runTransaction,
  serverTimestamp,
  deleteDoc
} from 'firebase/firestore';
import { db, auth, handleFirestoreError, OperationType } from '../firebase';
import {
  Reservation,
  UserProfile,
  UserContact,
  SystemSettings,
  ResourceType,
  DEFAULT_ACCESS_PASSWORD,
  INITIAL_ADMIN_EMAILS,
  ALL_SLOTS
} from '../types';

// Real-time listener for reservations on a given date (or all active)
export function subscribeReservationsByDate(
  date: string,
  onData: (reservations: Reservation[]) => void,
  onError?: (error: unknown) => void
) {
  const collRef = collection(db, 'reservations');
  const q = query(collRef, where('date', '==', date));

  return onSnapshot(
    q,
    (snapshot) => {
      const list: Reservation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Reservation;
        list.push({ ...data, id: docSnap.id });
      });
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, 'reservations');
    }
  );
}

// Real-time listener for all reservations (used in user's own bookings & admin panel)
export function subscribeAllReservations(
  onData: (reservations: Reservation[]) => void,
  onError?: (error: unknown) => void
) {
  const collRef = collection(db, 'reservations');
  return onSnapshot(
    collRef,
    (snapshot) => {
      const list: Reservation[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data() as Reservation;
        list.push({ ...data, id: docSnap.id });
      });
      // Sort by date descending then slot
      list.sort((a, b) => (a.date < b.date ? 1 : -1));
      onData(list);
    },
    (err) => {
      if (onError) onError(err);
      handleFirestoreError(err, OperationType.LIST, 'reservations');
    }
  );
}

// Fetch or initialize system settings
export async function getSystemSettings(): Promise<SystemSettings> {
  const settingsDocRef = doc(db, 'system_settings', 'config');
  try {
    const snap = await getDoc(settingsDocRef);
    if (snap.exists()) {
      return snap.data() as SystemSettings;
    }
    // Initialize default settings if not exists
    const defaultSettings: SystemSettings = {
      accessPassword: DEFAULT_ACCESS_PASSWORD,
      requireAdminApproval: false,
      adminEmails: INITIAL_ADMIN_EMAILS,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
    try {
      await setDoc(settingsDocRef, defaultSettings);
    } catch {
      // Ignored if unauthenticated or permissions
    }
    return defaultSettings;
  } catch (error) {
    console.warn('Could not load settings from server, using defaults:', error);
    return {
      accessPassword: DEFAULT_ACCESS_PASSWORD,
      requireAdminApproval: false,
      adminEmails: INITIAL_ADMIN_EMAILS,
      updatedAt: new Date().toISOString(),
      updatedBy: 'system'
    };
  }
}

// Update system settings (admin only)
export async function updateSystemSettings(updates: Partial<SystemSettings>): Promise<void> {
  const settingsDocRef = doc(db, 'system_settings', 'config');
  try {
    await updateDoc(settingsDocRef, {
      ...updates,
      updatedAt: new Date().toISOString(),
      updatedBy: auth.currentUser?.uid || 'unknown'
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, 'system_settings/config');
  }
}

// Check conflict helper
export function checkResourceConflict(
  existingResource: ResourceType,
  requestedResource: ResourceType
): boolean {
  if (existingResource === 'both' || requestedResource === 'both') {
    return true; // Overlap on either lab or chromebooks
  }
  return existingResource === requestedResource;
}

// Create reservation with atomic collision check via Firestore transaction
export async function createReservationAtomic(params: {
  date: string;
  period: 'manha' | 'tarde';
  slots: string[];
  resource: ResourceType;
  purpose: string;
  userName: string;
  accessPasswordInput: string;
}): Promise<Reservation> {
  const currentUser = auth.currentUser;
  if (!currentUser) {
    throw new Error('Você precisa estar autenticado com uma conta Google para realizar uma reserva.');
  }

  // 1. Validate Access Password against settings
  const settings = await getSystemSettings();
  const currentPassword = settings.accessPassword || DEFAULT_ACCESS_PASSWORD;
  if (params.accessPasswordInput.trim().toLowerCase() !== currentPassword.trim().toLowerCase()) {
    throw new Error('Senha de acesso incorreta! Digite a senha do laboratório.');
  }

  const reservationId = `res_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  const reservationRef = doc(db, 'reservations', reservationId);

  // Status determined by school admin policy
  const initialStatus: 'pendente' | 'confirmada' = settings.requireAdminApproval ? 'pendente' : 'confirmada';

  const reservationData: Reservation = {
    id: reservationId,
    userId: currentUser.uid,
    userName: params.userName.trim(),
    date: params.date,
    period: params.period,
    slots: params.slots,
    resource: params.resource,
    purpose: params.purpose.trim(),
    status: initialStatus,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };

  try {
    await runTransaction(db, async (transaction) => {
      // Check existing active reservations for the exact same date
      const q = query(
        collection(db, 'reservations'),
        where('date', '==', params.date)
      );
      const snapshot = await getDocs(q);

      // Verify no conflict in any requested slot
      for (const docSnap of snapshot.docs) {
        const existing = docSnap.data() as Reservation;
        if (existing.status === 'cancelada') continue;

        // Check if there is an overlapping slot
        const sharedSlots = existing.slots.filter((s) => params.slots.includes(s));
        if (sharedSlots.length > 0) {
          // Check resource conflict
          if (checkResourceConflict(existing.resource, params.resource)) {
            const slotLabels = sharedSlots
              .map((s) => ALL_SLOTS.find((slot) => slot.id === s)?.label || s)
              .join(', ');
            throw new Error(
              `Conflito detectado! O horário (${slotLabels}) já foi reservado para "${existing.resource === 'both' ? 'Laboratório + Chromebooks' : existing.resource === 'lab' ? 'Laboratório' : 'Chromebooks'}" por ${existing.userName}.`
            );
          }
        }
      }

      // No conflict detected: Commit new reservation
      transaction.set(reservationRef, reservationData);
    });

    return reservationData;
  } catch (error) {
    if (error instanceof Error && error.message.includes('Conflito detectado')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.CREATE, `reservations/${reservationId}`);
  }
}

// Cancel reservation
export async function cancelReservation(reservationId: string): Promise<void> {
  const reservationRef = doc(db, 'reservations', reservationId);
  try {
    await updateDoc(reservationRef, {
      status: 'cancelada',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reservations/${reservationId}`);
  }
}

// Admin approve reservation
export async function approveReservation(reservationId: string): Promise<void> {
  const reservationRef = doc(db, 'reservations', reservationId);
  try {
    await updateDoc(reservationRef, {
      status: 'confirmada',
      updatedAt: new Date().toISOString()
    });
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `reservations/${reservationId}`);
  }
}

// Edit existing reservation with atomic conflict validation
export async function updateReservationAtomic(
  reservationId: string,
  params: {
    date: string;
    period: 'manha' | 'tarde';
    slots: string[];
    resource: ResourceType;
    purpose: string;
  }
): Promise<void> {
  const reservationRef = doc(db, 'reservations', reservationId);

  try {
    await runTransaction(db, async (transaction) => {
      const targetDoc = await transaction.get(reservationRef);
      if (!targetDoc.exists()) {
        throw new Error('Reserva não encontrada.');
      }

      // Check conflict against OTHER active reservations on this date
      const q = query(
        collection(db, 'reservations'),
        where('date', '==', params.date)
      );
      const snapshot = await getDocs(q);

      for (const docSnap of snapshot.docs) {
        if (docSnap.id === reservationId) continue; // Exclude current reservation
        const existing = docSnap.data() as Reservation;
        if (existing.status === 'cancelada') continue;

        const sharedSlots = existing.slots.filter((s) => params.slots.includes(s));
        if (sharedSlots.length > 0) {
          if (checkResourceConflict(existing.resource, params.resource)) {
            const slotLabels = sharedSlots
              .map((s) => ALL_SLOTS.find((slot) => slot.id === s)?.label || s)
              .join(', ');
            throw new Error(
              `Conflito! O novo horário selecionado (${slotLabels}) já está ocupado por ${existing.userName}.`
            );
          }
        }
      }

      transaction.update(reservationRef, {
        date: params.date,
        period: params.period,
        slots: params.slots,
        resource: params.resource,
        purpose: params.purpose.trim(),
        updatedAt: new Date().toISOString()
      });
    });
  } catch (error) {
    if (error instanceof Error && error.message.includes('Conflito!')) {
      throw error;
    }
    handleFirestoreError(error, OperationType.UPDATE, `reservations/${reservationId}`);
  }
}

// User Profile Management
export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const userRef = doc(db, 'users', uid);
  try {
    const snap = await getDoc(userRef);
    if (snap.exists()) {
      return snap.data() as UserProfile;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `users/${uid}`);
  }
}

export async function saveUserProfile(profile: UserProfile): Promise<void> {
  const userRef = doc(db, 'users', profile.uid);
  const contactRef = doc(db, 'user_contacts', profile.uid);

  try {
    const timestamp = new Date().toISOString();
    await setDoc(userRef, {
      ...profile,
      updatedAt: timestamp
    }, { merge: true });

    // Also update public contact card (for signed in users to negotiate)
    const contactData: UserContact = {
      uid: profile.uid,
      displayName: profile.displayName,
      whatsapp: profile.whatsapp,
      updatedAt: timestamp
    };
    await setDoc(contactRef, contactData, { merge: true });
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `users/${profile.uid}`);
  }
}

// Fetch WhatsApp for negotiation (accessible only by authenticated users)
export async function getUserContactForNegotiation(userId: string): Promise<UserContact | null> {
  const contactRef = doc(db, 'user_contacts', userId);
  try {
    const snap = await getDoc(contactRef);
    if (snap.exists()) {
      return snap.data() as UserContact;
    }
    return null;
  } catch (error) {
    handleFirestoreError(error, OperationType.GET, `user_contacts/${userId}`);
  }
}

// Fetch all registered users from Firestore
export async function getAllRegisteredUsers(): Promise<UserProfile[]> {
  const usersRef = collection(db, 'users');
  try {
    const snap = await getDocs(usersRef);
    const list: UserProfile[] = [];
    snap.forEach((docSnap) => {
      const data = docSnap.data() as UserProfile;
      if (data && data.email) {
        list.push({
          uid: docSnap.id,
          displayName: data.displayName || data.email.split('@')[0],
          email: data.email.toLowerCase(),
          whatsapp: data.whatsapp || '',
          role: data.role || 'user'
        });
      }
    });
    return list;
  } catch (error) {
    console.warn('Erro ao carregar lista de usuários:', error);
    return [];
  }
}

