import { ActivityRecordCreate, ActivityRecord } from '../types';
import { apiService } from './api';
import { notificationService } from './notificationService';
import { extensionModalService } from './extensionModalService';
import { 
  getRepeatDates, 
  createRepeatActivity, 
  shouldCreateRepeats,
  scheduleExtensionReminder,
  getRepeatDescription
} from '../utils/repeatHelpers';

/**
 * Получает имя питомца по ID
 */
async function getPetName(petId: number): Promise<string> {
  try {
    const pets = await apiService.getPets();
    const pet = pets.find(p => p.id === petId);
    return pet?.name || 'your pet';
  } catch (error) {
    console.error('Failed to get pet name:', error);
    return 'your pet';
  }
}

/**
 * Планирует уведомление для активности
 */
async function scheduleNotificationForActivity(activity: ActivityRecord, petName: string): Promise<string | null> {
  try {
    console.log(`🔔 RepeatService: Attempting to schedule notification for activity ${activity.id}`);
    console.log(`  - Activity notify: ${activity.notify}`);
    console.log(`  - Pet name: ${petName}`);
    
    if (!activity.notify) {
      console.log(`❌ RepeatService: Notifications disabled for activity ${activity.id}, skipping`);
      return null;
    }

    console.log(`📞 RepeatService: Calling notificationService.scheduleActivityNotification...`);
    const notificationId = await notificationService.scheduleActivityNotification(activity, petName);
    console.log(`📞 RepeatService: Notification service returned: ${notificationId}`);
    
    if (notificationId) {
      console.log(`✅ RepeatService: Scheduled notification ${notificationId} for activity ${activity.id}`);
      return notificationId;
    } else {
      console.log(`❌ RepeatService: Failed to schedule notification for activity ${activity.id} - service returned null`);
      return null;
    }
  } catch (error) {
    console.error(`❌ RepeatService: Error scheduling notification for activity ${activity.id}:`, error);
    return null;
  }
}

export interface RepeatActivityResult {
  success: boolean;
  mainActivity: ActivityRecord;
  repeatActivities: ActivityRecord[];
  extensionReminderId?: string;
  notificationIds: string[];
  errors: string[];
}

/**
 * Создает основную активность и все повторяющиеся записи
 */
export async function createActivityWithRepeats(
  activityData: ActivityRecordCreate
): Promise<RepeatActivityResult> {
  const result: RepeatActivityResult = {
    success: false,
    mainActivity: {} as ActivityRecord,
    repeatActivities: [],
    notificationIds: [],
    errors: [],
  };

  try {
    console.log('🔄 Creating activity with repeats:', activityData);

    // 1. Создаем основную активность
    const mainActivity = await apiService.createActivityRecord(activityData);
    result.mainActivity = mainActivity;
    
    console.log('✅ Main activity created:', mainActivity.id);

    // 2. Планируем уведомление для основной активности (ВСЕГДА, даже для одиночных активностей)
    console.log(`🔔 Planning notification for main activity ${mainActivity.id}`);
    try {
      const petName = await getPetName(mainActivity.pet_id);
      console.log(`🐾 Pet name: ${petName}`);

      const mainNotificationId = await scheduleNotificationForActivity(mainActivity, petName);
      if (mainNotificationId) {
        result.notificationIds.push(mainNotificationId);
        console.log(`✅ Main activity notification scheduled: ${mainNotificationId}`);
      } else {
        console.log(`❌ Failed to schedule notification for main activity ${mainActivity.id}`);
      }
    } catch (error) {
      console.error('❌ Failed to schedule main activity notification:', error);
      result.errors.push(`Failed to schedule main activity notification: ${error}`);
    }

    // 3. Проверяем, нужно ли создавать повторения
    if (!shouldCreateRepeats(activityData.repeat)) {
      console.log('📅 No repeats needed, activity creation complete');
      console.log(`🔔 Final notification summary: ${result.notificationIds.length} notifications scheduled`);
      result.success = true;
      return result;
    }

    const repeat = activityData.repeat as 'daily' | 'weekly' | 'monthly';
    console.log(`🔄 Creating repeats for: ${repeat}`);

    // 4. Генерируем даты для повторений
    const baseDate = new Date(activityData.date);
    const repeatDates = getRepeatDates(baseDate, repeat);
    
    console.log(`📅 Generated ${repeatDates.length} repeat dates:`, 
      repeatDates.map(d => d.toLocaleDateString())
    );

    // 5. Создаем активности для каждой даты повторения
    const repeatPromises = repeatDates.map(async (date, index) => {
      try {
        const repeatActivity = createRepeatActivity(activityData, date);
        console.log(`📝 Creating repeat activity ${index + 1}/${repeatDates.length} for ${date.toLocaleDateString()}`);
        return await apiService.createActivityRecord(repeatActivity);
      } catch (error) {
        console.error(`❌ Failed to create repeat activity ${index + 1}:`, error);
        result.errors.push(`Failed to create repeat ${index + 1}: ${error}`);
        return null;
      }
    });

    // Ждем создания всех повторяющихся активностей
    const repeatResults = await Promise.allSettled(repeatPromises);
    
    // Собираем успешно созданные активности
    repeatResults.forEach((res, index) => {
      if (res.status === 'fulfilled' && res.value) {
        result.repeatActivities.push(res.value);
        console.log(`✅ Repeat activity ${index + 1} created:`, res.value.id);
      } else {
        console.error(`❌ Repeat activity ${index + 1} failed:`, res.status === 'rejected' ? res.reason : 'Unknown error');
        result.errors.push(`Repeat activity ${index + 1} failed to create`);
      }
    });

    // 6. Планируем уведомления для повторяющихся активностей
    console.log(`🔔 Planning notifications for ${result.repeatActivities.length} repeat activities`);
    
    try {
      const petName = await getPetName(mainActivity.pet_id);

      // Планируем уведомления для повторяющихся активностей
      for (const repeatActivity of result.repeatActivities) {
        const notificationId = await scheduleNotificationForActivity(repeatActivity, petName);
        if (notificationId) {
          result.notificationIds.push(notificationId);
        }
      }

      console.log(`✅ Scheduled ${result.notificationIds.length} total notifications (1 main + ${result.notificationIds.length - 1} repeats)`);
    } catch (error) {
      console.error('❌ Failed to schedule repeat activity notifications:', error);
      result.errors.push(`Failed to schedule repeat activity notifications: ${error}`);
    }

    // 7. Планируем напоминание о продлении
    try {
      const extensionReminderId = await scheduleExtensionReminder(mainActivity, repeat);
      if (extensionReminderId) {
        result.extensionReminderId = extensionReminderId;
        console.log(`📲 Extension reminder scheduled:`, extensionReminderId);
      }
    } catch (error) {
      console.error('❌ Failed to schedule extension reminder:', error);
      result.errors.push(`Failed to schedule extension reminder: ${error}`);
    }

    // 8. Определяем успешность операции
    const totalExpected = repeatDates.length;
    const totalCreated = result.repeatActivities.length;
    
    result.success = totalCreated >= totalExpected * 0.5; // Считаем успешным если создано хотя бы 50%
    
    console.log(`🎉 Repeat creation complete: ${totalCreated}/${totalExpected} activities created`);
    console.log(`🔔 Final notification summary: ${result.notificationIds.length} notifications scheduled`);
    
    if (result.errors.length > 0) {
      console.warn('⚠️ Some errors occurred:', result.errors);
    }

    return result;

  } catch (error) {
    console.error('❌ Failed to create activity with repeats:', error);
    result.errors.push(`Main error: ${error}`);
    result.success = false;
    return result;
  }
}

/**
 * Обновляет активность и пересоздает повторения если необходимо
 */
export async function updateActivityWithRepeats(
  activityId: number,
  activityUpdate: Partial<ActivityRecordCreate>,
  originalActivity: ActivityRecord
): Promise<RepeatActivityResult> {
  const result: RepeatActivityResult = {
    success: false,
    mainActivity: {} as ActivityRecord,
    repeatActivities: [],
    notificationIds: [],
    errors: [],
  };

  try {
    console.log('🔄 Updating activity with repeats:', activityId);

    // 1. Обновляем основную активность
    const updatedActivity = await apiService.updateActivityRecord(activityId, activityUpdate);
    result.mainActivity = updatedActivity;
    
    console.log('✅ Main activity updated:', updatedActivity.id);

    // 2. Если изменились параметры повторения, пересоздаем повторяющиеся активности
    if (activityUpdate.repeat !== undefined || activityUpdate.date || activityUpdate.time) {
      console.log('🔄 Repeat parameters changed, recreating repeat activities...');
      
      // TODO: Удалить существующие повторения (если они есть)
      // Это потребует дополнительной логики отслеживания связанных активностей
      
      // Создаем новые повторения если нужно
      if (shouldCreateRepeats(updatedActivity.repeat)) {
        const repeat = updatedActivity.repeat as 'daily' | 'weekly' | 'monthly';
        const baseDate = new Date(updatedActivity.date);
        const repeatDates = getRepeatDates(baseDate, repeat);
        
        const activityData: ActivityRecordCreate = {
          pet_id: updatedActivity.pet_id,
          category: updatedActivity.category,
          title: updatedActivity.title,
          date: updatedActivity.date,
          time: updatedActivity.time,
          repeat: updatedActivity.repeat,
          notify: updatedActivity.notify,
          notes: updatedActivity.notes,
          food_type: updatedActivity.food_type,
          quantity: updatedActivity.quantity,
          duration: updatedActivity.duration,
        };

        const repeatPromises = repeatDates.map(async (date, index) => {
          try {
            const repeatActivity = createRepeatActivity(activityData, date);
            return await apiService.createActivityRecord(repeatActivity);
          } catch (error) {
            console.error(`❌ Failed to create updated repeat activity ${index + 1}:`, error);
            result.errors.push(`Failed to create updated repeat ${index + 1}: ${error}`);
            return null;
          }
        });

        const repeatResults = await Promise.allSettled(repeatPromises);
        
        repeatResults.forEach((res, index) => {
          if (res.status === 'fulfilled' && res.value) {
            result.repeatActivities.push(res.value);
          }
        });
      }
    }

    result.success = true;
    return result;

  } catch (error) {
    console.error('❌ Failed to update activity with repeats:', error);
    result.errors.push(`Update error: ${error}`);
    result.success = false;
    return result;
  }
}

/**
 * Очищает все связанные с активностью модальные окна продления
 */
export async function cleanupExtensionModalsForActivity(activityId: number): Promise<void> {
  try {
    console.log(`🧹 Cleaning up extension modals for activity ${activityId}`);
    await extensionModalService.removeAllModalsForActivity(activityId);
    console.log(`✅ Extension modals cleaned up for activity ${activityId}`);
  } catch (error) {
    console.error(`❌ Failed to cleanup extension modals for activity ${activityId}:`, error);
  }
}

/**
 * Получает сводку для пользователя о том, что будет создано
 */
export function getRepeatSummary(
  repeat: string | undefined | null
): { willCreateRepeats: boolean; description: string; count: number } {
  if (!shouldCreateRepeats(repeat)) {
    return {
      willCreateRepeats: false,
      description: 'Будет создана только одна запись',
      count: 1,
    };
  }

  const repeatType = repeat as 'daily' | 'weekly' | 'monthly';
  const countMap = { daily: 7, weekly: 4, monthly: 3 };
  const count = countMap[repeatType] + 1; // +1 для основной записи
  
  return {
    willCreateRepeats: true,
    description: `Будет создано ${count} записей: основная + ${count - 1} повторений (${getRepeatDescription(repeatType)})`,
    count,
  };
} 