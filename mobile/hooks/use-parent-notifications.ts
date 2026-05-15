import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEffect, useState } from 'react';

import { hasSupabaseConfig, supabase } from '@/lib/supabase';

export type ParentNotification = {
  id: string;
  participantId?: string;
  parentProfileId?: string;
  participantName: string;
  location: string;
  method: 'NFC' | 'Ručně';
  text: string;
  createdAt: string;
};

const STORAGE_KEY = 'vys.parentNotifications';

type ParentNotificationRow = {
  id: string;
  participant_id?: string | null;
  parent_profile_id?: string | null;
  participant_name: string;
  location: string;
  method: 'NFC' | 'Ručně';
  text: string;
  created_at_text: string;
};

let cached: ParentNotification[] | null = null;
const listeners = new Set<(notifications: ParentNotification[]) => void>();

function emit(notifications: ParentNotification[]) {
  cached = notifications;
  for (const listener of listeners) listener(notifications);
}

function parseNotifications(value: string | null): ParentNotification[] {
  if (!value) return [];

  try {
    const parsed = JSON.parse(value);
    return Array.isArray(parsed) ? parsed.filter((item): item is ParentNotification => typeof item?.id === 'string') : [];
  } catch {
    return [];
  }
}

function notificationFromRow(row: ParentNotificationRow): ParentNotification {
  return {
    id: row.id,
    participantId: row.participant_id ?? undefined,
    parentProfileId: row.parent_profile_id ?? undefined,
    participantName: row.participant_name,
    location: row.location,
    method: row.method,
    text: row.text,
    createdAt: row.created_at_text,
  };
}

function rowFromNotification(notification: ParentNotification): ParentNotificationRow {
  return {
    id: notification.id,
    participant_id: notification.participantId ?? null,
    parent_profile_id: notification.parentProfileId ?? null,
    participant_name: notification.participantName,
    location: notification.location,
    method: notification.method,
    text: notification.text,
    created_at_text: notification.createdAt,
  };
}

async function loadLocalNotifications() {
  try {
    const value = await AsyncStorage.getItem(STORAGE_KEY);
    return parseNotifications(value);
  } catch {
    return [];
  }
}

async function saveLocalNotifications(notifications: ParentNotification[]) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(notifications));
  } catch {
    // ignore storage failures in the prototype
  }
}

export async function loadParentNotifications() {
  if (hasSupabaseConfig && supabase) {
    const { data, error } = await supabase
      .from('parent_notifications')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(20);

    if (!error && data) {
      const notifications = (data as ParentNotificationRow[]).map(notificationFromRow);
      cached = notifications;
      return notifications;
    }
  }

  try {
    const notifications = await loadLocalNotifications();
    cached = notifications;
    return notifications;
  } catch {
    return [];
  }
}

export async function addParentAttendanceNotification({ participantId, parentProfileId, participantName, location, method }: { participantId?: string; parentProfileId?: string; participantName: string; location: string; method: 'NFC' | 'Ručně' }) {
  const current = cached ?? await loadParentNotifications();
  const createdAt = new Date().toLocaleString('cs-CZ', { day: 'numeric', month: 'numeric', year: 'numeric', hour: '2-digit', minute: '2-digit' });
  const notification: ParentNotification = {
    id: `parent-note-${Date.now()}`,
    participantId,
    parentProfileId,
    participantName,
    location,
    method,
    createdAt,
    text: `Dítě ${participantName} dorazilo v pořádku na trénink ${location}.`,
  };
  const next = [notification, ...current].slice(0, 20);

  if (hasSupabaseConfig && supabase) {
    const { error } = await supabase.from('parent_notifications').insert(rowFromNotification(notification));

    if (error) await saveLocalNotifications(next);
  } else {
    await saveLocalNotifications(next);
  }

  emit(next);
  return notification;
}

export function useParentNotifications() {
  const [notifications, setNotifications] = useState<ParentNotification[]>(cached ?? []);
  const [ready, setReady] = useState(cached !== null);

  useEffect(() => {
    let mounted = true;

    if (cached === null) {
      loadParentNotifications().then((loadedNotifications) => {
        if (!mounted) return;
        setNotifications(loadedNotifications);
        setReady(true);
      });
    } else {
      setReady(true);
    }

    const listener = (nextNotifications: ParentNotification[]) => setNotifications(nextNotifications);
    listeners.add(listener);

    return () => {
      mounted = false;
      listeners.delete(listener);
    };
  }, []);

  return { notifications, ready };
}