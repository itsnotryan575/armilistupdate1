import * as Notifications from 'expo-notifications';
import { SCHEDULED_TEXT_CATEGORY } from './NotificationActions';

// Build a local Date from date and time pickers
export function buildWhenFromPickers(datePick: Date, timePick: Date): Date {
  return new Date(
    datePick.getFullYear(), 
    datePick.getMonth(), 
    datePick.getDate(),
    timePick.getHours(), 
    timePick.getMinutes(), 
    0, 
    0
  );
}

// Helper to build Date from date string and time components
export function buildWhenFromComponents(dateString: string, timeString: string, ampm: string): Date {
  const [year, month, day] = dateString.split('-').map(Number);
  const [hours, minutes] = timeString.split(':').map(Number);
  
  let hour24 = hours;
  if (ampm === 'AM' && hours === 12) {
    hour24 = 0;
  } else if (ampm === 'PM' && hours !== 12) {
    hour24 += 12;
  }
  
  return new Date(year, month - 1, day, hour24, minutes, 0, 0);
}

export async function scheduleReminder({ 
  title, 
  body, 
  datePick, 
  timePick, 
  reminderId,
  isGiftReminder = false,
  profileId = null
}: {
  title: string; 
  body: string; 
  datePick: Date; 
  timePick: Date; 
  reminderId: string;
  isGiftReminder?: boolean;
  profileId?: string | null;
}) {
  const when = buildWhenFromPickers(datePick, timePick);
  if (when.getTime() < Date.now() + 5000) {
    throw new Error('Pick a time ≥ 5s from now');
  }

  const trigger = { type: 'date', date: when } as const;

  const next = await Notifications.getNextTriggerDateAsync(trigger);
  console.log('REM ▶ when=', when.toISOString(), 'next=', next && new Date(next).toISOString());

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title, 
      body, 
      sound: 'default',
      data: { 
        type: 'reminder', 
        reminderId,
        giftReminder: isGiftReminder,
        profileId: profileId
      },
    },
    trigger,
  });

  return { id, whenMs: when.getTime() };
}

export async function scheduleScheduledText({ 
  messageId, 
  phoneNumber,
  message,
  datePick, 
  timePick 
}: {
  messageId: string; 
  phoneNumber: string;
  message: string;
  datePick: Date; 
  timePick: Date;
}) {
  const when = buildWhenFromPickers(datePick, timePick);
  if (when.getTime() < Date.now() + 5000) {
    throw new Error('Pick a time ≥ 5s from now');
  }

  const trigger = { type: 'date', date: when } as const;

  const next = await Notifications.getNextTriggerDateAsync(trigger);
  console.log('TEXT ▶ when=', when.toISOString(), 'next=', next && new Date(next).toISOString());

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to text someone!',
      body: message,
      sound: 'default',
      categoryIdentifier: SCHEDULED_TEXT_CATEGORY,
      data: {
        type: 'scheduled_text',
        textId: messageId,
        phoneNumber: phoneNumber,
        message: message,
      },
    },
    trigger,
  });

  return { id, whenMs: when.getTime() };
}

export async function scheduleBirthdayText({ 
  messageId, 
  phoneNumber,
  message,
  datePick, 
  timePick,
  profileId
}: {
  messageId: string; 
  phoneNumber: string;
  message: string;
  datePick: Date; 
  timePick: Date;
  profileId: string;
}) {
  const when = buildWhenFromPickers(datePick, timePick);
  if (when.getTime() < Date.now() + 5000) {
    throw new Error('Pick a time ≥ 5s from now');
  }

  const trigger = { type: 'date', date: when } as const;

  const next = await Notifications.getNextTriggerDateAsync(trigger);
  console.log('BIRTHDAY TEXT ▶ when=', when.toISOString(), 'next=', next && new Date(next).toISOString());

  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'Time to text someone!',
      body: message,
      sound: 'default',
      categoryIdentifier: SCHEDULED_TEXT_CATEGORY,
      data: {
        type: 'birthday_text',
        textId: messageId,
        phoneNumber: phoneNumber,
        message: message,
        profileId: profileId,
      },
    },
    trigger,
  });

  return { id, whenMs: when.getTime() };
}

export async function cancelById(notificationId?: string) {
  if (!notificationId) return;
  try { 
    await Notifications.cancelScheduledNotificationAsync(notificationId); 
    console.log('Cancelled notification:', notificationId);
  } catch (error) {
    console.error('Failed to cancel notification:', notificationId, error);
  }
}