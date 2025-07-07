import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { ActivityRecord } from '../types';
import i18n from '../i18n';

// Configure notification behavior
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true, // Show as a banner (iOS 14+)
    shouldShowList: true,   // Show in notification center (iOS 14+)
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

// Storage keys
const NOTIFICATION_IDS_STORAGE_KEY = 'activity_notification_ids';
const BACKGROUND_TASK_NAME = 'vetly-background-task';

export interface NotificationIdMapping {
  [activityId: string]: {
    notificationId: string;
    scheduledDate: string;
    petName?: string;
  };
}

export class NotificationService {
  private static instance: NotificationService;
  private isInitialized = false;
  private initializationFailed = false;
  private notificationIds: NotificationIdMapping = {} as NotificationIdMapping;
  private appStateListener: any = null;

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
      console.log('🔔 Initializing enhanced notification service...');
      
      // Check if we're in a supported environment
      if (!Device.isDevice) {
        console.warn('📱 Notifications require a physical device');
        this.initializationFailed = true;
        return false;
      }

      // Load stored notification IDs
      await this.loadNotificationIds();

      // Set up notification channel for Android
      if (Platform.OS === 'android') {
        await this.setupAndroidChannels();
      }

      // Request permissions
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        console.warn('⚠️ Notification permissions not granted');
        this.initializationFailed = true;
        return false;
      }

      // Register background task
      await this.registerBackgroundTask();

      // Set up AppState listener for missed notifications
      this.setupAppStateListener();

      this.isInitialized = true;
      console.log('✅ Enhanced notification service initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize notification service:', error);
      this.initializationFailed = true;
      return false;
    }
  }

  private async setupAndroidChannels(): Promise<void> {
    try {
      await Notifications.setNotificationChannelAsync('pet-activities', {
        name: 'Pet Activity Reminders',
        description: 'Local notifications for pet feeding, health, and activity reminders',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD54F',
        sound: 'default',
        enableVibrate: true,
        showBadge: false,
      });

      await Notifications.setNotificationChannelAsync('extension-reminders', {
        name: 'Activity Extension Reminders',
        description: 'Reminders to extend recurring activities',
        importance: Notifications.AndroidImportance.DEFAULT,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#FFD54F',
        sound: 'default',
        enableVibrate: true,
        showBadge: false,
      });

      console.log('✅ Android notification channels created');
    } catch (channelError) {
      console.error('❌ Failed to create notification channels:', channelError);
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

  private async registerBackgroundTask(): Promise<void> {
    try {
      // Define the background task
      TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
        try {
          console.log('🔄 Background task running...');
          
          // Check for missed notifications and schedule new ones
          await this.checkAndScheduleMissedNotifications();
          
          // Clean up expired notifications
          await this.cleanupExpiredNotifications();
          
          return BackgroundFetch.BackgroundFetchResult.NewData;
        } catch (error) {
          console.error('❌ Background task failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register the background task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 3600, // Every hour
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('✅ Background task registered');
    } catch (error) {
      console.error('❌ Failed to register background task:', error);
    }
  }

  private setupAppStateListener(): void {
    this.appStateListener = AppState.addEventListener('change', async (nextAppState) => {
      if (nextAppState === 'active') {
        console.log('📱 App became active, checking for missed notifications...');
        await this.checkAndScheduleMissedNotifications();
      }
    });
  }

  async scheduleActivityNotification(activity: ActivityRecord, petName?: string): Promise<string | null> {
    try {
      console.log(`🔔 Scheduling notification for activity ${activity.id}`);
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.log(`❌ Service not initialized, cannot schedule notification`);
          return null;
        }
      }

      // Don't schedule if notifications are disabled
      if (!activity.notify) {
        console.log(`❌ Notifications disabled for activity ${activity.id}`);
        return null;
      }

      // Parse the activity date
      const triggerDate = this.parseActivityDate(activity.date);
      const now = new Date();

      console.log(`🔔 Activity details:`, {
        id: activity.id,
        date: activity.date,
        parsedDate: triggerDate.toISOString(),
        repeat: activity.repeat,
        notify: activity.notify,
        petName
      });

      // Don't schedule notifications for past dates
      if (triggerDate <= now) {
        console.log(`❌ Activity date is in the past, skipping notification`);
        return null;
      }

      // Cancel existing notification for this activity
      await this.cancelNotificationForActivity(activity.id);

      // Create notification content
      const notificationContent: Notifications.NotificationContentInput = {
        title: this.createNotificationTitle(activity, petName),
        body: this.createNotificationBody(activity, petName),
        sound: 'default',
        data: {
          activityId: activity.id,
          petId: activity.pet_id,
          category: activity.category,
          type: 'activity-reminder',
        },
      };

      // Create trigger based on repeat type
      const trigger = this.createTrigger(activity, triggerDate);
      
      console.log(`📅 Creating trigger:`, trigger);
      
      // Schedule the notification
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: notificationContent,
        trigger,
      });

      // Store the notification ID
      await this.saveNotificationId(activity.id, notificationId, triggerDate, petName);

      console.log(`✅ Scheduled notification ${notificationId} for activity ${activity.id}`);
      return notificationId;

    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  private parseActivityDate(dateString: string): Date {
    console.log(`🕐 Parsing activity date: ${dateString}`);
    
    try {
      // Parse components manually to ensure local time interpretation
      const match = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
      if (match) {
        const [_, year, month, day, hour, minute, second] = match;
        const parsedDate = new Date(
          parseInt(year, 10),
          parseInt(month, 10) - 1,
          parseInt(day, 10),
          parseInt(hour, 10),
          parseInt(minute, 10),
          parseInt(second, 10)
        );
        
        if (isNaN(parsedDate.getTime())) {
          throw new Error(`Invalid date components from ${dateString}`);
        }
        
        console.log(`✅ Manual parsing result:`, {
          input: dateString,
          result: parsedDate.toISOString(),
          local: parsedDate.toLocaleString(),
          hours: parsedDate.getHours(),
          minutes: parsedDate.getMinutes()
        });
        
        return parsedDate;
      }
      
      // Fallback parsing - treat as local time
      const normalizedDate = dateString.replace('T', ' ');
      const date = new Date(normalizedDate);
      
      if (isNaN(date.getTime())) {
        throw new Error(`Unable to parse date: ${dateString}`);
      }
      
      console.log(`⚠️ Fallback date parsing successful:`, {
        original: dateString,
        parsed: date.toISOString(),
        local: date.toLocaleString(),
        hours: date.getHours(),
        minutes: date.getMinutes()
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

  private createNotificationTitle(activity: ActivityRecord, petName?: string): string {
    const pet = petName || 'your pet';
    
    switch (activity.category) {
      case 'FEEDING':
        return i18n.t('activity.notifications.feeding_title', { petName: pet });
      case 'HEALTH':
        return i18n.t('activity.notifications.health_title', { petName: pet });
      case 'ACTIVITY':
        return i18n.t('activity.notifications.activity_title', { petName: pet });
      default:
        return i18n.t('activity.notifications.general_title', { petName: pet });
    }
  }

  private createNotificationBody(activity: ActivityRecord, petName?: string): string {
    const pet = petName || 'your pet';
    
    let body = '';
    
    switch (activity.category) {
      case 'FEEDING':
        body = i18n.t('activity.notifications.feeding_body', { 
          petName: pet,
          foodType: activity.food_type 
        });
        break;
      case 'HEALTH':
        body = i18n.t('activity.notifications.health_body', { petName: pet });
        break;
      case 'ACTIVITY':
        body = i18n.t('activity.notifications.activity_body', { 
          petName: pet,
          duration: activity.duration 
        });
        break;
      default:
        body = i18n.t('activity.notifications.general_body', { petName: pet });
    }

    if (activity.notes && activity.notes.trim()) {
      body += `\n\n${activity.notes}`;
    }

    return body;
  }

  private createTrigger(activity: ActivityRecord, triggerDate: Date): Notifications.NotificationTriggerInput {
    console.log(`🎯 Creating trigger for activity ${activity.id}, repeat: ${activity.repeat}`);
    
    // Handle repeat notifications
    if (activity.repeat && activity.repeat !== 'none') {
      switch (activity.repeat) {
        case 'daily':
          return {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
          };
        case 'weekly':
          return {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: triggerDate.getDay() + 1, // Expo uses 1-7, JS uses 0-6
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
          };
        case 'monthly':
          // For monthly, we'll use a one-time notification and let the user reschedule
          return {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          };
        default:
          return {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          };
      }
    }

    // One-time notification
    return {
      type: Notifications.SchedulableTriggerInputTypes.DATE,
      date: triggerDate,
    };
  }

  private async loadNotificationIds(): Promise<void> {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_IDS_STORAGE_KEY);
      if (stored) {
        this.notificationIds = JSON.parse(stored) as NotificationIdMapping;
        console.log(`📋 Loaded ${Object.keys(this.notificationIds).length} notification mappings`);
      }
    } catch (error) {
      console.error('Failed to load notification IDs:', error);
      this.notificationIds = {} as NotificationIdMapping;
    }
  }

  private async saveNotificationId(
    activityId: number, 
    notificationId: string, 
    scheduledDate: Date, 
    petName?: string
  ): Promise<void> {
    try {
      this.notificationIds[activityId.toString()] = {
        notificationId,
        scheduledDate: scheduledDate.toISOString(),
        petName,
      };
      
      await AsyncStorage.setItem(NOTIFICATION_IDS_STORAGE_KEY, JSON.stringify(this.notificationIds));
      console.log(`💾 Saved notification ID ${notificationId} for activity ${activityId}`);
    } catch (error) {
      console.error('Failed to save notification ID:', error);
    }
  }

  async cancelNotificationForActivity(activityId: number): Promise<boolean> {
    try {
      const mapping = this.notificationIds[activityId.toString()];
      if (mapping) {
        await Notifications.cancelScheduledNotificationAsync(mapping.notificationId);
        delete this.notificationIds[activityId.toString()];
        await AsyncStorage.setItem(NOTIFICATION_IDS_STORAGE_KEY, JSON.stringify(this.notificationIds));
        console.log(`🗑️ Cancelled notification ${mapping.notificationId} for activity ${activityId}`);
      return true;
      }
      return false;
    } catch (error) {
      console.error('Failed to cancel notification for activity:', error);
      return false;
    }
  }

  async cancelAllNotificationsForActivity(activityId: number): Promise<void> {
    try {
      // Cancel stored notification
      await this.cancelNotificationForActivity(activityId);
      
      // Also cancel any extension reminders
      await this.cancelExtensionReminder(activityId);
      
      console.log(`🧹 Cancelled all notifications for activity ${activityId}`);
    } catch (error) {
      console.error('Failed to cancel all notifications for activity:', error);
    }
  }

  async cancelExtensionReminder(activityId: number): Promise<boolean> {
    try {
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      
      const extensionReminders = scheduledNotifications.filter(
        notification => {
          const data = notification.content.data;
          return data?.activityId === activityId && data?.type === 'repeat-extension';
        }
      );

      console.log(`🗑️ Found ${extensionReminders.length} extension reminders for activity ${activityId}`);

      for (const notification of extensionReminders) {
        await Notifications.cancelScheduledNotificationAsync(notification.identifier);
        console.log(`🗑️ Cancelled extension reminder ${notification.identifier} for activity ${activityId}`);
      }

      return extensionReminders.length > 0;
    } catch (error) {
      console.error('Failed to cancel extension reminders:', error);
      return false;
    }
  }

  async checkAndScheduleMissedNotifications(): Promise<void> {
    try {
      console.log('🔍 Checking for missed notifications...');

      // Get all scheduled notifications
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const now = new Date();
      
      // Check if we have any notifications that should have fired but didn't
      for (const notification of scheduledNotifications) {
        const data = notification.content.data;
        if (data?.activityId && data?.type === 'activity-reminder') {
          const mapping = this.notificationIds[data.activityId.toString()];
          if (mapping) {
            const scheduledDate = new Date(mapping.scheduledDate);
            if (scheduledDate < now) {
              console.log(`⚠️ Found missed notification for activity ${data.activityId}`);
              // Reschedule for next occurrence if it's a repeating activity
              // This would require fetching the activity from API
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to check missed notifications:', error);
    }
  }

  async cleanupExpiredNotifications(): Promise<void> {
    try {
      console.log('🧹 Cleaning up expired notifications...');
      
      const now = new Date();
      const expiredActivityIds: number[] = [];
      
      for (const [activityId, mapping] of Object.entries(this.notificationIds)) {
        const scheduledDate = new Date(mapping.scheduledDate);
        if (scheduledDate < now) {
          expiredActivityIds.push(parseInt(activityId as string));
        }
      }
      
      for (const activityId of expiredActivityIds) {
        await this.cancelNotificationForActivity(activityId);
      }
      
      if (expiredActivityIds.length > 0) {
        console.log(`🧹 Cleaned up ${expiredActivityIds.length} expired notifications`);
      }
    } catch (error) {
      console.error('Failed to cleanup expired notifications:', error);
    }
  }

  async rescheduleActivityNotification(
    activity: ActivityRecord, 
    petName?: string
  ): Promise<string | null> {
    try {
      // Cancel existing notification
      await this.cancelNotificationForActivity(activity.id);

      // Schedule new notification
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

  async cancelAllNotifications(): Promise<boolean> {
    try {
      await Notifications.cancelAllScheduledNotificationsAsync();
      this.notificationIds = {} as NotificationIdMapping;
      await AsyncStorage.removeItem(NOTIFICATION_IDS_STORAGE_KEY);
      console.log('✅ Cancelled all scheduled notifications');
      return true;
    } catch (error) {
      console.error('❌ Failed to cancel all notifications:', error);
      return false;
    }
  }

  async isNotificationEnabled(): Promise<boolean> {
    if (!Device.isDevice) {
      return false;
    }

    const { status } = await Notifications.getPermissionsAsync();
    return status === 'granted';
  }

  async getNotificationInfo(activityId: number): Promise<{ notificationId: string; scheduledDate: string; petName?: string } | null> {
    return this.notificationIds[activityId.toString()] || null;
  }

  async scheduleTestNotification(): Promise<string | null> {
    try {
      console.log(`🧪 Testing enhanced notification scheduling...`);
      
      if (!this.isInitialized) {
        const initialized = await this.initialize();
        if (!initialized) {
          console.log(`❌ Test: Initialization failed`);
          return null;
        }
      }

      const testDate = new Date();
      testDate.setSeconds(testDate.getSeconds() + 10);
      
      console.log(`🧪 Test: Scheduling notification for ${testDate.toLocaleString()}`);
      
      const notificationId = await Notifications.scheduleNotificationAsync({
        content: {
          title: i18n.t('activity.notifications.test_title'),
          body: i18n.t('activity.notifications.test_body'),
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

  // Cleanup method
  cleanup(): void {
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance(); 