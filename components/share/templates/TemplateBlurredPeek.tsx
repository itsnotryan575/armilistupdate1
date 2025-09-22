import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';
import { BlurView } from 'expo-blur';
import { User, Tag, Zap, Phone } from 'lucide-react-native';
import { Profile, PrivacySettings, ShareCardTheme } from '@/types/armi';
import { applyPrivacySettings } from '@/services/share/Privacy';

interface TemplateBlurredPeekProps {
  profiles: Profile[];
  privacySettings: PrivacySettings;
  theme: ShareCardTheme;
  aspectRatio: 'Story' | 'Portrait' | 'Square';
}

export function TemplateBlurredPeek({ profiles, privacySettings, theme, aspectRatio }: TemplateBlurredPeekProps) {
  const processedProfiles = profiles.map(profile => applyPrivacySettings(profile, privacySettings));
  const displayProfiles = processedProfiles.slice(0, 6);
  const remainingCount = Math.max(0, processedProfiles.length - 6);
  
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
        <Text style={[styles.title, { color: theme.text }]}>My People</Text>
        <Text style={[styles.subtitle, { color: theme.primary }]}>
          {processedProfiles.length} connections
        </Text>
      </View>

      {/* Profile Cards */}
      <View style={styles.profilesList}>
        {displayProfiles.map((profile, index) => (
          <View key={profile.id} style={[styles.profileCard, { backgroundColor: theme.accent, borderColor: theme.border }]}>
            <View style={styles.profileHeader}>
              {/* Avatar */}
              <View style={styles.avatarContainer}>
                {profile.avatarUrl && privacySettings.showPhotos ? (
                  <View style={styles.blurredAvatarContainer}>
                    <Image source={{ uri: profile.avatarUrl }} style={styles.avatar} />
                    <BlurView intensity={80} style={styles.avatarBlur} />
                  </View>
                ) : (
                  <View style={[styles.avatarPlaceholder, { backgroundColor: theme.border }]}>
                    <User size={20} color={theme.primary} />
                  </View>
                )}
              </View>

              {/* Profile Info */}
              <View style={styles.profileInfo}>
                <View style={styles.nameContainer}>
                  {privacySettings.showNames === 'hidden' ? null : (
                    privacySettings.showNames === 'initials' ? (
                      <BlurView intensity={50} style={styles.nameBlur}>
                        <Text style={[styles.profileName, { color: theme.text }]}>
                          {profile.firstName} {profile.lastName}
                        </Text>
                      </BlurView>
                    ) : (
                      <Text style={[styles.profileName, { color: theme.text }]}>
                        {profile.firstName} {profile.lastName}
                      </Text>
                    )
                  )}
                  {privacySettings.showNames === 'hidden' && (
                    <Text style={[styles.profileName, { color: theme.text }]}>
                      [Name Hidden]
                    </Text>
                  )}
                </View>

                {profile.title && privacySettings.showCompanyTitle && (
                  <Text style={[styles.profileTitle, { color: theme.primary }]} numberOfLines={1}>
                    {profile.title}
                  </Text>
                )}

                {/* Relationship Badge */}
                <View style={[styles.relationshipBadge, { backgroundColor: getRelationshipColor(profile.relationship) }]}>
                  <Text style={styles.relationshipText}>{profile.relationship}</Text>
                </View>
              </View>
            </View>

            {/* Notes (Blurred) */}
            {profile.notes && privacySettings.showNotes && (
              <View style={styles.notesContainer}>
                <BlurView intensity={60} style={styles.notesBlur}>
                  <Text style={[styles.notes, { color: theme.text }]} numberOfLines={2}>
                    {profile.notes}
                  </Text>
                </BlurView>
              </View>
            )}
            {/* Info Chips Container */}
            <View style={styles.infoChipsContainer}>
              {/* Tags */}
              {profile.tags.length > 0 && (
                <View style={styles.tagsContainer}>
                  {profile.tags.slice(0, 2).map((tag, tagIndex) => (
                    <View key={tagIndex} style={[styles.tag, { backgroundColor: theme.border }]}>
                      <Tag size={8} color={theme.primary} />
                      <Text style={[styles.tagText, { color: theme.primary }]}>{tag}</Text>
                    </View>
                  ))}
                </View>
              )}
              
              {/* Company/Title Info Chip */}
              {(profile.company || profile.title) && privacySettings.showCompanyTitle && (
                <View style={[styles.infoChip, { backgroundColor: theme.border }]}>
                  <User size={12} color="#059669" />
                  <Text style={[styles.infoChipText, { color: theme.primary }]}>
                    {profile.title || profile.company}
                  </Text>
                </View>
              )}
              
              {/* Phone Info Chip */}
              {profile.phone && privacySettings.showPhone && (
                <View style={[styles.infoChip, { backgroundColor: theme.border }]}>
                  <Phone size={12} color="#3B82F6" />
                  <Text style={[styles.infoChipText, { color: theme.primary }]}>
                    {profile.phone}
                  </Text>
                </View>
              )}
            </View>
          </View>
        ))}

        {/* More Indicator */}
        {remainingCount > 0 && (
          <View style={[styles.moreChip, { backgroundColor: theme.accent, borderColor: theme.border }]}>
            <Text style={[styles.moreText, { color: theme.text }]}>
              +{remainingCount} more managed
            </Text>
          </View>
        )}
      </View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={[styles.footerText, { color: theme.primary }]}>Generated with ARMi</Text>
        <Text style={[styles.footerLink, { color: theme.text }]}>armi.app</Text>
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
    marginBottom: 40,
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
    fontSize: 36,
    fontWeight: '700',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
  },
  profilesList: {
    flex: 1,
    gap: 16,
  },
  profileCard: {
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
  },
  profileHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  avatarContainer: {
    marginRight: 16,
  },
  blurredAvatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
  },
  avatarBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    borderRadius: 24,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileInfo: {
    flex: 1,
  },
  nameContainer: {
    marginBottom: 4,
  },
  nameBlur: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  profileName: {
    fontSize: 18,
    fontWeight: '600',
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  profileTitle: {
    fontSize: 14,
    marginBottom: 8,
  },
  relationshipBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  relationshipText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  notesContainer: {
    marginBottom: 12,
  },
  notesBlur: {
    borderRadius: 8,
    overflow: 'hidden',
  },
  notes: {
    fontSize: 14,
    lineHeight: 20,
    paddingHorizontal: 4,
    paddingVertical: 2,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  tagText: {
    fontSize: 14,
    fontWeight: '500',
  },
  infoChipsContainer: {
    gap: 8,
  },
  infoChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    gap: 4,
  },
  infoChipText: {
    fontSize: 11,
    fontWeight: '500',
  },
  moreChip: {
    alignSelf: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 20,
    borderWidth: 1,
    marginTop: 20,
  },
  moreText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginTop: 40,
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