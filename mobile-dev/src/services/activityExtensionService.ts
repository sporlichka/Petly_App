import { ActivityRecord, ActivityRecordCreate } from '../types';
import { apiService } from './api';
import { notificationService } from './notificationService';
import { 
  createActivityWithRepeats, 
  RepeatActivityResult 
} from './repeatActivityService';
import { 
  getRepeatDates, 
  createRepeatActivity,
  scheduleExtensionReminder
} from '../utils/repeatHelpers';
import { ExtensionModalData, extensionModalService } from './extensionModalService';
import i18n from '../i18n';

export interface ActivityExtensionResult {
  success: boolean;
  originalActivity: ActivityRecord | null;
  newActivities: ActivityRecord[];
  notificationIds: string[];
  extensionReminderId?: string;
  error?: string;
}

export class ActivityExtensionService {
  private static instance: ActivityExtensionService;

  public static getInstance(): ActivityExtensionService {
    if (!ActivityExtensionService.instance) {
      ActivityExtensionService.instance = new ActivityExtensionService();
    }
    return ActivityExtensionService.instance;
  }

  /**
   * Продлевает активность на следующий период
   */
  async extendActivity(data: ExtensionModalData): Promise<ActivityExtensionResult> {
    const result: ActivityExtensionResult = {
      success: false,
      originalActivity: null,
      newActivities: [],
      notificationIds: [],
    };

    try {
      console.log(`🔄 Extending activity ${data.activityId} (${data.originalRepeat})`);

      // 1. Получаем исходную активность для проверки существования
      try {
        const originalActivity = await this.getActivityById(data.activityId);
        result.originalActivity = originalActivity;
        console.log(`✅ Found original activity: ${originalActivity.title}`);
      } catch (error) {
        console.warn(`⚠️ Original activity ${data.activityId} not found, proceeding with stored data`);
        // Если активность удалена, все равно продлеваем на основе сохраненных данных
      }

      // 2. Проверяем доступность питомца
      const isPetAccessible = await this.validatePetAccess(data.petId);
      if (!isPetAccessible) {
        throw new Error(`Pet with ID ${data.petId} not found or access denied. Please check if the pet still exists in your account.`);
      }

      // 3. Вычисляем дату начала продления
      const extensionStartDate = new Date(data.scheduledDate);
      console.log(`📅 Extension start date: ${extensionStartDate.toLocaleDateString()}`);

      // 4. Генерируем новые даты для продления
      const newDates = this.generateExtensionDates(extensionStartDate, data.originalRepeat);
      console.log(`📅 Generated ${newDates.length} new dates for extension:`);
      newDates.forEach((date, index) => {
        console.log(`  ${index + 1}. ${date.toLocaleDateString()}`);
      });

      // 5. Создаем новые активности
      const newActivities: ActivityRecord[] = [];
      const notificationIds: string[] = [];

      // Получаем имя питомца для уведомлений
      const petName = await this.getPetName(data.petId);

      for (const date of newDates) {
        try {
          const newActivity = await this.createExtensionActivity(data, date);
          newActivities.push(newActivity);

          // Планируем уведомление для новой активности
          const notificationId = await this.scheduleNotificationForActivity(newActivity, petName);
          if (notificationId) {
            notificationIds.push(notificationId);
          }

          console.log(`✅ Created extension activity for ${date.toLocaleDateString()}`);
        } catch (error) {
          console.error(`❌ Failed to create extension activity for ${date.toLocaleDateString()}:`, error);
        }
      }

      result.newActivities = newActivities;
      result.notificationIds = notificationIds;

      // 6. Планируем следующее напоминание о продлении
      if (newActivities.length > 0) {
        try {
          const lastActivity = newActivities[newActivities.length - 1];
          const extensionReminderId = await scheduleExtensionReminder(lastActivity, data.originalRepeat);
          
          if (extensionReminderId) {
            result.extensionReminderId = extensionReminderId;
            console.log(`📲 Scheduled next extension reminder and modal`);
          }
        } catch (error) {
          console.error('❌ Failed to schedule next extension reminder:', error);
        }
      }

      result.success = newActivities.length > 0;
      
      console.log(`🎉 Extension complete: ${newActivities.length} activities created, ${notificationIds.length} notifications scheduled`);
      
      return result;

    } catch (error) {
      console.error('❌ Failed to extend activity:', error);
      result.error = error instanceof Error ? error.message : 'Unknown error';
      return result;
    }
  }

  /**
   * Получает активность по ID
   */
  private async getActivityById(activityId: number): Promise<ActivityRecord> {
    // Поскольку у нас нет прямого API для получения одной активности,
    // получаем все и фильтруем
    const allActivities = await apiService.getAllUserActivityRecords();
    const activity = allActivities.find(a => a.id === activityId);
    
    if (!activity) {
      throw new Error(`Activity ${activityId} not found`);
    }
    
    return activity;
  }

  /**
   * Генерирует даты для продления активности
   * @param scheduledDate Дата начала продления (следующий день после завершения серии)
   * @param repeat Тип повторения (daily/weekly/monthly)
   * @returns Массив дат для новых активностей
   */
  private generateExtensionDates(scheduledDate: Date, repeat: 'daily' | 'weekly' | 'monthly'): Date[] {
    // scheduledDate уже является корректной датой начала продления
    // Для daily: создаем 7 активностей начиная с этой даты
    // Для weekly: создаем 4 активности начиная с этой даты  
    // Для monthly: создаем 3 активности начиная с этой даты
    const startDate = new Date(scheduledDate);
    
    console.log(`📅 Extension will start from: ${startDate.toLocaleDateString()}`);
    
    return getRepeatDates(startDate, repeat);
  }

  /**
   * Создает новую активность для продления
   */
  private async createExtensionActivity(
    data: ExtensionModalData, 
    date: Date
  ): Promise<ActivityRecord> {
    const activityData: ActivityRecordCreate = {
      pet_id: data.petId,
      category: data.category as any,
      title: data.activityTitle,
      date: this.formatLocalDateTime(date),
      time: this.formatLocalDateTime(date),
      repeat: undefined, // Продления не повторяются сами
      notify: true, // Всегда включаем уведомления для продлений
      notes: i18n.t('activity.notifications.extension_reminder_body', { 
        repeatType: data.originalRepeat,
        petName: 'your pet'
      }),
    };

    return await apiService.createActivityRecord(activityData);
  }

  /**
   * Форматирует дату в локальную строку
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

  /**
   * Планирует уведомление для активности
   */
  private async scheduleNotificationForActivity(
    activity: ActivityRecord, 
    petName: string
  ): Promise<string | null> {
    try {
      if (!activity.notify) {
        return null;
      }

      const notificationId = await notificationService.scheduleActivityNotification(activity, petName);
      return notificationId;
    } catch (error) {
      console.error(`Failed to schedule notification for activity ${activity.id}:`, error);
      return null;
    }
  }

  /**
   * Получает имя питомца и проверяет его существование
   */
  private async getPetName(petId: number): Promise<string> {
    try {
      const pets = await apiService.getPets();
      const pet = pets.find(p => p.id === petId);
      
      if (!pet) {
        console.warn(`⚠️ Pet with ID ${petId} not found, using default name`);
        return 'your pet';
      }
      
      console.log(`🐾 Found pet: ${pet.name} (ID: ${petId})`);
      return pet.name;
    } catch (error) {
      console.error('Failed to get pet name:', error);
      return 'your pet';
    }
  }

  /**
   * Проверяет доступность питомца для пользователя
   */
  private async validatePetAccess(petId: number): Promise<boolean> {
    try {
      const pets = await apiService.getPets();
      const pet = pets.find(p => p.id === petId);
      return !!pet;
    } catch (error) {
      console.error(`Failed to validate pet access for ID ${petId}:`, error);
      return false;
    }
  }


}

// Export singleton instance
export const activityExtensionService = ActivityExtensionService.getInstance(); 