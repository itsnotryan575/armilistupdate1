import * as Notifications from 'expo-notifications';

export const SCHEDULED_TEXT_CATEGORY = 'scheduled-text-category';
export const ACTION_EDIT = 'edit-scheduled-text';
export const ACTION_SEND = 'send-scheduled-text';

export async function registerNotificationCategories() {
  try {
    // iOS: define action buttons for scheduled text notifications
    await Notifications.setNotificationCategoryAsync(SCHEDULED_TEXT_CATEGORY, [
      {
        identifier: ACTION_EDIT,
        buttonTitle: 'Edit',
        options: { opensAppToForeground: true }, // iOS brings app to front
      },
    ]);
    
    console.log('Notification categories registered successfully');
  } catch (error) {
    console.error('Failed to register notification categories:', error);
  }
}