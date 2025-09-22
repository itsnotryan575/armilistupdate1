import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, useColorScheme } from 'react-native';
import { Settings, User, Bell, Shield, Palette, Info, ChevronRight, MessageSquare, LogOut, Share } from 'lucide-react-native';
import { router } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';
import { useAuth } from '@/context/AuthContext';

export default function SettingsScreen() {
  const { isDark } = useTheme();
  const { signOut } = useAuth();

  const theme = {
    background: isDark ? '#0B0909' : '#003C24',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    text: '#f0f0f0',
    secondaryText: '#f0f0f0',
    border: isDark ? '#2A2A2A' : '#012d1c',
    primary: '#f0f0f0',
  };

  const settingsItems = [
    { icon: User, title: 'Profile', subtitle: 'Manage your account', action: 'profile' },
    { icon: Bell, title: 'Notifications', subtitle: 'Push notifications and alerts', action: 'notifications' },
    { icon: Share, title: 'Share Studio', subtitle: 'Create and share your ARMi cards', action: 'share' },
    { icon: MessageSquare, title: 'Send Feedback', subtitle: 'Report bugs, suggest features', action: 'feedback' },
    { icon: User, title: 'Usage', subtitle: 'Choose your app style and terminology', action: 'usage' },
    { icon: Palette, title: 'Appearance', subtitle: 'Theme and display options', action: 'appearance' },
    { icon: Info, title: 'About', subtitle: 'App version and information', action: 'about' },
    { icon: LogOut, title: 'Sign Out', subtitle: 'Sign out of your account', action: 'signout' },
  ];

  const handleSignOut = async () => {
    try {
      await signOut();
      router.replace('/auth/sign-in');
    } catch (error) {
      console.error('Sign out error:', error);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background }]}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.header}>
          <Settings size={32} color={theme.text} />
          <Text style={[styles.title, { color: theme.text }]}>Settings</Text>
        </View>

        <View style={styles.section}>
          {settingsItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.settingItem,
                { 
                  backgroundColor: theme.cardBackground,
                  borderBottomColor: theme.border,
                  borderBottomWidth: index < settingsItems.length - 1 ? 1 : 0
                }
              ]}
              onPress={() => {
                if (item.action === 'feedback') {
                  router.push('/feedback/submit');
                } else if (item.action === 'share') {
                  router.push('/(share)/ShareScreen');
                } else if (item.action === 'profile') {
                  router.push('/settings/profile');
                } else if (item.action === 'appearance') {
                  router.push('/settings/appearance');
                } else if (item.action === 'usage') {
                  router.push('/settings/usage');
                } else if (item.action === 'notifications') {
                  router.push('/settings/notifications');
                } else if (item.action === 'about') {
                  router.push('/settings/about');
                } else if (item.action === 'signout') {
                  handleSignOut();
                }
              }}
            >
              <View style={styles.settingContent}>
                <View style={styles.settingLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: theme.background }]}>
                    <item.icon size={20} color={theme.primary} />
                  </View>
                  <View style={styles.settingText}>
                    <Text style={[styles.settingTitle, { color: theme.text }]}>
                      {item.title}
                    </Text>
                    <Text style={[styles.settingSubtitle, { color: theme.secondaryText }]}>
                      {item.subtitle}
                    </Text>
                  </View>
                </View>
                <ChevronRight size={20} color={theme.secondaryText} />
              </View>
            </TouchableOpacity>
          ))}
        </View>

        <View style={styles.footer}>
          <Text style={[styles.footerText, { color: theme.secondaryText }]}>
            Version 1.2.10
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 60,
    paddingBottom: 30,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    marginLeft: 12,
  },
  section: {
    marginHorizontal: 20,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 20,
  },
  settingItem: {
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  settingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  settingText: {
    flex: 1,
  },
  settingTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 2,
  },
  settingSubtitle: {
    fontSize: 14,
  },
  footer: {
    alignItems: 'center',
    paddingVertical: 20,
  },
  footerText: {
    fontSize: 14,
  },
});