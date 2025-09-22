import { Platform, ActionSheetIOS, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState } from 'react';
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
import { useRouter } from 'expo-router';
import { ArrowLeft, Save, Plus, X, User, Palette, Calendar, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { Heart, Briefcase, House } from 'lucide-react-native';
import { Camera, Image as ImageIcon } from 'lucide-react-native';
import { DatabaseService } from '@/services/DatabaseService';
import { scheduleBirthdayText } from '@/services/Scheduler';
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

export default function CreateProfile() {
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
    lastContactDate: null,
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
  
  const [saving, setSaving] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [selectedTagColor, setSelectedTagColor] = useState(TAG_COLORS[0]);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);

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
      // Initialize date tracking variables
      let birthdayTextDate = null;
      let giftReminderDate = null;
      
      // First, create the profile to get a valid ID
      const baseProfileData = {
        ...profile,
        lastContactDate: new Date().toISOString(), // Set to current date
      };
      
      // Create the profile first to get a valid ID
      const profileId = await DatabaseService.createOrUpdateProfile(baseProfileData);
      
      // Track scheduling results
      let birthdayTextScheduled = false;
      let giftReminderScheduled = false;
      
      // Handle birthday text scheduling independently
      if (profile.birthdayTextEnabled && profile.phone && profile.birthday) {
        try {
          console.log('Scheduling birthday text for profile:', profileId);
          
          // Calculate next birthday occurrence
          const [month, day, year] = profile.birthday.split('/').map(num => parseInt(num));
          const currentYear = new Date().getFullYear();
          let birthdayThisYear = new Date(currentYear, month - 1, day, 9, 0, 0, 0); // 9 AM
          
          // If birthday has passed this year, schedule for next year
          if (birthdayThisYear <= new Date()) {
            birthdayThisYear = new Date(currentYear + 1, month - 1, day, 9, 0, 0, 0);
          }
          
          // Create scheduled text entry
          const scheduledTextData = {
            profileId: profileId,
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
            profileId: profileId.toString(),
          });
          
          // Update notification ID in scheduled text
          if (result.id) {
            await DatabaseService.updateScheduledTextNotificationId(scheduledTextId, result.id);
          }
          
          // Update profile with birthday text info
          await DatabaseService.updateProfileBirthdayTextStatus(profileId, true, scheduledTextId);
          
          birthdayTextScheduled = true;
          birthdayTextDate = new Date(birthdayThisYear);
          console.log('Birthday text scheduled successfully');
        } catch (birthdayError) {
          console.error('Error scheduling birthday text:', birthdayError);
          // Update profile to disable birthday text if scheduling failed
          await DatabaseService.updateProfileBirthdayTextStatus(profileId, false, null);
        }
      }
      
      // Handle gift reminder scheduling independently
      if (profile.giftReminderEnabled && profile.birthday) {
        try {
          console.log('Scheduling gift reminder for profile:', profileId);
          
          // Calculate next birthday occurrence
          const [month, day, year] = profile.birthday.split('/').map(num => parseInt(num));
          const currentYear = new Date().getFullYear();
          let birthdayThisYear = new Date(currentYear, month - 1, day, 9, 0, 0, 0); // 9 AM
          
          // If birthday has passed this year, schedule for next year
          if (birthdayThisYear <= new Date()) {
            birthdayThisYear = new Date(currentYear + 1, month - 1, day, 9, 0, 0, 0);
          }
          
          // Calculate 21 days before birthday
          const calculatedGiftReminderDate = new Date(birthdayThisYear);
          calculatedGiftReminderDate.setDate(calculatedGiftReminderDate.getDate() - 21);
          
          // Create reminder entry
          const reminderData = {
            profileId: profileId,
            title: `Get Gift for ${profile.name}`,
            description: 'Their birthday is in 3 weeks!!',
            type: 'general',
            scheduledFor: calculatedGiftReminderDate,
          };
          
          const reminderId = await DatabaseService.createReminder(reminderData);
          
          // Schedule the notification
          const { scheduleReminder } = await import('@/services/Scheduler');
          const result = await scheduleReminder({
            title: `Get Gift for ${profile.name}`,
            body: 'Their birthday is in 3 weeks!!',
            datePick: calculatedGiftReminderDate,
            timePick: calculatedGiftReminderDate,
            reminderId: reminderId.toString(),
            isGiftReminder: true,
            profileId: profileId.toString(),
          });
          
          // Update notification ID in reminder
          if (result.id) {
            await DatabaseService.updateReminderNotificationId(reminderId, result.id);
          }
          
          // Update profile with gift reminder info
          await DatabaseService.updateProfileGiftReminderStatus(profileId, true, reminderId);
          
          giftReminderScheduled = true;
          giftReminderDate = new Date(calculatedGiftReminderDate);
          console.log('Gift reminder scheduled successfully');
        } catch (giftReminderError) {
          console.error('Error scheduling gift reminder:', giftReminderError);
          // Update profile to disable gift reminder if scheduling failed
          await DatabaseService.updateProfileGiftReminderStatus(profileId, false, null);
        }
      }
      
      // Show consolidated success message
      let alertTitle = 'Profile Created';
      let alertMessage = 'Profile created successfully!';
      
      if (birthdayTextScheduled && giftReminderScheduled) {
        alertMessage += `\n\nBirthday text scheduled for ${birthdayTextDate ? birthdayTextDate.toLocaleDateString() : 'N/A'}.\nGift reminder scheduled for ${giftReminderDate ? giftReminderDate.toLocaleDateString() : 'N/A'}.`;
      } else if (birthdayTextScheduled) {
        alertMessage += `\n\nBirthday text scheduled for ${birthdayTextDate ? birthdayTextDate.toLocaleDateString() : 'N/A'}.`;
        if (profile.giftReminderEnabled) {
          alertMessage += '\n\nGift reminder could not be scheduled. You can enable it later.';
        }
      } else if (giftReminderScheduled) {
        alertMessage += `\n\nGift reminder scheduled for ${giftReminderDate ? giftReminderDate.toLocaleDateString() : 'N/A'}.`;
        if (profile.birthdayTextEnabled) {
          alertMessage += '\n\nBirthday text could not be scheduled. You can enable it later.';
        }
      } else {
        // Neither scheduled, but check if they were requested
        if (profile.birthdayTextEnabled) {
          alertMessage += '\n\nBirthday text could not be scheduled. You can enable it later.';
        }
        if (profile.giftReminderEnabled) {
          alertMessage += '\n\nGift reminder could not be scheduled. You can enable it later.';
        }
      }
      
      Alert.alert(alertTitle, alertMessage, [
        { text: 'OK', onPress: () => router.back() }
      ]);
    } catch (error) {
      console.error('Error saving profile:', error);
      Alert.alert('Error', 'Failed to create profile');
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
      console.log('📸 iOS: Starting ActionSheetIOS for photo selection');
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Choose from Library', 'Take Photo', 'Cancel'],
          cancelButtonIndex: 2,
        },
        async (buttonIndex) => {
          console.log('📸 iOS: ActionSheet button pressed:', buttonIndex);
          try {
            if (buttonIndex === 0) {
              console.log('📸 iOS: User selected "Choose from Library"');
              const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
              console.log('📸 iOS: Media library permission status:', perm.status);
              if (perm.status !== 'granted') {
                Alert.alert('Permission needed', 'Enable Photos in Settings to add a picture.');
                return;
              }
              console.log('📸 iOS: Calling ImagePicker.launchImageLibraryAsync...');
              const result = await ImagePicker.launchImageLibraryAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              console.log('📸 iOS: ImagePicker library result:', result);
              if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                console.log('📸 iOS: Selected asset from library:', asset.uri);
                setSelectedImage(asset);
                updateField('photoUri', asset.uri);
              } else {
                console.log('📸 iOS: Library picker was canceled or no asset selected');
              }
            } else if (buttonIndex === 1) {
              console.log('📸 iOS: User selected "Take Photo"');
              const perm = await ImagePicker.requestCameraPermissionsAsync();
              console.log('📸 iOS: Camera permission status:', perm.status);
              if (perm.status !== 'granted') {
                Alert.alert('Permission needed', 'Enable Camera in Settings to take a picture.');
                return;
              }
              console.log('📸 iOS: Calling ImagePicker.launchCameraAsync...');
              const result = await ImagePicker.launchCameraAsync({
                mediaTypes: ImagePicker.MediaTypeOptions.Images,
                allowsEditing: true,
                aspect: [1, 1],
                quality: 0.8,
              });
              console.log('📸 iOS: ImagePicker camera result:', result);
              if (!result.canceled && result.assets?.[0]) {
                const asset = result.assets[0];
                console.log('📸 iOS: Selected asset from camera:', asset.uri);
                setSelectedImage(asset);
                updateField('photoUri', asset.uri);
              } else {
                console.log('📸 iOS: Camera picker was canceled or no asset selected');
              }
            } else {
              console.log('📸 iOS: User canceled ActionSheet');
            }
          } catch (e) {
            console.error('📸 iOS: Picker error:', e);
            Alert.alert('Error', 'Failed to open picker. Try again.');
          }
        }
      );
    } else {
      console.log('📸 Android: Starting Alert for photo selection');
      Alert.alert('Add Photo', 'Choose an option:', [
        {
          text: 'Choose from Library',
          onPress: async () => {
            console.log('📸 Android: User selected "Choose from Library"');
            const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
            console.log('📸 Android: Media library permission status:', perm.status);
            if (perm.status !== 'granted') {
              Alert.alert('Permission needed', 'Enable Photos in Settings to add a picture.');
              return;
            }
            console.log('📸 Android: Calling ImagePicker.launchImageLibraryAsync...');
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            console.log('📸 Android: ImagePicker library result:', result);
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              console.log('📸 Android: Selected asset from library:', asset.uri);
              setSelectedImage(asset);
              updateField('photoUri', asset.uri);
            } else {
              console.log('📸 Android: Library picker was canceled or no asset selected');
            }
          },
        },
        {
          text: 'Take Photo',
          onPress: async () => {
            console.log('📸 Android: User selected "Take Photo"');
            const perm = await ImagePicker.requestCameraPermissionsAsync();
            console.log('📸 Android: Camera permission status:', perm.status);
            if (perm.status !== 'granted') {
              Alert.alert('Permission needed', 'Enable Camera in Settings to take a picture.');
              return;
            }
            console.log('📸 Android: Calling ImagePicker.launchCameraAsync...');
            const result = await ImagePicker.launchCameraAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              allowsEditing: true,
              aspect: [1, 1],
              quality: 0.8,
            });
            console.log('📸 Android: ImagePicker camera result:', result);
            if (!result.canceled && result.assets?.[0]) {
              const asset = result.assets[0];
              console.log('📸 Android: Selected asset from camera:', asset.uri);
              setSelectedImage(asset);
              updateField('photoUri', asset.uri);
            } else {
              console.log('📸 Android: Camera picker was canceled or no asset selected');
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
    // Remove all non-digit characters
    const digitsOnly = text.replace(/\D/g, '');
    
    // Format with slashes as user types
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
    
    // Update the birthday field with formatted text
    updateField('birthday', formatted);
    
    // Clear age if input is incomplete
    if (formatted.length < 10) {
      updateField('age', null);
      return;
    }
    
    // Only validate and calculate age when we have a complete date (MM/DD/YYYY)
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
      
      // Parse the date
      const [month, day, year] = formatted.split('/').map(num => parseInt(num));
      const inputDate = new Date(year, month - 1, day);
      const today = new Date();
      today.setHours(23, 59, 59, 999); // End of today
      
      // Check if date is valid (handles invalid dates like 02/30/2000)
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
      
      // Check if date is in the future
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
      
      // Calculate and set age
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


  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Create Profile</Text>
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
          <View style={styles.inputGroup}>
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
            style={[styles.textArea, { backgroundColor: theme.accent, color: theme.inputText, borderColor: theme.border }]}
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
          <Text style={[styles.helperText, { color: theme.primary }]}>
            Last contact date is automatically set to today when you create a profile. To change this, please save the profile and edit the Last Contact Date.
          </Text>
        </View>
      </ScrollView>
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