import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  TextInput,
  Modal,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, User, Mail, LogOut, Shield, CircleCheck as CheckCircle, CircleAlert as AlertCircle } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { format } from 'date-fns';

export default function ProfileSettings() {
  const router = useRouter();
  const { user, signOut, updateEmail } = useAuth();
  const { isDark } = useTheme();
  
  const [showChangeEmail, setShowChangeEmail] = useState(false);
  const [newEmail, setNewEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

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

  const handleSignOut = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: async () => {
            try {
              await signOut();
              router.replace('/auth/sign-in');
            } catch (error) {
              Alert.alert('Error', 'Failed to sign out. Please try again.');
            }
          }
        }
      ]
    );
  };

  const handleChangeEmail = async () => {
    if (!newEmail.trim()) {
      Alert.alert('Error', 'Please enter a new email address');
      return;
    }

    if (newEmail === user?.email) {
      Alert.alert('Error', 'New email must be different from current email');
      return;
    }

    setIsLoading(true);
    try {
      await updateEmail(newEmail.trim());
      Alert.alert(
        'Verification Required', 
        'A verification email has been sent to your new email address. Please check your email and click the verification link.',
        [{ text: 'OK', onPress: () => setShowChangeEmail(false) }]
      );
      setNewEmail('');
    } catch (error) {
      console.error('Change email error:', error);
      Alert.alert('Error', error.message || 'Failed to update email');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'MMM d, yyyy');
    } catch {
      return 'Unknown';
    }
  };

  const accountActions = [
    {
      title: 'Change Email',
      subtitle: 'Update your email address',
      icon: Mail,
      color: '#059669',
      action: () => setShowChangeEmail(true)
    },
    {
      title: 'Sign Out',
      subtitle: 'Sign out of your account',
      icon: LogOut,
      color: '#EF4444',
      action: handleSignOut
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Profile</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* User Info */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.userHeader}>
            <View style={[styles.avatar, { backgroundColor: theme.secondary }]}>
              <User size={32} color="#FFFFFF" />
            </View>
            <View style={styles.userInfo}>
              <Text style={[styles.userEmail, { color: theme.text }]}>
                {user?.email || 'No email'}
              </Text>
              <View style={styles.verificationStatus}>
                {user?.email_confirmed_at ? (
                  <>
                    <CheckCircle size={16} color="#059669" />
                    <Text style={[styles.verifiedText, { color: '#059669' }]}>
                      Verified
                    </Text>
                  </>
                ) : (
                  <>
                    <AlertCircle size={16} color="#F59E0B" />
                    <Text style={[styles.unverifiedText, { color: '#F59E0B' }]}>
                      Unverified
                    </Text>
                  </>
                )}
              </View>
            </View>
          </View>
        </View>

        {/* Account Information */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Information</Text>
          
          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <Mail size={18} color={theme.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: theme.primary }]}>Email</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {user?.email || 'No email'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <User size={18} color={theme.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: theme.primary }]}>Member Since</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {user?.created_at ? formatDate(user.created_at) : 'Unknown'}
                </Text>
              </View>
            </View>
          </View>

          <View style={styles.infoItem}>
            <View style={styles.infoLeft}>
              <Shield size={18} color={theme.primary} />
              <View style={styles.infoText}>
                <Text style={[styles.infoLabel, { color: theme.primary }]}>Account Status</Text>
                <Text style={[styles.infoValue, { color: theme.text }]}>
                  {user?.email_confirmed_at ? 'Verified' : 'Pending Verification'}
                </Text>
              </View>
            </View>
          </View>
        </View>

        {/* Account Actions */}
        <View style={[styles.section, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.sectionTitle, { color: theme.text }]}>Account Actions</Text>
          
          {accountActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.actionItem,
                  { borderBottomColor: theme.border },
                  index === accountActions.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={action.action}
              >
                <View style={styles.actionLeft}>
                  <View style={[styles.actionIcon, { backgroundColor: action.color }]}>
                    <IconComponent size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.actionText}>
                    <Text style={[styles.actionTitle, { color: theme.text }]}>
                      {action.title}
                    </Text>
                    <Text style={[styles.actionSubtitle, { color: theme.primary }]}>
                      {action.subtitle}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
        </View>
      </ScrollView>

      {/* Change Email Modal */}
      <Modal
        visible={showChangeEmail}
        transparent
        animationType="slide"
        onRequestClose={() => setShowChangeEmail(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: theme.border }]}>
              <Text style={[styles.modalTitle, { color: theme.text }]}>Change Email</Text>
              <TouchableOpacity onPress={() => setShowChangeEmail(false)}>
                <ArrowLeft size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <View style={styles.modalContent}>
              <View style={styles.currentEmailInfo}>
                <Text style={[styles.currentEmailLabel, { color: theme.primary }]}>
                  Current Email
                </Text>
                <Text style={[styles.currentEmailValue, { color: theme.text }]}>
                  {user?.email}
                </Text>
              </View>

              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>New Email</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.accent, borderColor: theme.border }]}>
                  <Mail size={20} color={theme.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text }]}
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="Enter new email"
                    placeholderTextColor={theme.primary}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
              </View>

              <View style={[styles.warningBox, { backgroundColor: theme.accent, borderColor: '#F59E0B' }]}>
                <AlertCircle size={16} color="#F59E0B" />
                <Text style={[styles.warningText, { color: theme.text }]}>
                  You'll need to verify your new email address before the change takes effect.
                </Text>
              </View>

              <TouchableOpacity
                style={[
                  styles.modalButton,
                  { backgroundColor: theme.secondary },
                  isLoading && styles.buttonDisabled
                ]}
                onPress={handleChangeEmail}
                disabled={isLoading}
              >
                <Text style={styles.modalButtonText}>
                  {isLoading ? 'Updating...' : 'Update Email'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userEmail: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 4,
  },
  verificationStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  verifiedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  unverifiedText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  infoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  infoText: {
    marginLeft: 12,
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 2,
  },
  infoValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  actionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  actionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 14,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modal: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '700',
  },
  modalContent: {
    padding: 20,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 8,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    paddingVertical: 4,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    fontSize: 16,
    paddingVertical: 12,
    letterSpacing: 0,
  },
  currentEmailInfo: {
    marginBottom: 24,
    padding: 16,
    borderRadius: 8,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  currentEmailLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  currentEmailValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  warningBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    marginBottom: 20,
    gap: 8,
  },
  warningText: {
    fontSize: 14,
    lineHeight: 18,
    flex: 1,
  },
  modalButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});