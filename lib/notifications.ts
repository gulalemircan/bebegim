import { db } from './firebase';
import { ref, push, onValue } from 'firebase/database';

export interface NotificationPayload {
  type: 'mood' | 'emergency' | 'message' | 'photo' | 'pin' | 'game';
  title: string;
  body: string;
  sender: string;
  timestamp?: number;
}

export function sendNotification(payload: NotificationPayload) {
  const notifRef = ref(db, 'notifications');
  push(notifRef, {
    ...payload,
    timestamp: Date.now(),
    read: false,
  });
}

export function listenNotifications(
  myName: string,
  onNew: (n: NotificationPayload & { id: string }) => void
) {
  const notifRef = ref(db, 'notifications');
  return onValue(notifRef, (snap) => {
    const data = snap?.val?.() ?? {};
    Object.entries(data).forEach(([id, val]: [string, any]) => {
      if (val?.sender !== myName && !val?.read) {
        onNew({ id, ...val });
      }
    });
  });
}

export function markRead(id: string) {
  const r = ref(db, `notifications/${id}/read`);
  // @ts-ignore
  r.set(true);
}
