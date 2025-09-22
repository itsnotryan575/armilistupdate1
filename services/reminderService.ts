import { DatabaseService } from './DatabaseService';
import { scheduleReminder } from './Scheduler';

export async function scheduleReminderFromIntent(args: { profileName?: string; profileId?: string; when: string; reason?: string }) {
  console.log('ReminderService: Scheduling reminder with args:', args);
  
  try {
    // Validate and parse the ISO-8601 date string
    const scheduledDate = new Date(args.when);
    
    if (isNaN(scheduledDate.getTime())) {
      throw new Error(`Invalid date format: "${args.when}". Expected ISO-8601 format (e.g., 2025-01-22T15:30:00Z).`);
    }
    
    // Ensure we're not scheduling in the past
    const now = new Date();
    if (scheduledDate <= now) {
      throw new Error(`Cannot schedule reminder for past date/time: ${scheduledDate.toLocaleString()}`);
    }
    
    // Find profile ID if profile name is provided
    let profileId: number | null = null;
    if (args.profileId) {
      profileId = parseInt(args.profileId);
    } else if (args.profileName) {
      // Try to find profile by name
      const profiles = await DatabaseService.getAllProfiles();
      const matchingProfile = profiles.find(p => 
        p.name.toLowerCase().includes(args.profileName!.toLowerCase())
      );
      if (matchingProfile) {
        profileId = matchingProfile.id;
      }
    }
    
    // Create reminder data
    const reminderData = {
      title: args.reason || `Reminder about ${args.profileName || 'contact'}`,
      description: args.reason || null,
      type: 'general',
      profileId: profileId,
      scheduledFor: scheduledDate,
    };
    
    // Create the reminder in database
    const reminderId = await DatabaseService.createReminder(reminderData);
    
    // Schedule push notification
    try {
      const result = await scheduleReminder({
        title: reminderData.title,
        body: reminderData.description || `Reminder about ${args.profileName || 'contact'}`,
        datePick: scheduledDate,
        timePick: scheduledDate,
        reminderId: reminderId.toString(),
      });
      
      // Update reminder with notification ID
      if (result.id) {
        await DatabaseService.updateReminderNotificationId(reminderId, result.id);
      }
    } catch (notificationError) {
      console.error('Failed to schedule reminder notification:', notificationError);
      // Don't fail the entire operation if notification scheduling fails
    }
    
    console.log('ReminderService: Reminder created with ID:', reminderId);
    return reminderId;
  } catch (error) {
    console.error('ReminderService: Error scheduling reminder:', error);
    throw error;
  }
}