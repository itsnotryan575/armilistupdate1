console.log("🔥 THIS _layout.tsx WAS LOADED 🔥");
import Constants from 'expo-constants';
// @ts-ignore
import notifPkg from 'expo-notifications/package.json';
console.log('SDK:', Constants.expoVersion,
            'expo-notifications JS:', notifPkg?.version,
            'native build:', Constants.nativeBuildVersion);

import { useFrameworkReady } from '@/hooks/useFrameworkReady';
import { useEffect, useState, useRef } from 'react';
import { Stack } from 'expo-router';
import { View, Text, StyleSheet, Image, useColorScheme, Animated } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as Notifications from 'expo-notifications';
import NotificationService from '@/services/NotificationService';
import { DatabaseService } from '@/services/DatabaseService';
import { router } from 'expo-router';
import { ThemeProvider } from '@/context/ThemeContext';
import { AuthProvider } from '@/context/AuthContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { TEST_SCHEDULER_ONLY, NUDGES_ENABLED } from '@/flags';
import { registerNotificationCategories, ACTION_EDIT, ACTION_SEND, SCHEDULED_TEXT_CATEGORY } from '@/services/NotificationActions';
import * as SMS from 'expo-sms';

// Configure notification handler app-wide
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

// Custom hook to handle scheduled text notification responses
function useScheduledTextNotificationResponses() {
  const lastHandled = useRef<string | null>(null);

  useEffect(() => {
    // Handle cold-start tap
    const checkLastResponse = async () => {
      const pending = await Notifications.getLastNotificationResponseAsync();
      if (pending) {
        await handleResponse(pending);
      }
    };
    
    checkLastResponse();

    const sub = Notifications.addNotificationResponseReceivedListener(handleResponse);
    return () => sub.remove();
  }, []);

  async function handleResponse(resp: Notifications.NotificationResponse) {
    const { actionIdentifier, notification } = resp;
    const req = notification.request;
    const id = req.identifier;

    // De-dupe (iOS can deliver same response twice on cold start)
    if (lastHandled.current === id) return;
    lastHandled.current = id;

    const { categoryIdentifier, data } = req.content as any;
    if (categoryIdentifier !== SCHEDULED_TEXT_CATEGORY) return; // only handle scheduled-text notifications
    if (data?.type !== 'scheduled_text' && data?.type !== 'birthday_text') return;

    const textId = String(data.textId ?? '');
    const phone = String(data.phoneNumber ?? '');
    const body = String(data.message ?? '');
    const profileId = data.profileId ? String(data.profileId) : null;

    try {
      if (actionIdentifier === ACTION_EDIT) {
        // Long-press "Edit"
        console.log('📱 Edit scheduled text action tapped for textId:', textId);
        router.push({
          pathname: '/(tabs)/scheduler',
          params: { textId: textId, action: 'edit' }
        });
        return;
      }

      if (actionIdentifier === Notifications.DEFAULT_ACTION_IDENTIFIER) {
        // Body tap → open Messages prefilled (cannot auto-send by design)
        console.log(`📱 ${data.type === 'birthday_text' ? 'Birthday' : 'Scheduled'} text notification tapped:`, {
          textId,
          phoneNumber: phone,
          message: body?.substring(0, 50) + (body?.length > 50 ? '...' : '')
        });
        
        try {
          const available = await SMS.isAvailableAsync();
          if (!available) {
            // Fallback: open our editor if SMS isn't available on the device
            router.push({
              pathname: '/(tabs)/scheduler',
              params: { textId: textId, action: 'edit' }
            });
            return;
          }
          
          // Open device SMS app with pre-filled data
          await SMS.sendSMSAsync([phone], body);
          
          // Mark the scheduled text as sent
          await DatabaseService.markScheduledTextAsSent(parseInt(textId));
          
          // If this is a birthday text, untoggle the profile's birthday text feature
          if (data.type === 'birthday_text' && profileId) {
            await DatabaseService.updateProfileBirthdayTextStatus(parseInt(profileId), false, null);
            console.log('📱 Untoggled birthday text for profile:', profileId);
          }
          
          console.log(`📱 Marked ${data.type === 'birthday_text' ? 'birthday' : 'scheduled'} text as sent:`, textId);
        } catch (smsError) {
          console.error('Failed to open SMS:', smsError);
          // Fallback to editor if SMS fails
          router.push({
            pathname: '/(tabs)/scheduler',
            params: { textId: textId, action: 'edit' }
          });
        }
        return;
      }

      // Unknown action → open editor as safe fallback
      router.push({
        pathname: '/(tabs)/scheduler',
        params: { textId: textId, action: 'edit' }
      });
    } catch (e) {
      console.warn('Scheduled text notification action handling failed:', e);
      router.push({
        pathname: '/(tabs)/scheduler',
        params: { textId: textId, action: 'edit' }
      });
    }
  }
}

export default function RootLayout() {
  const { isReady: isFrameworkReady, error } = useFrameworkReady();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';

  const gifSource = isDark
    ? require('../assets/gifs/darkloading.gif')
    : require('../assets/gifs/lightloading.gif');

  const [gifLoaded, setGifLoaded] = useState(false);
  const [forceDelay, setForceDelay] = useState(true);

  const fadeAnim = useRef(new Animated.Value(0)).current;
  const lastHandled = useRef<string | null>(null);

  // Use the scheduled text notification responses hook
  useScheduledTextNotificationResponses();

  // 👇 Start 2.16-second timer AFTER GIF fully loads
  useEffect(() => {
    if (gifLoaded) {
      const timer = setTimeout(() => {
        setForceDelay(false);
      }, 2160);
      return () => clearTimeout(timer);
    }
  }, [gifLoaded]);

  useEffect(() => {
    if (isFrameworkReady && !forceDelay) {
      // Register notification categories for action buttons
      registerNotificationCategories();
      
      NotificationService.init();
      
      // Initialize random notifications if enabled
      const initRandomNotifications = async () => {
        try {
          if (TEST_SCHEDULER_ONLY || !NUDGES_ENABLED) {
            console.log('Nudges & auto-schedulers disabled for test build');
            return;
          }

          const randomEnabled = await AsyncStorage.getItem('notifications_random_enabled');
          if (randomEnabled === 'true') {
            await NotificationService.restoreRandomNotificationIds();
            await NotificationService.startRandomAppNotifications();
          }
        } catch (error) {
          console.error('Error initializing random notifications:', error);
        }
      };
      
      initRandomNotifications();

      const responseSubscription = NotificationService.addNotificationResponseListener(
        async (response) => {
          // Skip scheduled text notifications - they're handled by useScheduledTextNotificationResponses
          const { categoryIdentifier, data } = response.notification.request.content as any;
          if (categoryIdentifier === SCHEDULED_TEXT_CATEGORY || data?.type === 'scheduled_text') {
            return; // Let the dedicated hook handle these
          }
          
          if (TEST_SCHEDULER_ONLY || !NUDGES_ENABLED) {
            console.log('Nudges & auto notification paths disabled for test build');
            return;
          }
          
          const { reminderId, type } = response.notification.request.content.data;
          
          if (type === 'random_app_engagement') {
            // User tapped on a random app engagement notification
            console.log('Random app engagement notification tapped');
            // Navigate to main app
            router.push('/(tabs)');
          } else if (reminderId) {
            // Handle reminder notifications (including gift reminders)
            const reminderData = response.notification.request.content.data;
            
            // Check if this is a gift reminder
            if (reminderData.giftReminder) {
              // Mark reminder as completed and untoggle gift reminder for the profile
              try {
                await DatabaseService.completeReminder(parseInt(reminderId));
                if (reminderData.profileId) {
                  await DatabaseService.updateProfileGiftReminderStatus(parseInt(reminderData.profileId), false, null);
                }
              } catch (error) {
                console.error('Error handling gift reminder completion:', error);
              }
            }
            
            router.push('/(tabs)/reminders');
          }
        }
      );

      const receivedSubscription = NotificationService.addNotificationReceivedListener(
        async (notification) => {
          console.log('Notification received while app is open:', notification);
          
          const { type } = notification.request.content.data;
          if (type === 'random_app_engagement') {
            // Random app engagement notification received while app is open
            console.log('Random app engagement notification received while app is open');
          }
        }
      );
      
      // Background cleanup for birthday texts
      const cleanupBirthdayTexts = async () => {
        try {
          const profilesWithBirthdayText = await DatabaseService.getAllProfilesWithBirthdayTextEnabled();
          const now = new Date();
          
          for (const profile of profilesWithBirthdayText) {
            if (profile.scheduledFor && profile.scheduledTextId) {
              const scheduledDate = new Date(profile.scheduledFor);
              
              // If the scheduled date has passed and text hasn't been sent
              if (scheduledDate <= now && !profile.sent) {
                console.log('🧹 Cleaning up missed birthday text for profile:', profile.id);
                
                // Mark as sent and untoggle
                await DatabaseService.markScheduledTextAsSent(profile.scheduledTextId);
                await DatabaseService.updateProfileBirthdayTextStatus(profile.id, false, null);
                
                // Cancel any pending notification as safeguard
                if (profile.notificationId) {
                  await cancelById(profile.notificationId);
                }
              }
            }
          }
        } catch (error) {
          console.error('Error during birthday text cleanup:', error);
        }
      };
      
      // Run cleanup on app start
      cleanupBirthdayTexts();

      return () => {
        responseSubscription.remove();
        receivedSubscription.remove();
      };
    }
  }, [isFrameworkReady, forceDelay]);

  if (forceDelay || !isFrameworkReady) {
    return (
      <Animated.View style={[styles.loadingContainer, { opacity: fadeAnim }]}>
        {!error ? (
          <Image
            source={gifSource}
            style={styles.gif}
            resizeMode="cover"
            onLoadEnd={() => {
              console.log("✅ GIF fully loaded");
              setGifLoaded(true);

              // 👉 Fade in AFTER gif is fully loaded
              Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 300,
                useNativeDriver: true,
            }).start();
          }}
          />
        ) : (
          <>
            <Text style={styles.loadingText}>
              {error ? error : 'Loading ARMi...'}
            </Text>
            <Text style={styles.errorSubtext}>
              Try refreshing the page or use the mobile app for the best experience.
            </Text>
          </>
        )}
      </Animated.View>
    );
  }

  return (
    <ThemeProvider>
      <AuthProvider>
        <GestureHandlerRootView style={{ flex: 1 }}>
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="MiniNotifSmoke" options={{ headerShown: false }} />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen name="(share)/ShareScreen" options={{ headerShown: false }} />
            <Stack.Screen name="auth/sign-in" options={{ headerShown: false }} />
            <Stack.Screen name="auth/sign-up" options={{ headerShown: false }} />
            <Stack.Screen name="auth/verify-email" options={{ headerShown: false }} />
            <Stack.Screen name="auth/forgot-password" options={{ headerShown: false }} />
            <Stack.Screen name="profile/create" options={{ headerShown: false }} />
            <Stack.Screen name="profile/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="profile/edit/[id]" options={{ headerShown: false }} />
            <Stack.Screen name="settings/appearance" options={{ headerShown: false }} />
            <Stack.Screen name="settings/profile" options={{ headerShown: false }} />
            <Stack.Screen name="+not-found" />
          </Stack>
        </GestureHandlerRootView>
      </AuthProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'black',
  },
  loadingText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#f0f0f0',
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  errorSubtext: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
    marginTop: 10,
    paddingHorizontal: 20,
  },
  gif: {
    width: '100%',
    height: '100%',
  },
});