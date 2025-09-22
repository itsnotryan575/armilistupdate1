export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  avatarUrl?: string;
  relationship: 'Friend' | 'Family' | 'Work' | 'Dating' | 'Other';
  tags: string[];
  notes?: string;
  phone?: string;
  company?: string;
  title?: string;
  kidsCount?: number;
  birthday?: string;
  createdAt: string; // ISO
  birthdayTextEnabled?: boolean;
  birthdayTextScheduledTextId?: number;
  giftReminderEnabled?: boolean;
  giftReminderId?: number;
}

export type RelationshipType = 'Friend' | 'Family' | 'Work' | 'Dating' | 'Other';

export type PrivacyPreset = 'Personal' | 'Social' | 'Professional';

export type TemplateType = 'Stats' | 'BlurredPeek' | 'MiniCards';

export type AspectRatio = 'Story' | 'Portrait' | 'Square';

export interface ShareCardTheme {
  background: string;
  text: string;
  primary: string;
  secondary: string;
  accent: string;
  border: string;
}

export interface PrivacySettings {
  showNames: 'full' | 'initials' | 'hidden';
  showPhotos: boolean;
  showNotes: boolean;
  showPhone: boolean;
  showCompanyTitle: boolean;
  showKidsPets: boolean;
  // Social preset specific toggles
  showBreakdown: boolean;
  showTopTags: boolean;
  showGrowth: boolean;
  includeFooterLink: boolean;
}

export interface Tag {
  text: string;
  color?: {
    light: string;
    dark: string;
    text: string;
  };
}