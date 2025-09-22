import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, ScrollView } from 'react-native';
import { ArrowLeft, Check, Users, Heart, Briefcase } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '@/context/ThemeContext';

export default function UsageSettings() {
  const router = useRouter();
  const { isDark, usageMode, setUsageMode } = useTheme();

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

  const usageOptions = [
    {
      key: 'personal' as const,
      title: 'Personal',
      subtitle: 'Built for your real ones — family, close friends, and the ones who matter most. Because thoughtful isn\'t accidental.',
      icon: Heart,
      color: '#EC4899',
      label: 'People'
    },
    {
      key: 'social' as const,
      title: 'Social',
      subtitle: 'Call it what you want — a lineup, a rotation, a vibe. For the socially active who like to keep their options in play.',
      icon: Users,
      color: '#3B82F6',
      label: 'Roster'
    },
    {
      key: 'professional' as const,
      title: 'Professional',
      subtitle: 'Made for the movers and shakers — colleagues, clients, and industry contacts. Keep it sharp, organized, and always a step ahead.',
      icon: Briefcase,
      color: '#059669',
      label: 'Network'
    }
  ];

  const handleUsageSelect = (mode: 'social' | 'personal' | 'professional') => {
    setUsageMode(mode);
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: theme.background }]}>
      <View style={[styles.header, { borderBottomColor: theme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={theme.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: theme.text }]}>Usage</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <Text style={[styles.sectionTitle, { color: theme.text }]}>App Style</Text>
        <Text style={[styles.sectionSubtitle, { color: theme.primary }]}>
          Choose how the app feels and what terminology it uses
        </Text>

        <View style={styles.optionsContainer}>
          {usageOptions.map((option, index) => {
            const IconComponent = option.icon;
            const isSelected = usageMode === option.key;
            
            return (
              <TouchableOpacity
                key={option.key}
                style={[
                  styles.usageOption,
                  { 
                    backgroundColor: theme.cardBackground,
                    borderColor: isSelected ? option.color : theme.border,
                    borderWidth: isSelected ? 2 : 1
                  },
                  index === usageOptions.length - 1 && { marginBottom: 0 }
                ]}
                onPress={() => handleUsageSelect(option.key)}
              >
                <View style={styles.optionContent}>
                  <View style={styles.optionLeft}>
                    <View style={[styles.iconContainer, { backgroundColor: option.color }]}>
                      <IconComponent size={20} color="#FFFFFF" />
                    </View>
                    <View style={styles.optionText}>
                      <View style={styles.titleRow}>
                        <Text style={[styles.optionTitle, { color: theme.text }]}>
                          {option.title}
                        </Text>
                        <View style={[styles.labelBadge, { backgroundColor: theme.accent }]}>
                          <Text style={[styles.labelText, { color: theme.text }]}>
                            "{option.label}"
                          </Text>
                        </View>
                      </View>
                      <Text style={[styles.optionSubtitle, { color: theme.primary }]}>
                        {option.subtitle}
                      </Text>
                    </View>
                  </View>
                  
                  {isSelected && (
                    <View style={[styles.checkContainer, { backgroundColor: option.color }]}>
                      <Check size={16} color="#FFFFFF" />
                    </View>
                  )}
                </View>
              </TouchableOpacity>
            );
          })}
        </View>

        <View style={[styles.previewContainer, { backgroundColor: theme.cardBackground }]}>
          <Text style={[styles.previewTitle, { color: theme.text }]}>Preview</Text>
          <View style={[styles.previewCard, { backgroundColor: theme.accent }]}>
            <Text style={[styles.previewText, { color: theme.text }]}>
              Your app will use "{usageOptions.find(opt => opt.key === usageMode)?.label}" terminology
            </Text>
            <Text style={[styles.previewSubtext, { color: theme.primary }]}>
              Current mode: {usageOptions.find(opt => opt.key === usageMode)?.title}
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
    marginBottom: 32,
  },
  usageOption: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
    marginTop: 2,
  },
  optionText: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    flexWrap: 'wrap',
  },
  optionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginRight: 12,
  },
  labelBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  labelText: {
    fontSize: 12,
    fontWeight: '500',
  },
  optionSubtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  checkContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
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