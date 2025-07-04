import { useState, useEffect, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityRecord, ActivityNotification, NotificationStorage } from '../types';
import { notificationService } from '../services/notificationService';
import { apiService } from '../services/api';

const NOTIFICATION_STORAGE_KEY = 'activity_notifications';

export const useActivityNotifications = () => {
  const [notificationStorage, setNotificationStorage] = useState<NotificationStorage>({});
  const [isLoading, setIsLoading] = useState(true);

  // Load stored notifications on hook initialization
  useEffect(() => {
    loadStoredNotifications();
  }, []);

  const loadStoredNotifications = async () => {
    try {
      const stored = await AsyncStorage.getItem(NOTIFICATION_STORAGE_KEY);
      if (stored) {
        const parsed: NotificationStorage = JSON.parse(stored);
        setNotificationStorage(parsed);
      }
    } catch (error) {
      console.error('Failed to load stored notifications:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const saveNotificationStorage = async (storage: NotificationStorage) => {
    try {
      await AsyncStorage.setItem(NOTIFICATION_STORAGE_KEY, JSON.stringify(storage));
      setNotificationStorage(storage);
    } catch (error) {
      console.error('Failed to save notification storage:', error);
    }
  };

  // Helper function to get pet name by ID
  const getPetName = async (petId: number): Promise<string> => {
    try {
      const pets = await apiService.getPets();
      const pet = pets.find(p => p.id === petId);
      return pet?.name || 'your pet';
    } catch (error) {
      console.error('Failed to get pet name:', error);
      return 'your pet';
    }
  };

  const scheduleActivityNotification = useCallback(async (activity: ActivityRecord): Promise<boolean> => {
    try {
      console.log(`🔔 Starting notification scheduling for activity ${activity.id}`);
      console.log(`  - Activity notify: ${activity.notify}`);
      console.log(`  - Activity date: ${activity.date}`);
      
      // Don't schedule if notifications are disabled
      if (!activity.notify) {
        console.log(`❌ Notifications disabled for activity ${activity.id}`);
        return false;
      }

      // Check if notification service is available
      const isAvailable = await notificationService.isNotificationEnabled();
      console.log(`📱 Notification service available: ${isAvailable}`);
      if (!isAvailable) {
        console.log(`📱 Notification service not available for activity ${activity.id}`);
        return false;
      }

      // Get pet name for personalized notification
      const petName = await getPetName(activity.pet_id);
      console.log(`🐾 Found pet name: ${petName} for activity ${activity.id}`);

      // Cancel existing notification if any
      const cancelResult = await cancelActivityNotification(activity.id);
      console.log(`🗑️ Cancel existing notification result: ${cancelResult}`);

      // Schedule new notification with pet name
      console.log(`📅 Calling notificationService.scheduleActivityNotification...`);
      const notificationId = await notificationService.scheduleActivityNotification(activity, petName);
      console.log(`📅 Notification service returned: ${notificationId}`);
      
      if (notificationId) {
        // Store the notification ID locally
        const newStorage = {
          ...notificationStorage,
          [activity.id]: {
            activityId: activity.id,
            notificationId,
            createdAt: new Date().toISOString(),
          },
        };
        
        await saveNotificationStorage(newStorage);
        console.log(`✅ Scheduled and stored notification for activity ${activity.id}`);
        return true;
      }

      console.log(`❌ Failed to get notification ID for activity ${activity.id}`);
      return false;
    } catch (error) {
      console.error('❌ Failed to schedule activity notification:', error);
      return false;
    }
  }, [notificationStorage]);

  const cancelActivityNotification = useCallback(async (activityId: number): Promise<boolean> => {
    try {
      const storedNotification = notificationStorage[activityId];
      
      if (storedNotification) {
        // Cancel the notification
        const success = await notificationService.cancelNotificationForActivity(activityId);
        
        if (success) {
          // Remove from storage
          const newStorage = { ...notificationStorage };
          delete newStorage[activityId];
          await saveNotificationStorage(newStorage);
          console.log(`Cancelled and removed notification for activity ${activityId}`);
          return true;
        }
      }

      // Also try to cancel all notifications for this activity (backup cleanup)
      await notificationService.cancelAllNotificationsForActivity(activityId);
      
      return true;
    } catch (error) {
      console.error('Failed to cancel activity notification:', error);
      return false;
    }
  }, [notificationStorage]);

  const rescheduleActivityNotification = useCallback(async (activity: ActivityRecord): Promise<boolean> => {
    try {
      const storedNotification = notificationStorage[activity.id];
      const oldNotificationId = storedNotification?.notificationId;

      // Get pet name for personalized notification
      const petName = await getPetName(activity.pet_id);
      console.log(`🐾 Found pet name: ${petName} for rescheduling activity ${activity.id}`);

      // Schedule new notification (this will also cancel the old one)
      const notificationId = await notificationService.rescheduleActivityNotification(
        activity, 
        petName
      );

      if (notificationId) {
        // Update storage
        const newStorage = {
          ...notificationStorage,
          [activity.id]: {
            activityId: activity.id,
            notificationId,
            createdAt: new Date().toISOString(),
          },
        };
        
        await saveNotificationStorage(newStorage);
        console.log(`Rescheduled notification for activity ${activity.id}`);
        return true;
      } else {
        // If rescheduling failed but we had an old notification, clean it up
        if (storedNotification) {
          await cancelActivityNotification(activity.id);
        }
        return false;
      }
    } catch (error) {
      console.error('Failed to reschedule activity notification:', error);
      return false;
    }
  }, [notificationStorage]);

  const isNotificationScheduled = useCallback((activityId: number): boolean => {
    return !!notificationStorage[activityId];
  }, [notificationStorage]);

  const getNotificationInfo = useCallback((activityId: number): ActivityNotification | null => {
    return notificationStorage[activityId] || null;
  }, [notificationStorage]);

  const cleanupOrphanedNotifications = useCallback(async (activeActivityIds: number[]): Promise<void> => {
    try {
      const currentStorageIds = Object.keys(notificationStorage).map(id => parseInt(id));
      const orphanedIds = currentStorageIds.filter(id => !activeActivityIds.includes(id));

      if (orphanedIds.length > 0) {
        console.log(`Found ${orphanedIds.length} orphaned notifications, cleaning up...`);
        
        // Cancel orphaned notifications
        for (const activityId of orphanedIds) {
          await cancelActivityNotification(activityId);
        }
      }
    } catch (error) {
      console.error('Failed to cleanup orphaned notifications:', error);
    }
  }, [notificationStorage, cancelActivityNotification]);

  const getAllScheduledCount = useCallback(async (): Promise<number> => {
    return await notificationService.getScheduledNotificationsCount();
  }, []);

  return {
    // State
    isLoading,
    notificationStorage,
    
    // Actions
    scheduleActivityNotification,
    cancelActivityNotification,
    rescheduleActivityNotification,
    
    // Queries
    isNotificationScheduled,
    getNotificationInfo,
    getAllScheduledCount,
    
    // Maintenance
    cleanupOrphanedNotifications,
    
    // Reload storage (useful for debugging or manual refresh)
    reloadStorage: loadStoredNotifications,
  };
}; 