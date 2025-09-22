import { DatabaseService } from './DatabaseService';
import { scheduleScheduledText } from './Scheduler';

export async function scheduleText(args: { profileName?: string; profileId?: string; when: string; message: string }) {
  console.log('TextService: Scheduling text with args:', args);
  
  try {
    // Validate and parse the ISO-8601 date string
    const scheduledDate = new Date(args.when);
    
    if (isNaN(scheduledDate.getTime())) {
      throw new Error(`Invalid date format: "${args.when}". Expected ISO-8601 format (e.g., 2025-01-22T15:30:00Z).`);
    }
    
    // Ensure we're not scheduling in the past
    const now = new Date();
    if (scheduledDate <= now) {
      throw new Error(`Cannot schedule text for past date/time: ${scheduledDate.toLocaleString()}`);
    }
    
    // Find profile and phone number
    let profileId: number | null = null;
    let phoneNumber: string | null = null;
    
    if (args.profileId) {
      profileId = parseInt(args.profileId);
      const profile = await DatabaseService.getProfileById(profileId);
      if (profile && profile.phone) {
        phoneNumber = profile.phone;
      }
    } else if (args.profileName) {
      // Try to find profile by name
      const profiles = await DatabaseService.getAllProfiles();
      const matchingProfile = profiles.find(p => 
        p.name.toLowerCase().includes(args.profileName!.toLowerCase())
      );
      if (matchingProfile) {
        profileId = matchingProfile.id;
        phoneNumber = matchingProfile.phone || null;
      }
    }
    
    if (!phoneNumber) {
      throw new Error('Phone number is required to schedule a text. Please add a phone number to the contact or specify one.');
    }
    
    // Create scheduled text data
    const textData = {
      profileId: profileId,
      phoneNumber: phoneNumber,
      message: args.message,
      scheduledFor: scheduledDate,
    };
    
    // Create the scheduled text in database
    const textId = await DatabaseService.createScheduledText(textData);
    
    // Schedule push notification
    try {
      const result = await scheduleScheduledText({
        messageId: textId.toString(),
        phoneNumber: phoneNumber,
        message: args.message,
        datePick: scheduledDate,
        timePick: scheduledDate,
      });
      
      // Update scheduled text with notification ID
      if (result.id) {
        await DatabaseService.updateScheduledTextNotificationId(textId, result.id);
      }
    } catch (notificationError) {
      console.error('Failed to schedule text notification:', notificationError);
      // Don't fail the entire operation if notification scheduling fails
    }
    
    console.log('TextService: Scheduled text created with ID:', textId);
    return textId;
  } catch (error) {
    console.error('TextService: Error scheduling text:', error);
    throw error;
  }
}