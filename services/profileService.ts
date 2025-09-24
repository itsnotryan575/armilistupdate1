import { DatabaseService } from './DatabaseService';
import { ArmiList } from '../types/armi-intents';

export async function addProfile(args: { name: string; phone?: string; tags?: string[]; notes?: string; relationshipType?: string; listType?: ArmiList }) {
  console.log('ProfileService: Adding profile with args:', args);
  
  try {
    // Convert the intent args to the format expected by DatabaseService
    const profileData = {
      name: args.name,
      phone: args.phone || null,
      relationship: args.relationshipType || 'acquaintance',
      notes: args.notes || null,
      tags: args.tags || [],
      lastContactDate: new Date().toISOString(),
      listType: args.listType || null,
      // Set other fields to defaults
      age: null,
      email: null,
      job: null,
      parents: [],
      kids: [],
      brothers: [],
      sisters: [],
      siblings: [],
      pets: [],
      foodLikes: [],
      foodDislikes: [],
      interests: [],
      instagram: null,
      snapchat: null,
      twitter: null,
      tiktok: null,
      facebook: null,
      birthday: null,
      birthdayTextEnabled: false,
      birthdayTextScheduledTextId: null,
      giftReminderEnabled: false,
      giftReminderId: null,
    };
    
    const profileId = await DatabaseService.createOrUpdateProfile(profileData);
    console.log('ProfileService: Profile created with ID:', profileId);
    return profileId;
  } catch (error) {
    console.error('ProfileService: Error adding profile:', error);
    throw error;
  }
}

export async function setProfileList(args: { profileId?: string; profileName?: string; listType: ArmiList }) {
  console.log('ProfileService: Setting profile list with args:', args);
  
  try {
    const { profileId, profileName, listType } = args;
    let id: number | undefined;

    if (profileId) {
      const profile = await DatabaseService.getProfileById(parseInt(profileId));
      if (!profile) {
        throw new Error("Profile not found");
      }
      id = profile.id;
    } else if (profileName) {
      const matches = await DatabaseService.getProfilesByName(profileName);
      if (!matches || matches.length === 0) {
        throw new Error("Profile not found");
      }
      // If multiple matches, pick the first one (exact match is prioritized in getProfilesByName)
      id = matches[0].id;
    } else {
      throw new Error("Missing profile selector (profileId or profileName required)");
    }

    // Update the profile's listType
    await DatabaseService.updateProfileListType(id, listType);
    
    // Log the operation for analytics (following existing pattern)
    const updatedProfile = await DatabaseService.getProfileById(id);
    if (updatedProfile) {
      await DatabaseService.logProfileDataForCollection(
        { ...updatedProfile, listType }, 
        'update', 
        id
      );
    }
    
    console.log('ProfileService: Profile list updated successfully for ID:', id);
    return id;
  } catch (error) {
    console.error('ProfileService: Error setting profile list:', error);
    throw error;
  }
}