// This file is no longer used - test functions moved to reminders.tsx
// Keeping file for reference but content is disabled

/*
import * as Notifications from 'expo-notifications';

const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));
const iso = (ms = Date.now()) => new Date(ms).toISOString();

export async function test60_literal() {
  console.log('TEST60: literal path');
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'ARMi 65s Test',
      body: `now=${iso()}`,
      sound: 'default',
      data: { source: 'test', kind: '65s' }
    },
    trigger: { seconds: 65, repeats: false },   // LITERAL — only these keys
  });
  console.log('TEST60 id=', id);
  await sleep(400);
  const table = await Notifications.getAllScheduledNotificationsAsync();
  console.log('TEST60 pending=', Array.isArray(table) ? table.length : table, table);
}

export async function testAbs90_literal() {
  console.log('ABS90: literal path');
  const id = await Notifications.scheduleNotificationAsync({
    content: {
      title: 'ARMi Absolute',
      body: `now=${iso()}`,
      sound: 'default',
      data: { source: 'test', kind: 'abs90' }
    },
    trigger: { date: new Date(Date.now() + 90_000) }, // LITERAL — only this key
  });
  console.log('ABS90 id=', id);
  await sleep(400);
  const table = await Notifications.getAllScheduledNotificationsAsync();
  console.log('ABS90 pending=', Array.isArray(table) ? table.length : table, table);
}
*/