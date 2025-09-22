import { Profile, PrivacySettings } from '@/types/armi';

export function applyPrivacySettings(profile: Profile, settings: PrivacySettings): Profile {
  const processedProfile: Profile = { ...profile };

  // Apply name privacy
  if (settings.showNames === 'hidden') {
    processedProfile.firstName = '';
    processedProfile.lastName = '';
  } else if (settings.showNames === 'initials') {
    processedProfile.firstName = profile.firstName.charAt(0) + '.';
    processedProfile.lastName = profile.lastName ? profile.lastName.charAt(0) + '.' : '';
  }
  // If 'full', keep names as they are

  // Apply photo privacy
  if (!settings.showPhotos) {
    processedProfile.avatarUrl = undefined;
  }

  // Apply notes privacy
  if (!settings.showNotes) {
    processedProfile.notes = undefined;
  }

  // Apply phone privacy
  if (!settings.showPhone) {
    processedProfile.phone = undefined;
  }

  // Apply company/title privacy
  if (!settings.showCompanyTitle) {
    processedProfile.company = undefined;
    processedProfile.title = undefined;
  }

  // Apply kids/pets privacy
  if (!settings.showKidsPets) {
    processedProfile.kidsCount = undefined;
  }

  return processedProfile;
}

export function getPrivacyPresetSettings(preset: 'Personal' | 'Social' | 'Professional'): PrivacySettings {
  switch (preset) {
    case 'Personal':
      return {
        showNames: 'initials',
        showPhotos: true, // Will be blurred in template
        showNotes: false,
        showPhone: false,
        showCompanyTitle: false,
        showKidsPets: true,
        // Social toggles (not relevant for Personal)
        showBreakdown: false,
        showTopTags: false,
        showGrowth: false,
        includeFooterLink: true,
      };
    case 'Social':
      return {
        showNames: 'hidden', // Stats only, no individual names
        showPhotos: false,
        showNotes: false,
        showPhone: false,
        showCompanyTitle: false,
        showKidsPets: false,
        // Social specific toggles
        showBreakdown: true,
        showTopTags: true,
        showGrowth: true,
        includeFooterLink: true, // Always true, not user-configurable
      };
    case 'Professional':
      return {
        showNames: 'initials', // First initial + Last name
        showPhotos: false,
        showNotes: false,
        showPhone: false,
        showCompanyTitle: true,
        showKidsPets: false,
        // Social toggles (not relevant for Professional)
        showBreakdown: false,
        showTopTags: false,
        showGrowth: false,
        includeFooterLink: true,
      };
    default:
      return getPrivacyPresetSettings('Professional');
  }
}