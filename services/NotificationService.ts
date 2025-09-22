import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Constants from 'expo-constants';
import { TEST_SCHEDULER_ONLY, NUDGES_ENABLED } from '@/flags';
import { scheduleReminder, scheduleScheduledText, cancelById, buildWhenFromComponents } from './Scheduler';
// @ts-ignore
import notifPkg from 'expo-notifications/package.json';

// Configure how notifications are handled when the app is in the foreground
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,   // replaces shouldShowAlert
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Random app engagement messages
const RANDOM_APP_MESSAGES = [
  {
    title: "Have you met anyone new recently? 👀",
    body: "Add them to your profiles so you never forget the important details🧠"
  },
  {
    title: "A quick hello can go a long way 🙂",
    body: "Double check ARMi profiles so you can get the details right 😼"
  },
  {
    title: "Don't let your roster go quiet 🔔",
    body: "Check upcoming reminders, add new people, and check in with people you haven't spoken to in awhile."
  },
  {
    title: "Are your profiles up to date🤔",
    body: "Open ARMi to review notes, update last contact, and keep your roster fresh."
  },
  {
    title: "Check in with your people 👋",
    body: "Don't forget the important details — ARMi has your back."
  }
];

/** Utilities */
function nowMs() { return Date.now(); }
function toISO(ms: number) { return new Date(ms).toISOString(); }

class NotificationServiceClass {
  private isInitialized = false;
  private randomNotificationIds: string[] = [];

  async init() {
    if (this.isInitialized) return;

    // One-time startup logs for debugging
    console.log('env:', { appOwnership: Constants.appOwnership, execEnv: Constants.executionEnvironment });
    console.log('expo SDK:', Constants.expoVersion);
    console.log('expo-notifications JS:', notifPkg?.version);
    console.log('native app/build:', Constants.nativeAppVersion, Constants.nativeBuildVersion);
    console.log('NUDGES_ENABLED:', NUDGES_ENABLED);
    console.log('TEST_SCHEDULER_ONLY:', TEST_SCHEDULER_ONLY);

    // One-time startup logs for debugging
    console.log('env:', { appOwnership: Constants.appOwnership, execEnv: Constants.executionEnvironment });
    console.log('expo SDK:', Constants.expoVersion);
    console.log('expo-notifications JS:', notifPkg?.version);
    console.log('native app/build:', Constants.nativeAppVersion, Constants.nativeBuildVersion);
    console.log('NUDGES_ENABLED:', NUDGES_ENABLED);
    console.log('TEST_SCHEDULER_ONLY:', TEST_SCHEDULER_ONLY);
    console.log('TEST_SCHEDULER_ONLY:', TEST_SCHEDULER_ONLY);

    try {
      // Request permissions
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('Push notification permissions not granted');
        return false;
      }

      // Configure notification channel for Android
      if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('reminders', {
          name: 'Reminders',
          importance: Notifications.AndroidImportance.HIGH,
          vibrationPattern: [0, 250, 250, 250],
          lightColor: '#FF231F7C',
          sound: 'default',
        });
      }

      // Configure notification category for scheduled texts with Edit action
      await Notifications.setNotificationCategoryAsync('scheduled-text-category', [
        {
          identifier: 'edit-scheduled-text',
          buttonTitle: 'Edit',
          options: {
            opensAppToForeground: true,
          },
        },
      ]);

      this.isInitialized = true;
      console.log('Notification service initialized successfully');
      
      // Check if running in Expo Go and warn about background behavior differences
      if (Constants.appOwnership === 'expo') {
        console.warn('⚠️ NOTIFICATION WARNING: Running in Expo Go. Background notification behavior may differ from standalone builds. For accurate testing, use a development build or TestFlight.');
      }
      
      return true;
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return false;
    }
  }

  private generateRandomNotificationTimesForToday(): { amTime: Date | null, pmTime: Date | null } {
    const now = new Date();
    console.log('🔔 RANDOM NOTIF - Current time:', now.toLocaleString());
    
    // Morning window: 9:30 AM - 10:30 AM
    const morningStart = new Date();
    morningStart.setHours(9, 30, 0, 0);
    const morningEnd = new Date();
    morningEnd.setHours(10, 30, 0, 0);
    
    // Evening window: 7:30 PM - 8:30 PM
    const eveningStart = new Date();
    eveningStart.setHours(19, 30, 0, 0);
    const eveningEnd = new Date();
    eveningEnd.setHours(20, 30, 0, 0);
    
    // Generate random AM time within morning window
    let amTime: Date | null = null;
    const morningWindowMs = morningEnd.getTime() - morningStart.getTime(); // 1 hour in milliseconds
    const randomMorningOffset = Math.floor(Math.random() * morningWindowMs);
    const generatedMorningTime = new Date(morningStart.getTime() + randomMorningOffset);
    
    console.log('🔔 RANDOM NOTIF - Generated morning time:', generatedMorningTime.toLocaleString());
    
    // Check if morning time has passed or is too soon (less than 5 minutes from now)
    const fiveMinutesFromNow = new Date(now.getTime() + 5 * 60 * 1000);
    
    if (generatedMorningTime <= fiveMinutesFromNow) {
      // Schedule for tomorrow's morning window
      const tomorrowMorning = new Date(generatedMorningTime);
      tomorrowMorning.setDate(tomorrowMorning.getDate() + 1);
      amTime = tomorrowMorning;
      console.log('🔔 RANDOM NOTIF - Morning time passed/too soon, scheduled for tomorrow:', amTime.toLocaleString());
    } else {
      amTime = generatedMorningTime;
      console.log('🔔 RANDOM NOTIF - Morning time scheduled for today:', amTime.toLocaleString());
    }
    
    // Generate random PM time within evening window
    let pmTime: Date | null = null;
    const eveningWindowMs = eveningEnd.getTime() - eveningStart.getTime(); // 1 hour in milliseconds
    const randomEveningOffset = Math.floor(Math.random() * eveningWindowMs);
    const generatedEveningTime = new Date(eveningStart.getTime() + randomEveningOffset);
    
    console.log('🔔 RANDOM NOTIF - Generated evening time:', generatedEveningTime.toLocaleString());
    
    // Check if evening time has passed or is too soon
    if (generatedEveningTime <= fiveMinutesFromNow) {
      // Schedule for tomorrow's evening window
      const tomorrowEvening = new Date(generatedEveningTime);
      tomorrowEvening.setDate(tomorrowEvening.getDate() + 1);
      pmTime = tomorrowEvening;
      console.log('🔔 RANDOM NOTIF - Evening time passed/too soon, scheduled for tomorrow:', pmTime.toLocaleString());
    } else {
      pmTime = generatedEveningTime;
      console.log('🔔 RANDOM NOTIF - Evening time scheduled for today:', pmTime.toLocaleString());
    }
    
    console.log('🔔 RANDOM NOTIF - Final schedule:');
    console.log('  AM:', amTime?.toLocaleString() || 'null');
    console.log('  PM:', pmTime?.toLocaleString() || 'null');
    
    return { amTime, pmTime };
  }

  async scheduleRandomAppNotification() {
    try {
      if (TEST_SCHEDULER_ONLY || !NUDGES_ENABLED) {
        console.log('Nudges & auto-schedulers disabled for test build');
        return null;
      }

      if (!this.isInitialized) {
        const initialized = await this.init();
        if (!initialized) {
          console.warn('Cannot schedule random notification - notifications not initialized');
          return null;
        }
      }

      // Cancel any existing random notifications
      await this.cancelAllRandomNotifications();

      // Generate random times within specified windows
      const { amTime, pmTime } = this.generateRandomNotificationTimesForToday();
      const scheduledIds: string[] = [];
      
      // Schedule morning notification (9:30-10:30 AM)
      if (amTime) {
        const amMessage = RANDOM_APP_MESSAGES[Math.floor(Math.random() * RANDOM_APP_MESSAGES.length)];
        console.log('🔔 RANDOM NOTIF - Scheduling morning notification for:', amTime.toLocaleString());
        console.log('🔔 RANDOM NOTIF - Morning message:', amMessage.title);

        try {
          const trigger = { type: 'date', date: amTime } as const;
          const amNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: amMessage.title,
              body: amMessage.body,
              data: {
                type: 'random_app_engagement',
                isScheduled: true,
                slot: 'am',
                scheduledFor: amTime.toISOString(),
              },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.DEFAULT,
            },
            trigger,
          });
          
          scheduledIds.push(amNotificationId);
          console.log(`🔔 RANDOM NOTIF - Scheduled morning notification ${amNotificationId}`);
        } catch (error) {
          console.error('🔔 RANDOM NOTIF - Failed to schedule morning notification:', error);
        }
      }
      
      // Schedule evening notification (7:30-8:30 PM)
      if (pmTime) {
        const pmMessage = RANDOM_APP_MESSAGES[Math.floor(Math.random() * RANDOM_APP_MESSAGES.length)];
        console.log('🔔 RANDOM NOTIF - Scheduling evening notification for:', pmTime.toLocaleString());
        console.log('🔔 RANDOM NOTIF - Evening message:', pmMessage.title);

        try {
          const trigger = { type: 'date', date: pmTime } as const;
          const pmNotificationId = await Notifications.scheduleNotificationAsync({
            content: {
              title: pmMessage.title,
              body: pmMessage.body,
              data: {
                type: 'random_app_engagement',
                isScheduled: true,
                slot: 'pm',
                scheduledFor: pmTime.toISOString(),
              },
              sound: 'default',
              priority: Notifications.AndroidNotificationPriority.DEFAULT,
            },
            trigger,
          });
          
          scheduledIds.push(pmNotificationId);
          console.log(`🔔 RANDOM NOTIF - Scheduled evening notification ${pmNotificationId}`);
        } catch (error) {
          console.error('🔔 RANDOM NOTIF - Failed to schedule evening notification:', error);
        }
      }

      // Store the notification IDs and today's date
      this.randomNotificationIds = scheduledIds;
      await AsyncStorage.setItem('random_notification_ids', JSON.stringify(scheduledIds));
      await AsyncStorage.setItem('random_notifications_date', new Date().toDateString());

      console.log(`🔔 RANDOM NOTIF - Successfully scheduled ${scheduledIds.length} random notifications`);
      return scheduledIds;
    } catch (error) {
      console.error('🔔 RANDOM NOTIF - Failed to schedule random app notifications:', error);
      return null;
    }
  }

  private async cancelAllRandomNotifications() {
    try {
      console.log('🔔 RANDOM NOTIF - Cancelling all random notifications...');
      
      // Cancel using stored IDs
      for (const id of this.randomNotificationIds) {
        await cancelById(id);
        console.log('🔔 RANDOM NOTIF - Cancelled notification:', id);
      }
      
      // Also try to cancel using stored IDs from AsyncStorage
      const storedIds = await AsyncStorage.getItem('random_notification_ids');
      if (storedIds) {
        const ids = JSON.parse(storedIds);
        for (const id of ids) {
          await cancelById(id);
          console.log('🔔 RANDOM NOTIF - Cancelled stored notification:', id);
        }
      }
      
      // Additionally, cancel all notifications with random_app_engagement type
      const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
      for (const notification of allScheduled) {
        if (notification.content.data?.type === 'random_app_engagement') {
          await cancelById(notification.identifier);
          console.log('🔔 RANDOM NOTIF - Cancelled random engagement notification:', notification.identifier);
        }
      }
      
      // Clear stored data
      this.randomNotificationIds = [];
      await AsyncStorage.removeItem('random_notification_ids');
      await AsyncStorage.removeItem('random_notifications_date');
      
      console.log('🔔 RANDOM NOTIF - All random notifications cancelled and storage cleared');
    } catch (error) {
      console.error('🔔 RANDOM NOTIF - Failed to cancel random notifications:', error);
    }
  }

  async scheduleScheduledTextNotification(scheduledText: {
    id: number;
    phoneNumber: string;
    message: string;
    scheduledFor: Date;
    profileName?: string;
  }) {
    try {
      if (TEST_SCHEDULER_ONLY) {
        console.log('Scheduled text notifications disabled for test build');
        return null;
      }

      // Use the new Scheduler service
      const result = await scheduleScheduledText({
        messageId: scheduledText.id.toString(),
        phoneNumber: scheduledText.phoneNumber,
        message: scheduledText.message,
        datePick: scheduledText.scheduledFor,
        timePick: scheduledText.scheduledFor,
      });
      
      return result.id;
    } catch (error) {
      console.error('Failed to schedule text notification:', error);
      throw error;
    }
  }

  async restoreRandomNotificationIds() {
    try {
      const storedIds = await AsyncStorage.getItem('random_notification_ids');
      if (storedIds) {
        this.randomNotificationIds = JSON.parse(storedIds);
        console.log('Restored random notification IDs:', this.randomNotificationIds);
      }
    } catch (error) {
      console.error('Failed to restore random notification IDs:', error);
    }
  }

  async startRandomAppNotifications() {
    try {
      if (TEST_SCHEDULER_ONLY || !NUDGES_ENABLED) {
        console.log('Nudges & auto-schedulers disabled for test build');
        return;
      }

      console.log('🔔 RANDOM NOTIF - Starting random app notifications...');
      
      // Check if we've already scheduled notifications for today
      const lastScheduledDate = await AsyncStorage.getItem('random_notifications_date');
      const today = new Date().toDateString();
      
      if (lastScheduledDate === today) {
        console.log('🔔 RANDOM NOTIF - Random notifications already scheduled for today');
        
        // Verify the notifications are still scheduled
        const storedIds = await AsyncStorage.getItem('random_notification_ids');
        if (storedIds) {
          const ids = JSON.parse(storedIds);
          const allScheduled = await Notifications.getAllScheduledNotificationsAsync();
          const stillScheduled = ids.filter(id => 
            allScheduled.some(notif => notif.identifier === id)
          );
          
          if (stillScheduled.length === ids.length) {
            console.log('🔔 RANDOM NOTIF - All notifications still scheduled, no action needed');
            return;
          } else {
            console.log('🔔 RANDOM NOTIF - Some notifications missing, rescheduling...');
          }
        }
        return;
      }
      
      // Schedule new notifications for today
      await this.scheduleRandomAppNotification();
    } catch (error) {
      console.error('🔔 RANDOM NOTIF - Failed to start random app notifications:', error);
    }
  }

  async stopRandomAppNotifications() {
    try {
      console.log('🔔 RANDOM NOTIF - Stopping random app notifications...');
      await this.cancelAllRandomNotifications();
      console.log('🔔 RANDOM NOTIF - Random app notifications stopped');
    } catch (error) {
      console.error('🔔 RANDOM NOTIF - Failed to stop random app notifications:', error);
    }
  }

  async scheduleReminderNotification(reminder: {
    id: number;
    title: string;
    description?: string;
    scheduledFor: Date;
    profileName?: string;
  }) {
    try {
      if (TEST_SCHEDULER_ONLY) {
        console.log('Reminder notifications disabled for test build');
        return null;
      }


      // Use the new Scheduler service
      const result = await scheduleReminder({
        title: reminder.title,
        body: reminder.description || (reminder.profileName ? `Reminder about ${reminder.profileName}` : 'You have a reminder'),
        datePick: reminder.scheduledFor,
        timePick: reminder.scheduledFor,
        reminderId: reminder.id.toString(),
      });
      
      return result.id;
    } catch (error) {
      console.error('Failed to schedule notification:', error);
      throw error;
    }
  }

  async cancelNotification(notificationId: string) {
    try {
      await cancelById(notificationId);
      console.log('🔔 NOTIF - Cancelled notification:', notificationId);
    } catch (error) {
      console.error('🔔 NOTIF - Failed to cancel notification:', notificationId, error);
    }
  }

  async cancelAllNotifications() {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('🔔 NOTIF - Cancelled all scheduled notifications');
    } catch (error) {
      console.error('🔔 NOTIF - Failed to cancel all notifications:', error);
    }
  }

  async getScheduledNotifications() {
    try {
      return await Notifications.getAllScheduledNotificationsAsync();
    } catch (error) {
      console.error('🔔 NOTIF - Failed to get scheduled notifications:', error);
      return [];
    }
  }

  // Handle notification responses (when user taps on notification)
  addNotificationResponseListener(callback: (response: Notifications.NotificationResponse) => void) {
    return Notifications.addNotificationResponseReceivedListener(callback);
  }

  // Handle notifications received while app is in foreground
  addNotificationReceivedListener(callback: (notification: Notifications.Notification) => void) {
    return Notifications.addNotificationReceivedListener(callback);
  }
}

const NotificationService = new NotificationServiceClass();
export default NotificationService;