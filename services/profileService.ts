import { DatabaseService } from './DatabaseService';

export async function addProfile(args: { name: string; phone?: string; tags?: string[]; notes?: string; relationshipType?: string }) {
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