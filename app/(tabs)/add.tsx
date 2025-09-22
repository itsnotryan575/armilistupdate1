import { Platform, ActionSheetIOS, Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import React, { useState, useRef } from 'react';
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
  KeyboardAvoidingView
} from 'react-native';
import { Plus, Mic, Send, MessageSquarePlus } from 'lucide-react-native';
import * as Speech from 'expo-speech';
import { understandUserCommand } from '@/services/gptService';
import { ArmiIntent } from '@/types/armi-intents';
import IntentPreviewCard from '@/components/IntentPreviewCard';
import { addProfile } from '@/services/profileService';
import { scheduleReminderFromIntent } from '@/services/reminderService';
import { scheduleText } from '@/services/textService';
import { DatabaseService } from '@/services/DatabaseService';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function AddInteractionScreen() {
  const [inputText, setInputText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [selectedImage, setSelectedImage] = useState(null);
  const [preview, setPreview] = useState<ArmiIntent | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState([]);
  const inputRef = useRef(null);
  const { isDark } = useTheme();

  const theme = {
    text: '#f0f0f0',
    background: isDark ? '#0B0909' : '#003C24',
    primary: isDark ? '#8C8C8C' : '#f0f0f0',
    secondary: isDark ? '#4A5568' : '#012d1c',
    accent: isDark ? '#44444C' : '#002818',
    inputBackground: isDark ? '#1A1A1A' : '#002818',
    border: isDark ? '#333333' : '#012d1c',
  };

  const handleSubmit = async () => {
    if (!inputText.trim()) {
      Alert.alert('Input Required', 'Please tell me what you want to do.');
      return;
    }

    setIsProcessing(true);
    setError(null);
    try {
      // Use the new GPT service to understand user intent
      const result = await understandUserCommand(inputText.trim(), {}, "lite");
      
      // Add user message to chat
      setChatMessages(prev => [...prev, { 
        type: 'user', 
        text: inputText 
      }]);
      
      // Show preview for user confirmation
      setPreview(result);
    } catch (error) {
      console.error('Error understanding command:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to understand your request. Please try again.';
      setError(errorMessage);
      
      // Add error message to chat
      setChatMessages(prev => [...prev, { 
        type: 'user', 
        text: inputText 
      }, { 
        type: 'ai', 
        text: `Sorry, I had trouble understanding that: ${errorMessage}`
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const executeIntent = async (intent: ArmiIntent) => {
    try {
      setIsProcessing(true);
      
      switch (intent.intent) {
        case 'add_profile':
          // Add selected image to profile data if available
          const profileArgs = { ...intent.args };
          const profileId = await addProfile(profileArgs);
          
          // If there's a selected image, update the profile with the photo
          if (selectedImage && profileId) {
            await DatabaseService.createOrUpdateProfile({
              id: profileId,
              photoUri: selectedImage.uri,
              // Include other required fields to prevent overwriting
              name: profileArgs.name,
              relationship: profileArgs.relationshipType || 'acquaintance',
              phone: profileArgs.phone || null,
              notes: profileArgs.notes || null,
              tags: profileArgs.tags || [],
              lastContactDate: new Date().toISOString(),
            });
          }
          
          setChatMessages(prev => [...prev, { 
            type: 'ai', 
            text: `Great! I've added ${intent.args.name} to your contacts.`
          }]);
          break;
          
        case 'edit_profile':
          Alert.alert('Feature Coming Soon', 'Profile editing via AI is not yet implemented. Please use the manual edit option.');
          setChatMessages(prev => [...prev, { 
            type: 'ai', 
            text: 'Profile editing via AI is coming soon. For now, please use the manual edit option in your contacts.'
          }]);
          break;
          
        case 'schedule_text':
          await scheduleText(intent.args);
          setChatMessages(prev => [...prev, { 
            type: 'ai', 
            text: `Perfect! I've scheduled your text message for ${new Date(intent.args.when).toLocaleString()}.`
          }]);
          break;
          
        case 'schedule_reminder':
          await scheduleReminderFromIntent(intent.args);
          setChatMessages(prev => [...prev, { 
            type: 'ai', 
            text: `Got it! I've scheduled a reminder for ${new Date(intent.args.when).toLocaleString()}.`
          }]);
          break;
          
        case 'none':
        default:
          setChatMessages(prev => [...prev, { 
            type: 'ai', 
            text: intent.args.explanation || 'I couldn\'t understand what you wanted to do. Could you try rephrasing?'
          }]);
          break;
      }
      
      // Reset form
      setPreview(null);
      setInputText('');
      setSelectedImage(null);
      
      // Focus input for next interaction
      setTimeout(() => {
        inputRef.current?.focus();
      }, 1000);
      
    } catch (error) {
      console.error('Error executing intent:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to execute action. Please try again.';
      
      // Check for date validation errors and show friendly message
      if (errorMessage.includes('Invalid date format')) {
        Alert.alert('Date Format Error', 'Please specify dates and times more clearly (e.g., "tomorrow at 3pm", "next Friday at 10am").');
        setChatMessages(prev => [...prev, { 
          type: 'ai', 
          text: 'I need a clearer date and time. Try something like "tomorrow at 3pm" or "next Friday at 10am".'
        }]);
      } else {
        Alert.alert('Error', errorMessage);
        setChatMessages(prev => [...prev, { 
          type: 'ai', 
          text: `Sorry, I encountered an error: ${errorMessage}`
        }]);
      }
      
      // Don't reset preview on error so user can try again
      
      setChatMessages(prev => [...prev, { 
        type: 'ai', 
        text: 'Sorry, I encountered an error while trying to do that. Please try again.'
      }]);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleCancelPreview = () => {
    setPreview(null);
    setError(null);
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
              } else {
                console.log('📸 iOS: Camera picker was canceled or no asset selected');
              }
            } else {
              console.log('📸 iOS: User canceled ActionSheet');
            }
          } catch (e: any) {
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
            } else {
              console.log('📸 Android: Camera picker was canceled or no asset selected');
            }
          },
        },
        { text: 'Cancel', style: 'cancel' },
      ]);
    }
  };

  const handleVoiceInput = async () => {
    if (Platform.OS === 'web') {
      Alert.alert(
        'Voice Input',
        'Voice input is not available on web. Please type your interaction.',
        [{ text: 'OK' }]
      );
      return;
    }

    try {
      setIsListening(true);
      // Note: This is a placeholder for voice-to-text functionality
      // In a real implementation, you would use expo-speech or react-native-voice
      Alert.alert(
        'Voice Input',
        'Voice input feature coming soon! For now, please type your interaction.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error with voice input:', error);
      Alert.alert('Error', 'Failed to start voice input. Please try again.');
    } finally {
      setIsListening(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      {/* Header */}
      <View style={styles.header}>
        <MessageSquarePlus size={32} color={theme.text} />
        <Text style={[styles.headerTitle, { color: theme.text }]}>ARMi Chat</Text>
      </View>

      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          keyboardShouldPersistTaps="handled"
        >
          <View style={styles.welcomeMessage}>
            <Text style={[styles.welcomeText, { color: theme.text }]}>
              Tell me about someone in your life
            </Text>
            <Text style={[styles.welcomeSubtext, { color: theme.primary }]}>
              I'll help you remember the important details and stay connected
            </Text>
          </View>

          {chatMessages.map((message, index) => (
            <View key={index} style={styles.messageContainer}>
              <View style={[
                message.type === 'user' ? styles.userMessage : styles.botMessage,
                { backgroundColor: message.type === 'user' ? theme.secondary : theme.accent }
              ]}>
                <Text style={[styles.messageText, { 
                  color: message.type === 'user' ? '#FFFFFF' : theme.text 
                }]}>
                  {message.text}
                </Text>
              </View>
            </View>
          ))}

          {isProcessing && (
            <View style={styles.messageContainer}>
              <View style={[styles.botMessage, { backgroundColor: theme.accent }]}>
                <Text style={[styles.messageText, { color: theme.text }]}>
                  Processing your request with AI...
                </Text>
              </View>
            </View>
          )}

          {error && (
            <View style={styles.messageContainer}>
              <View style={[styles.botMessage, { backgroundColor: '#7F1D1D' }]}>
                <Text style={[styles.messageText, { color: '#FFFFFF' }]}>
                  {error}
                </Text>
              </View>
            </View>
          )}

          {preview && (
            <View style={styles.messageContainer}>
              <IntentPreviewCard
                intent={preview}
                onConfirm={() => executeIntent(preview)}
                onCancel={handleCancelPreview}
                theme={theme}
              />
            </View>
          )}

          {selectedImage && (
            <View style={styles.messageContainer}>
              <View style={[styles.imagePreview, { backgroundColor: theme.accent }]}>
                <Image source={{ uri: selectedImage.uri }} style={styles.previewImage} />
                <TouchableOpacity 
                  style={[styles.removeImageButton, { backgroundColor: theme.secondary }]}
                  onPress={() => setSelectedImage(null)}
                >
                  <Text style={styles.removeImageText}>×</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </ScrollView>

        <View style={[styles.inputContainer, { backgroundColor: theme.background, borderTopColor: theme.border }]}>
          <View style={[styles.inputRow, { backgroundColor: theme.inputBackground, borderColor: theme.border }]}>
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.cardBackground, borderColor: theme.border }]}
              onPress={handleAddPhoto}
            >
              <Plus size={20} color={theme.primary} />
            </TouchableOpacity>

            <TextInput
              ref={inputRef}
              style={[styles.textInput, { color: theme.text }]}
              multiline
              placeholder="Tell me what you want to do..."
              placeholderTextColor={theme.primary}
              value={inputText}
              onChangeText={setInputText}
              maxLength={1000}
              autoFocus
            />

            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: theme.accent }]}
              onPress={handleVoiceInput}
            >
              <Mic size={20} color={isListening ? theme.secondary : theme.text} />
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={[
              styles.sendButton,
             { backgroundColor: inputText.trim() && !isProcessing ? theme.secondary : theme.secondary },
              (!inputText.trim() || isProcessing) && styles.sendButtonDisabled
            ]}
            onPress={handleSubmit}
            disabled={!inputText.trim() || isProcessing}
          >
           <Send size={20} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  headerTitle: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  keyboardView: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
  },
  messagesContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
  },
  welcomeMessage: {
    alignItems: 'center',
    marginBottom: 40,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 8,
  },
  welcomeSubtext: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  messageContainer: {
    marginBottom: 16,
  },
  userMessage: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomRightRadius: 4,
  },
  botMessage: {
    alignSelf: 'flex-start',
    maxWidth: '80%',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 20,
    borderBottomLeftRadius: 4,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 22,
  },
  inputContainer: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
  },
  inputRow: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-end',
    borderRadius: 25,
    borderWidth: 1,
    paddingHorizontal: 4,
    paddingVertical: 4,
    marginRight: 12,
    minHeight: 50,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
    margin: 2,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    lineHeight: 22,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 120,
    minHeight: 36,
    letterSpacing: 0,
  },
  sendButton: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  sendButtonDisabled: {
    opacity: 0.5,
  },
  imagePreview: {
    alignSelf: 'flex-end',
    maxWidth: '80%',
    borderRadius: 20,
    borderBottomRightRadius: 4,
    padding: 8,
    position: 'relative',
  },
  previewImage: {
    width: 200,
    height: 200,
    borderRadius: 12,
  },
  removeImageButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeImageText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
});