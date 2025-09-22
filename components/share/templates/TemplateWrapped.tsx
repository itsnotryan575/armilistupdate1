import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Zap, User } from 'lucide-react-native';
import { Profile, PrivacySettings, ShareCardTheme } from '@/types/armi';
import { applyPrivacySettings } from '@/services/share/Privacy';

interface TemplateWrappedProps {
  profiles: Profile[];
  privacySettings: PrivacySettings;
  theme: ShareCardTheme;
  aspectRatio: 'Story' | 'Portrait' | 'Square';
}

export function TemplateWrapped({ profiles, privacySettings, theme, aspectRatio }: TemplateWrappedProps) {
  const processedProfiles = profiles.map(profile => applyPrivacySettings(profile, privacySettings));
  
  // Calculate stats
  const totalCount = processedProfiles.length;
  const relationshipCounts = processedProfiles.reduce((acc, profile) => {
    acc[profile.relationship] = (acc[profile.relationship] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Get top 3 tags
  const tagCounts = processedProfiles.reduce((acc, profile) => {
    profile.tags.forEach(tag => {
      acc[tag] = (acc[tag] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTags = Object.entries(tagCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 3);

  // Calculate new this month
  const thisMonth = new Date();
  thisMonth.setDate(1);
  const newThisMonth = processedProfiles.filter(profile => 
    new Date(profile.createdAt) >= thisMonth
  ).length;

  const containerHeight = aspectRatio === 'Story' ? 1920 : aspectRatio === 'Portrait' ? 1350 : 1080;

  return (
    <View style={[styles.container, { height: containerHeight }]}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        style={styles.gradient}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Zap size={32} color="#FFFFFF" />
            <Text style={styles.logoText}>ARMi</Text>
          </View>
        </View>

        {/* Main Content */}
        <View style={styles.content}>
          <Text style={styles.headline}>
            Managing {totalCount} people in ARMi
          </Text>
          
          <Text style={styles.subheadline}>
            Building meaningful connections
          </Text>

          {/* Stats Grid - Conditional */}
          {privacySettings.showBreakdown && (
            <View style={styles.statsGrid}>
              {Object.entries(relationshipCounts).map(([relationship, count]) => (
                <View key={relationship} style={styles.statItem}>
                  <Text style={styles.statNumber}>{count}</Text>
                  <Text style={styles.statLabel}>{relationship}</Text>
                </View>
              ))}
            </View>
          )}

          {/* Top Tags - Conditional */}
          {privacySettings.showTopTags && topTags.length > 0 && (
            <View style={styles.tagsSection}>
              <Text style={styles.tagsTitle}>Top Tags</Text>
              <View style={styles.tagsContainer}>
                {topTags.map(([tag, count]) => (
                  <View key={tag} style={styles.tagChip}>
                    <Text style={styles.tagText}>{tag}</Text>
                    <Text style={styles.tagCount}>{count}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* New This Month - Conditional */}
          {privacySettings.showGrowth && newThisMonth > 0 && (
            <View style={styles.newSection}>
              <Text style={styles.newText}>
                New this month: +{newThisMonth}
              </Text>
            </View>
          )}

          {/* Proof Strip - Conditional */}
          {privacySettings.showProofStrip && (
            <View style={styles.proofStrip}>
              <Text style={styles.proofStripTitle}>Recent Additions</Text>
              <View style={styles.proofStripList}>
                {processedProfiles.slice(0, 5).map((profile, index) => (
                  <View key={profile.id} style={styles.proofStripItem}>
                    <View style={[styles.proofStripAvatar, { backgroundColor: 'rgba(255, 255, 255, 0.2)' }]}>
                      <User size={12} color="#FFFFFF" />
                    </View>
                    <Text style={styles.proofStripInitial}>
                      {profile.firstName.charAt(0)}.
                    </Text>
                  </View>
                ))}
              </View>
            </View>
          )}
        </View>

        {/* Footer - Conditional */}
        {privacySettings.includeFooterLink && (
          <View style={styles.footer}>
            <Text style={styles.footerText}>Generated with ARMi</Text>
            <Text style={styles.footerLink}>armi.app</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 1080,
    overflow: 'hidden',
  },
  gradient: {
    flex: 1,
    padding: 60,
    justifyContent: 'space-between',
  },
  header: {
    alignItems: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
  },
  logoText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
    marginLeft: 8,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headline: {
    fontSize: 48,
    fontWeight: '700',
    color: '#FFFFFF',
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 56,
  },
  subheadline: {
    fontSize: 24,
    color: 'rgba(255, 255, 255, 0.9)',
    textAlign: 'center',
    marginBottom: 60,
  },
  statsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: 30,
    marginBottom: 60,
  },
  statItem: {
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
    paddingHorizontal: 24,
    paddingVertical: 20,
    borderRadius: 16,
    minWidth: 120,
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.9)',
    textTransform: 'capitalize',
  },
  tagsSection: {
    alignItems: 'center',
    marginBottom: 40,
  },
  tagsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 16,
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 8,
  },
  tagText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '500',
  },
  tagCount: {
    fontSize: 16,
    fontSize: 18,
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
  },
  newSection: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 25,
  },
  newText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    color: 'rgba(255, 255, 255, 0.8)',
    fontSize: 20,
    marginBottom: 4,
  },
  footerLink: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  proofStrip: {
    alignItems: 'center',
    marginTop: 40,
  },
  proofStripTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.9)',
    marginBottom: 12,
  },
  proofStripList: {
    flexDirection: 'row',
    gap: 8,
  },
  proofStripItem: {
    alignItems: 'center',
    gap: 4,
  },
  proofStripAvatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  proofStripInitial: {
    fontSize: 10,
    fontWeight: '500',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  },
});