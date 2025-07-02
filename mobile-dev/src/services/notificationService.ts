import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ActivityRecord } from '../types';

// Configure notification behavior only for local notifications
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private initializationFailed = false;

  public static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    if (this.initializationFailed) {
      return false;
    }

    try {
      console.log('🔔 Initializing LOCAL notification service...');
      
      // Check if we're in a supported environment
      if (!Device.isDevice) {
        console.warn('📱 Local notifications require a physical device');
        this.initializationFailed = true;
        return false;
      }

      // Set up notification channel for Android (LOCAL notifications only)
      if (Platform.OS === 'android') {
        try {
          await Notifications.setNotificationChannelAsync('pet-activities', {
            name: 'Pet Activity Reminders',
            description: 'Local notifications for pet feeding, health, and activity reminders',
            importance: Notifications.AndroidImportance.DEFAULT,
            vibrationPattern: [0, 250, 250, 250],
            lightColor: '#FFD54F',
            sound: 'default',
          });
          console.log('✅ Android notification channel created');
        } catch (channelError) {
          console.error('❌ Failed to create notification channel:', channelError);
          // Continue anyway, might still work
        }
      }

      // Request permissions for LOCAL notifications only
      const hasPermission = await this.requestPermissions();
      this.isInitialized = hasPermission;
      
      if (hasPermission) {
        console.log('✅ Local notification service initialized successfully');
      } else {
        console.warn('⚠️ Notification permissions not granted');
        this.initializationFailed = true;
      }
      
      return hasPermission;
    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      this.initializationFailed = true;
      return false;
    }
  }

  private async requestPermissions(): Promise<boolean> {
    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;

      if (existingStatus !== 'granted') {
        console.log('📝 Requesting notification permissions...');
        const { status } = await Notifications.requestPermissionsAsync({
          ios: {
            allowAlert: true,
            allowBadge: false,
            allowSound: true,
            allowDisplayInCarPlay: false,
            allowCriticalAlerts: false,
            provideAppNotificationSettings: false,
            allowProvisional: false,
          },
          android: {},
        });
        finalStatus = status;
      }

      if (finalStatus !== 'granted') {
        console.warn('❌ Notification permissions denied');
        return false;
      }

      console.log('✅ Notification permissions granted');
      return true;
    } catch (error) {
      console.error('❌ Failed to request permissions:', error);
      return false;
    }
  }

  async scheduleActivityNotification(activity: ActivityRecord, petName?: string): Promise<string | null> {
    try {
      console.log(`🔔 NotificationService: Starting schedule for activity ${activity.id}`);
      
      if (!this.isInitialized) {
        console.log(`🔔 NotificationService: Not initialized, attempting to initialize...`);
        const initialized = await this.initialize();
        console.log(`🔔 NotificationService: Initialization result: ${initialized}`);
        if (!initialized) {
          console.log(`❌ NotificationService: Initialization failed, cannot schedule notification`);
          return null;
        }
      }

      // Don't schedule if notifications are disabled for this activity
      if (!activity.notify) {
        console.log(`❌ NotificationService: Notifications disabled for activity ${activity.id}, skipping`);
        return null;
      }

      // Parse the date and time properly handling timezone
      // The activity.date comes as local time string like "2024-12-26T15:30:00"
      // We need to ensure it's interpreted as local time, not UTC
      console.log(`🕐 NotificationService: Parsing activity date: ${activity.date}`);
      const triggerDate = this.parseActivityDate(activity.date);
      const now = new Date();

      console.log(`🔔 Scheduling notification for activity ${activity.id}:`);
      console.log(`  - Activity date string: ${activity.date}`);
      console.log(`  - Parsed trigger date: ${triggerDate.toISOString()}`);
      console.log(`  - Trigger date local: ${triggerDate.toLocaleString()}`);
      console.log(`  - Current time: ${now.toISOString()}`);
      console.log(`  - Current time local: ${now.toLocaleString()}`);
      console.log(`  - Time until trigger: ${(triggerDate.getTime() - now.getTime()) / 1000 / 60} minutes`);
      console.log(`  - Pet name: ${petName || 'unknown'}`);

      // Don't schedule notifications for past dates
      if (triggerDate <= now) {
        console.log(`❌ Activity date is in the past, skipping notification`);
        console.log(`  - Trigger: ${triggerDate.getTime()}, Now: ${now.getTime()}`);
        return null;
      }

      // Create notification content
      console.log(`📝 NotificationService: Creating notification content...`);
      const notificationContent: Notifications.NotificationContentInput = {
        title: `🐾 ${activity.title}`,
        body: this.createNotificationBody(activity, petName),
        sound: 'default',
        data: {
          activityId: activity.id,
          petId: activity.pet_id,
          category: activity.category,
        },
      };
      console.log(`📝 NotificationService: Notification content created:`, notificationContent);

      // Schedule the notification
      console.log(`⏰ NotificationService: Creating trigger...`);
      const trigger: Notifications.NotificationTriggerInput = this.createTrigger(activity, triggerDate);
      
      console.log(`📅 Creating trigger:`, trigger);
      
      console.log(`📤 NotificationService: Scheduling notification with Expo...`);
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      console.log(`✅ Scheduled notification ${notificationId} for activity ${activity.id}`);
      return notificationId;

    } catch (error) {
      console.error('❌ NotificationService: Failed to schedule notification:', error);
      console.error('❌ NotificationService: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : undefined,
        activityId: activity.id,
        activityDate: activity.date,
        notify: activity.notify
      });
      return null;
    }
  }

  private parseActivityDate(dateString: string): Date {
    // The date string comes as "YYYY-MM-DDTHH:mm:ss" without timezone info
    // We need to parse it as local time to avoid timezone conversion issues
    
    console.log(`🕐 Parsing activity date: ${dateString}`);
    
    try {
      // Method 1: Parse components manually to ensure local time interpretation
      const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
      if (match) {
        const [_, year, month, day, hour, minute, second] = match;
        // Date constructor with individual components always creates local time
        const parsedDate = new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1, // Month is 0-based
          parseInt(day, 10),
          parseInt(hour, 10),
          parseInt(minute, 10),
          parseInt(second, 10)
        );
        
        // Validate the parsed date
        if (isNaN(parsedDate.getTime())) {
          throw new Error(`Invalid date components from ${dateString}`);
        }
        
        console.log(`✅ Manual parsing result:`, {
          input: dateString,
          components: { year, month: parseInt(month, 10) - 1, day, hour, minute, second },
          result: parsedDate.toISOString(),
          local: parsedDate.toLocaleString(),
          timestamp: parsedDate.getTime()
        });
        
        return parsedDate;
      }
      
      // Method 2: Try parsing with simpler approach
      console.log(`⚠️ Date string doesn't match expected format, trying simpler parsing`);
      
      // Remove the 'T' and replace with space, then parse
      const normalizedDate = dateString.replace('T', ' ');
      const date = new Date(normalizedDate);
      
      if (isNaN(date.getTime())) {
        throw new Error(`Unable to parse date: ${dateString}`);
      }
      
      console.log(`⚠️ Fallback date parsing successful:`, {
        original: dateString,
        normalized: normalizedDate,
        parsed: date.toISOString(),
        local: date.toLocaleString(),
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
      });
      
      return date;
      
    } catch (error) {
      console.error(`❌ Failed to parse activity date: ${dateString}`, error);
      // Return current time + 1 minute as emergency fallback
      const fallbackDate = new Date();
      fallbackDate.setMinutes(fallbackDate.getMinutes() + 1);
      console.log(`🆘 Using emergency fallback date: ${fallbackDate.toLocaleString()}`);
      return fallbackDate;
    }
  }

  private createNotificationBody(activity: ActivityRecord, petName?: string): string {
    let body = '';
    const pet = petName || 'your pet';
    
    // Add category-specific emoji and context with pet name
    switch (activity.category) {
      case 'FEEDING':
        body = `🍽️ Time to feed ${pet}`;
        if (activity.food_type) {
          body += ` (${activity.food_type})`;
        }
        break;
      case 'HEALTH':
        body = `🩺 Health check time for ${pet}`;
        break;
      case 'ACTIVITY':
        body = `🎾 Time for ${pet}'s activity`;
        if (activity.duration) {
          body += ` (${activity.duration})`;
        }
        break;
      default:
        body = `📝 Reminder for ${pet}`;
    }

    // Add notes if available
    if (activity.notes && activity.notes.trim()) {
      body += `\n\n${activity.notes}`;
    }

    return body;
  }

  private createTrigger(activity: ActivityRecord, triggerDate: Date): Notifications.NotificationTriggerInput {
    console.log(`🎯 Creating trigger for activity ${activity.id}, repeat: ${activity.repeat}`);
    console.log(`  - Trigger date: ${triggerDate.toLocaleString()}`);
    console.log(`  - Hour: ${triggerDate.getHours()}, Minute: ${triggerDate.getMinutes()}`);
    console.log(`  - Date object valid: ${!isNaN(triggerDate.getTime())}`);
    console.log(`  - Date timestamp: ${triggerDate.getTime()}`);
    
    // Handle repeat notifications
    if (activity.repeat && activity.repeat !== 'none') {
      console.log(`🔄 Activity has repeat: ${activity.repeat}`);
      switch (activity.repeat) {
        case 'daily':
          console.log(`  - Creating DAILY trigger for ${triggerDate.getHours()}:${triggerDate.getMinutes()}`);
          return {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
          };
        case 'weekly':
          console.log(`  - Creating WEEKLY trigger for day ${triggerDate.getDay()} at ${triggerDate.getHours()}:${triggerDate.getMinutes()}`);
          return {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: triggerDate.getDay() + 1, // Expo uses 1-7, JS uses 0-6
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
          };
        case 'monthly':
          console.log(`  - Creating MONTHLY (one-time) trigger for ${triggerDate.toISOString()}`);
          // For monthly, we'll use a one-time notification and let the user reschedule
          // as true monthly recurring notifications are complex with varying month lengths
          return {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          };
        default:
          console.log(`  - Unknown repeat type, using one-time`);
          // Fallback to one-time notification
          return {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          };
      }
    }

    // One-time notification
    console.log(`📅 Activity has no repeat (${activity.repeat}), creating ONE-TIME trigger`);
    console.log(`  - Using date trigger type`);
    console.log(`  - Trigger date: ${triggerDate.toISOString()}`);
    console.log(`  - Trigger date local: ${triggerDate.toLocaleString()}`);
    
    const trigger = {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    };
    
    console.log(`📅 One-time trigger created:`, trigger);
    return trigger;
  }

  async cancelNotification(notificationId: string): Promise<boolean> {
    try {
      await Notifications.cancelScheduledNotificationAsync(notificationId);
      console.log(`Cancelled notification ${notificationId}`);
      return true;
    } catch (error) {
      console.error('Failed to cancel notification:', error);
      return false;
    }
  }

  async cancelAllNotificationsForActivity(activityId: number): Promise<void> {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find notifications for this activity, but EXCLUDE extension reminders
      const activityNotifications = scheduledNotifications.filter(
        notification => {
          const data = notification.content.data;
          return data?.activityId === activityId && data?.type !== 'repeat-extension';
        }
      );

      console.log(`🧹 Cancelling ${activityNotifications.length} activity notifications for activity ${activityId} (excluding extension reminders)`);

      // Cancel each notification
      for (const notification of activityNotifications) {
        await this.cancelNotification(notification.identifier);
      }
    } catch (error) {
      console.error('Failed to cancel activity notifications:', error);
    }
  }

  async rescheduleActivityNotification(
    activity: ActivityRecord, 
    oldNotificationId?: string,
    petName?: string
  ): Promise<string | null> {
    try {
      // Cancel old notification if it exists
      if (oldNotificationId) {
        await this.cancelNotification(oldNotificationId);
      }

      // Schedule new notification with pet name
      return await this.scheduleActivityNotification(activity, petName);
    } catch (error) {
      console.error('Failed to reschedule notification:', error);
      return null;
    }
  }

  async getScheduledNotificationsCount(): Promise<number> {
    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications.length;
    } catch (error) {
      console.error('Failed to get scheduled notifications count:', error);
      return 0;
    }
  }

  async cancelExtensionReminder(activityId: number): Promise<boolean> {
    try {
      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      // Find extension reminder for this activity
      const extensionReminders = scheduledNotifications.filter(
        notification => {
          const data = notification.content.data;
          return data?.activityId === activityId && data?.type === 'repeat-extension';
        }
      );

      console.log(`🗑️ Found ${extensionReminders.length} extension reminders for activity ${activityId}`);

      // Cancel each extension reminder
      for (const notification of extensionReminders) {
        await this.cancelNotification(notification.identifier);
        console.log(`🗑️ Cancelled extension reminder ${notification.identifier} for activity ${activityId}`);
      }

      return extensionReminders.length > 0;
    } catch (error) {
      console.error('Failed to cancel extension reminders:', error);
      return false;
    }
  }

  async getAllNotificationsByType(): Promise<{activityNotifications: any[], extensionReminders: any[], other: any[]}> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const activityNotifications = scheduledNotifications.filter(
        notification => {
          const data = notification.content.data;
          return data?.activityId && data?.type !== 'repeat-extension';
        }
      );

      const extensionReminders = scheduledNotifications.filter(
        notification => {
          const data = notification.content.data;
          return data?.type === 'repeat-extension';
        }
      );

      const other = scheduledNotifications.filter(
        notification => {
          const data = notification.content.data;
          return !data?.activityId && data?.type !== 'repeat-extension';
        }
      );

      console.log(`📊 Notification breakdown:`);
      console.log(`  - Activity notifications: ${activityNotifications.length}`);
      console.log(`  - Extension reminders: ${extensionReminders.length}`);
      console.log(`  - Other notifications: ${other.length}`);

      return { activityNotifications, extensionReminders, other };
    } catch (error) {
      console.error('Failed to get notifications by type:', error);
      return { activityNotifications: [], extensionReminders: [], other: [] };
    }
  }

  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      console.log('✅ Cancelled all scheduled notifications');
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
      return false;
    }
  }

  // Helper method to check if notifications are available and enabled
  async isNotificationEnabled(): Promise<boolean> {
    if (!Device.isDevice) {
      return false;
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  // Test method to schedule a simple notification for debugging
  async scheduleTestNotification(): Promise<string | null> {
    try {
      console.log(`🧪 Testing basic notification scheduling...`);
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.log(`❌ Test: Initialization failed`);
          return null;
        }
      }

      // Schedule a notification for 10 seconds from now
      const testDate = new Date();
      testDate.setSeconds(testDate.getSeconds() + 10);
      
      console.log(`🧪 Test: Scheduling notification for ${testDate.toLocaleString()}`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: '🧪 Test Notification',
          body: 'This is a test notification to verify the service works',
          sound: 'default',
          data: { test: true },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: testDate,
        },
      });

      console.log(`🧪 Test: Scheduled test notification ${notificationId}`);
      return notificationId;
    } catch (error) {
      console.error('🧪 Test: Failed to schedule test notification:', error);
      return null;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 