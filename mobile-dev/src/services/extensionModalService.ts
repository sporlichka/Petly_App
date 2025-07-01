import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityRecord } from '../types';

const EXTENSION_MODAL_STORAGE_KEY = 'extension_modal_queue';

export interface ExtensionModalData {
  activityId: number;
  activityTitle: string;
  originalRepeat: 'daily' | 'weekly' | 'monthly';
  petId: number;
  category: string;
  scheduledDate: string; // Дата, когда должна была показаться модалка
  createdAt: string;
}

export interface ExtensionModalQueue {
  [key: string]: ExtensionModalData; // key = `${activityId}_${scheduledDate}`
}

export class ExtensionModalService {
  private static instance: ExtensionModalService;

  public static getInstance(): ExtensionModalService {
    if (!ExtensionModalService.instance) {
      ExtensionModalService.instance = new ExtensionModalService();
    }
    return ExtensionModalService.instance;
  }

  /**
   * Добавляет модальное окно в очередь для показа
   */
  async scheduleExtensionModal(data: ExtensionModalData): Promise<void> {
    try {
      const queue = await this.getModalQueue();
      const key = `${data.activityId}_${data.scheduledDate}`;
      
      queue[key] = {
        ...data,
        createdAt: new Date().toISOString(),
      };

      await AsyncStorage.setItem(EXTENSION_MODAL_STORAGE_KEY, JSON.stringify(queue));
      console.log(`📋 Scheduled extension modal for activity ${data.activityId}`);
    } catch (error) {
      console.error('Failed to schedule extension modal:', error);
    }
  }

  /**
   * Получает все запланированные модальные окна
   */
  async getModalQueue(): Promise<ExtensionModalQueue> {
    try {
      const stored = await AsyncStorage.getItem(EXTENSION_MODAL_STORAGE_KEY);
      return stored ? JSON.parse(stored) : {};
    } catch (error) {
      console.error('Failed to get modal queue:', error);
      return {};
    }
  }

  /**
   * Получает модальные окна, готовые к показу (дата уже прошла)
   */
  async getPendingModals(): Promise<ExtensionModalData[]> {
    try {
      const queue = await this.getModalQueue();
      const now = new Date();
      const pending: ExtensionModalData[] = [];

      for (const [key, data] of Object.entries(queue)) {
        const scheduledDate = new Date(data.scheduledDate);
        if (scheduledDate <= now) {
          pending.push(data);
        }
      }

      console.log(`📋 Found ${pending.length} pending extension modals`);
      return pending;
    } catch (error) {
      console.error('Failed to get pending modals:', error);
      return [];
    }
  }

  /**
   * Удаляет модальное окно из очереди (после показа)
   */
  async removeExtensionModal(activityId: number, scheduledDate: string): Promise<void> {
    try {
      const queue = await this.getModalQueue();
      const key = `${activityId}_${scheduledDate}`;
      
      if (queue[key]) {
        delete queue[key];
        await AsyncStorage.setItem(EXTENSION_MODAL_STORAGE_KEY, JSON.stringify(queue));
        console.log(`📋 Removed extension modal for activity ${activityId}`);
      }
    } catch (error) {
      console.error('Failed to remove extension modal:', error);
    }
  }

  /**
   * Удаляет все модальные окна для конкретной активности
   */
  async removeAllModalsForActivity(activityId: number): Promise<void> {
    try {
      const queue = await this.getModalQueue();
      const newQueue: ExtensionModalQueue = {};

      for (const [key, data] of Object.entries(queue)) {
        if (data.activityId !== activityId) {
          newQueue[key] = data;
        }
      }

      await AsyncStorage.setItem(EXTENSION_MODAL_STORAGE_KEY, JSON.stringify(newQueue));
      console.log(`📋 Removed all extension modals for activity ${activityId}`);
    } catch (error) {
      console.error('Failed to remove modals for activity:', error);
    }
  }

  /**
   * Очищает устаревшие модальные окна (старше 30 дней)
   */
  async cleanupExpiredModals(): Promise<void> {
    try {
      const queue = await this.getModalQueue();
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
      const newQueue: ExtensionModalQueue = {};

      let removedCount = 0;
      for (const [key, data] of Object.entries(queue)) {
        const createdDate = new Date(data.createdAt);
        if (createdDate > thirtyDaysAgo) {
          newQueue[key] = data;
        } else {
          removedCount++;
        }
      }

      if (removedCount > 0) {
        await AsyncStorage.setItem(EXTENSION_MODAL_STORAGE_KEY, JSON.stringify(newQueue));
        console.log(`📋 Cleaned up ${removedCount} expired extension modals`);
      }
    } catch (error) {
      console.error('Failed to cleanup expired modals:', error);
    }
  }

  /**
   * Получает описание периода продления
   */
  getExtensionPeriodText(repeat: 'daily' | 'weekly' | 'monthly'): {
    period: string;
    days: number;
  } {
    switch (repeat) {
      case 'daily':
        return { period: '7 days', days: 7 };
      case 'weekly':
        return { period: '28 days (4 weeks)', days: 28 };
      case 'monthly':
        return { period: '90 days (3 months)', days: 90 };
      default:
        return { period: '7 days', days: 7 };
    }
  }
}

// Export singleton instance
export const extensionModalService = ExtensionModalService.getInstance(); 