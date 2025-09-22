import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Clock, Check, User, Trash2, Calendar, Bell } from 'lucide-react-native';
import { CreditCard as Edit } from 'lucide-react-native';
import { format, parseISO, isPast, isToday, isTomorrow, isThisWeek, formatDistanceToNow } from 'date-fns';
import { DatabaseService } from '@/services/DatabaseService';
import { cancelById, scheduleReminder } from '@/services/Scheduler';

interface Reminder {
  id: number;
  title: string;
  description?: string;
  type: string;
  scheduledFor: string;
  completed: boolean;
  notificationId?: string;
  profileName?: string;
  profilePhoto?: string;
}

interface ReminderCardProps {
  reminder: Reminder;
  onComplete: (id: number) => void;
  onSnooze: (id: number, newDate: string) => void;
  onDelete: (id: number) => void;
  onEdit: (reminder: Reminder) => void;
  theme: any;
}

export function ReminderCard({ reminder, onComplete, onSnooze, onDelete, onEdit, theme }: ReminderCardProps) {
  const translateX = new Animated.Value(0);
  const [isSwipeActive, setIsSwipeActive] = React.useState(false);

  const formatReminderDateTime = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    
    if (isPast(date) && !reminder.completed) {
      const timeAgo = formatDistanceToNow(date, { addSuffix: true });
      return { 
        primary: 'Overdue',
        secondary: timeAgo,
        color: '#DC2626',
        urgency: 'high'
      };
    }
    
    if (isToday(date)) {
      const timeStr = format(date, 'h:mm a');
      return { 
        primary: 'Today',
        secondary: timeStr,
        color: '#EF4444',
        urgency: 'high'
      };
    }
    
    if (isTomorrow(date)) {
      const timeStr = format(date, 'h:mm a');
      return { 
        primary: 'Tomorrow',
        secondary: timeStr,
        color: '#F59E0B',
        urgency: 'medium'
      };
    }
    
    if (isThisWeek(date)) {
      const dayStr = format(date, 'EEEE');
      const timeStr = format(date, 'h:mm a');
      return { 
        primary: dayStr,
        secondary: timeStr,
        color: '#3B82F6',
        urgency: 'low'
      };
    }
    
    const dateStr = format(date, 'MMM d');
    const timeStr = format(date, 'h:mm a');
    return { 
      primary: dateStr,
      secondary: timeStr,
      color: '#6B7280',
      urgency: 'low'
    };
  };

  const getTypeInfo = (type: string) => {
    switch (type) {
      case 'general':
        return { icon: Bell, color: '#3B82F6', label: 'General' };
      case 'health':
        return { icon: Clock, color: '#EF4444', label: 'Health' };
      case 'celebration':
        return { icon: Clock, color: '#F59E0B', label: 'Celebration' };
      case 'career':
        return { icon: Clock, color: '#059669', label: 'Career' };
      case 'life_event':
        return { icon: Clock, color: '#8B5CF6', label: 'Life Event' };
      default:
        return { icon: Clock, color: '#6B7280', label: 'Reminder' };
    }
  };

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { 
      useNativeDriver: true,
      listener: (event: any) => {
        const { translationX: tx } = event.nativeEvent;
        if (tx > 0) {
          translateX.setValue(0);
        }
      }
    }
  );

  const onHandlerStateChange = (event: any) => {
    const { state, translationX } = event.nativeEvent;
    
    if (state === State.END || state === State.CANCELLED) {
      if (translationX < -50) {
        setIsSwipeActive(true);
        Animated.timing(translateX, {
          toValue: -80,
          duration: 200,
          useNativeDriver: true,
        }).start();
      } else {
        setIsSwipeActive(false);
        Animated.timing(translateX, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }).start();
      }
    } else if (state === State.ACTIVE && translationX < -50) {
      if (!isSwipeActive) {
        setIsSwipeActive(true);
      }
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Reminder',
      `Are you sure you want to delete "${reminder.title}"? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            setIsSwipeActive(false);
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: () => {
            onDelete(reminder.id);
            setIsSwipeActive(false);
            Animated.timing(translateX, {
              toValue: 0,
              duration: 200,
              useNativeDriver: true,
            }).start();
          }
        }
      ]
    );
  };

  const handleComplete = async () => {
    try {
      // Cancel the notification first if it exists
      if (reminder.notificationId) {
        await cancelById(reminder.notificationId);
      }
      
      // Then complete the reminder in the database
      await DatabaseService.completeReminder(reminder.id);
      onComplete(reminder.id);
    } catch (error) {
      console.error('Error completing reminder:', error);
    }
  };

  const handleSnooze = async (newDate: string) => {
    try {
      // Cancel the existing notification first
      if (reminder.notificationId) {
        await cancelById(reminder.notificationId);
      }
      
      // Update the reminder in the database with new date
      await DatabaseService.snoozeReminder(reminder.id, newDate);
      
      // Get the updated reminder and schedule a new notification
      const updatedReminder = await DatabaseService.getReminderById(reminder.id);
      if (updatedReminder) {
        const newScheduledDate = new Date(newDate);
        const result = await scheduleReminder({
          title: updatedReminder.title,
          body: updatedReminder.description || (updatedReminder.profileName ? `Reminder about ${updatedReminder.profileName}` : 'You have a reminder'),
          datePick: newScheduledDate,
          timePick: newScheduledDate,
          reminderId: updatedReminder.id.toString(),
        });
        
        // Update the reminder with the new notification ID
        if (result.id) {
          await DatabaseService.updateReminderNotificationId(reminder.id, result.id);
        }
      }
      
      onSnooze(reminder.id, newDate);
    } catch (error) {
      console.error('Error snoozing reminder:', error);
    }
  };

  const dateTimeInfo = formatReminderDateTime(reminder.scheduledFor);
  const typeInfo = getTypeInfo(reminder.type);
  const TypeIcon = typeInfo.icon;

  return (
    <View style={styles.swipeContainer}>
      {isSwipeActive && (
        <View style={[styles.deleteButtonContainer, { backgroundColor: '#EF4444' }]}>
          <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
            <Trash2 size={24} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      )}
      
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
        activeOffsetX={[-15, 15]}
        failOffsetY={[-10, 10]}
        shouldCancelWhenOutside={false}
        enableTrackpadTwoFingerGesture={false}
      >
        <Animated.View
          style={[
            styles.cardContainer,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <View style={[
            styles.container,
            { backgroundColor: theme.cardBackground },
            reminder.completed && { opacity: 0.6 }
          ]}>
            {/* Header with profile and urgency indicator */}
            <View style={styles.header}>
              <View style={styles.leftSection}>
                {reminder.profilePhoto ? (
                  <Image source={{ uri: reminder.profilePhoto }} style={styles.profileAvatar} />
                ) : (
                  <View style={[styles.profileAvatarPlaceholder, { backgroundColor: theme.accent }]}>
                    <User size={18} color={theme.primary} />
                  </View>
                )}
                
                <View style={styles.reminderInfo}>
                  <Text style={[
                    styles.title,
                    { color: theme.text },
                    reminder.completed && { textDecorationLine: 'line-through', color: theme.primary }
                  ]} numberOfLines={1}>
                    {reminder.title ? String(reminder.title) : 'Untitled Reminder'}
                  </Text>
                  
                  {reminder.profileName && (
                    <Text style={[styles.profileName, { color: theme.primary }]} numberOfLines={1}>
                      for {String(reminder.profileName)}
                    </Text>
                  )}
                </View>
              </View>

              {/* Urgency indicator */}
              <View style={[
                styles.urgencyIndicator,
                { backgroundColor: dateTimeInfo.color }
              ]}>
                <View style={[styles.urgencyDot, { backgroundColor: '#FFFFFF' }]} />
              </View>
            </View>

            {/* Description */}
            {reminder.description && (
              <Text style={[
                styles.description,
                { color: theme.text },
                reminder.completed && { color: theme.primary }
              ]} numberOfLines={2}>
                {String(reminder.description)}
              </Text>
            )}

            <View style={styles.infoRow}>
              <View style={styles.dateTimeSection}>
                <View style={styles.dateTimeHeader}>
                  <Calendar size={16} color={dateTimeInfo.color} />
                  <Text style={[styles.dateTimePrimary, { color: dateTimeInfo.color }]}>
                    {String(dateTimeInfo.primary || 'No Date')}
                  </Text>
                </View>
                <Text style={[styles.dateTimeSecondary, { color: theme.primary }]}>
                  {String(dateTimeInfo.secondary || '')}
                </Text>
              </View>

              <View style={[styles.typeBadge, { backgroundColor: typeInfo.color }]}>
                <TypeIcon size={14} color="#FFFFFF" />
                <Text style={styles.typeText}>{String(typeInfo.label || 'Reminder')}</Text>
              </View>
            </View>

            {/* Action Buttons */}
            {!reminder.completed && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
                  onPress={() => onEdit(reminder)}
                >
                  <Edit size={16} color={theme.text} />
                  <Text style={[styles.editButtonText, { color: theme.text }]}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.snoozeButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
                  onPress={() => {
                    const tomorrow = new Date();
                    tomorrow.setDate(tomorrow.getDate() + 1);
                    tomorrow.setHours(9, 0, 0, 0); // 9 AM tomorrow
                    handleSnooze(tomorrow.toISOString());
                  }}
                >
                  <Clock size={16} color={theme.text} />
                  <Text style={[styles.snoozeButtonText, { color: theme.text }]}>Snooze</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.completeButton, { backgroundColor: '#059669' }]}
                  onPress={handleComplete}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.completeButtonText}>Complete</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Completed indicator */}
            {reminder.completed && (
              <View style={styles.completedIndicator}>
                <Check size={16} color="#059669" />
                <Text style={[styles.completedText, { color: theme.primary }]}>
                  Completed
                </Text>
              </View>
            )}
          </View>
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
}

const styles = StyleSheet.create({
  swipeContainer: {
    position: 'relative',
  },
  deleteButtonContainer: {
    position: 'absolute',
    right: 20,
    top: 0,
    bottom: 12,
    width: 80,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 12,
  },
  deleteButton: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cardContainer: {
    backgroundColor: 'transparent',
  },
  container: {
    marginHorizontal: 20,
    marginBottom: 12,
    borderRadius: 16,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profileAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
  },
  profileAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  reminderInfo: {
    flex: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  profileName: {
    fontSize: 14,
    fontWeight: '500',
  },
  urgencyIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  urgencyDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  dateTimeSection: {
    flex: 1,
  },
  dateTimeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  dateTimePrimary: {
    fontSize: 16,
    fontWeight: '700',
    marginLeft: 6,
  },
  dateTimeSecondary: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 22,
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 12,
  },
  typeText: {
    fontSize: 12,
    fontWeight: '600',
    marginLeft: 4,
    color: '#FFFFFF',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
  },
  editButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  editButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  snoozeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
  },
  snoozeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  completeButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  completeButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  completedIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  completedText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});