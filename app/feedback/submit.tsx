import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  SafeAreaView,
  Alert,
  Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Send, Bug, Lightbulb, TriangleAlert as AlertTriangle, MessageSquare } from 'lucide-react-native';
import { DatabaseService } from '@/services/DatabaseService';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useTheme } from '@/context/ThemeContext';

const FEEDBACK_TYPES = [
  { key: 'bug', label: 'Bug Report', icon: Bug, color: '#EF4444', description: 'Report crashes, errors, or unexpected behavior' },
  { key: 'feature', label: 'Feature Request', icon: Lightbulb, color: '#F59E0B', description: 'Suggest new features or improvements' },
  { key: 'issue', label: 'General Issue', icon: AlertTriangle, color: '#8B5CF6', description: 'Report usability issues or problems' },
  { key: 'feedback', label: 'General Feedback', icon: MessageSquare, color: '#3B82F6', description: 'Share your thoughts and suggestions' },
];

export default function SubmitFeedback() {
  const router = useRouter();
  const { isDark } = useTheme();
  
  const [selectedType, setSelectedType] = useState('feedback');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [userEmail, setUserEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const theme = {
    text: '#f0f0f0',
    background: isDark ? '#0B0909' : '#003C24',
    primary: isDark ? '#8C8C8C' : '#f0f0f0',
    secondary: isDark ? '#4A5568' : '#012d1c',
    accent: isDark ? '#44444C' : '#002818',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    border: isDark ? '#333333' : '#012d1c',
    inputBackground: isDark ? '#44444C' : '#f0f0f0',
    inputText: isDark ? '#f0f0f0' : '#003C24',
    inputBorder: isDark ? '#333333' : '#8C8C8C',
    isDark,
  };

  const getDeviceInfo = () => {
    return {
      deviceName: Device.deviceName || 'Unknown Device',
      deviceType: Device.deviceType || 'Unknown',
      osName: Device.osName || Platform.OS,
      osVersion: Device.osVersion || 'Unknown',
      platform: Platform.OS,
      appVersion: Constants.expoConfig?.version || '1.0.0',
    };
  };

  const handleSubmit = async () => {
    if (!subject.trim()) {
      Alert.alert('Error', 'Please enter a subject for your feedback');
      return;
    }

    if (!message.trim()) {
      Alert.alert('Error', 'Please enter your feedback message');
      return;
    }

    setIsSubmitting(true);
    try {
      const deviceInfo = getDeviceInfo();
      const deviceInfoString = `${deviceInfo.deviceName} (${deviceInfo.osName} ${deviceInfo.osVersion})`;
      
      await DatabaseService.submitFeedback({
        type: selectedType,
        subject: subject.trim(),
        message: message.trim(),
        userEmail: userEmail.trim() || null,
        deviceInfo: deviceInfoString,
        appVersion: deviceInfo.appVersion,
      });

      Alert.alert(
        'Thank You!',
        'Your feedback has been submitted successfully. We appreciate your input and will review it soon.',
        [
          {
            text: 'OK',
            onPress: () => router.back()
          }
        ]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Failed to submit feedback. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedTypeInfo = FEEDBACK_TYPES.find(type => type.key === selectedType);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Send Feedback</Text>
        <TouchableOpacity 
          style={[styles.submitButton, { backgroundColor: theme.secondary }]} 
          onPress={handleSubmit}
          disabled={isSubmitting}
        >
          <Send size={20} color="#FFFFFF" />
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Feedback Type Selection */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Feedback Type</Text>
          
          {FEEDBACK_TYPES.map((type) => {
            const IconComponent = type.icon;
            const isSelected = selectedType === type.key;
            
            return (
              <TouchableOpacity
                key={type.key}
                style={[
                  styles.typeOption,
                  { 
                    backgroundColor: isSelected ? type.color : theme.accent,
                    borderColor: theme.border 
                  }
                ]}
                onPress={() => setSelectedType(type.key)}
              >
                <View style={styles.typeOptionLeft}>
                  <IconComponent size={20} color={isSelected ? '#FFFFFF' : theme.text} />
                  <View style={styles.typeOptionText}>
                    <Text style={[
                      styles.typeOptionTitle,
                      { color: isSelected ? '#FFFFFF' : theme.text }
                    ]}>
                      {type.label}
                    </Text>
                    <Text style={[
                      styles.typeOptionDescription,
                      { color: isSelected ? 'rgba(255,255,255,0.8)' : theme.primary }
                    ]}>
                      {type.description}
                    </Text>
                  </View>
                </View>
                {isSelected && (
                  <View style={[styles.selectedIndicator, { backgroundColor: '#FFFFFF' }]}>
                    <View style={[styles.selectedDot, { backgroundColor: type.color }]} />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Subject */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Subject *</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.inputText, borderColor: theme.inputBorder }]}
            value={subject}
            onChangeText={setSubject}
            placeholder="Brief description of your feedback..."
            placeholderTextColor={isDark ? theme.primary : '#8C8C8C'}
            maxLength={100}
          />
          <Text style={[styles.characterCount, { color: theme.primary }]}>
            {subject.length}/100
          </Text>
        </View>

        {/* Message */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Message *</Text>
          <TextInput
            style={[styles.textArea, { backgroundColor: theme.inputBackground, color: theme.inputText, borderColor: theme.inputBorder }]}
            value={message}
            onChangeText={setMessage}
            placeholder={`Please provide detailed information about your ${selectedTypeInfo?.label.toLowerCase()}...`}
            placeholderTextColor={isDark ? theme.primary : '#8C8C8C'}
            multiline
            numberOfLines={6}
            maxLength={1000}
          />
          <Text style={[styles.characterCount, { color: theme.primary }]}>
            {message.length}/1000
          </Text>
        </View>

        {/* Email (Optional) */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Email (Optional)</Text>
          <TextInput
            style={[styles.input, { backgroundColor: theme.inputBackground, color: theme.inputText, borderColor: theme.inputBorder }]}
            value={userEmail}
            onChangeText={setUserEmail}
            placeholder="your.email@example.com"
            placeholderTextColor={isDark ? theme.primary : '#8C8C8C'}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <Text style={[styles.helperText, { color: theme.primary }]}>
            Provide your email if you'd like us to follow up with you
          </Text>
        </View>

        {/* Device Info Preview */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Device Information</Text>
          <Text style={[styles.deviceInfo, { color: theme.primary }]}>
            This information will be included to help us debug issues:
          </Text>
          <View style={[styles.deviceInfoBox, { backgroundColor: theme.accent, borderColor: theme.border }]}>
            <Text style={[styles.deviceInfoText, { color: theme.text }]}>
              Device: {getDeviceInfo().deviceName || 'Unknown Device'}
            </Text>
            <Text style={[styles.deviceInfoText, { color: theme.text }]}>
              OS: {getDeviceInfo().osName} {getDeviceInfo().osVersion}
            </Text>
            <Text style={[styles.deviceInfoText, { color: theme.text }]}>
              App Version: {getDeviceInfo().appVersion}
            </Text>
          </View>
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
  submitButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
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
  typeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
  },
  typeOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  typeOptionText: {
    marginLeft: 12,
    flex: 1,
  },
  typeOptionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  typeOptionDescription: {
    fontSize: 14,
    lineHeight: 18,
  },
  selectedIndicator: {
    width: 20,
    height: 20,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
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
    minHeight: 120,
    textAlignVertical: 'top',
    letterSpacing: 0,
  },
  characterCount: {
    fontSize: 12,
    textAlign: 'right',
    marginTop: 4,
  },
  helperText: {
    fontSize: 14,
    marginTop: 8,
    lineHeight: 18,
  },
  deviceInfo: {
    fontSize: 14,
    marginBottom: 8,
  },
  deviceInfoBox: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
  },
  deviceInfoText: {
    fontSize: 14,
    marginBottom: 4,
  },
});