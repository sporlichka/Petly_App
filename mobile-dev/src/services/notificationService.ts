import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { Platform, AppState } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import dayjs from 'dayjs';
import { ActivityRecord } from '../types';
import i18n from '../i18n';

// Configure notification behavior (only for mobile platforms)
if (Platform.OS !== 'web') {
  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowBanner: true, // Show as a banner (iOS 14+)
      shouldShowList: true,   // Show in notification center (iOS 14+)
      shouldPlaySound: true,
      shouldSetBadge: false,
    }),
  });
}

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

    // 🌐 Skip notification initialization for web platform
    if (Platform.OS === 'web') {
      console.log('🌐 Skipping notification service initialization for web platform');
      this.initializationFailed = true;
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
          
          // Обновляем виртуальные уведомления
          await this.updateVirtualActivityNotifications();

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
    // 🌐 Skip notification scheduling for web platform
    if (Platform.OS === 'web') {
      console.log(`🌐 Skipping notification scheduling for web platform (activity ${activity.id})`);
      return null;
    }

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
        repeat_type: activity.repeat_type,
        repeat_interval: activity.repeat_interval,
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

      // Для кастомных интервалов добавляем информацию в data
      if (activity.repeat_type && activity.repeat_type !== 'none' && activity.repeat_interval > 1) {
        notificationContent.data = {
          ...notificationContent.data,
          customInterval: true,
          repeatType: activity.repeat_type,
          repeatInterval: activity.repeat_interval,
          repeatEndDate: activity.repeat_end_date,
          repeatCount: activity.repeat_count,
        };
      }

      // Store the notification ID
      await this.saveNotificationId(activity.id, notificationId, triggerDate, petName);

      console.log(`✅ Scheduled notification ${notificationId} for activity ${activity.id}`);
      return notificationId;

    } catch (error) {
      console.error('❌ Failed to schedule notification:', error);
      return null;
    }
  }

  /**
   * Гибридный подход: создает уведомления для виртуальных активностей
   * - Стандартные повторы: использует встроенные триггеры Expo
   * - Кастомные интервалы: создает отдельные уведомления для ближайших дат
   */
  async scheduleVirtualActivityNotifications(
    activity: ActivityRecord, 
    petName?: string
  ): Promise<string[]> {
    const notificationIds: string[] = [];

    try {
      console.log(`🔔 Scheduling virtual activity notifications for activity ${activity.id}`);

      // Если нет повторов, создаем только одно уведомление
      if (!activity.repeat_type || activity.repeat_type === 'none') {
        const notificationId = await this.scheduleActivityNotification(activity, petName);
        if (notificationId) {
          notificationIds.push(notificationId);
        }
        return notificationIds;
      }

      // Для стандартных повторов (интервал = 1) используем встроенные триггеры
      if (activity.repeat_interval === 1) {
        console.log(`📅 Using standard Expo triggers for ${activity.repeat_type} repeats`);
        const notificationId = await this.scheduleActivityNotification(activity, petName);
        if (notificationId) {
          notificationIds.push(notificationId);
        }
        return notificationIds;
      }

      // Для кастомных интервалов создаем отдельные уведомления для ближайших дат
      console.log(`📅 Creating individual notifications for custom interval ${activity.repeat_interval} ${activity.repeat_type}`);
      
      // Импортируем функцию для генерации дат
      const { getRepeatDates } = await import('../utils/repeatHelpers');
      
      const baseDate = new Date(activity.date);
      const repeatDates = getRepeatDates(
        baseDate,
        activity.repeat_type,
        activity.repeat_interval,
        activity.repeat_end_date,
        activity.repeat_count
      );

      // Создаем уведомления для ближайших 7 дат (или меньше, если повторов меньше)
      const maxNotifications = Math.min(7, repeatDates.length);
      const now = new Date();

      for (let i = 0; i < maxNotifications; i++) {
        const date = repeatDates[i];
        
        // Пропускаем даты в прошлом
        if (date <= now) {
          continue;
        }

        try {
          const virtualActivity: ActivityRecord = {
            ...activity,
            id: activity.id + (i + 1) * 1000000, // Виртуальный ID
            date: this.formatLocalDateTime(date),
            time: this.formatLocalDateTime(date),
          };

          const notificationId = await this.scheduleActivityNotification(virtualActivity, petName);
          if (notificationId) {
            notificationIds.push(notificationId);
            console.log(`✅ Scheduled notification ${notificationId} for virtual activity on ${date.toLocaleDateString()}`);
          }
        } catch (error) {
          console.error(`❌ Failed to schedule notification for virtual activity ${i + 1}:`, error);
        }
      }

      console.log(`🎉 Scheduled ${notificationIds.length} notifications for custom interval activity ${activity.id}`);
      return notificationIds;

    } catch (error) {
      console.error('❌ Failed to schedule virtual activity notifications:', error);
      return notificationIds;
    }
  }

  /**
   * Отменяет все уведомления для виртуальных активностей
   */
  async cancelVirtualActivityNotifications(activity: ActivityRecord): Promise<void> {
    try {
      console.log(`🗑️ Cancelling virtual activity notifications for activity ${activity.id}`);

      // Отменяем основное уведомление
      await this.cancelNotificationForActivity(activity.id);

      // Если это кастомный интервал, отменяем виртуальные уведомления
      if (activity.repeat_type && activity.repeat_type !== 'none' && activity.repeat_interval > 1) {
        const { getRepeatDates } = await import('../utils/repeatHelpers');
        
        const baseDate = new Date(activity.date);
        const repeatDates = getRepeatDates(
          baseDate,
          activity.repeat_type,
          activity.repeat_interval,
          activity.repeat_end_date,
          activity.repeat_count
        );

        const maxNotifications = Math.min(7, repeatDates.length);

        for (let i = 0; i < maxNotifications; i++) {
          const virtualActivityId = activity.id + (i + 1) * 1000000;
          await this.cancelNotificationForActivity(virtualActivityId);
        }

        console.log(`🗑️ Cancelled ${maxNotifications} virtual activity notifications`);
      }
    } catch (error) {
      console.error('❌ Failed to cancel virtual activity notifications:', error);
    }
  }

  /**
   * Форматирует дату как локальную строку времени
   */
  private formatLocalDateTime(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
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
      case 'CARE':
        return i18n.t('activity.notifications.care_title', { petName: pet });
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
      case 'FEEDING': {
        const foodTypePart = activity.food_type ? ` (${activity.food_type})` : '';
        body = i18n.t('activity.notifications.feeding_body', {
          petName: pet,
          foodTypePart
        });
        break;
      }
      case 'CARE':
        body = i18n.t('activity.notifications.care_body', { petName: pet });
        break;
      case 'ACTIVITY': {
        const durationPart = activity.duration ? ` (${activity.duration})` : '';
        body = i18n.t('activity.notifications.activity_body', {
          petName: pet,
          durationPart
        });
        break;
      }
      default:
        body = i18n.t('activity.notifications.general_body', { petName: pet });
    }
    if (activity.notes && activity.notes.trim()) {
      body += `\n\n${activity.notes}`;
    }
    return body;
  }

  private createTrigger(activity: ActivityRecord, triggerDate: Date): Notifications.NotificationTriggerInput {
    console.log(`🎯 Creating trigger for activity ${activity.id}, repeat_type: ${activity.repeat_type}, repeat_interval: ${activity.repeat_interval}`);
    
    // Если нет повторов или интервал = 1, используем стандартные триггеры
    if (!activity.repeat_type || activity.repeat_type === 'none' || activity.repeat_interval === 1) {
      switch (activity.repeat_type) {
        case 'day':
          return {
            type: Notifications.SchedulableTriggerInputTypes.DAILY,
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
          };
        case 'week':
          return {
            type: Notifications.SchedulableTriggerInputTypes.WEEKLY,
            weekday: triggerDate.getDay() + 1,
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
          };
        case 'month':
          return {
            type: Notifications.SchedulableTriggerInputTypes.MONTHLY,
            day: triggerDate.getDate(),
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
          };
        case 'year':
          return {
            type: Notifications.SchedulableTriggerInputTypes.YEARLY,
            month: triggerDate.getMonth() + 1,
            day: triggerDate.getDate(),
            hour: triggerDate.getHours(),
            minute: triggerDate.getMinutes(),
          };
        case 'none':
        default:
          return {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: triggerDate,
          };
      }
    }
    
    // Для кастомных интервалов (например, каждые 3 дня) создаем только одно уведомление
    // и будем пересоздавать его вручную через background task
    console.log(`⚠️ Custom interval ${activity.repeat_interval} not supported by Expo, creating single notification`);
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
    // 🌐 Skip notification cancellation for web platform
    if (Platform.OS === 'web') {
      console.log(`🌐 Skipping notification cancellation for web platform (activity ${activityId})`);
      return true;
    }

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
    // 🌐 Skip extension reminder cancellation for web platform
    if (Platform.OS === 'web') {
      console.log(`🌐 Skipping extension reminder cancellation for web platform (activity ${activityId})`);
      return true;
    }

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
    // 🌐 Skip missed notifications check for web platform
    if (Platform.OS === 'web') {
      console.log('🌐 Skipping missed notifications check for web platform');
      return;
    }

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
              
              // Если это кастомный интервал, пересоздаем уведомление
              if (data.customInterval) {
                await this.rescheduleCustomIntervalNotification(notification, data);
              }
            }
          }
        }
      }
    } catch (error) {
      console.error('Failed to check missed notifications:', error);
    }
  }

  private async rescheduleCustomIntervalNotification(
    notification: Notifications.NotificationRequest, 
    data: any
  ): Promise<void> {
    try {
      // Отменяем старое уведомление
      await Notifications.cancelScheduledNotificationAsync(notification.identifier);
      
      // Вычисляем следующую дату
      const lastDate = new Date();
      if (notification.trigger && 'date' in notification.trigger && notification.trigger.date) {
        const triggerDate = notification.trigger.date;
        if (triggerDate instanceof Date) {
          lastDate.setTime(triggerDate.getTime());
        } else if (typeof triggerDate === 'number') {
          lastDate.setTime(triggerDate);
        }
      }
      
      const nextDate = this.calculateNextCustomIntervalDate(
        lastDate,
        data.repeatType,
        data.repeatInterval,
        data.repeatEndDate,
        data.repeatCount
      );
      
      if (nextDate && nextDate > new Date()) {
        // Создаем новое уведомление
        const newNotification: Notifications.NotificationRequestInput = {
          content: {
            title: notification.content.title,
            body: notification.content.body,
            data: notification.content.data,
            sound: notification.content.sound || 'default',
          },
          trigger: {
            type: Notifications.SchedulableTriggerInputTypes.DATE,
            date: nextDate,
          },
        };
        
        const newNotificationId = await Notifications.scheduleNotificationAsync(newNotification);
        console.log(`🔄 Rescheduled custom interval notification ${newNotificationId} for ${nextDate.toISOString()}`);
      }
    } catch (error) {
      console.error('Failed to reschedule custom interval notification:', error);
    }
  }

  private calculateNextCustomIntervalDate(
    lastDate: Date,
    repeatType: string,
    repeatInterval: number,
    repeatEndDate?: string,
    repeatCount?: number
  ): Date | null {
    const nextDate = new Date(lastDate);
    
    switch (repeatType) {
      case 'day':
        nextDate.setDate(nextDate.getDate() + repeatInterval);
        break;
      case 'week':
        nextDate.setDate(nextDate.getDate() + (repeatInterval * 7));
        break;
      case 'month':
        nextDate.setMonth(nextDate.getMonth() + repeatInterval);
        break;
      case 'year':
        nextDate.setFullYear(nextDate.getFullYear() + repeatInterval);
        break;
      default:
        return null;
    }
    
    // Проверяем ограничения
    if (repeatEndDate && nextDate > new Date(repeatEndDate)) {
      return null;
    }
    
    return nextDate;
  }

  async cleanupExpiredNotifications(): Promise<void> {
    // 🌐 Skip cleanup for web platform
    if (Platform.OS === 'web') {
      console.log('🌐 Skipping expired notifications cleanup for web platform');
      return;
    }

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
    // 🌐 Return 0 for web platform
    if (Platform.OS === 'web') {
      return 0;
    }

    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      return notifications.length;
    } catch (error) {
      console.error('Failed to get scheduled notifications count:', error);
      return 0;
    }
  }

  async getScheduledNotificationsInfo(): Promise<{ count: number; notifications: any[] }> {
    // 🌐 Skip for web platform
    if (Platform.OS === 'web') {
      return { count: 0, notifications: [] };
    }

    try {
      const notifications = await Notifications.getAllScheduledNotificationsAsync();
      console.log(`📋 Found ${notifications.length} scheduled notifications`);
      
      const notificationsInfo = notifications.map(notification => ({
        id: notification.identifier,
        title: notification.content.title,
        body: notification.content.body,
        data: notification.content.data,
        trigger: notification.trigger,
      }));
      
      return { count: notifications.length, notifications: notificationsInfo };
    } catch (error) {
      console.error('❌ Failed to get scheduled notifications info:', error);
      return { count: 0, notifications: [] };
    }
  }

  async cancelAllNotifications(): Promise<boolean> {
    // 🌐 Skip notification cancellation for web platform
    if (Platform.OS === 'web') {
      console.log('🌐 Skipping all notifications cancellation for web platform');
      return true;
    }

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
    // 🌐 Return false for web platform
    if (Platform.OS === 'web') {
      return false;
    }

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
    // 🌐 Skip test notification for web platform
    if (Platform.OS === 'web') {
      console.log('🌐 Skipping test notification for web platform');
      return null;
    }

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

  /**
   * Обновляет виртуальные уведомления для кастомных интервалов
   * Вызывается через background task для поддержания актуальности уведомлений
   */
  async updateVirtualActivityNotifications(): Promise<void> {
    // 🌐 Skip for web platform
    if (Platform.OS === 'web') {
      console.log('🌐 Skipping virtual notification update for web platform');
      return;
    }

    try {
      console.log('🔄 Updating virtual activity notifications...');

      // Получаем все запланированные уведомления
      const scheduledNotifications = await Notifications.getAllScheduledNotificationsAsync();
      const now = new Date();
      let updatedCount = 0;

      for (const notification of scheduledNotifications) {
        const data = notification.content.data;
        
        // Проверяем только уведомления для кастомных интервалов
        if (data?.customInterval && data?.activityId) {
          const triggerDate = notification.trigger && 'date' in notification.trigger 
            ? new Date(notification.trigger.date as Date)
            : null;

          if (triggerDate && triggerDate < now) {
            console.log(`⚠️ Found expired virtual notification for activity ${data.activityId}`);
            
            // Отменяем устаревшее уведомление
            await Notifications.cancelScheduledNotificationAsync(notification.identifier);
            
            // Создаем новое уведомление для следующей даты
            try {
                             const nextDate = this.calculateNextCustomIntervalDate(
                 triggerDate,
                 data.repeatType as string,
                 data.repeatInterval as number,
                 data.repeatEndDate as string,
                 data.repeatCount as number
               );

              if (nextDate && nextDate > now) {
                const newNotification: Notifications.NotificationRequestInput = {
                  content: {
                    title: notification.content.title,
                    body: notification.content.body,
                    data: notification.content.data,
                    sound: notification.content.sound || 'default',
                  },
                  trigger: {
                    type: Notifications.SchedulableTriggerInputTypes.DATE,
                    date: nextDate,
                  },
                };

                const newNotificationId = await Notifications.scheduleNotificationAsync(newNotification);
                console.log(`✅ Updated virtual notification ${newNotificationId} for ${nextDate.toLocaleDateString()}`);
                updatedCount++;
              }
            } catch (error) {
              console.error(`❌ Failed to update virtual notification for activity ${data.activityId}:`, error);
            }
          }
        }
      }

      if (updatedCount > 0) {
        console.log(`🔄 Updated ${updatedCount} virtual activity notifications`);
      } else {
        console.log('✅ All virtual notifications are up to date');
      }

    } catch (error) {
      console.error('❌ Failed to update virtual activity notifications:', error);
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