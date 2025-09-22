import { Platform, ActionSheetIOS, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useEffect } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  ScrollView, 
  TouchableOpacity, 
  TextInput, 
  SafeAreaView,
  Modal,
  Image,
  Switch
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useFocusEffect } from '@react-navigation/native';
import { ArrowLeft, Save, Plus, X, User, Palette, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Heart, Briefcase, House } from 'lucide-react-native';
import { Camera } from 'lucide-react-native';
import { DatabaseService } from '@/services/DatabaseService';
import { scheduleBirthdayText, scheduleReminder, cancelById } from '@/services/Scheduler';
import { useTheme } from '@/context/ThemeContext';

const TAG_COLORS = [
  { name: 'Blue', light: '#DBEAFE', dark: '#1E3A8A', text: '#1E40AF' },
  { name: 'Green', light: '#D1FAE5', dark: '#064E3B', text: '#059669' },
  { name: 'Purple', light: '#E9D5FF', dark: '#581C87', text: '#7C3AED' },
  { name: 'Red', light: '#FEE2E2', dark: '#7F1D1D', text: '#DC2626' },
  { name: 'Yellow', light: '#FEF3C7', dark: '#78350F', text: '#D97706' },
  { name: 'Pink', light: '#FCE7F3', dark: '#831843', text: '#EC4899' },
  { name: 'Gray', light: '#F3F4F6', dark: '#374151', text: '#6B7280' },
];

const RELATIONSHIP_OPTIONS = [
  { key: 'family', label: 'Family', color: '#EF4444', icon: 'Heart' },
  { key: 'friend', label: 'Friend', color: '#3B82F6', icon: 'User' },
  { key: 'coworker', label: 'Coworker', color: '#059669', icon: 'Briefcase' },
  { key: 'partner', label: 'Partner', color: '#EC4899', icon: 'Heart' },
  { key: 'neighbor', label: 'Neighbor', color: '#8B5CF6', icon: 'House' },
  { key: 'acquaintance', label: 'Acquaintance', color: '#6B7280', icon: 'User' }
];

export default function EditProfile() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { isDark } = useTheme();
  
  const [profile, setProfile] = useState({
    name: '',
    age: null,
    phone: '',
    email: '',
    relationship: 'friend',
    job: '',
    notes: '',
    tags: [],
    parents: [],
    kids: [],
    brothers: [],
    sisters: [],
    siblings: [],
    foodLikes: [],
    foodDislikes: [],
    interests: [],
    instagram: '',
    snapchat: '',
    twitter: '',
    tiktok: '',
    facebook: '',
    birthday: '',
    lastContactDate: new Date().toISOString(),
    // Text fields for editing
    parentsText: '',
    kidsText: '',
    brothersText: '',
    sistersText: '',
    siblingsText: '',
    likesText: '',
    dislikesText: '',
    interestsText: '',
    birthdayTextEnabled: false,
    giftReminderEnabled: false,
  });
  
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [showLastContactCalendar, setShowLastContactCalendar] = useState(false);
  const [lastContactCalendarDate, setLastContactCalendarDate] = useState(new Date());

  const theme = {
    text: '#f0f0f0',
    background: isDark ? '#0B0909' : '#003C24',
    primary: '#f0f0f0',
    secondary: isDark ? '#4A5568' : '#012d1c',
    accent: isDark ? '#44444C' : '#002818',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    border: isDark ? '#333333' : '#012d1c',
    isDark,
  };

  useEffect(() => {
    loadProfile();
  }, [id]);

  useFocusEffect(
    React.useCallback(() => {
      loadProfile();
    }, [id])
  );

  const loadProfile = async () => {
    try {
      if (id) {
        const profileData = await DatabaseService.getProfileById(parseInt(id));
        if (profileData) {
          // Convert arrays back to text for editing
          const textFields = {
            parentsText: profileData.parents ? profileData.parents.join(', ') : '',
            kidsText: profileData.kids ? profileData.kids.join(', ') : '',
            brothersText: profileData.brothers ? profileData.brothers.join(', ') : '',
            sistersText: profileData.sisters ? profileData.sisters.join(', ') : '',
            siblingsText: profileData.siblings ? profileData.siblings.join(', ') : '',
            likesText: profileData.foodLikes ? profileData.foodLikes.join(', ') : '',
            dislikesText: profileData.foodDislikes ? profileData.foodDislikes.join(', ') : '',
            interestsText: profileData.interests ? profileData.interests.join(', ') : '',
            birthdayTextEnabled: Boolean(profileData.birthdayTextEnabled),
            giftReminderEnabled: Boolean(profileData.giftReminderEnabled),
          };
          
          setProfile({ ...profileData, ...textFields });
          
          if (profileData.photoUri) {
            setSelectedImage({ uri: profileData.photoUri });
          }
          
          // Initialize calendar date
          if (profileData.lastContactDate) {
            setLastContactCalendarDate(new Date(profileData.lastContactDate));
          }
        }
      }
    } catch (error) {
      console.error('Error loading profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    if (!profile?.name?.trim()) {
      Alert.alert('Error', 'Name is required');
      return;
    }

    // Validate birthday text requirements
    if (profile.birthdayTextEnabled) {
      if (!profile.phone?.trim()) {
        Alert.alert('Error', 'Phone number is required for birthday text feature');
        return;
      }
      
      if (!profile.birthday || profile.birthday.length !== 10) {
        Alert.alert('Error', 'Valid birthday (MM/DD/YYYY) is required for birthday text feature');
        return;
      }
    }

    // Validate gift reminder requirements
    if (profile.giftReminderEnabled) {
      if (!profile.birthday || profile.birthday.length !== 10) {
        Alert.alert('Error', 'Valid birthday (MM/DD/YYYY) is required for gift reminder feature');
        return;
      }
    }

    setSaving(true);
    try {
      // Get the existing profile to check current birthday text and gift reminder status
      const existingProfile = await DatabaseService.getProfileById(parseInt(id));
      
      // Handle birthday text toggle changes
      if (profile.birthdayTextEnabled !== Boolean(existingProfile?.birthdayTextEnabled)) {
        if (profile.birthdayTextEnabled) {
          // Enabling birthday text
          if (profile.phone && profile.birthday) {
            try {
              // Calculate next birthday occurrence
              const [month, day, year] = profile.birthday.split('/').map(num => parseInt(num));
              const currentYear = new Date().getFullYear();
              let birthdayThisYear = new Date(currentYear, month - 1, day, 9, 0, 0, 0);
              
              if (birthdayThisYear <= new Date()) {
                birthdayThisYear = new Date(currentYear + 1, month - 1, day, 9, 0, 0, 0);
              }
              
              // Create scheduled text entry
              const scheduledTextData = {
                profileId: parseInt(id),
                phoneNumber: profile.phone,
                message: 'Happy Birthday!!',
                scheduledFor: birthdayThisYear,
              };
              
              const scheduledTextId = await DatabaseService.createScheduledText(scheduledTextData);
              
              // Schedule the notification
              const result = await scheduleBirthdayText({
                messageId: scheduledTextId.toString(),
                phoneNumber: profile.phone,
                message: 'Happy Birthday!!',
                datePick: birthdayThisYear,
                timePick: birthdayThisYear,
                profileId: id,
              });
              
              if (result.id) {
                await DatabaseService.updateScheduledTextNotificationId(scheduledTextId, result.id);
              }
              
              // Update profile with birthday text info
              profile.birthdayTextScheduledTextId = scheduledTextId;
            } catch (error) {
              console.error('Error scheduling birthday text:', error);
              profile.birthdayTextEnabled = false;
            }
          }
        } else {
          // Disabling birthday text
          if (existingProfile?.birthdayTextScheduledTextId) {
            try {
              // Get the scheduled text to cancel its notification
              const scheduledText = await DatabaseService.getScheduledTextById(existingProfile.birthdayTextScheduledTextId);
              if (scheduledText?.notificationId) {
                await cancelById(scheduledText.notificationId);
              }
              
              // Delete the scheduled text
              await DatabaseService.deleteScheduledText(existingProfile.birthdayTextScheduledTextId);
            } catch (error) {
              console.error('Error cancelling birthday text:', error);
            }
          }
          profile.birthdayTextScheduledTextId = null;
        }
      }
      
      // Handle gift reminder toggle changes
      if (profile.giftReminderEnabled !== Boolean(existingProfile?.giftReminderEnabled)) {
        if (profile.giftReminderEnabled) {
          // Enabling gift reminder
          if (profile.birthday) {
            try {
              // Calculate next birthday occurrence
              const [month, day, year] = profile.birthday.split('/').map(num => parseInt(num));
              const currentYear = new Date().getFullYear();
              let birthdayThisYear = new Date(currentYear, month - 1, day, 9, 0, 0, 0);
              
              if (birthdayThisYear <= new Date()) {
                birthdayThisYear = new Date(currentYear + 1, month - 1, day, 9, 0, 0, 0);
              }
              
              // Calculate 21 days before birthday
              const giftReminderDate = new Date(birthdayThisYear);
              giftReminderDate.setDate(giftReminderDate.getDate() - 21);
              
              // Create reminder entry
              const reminderData = {
                profileId: parseInt(id),
                title: `Get Gift for ${profile.name}`,
                description: 'Their birthday is in 3 weeks!!',
                type: 'general',
                scheduledFor: giftReminderDate,
              };
              
              const reminderId = await DatabaseService.createReminder(reminderData);
              
              // Schedule the notification
              const result = await scheduleReminder({
                title: `Get Gift for ${profile.name}`,
                body: 'Their birthday is in 3 weeks!!',
                datePick: giftReminderDate,
                timePick: giftReminderDate,
                reminderId: reminderId.toString(),
                isGiftReminder: true,
                profileId: id,
              });
              
              if (result.id) {
                await DatabaseService.updateReminderNotificationId(reminderId, result.id);
              }
              
              // Update profile with gift reminder info
              profile.giftReminderId = reminderId;
            } catch (error) {
              console.error('Error scheduling gift reminder:', error);
              profile.giftReminderEnabled = false;
            }
          }
        } else {
          // Disabling gift reminder
          if (existingProfile?.giftReminderId) {
            try {
              // Get the reminder to cancel its notification
              const reminder = await DatabaseService.getReminderById(existingProfile.giftReminderId);
              if (reminder?.notificationId) {
                await cancelById(reminder.notificationId);
              }
              
              // Delete the reminder
              await DatabaseService.deleteReminder(existingProfile.giftReminderId);
            } catch (error) {
              console.error('Error cancelling gift reminder:', error);
            }
          }
          profile.giftReminderId = null;
        }
      }

      // Update the profile
      await DatabaseService.createOrUpdateProfile({ ...profile, id: parseInt(id) });
      
      Alert.alert('Success', 'Profile updated successfully', [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error updating profile:', error);
      Alert.alert('Error', 'Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const addTag = () => {
    if (!newTag.trim()) return;
    
    const tag = {
      text: newTag.trim(),
      color: selectedTagColor,
    };
    
    setProfile(prev => ({
      ...prev,
      tags: [...(prev.tags || []), tag]
    }));
    
    setNewTag('');
  };

  const removeTag = (index) => {
    setProfile(prev => ({
      ...prev,
      tags: prev.tags.filter((_, i) => i !== index)
    }));
  };

  const updateField = (field, value) => {
    setProfile(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleAddPhoto = async () => {
    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Choose from Library', 'Take Photo', 'Cancel'],
          cancelButtonIndex: 2,
        },
        async (buttonIndex) => {
          try {
            if (buttonIndex === 0) {
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              if (perm.status !== 'granted') {
                Alert.alert('Permission needed', 'Enable Photos in Settings to add a picture.');
                return;
              }
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                setSelectedImage(asset);
                updateField('photoUri', asset.uri);
              }
            } else if (buttonIndex === 1) {
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              if (perm.status !== 'granted') {
                Alert.alert('Permission needed', 'Enable Camera in Settings to take a picture.');
                return;
              }
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                setSelectedImage(asset);
                updateField('photoUri', asset.uri);
              }
            }
          } catch (e) {
            Alert.alert('Error', 'Failed to open picker. Try again.');
          }
        }
      );
    } else {
      Alert.alert('Add Photo', 'Choose an option:', [
        {
          text: 'Choose from Library',
          onPress: async () => {
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (perm.status !== 'granted') {
              Alert.alert('Permission needed', 'Enable Photos in Settings to add a picture.');
              return;
            }
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              setSelectedImage(asset);
              updateField('photoUri', asset.uri);
            }
          },
        },
        {
          text: 'Take Photo',
          onPress: async () => {
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            if (perm.status !== 'granted') {
              Alert.alert('Permission needed', 'Enable Camera in Settings to take a picture.');
              return;
            }
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              setSelectedImage(asset);
              updateField('photoUri', asset.uri);
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleRemovePhoto = () => {
    setSelectedImage(null);
    updateField('photoUri', null);
  };

  const handleBirthdayInputChange = (text) => {
    const digitsOnly = text.replace(/\D/g, '');
    
    let formatted = '';
    if (digitsOnly.length >= 1) {
      formatted = digitsOnly.substring(0, 2);
    }
    if (digitsOnly.length >= 3) {
      formatted += '/' + digitsOnly.substring(2, 4);
    }
    if (digitsOnly.length >= 5) {
      formatted += '/' + digitsOnly.substring(4, 8);
    }
    
    updateField('birthday', formatted);
    
    if (formatted.length < 10) {
      updateField('age', null);
      return;
    }
    
    if (formatted.length === 10) {
      const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12]\d|3[01])\/\d{4}$/;
      
      if (!dateRegex.test(formatted)) {
        Alert.alert(
          'Invalid Date Format',
          'Please use MM/DD/YYYY format (e.g., 03/15/1990)',
          [{ text: 'Okay', onPress: () => {
            updateField('birthday', '');
            updateField('age', null);
          }}]
        );
        return;
      }
      
      const [month, day, year] = formatted.split('/').map(num => parseInt(num));
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(23, 59, 59, 999);
      
      if (inputDate.getMonth() !== month - 1 || inputDate.getDate() !== day || inputDate.getFullYear() !== year) {
        Alert.alert(
          'Invalid Date',
          'Please enter a valid date (e.g., 03/15/1990)',
          [{ text: 'Okay', onPress: () => {
            updateField('birthday', '');
            updateField('age', null);
          }}]
        );
        return;
      }
      
      if (inputDate > today) {
        Alert.alert(
          'Invalid Birthday',
          'Birthday cannot be in the future. Please enter a past date.',
          [{ text: 'Okay', onPress: () => {
            updateField('birthday', '');
            updateField('age', null);
          }}]
        );
        return;
      }
      
      const calculatedAge = calculateAge(inputDate);
      updateField('age', calculatedAge);
    }
  };

  const calculateAge = (birthDate) => {
    const today = new Date();
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  };

  const formatDisplayDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      weekday: 'short', 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  };

  const generateCalendarDays = () => {
    const year = lastContactCalendarDate.getFullYear();
    const month = lastContactCalendarDate.getMonth();
    const firstDay = new Date(year, month, 1);
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
    const newDate = new Date(lastContactCalendarDate);
    newDate.setMonth(newDate.getMonth() + direction);
    setLastContactCalendarDate(newDate);
  };

  const selectLastContactDate = (date: Date) => {
    const dateString = date.toISOString();
    updateField('lastContactDate', dateString);
    setLastContactCalendarDate(date);
    setShowLastContactCalendar(false);
  };

  const LastContactCalendarModal = () => (
    <Modal
      visible={showLastContactCalendar}
      transparent
      animationType="slide"
      onRequestClose={() => setShowLastContactCalendar(false)}
    >
      <View style={styles.calendarOverlay}>
        <View style={[styles.calendarModal, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.calendarHeader, { borderBottomColor: theme.border }]}>
            <TouchableOpacity onPress={() => navigateMonth(-1)}>
              <ChevronLeft size={24} color={theme.primary} />
            </TouchableOpacity>
            <Text style={[styles.calendarTitle, { color: theme.text }]}>
              {lastContactCalendarDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
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
                const isCurrentMonth = date.getMonth() === lastContactCalendarDate.getMonth();
                const isSelected = date.toDateString() === new Date(profile.lastContactDate).toDateString();
                const isToday = date.toDateString() === new Date().toDateString();
                const isFuture = date > new Date();

                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      styles.calendarDay,
                      isSelected && { backgroundColor: theme.secondary },
                      isToday && !isSelected && { borderColor: theme.secondary, borderWidth: 1 },
                      isFuture && { opacity: 0.5 }
                    ]}
                    onPress={() => !isFuture && selectLastContactDate(date)}
                    disabled={isFuture}
                  >
                    <Text style={[
                      styles.calendarDayText,
                      { color: isCurrentMonth ? theme.text : theme.primary },
                      isSelected && { color: '#FFFFFF' },
                      isFuture && { color: theme.primary }
                    ]}>
                      {date.getDate()}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

            <View style={styles.calendarFooter}>
              <TouchableOpacity
                style={[styles.calendarButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
                onPress={() => setShowLastContactCalendar(false)}
              >
                <Text style={[styles.calendarButtonText, { color: theme.text }]}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
        <View style={styles.loadingContainer}>
          <Text style={[styles.loadingText, { color: theme.primary }]}>Loading profile...</Text>
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
        <Text style={[styles.headerTitle, { color: theme.text }]}>Edit Profile</Text>
        <TouchableOpacity 
          style={[styles.saveButton, { backgroundColor: theme.secondary }]} 
          onPress={handleSave}
          disabled={saving}
        >
          <Text style={styles.saveButtonText}>SAVE</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Basic Info */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Basic Information</Text>
          
          {/* Profile Photo */}
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Profile Photo</Text>
            <View style={styles.photoContainer}>
              {selectedImage ? (
                <View style={styles.photoPreview}>
                  <Image source={{ uri: selectedImage.uri }} style={styles.profilePhoto} />
                  <TouchableOpacity
                    style={[styles.replacePhotoButton, { backgroundColor: isDark ? theme.secondary : '#015A3A' }]}
                    onPress={handleRemovePhoto}
                  >
                    <X size={16} color="#FFFFFF" />
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity
                  style={[styles.addPhotoButton, { backgroundColor: theme.accent, borderColor: theme.border }]}
                  onPress={handleAddPhoto}
                >
                  <Camera size={24} color={theme.primary} />
                  <Text style={[styles.addPhotoText, { color: theme.text }]}>Add Photo</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Name *</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.name || ''}
              onChangeText={(text) => updateField('name', text)}
              placeholder="Enter name"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Birthday</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.birthday}
              onChangeText={handleBirthdayInputChange}
              placeholder="MM/DD/YYYY (e.g., 03/15/1990)"
              placeholderTextColor={theme.primary}
              keyboardType="numeric"
              maxLength={10}
            />
            {profile.age && (
              <Text style={[styles.ageDisplay, { color: theme.primary }]}>
                Age: {profile.age} years old
              </Text>
            )}
          </View>

          {/* Birthday Text Toggle */}
          <View style={styles.inputGroup}>
            <View style={styles.toggleHeader}>
              <Text style={[styles.label, { color: theme.text }]}>Birthday Text</Text>
              <Switch
                value={profile.birthdayTextEnabled}
                onValueChange={(value) => updateField('birthdayTextEnabled', value)}
                disabled={!profile.phone?.trim() || !profile.birthday || profile.birthday.length !== 10}
                trackColor={{ false: theme.border, true: theme.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={[styles.warningText, { color: theme.primary }]}>
              (Phone Number Required. Toggles OFF after notification fires.)
            </Text>
          </View>

          {/* Gift Reminder Toggle */}
          <View style={styles.inputGroup}>
            <View style={styles.toggleHeader}>
              <Text style={[styles.label, { color: theme.text }]}>Gift Reminder</Text>
              <Switch
                value={profile.giftReminderEnabled}
                onValueChange={(value) => updateField('giftReminderEnabled', value)}
                disabled={!profile.birthday || profile.birthday.length !== 10}
                trackColor={{ false: theme.border, true: theme.secondary }}
                thumbColor="#FFFFFF"
              />
            </View>
            <Text style={[styles.warningText, { color: theme.primary }]}>
              A reminder will be scheduled 21 days before their birthday.
            </Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Relationship</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.relationshipOptions}>
              {RELATIONSHIP_OPTIONS.map((option) => {
                return (
                  <TouchableOpacity
                    key={option.key}
                    style={[
                      styles.relationshipOption,
                      { 
                        backgroundColor: profile.relationship === option.key ? option.color : (isDark ? '#374151' : '#E5E7EB'),
                        borderColor: theme.border 
                      }
                    ]}
                    onPress={() => updateField('relationship', option.key)}
                  >
                    {(() => {
                      const IconComponent = option.icon === 'Heart' ? Heart :
                                          option.icon === 'Briefcase' ? Briefcase :
                                          option.icon === 'House' ? House : User;
                      return <IconComponent size={16} color={profile.relationship === option.key ? '#FFFFFF' : (isDark ? theme.text : '#374151')} />;
                    })()}
                    <Text style={[
                      styles.relationshipOptionText,
                      { color: profile.relationship === option.key ? '#FFFFFF' : (isDark ? theme.text : '#374151') }
                    ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Job</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.job || ''}
              onChangeText={(text) => updateField('job', text)}
              placeholder="Enter job/occupation"
              placeholderTextColor={theme.primary}
            />
          </View>
        </View>

        {/* Contact Info */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Contact Information</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Phone</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.phone || ''}
              onChangeText={(text) => updateField('phone', text)}
              placeholder="Enter phone number"
              placeholderTextColor={theme.primary}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Email</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.email || ''}
              onChangeText={(text) => updateField('email', text)}
              placeholder="Enter email address"
              placeholderTextColor={theme.primary}
              keyboardType="email-address"
              autoCapitalize="none"
            />
          </View>
        </View>

        {/* Family Information */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Family</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Parents</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.parentsText || ''}
              onChangeText={(text) => {
                updateField('parentsText', text);
                updateField('parents', text ? text.split(',').map(p => p.trim()).filter(p => p) : []);
              }}
              placeholder="e.g. John Smith, Mary Smith"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Children</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.kidsText || ''}
              onChangeText={(text) => {
                updateField('kidsText', text);
                updateField('kids', text ? text.split(',').map(k => k.trim()).filter(k => k) : []);
              }}
              placeholder="e.g. Emma, Liam, Sophia"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Brothers</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.brothersText || ''}
              onChangeText={(text) => {
                updateField('brothersText', text);
                updateField('brothers', text ? text.split(',').map(b => b.trim()).filter(b => b) : []);
              }}
              placeholder="e.g. Michael, David"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Sisters</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.sistersText || ''}
              onChangeText={(text) => {
                updateField('sistersText', text);
                updateField('sisters', text ? text.split(',').map(s => s.trim()).filter(s => s) : []);
              }}
              placeholder="e.g. Sarah, Jessica"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Other Siblings</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.siblingsText || ''}
              onChangeText={(text) => {
                updateField('siblingsText', text);
                updateField('siblings', text ? text.split(',').map(s => s.trim()).filter(s => s) : []);
              }}
              placeholder="e.g. Alex, Jordan (step-siblings, half-siblings)"
              placeholderTextColor={theme.primary}
            />
          </View>
        </View>

        {/* Preferences */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Preferences</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Likes</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.foodLikesText || ''}
              onChangeText={(text) => {
                updateField('foodLikesText', text);
                updateField('foodLikes', text ? text.split(',').map(l => l.trim()).filter(l => l) : []);
              }}
              placeholder="e.g. pizza, hiking, movies, reading"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Dislikes</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.foodDislikesText || ''}
              onChangeText={(text) => {
                updateField('foodDislikesText', text);
                updateField('foodDislikes', text ? text.split(',').map(d => d.trim()).filter(d => d) : []);
              }}
              placeholder="e.g. spicy food, loud music, crowds"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Interests</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.interestsText || ''}
              onChangeText={(text) => {
                updateField('interestsText', text);
                updateField('interests', text ? text.split(',').map(i => i.trim()).filter(i => i) : []);
              }}
              placeholder="e.g. music, art, sports, reading"
              placeholderTextColor={theme.primary}
            />
          </View>
        </View>

        {/* Socials */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Socials</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Instagram</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.instagram || ''}
              onChangeText={(text) => updateField('instagram', text)}
              placeholder="@username or profile link"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Snapchat</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.snapchat || ''}
              onChangeText={(text) => updateField('snapchat', text)}
              placeholder="@username"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>X (Twitter)</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.twitter || ''}
              onChangeText={(text) => updateField('twitter', text)}
              placeholder="@username"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>TikTok</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.tiktok || ''}
              onChangeText={(text) => updateField('tiktok', text)}
              placeholder="@username"
              placeholderTextColor={theme.primary}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Facebook</Text>
            <TextInput
              style={[styles.input, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={profile.facebook || ''}
              onChangeText={(text) => updateField('facebook', text)}
              placeholder="Profile name or link"
              placeholderTextColor={theme.primary}
            />
          </View>
        </View>

        {/* Tags */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Tags</Text>
          
          {/* Existing Tags */}
          <View style={styles.tagsContainer}>
            {profile.tags?.map((tag, index) => (
              <View 
                key={index} 
                style={[
                  styles.tag, 
                  { 
                    backgroundColor: isDark ? tag.color?.dark || theme.accent : tag.color?.light || theme.accent 
                  }
                ]}
              >
                <Text style={[
                  styles.tagText, 
                  { color: isDark ? '#FFFFFF' : tag.color?.text || theme.text }
                ]}>
                  {typeof tag === 'string' ? tag : tag.text}
                </Text>
                <TouchableOpacity onPress={() => removeTag(index)}>
                  <X size={14} color={isDark ? '#FFFFFF' : tag.color?.text || theme.text} />
                </TouchableOpacity>
              </View>
            ))}
          </View>

          {/* Add New Tag */}
          <View style={styles.addTagContainer}>
            <TextInput
              style={[styles.tagInput, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
              value={newTag}
              onChangeText={setNewTag}
              placeholder="Add a tag..."
              placeholderTextColor={theme.primary}
            />
            
            <TouchableOpacity
              style={[styles.colorButton, { backgroundColor: isDark ? selectedTagColor.dark : selectedTagColor.light }]}
              onPress={() => setShowColorPicker(!showColorPicker)}
            >
              <Palette size={16} color={selectedTagColor.text} />
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.addTagButton, { backgroundColor: theme.secondary }]}
              onPress={addTag}
            >
              <Plus size={16} color="#FFFFFF" />
            </TouchableOpacity>
          </View>

          {/* Color Picker */}
          {showColorPicker && (
            <View style={styles.colorPicker}>
              {TAG_COLORS.map((color) => (
                <TouchableOpacity
                  key={color.name}
                  style={[
                    styles.colorOption,
                    { backgroundColor: isDark ? color.dark : color.light },
                    selectedTagColor.name === color.name && { borderWidth: 2, borderColor: theme.secondary }
                  ]}
                  onPress={() => {
                    setSelectedTagColor(color);
                    setShowColorPicker(false);
                  }}
                />
              ))}
            </View>
          )}
        </View>

        {/* Notes */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Other Notes</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.accent, color: theme.text, borderColor: theme.border }]}
            value={profile.notes || ''}
            onChangeText={(text) => updateField('notes', text)}
            placeholder="Add notes about this person..."
            placeholderTextColor={theme.primary}
            multiline
            numberOfLines={4}
          />
        </View>

        {/* Last Contact */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Last Contact</Text>
          
          <View style={styles.inputGroup}>
            <Text style={[styles.label, { color: theme.text }]}>Last Contact Date</Text>
            <TouchableOpacity
              style={[styles.dateSelector, { backgroundColor: theme.accent, borderColor: theme.border }]}
              onPress={() => {
                setLastContactCalendarDate(new Date(profile.lastContactDate));
                setShowLastContactCalendar(true);
              }}
            >
              <Calendar size={20} color={theme.primary} />
              <Text style={[styles.dateSelectorText, { color: theme.text }]}>
                {formatDisplayDate(profile.lastContactDate)}
              </Text>
            </TouchableOpacity>
            <Text style={[styles.helperText, { color: theme.primary }]}>
              When did you last have contact with this person?
            </Text>
          </View>
        </View>
      </ScrollView>
      
      <LastContactCalendarModal />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 40,
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
  saveButton: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  inputGroup: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
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
    minHeight: 100,
    textAlignVertical: 'top',
    letterSpacing: 0,
  },
  relationshipOptions: {
    flexDirection: 'row',
  },
  relationshipOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginRight: 8,
    borderWidth: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  relationshipOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginBottom: 16,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
    marginRight: 6,
  },
  addTagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tagInput: {
    flex: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 14,
    borderWidth: 1,
    marginRight: 8,
    letterSpacing: 0,
  },
  colorButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 8,
  },
  addTagButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  colorPicker: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 12,
  },
  colorOption: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  photoContainer: {
    alignItems: 'center',
  },
  addPhotoButton: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderStyle: 'dashed',
  },
  addPhotoText: {
    fontSize: 14,
    fontWeight: '500',
    marginTop: 8,
  },
  photoPreview: {
    position: 'relative',
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  replacePhotoButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ageDisplay: {
    fontSize: 14,
    marginTop: 4,
    fontStyle: 'italic',
  },
  helperText: {
    fontSize: 14,
    lineHeight: 18,
    fontStyle: 'italic',
  },
  toggleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  warningText: {
    fontSize: 12,
    fontStyle: 'italic',
    marginBottom: 8,
  },
  dateSelector: {
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
  },
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
    paddingVertical: 16,
  },
  calendarButton: {
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    borderWidth: 1,
  },
  calendarButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});