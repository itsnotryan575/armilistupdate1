import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Shield, Send, ArrowLeft, LogOut } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function VerifyEmailScreen() {
  const router = useRouter();
  const { user, sendEmailOtp, verifyEmailOtp, signOut, loading } = useAuth();
  const { isDark } = useTheme();
  
  const [otpCode, setOtpCode] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const theme = {
    text: '#f0f0f0',
    background: isDark ? '#0B0909' : '#003C24',
    primary: isDark ? '#8C8C8C' : '#f0f0f0',
    secondary: isDark ? '#4A5568' : '#012d1c',
    accent: isDark ? '#44444C' : '#004A2F',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    border: isDark ? '#333333' : '#012d1c',
    isDark,
  };

  // Countdown timer for resend button
  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  // Redirect if user becomes confirmed
  useEffect(() => {
    if (user?.email_confirmed_at) {
      router.replace('/(tabs)');
    }
  }, [user?.email_confirmed_at]);

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Verification code must be 6 digits');
      return;
    }

    if (!user?.email) {
      Alert.alert('Error', 'No email found. Please sign up again.');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailOtp(user.email, otpCode.trim());
      
      // Small delay to ensure session is refreshed, then navigate
      setTimeout(() => {
        router.replace('/(tabs)');
      }, 500);
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Verification Failed', error.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;
    if (!user?.email) return;

    setIsLoading(true);
    try {
      await sendEmailOtp(user.email);
      setCountdown(60);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <KeyboardAvoidingView 
        style={styles.keyboardView}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView 
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              style={styles.signOutButton} 
              onPress={handleSignOut}
            >
              <LogOut size={20} color={theme.primary} />
              <Text style={[styles.signOutText, { color: theme.primary }]}>Sign Out</Text>
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={[styles.logoContainer, { backgroundColor: theme.secondary }]}>
                <Shield size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Verify Your Email</Text>
              <Text style={[styles.subtitle, { color: theme.primary }]}>
                Enter the 6-digit code sent to your email
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={[styles.form, { backgroundColor: theme.cardBackground }]}>
            {/* Email Display */}
            <View style={styles.emailDisplay}>
              <Text style={[styles.emailDisplayLabel, { color: theme.primary }]}>
                Code sent to:
              </Text>
              <Text style={[styles.emailDisplayValue, { color: theme.text }]}>
                {user?.email || 'No email'}
              </Text>
            </View>

            {/* OTP Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Verification Code</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.accent, borderColor: theme.border }]}>
                <Shield size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text, textAlign: 'center', letterSpacing: 4 }]}
                  value={otpCode}
                  onChangeText={(text) => setOtpCode(text.replace(/[^0-9]/g, '').slice(0, 6))}
                  placeholder="000000"
                  placeholderTextColor={theme.primary}
                  keyboardType="numeric"
                  maxLength={6}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Resend Code */}
            <View style={styles.resendContainer}>
              <Text style={[styles.resendText, { color: theme.primary }]}>
                Didn't receive the code?
              </Text>
              <TouchableOpacity 
                onPress={handleResendOtp}
                disabled={countdown > 0 || isLoading}
              >
                <Text style={[
                  styles.resendLink, 
                  { color: countdown > 0 ? theme.primary : theme.secondary }
                ]}>
                  {countdown > 0 ? `Resend in ${countdown}s` : 'Resend Code'}
                </Text>
              </TouchableOpacity>
            </View>

            {/* Verify Button */}
            <TouchableOpacity
              style={[
                styles.verifyButton,
                { backgroundColor: isDark ? theme.secondary : '#eddfcc' },
                (isLoading || loading || otpCode.length !== 6) && styles.buttonDisabled
              ]}
              onPress={handleVerifyOtp}
              disabled={isLoading || loading || otpCode.length !== 6}
            >
              <Send size={20} color={isDark ? "#FFFFFF" : "#003C24"} />
              <Text style={[styles.verifyButtonText, { color: isDark ? "#FFFFFF" : "#003C24" }]}>
                {isLoading || loading ? 'Verifying...' : 'Verify Email'}
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingVertical: 40,
  },
  header: {
    marginBottom: 40,
  },
  signOutButton: {
    alignSelf: 'flex-end',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    marginBottom: 20,
    gap: 6,
  },
  signOutText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerContent: {
    alignItems: 'center',
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
  },
  form: {
    borderRadius: 16,
    padding: 24,
    marginBottom: 24,
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
  },
  emailDisplay: {
    alignItems: 'center',
    marginBottom: 24,
    padding: 16,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.1)',
  },
  emailDisplayLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 4,
  },
  emailDisplayValue: {
    fontSize: 16,
    fontWeight: '600',
  },
  resendContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    marginBottom: 24,
  },
  resendText: {
    fontSize: 14,
  },
  resendLink: {
    fontSize: 14,
    fontWeight: '600',
  },
  verifyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  verifyButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});