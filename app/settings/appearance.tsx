import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView } from 'react-native';
import { ArrowLeft, Check, Sun, Moon, Smartphone } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function AppearanceSettings() {
  const router = useRouter();
  const { isDark, themePreference, setThemePreference } = useTheme();

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

  const themeOptions = [
    {
      key: 'light' as const,
      title: 'Light',
      subtitle: 'Always use light theme',
      icon: Sun,
      color: '#F59E0B'
    },
    {
      key: 'dark' as const,
      title: 'Dark',
      subtitle: 'Always use dark theme',
      icon: Moon,
      color: '#6366F1'
    },
    {
      key: 'system' as const,
      title: 'System',
      subtitle: 'Follow device settings',
      icon: Smartphone,
      color: '#059669'
    }
  ];

  const handleThemeSelect = (preference: 'light' | 'dark' | 'system') => {
    setThemePreference(preference);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Appearance</Text>
        <View style={styles.headerSpacer} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>Theme</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.primary }]}>
          Choose how the app looks on your device
        </Text>

        <View style={[styles.optionsContainer, { backgroundColor: theme.cardBackground }]}>
          {themeOptions.map((option, index) => {
            const IconComponent = option.icon;
            const isSelected = themePreference === option.key;
            
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.themeOption,
                  { borderBottomColor: theme.border },
                  index === themeOptions.length - 1 && { borderBottomWidth: 0 }
                ]}
                onPress={() => handleThemeSelect(option.key)}
              >
                <View style={styles.optionLeft}>
                  <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                    <IconComponent size={20} color="#FFFFFF" />
                  </View>
                  <View style={styles.optionText}>
                    <Text style={[styles.optionTitle, { color: theme.text }]}>
                      {option.title}
                    </Text>
                    <Text style={[styles.optionSubtitle, { color: theme.primary }]}>
                      {option.subtitle}
                    </Text>
                  </View>
                </View>
                
                {isSelected && (
                  <View style={[styles.checkContainer, { backgroundColor: theme.secondary }]}>
                    <Check size={16} color="#FFFFFF" />
                  </View>
                )}
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.previewContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.previewTitle, { color: theme.text }]}>Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: theme.accent }]}>
            <Text style={[styles.previewText, { color: theme.text }]}>
              This is how your app will look
            </Text>
            <Text style={[styles.previewSubtext, { color: theme.primary }]}>
              Current theme: {themeOptions.find(opt => opt.key === themePreference)?.title}
            </Text>
          </View>
        </View>
      </View>
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
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
  },
  sectionSubtitle: {
    fontSize: 16,
    lineHeight: 22,
    marginBottom: 32,
  },
  optionsContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 32,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  optionLeft: {
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
    marginRight: 16,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 2,
  },
  optionSubtitle: {
    fontSize: 14,
    lineHeight: 18,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  previewContainer: {
    borderRadius: 12,
    padding: 20,
  },
  previewTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  previewCard: {
    padding: 16,
    borderRadius: 8,
  },
  previewText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  previewSubtext: {
    fontSize: 14,
  },
});