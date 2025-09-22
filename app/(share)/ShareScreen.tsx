import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
  Modal,
  Switch,
} from 'react-native';
import { useRouter } from 'expo-router';
import { ArrowLeft, Settings as SettingsIcon, Download, Share as ShareIcon, Ratio as AspectRatioIcon, ChevronDown, X } from 'lucide-react-native';
import { ShareCard, ShareCardRef } from '@/components/share/ShareCard';
import { ShareService } from '@/services/share/ShareService';
import { getPrivacyPresetSettings } from '@/services/share/Privacy';
import { analytics } from '@/services/analytics/analytics';
import { shareCardTheme } from '@/theme/shareCardTheme';
import { useTheme } from '@/context/ThemeContext';
import { Profile, PrivacyPreset, TemplateType, AspectRatio, PrivacySettings } from '@/types/armi';
import { DatabaseService } from '@/services/DatabaseService';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Define preset-template mapping
const PRESET_TEMPLATE_MAPPING: Record<PrivacyPreset, TemplateType> = {
  'Personal': 'BlurredPeek',
  'Social': 'Stats',
  'Professional': 'MiniCards',
};

// Hook to fetch real roster data from DatabaseService
function useRoster() {
  const [profiles, setProfiles] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    React.useCallback(() => {
      loadProfiles();
    }, [])
  );

  const loadProfiles = async () => {
    try {
      setLoading(true);
      const data = await DatabaseService.getAllProfiles();
      
      // Convert database profiles to Share Card Profile format
      const convertedProfiles: Profile[] = data.map(dbProfile => ({
        id: dbProfile.id.toString(),
        firstName: dbProfile.name.split(' ')[0] || dbProfile.name,
        lastName: dbProfile.name.split(' ').slice(1).join(' ') || '',
        avatarUrl: dbProfile.photoUri || undefined,
        relationship: mapRelationship(dbProfile.relationship),
        tags: Array.isArray(dbProfile.tags) 
          ? dbProfile.tags.map(tag => typeof tag === 'string' ? tag : tag.text)
          : [],
        notes: dbProfile.notes || undefined,
        phone: dbProfile.phone || undefined,
        company: undefined, // Not stored in current DB schema
        title: dbProfile.job || undefined,
        kidsCount: Array.isArray(dbProfile.kids) ? dbProfile.kids.length : undefined,
        createdAt: dbProfile.createdAt || new Date().toISOString(),
      }));
      
      setProfiles(convertedProfiles);
    } catch (error) {
      console.error('Error loading profiles for ARMi cards:', error);
      // Fallback to fake data for development/testing
      setProfiles(debugGenerateFakeRoster(15));
    } finally {
      setLoading(false);
    }
  };

  const mapRelationship = (dbRelationship: string): 'Friend' | 'Family' | 'Work' | 'Dating' | 'Other' => {
    switch (dbRelationship?.toLowerCase()) {
      case 'family':
        return 'Family';
      case 'friend':
        return 'Friend';
      case 'coworker':
        return 'Work';
      case 'partner':
        return 'Dating';
      default:
        return 'Other';
    }
  };

  return { profiles, loading };
}

export function debugGenerateFakeRoster(count: number): Profile[] {
  const firstNames = ['Alex', 'Sarah', 'Mike', 'Emma', 'David', 'Lisa', 'John', 'Maria', 'Chris', 'Anna', 'Ryan', 'Sophie', 'Jake', 'Olivia', 'Matt'];
  const lastNames = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez', 'Hernandez', 'Lopez', 'Gonzalez', 'Wilson', 'Anderson'];
  const relationships: Array<'Friend' | 'Family' | 'Work' | 'Dating' | 'Other'> = ['Friend', 'Family', 'Work', 'Dating', 'Other'];
  const companies = ['Google', 'Apple', 'Microsoft', 'Amazon', 'Meta', 'Netflix', 'Spotify', 'Uber', 'Airbnb', 'Tesla'];
  const titles = ['Software Engineer', 'Product Manager', 'Designer', 'Data Scientist', 'Marketing Manager', 'Sales Director', 'Consultant', 'Analyst', 'Developer', 'Coordinator'];
  const tags = ['tech', 'creative', 'outdoorsy', 'foodie', 'traveler', 'fitness', 'music', 'art', 'sports', 'books', 'gaming', 'photography'];

  const profiles: Profile[] = [];
  
  for (let i = 0; i < count; i++) {
    const firstName = firstNames[i % firstNames.length];
    const lastName = lastNames[i % lastNames.length];
    const relationship = relationships[i % relationships.length];
    
    // Create date within last 6 months
    const createdAt = new Date();
    createdAt.setDate(createdAt.getDate() - Math.floor(Math.random() * 180));
    
    profiles.push({
      id: `profile-${i + 1}`,
      firstName,
      lastName,
      avatarUrl: `https://images.pexels.com/photos/${1000000 + i}/pexels-photo-${1000000 + i}.jpeg?auto=compress&cs=tinysrgb&w=150&h=150&dpr=2`,
      relationship,
      tags: tags.slice(i % 3, (i % 3) + 2 + Math.floor(Math.random() * 2)),
      notes: Math.random() > 0.5 ? `Great person to know. Met through ${relationship.toLowerCase()} connections.` : undefined,
      phone: Math.random() > 0.6 ? `+1${Math.floor(Math.random() * 9000000000) + 1000000000}` : undefined,
      company: relationship === 'Work' ? companies[i % companies.length] : undefined,
      title: relationship === 'Work' ? titles[i % titles.length] : undefined,
      kidsCount: Math.random() > 0.7 ? Math.floor(Math.random() * 3) + 1 : undefined,
      createdAt: createdAt.toISOString(),
    });
  }
  
  return profiles;
}

export default function ShareScreen() {
  const router = useRouter();
  const { isDark, usageMode, isLoaded } = useTheme();
  const shareCardRef = useRef<ShareCardRef>(null);
  
  const [templateType, setTemplateType] = useState<TemplateType>('Stats');
  const [privacyPreset, setPrivacyPreset] = useState<PrivacyPreset>('Social');
  const [aspectRatio, setAspectRatio] = useState<AspectRatio>('Story');
  const [showAdvancedPrivacy, setShowAdvancedPrivacy] = useState(false);
  const [showPresetDropdown, setShowPresetDropdown] = useState(false);
  const [showAspectRatioDropdown, setShowAspectRatioDropdown] = useState(false);
  const [presetSettings, setPresetSettings] = useState<Record<PrivacyPreset, PrivacySettings>>({
    Personal: getPrivacyPresetSettings('Personal'),
    Social: getPrivacyPresetSettings('Social'),
    Professional: getPrivacyPresetSettings('Professional'),
  });
  const [isCapturing, setIsCapturing] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const { profiles, loading } = useRoster();
  const theme = shareCardTheme[isDark ? 'dark' : 'light'];
  
  // Get current preset's settings
  const currentPrivacySettings = presetSettings[privacyPreset];

  const appTheme = {
    text: '#f0f0f0',
    background: isDark ? '#0B0909' : '#003C24',
    primary: isDark ? '#8C8C8C' : '#f0f0f0',
    secondary: isDark ? '#4A5568' : '#012d1c',
    accent: isDark ? '#44444C' : '#002818',
    cardBackground: isDark ? '#1A1A1A' : '#002818',
    border: isDark ? '#333333' : '#012d1c',
  };

  React.useEffect(() => {
    analytics.fireEvent('sharecard_preview_open', {
      profileCount: profiles.length,
      template: templateType,
      preset: privacyPreset,
      ratio: aspectRatio,
    });
  }, []);

  React.useEffect(() => {
    // Load saved preset settings when component mounts
    loadPresetSettings();
  }, []);

  // Initialize preset based on usage mode and remember last used preset
  React.useEffect(() => {
    if (isLoaded) {
      initializePreset();
    }
  }, [isLoaded, usageMode]);

  const loadPresetSettings = async () => {
    try {
      const savedSettings = await AsyncStorage.getItem('share_studio_preset_settings');
      if (savedSettings) {
        const parsed = JSON.parse(savedSettings);
        setPresetSettings(parsed);
      }
    } catch (error) {
      console.error('Error loading preset settings:', error);
    }
  };

  const savePresetSettings = async (settings: Record<PrivacyPreset, PrivacySettings>) => {
    try {
      await AsyncStorage.setItem('share_studio_preset_settings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving preset settings:', error);
    }
  };

  const initializePreset = async () => {
    try {
      // First, try to get the last used Share Studio preset
      const savedPreset = await AsyncStorage.getItem('last_share_studio_preset');
      
      if (savedPreset && ['Personal', 'Social', 'Professional'].includes(savedPreset)) {
        // Use the saved preset from previous Share Studio session
        const preset = savedPreset as PrivacyPreset;
        setPrivacyPreset(preset);
        setTemplateType(PRESET_TEMPLATE_MAPPING[preset]);
      } else {
        // No saved preset, use the global usage mode as initial value
        let initialPreset: PrivacyPreset = 'Social'; // fallback default
        
        // Map usage mode to privacy preset
        switch (usageMode) {
          case 'personal':
            initialPreset = 'Personal';
            break;
          case 'social':
            initialPreset = 'Social';
            break;
          case 'professional':
            initialPreset = 'Professional';
            break;
          default:
            initialPreset = 'Social';
        }
        
        setPrivacyPreset(initialPreset);
        setTemplateType(PRESET_TEMPLATE_MAPPING[initialPreset]);
        
        // Save this initial preset for future sessions
        await AsyncStorage.setItem('last_share_studio_preset', initialPreset);
      }
    } catch (error) {
      console.error('Error initializing Share Studio preset:', error);
      // Fallback to Social if there's an error
      setPrivacyPreset('Social');
      setTemplateType(PRESET_TEMPLATE_MAPPING['Social']);
    }
  };

  const showToast = (message: string) => {
    setToastMessage(message);
    setTimeout(() => setToastMessage(null), 3000);
  };

  const handleTemplateChange = (template: TemplateType) => {
    // Only allow the mapped template for the current preset
    const mappedTemplate = PRESET_TEMPLATE_MAPPING[privacyPreset];
    if (template !== mappedTemplate) {
      Alert.alert('Template Restriction', `${privacyPreset} mode only supports the ${mappedTemplate} template.`);
      return;
    }
    
    setTemplateType(template);
    analytics.fireEvent('sharecard_template_change', { template, preset: privacyPreset });
  };

  const handlePrivacyPresetChange = (preset: PrivacyPreset) => {
    // Save current preset settings before switching
    savePresetSettings(presetSettings);
    
    setPrivacyPreset(preset);
    
    // Auto-select the mapped template for this preset
    const mappedTemplate = PRESET_TEMPLATE_MAPPING[preset];
    setTemplateType(mappedTemplate);
    
    setShowPresetDropdown(false);
    
    // Save the preset choice for future sessions
    AsyncStorage.setItem('last_share_studio_preset', preset);
    
    analytics.fireEvent('sharecard_privacy_preset', { preset, template: templateType });
  };

  const handleAspectRatioChange = (ratio: AspectRatio) => {
    setAspectRatio(ratio);
    setShowAspectRatioDropdown(false);
  };

  const renderPrivacyToggles = () => {
    const currentSettings = presetSettings[privacyPreset];
    
    if (privacyPreset === 'Social') {
      // Social preset: Show content toggles only
      return (
        <>
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Show Breakdown</Text>
            <Switch
              value={currentSettings.showBreakdown}
              onValueChange={(value) => updateCustomPrivacySetting('showBreakdown', value)}
              trackColor={{ false: appTheme.border, true: appTheme.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Show Top Tags</Text>
            <Switch
              value={currentSettings.showTopTags}
              onValueChange={(value) => updateCustomPrivacySetting('showTopTags', value)}
              trackColor={{ false: appTheme.border, true: appTheme.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Show Growth</Text>
            <Switch
              value={currentSettings.showGrowth}
              onValueChange={(value) => updateCustomPrivacySetting('showGrowth', value)}
              trackColor={{ false: appTheme.border, true: appTheme.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Include Footer Link</Text>
            <Switch
              value={currentSettings.includeFooterLink}
              onValueChange={(value) => updateCustomPrivacySetting('includeFooterLink', value)}
              trackColor={{ false: appTheme.border, true: appTheme.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </>
      );
    } else {
      // Personal and Professional presets: Show identity toggles
      return (
        <>
          {/* Show Names Toggle - Special handling for 3 states */}
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Show Names</Text>
            <View style={styles.nameToggleContainer}>
              <TouchableOpacity
                style={[
                  styles.nameToggleOption,
                  { 
                    backgroundColor: currentSettings.showNames === 'hidden' ? appTheme.secondary : appTheme.accent,
                    borderColor: appTheme.border 
                  }
                ]}
                onPress={() => updateCustomPrivacySetting('showNames', 'hidden')}
              >
                <Text style={[
                  styles.nameToggleText,
                  { color: currentSettings.showNames === 'hidden' ? '#FFFFFF' : appTheme.text }
                ]}>
                  Hidden
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.nameToggleOption,
                  { 
                    backgroundColor: currentSettings.showNames === 'initials' ? appTheme.secondary : appTheme.accent,
                    borderColor: appTheme.border 
                  }
                ]}
                onPress={() => updateCustomPrivacySetting('showNames', 'initials')}
              >
                <Text style={[
                  styles.nameToggleText,
                  { color: currentSettings.showNames === 'initials' ? '#FFFFFF' : appTheme.text }
                ]}>
                  Initials
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.nameToggleOption,
                  { 
                    backgroundColor: currentSettings.showNames === 'full' ? appTheme.secondary : appTheme.accent,
                    borderColor: appTheme.border 
                  }
                ]}
                onPress={() => updateCustomPrivacySetting('showNames', 'full')}
              >
                <Text style={[
                  styles.nameToggleText,
                  { color: currentSettings.showNames === 'full' ? '#FFFFFF' : appTheme.text }
                ]}>
                  Full
                </Text>
              </TouchableOpacity>
            </View>
          </View>
          
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Show Photos</Text>
            <Switch
              value={currentSettings.showPhotos}
              onValueChange={(value) => updateCustomPrivacySetting('showPhotos', value)}
              trackColor={{ false: appTheme.border, true: appTheme.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Show Notes</Text>
            <Switch
              value={currentSettings.showNotes}
              onValueChange={(value) => updateCustomPrivacySetting('showNotes', value)}
              trackColor={{ false: appTheme.border, true: appTheme.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Show Phone Numbers</Text>
            <Switch
              value={currentSettings.showPhone}
              onValueChange={(value) => updateCustomPrivacySetting('showPhone', value)}
              trackColor={{ false: appTheme.border, true: appTheme.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Show Company & Title</Text>
            <Switch
              value={currentSettings.showCompanyTitle}
              onValueChange={(value) => updateCustomPrivacySetting('showCompanyTitle', value)}
              trackColor={{ false: appTheme.border, true: appTheme.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
          
          <View style={[styles.privacyOption, { borderBottomColor: appTheme.border }]}>
            <Text style={[styles.privacyOptionText, { color: appTheme.text }]}>Show Kids & Pets</Text>
            <Switch
              value={currentSettings.showKidsPets}
              onValueChange={(value) => updateCustomPrivacySetting('showKidsPets', value)}
              trackColor={{ false: appTheme.border, true: appTheme.secondary }}
              thumbColor="#FFFFFF"
            />
          </View>
        </>
      );
    }
  };

  const getDimensions = () => {
    switch (aspectRatio) {
      case 'Story':
        return { width: 1080, height: 1920 };
      case 'Portrait':
        return { width: 1080, height: 1350 };
      case 'Square':
        return { width: 1080, height: 1080 };
      default:
        return { width: 1080, height: 1920 };
    }
  };

  const handleSave = async () => {
    if (!shareCardRef.current) return;
    
    setIsCapturing(true);
    try {
      const dimensions = getDimensions();
      const uri = await shareCardRef.current.capture(dimensions);
      const success = await ShareService.saveToMediaLibrary(uri);
      
      if (success) {
        showToast('ARMi card saved to photos!');
        analytics.fireEvent('sharecard_export_save', {
          template: templateType,
          preset: privacyPreset,
          ratio: aspectRatio,
        });
      }
    } catch (error) {
      console.error('Save error:', error);
      Alert.alert('Error', 'Failed to save ARMi card');
    } finally {
      setIsCapturing(false);
    }
  };

  const handleShare = async () => {
    if (!shareCardRef.current) return;
    
    setIsCapturing(true);
    try {
      const dimensions = getDimensions();
      const uri = await shareCardRef.current.capture(dimensions);
      const success = await ShareService.share(uri, 'My ARMi Card');
      
      if (success) {
        analytics.fireEvent('sharecard_export_share', {
          template: templateType,
          preset: privacyPreset,
          ratio: aspectRatio,
        });
      }
    } catch (error) {
      console.error('Share error:', error);
      Alert.alert('Error', 'Failed to share card');
    } finally {
      setIsCapturing(false);
    }
  };

  const updateCustomPrivacySetting = (key: keyof PrivacySettings, value: boolean | string) => {
    const updatedSettings = {
      ...presetSettings,
      [privacyPreset]: {
        ...presetSettings[privacyPreset],
        [key]: value,
      },
    };
    setPresetSettings(updatedSettings);
    savePresetSettings(updatedSettings);
  };

  if (profiles.length === 0) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: appTheme.background }]}>
        <View style={[styles.header, { borderBottomColor: appTheme.border }]}>
          <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
            <ArrowLeft size={24} color={appTheme.text} />
          </TouchableOpacity>
          <Text style={[styles.headerTitle, { color: appTheme.text }]}>ARMi Cards</Text>
          <View style={styles.headerSpacer} />
        </View>
        
        <View style={styles.emptyState}>
          <Text style={[styles.emptyTitle, { color: appTheme.text }]}>No Profiles Yet</Text>
          <Text style={[styles.emptySubtitle, { color: appTheme.primary }]}>
            Add some profiles to your roster to create ARMi cards
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: appTheme.background }]}>
      {/* Header */}
      <View style={[styles.header, { borderBottomColor: appTheme.border }]}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <ArrowLeft size={24} color={appTheme.text} />
        </TouchableOpacity>
        
        {/* Aspect Ratio Selector */}
        <TouchableOpacity
          style={[styles.headerButton, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}
          onPress={() => setShowAspectRatioDropdown(true)}
        >
          <AspectRatioIcon size={20} color={appTheme.primary} />
        </TouchableOpacity>
        
        {/* Two-Line Centered Title */}
        <View style={styles.titleContainer}>
          <Text style={[styles.headerTitleLine, { color: appTheme.text }]}>Share</Text>
          <Text style={[styles.headerTitleLine, { color: appTheme.text }]}>Studio</Text>
        </View>
        
        <View style={styles.headerActions}>
          {/* Privacy Preset Selector */}
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}
            onPress={() => setShowPresetDropdown(true)}
          >
            <Text style={[styles.presetButtonText, { color: appTheme.text }]}>
              {privacyPreset === 'Professional' ? 'Profess...' : privacyPreset}
            </Text>
            <ChevronDown size={16} color={appTheme.primary} />
          </TouchableOpacity>
          
          {/* Advanced Privacy Settings */}
          <TouchableOpacity
            style={[styles.headerButton, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}
            onPress={() => setShowAdvancedPrivacy(true)}
          >
            <SettingsIcon size={20} color={appTheme.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Template Selector */}
      <View style={styles.templateSelector}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.templateOptions}>
          {(['Stats', 'BlurredPeek', 'MiniCards'] as TemplateType[]).map((template) => {
            const mappedTemplate = PRESET_TEMPLATE_MAPPING[privacyPreset];
            const isDisabled = template !== mappedTemplate;
            return (
              <TouchableOpacity
                key={template}
                style={[
                  styles.templateOption,
                  {
                    backgroundColor: templateType === template ? appTheme.secondary : appTheme.cardBackground,
                    borderColor: appTheme.border,
                  },
                  isDisabled && { opacity: 0.5 }
                ]}
                onPress={() => !isDisabled && handleTemplateChange(template)}
                disabled={isDisabled}
              >
                <Text style={[
                  styles.templateOptionText,
                  { color: templateType === template ? '#FFFFFF' : appTheme.text }
                ]}>
                  {template === 'BlurredPeek' ? 'Blurred Peek' : template === 'MiniCards' ? 'Mini Cards' : template === 'Stats' ? 'Stats' : template}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      </View>

      {/* Preview Container */}
      <View style={styles.previewContainer}>
        <ScrollView
          contentContainerStyle={styles.previewContent}
          showsVerticalScrollIndicator={false}
          bounces={false}
        >
          <View style={styles.cardWrapper}>
            <ShareCard
              ref={shareCardRef}
              profiles={profiles}
              templateType={templateType}
              privacySettings={currentPrivacySettings}
              aspectRatio={aspectRatio}
              theme={theme}
            />
          </View>
        </ScrollView>
      </View>

      {/* Bottom Actions */}
      <View style={[styles.bottomActions, { backgroundColor: appTheme.background, borderTopColor: appTheme.border }]}>
        <TouchableOpacity
          style={[styles.actionButton, styles.saveButton, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}
          onPress={handleSave}
          disabled={isCapturing}
        >
          <Download size={20} color={appTheme.text} />
          <Text style={[styles.actionButtonText, { color: appTheme.text }]}>
            {isCapturing ? 'Saving...' : 'Save'}
          </Text>
        </TouchableOpacity>
        
        <TouchableOpacity
          style={[styles.actionButton, styles.shareButton, { backgroundColor: appTheme.secondary }]}
          onPress={handleShare}
          disabled={isCapturing}
        >
          <ShareIcon size={20} color="#FFFFFF" />
          <Text style={[styles.actionButtonText, { color: '#FFFFFF' }]}>
            {isCapturing ? 'Sharing...' : 'Share'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Aspect Ratio Dropdown */}
      <Modal
        visible={showAspectRatioDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowAspectRatioDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowAspectRatioDropdown(false)}
        >
          <View style={[styles.dropdown, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}>
            {(['Story', 'Portrait', 'Square'] as AspectRatio[]).map((ratio) => (
              <TouchableOpacity
                key={ratio}
                style={[styles.dropdownOption, { borderBottomColor: appTheme.border }]}
                onPress={() => handleAspectRatioChange(ratio)}
              >
                <Text style={[styles.dropdownOptionText, { color: appTheme.text }]}>
                  {ratio} ({ratio === 'Story' ? '9:16' : ratio === 'Portrait' ? '4:5' : '1:1'})
                </Text>
                {aspectRatio === ratio && (
                  <View style={[styles.selectedIndicator, { backgroundColor: appTheme.secondary }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Privacy Preset Dropdown */}
      <Modal
        visible={showPresetDropdown}
        transparent
        animationType="fade"
        onRequestClose={() => setShowPresetDropdown(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowPresetDropdown(false)}
        >
          <View style={[styles.dropdown, { backgroundColor: appTheme.cardBackground, borderColor: appTheme.border }]}>
            {(['Social', 'Personal', 'Professional'] as PrivacyPreset[]).map((preset) => (
              <TouchableOpacity
                key={preset}
                style={[styles.dropdownOption, { borderBottomColor: appTheme.border }]}
                onPress={() => handlePrivacyPresetChange(preset)}
              >
                <View style={styles.presetOption}>
                  <Text style={[styles.dropdownOptionText, { color: appTheme.text }]}>{preset}</Text>
                  <Text style={[styles.presetDescription, { color: appTheme.primary }]}>
                    {preset === 'Social' ? 'Stats only' : 
                     preset === 'Personal' ? 'Blurred details' : 
                     'Maximum privacy'}
                  </Text>
                </View>
                {privacyPreset === preset && (
                  <View style={[styles.selectedIndicator, { backgroundColor: appTheme.secondary }]} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Advanced Privacy Settings Modal */}
      <Modal
        visible={showAdvancedPrivacy}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAdvancedPrivacy(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.advancedModal, { backgroundColor: appTheme.cardBackground }]}>
            <View style={[styles.modalHeader, { borderBottomColor: appTheme.border }]}>
              <Text style={[styles.modalTitle, { color: appTheme.text }]}>Advanced Privacy</Text>
              <TouchableOpacity onPress={() => setShowAdvancedPrivacy(false)}>
                <X size={24} color={appTheme.primary} />
              </TouchableOpacity>
            </View>
            
            <ScrollView style={styles.modalContent}>
              {renderPrivacyToggles()}
            </ScrollView>
          </View>
        </View>
      </Modal>

      {/* Toast */}
      {toastMessage && (
        <View style={[styles.toast, { backgroundColor: appTheme.secondary }]}>
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      )}
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
    justifyContent: 'flex-start',
    paddingHorizontal: 20,
    paddingTop: 15,
    paddingBottom: 25,
    borderBottomWidth: 1,
    gap: 12,
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitleLine: {
    fontSize: 17,
    fontWeight: '600',
    lineHeight: 20,
  },
  headerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  headerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    gap: 4,
  },
  presetButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  headerSpacer: {
    width: 40,
  },
  templateSelector: {
    paddingVertical: 16,
  },
  templateOptions: {
    paddingHorizontal: 20,
    gap: 12,
  },
  templateOption: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  templateOptionText: {
    fontSize: 14,
    fontWeight: '500',
  },
  previewContainer: {
    flex: 1,
  },
  previewContent: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 10,
    paddingBottom: 10,
  },
  cardWrapper: {
    transform: [{ scale: 0.3 }],
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  bottomActions: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    gap: 12,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 8,
  },
  saveButton: {
    borderWidth: 1,
  },
  shareButton: {
    // No additional styles needed
  },
  actionButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  dropdown: {
    borderRadius: 12,
    borderWidth: 1,
    minWidth: 200,
    overflow: 'hidden',
  },
  dropdownOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  dropdownOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  presetOption: {
    flex: 1,
  },
  presetDescription: {
    fontSize: 12,
    marginTop: 2,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  advancedModal: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 16,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  modalContent: {
    paddingHorizontal: 20,
  },
  privacyOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
  },
  privacyOptionText: {
    fontSize: 16,
    fontWeight: '500',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  toast: {
    position: 'absolute',
    bottom: 100,
    left: 20,
    right: 20,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  toastText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
  },
  nameToggleContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  nameToggleOption: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
  },
  nameToggleText: {
    fontSize: 12,
    fontWeight: '500',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
});