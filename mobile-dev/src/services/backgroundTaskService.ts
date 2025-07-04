import * as TaskManager from 'expo-task-manager';
import * as BackgroundFetch from 'expo-background-fetch';
import { AppState, AppStateStatus } from 'react-native';
import { notificationService } from './notificationService';
import { checkAndScheduleMissedNotifications } from './repeatActivityService';
import { apiService } from './api';

const BACKGROUND_TASK_NAME = 'vetly-background-task';
const APP_STATE_TASK_NAME = 'vetly-app-state-task';

export class BackgroundTaskService {
  private static instance: BackgroundTaskService;
  private isInitialized = false;
  private appStateListener: any = null;

  public static getInstance(): BackgroundTaskService {
    if (!BackgroundTaskService.instance) {
      BackgroundTaskService.instance = new BackgroundTaskService();
    }
    return BackgroundTaskService.instance;
  }

  async initialize(): Promise<boolean> {
    if (this.isInitialized) {
      return true;
    }

    try {
      console.log('🔄 Initializing background task service...');

      // Register background fetch task
      await this.registerBackgroundFetchTask();

      // Register app state change listener
      this.registerAppStateListener();

      this.isInitialized = true;
      console.log('✅ Background task service initialized successfully');
      return true;

    } catch (error) {
      console.error('❌ Failed to initialize background task service:', error);
      return false;
    }
  }

  private async registerBackgroundFetchTask(): Promise<void> {
    try {
      // Define the background task
      TaskManager.defineTask(BACKGROUND_TASK_NAME, async () => {
        try {
          console.log('🔄 Background fetch task running...');
          
          // Check if user is authenticated
          const isAuthenticated = await apiService.isAuthenticated();
          if (!isAuthenticated) {
            console.log('🔄 User not authenticated, skipping background tasks');
            return BackgroundFetch.BackgroundFetchResult.NoData;
          }

          // Check for missed notifications
          await checkAndScheduleMissedNotifications();
          
          // Clean up expired notifications
          await notificationService.cleanupExpiredNotifications();
          
          console.log('✅ Background fetch task completed successfully');
          return BackgroundFetch.BackgroundFetchResult.NewData;
          
        } catch (error) {
          console.error('❌ Background fetch task failed:', error);
          return BackgroundFetch.BackgroundFetchResult.Failed;
        }
      });

      // Register the background task
      await BackgroundFetch.registerTaskAsync(BACKGROUND_TASK_NAME, {
        minimumInterval: 3600, // Every hour
        stopOnTerminate: false,
        startOnBoot: true,
      });

      console.log('✅ Background fetch task registered');
    } catch (error) {
      console.error('❌ Failed to register background fetch task:', error);
    }
  }

  private registerAppStateListener(): void {
    try {
      this.appStateListener = AppState.addEventListener('change', async (nextAppState: AppStateStatus) => {
        console.log(`📱 App state changed to: ${nextAppState}`);
        
        if (nextAppState === 'active') {
          await this.handleAppBecameActive();
        }
      });

      console.log('✅ App state listener registered');
    } catch (error) {
      console.error('❌ Failed to register app state listener:', error);
    }
  }

  private async handleAppBecameActive(): Promise<void> {
    try {
      console.log('📱 App became active, performing background tasks...');
      
      // Check if user is authenticated
      const isAuthenticated = await apiService.isAuthenticated();
      if (!isAuthenticated) {
        console.log('📱 User not authenticated, skipping background tasks');
        return;
      }

      // Check for missed notifications
      await checkAndScheduleMissedNotifications();
      
      // Clean up expired notifications
      await notificationService.cleanupExpiredNotifications();
      
      console.log('✅ App state background tasks completed');
      
    } catch (error) {
      console.error('❌ Failed to handle app state change:', error);
    }
  }

  async unregisterBackgroundTask(): Promise<void> {
    try {
      await BackgroundFetch.unregisterTaskAsync(BACKGROUND_TASK_NAME);
      console.log('✅ Background fetch task unregistered');
    } catch (error) {
      console.error('❌ Failed to unregister background fetch task:', error);
    }
  }

  async getBackgroundFetchStatus(): Promise<BackgroundFetch.BackgroundFetchStatus | null> {
    try {
      const status = await BackgroundFetch.getStatusAsync();
      console.log(`📊 Background fetch status: ${status}`);
      return status;
    } catch (error) {
      console.error('❌ Failed to get background fetch status:', error);
      return null;
    }
  }

  async getBackgroundFetchResult(): Promise<BackgroundFetch.BackgroundFetchResult | null> {
    try {
      const result = await BackgroundFetch.getStatusAsync();
      console.log(`📊 Background fetch result: ${result}`);
      
      // Convert BackgroundFetchStatus to BackgroundFetchResult
      switch (result) {
        case BackgroundFetch.BackgroundFetchStatus.Available:
          return BackgroundFetch.BackgroundFetchResult.NewData;
        case BackgroundFetch.BackgroundFetchStatus.Denied:
          return BackgroundFetch.BackgroundFetchResult.Failed;
        case BackgroundFetch.BackgroundFetchStatus.Restricted:
          return BackgroundFetch.BackgroundFetchResult.Failed;
        default:
          return BackgroundFetch.BackgroundFetchResult.NoData;
      }
    } catch (error) {
      console.error('❌ Failed to get background fetch result:', error);
      return null;
    }
  }

  // Get human-readable status
  async getBackgroundTaskStatusText(): Promise<string> {
    try {
      const status = await this.getBackgroundFetchStatus();
      if (!status) return 'Unknown';
      
      switch (status) {
        case BackgroundFetch.BackgroundFetchStatus.Available:
          return 'Available';
        case BackgroundFetch.BackgroundFetchStatus.Denied:
          return 'Denied';
        case BackgroundFetch.BackgroundFetchStatus.Restricted:
          return 'Restricted';
        default:
          return 'Unknown';
      }
    } catch (error) {
      console.error('❌ Failed to get background task status text:', error);
      return 'Error';
    }
  }

  // Check if background tasks are available
  async isBackgroundTaskAvailable(): Promise<boolean> {
    try {
      const status = await this.getBackgroundFetchStatus();
      return status === BackgroundFetch.BackgroundFetchStatus.Available;
    } catch (error) {
      console.error('❌ Failed to check background task availability:', error);
      return false;
    }
  }

  // Cleanup method
  cleanup(): void {
    if (this.appStateListener) {
      this.appStateListener.remove();
      this.appStateListener = null;
    }
    
    this.unregisterBackgroundTask();
  }
}

// Export singleton instance
export const backgroundTaskService = BackgroundTaskService.getInstance(); 