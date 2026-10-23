import { useState, useEffect, useRef, useCallback } from 'react';
import { collection, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import { Reservation, RESOURCE_DETAILS, ALL_SLOTS } from '../types';
import { formatDateBR } from '../utils/date';

export type NotificationStatus = 'default' | 'granted' | 'denied' | 'unsupported';

export function playNotificationChime() {
  try {
    const AudioContextClass =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();
    const now = ctx.currentTime;

    // First note (E5 ~ 659 Hz)
    const osc1 = ctx.createOscillator();
    const gain1 = ctx.createGain();
    osc1.type = 'sine';
    osc1.frequency.setValueAtTime(659.25, now);
    gain1.gain.setValueAtTime(0.12, now);
    gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.22);
    osc1.connect(gain1);
    gain1.connect(ctx.destination);
    osc1.start(now);
    osc1.stop(now + 0.22);

    // Second note (A5 ~ 880 Hz)
    const osc2 = ctx.createOscillator();
    const gain2 = ctx.createGain();
    osc2.type = 'sine';
    osc2.frequency.setValueAtTime(880, now + 0.1);
    gain2.gain.setValueAtTime(0.15, now + 0.1);
    gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.35);
    osc2.connect(gain2);
    gain2.connect(ctx.destination);
    osc2.start(now + 0.1);
    osc2.stop(now + 0.35);
  } catch (e) {
    // Audio might fail if context wasn't unlocked by gesture yet; fail silently
  }
}

export async function sendSystemNotification(title: string, options: NotificationOptions) {
  if (!('Notification' in window) || Notification.permission !== 'granted') return;

  try {
    if ('serviceWorker' in navigator) {
      const reg = await navigator.serviceWorker.ready;
      if (reg && 'showNotification' in reg) {
        await reg.showNotification(title, options);
        return;
      }
    }
    const notif = new Notification(title, options);
    notif.onclick = () => {
      window.focus();
      notif.close();
    };
  } catch (err) {
    try {
      const notif = new Notification(title, options);
      notif.onclick = () => {
        window.focus();
        notif.close();
      };
    } catch (e) {
      console.warn('Could not fire notification:', e);
    }
  }
}

interface UseAdminNotificationParams {
  isAdmin: boolean;
  currentUserUid?: string;
  onNewReservationAlert?: (reservation: Reservation) => void;
}

export function useAdminNotification({
  isAdmin,
  currentUserUid,
  onNewReservationAlert
}: UseAdminNotificationParams) {
  const [permission, setPermission] = useState<NotificationStatus>('default');
  const [isDismissed, setIsDismissed] = useState(false);

  const isInitialLoadRef = useRef(true);
  const knownReservationIdsRef = useRef<Set<string>>(new Set());

  // Check initial support & permission status ONLY if admin
  useEffect(() => {
    if (!isAdmin) {
      setPermission('default');
      return;
    }

    if (!('Notification' in window)) {
      setPermission('unsupported');
      return;
    }

    setPermission(Notification.permission as NotificationStatus);

    // Check if dismissed for current user in this browser session
    if (currentUserUid) {
      const dismissed = sessionStorage.getItem(`admin_notif_dismissed_${currentUserUid}`);
      if (dismissed === 'true') {
        setIsDismissed(true);
      }
    }
  }, [isAdmin, currentUserUid]);

  // Request Notification permission (strictly invoked only for admins)
  const requestPermission = useCallback(async (): Promise<NotificationPermission | 'unsupported'> => {
    if (!isAdmin) return 'denied';
    if (!('Notification' in window)) {
      setPermission('unsupported');
      return 'unsupported';
    }

    try {
      const result = await Notification.requestPermission();
      setPermission(result as NotificationStatus);
      if (result === 'granted') {
        setIsDismissed(false);
        // Send welcome test notification to confirm
        sendSystemNotification('Notificações de Administrador Ativadas!', {
          body: 'Você receberá avisos em tempo real sempre que novas reservas forem realizadas.',
          icon: './pwa-192x192.png',
          badge: './favicon.svg',
          tag: 'admin-notif-welcome',
          vibrate: [150, 80, 150]
        } as NotificationOptions);
        playNotificationChime();
      }
      return result;
    } catch (error) {
      console.warn('Error requesting notification permission:', error);
      return 'denied';
    }
  }, [isAdmin]);

  // Dismiss the prompt banner for this session
  const dismissPrompt = useCallback(() => {
    setIsDismissed(true);
    if (currentUserUid) {
      sessionStorage.setItem(`admin_notif_dismissed_${currentUserUid}`, 'true');
    }
  }, [currentUserUid]);

  // Send a manual test notification
  const sendTestNotification = useCallback(() => {
    if (permission !== 'granted') return;

    playNotificationChime();
    sendSystemNotification('Teste de Notificação - Lab Info TBS', {
      body: 'Sistema funcionando perfeitamente! Você será avisado quando novas reservas forem feitas.',
      icon: './pwa-192x192.png',
      badge: './favicon.svg',
      tag: 'admin-notif-test',
      vibrate: [200, 100, 200]
    } as NotificationOptions);
  }, [permission]);

  // Real-time listener for new reservations: ONLY active when isAdmin is true
  useEffect(() => {
    if (!isAdmin) {
      knownReservationIdsRef.current.clear();
      isInitialLoadRef.current = true;
      return;
    }

    const collRef = collection(db, 'reservations');
    const unsubscribe = onSnapshot(
      collRef,
      (snapshot) => {
        // Initial load: populate existing IDs without notifying
        if (isInitialLoadRef.current) {
          snapshot.forEach((docSnap) => {
            knownReservationIdsRef.current.add(docSnap.id);
          });
          isInitialLoadRef.current = false;
          return;
        }

        // Subsequent snapshot: identify newly added reservations
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'added') {
            const id = change.doc.id;
            const data = change.doc.data() as Reservation;

            if (!knownReservationIdsRef.current.has(id)) {
              knownReservationIdsRef.current.add(id);

              // Don't notify the admin if they created the reservation themselves
              if (currentUserUid && data.userId === currentUserUid) {
                return;
              }

              // Build friendly description
              const resDetails = RESOURCE_DETAILS[data.resource] || { label: 'Laboratório / Chromebooks' };
              const periodLabel = data.period === 'manha' ? 'Manhã' : 'Tarde';
              const dateBR = formatDateBR(data.date);
              const slotsCount = data.slots?.length || 1;
              const slotsNames = (data.slots || [])
                .map((s) => ALL_SLOTS.find((slot) => slot.id === s)?.label || s)
                .join(', ');

              const title = '🔔 Nova Reserva Realizada!';
              const body = `${data.userName || 'Um professor'} reservou: ${resDetails.label} para ${dateBR} (${periodLabel} • ${slotsNames || `${slotsCount} horário(s)`}).`;

              // Trigger system notification
              sendSystemNotification(title, {
                body,
                icon: './pwa-192x192.png',
                badge: './favicon.svg',
                tag: `reserva-${id}`,
                vibrate: [200, 100, 200],
                data: {
                  url: './',
                  reservationId: id
                }
              } as NotificationOptions);

              // Play audio chime
              playNotificationChime();

              // Trigger in-app alert callback if provided
              if (onNewReservationAlert) {
                onNewReservationAlert(data);
              }
            }
          }
        });
      },
      (err) => {
        console.warn('Admin notification listener error:', err);
      }
    );

    return () => {
      unsubscribe();
    };
  }, [isAdmin, currentUserUid, onNewReservationAlert]);

  return {
    permission,
    isDismissed,
    requestPermission,
    dismissPrompt,
    sendTestNotification,
    isSupported: permission !== 'unsupported'
  };
}
