import React, { useState } from 'react';
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
import { Mail, Lock, UserPlus, ArrowLeft, Eye, EyeOff, Shield, Send } from 'lucide-react-native';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';

export default function SignUpScreen() {
  const router = useRouter();
  const { signUp, sendEmailOtp, verifyEmailOtp, loading } = useAuth();
  const { isDark } = useTheme();
  
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState('signup'); // 'signup', 'verify'
  const [otpCode, setOtpCode] = useState('');
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
  React.useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasUppercase = /[A-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    return {
      isValid: password.length >= minLength && hasUppercase && hasNumber && hasSymbol,
      minLength: password.length >= minLength,
      hasUppercase,
      hasNumber,
      hasSymbol,
    };
  };

  const handleSignUp = async () => {
    if (!email.trim()) {
      Alert.alert('Error', 'Please enter your email address');
      return;
    }

    if (!password.trim()) {
      Alert.alert('Error', 'Please enter a password');
      return;
    }

    if (!confirmPassword.trim()) {
      Alert.alert('Error', 'Please confirm your password');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    const passwordValidation = validatePassword(password);
    if (!passwordValidation.isValid) {
      Alert.alert('Invalid Password', 'Password must be at least 8 characters with uppercase, number, and symbol');
      return;
    }

    setIsLoading(true);
    try {
      // Create the account
      console.log('Attempting to sign up with email:', email.trim());
      const result = await signUp(email.trim(), password);
      
      console.log('Signup completed, result:', result);
      
      setStep('verify');
      setCountdown(60);
      Alert.alert('Account Created', 'Please check your email for a 6-digit verification code to complete your registration.');
    } catch (error) {
      console.error('Sign up error:', error);
      Alert.alert('Sign Up Failed', error.message || 'Failed to create account. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otpCode.trim()) {
      Alert.alert('Error', 'Please enter the 6-digit verification code');
      return;
    }

    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Verification code must be 6 digits');
      return;
    }

    setIsLoading(true);
    try {
      await verifyEmailOtp(email.trim(), otpCode.trim());
      Alert.alert('Success', 'Email verified successfully! You can now sign in.', [
        { text: 'OK', onPress: () => router.replace('/auth/sign-in') }
      ]);
    } catch (error) {
      console.error('Verify OTP error:', error);
      Alert.alert('Verification Failed', error.message || 'Invalid verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (countdown > 0) return;

    setIsLoading(true);
    try {
      await sendEmailOtp(email.trim());
      setCountdown(60);
      Alert.alert('Code Sent', 'A new verification code has been sent to your email.');
    } catch (error) {
      console.error('Resend OTP error:', error);
      Alert.alert('Error', 'Failed to resend verification code. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const passwordValidation = validatePassword(password);

  if (step === 'verify') {
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
                style={styles.backButton} 
                onPress={() => setStep('signup')}
              >
                <ArrowLeft size={24} color={theme.text} />
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
                  {email}
                </Text>
              </View>

              {/* OTP Input */}
              <View style={styles.inputGroup}>
                <Text style={[styles.label, { color: theme.text }]}>Verification Code</Text>
                <View style={[styles.inputContainer, { backgroundColor: theme.accent, borderColor: theme.border }]}>
                  <Shield size={20} color={theme.primary} style={styles.inputIcon} />
                  <TextInput
                    style={[styles.input, { color: theme.text, textAlign: 'center', letterSpacing: 8 }]}
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
              style={styles.backButton} 
              onPress={() => router.back()}
            >
              <ArrowLeft size={24} color={theme.text} />
            </TouchableOpacity>
            
            <View style={styles.headerContent}>
              <View style={[styles.logoContainer, { backgroundColor: theme.secondary }]}>
                <UserPlus size={32} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: theme.text }]}>Create Account</Text>
              <Text style={[styles.subtitle, { color: theme.primary }]}>
                Join ARMi to start managing your relationships
              </Text>
            </View>
          </View>

          {/* Form */}
          <View style={[styles.form, { backgroundColor: theme.cardBackground }]}>
            {/* Email Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Email</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.accent, borderColor: theme.border }]}>
                <Mail size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={email}
                  onChangeText={setEmail}
                  placeholder="Enter your email"
                  placeholderTextColor={theme.primary}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.accent, borderColor: theme.border }]}>
                <Lock size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={password}
                  onChangeText={setPassword}
                  placeholder="Create a password"
                  placeholderTextColor={theme.primary}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff size={20} color={theme.primary} />
                  ) : (
                    <Eye size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Password Requirements */}
              {password.length > 0 && (
                <View style={styles.passwordRequirements}>
                  <Text style={[styles.requirementText, { color: passwordValidation.minLength ? '#059669' : theme.primary }]}>
                    ✓ At least 8 characters
                  </Text>
                  <Text style={[styles.requirementText, { color: passwordValidation.hasUppercase ? '#059669' : theme.primary }]}>
                    ✓ One uppercase letter
                  </Text>
                  <Text style={[styles.requirementText, { color: passwordValidation.hasNumber ? '#059669' : theme.primary }]}>
                    ✓ One number
                  </Text>
                  <Text style={[styles.requirementText, { color: passwordValidation.hasSymbol ? '#059669' : theme.primary }]}>
                    ✓ One symbol
                  </Text>
                </View>
              )}
            </View>

            {/* Confirm Password Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.label, { color: theme.text }]}>Confirm Password</Text>
              <View style={[styles.inputContainer, { backgroundColor: theme.accent, borderColor: theme.border }]}>
                <Lock size={20} color={theme.primary} style={styles.inputIcon} />
                <TextInput
                  style={[styles.input, { color: theme.text }]}
                  value={confirmPassword}
                  onChangeText={setConfirmPassword}
                  placeholder="Confirm your password"
                  placeholderTextColor={theme.primary}
                  secureTextEntry={!showConfirmPassword}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
                <TouchableOpacity 
                  style={styles.eyeButton}
                  onPress={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff size={20} color={theme.primary} />
                  ) : (
                    <Eye size={20} color={theme.primary} />
                  )}
                </TouchableOpacity>
              </View>
              
              {/* Password Match Indicator */}
              {confirmPassword.length > 0 && (
                <Text style={[
                  styles.passwordMatchText,
                  { color: password === confirmPassword ? '#059669' : '#EF4444' }
                ]}>
                  {password === confirmPassword ? '✓ Passwords match' : '✗ Passwords do not match'}
                </Text>
              )}
            </View>

            {/* Sign Up Button */}
            <TouchableOpacity
              style={[
                styles.signUpButton,
                { backgroundColor: isDark ? theme.secondary : '#eddfcc' },
                (isLoading || loading || !passwordValidation.isValid || password !== confirmPassword) && styles.buttonDisabled
              ]}
              onPress={handleSignUp}
              disabled={isLoading || loading || !passwordValidation.isValid || password !== confirmPassword}
            >
              <UserPlus size={20} color={isDark ? "#FFFFFF" : "#003C24"} />
              <Text style={[styles.signUpButtonText, { color: isDark ? "#FFFFFF" : "#003C24" }]}>
                {isLoading || loading ? 'Creating Account...' : 'Create Account'}
              </Text>
            </TouchableOpacity>
          </View>

          {/* Footer */}
          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: theme.primary }]}>
              Already have an account?
            </Text>
            <TouchableOpacity onPress={() => router.replace('/auth/sign-in')}>
              <Text style={[styles.signInLink, { color: '#FFFFFF' }]}>
                Sign In
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
  backButton: {
    alignSelf: 'flex-start',
    padding: 8,
    marginBottom: 20,
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
    letterSpacing: 0,
  },
  eyeButton: {
    padding: 4,
  },
  passwordRequirements: {
    marginTop: 8,
    paddingLeft: 4,
  },
  requirementText: {
    fontSize: 12,
    marginBottom: 2,
  },
  passwordMatchText: {
    fontSize: 12,
    marginTop: 4,
    paddingLeft: 4,
  },
  signUpButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
    marginTop: 8,
  },
  signUpButtonText: {
    fontSize: 18,
    fontWeight: '700',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerText: {
    fontSize: 16,
  },
  signInLink: {
    fontSize: 16,
    fontWeight: '600',
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
});