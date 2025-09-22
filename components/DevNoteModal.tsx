import React from 'react';
import { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { X, Zap, Users, Calendar, Brain, Wrench, Check } from 'lucide-react-native';
import { useTheme } from '@/context/ThemeContext';

interface DevNoteModalProps {
  visible: boolean;
  onClose: (dontShowAgain: boolean) => void;
}

export function DevNoteModal({ visible, onClose }: DevNoteModalProps) {
  const { isDark } = useTheme();
  const [dontShowAgain, setDontShowAgain] = useState(false);

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

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <SafeAreaView style={styles.safeArea}>
          <View style={[styles.modal, { backgroundColor: theme.cardBackground }]}>
            {/* Header */}
            <View style={[styles.header, { borderBottomColor: theme.border }]}>
              <View style={styles.headerContent}>
                <View style={[styles.iconContainer, { backgroundColor: theme.secondary }]}>
                  <Brain size={24} color="#FFFFFF" />
                </View>
                <View style={styles.headerText}>
                  <Text style={[styles.title, { color: theme.text }]}>Note From Devs</Text>
                  <Text style={[styles.subtitle, { color: theme.primary }]}>Welcome to ARMi!</Text>
                </View>
              </View>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <X size={24} color={theme.primary} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
              {/* Welcome Message */}
              <View style={styles.section}>
                <Text style={[styles.welcomeText, { color: theme.text }]}>
                  Thanks for trying ARMi! We're excited to have you as one of our early users.
                </Text>
              </View>

              {/* Experimental Notice */}
              <View style={[styles.noticeBox, { backgroundColor: theme.accent, borderColor: theme.border }]}>
                <View style={styles.noticeHeader}>
                  <Zap size={20} color="#F59E0B" />
                  <Text style={[styles.noticeTitle, { color: theme.text }]}>Experimental App</Text>
                </View>
                <Text style={[styles.noticeText, { color: theme.text }]}>
                  ARMi is very new and experimental. We're a small team working hard to build something amazing, 
                  but our AI features are still learning and may make mistakes when processing your interactions.
                </Text>
              </View>

              {/* Current Features */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>What's Available Now</Text>
                
                <View style={styles.featureItem}>
                  <Wrench size={18} color="#3B82F6" />
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>Manual Controls</Text>
                    <Text style={[styles.featureDescription, { color: theme.primary }]}>
                      We've added manual ways to create, edit, and manage profiles and reminders as a reliable backup 
                      while we perfect ARMi's AI capabilities.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <Users size={18} color="#059669" />
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>Profile Management</Text>
                    <Text style={[styles.featureDescription, { color: theme.primary }]}>
                      Keep track of the important people in your life with detailed profiles, tags, and notes.
                    </Text>
                  </View>
                </View>

                <View style={styles.featureItem}>
                  <Calendar size={18} color="#8B5CF6" />
                  <View style={styles.featureText}>
                    <Text style={[styles.featureTitle, { color: theme.text }]}>Reminders</Text>
                    <Text style={[styles.featureDescription, { color: theme.primary }]}>
                      Set reminders to stay connected with people and never miss important moments.
                    </Text>
                  </View>
                </View>
              </View>

              {/* Coming Soon */}
              <View style={styles.section}>
                <Text style={[styles.sectionTitle, { color: theme.text }]}>What's Coming</Text>
                <Text style={[styles.comingSoonText, { color: theme.primary }]}>
                  We have tons of exciting features planned, including:
                </Text>
                
                <View style={styles.comingSoonList}>
                  <Text style={[styles.comingSoonItem, { color: theme.text }]}>
                    • Fully operational AI chat assistant
                  </Text>
                  <Text style={[styles.comingSoonItem, { color: theme.text }]}>
                    • Smart reminders that schedule at the perfect time so you never miss a moment
                  </Text>
                  <Text style={[styles.comingSoonItem, { color: theme.text }]}>
                    • Intelligent check-in suggestions
                  </Text>
                  <Text style={[styles.comingSoonItem, { color: theme.text }]}>
                    • Automated profile and reminder creation
                  </Text>
                  <Text style={[styles.comingSoonItem, { color: theme.text }]}>
                    • Advanced relationship insights
                  </Text>
                  <Text style={[styles.comingSoonItem, { color: theme.text }]}>
                    • And much, much more!
                  </Text>
                </View>
              </View>

              {/* Feedback Encouragement */}
              <View style={[styles.feedbackBox, { backgroundColor: theme.accent, borderColor: theme.border }]}>
                <Text style={[styles.feedbackTitle, { color: theme.text }]}>Help Us Improve</Text>
                <Text style={[styles.feedbackText, { color: theme.primary }]}>
                  Your feedback is incredibly valuable to us. Found a bug? Have an idea? 
                  Let us know through the feedback option in Settings!
                </Text>
              </View>
            </ScrollView>

            {/* Footer */}
            <View style={[styles.footer, { borderTopColor: theme.border }]}>
              {/* Don't Show Again Option */}
              <View style={[styles.checkboxContainer, { backgroundColor: theme.accent, borderColor: theme.border }]}>
                <TouchableOpacity
                  style={styles.checkboxRow}
                  onPress={() => setDontShowAgain(!dontShowAgain)}
                >
                  <View style={[
                    styles.checkbox,
                    { 
                      backgroundColor: dontShowAgain ? theme.secondary : 'transparent',
                      borderColor: theme.border 
                    }
                  ]}>
                    {dontShowAgain && (
                      <Check size={16} color="#FFFFFF" />
                    )}
                  </View>
                  <Text style={[styles.checkboxText, { color: theme.text }]}>
                    Don't show this message again
                  </Text>
                </TouchableOpacity>
                <Text style={[styles.checkboxSubtext, { color: theme.primary }]}>
                  You can always find app updates and information in Settings → About
                </Text>
              </View>

              <TouchableOpacity
                style={[styles.acknowledgeButton, { backgroundColor: theme.secondary }]}
                onPress={() => onClose(dontShowAgain)}
              >
                <Text style={styles.acknowledgeButtonText}>Got it, let's explore!</Text>
              </TouchableOpacity>
            </View>
          </View>
        </SafeAreaView>

      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  safeArea: {
    flex: 1,
    justifyContent: 'center',
    paddingHorizontal: 20,
  },
  modal: {
    borderRadius: 20,
    maxHeight: '85%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderBottomWidth: 1,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  headerText: {
    flex: 1,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 16,
    fontWeight: '500',
  },
  closeButton: {
    padding: 8,
    marginLeft: 16,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 20,
  },
  section: {
    marginBottom: 24,
  },
  welcomeText: {
    fontSize: 18,
    lineHeight: 26,
    fontWeight: '500',
    textAlign: 'center',
  },
  noticeBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 24,
  },
  noticeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  noticeTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  noticeText: {
    fontSize: 16,
    lineHeight: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
  },
  featureText: {
    flex: 1,
    marginLeft: 12,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  featureDescription: {
    fontSize: 15,
    lineHeight: 22,
  },
  comingSoonText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: 16,
  },
  comingSoonList: {
    paddingLeft: 8,
  },
  comingSoonItem: {
    fontSize: 15,
    lineHeight: 24,
    marginBottom: 8,
  },
  feedbackBox: {
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    marginBottom: 20,
  },
  feedbackTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 8,
  },
  feedbackText: {
    fontSize: 15,
    lineHeight: 22,
  },
  footer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderTopWidth: 1,
  },
  acknowledgeButton: {
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  acknowledgeButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
  checkboxContainer: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 20,
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  checkboxText: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  checkboxSubtext: {
    fontSize: 14,
    lineHeight: 18,
    marginLeft: 36,
  },
});