import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Switch, Alert } from 'react-native';
import { ArrowLeft, Bell, Clock, Users, MessageSquareText } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import AsyncStorage from '@react-native-async-storage/async-storage';
import NotificationService from '@/services/NotificationService';
import * as Notifications from 'expo-notifications';
import { DatabaseService } from '@/services/DatabaseService';
import { scheduleScheduledText, cancelById } from '@/services/Scheduler';

export default function NotificationsSettings() {
  const router = useRouter();
  const { isDark } = useTheme();
  
  const [remindersEnabled, setRemindersEnabled] = useState(true);
  const [randomNotificationsEnabled, setRandomNotificationsEnabled] = useState(false);
  const [scheduledTextNotificationsEnabled, setScheduledTextNotificationsEnabled] = useState(false);
  const [loading, setLoading] = useState(true);

  const theme = {
    text: '#f0f0f0',
    background: isDark ? '#0B0909' : '#003C24',
    primary: isDark ? '#8C8C8C' : '#f0f0f0',
    secondary: isDark ? '#4A5568' : '#012d1c',
    accent: isDark ? '#44444C' : '#002818',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    border: isDark ? '#333333' : '#012d1c',
    isDark,
  };

  useEffect(() => {
    loadNotificationSettings();
  }, []);

  const loadNotificationSettings = async () => {
    try {
      const saved = await AsyncStorage.getItem('notifications_reminders_enabled');
      if (saved !== null) {
        setRemindersEnabled(JSON.parse(saved));
      }
      
      const randomSaved = await AsyncStorage.getItem('notifications_random_enabled');
      if (randomSaved !== null) {
        setRandomNotificationsEnabled(JSON.parse(randomSaved));
      }
      
      const scheduledTextSaved = await AsyncStorage.getItem('notifications_scheduled_texts_enabled');
      if (scheduledTextSaved !== null) {
        setScheduledTextNotificationsEnabled(JSON.parse(scheduledTextSaved));
      }
    } catch (error) {
      console.error('Error loading notification settings:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemindersToggle = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('notifications_reminders_enabled', JSON.stringify(value));
      setRemindersEnabled(value);
      
      if (!value) {
        // If disabling reminders, cancel all scheduled notifications
        await NotificationService.cancelAllNotifications();
        Alert.alert(
          'Reminders Disabled',
          'All scheduled reminder notifications have been cancelled. You can re-enable them anytime.',
          [{ text: 'OK' }]
        );
      } else {
        // If enabling reminders, initialize notification service
        const initialized = await NotificationService.init();
        if (!initialized) {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive reminders.',
            [{ text: 'OK' }]
          );
          setRemindersEnabled(false);
          await AsyncStorage.setItem('notifications_reminders_enabled', JSON.stringify(false));
        } else {
          Alert.alert(
            'Reminders Enabled',
            'You will now receive notifications for your scheduled reminders.',
            [{ text: 'OK' }]
          );
        }
      }
    } catch (error) {
      console.error('Error updating reminder settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleRandomNotificationsToggle = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('notifications_random_enabled', JSON.stringify(value));
      setRandomNotificationsEnabled(value);
      
      if (value) {
        // If enabling random notifications, check current permission status
        const { status } = await Notifications.getPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive notifications from ARMi.',
            [{ text: 'OK' }]
          );
          setRandomNotificationsEnabled(false);
          await AsyncStorage.setItem('notifications_random_enabled', JSON.stringify(false));
        } else {
          // Permissions are already granted, initialize and start
          await NotificationService.init();
          await NotificationService.startRandomAppNotifications();
          Alert.alert(
            'Push Notifications Enabled',
            'You will now receive occasional notifications from ARMi to help you stay connected.',
            [{ text: 'OK' }]
          );
        }
      } else {
        // If disabling random notifications, stop them
        await NotificationService.stopRandomAppNotifications();
        Alert.alert(
          'Push Notifications Disabled',
          'You will no longer receive occasional notifications from ARMi.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Error updating random notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const handleScheduledTextNotificationsToggle = async (value: boolean) => {
    try {
      await AsyncStorage.setItem('notifications_scheduled_texts_enabled', JSON.stringify(value));
      setScheduledTextNotificationsEnabled(value);
      
      if (value) {
        // If enabling scheduled text notifications, check current permission status
        const { status } = await Notifications.getPermissionsAsync();
        
        if (status !== 'granted') {
          Alert.alert(
            'Permission Required',
            'Please enable notifications in your device settings to receive scheduled text reminders.',
            [{ text: 'OK' }]
          );
          setScheduledTextNotificationsEnabled(false);
          await AsyncStorage.setItem('notifications_scheduled_texts_enabled', JSON.stringify(false));
        } else {
          // Permissions are granted, schedule notifications for all unsent scheduled texts
          await NotificationService.init();
          
          try {
            const allScheduledTexts = await DatabaseService.getAllScheduledTexts();
            const unsentTexts = allScheduledTexts.filter(text => !text.sent);
            
            let scheduledCount = 0;
            for (const text of unsentTexts) {
              try {
                // Parse the scheduled date and create proper Date object
                const scheduledDate = new Date(text.scheduledFor);
                
                // Only schedule if the date is in the future
                if (scheduledDate > new Date()) {
                  const result = await scheduleScheduledText({
                    messageId: text.id.toString(),
                    phoneNumber: text.phoneNumber,
                    message: text.message,
                    datePick: scheduledDate,
                    timePick: scheduledDate,
                  });
                  
                  // Update the notification ID in the database
                  if (result.id) {
                    await DatabaseService.updateScheduledTextNotificationId(text.id, result.id);
                    scheduledCount++;
                  }
                }
              } catch (textError) {
                console.error('Failed to schedule notification for text:', text.id, textError);
              }
            }
            
            Alert.alert(
              'Scheduled Text Notifications Enabled',
              `You will now receive notifications for your scheduled texts. ${scheduledCount} notifications have been set up.`,
              [{ text: 'OK' }]
            );
          } catch (error) {
            console.error('Error scheduling text notifications:', error);
            Alert.alert('Error', 'Failed to set up scheduled text notifications');
          }
        }
      } else {
        // If disabling scheduled text notifications, cancel all scheduled text notifications
        try {
          const allScheduledTexts = await DatabaseService.getAllScheduledTexts();
          const unsentTexts = allScheduledTexts.filter(text => !text.sent);
          
          let cancelledCount = 0;
          for (const text of unsentTexts) {
            if (text.notificationId) {
              await cancelById(text.notificationId);
              await DatabaseService.updateScheduledTextNotificationId(text.id, null);
              cancelledCount++;
            }
          }
          
          Alert.alert(
            'Scheduled Text Notifications Disabled',
            `You will no longer receive notifications for scheduled texts. ${cancelledCount} notifications have been cancelled.`,
            [{ text: 'OK' }]
          );
        } catch (error) {
          console.error('Error cancelling text notifications:', error);
          Alert.alert('Error', 'Failed to cancel scheduled text notifications');
        }
      }
    } catch (error) {
      console.error('Error updating scheduled text notification settings:', error);
      Alert.alert('Error', 'Failed to update notification settings');
    }
  };

  const notificationOptions = [
    {
      key: 'reminders_manual',
      title: 'Reminders (Manual)',
      subtitle: 'Get notified for reminders you create manually',
      icon: Clock,
      color: '#3B82F6',
      enabled: remindersEnabled,
      onToggle: handleRemindersToggle,
      available: true
    },
    {
      key: 'random_checkins',
      title: 'Push Notifications',
      subtitle: 'Get occasional notifications from ARMi and stay connected',
      icon: Bell,
      color: '#EC4899',
      enabled: randomNotificationsEnabled,
      onToggle: handleRandomNotificationsToggle,
      available: true
    },
    {
      key: 'scheduled_texts',
      title: 'Scheduled Texts',
      subtitle: 'Get notified when it\'s time to send a scheduled text',
      icon: MessageSquareText,
      color: '#8B5CF6',
      enabled: scheduledTextNotificationsEnabled,
      onToggle: handleScheduledTextNotificationsToggle,
      available: true
    },
    {
      key: 'smart_checkins',
      title: 'Smart Check-Ins',
      subtitle: 'Get reminded to reach out when you haven\'t contacted someone in a while',
      icon: Users,
      color: '#059669',
      enabled: false,
      onToggle: null,
      available: false
    }
  ];

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Loading...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Notifications</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Push Notifications</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.primary }]}>
          Manage when and how ARMi sends you notifications
        </Text>

        <View style={styles.optionsContainer}>
          {notificationOptions.map((option, index) => {
            const IconComponent = option.icon;
            
            return (
              <View
                key={option.key}
                style={[
                  styles.notificationOption,
                  { 
                    backgroundColor: theme.cardBackground,
                    borderBottomColor: theme.border 
                  },
                  index === notificationOptions.length - 1 && { borderBottomWidth: 0 }
                ]}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                      <IconComponent size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.optionText}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.optionTitle, { color: theme.text }]}>
                          {option.title}
                        </Text>
                        {!option.available && (
                          <View style={[styles.comingSoonBadge, { backgroundColor: theme.accent }]}>
                            <Text style={[styles.comingSoonText, { color: theme.primary }]}>
                              Coming Soon
                            </Text>
                          </View>
                        )}
                      </View>
                      <Text style={[
                        styles.optionSubtitle, 
                        { color: option.available ? theme.primary : theme.primary }
                      ]}>
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>
                  
                  <Switch
                    value={option.enabled}
                    onValueChange={option.available ? option.onToggle : undefined}
                    disabled={!option.available}
                    trackColor={{ 
                      false: theme.accent, 
                      true: option.color 
                    }}
                    thumbColor={option.enabled ? '#FFFFFF' : '#FFFFFF'}
                    style={[
                      styles.switch,
                      !option.available && { opacity: 0.5 }
                    ]}
                  />
                </View>
              </View>
            );
          })}
        </View>

        <View style={[styles.infoContainer, { backgroundColor: theme.cardBackground }]}>
          <Bell size={20} color={theme.primary} />
          <View style={styles.infoText}>
            <Text style={[styles.infoTitle, { color: theme.text }]}>
              Notification Permissions
            </Text>
            <Text style={[styles.infoSubtitle, { color: theme.primary }]}>
              Make sure notifications are enabled in your device settings to receive reminders from ARMi.
            </Text>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 5,
    paddingBottom: 20,
    borderBottomWidth: 1,
  },
  backButton: {
    padding: 8,
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
    textAlign: 'center',
    marginHorizontal: 20,
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 32,
  },
  optionsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 32,
  },
  notificationOption: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  comingSoonBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
  },
  comingSoonText: {
    fontSize: 11,
    fontWeight: '500',
  },
  optionSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  switch: {
    marginLeft: 16,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 12,
  },
  infoText: {
    flex: 1,
    marginLeft: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
});