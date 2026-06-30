import { NativeModules, PermissionsAndroid, Platform } from 'react-native';
import type { SavingsGoal, SavingsReminderFrequency } from '../types';

type ReminderNativeModule = {
  scheduleReminder: (
    goalId: string,
    title: string,
    message: string,
    timestamp: number,
    frequency: SavingsReminderFrequency,
  ) => Promise<void>;
  cancelReminder: (goalId: string) => Promise<void>;
};

const SavingsReminderModule = NativeModules.SavingsReminderModule as
  | ReminderNativeModule
  | undefined;

async function ensureNotificationPermission(): Promise<boolean> {
  if (Platform.OS !== 'android') {
    return false;
  }
  if (Platform.Version < 33) {
    return true;
  }

  const permission = PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS;
  const current = await PermissionsAndroid.check(permission);
  if (current) {
    return true;
  }

  const result = await PermissionsAndroid.request(permission);
  return result === PermissionsAndroid.RESULTS.GRANTED;
}

export function getNextReminderTimestamp(
  time: string,
  frequency: SavingsReminderFrequency,
): number {
  const match = /^([01]\d|2[0-3]):([0-5]\d)$/.exec(time);
  const now = new Date();
  const next = new Date(now);
  const hours = match ? Number(match[1]) : 9;
  const minutes = match ? Number(match[2]) : 0;

  next.setHours(hours, minutes, 0, 0);
  if (next.getTime() <= now.getTime()) {
    if (frequency === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    } else if (frequency === 'weekly') {
      next.setDate(next.getDate() + 7);
    } else {
      next.setDate(next.getDate() + 1);
    }
  }

  return next.getTime();
}

export async function scheduleSavingsReminder(goal: SavingsGoal): Promise<void> {
  if (Platform.OS !== 'android' || !SavingsReminderModule) {
    return;
  }

  if (!goal.reminderEnabled || goal.status !== 'active') {
    await cancelSavingsReminder(goal.id);
    return;
  }

  const permitted = await ensureNotificationPermission();
  if (!permitted) {
    return;
  }

  const frequency = goal.reminderFrequency ?? 'weekly';
  const time = goal.reminderTime ?? '09:00';
  const timestamp = getNextReminderTimestamp(time, frequency);

  await SavingsReminderModule.scheduleReminder(
    goal.id,
    'Savings reminder',
    `Add a contribution to "${goal.name}" when you can.`,
    timestamp,
    frequency,
  );
}

export async function cancelSavingsReminder(goalId: string): Promise<void> {
  if (Platform.OS !== 'android' || !SavingsReminderModule) {
    return;
  }
  await SavingsReminderModule.cancelReminder(goalId);
}
