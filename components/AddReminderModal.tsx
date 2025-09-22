import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Alert,
  Dimensions,
} from 'react-native';
import { X, Calendar, User, Clock, Tag, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { DatabaseService } from '@/services/DatabaseService';
import { scheduleReminder, buildWhenFromComponents } from '@/services/Scheduler';
import { useTheme } from '@/context/ThemeContext';

interface Profile {
  id: number;
  name: string;
  relationship: string;
}

interface AddReminderModalProps {
  visible: boolean;
  onClose: () => void;
  onReminderAdded: () => void;
  theme: any;
}

const REMINDER_TYPES = [
  { key: 'general', label: 'General', color: '#3B82F6' },
  { key: 'health', label: 'Health', color: '#EF4444' },
  { key: 'celebration', label: 'Celebration', color: '#F59E0B' },
  { key: 'career', label: 'Career', color: '#059669' },
  { key: 'life_event', label: 'Life Event', color: '#8B5CF6' },
];

const QUICK_DATES = [
  { label: 'Today', days: 0 },
  { label: 'Tomorrow', days: 1 },
  { label: '1 Week', days: 7 },
  { label: '2 Weeks', days: 14 },
  { label: '1 Month', days: 30 },
];

export function AddReminderModal({ visible, onClose, onReminderAdded, theme }: AddReminderModalProps) {
  const { isDark } = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedType, setSelectedType] = useState('general');
  const [selectedProfile, setSelectedProfile] = useState<number | null>(null);
  const [scheduledDate, setScheduledDate] = useState('');
  const [scheduledTime, setScheduledTime] = useState('01:00');
  const [selectedAmPm, setSelectedAmPm] = useState('AM');
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(false);
  const [showProfilePicker, setShowProfilePicker] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  
  const [calendarDate, setCalendarDate] = useState(new Date());
  
  // Enhanced theme for better light mode visibility
  const modalTheme = {
    ...theme,
    inputText: isDark ? '#f0f0f0' : '#000000',
    inputBackground: isDark ? '#44444C' : '#FFFFFF',
    inputBorder: isDark ? '#333333' : '#CCCCCC',
    placeholderColor: isDark ? '#8C8C8C' : '#666666',
  };
  
  useEffect(() => {
    if (visible) {
      loadProfiles();
      // Set default date to tomorrow at 12:00 PM
      const defaultDate = new Date();
      defaultDate.setDate(defaultDate.getDate() + 1);
      defaultDate.setHours(12, 0, 0, 0);
      // Use local date components to avoid timezone issues
      const year = defaultDate.getFullYear();
      const month = (defaultDate.getMonth() + 1).toString().padStart(2, '0');
      const day = defaultDate.getDate().toString().padStart(2, '0');
      setScheduledDate(`${year}-${month}-${day}`);
      setCalendarDate(defaultDate);
      setSelectedAmPm('PM');
      setScheduledTime('12:00');
    }
  }, [visible]);

  const loadProfiles = async () => {
    try {
      const allProfiles = await DatabaseService.getAllProfiles();
      setProfiles(allProfiles);
    } catch (error) {
      console.error('Error loading profiles:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim()) {
      Alert.alert('Error', 'Please enter a reminder title');
      return;
    }

    if (!scheduledDate) {
      Alert.alert('Error', 'Please select a date for the reminder');
      return;
    }

    setLoading(true);
    try {
      // Create the scheduled datetime with proper timezone handling
      const time24Hour = convertTo24Hour(scheduledTime, selectedAmPm);
      
      // Create the scheduled datetime properly
      const dateTimeString = `${scheduledDate}T${time24Hour}:00`;
      const scheduledDateTime = new Date(dateTimeString);
      
      console.log('Scheduled date input:', scheduledDate);
      console.log('Time input:', `${scheduledTime} ${selectedAmPm}`);
      console.log('Converted 24h time:', time24Hour);
      console.log('DateTime string:', dateTimeString);
      console.log('Final scheduled datetime:', scheduledDateTime.toLocaleString());
      console.log('Current time:', new Date().toLocaleString());
      
      // Ensure we're not scheduling in the past
      const now = new Date();
      if (scheduledDateTime <= now) {
        Alert.alert('Error', 'Cannot schedule reminder for past date/time. Please select a future date and time.');
        setLoading(false);
        return;
      }
      
      const reminderData = {
        title: title.trim(),
        description: description.trim() || null,
        type: selectedType,
        profileId: selectedProfile,
        scheduledFor: scheduledDateTime, // Pass Date object directly
      };

      // Create the reminder in database
      const reminderId = await DatabaseService.createReminder(reminderData);
      
      // Schedule push notification
      try {
        // Build the scheduled datetime using the new helper
        const when = buildWhenFromComponents(scheduledDate, scheduledTime, selectedAmPm);
        
        // Get profile name for notification
        let profileName = null;
        if (selectedProfile) {
          const profile = profiles.find(p => p.id === selectedProfile);
          profileName = profile?.name || null;
        }
        
        const result = await scheduleReminder({
          title: title.trim(),
          body: description.trim() || (profileName ? `Reminder about ${profileName}` : 'You have a reminder'),
          datePick: when,
          timePick: when,
          reminderId: reminderId.toString(),
        });
        
        // Update reminder with notification ID
        if (result.id) {
          await DatabaseService.updateReminderNotificationId(reminderId, result.id);
        }
      } catch (notificationError) {
        console.error('Failed to schedule notification:', notificationError);
        // Don't fail the entire operation if notification scheduling fails
      }
      
      Alert.alert('Success', 'Reminder created successfully');
      handleClose();
      onReminderAdded();
    } catch (error) {
      console.error('Error creating reminder:', error);
      Alert.alert('Error', 'Failed to create reminder');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setTitle('');
    setDescription('');
    setSelectedType('general');
    setSelectedProfile(null);
    setScheduledDate('');
    setScheduledTime('12:00');
    setSelectedAmPm('PM');
    setShowProfilePicker(false);
    setShowCalendar(false);
    setShowTimePicker(false);
    onClose();
  };

  const setQuickDate = (days: number) => {
    const now = new Date();
    let targetDate = new Date();
    
    if (days === 0) {
      // For "Today", always use today's date but set a reasonable future time
      const currentHour = now.getHours();
      
      // Set to today's date explicitly
      targetDate.setFullYear(now.getFullYear());
      targetDate.setMonth(now.getMonth());
      targetDate.setDate(now.getDate());
      
      if (currentHour >= 19) {
        // If it's already 7 PM or later, schedule for tomorrow at 9 AM
        targetDate.setDate(now.getDate() + 1);
        setScheduledTime('09:00');
        setSelectedAmPm('AM');
      } else {
        // If it's before 7 PM, schedule for 7 PM today
        const suggestedHour = 19; // 7 PM
        const displayHour = suggestedHour > 12 ? (suggestedHour - 12).toString().padStart(2, '0') : suggestedHour.toString().padStart(2, '0');
        setScheduledTime(`${displayHour}:00`);
        setSelectedAmPm(suggestedHour >= 12 ? 'PM' : 'AM');
      }
    } else {
      // For other quick dates, set to 12:00 PM
      targetDate.setDate(now.getDate() + days);
      setScheduledTime('12:00');
      setSelectedAmPm('PM');
    }
    
    // Use local date components to avoid timezone issues
    const year = targetDate.getFullYear();
    const month = (targetDate.getMonth() + 1).toString().padStart(2, '0');
    const day = targetDate.getDate().toString().padStart(2, '0');
    setScheduledDate(`${year}-${month}-${day}`);
    setCalendarDate(targetDate);
  };

  const getSelectedProfileName = () => {
    if (!selectedProfile) return 'No profile selected';
    const profile = profiles.find(p => p.id === selectedProfile);
    return profile ? profile.name : 'Unknown profile';
  };

  const getTypeColor = (type: string) => {
    const typeObj = REMINDER_TYPES.find(t => t.key === type);
    return typeObj?.color || '#6B7280';
  };

  const convertTo24Hour = (time: string, ampm: string) => {
    const [hours, minutes] = time.split(':');
    let hour24 = parseInt(hours);
    
    if (ampm === 'AM' && hour24 === 12) {
      hour24 = 0;
    } else if (ampm === 'PM' && hour24 !== 12) {
      hour24 += 12;
    }
    
    return `${hour24.toString().padStart(2, '0')}:${minutes}`;
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString + 'T00:00:00');
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric' 
    });
  };

  const generateCalendarDays = () => {
    const year = calendarDate.getFullYear();
    const month = calendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const startDate = new Date(firstDay);
    startDate.setDate(startDate.getDate() - firstDay.getDay());
    
    const days = [];
    for (let i = 0; i < 42; i++) {
      const date = new Date(startDate);
      date.setDate(startDate.getDate() + i);
      days.push(date);
    }
    return days;
  };

  const navigateMonth = (direction: number) => {
    const newDate = new Date(calendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setCalendarDate(newDate);
  };

  const selectCalendarDate = (date: Date) => {
    // Use local date components to avoid timezone issues
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    setScheduledDate(`${year}-${month}-${day}`);
    setCalendarDate(date);
    setShowCalendar(false);
  };

  const handleTimeSelect = (hour: string, minute: string, ampm: string) => {
    setScheduledTime(`${hour}:${minute}`);
    setSelectedAmPm(ampm);
    setShowTimePicker(false);
  };

  const TimePickerModal = () => {
    const [displayHour, setDisplayHour] = useState('12');
    const [displayMinute, setDisplayMinute] = useState('00');
    const [internalAmPm, setInternalAmPm] = useState('PM');
    
    const hourScrollRef = useRef<ScrollView>(null);
    const minuteScrollRef = useRef<ScrollView>(null);
    
    // Initialize internal state when modal becomes visible
    useEffect(() => {
      if (showTimePicker) {
        const [hour, minute] = scheduledTime.split(':');
        setDisplayHour(hour);
        setDisplayMinute(minute);
        setInternalAmPm(selectedAmPm);
        
        // Position scroll wheels after state is set
        setTimeout(() => {
          const hours = generateTimeOptions().hours;
          const minutes = generateTimeOptions().minutes;
          const hourIndex = hours.findIndex(h => h === hour);
          const minuteIndex = minutes.findIndex(m => m === minute);
          
          if (hourIndex !== -1 && hourScrollRef.current) {
            hourScrollRef.current.scrollTo({
              y: hourIndex * 48,
              animated: false
            });
          }
          
          if (minuteIndex !== -1 && minuteScrollRef.current) {
            minuteScrollRef.current.scrollTo({
              y: minuteIndex * 48,
              animated: false
            });
          }
        }, 200);
      }
    }, [showTimePicker, scheduledTime, selectedAmPm]);
    
    const generateTimeOptions = () => {
      const hours = [];
      const minutes = [];
      
      for (let i = 1; i <= 12; i++) {
        hours.push(i.toString().padStart(2, '0'));
      }
      
      for (let i = 0; i < 60; i++) {
        minutes.push(i.toString().padStart(2, '0'));
      }
      
      return { hours, minutes };
    };
    
    const scrollToTimeValue = (type: 'hour' | 'minute', value: string) => {
      const itemHeight = 48;
      const { hours, minutes } = generateTimeOptions();
      const values = type === 'hour' ? hours : minutes;
      const index = values.findIndex(v => v === value);
      
      if (index !== -1) {
        if (type === 'hour' && hourScrollRef.current) {
          hourScrollRef.current.scrollTo({
            y: index * itemHeight,
            animated: true
          });
        }
        if (type === 'minute' && minuteScrollRef.current) {
          minuteScrollRef.current.scrollTo({
            y: index * itemHeight,
            animated: true
          });
        }
      }
    };
    
    const handleScrollEnd = (event: any, type: 'hour' | 'minute') => {
      const contentOffsetY = event.nativeEvent.contentOffset.y;
      const itemHeight = 48;
      const index = Math.round(contentOffsetY / itemHeight);
      const { hours, minutes } = generateTimeOptions();
      const values = type === 'hour' ? hours : minutes;
      
      if (index >= 0 && index < values.length) {
        const value = values[index];
        if (type === 'hour') {
          setDisplayHour(value);
        } else {
          setDisplayMinute(value);
        }
      }
    };
    
    const handleTimeBoxTap = (type: 'hour' | 'minute') => {
      const currentValue = type === 'hour' ? displayHour : displayMinute;
      const title = type === 'hour' ? 'Enter Hour' : 'Enter Minute';
      const message = type === 'hour' ? 'Enter hour (1-12)' : 'Enter minute (0-59)';
      
      Alert.prompt(
        title,
        message,
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'OK',
            onPress: (text) => {
              const value = parseInt(text || '');
              const isValidHour = type === 'hour' && value >= 1 && value <= 12;
              const isValidMinute = type === 'minute' && value >= 0 && value <= 59;
              
              if (isValidHour || isValidMinute) {
                const valueStr = value.toString().padStart(2, '0');
                
                if (type === 'hour') {
                  setDisplayHour(valueStr);
                } else {
                  setDisplayMinute(valueStr);
                }
                
                setTimeout(() => {
                  scrollToTimeValue(type, valueStr);
                }, 100);
              } else {
                const range = type === 'hour' ? '1 and 12' : '0 and 59';
                Alert.alert(`Invalid ${type.charAt(0).toUpperCase() + type.slice(1)}`, `Please enter a number between ${range}`);
              }
            }
          }
        ],
        'plain-text',
        currentValue
      );
    };
    
    const { hours, minutes } = generateTimeOptions();
    
    return (
    <Modal
      visible={showTimePicker}
      transparent
      animationType="fade"
      onRequestClose={() => setShowTimePicker(false)}
    >
      <View style={styles.timePickerOverlay}>
        <View style={[styles.timePickerModal, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.timePickerHeader, { borderBottomColor: theme.border }]}>
            <Text style={[styles.timePickerTitle, { color: theme.text }]}>Select Time</Text>
            <TouchableOpacity onPress={() => {
              setShowTimePicker(false);
            }}>
              <X size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>
          
          <View style={styles.timePickerContent}>
            {/* AM/PM Selector - Top */}
            <View style={styles.ampmContainer}>
              <TouchableOpacity
                style={[
                  styles.ampmButton,
                  { 
                    backgroundColor: internalAmPm === 'AM' ? theme.secondary : theme.cardBackground,
                    borderWidth: 2,
                    borderColor: internalAmPm === 'AM' ? theme.secondary : theme.border
                  }
                ]}
                onPress={() => {
                  setInternalAmPm('AM');
                }}
              >
                <Text style={[
                  styles.ampmText,
                  { color: internalAmPm === 'AM' ? '#FFFFFF' : theme.text }
                ]}>
                  AM
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[
                  styles.ampmButton,
                  { 
                    backgroundColor: internalAmPm === 'PM' ? theme.secondary : theme.cardBackground,
                    borderWidth: 2,
                    borderColor: internalAmPm === 'PM' ? theme.secondary : theme.border
                  }
                ]}
                onPress={() => {
                  setInternalAmPm('PM');
                }}
              >
                <Text style={[
                  styles.ampmText,
                  { color: internalAmPm === 'PM' ? '#FFFFFF' : theme.text }
                ]}>
                  PM
                </Text>
              </TouchableOpacity>
            </View>

            {/* Current Time Display - Large and Tappable */}
            <View style={styles.timeDisplay}>
              <TouchableOpacity
                style={[
                  styles.timeBox, 
                  { 
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => handleTimeBoxTap('hour')}
              >
                <Text style={[styles.timeBoxText, { color: theme.text }]}>
                  {displayHour}
                </Text>
              </TouchableOpacity>
              
              <Text style={[styles.timeSeparator, { color: theme.text }]}>:</Text>
              
              <TouchableOpacity
                style={[
                  styles.timeBox, 
                  { 
                    backgroundColor: theme.cardBackground,
                    borderColor: theme.border
                  }
                ]}
                onPress={() => handleTimeBoxTap('minute')}
              >
                <Text style={[styles.timeBoxText, { color: theme.text }]}>
                  {displayMinute}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Time Scrollers */}
            <View style={styles.timeScrollers}>
            {/* Scroll Wheels */}
            <View style={styles.scrollWheelsContainer}>
              {/* Hours Column */}
              <View style={styles.wheelColumn}>
                <Text style={[styles.wheelLabel, { color: theme.primary }]}>Hour</Text>
                <ScrollView
                  ref={hourScrollRef}
                  style={styles.scrollWheel}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={48}
                  decelerationRate="fast"
                  contentContainerStyle={styles.scrollContent}
                  onMomentumScrollEnd={(event) => handleScrollEnd(event, 'hour')}
                >
                  {hours.map((hour, index) => (
                    <TouchableOpacity
                      key={`hour-${index}`}
                      style={styles.timeOption}
                      onPress={() => {
                        setDisplayHour(hour);
                        scrollToTimeValue('hour', hour);
                      }}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        { color: hour === displayHour ? '#FFFFFF' : theme.text }
                      ]}>
                        {hour}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>


              {/* Minutes Column */}
              <View style={styles.wheelColumn}>
                <Text style={[styles.wheelLabel, { color: theme.primary }]}>Minute</Text>
                <ScrollView
                  ref={minuteScrollRef}
                  style={styles.scrollWheel}
                  showsVerticalScrollIndicator={false}
                  snapToInterval={48}
                  decelerationRate="fast"
                  contentContainerStyle={styles.scrollContent}
                  onMomentumScrollEnd={(event) => handleScrollEnd(event, 'minute')}
                >
                  {minutes.map((minute, index) => (
                    <TouchableOpacity
                      key={`minute-${index}`}
                      style={styles.timeOption}
                      onPress={() => {
                        setDisplayMinute(minute);
                        scrollToTimeValue('minute', minute);
                      }}
                    >
                      <Text style={[
                        styles.timeOptionText,
                        { color: minute === displayMinute ? '#FFFFFF' : theme.text }
                      ]}>
                        {minute}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            </View>
            </View>
          </View>

          <View style={[styles.timePickerFooter, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.timePickerButton, { backgroundColor: theme.secondary }]}
              onPress={() => {
                handleTimeSelect(displayHour, displayMinute, internalAmPm);
              }}
            >
              <Text style={[styles.timePickerButtonText, { color: '#FFFFFF' }]}>Done</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
    );
  };

  const CalendarModal = () => (
    <Modal
      visible={showCalendar}
      transparent
      animationType="slide"
      onRequestClose={() => setShowCalendar(false)}
    >
      <View style={styles.calendarOverlay}>
        <View style={[styles.calendarModal, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.calendarHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigateMonth(-1)}>
              <ChevronLeft size={24} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.calendarTitle, { color: theme.text }]}>
              {calendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </Text>
            <TouchableOpacity onPress={() => navigateMonth(1)}>
              <ChevronRight size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <View style={styles.calendarContent}>
            <View style={styles.weekDays}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
                <Text key={day} style={[styles.weekDayText, { color: theme.primary }]}>
                  {day}
                </Text>
              ))}
            </View>

            <View style={styles.calendarGrid}>
              {generateCalendarDays().map((date, index) => {
                const isCurrentMonth = date.getMonth() === calendarDate.getMonth();
                const isSelected = date.toISOString().split('T')[0] === scheduledDate;
                const isToday = date.toDateString() === new Date().toDateString();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      isSelected && { backgroundColor: theme.secondary },
                      isToday && !isSelected && { borderColor: theme.secondary, borderWidth: 1 }
                    ]}
                    onPress={() => selectCalendarDate(date)}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      { color: isCurrentMonth ? theme.text : theme.primary },
                      isSelected && { color: '#FFFFFF' }
                    ]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity
                style={[styles.calendarButton, { backgroundColor: modalTheme.inputBackground, borderColor: modalTheme.inputBorder }]}
                onPress={() => setShowCalendar(false)}
              >
                <Text style={[styles.calendarButtonText, { color: modalTheme.inputText }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: theme.border }]}>
            <Text style={[styles.title, { color: theme.text }]}>New Reminder</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <X size={24} color={theme.primary} />
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Title */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Title *</Text>
              <TextInput
                style={[styles.input, { backgroundColor: modalTheme.inputBackground, color: modalTheme.inputText, borderColor: modalTheme.inputBorder }]}
                value={title}
                onChangeText={setTitle}
                placeholder="Enter reminder title..."
                placeholderTextColor={modalTheme.placeholderColor}
              />
            </View>

            {/* Description */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Description</Text>
              <TextInput
                style={[styles.textArea, { backgroundColor: modalTheme.inputBackground, color: modalTheme.inputText, borderColor: modalTheme.inputBorder }]}
                value={description}
                onChangeText={setDescription}
                placeholder="Add details about this reminder..."
                placeholderTextColor={modalTheme.placeholderColor}
                multiline
                numberOfLines={3}
              />
            </View>

            {/* Type Selection */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Type</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.typeOptions}>
                {REMINDER_TYPES.map((type) => (
                  <TouchableOpacity
                    key={type.key}
                    style={[
                      styles.typeOption,
                      {
                        backgroundColor: selectedType === type.key ? type.color : (isDark ? '#374151' : '#E5E7EB'),
                        borderColor: theme.border,
                      }
                    ]}
                    onPress={() => setSelectedType(type.key)}
                  >
                    <Tag size={16} color={selectedType === type.key ? '#FFFFFF' : '#FFFFFF'} />
                    <Text style={[
                      styles.typeOptionText,
                      { color: selectedType === type.key ? '#FFFFFF' : (isDark ? theme.text : '#374151') }
                    ]}>
                      {type.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>

            {/* Profile Selection */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Profile (Optional)</Text>
              <TouchableOpacity
                style={[styles.profileSelector, { backgroundColor: modalTheme.inputBackground, borderColor: modalTheme.inputBorder }]}
                onPress={() => setShowProfilePicker(!showProfilePicker)}
              >
                <User size={20} color={theme.primary} />
                <Text style={[styles.profileSelectorText, { color: modalTheme.inputText }]}>
                  {getSelectedProfileName()}
                </Text>
              </TouchableOpacity>

              {showProfilePicker && (
                <View style={[styles.profilePicker, { backgroundColor: modalTheme.inputBackground, borderColor: modalTheme.inputBorder }]}>
                  <TouchableOpacity
                    style={[styles.profileOption, { borderBottomColor: modalTheme.inputBorder }]}
                    onPress={() => {
                      setSelectedProfile(null);
                      setShowProfilePicker(false);
                    }}
                  >
                    <Text style={[styles.profileOptionText, { color: modalTheme.placeholderColor }]}>
                      No profile
                    </Text>
                  </TouchableOpacity>
                  {profiles.map((profile) => (
                    <TouchableOpacity
                      key={profile.id}
                      style={[styles.profileOption, { borderBottomColor: modalTheme.inputBorder }]}
                      onPress={() => {
                        setSelectedProfile(profile.id);
                        setShowProfilePicker(false);
                      }}
                    >
                      <Text style={[styles.profileOptionText, { color: modalTheme.inputText }]}>
                        {profile.name}
                      </Text>
                      <Text style={[styles.profileOptionRelation, { color: modalTheme.placeholderColor }]}>
                        {profile.relationship}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Date Selection */}
            <View style={styles.section}>
              <Text style={[styles.label, { color: theme.text }]}>Date *</Text>
              
              {/* Quick Date Options */}
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.quickDates}>
                {QUICK_DATES.map((quickDate) => (
                  <TouchableOpacity
                    key={quickDate.label}
                    style={[styles.quickDateOption, { backgroundColor: modalTheme.inputBackground, borderColor: modalTheme.inputBorder }]}
                    onPress={() => setQuickDate(quickDate.days)}
                  >
                    <Text style={[styles.quickDateText, { color: modalTheme.inputText }]}>
                      {quickDate.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>

              {/* Date and Time Selectors */}
              <View style={styles.dateTimeRow}>
                <TouchableOpacity
                  style={[styles.dateSelector, { backgroundColor: modalTheme.inputBackground, borderColor: modalTheme.inputBorder }]}
                  onPress={() => {
                    console.log('Date selector pressed');
                    setShowCalendar(true);
                  }}
                >
                  <Calendar size={20} color={theme.primary} />
                  <Text style={[styles.dateSelectorText, { color: modalTheme.inputText }]}>
                    {scheduledDate ? formatDisplayDate(scheduledDate) : 'Select Date'}
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.timeSelector, { backgroundColor: modalTheme.inputBackground, borderColor: modalTheme.inputBorder }]}
                  onPress={() => {
                    setShowTimePicker(true);
                  }}
                >
                  <Clock size={20} color={theme.primary} />
                  <Text style={[styles.timeSelectorText, { color: modalTheme.inputText }]}>
                    {`${scheduledTime} ${selectedAmPm}`}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>

          {/* Footer */}
          <View style={[styles.footer, { borderTopColor: theme.border }]}>
            <TouchableOpacity
              style={[styles.cancelButton, { backgroundColor: modalTheme.inputBackground, borderColor: modalTheme.inputBorder }]}
              onPress={handleClose}
            >
              <Text style={[styles.cancelButtonText, { color: modalTheme.inputText }]}>Cancel</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.saveButton, { backgroundColor: theme.secondary }]}
              onPress={handleSave}
              disabled={loading}
            >
              <Text style={styles.saveButtonText}>
                {loading ? 'Creating...' : 'Create Reminder'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
      <TimePickerModal />
      <CalendarModal />
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
  },
  closeButton: {
    padding: 4,
  },
  content: {
    paddingHorizontal: 20,
  },
  section: {
    marginBottom: 24,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  input: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    letterSpacing: 0,
  },
  textArea: {
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    borderWidth: 1,
    minHeight: 80,
    textAlignVertical: 'top',
    letterSpacing: 0,
  },
  typeOptions: {
    marginBottom: 8,
  },
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
  },
  typeOptionText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: 6,
  },
  profileSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  profileSelectorText: {
    fontSize: 16,
    marginLeft: 8,
    flex: 1,
  },
  profilePicker: {
    marginTop: 8,
    borderRadius: 8,
    borderWidth: 1,
    maxHeight: 200,
  },
  profileOption: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  profileOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  profileOptionRelation: {
    fontSize: 14,
    marginTop: 2,
  },
  quickDates: {
    marginBottom: 12,
  },
  quickDateOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    borderWidth: 1,
  },
  quickDateText: {
    fontSize: 14,
    fontWeight: '500',
  },
  footer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderTopWidth: 1,
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  saveButton: {
    flex: 2,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  dateTimeRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateSelector: {
    flex: 2,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  dateSelectorText: {
    fontSize: 16,
    marginLeft: 8,
  },
  timeSelector: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  timeSelectorText: {
    fontSize: 16,
    marginLeft: 8,
  },
  // Calendar Modal Styles
  calendarOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  calendarModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    overflow: 'hidden',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  calendarContent: {
    padding: 20,
  },
  weekDays: {
    flexDirection: 'row',
    marginBottom: 16,
  },
  weekDayText: {
    flex: 1,
    textAlign: 'center',
    fontSize: 14,
    fontWeight: '500',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  calendarDay: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginBottom: 4,
  },
  calendarDayText: {
    fontSize: 16,
    fontWeight: '500',
  },
  calendarFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  calendarButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 2,
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Time Picker Modal Styles
  timePickerOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  timePickerModal: {
    width: '85%',
    maxWidth: 350,
    borderRadius: 16,
    overflow: 'hidden',
  },
  timePickerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  timePickerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  timePickerContent: {
    padding: 20,
  },
  ampmContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: 20,
    gap: 12,
  },
  ampmButton: {
    flex: 1,
    maxWidth: 80,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  ampmText: {
    fontSize: 16,
    fontWeight: '600',
  },
  timeDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 30,
    paddingVertical: 20,
  },
  timeBox: {
    paddingHorizontal: 20,
    paddingVertical: 15,
    borderRadius: 16,
    minWidth: 70,
    alignItems: 'center',
    borderWidth: 2,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },
  timeBoxText: {
    fontSize: 36,
    fontWeight: '700',
  },
  timeSeparator: {
    fontSize: 36,
    fontWeight: '700',
    marginHorizontal: 15,
  },
  timeScrollers: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 40,
  },
  scrollWheelsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 30,
  },
  wheelColumn: {
    flex: 1,
    alignItems: 'center',
  },
  wheelLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 10,
  },
  scrollWheel: {
    height: 200,
    width: 70,
  },
  scrollContent: {
    paddingVertical: 76, // Centers the first/last items
  },
  timeOption: {
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    marginHorizontal: 8,
  },
  timeOptionText: {
    fontSize: 18,
    fontWeight: '600',
  },
  timePickerFooter: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
  },
  timePickerButton: {
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 0,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  timePickerButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});