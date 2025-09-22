import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { User, Tag, Zap } from 'lucide-react-native';
import { Profile, PrivacySettings, ShareCardTheme } from '@/types/armi';
import { applyPrivacySettings } from '@/services/share/Privacy';

interface TemplateMiniCardsProps {
  profiles: Profile[];
  privacySettings: PrivacySettings;
  theme: ShareCardTheme;
  aspectRatio: 'Story' | 'Portrait' | 'Square';
}

export function TemplateMiniCards({ profiles, privacySettings, theme, aspectRatio }: TemplateMiniCardsProps) {
  const processedProfiles = profiles.map(profile => applyPrivacySettings(profile, privacySettings));
  
  // Get 3 most recent profiles
  const recentProfiles = processedProfiles
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 3);
  
  const remainingCount = Math.max(0, processedProfiles.length - 3);
  const containerHeight = aspectRatio === 'Story' ? 1920 : aspectRatio === 'Portrait' ? 1350 : 1080;

  const getRelationshipColor = (relationship: string) => {
    switch (relationship) {
      case 'Family':
        return '#EF4444';
      case 'Friend':
        return '#3B82F6';
      case 'Work':
        return '#059669';
      case 'Dating':
        return '#EC4899';
      default:
        return '#6B7280';
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: theme.background, height: containerHeight }]}>
      {/* Header */}
      <View style={styles.header}>
        <View style={[styles.logoContainer, { backgroundColor: theme.accent }]}>
          <Zap size={24} color={theme.text} />
          <Text style={[styles.logoText, { color: theme.text }]}>ARMi</Text>
        </View>
        <Text style={[styles.title, { color: theme.text }]}>Recent Connections</Text>
        <Text style={[styles.subtitle, { color: theme.primary }]}>
          Latest additions to my network
        </Text>
      </View>

      {/* Mini Cards */}
      <View style={styles.cardsContainer}>
        {recentProfiles.map((profile, index) => (
          <View key={profile.id} style={[styles.miniCard, { backgroundColor: theme.accent, borderColor: theme.border }]}>
            {/* Avatar */}
            <View style={styles.avatarSection}>
              {profile.avatarUrl && privacySettings.showPhotos ? (
                <View style={styles.blurredAvatarContainer}>
                  <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                  <BlurView intensity={60} style={styles.avatarBlur} />
                </View>
              ) : (
                <View style={[styles.avatarPlaceholder, { backgroundColor: getRelationshipColor(profile.relationship) }]}>
                  <Text style={styles.avatarInitial}>
                    {profile.firstName.charAt(0)}
                  </Text>
                </View>
              )}
            </View>

            {/* Profile Info */}
            <View style={styles.cardContent}>
              {privacySettings.showNames === 'hidden' ? (
                <Text style={[styles.profileInitial, { color: theme.text }]}>
                  [Hidden]
                </Text>
              ) : privacySettings.showNames === 'initials' ? (
                <Text style={[styles.profileInitial, { color: theme.text }]}>
                  {profile.firstName.charAt(0)}. {profile.lastName ? profile.lastName.charAt(0) + '.' : ''}
                </Text>
              ) : (
                <Text style={[styles.profileInitial, { color: theme.text }]}>
                  {profile.firstName} {profile.lastName}
                </Text>
              )}
              
              {profile.title && privacySettings.showCompanyTitle && (
                <Text style={[styles.profileTitle, { color: theme.primary }]} numberOfLines={1}>
                  {profile.title}
                </Text>
              )}

              {/* Relationship Badge */}
              <View style={[styles.relationshipBadge, { backgroundColor: getRelationshipColor(profile.relationship) }]}>
                <Text style={styles.relationshipText}>{profile.relationship}</Text>
              </View>

              {/* Tags */}
              {profile.tags.length > 0 && privacySettings.showCompanyTitle && (
                <View style={styles.tagsContainer}>
                  {profile.tags.slice(0, 2).map((tag, tagIndex) => (
                    <View key={tagIndex} style={[styles.tag, { backgroundColor: theme.border }]}>
                      <Tag size={8} color={theme.primary} />
                      <Text style={[styles.tagText, { color: theme.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Notes - Conditional */}
              {profile.notes && privacySettings.showNotes && (
                <Text style={[styles.profileNotes, { color: theme.primary }]} numberOfLines={1}>
                  {profile.notes}
                </Text>
              )}
              
              {/* Phone - Conditional */}
              {profile.phone && privacySettings.showPhone && (
                <Text style={[styles.profilePhone, { color: theme.primary }]} numberOfLines={1}>
                  {profile.phone}
                </Text>
              )}
            </View>
          </View>
        ))}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        {remainingCount > 0 && (
          <View style={[styles.moreChip, { backgroundColor: theme.accent, borderColor: theme.border }]}>
            <Text style={[styles.moreText, { color: theme.text }]}>
              +{remainingCount} more in ARMi
            </Text>
          </View>
        )}
        
        <View style={styles.footerBranding}>
          <Text style={[styles.footerText, { color: theme.primary }]}>Generated with ARMi</Text>
          <Text style={[styles.footerLink, { color: theme.text }]}>armi.app</Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: 1080,
    padding: 40,
  },
  header: {
    alignItems: 'center',
    marginBottom: 60,
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    marginBottom: 20,
  },
  logoText: {
    fontSize: 20,
    fontWeight: '700',
    marginLeft: 8,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  cardsContainer: {
    flex: 1,
    gap: 24,
    justifyContent: 'center',
  },
  miniCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 20,
    padding: 24,
    borderWidth: 1,
  },
  avatarSection: {
    marginRight: 20,
  },
  blurredAvatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
  },
  avatarBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 30,
  },
  avatarPlaceholder: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  cardContent: {
    flex: 1,
  },
  profileInitial: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 4,
  },
  profileTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  relationshipBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 12,
  },
  relationshipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  tagsContainer: {
    flexDirection: 'row',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  profileNotes: {
    fontSize: 12,
    marginTop: 4,
  },
  profilePhone: {
    fontSize: 12,
    marginTop: 4,
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
  },
  moreChip: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginBottom: 30,
  },
  moreText: {
    fontSize: 20,
    fontWeight: '600',
  },
  footerBranding: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 18,
    marginBottom: 4,
  },
  footerLink: {
    fontSize: 20,
    fontWeight: '600',
  },
});