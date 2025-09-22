import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, Animated, Alert } from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { MessageSquare, User, Calendar, Clock, Trash2, Phone, Check } from 'lucide-react-native';
import { CreditCard as Edit } from 'lucide-react-native';
import { format, parseISO, isPast, isToday, isTomorrow, isThisWeek, formatDistanceToNow } from 'date-fns';

interface ScheduledText {
  id: number;
  phoneNumber: string;
  message: string;
  scheduledFor: string;
  sent: boolean;
  profileId?: number;
  profileName?: string;
  profilePhoto?: string;
  notificationId?: string;
}

interface ScheduledTextCardProps {
  scheduledText: ScheduledText;
  onEdit: (scheduledText: ScheduledText) => void;
  onDelete: (textId: number) => void;
  onSnooze: (textId: number) => void;
  onMarkAsSent: (textId: number) => void;
  theme: any;
}

export function ScheduledTextCard({ scheduledText, onEdit, onDelete, onSnooze, onMarkAsSent, theme }: ScheduledTextCardProps) {
  const translateX = new Animated.Value(0);
  const [isSwipeActive, setIsSwipeActive] = React.useState(false);

  const formatScheduledDateTime = (dateString: string) => {
    const date = parseISO(dateString);
    const now = new Date();
    
    if (isPast(date) && !scheduledText.sent) {
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
      'Delete Scheduled Text',
      `Are you sure you want to delete this scheduled text? This action cannot be undone.`,
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
            onDelete(scheduledText.id);
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

  const dateTimeInfo = formatScheduledDateTime(scheduledText.scheduledFor);

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
            scheduledText.sent && { opacity: 0.6 }
          ]}>
            {/* Header with profile and urgency indicator */}
            <View style={styles.header}>
              <View style={styles.leftSection}>
                {scheduledText.profilePhoto ? (
                  <Image source={{ uri: scheduledText.profilePhoto }} style={styles.profileAvatar} />
                ) : scheduledText.profileId ? (
                  <View style={[styles.profileAvatarPlaceholder, { backgroundColor: theme.accent }]}>
                    <User size={18} color={theme.primary} />
                  </View>
                ) : (
                  <View style={[styles.profileAvatarPlaceholder, { backgroundColor: theme.accent }]}>
                    <MessageSquare size={18} color={theme.primary} />
                  </View>
                )}
                
                <View style={styles.textInfo}>
                  <Text style={[
                    styles.recipient,
                    { color: theme.text },
                    scheduledText.sent && { textDecorationLine: 'line-through', color: theme.primary }
                  ]} numberOfLines={1}>
                    {String(scheduledText.profileName || 'Unknown Contact')}
                  </Text>
                  
                  <View style={styles.phoneContainer}>
                    <Phone size={14} color={theme.primary} />
                    <Text style={[styles.phoneNumber, { color: theme.primary }]} numberOfLines={1}>
                      {String(scheduledText.phoneNumber)}
                    </Text>
                  </View>
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

            {/* Message Preview */}
            <View style={styles.messageContainer}>
              <Text style={[
                styles.messagePreview,
                { color: theme.text },
                scheduledText.sent && { color: theme.primary }
              ]} numberOfLines={2}>
                "{String(scheduledText.message)}"
              </Text>
            </View>

            {/* Date/Time and Status */}
            <View style={styles.infoRow}>
              <View style={styles.dateTimeSection}>
                <View style={styles.dateTimeHeader}>
                  <Calendar size={16} color={dateTimeInfo.color} />
                  <Text style={[styles.dateTimePrimary, { color: dateTimeInfo.color }]}>
                    {String(dateTimeInfo.primary)}
                  </Text>
                </View>
                <Text style={[styles.dateTimeSecondary, { color: theme.primary }]}>
                  {String(dateTimeInfo.secondary)}
                </Text>
              </View>

              {scheduledText.sent ? (
                <View style={[styles.statusBadge, { backgroundColor: '#059669' }]}>
                  <Text style={styles.statusText}>Sent</Text>
                </View>
              ) : (
                <View style={[styles.statusBadge, { backgroundColor: '#3B82F6' }]}>
                  <Text style={styles.statusText}>Scheduled</Text>
                </View>
              )}
            </View>

            {/* Action Buttons */}
            {!scheduledText.sent && (
              <View style={styles.actionRow}>
                <TouchableOpacity
                  style={[styles.editButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
                  onPress={() => onEdit(scheduledText)}
                >
                  <Edit size={16} color={theme.text} />
                  <Text style={[styles.editButtonText, { color: theme.text }]}>Edit</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.snoozeButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
                  onPress={() => onSnooze(scheduledText.id)}
                >
                  <Clock size={16} color={theme.text} />
                  <Text style={[styles.snoozeButtonText, { color: theme.text }]}>Snooze</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.sentButton, { backgroundColor: '#059669' }]}
                  onPress={() => onMarkAsSent(scheduledText.id)}
                >
                  <Check size={16} color="#FFFFFF" />
                  <Text style={styles.sentButtonText}>Sent</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Sent indicator */}
            {scheduledText.sent && (
              <View style={styles.sentIndicator}>
                <Check size={16} color="#059669" />
                <Text style={[styles.sentText, { color: theme.primary }]}>
                  Sent
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
  textInfo: {
    flex: 1,
  },
  recipient: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 4,
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  phoneNumber: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 4,
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
  messageContainer: {
    marginBottom: 16,
  },
  messagePreview: {
    fontSize: 15,
    lineHeight: 22,
    fontStyle: 'italic',
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
  statusBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  statusText: {
    fontSize: 12,
    fontWeight: '600',
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
  sentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 12,
  },
  sentButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
  sentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  sentText: {
    fontSize: 15,
    fontWeight: '600',
    marginLeft: 6,
  },
});