import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView, Linking, Alert } from 'react-native';
import { ArrowLeft, Info, Heart, Code, Mail, ExternalLink, Shield, FileText, Users, Zap } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import { Platform } from 'react-native';

export default function AboutSettings() {
  const router = useRouter();
  const { isDark } = useTheme();

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

  const appVersion = Constants.expoConfig?.version || '1.0.8';
  const buildNumber = Constants.expoConfig?.extra?.buildNumber || '1';
  const deviceInfo = {
    deviceName: Device.deviceName || 'Unknown Device',
    osName: Device.osName || Platform.OS,
    osVersion: Device.osVersion || 'Unknown',
    platform: Platform.OS,
  };

  const handleLinkPress = async (url: string, title: string) => {
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        Alert.alert('Error', `Cannot open ${title}`);
      }
    } catch (error) {
      Alert.alert('Error', `Failed to open ${title}`);
    }
  };

  const aboutSections = [
    {
      title: 'App Information',
      items: [
        { label: 'Version', value: appVersion, icon: Info },
        { label: 'Build', value: buildNumber, icon: Code },
        { label: 'Platform', value: Platform.OS === 'ios' ? 'iOS' : Platform.OS === 'android' ? 'Android' : 'Web', icon: Info },
        { label: 'Device', value: `${deviceInfo.deviceName}`, icon: Info },
        { label: 'OS Version', value: `${deviceInfo.osName} ${deviceInfo.osVersion}`, icon: Info },
      ]
    },
    {
      title: 'About ARMi',
      items: [
        { 
          label: 'What is ARMi?', 
          value: 'ARMi (Artificial Relationship Management Intelligence) helps you maintain meaningful connections with the people in your life through smart reminders and organized contact management.',
          multiline: true,
          icon: Zap 
        },
        { 
          label: 'Our Mission', 
          value: 'To help people build and maintain stronger relationships by remembering the details that matter most.',
          multiline: true,
          icon: Heart 
        },
      ]
    },
    {
      title: 'Development Team',
      items: [
        { 
          label: 'Team Size', 
          value: 'Small, dedicated team of developers and designers',
          icon: Users 
        },
        { 
          label: 'Development Status', 
          value: 'Early beta - actively developing new features',
          icon: Code 
        },
      ]
    },
    {
      title: 'Legal & Privacy',
      items: [
        { 
          label: 'Data Storage', 
          value: 'Your data is securely stored on your device and may be backed up or processed using secure infrastructure to enhance functionality and ensure a better user experience. These terms may be updated from time to time.',
          multiline: true,
          icon: Shield 
        },
        { 
          label: 'Privacy Policy', 
          value: 'We value your trust and are committed to handling your information responsibly. Your data may be used to improve our services or offer personalized features. These terms may be updated from time to time.',
          multiline: true,
          icon: FileText 
        },
      ]
    }
  ];

  const quickActions = [
    {
      title: 'Send Feedback',
      subtitle: 'Report bugs or suggest features',
      icon: Mail,
      color: '#3B82F6',
      action: () => router.push('/feedback/submit')
    },
    {
      title: 'Rate ARMi',
      subtitle: 'Help us grow by rating the app',
      icon: Heart,
      color: '#EC4899',
      action: () => {
        Alert.alert(
          'Rate ARMi',
          'Thank you for considering rating ARMi! App store ratings will be available when we launch publicly.',
          [{ text: 'OK' }]
        );
      }
    }
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>About</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* App Logo/Header */}
        <View style={[styles.appHeader, { backgroundColor: theme.cardBackground }]}>
          <View style={[styles.appIcon, { backgroundColor: theme.secondary }]}>
            <Zap size={32} color="#FFFFFF" />
          </View>
          <Text style={[styles.appName, { color: theme.text }]}>ARMi</Text>
          <Text style={[styles.appTagline, { color: theme.primary }]}>
            Artificial Relationship Management Intelligence
          </Text>
          <View style={[styles.versionBadge, { backgroundColor: theme.accent }]}>
            <Text style={[styles.versionText, { color: theme.text }]}>v{appVersion}</Text>
          </View>
        </View>

        {/* Quick Actions */}
        <View style={styles.quickActionsContainer}>
          {quickActions.map((action, index) => {
            const IconComponent = action.icon;
            return (
              <TouchableOpacity
                key={index}
                style={[styles.quickAction, { backgroundColor: theme.cardBackground }]}
                onPress={action.action}
              >
                <View style={[styles.quickActionIcon, { backgroundColor: action.color }]}>
                  <IconComponent size={20} color="#FFFFFF" />
                </View>
                <View style={styles.quickActionText}>
                  <Text style={[styles.quickActionTitle, { color: theme.text }]}>
                    {action.title}
                  </Text>
                  <Text style={[styles.quickActionSubtitle, { color: theme.primary }]}>
                    {action.subtitle}
                  </Text>
                </View>
                <ExternalLink size={16} color={theme.primary} />
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Information Sections */}
        {aboutSections.map((section, sectionIndex) => (
          <View key={sectionIndex} style={[styles.section, { backgroundColor: theme.cardBackground }]}>
            <Text style={[styles.sectionTitle, { color: theme.text }]}>
              {section.title}
            </Text>
            
            {section.items.map((item, itemIndex) => {
              const IconComponent = item.icon;
              return (
                <View 
                  key={itemIndex} 
                  style={[
                    styles.infoItem,
                    { borderBottomColor: theme.border },
                    itemIndex === section.items.length - 1 && { borderBottomWidth: 0 }
                  ]}
                >
                  <View style={styles.infoItemLeft}>
                    <IconComponent size={18} color={theme.primary} style={styles.infoIcon} />
                    <View style={styles.infoContent}>
                      <Text style={[styles.infoLabel, { color: theme.primary }]}>
                        {item.label}
                      </Text>
                      <Text style={[
                        styles.infoValue,
                        { color: theme.text },
                        item.multiline && styles.infoValueMultiline
                      ]}>
                        {item.value}
                      </Text>
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        ))}

        {/* Development Status */}
        <View style={[styles.statusContainer, { backgroundColor: theme.cardBackground }]}>
          <View style={styles.statusHeader}>
            <Code size={20} color="#F59E0B" />
            <Text style={[styles.statusTitle, { color: theme.text }]}>Development Status</Text>
          </View>
          <Text style={[styles.statusText, { color: theme.primary }]}>
            ARMi is currently in early beta development. We're actively working on new features and improvements. 
            Your feedback helps us prioritize what to build next!
          </Text>
          
          <View style={styles.statusMetrics}>
            <View style={styles.statusMetric}>
              <Text style={[styles.statusMetricValue, { color: theme.text }]}>Beta</Text>
              <Text style={[styles.statusMetricLabel, { color: theme.primary }]}>Release Stage</Text>
            </View>
            <View style={styles.statusMetric}>
              <Text style={[styles.statusMetricValue, { color: theme.text }]}>Active</Text>
              <Text style={[styles.statusMetricLabel, { color: theme.primary }]}>Development</Text>
            </View>
            <View style={styles.statusMetric}>
              <Text style={[styles.statusMetricValue, { color: theme.text }]}>4-6 Week</Text>
              <Text style={[styles.statusMetricLabel, { color: theme.primary }]}>Updates</Text>
            </View>
          </View>
        </View>

        {/* Footer */}
        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.primary }]}>
            Made with ❤️ by the ARMi team
          </Text>
          <Text style={[styles.footerSubtext, { color: theme.primary }]}>
            © 2025 ARMi. All rights reserved.
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
  appHeader: {
    alignItems: 'center',
    paddingVertical: 32,
    borderRadius: 16,
    marginBottom: 24,
  },
  appIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  appName: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
  },
  appTagline: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 20,
  },
  versionBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  versionText: {
    fontSize: 14,
    fontWeight: '600',
  },
  quickActionsContainer: {
    marginBottom: 24,
  },
  quickAction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
  },
  quickActionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  quickActionText: {
    flex: 1,
  },
  quickActionTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  quickActionSubtitle: {
    fontSize: 14,
  },
  section: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 16,
  },
  infoItem: {
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  infoItemLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  infoIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  infoContent: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 16,
    lineHeight: 22,
  },
  infoValueMultiline: {
    lineHeight: 24,
  },
  statusContainer: {
    borderRadius: 12,
    padding: 20,
    marginBottom: 24,
  },
  statusHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  statusTitle: {
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
  statusText: {
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 20,
  },
  statusMetrics: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  statusMetric: {
    alignItems: 'center',
  },
  statusMetricValue: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  statusMetricLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  footerText: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  footerSubtext: {
    fontSize: 14,
  },
});