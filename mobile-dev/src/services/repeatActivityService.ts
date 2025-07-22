import { Platform } from 'react-native';
import { ActivityRecordCreate, ActivityRecord, RepeatType } from '../types';
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
import dayjs from 'dayjs';

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
 * Планирует уведомление для активности с улучшенной логикой
 */
async function scheduleNotificationForActivity(activity: ActivityRecord, petName: string): Promise<string | null> {
  try {
    console.log(`🔔 RepeatService: Scheduling notification for activity ${activity.id}`);
    console.log(`  - Activity notify: ${activity.notify}`);
    console.log(`  - Pet name: ${petName}`);
    
    if (!activity.notify) {
      console.log(`❌ RepeatService: Notifications disabled for activity ${activity.id}, skipping`);
      return null;
    }

    console.log(`📞 RepeatService: Calling enhanced notificationService.scheduleActivityNotification...`);
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

/**
 * Планирует уведомления для активности с гибридным подходом
 */
async function scheduleMonthlyNotifications(
  activity: ActivityRecord, 
  petName: string,
  startDate: Date
): Promise<string[]> {
  const notificationIds: string[] = [];
  try {
    console.log(`📅 Scheduling notifications for activity ${activity.id} with hybrid approach`);
    
    // Отменяем все старые уведомления для этой активности
    await notificationService.cancelAllNotificationsForActivity(activity.id);

    // Используем новый гибридный подход для виртуальных уведомлений
    const virtualNotificationIds = await notificationService.scheduleVirtualActivityNotifications(activity, petName);
    notificationIds.push(...virtualNotificationIds);
    
    console.log(`✅ Scheduled ${virtualNotificationIds.length} notifications for activity ${activity.id} with repeat type: ${activity.repeat_type}`);
    
    return notificationIds;
  } catch (error) {
    console.error(`❌ Failed to schedule notification for activity ${activity.id}:`, error);
    return notificationIds;
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
 * Создает основную активность с полями повторов (без создания множественных записей в БД)
 */
export async function createActivityWithRepeats(
  activityData: ActivityRecordCreate
): Promise<RepeatActivityResult> {
  const result: RepeatActivityResult = {
    success: false,
    mainActivity: {} as ActivityRecord,
    repeatActivities: [], // Теперь пустой массив, так как не создаем дополнительные записи
    notificationIds: [],
    errors: [],
  };

  try {
    console.log('🔄 Creating activity with enhanced repeats:', activityData);

    // 1. Создаем основную активность с полями повторов
    const mainActivity = await apiService.createActivityRecord(activityData);
    result.mainActivity = mainActivity;
    
    console.log('✅ Main activity created with repeat fields:', mainActivity.id);

    // 2. Планируем уведомления для всех дат повторов
    console.log(`🔔 Planning notifications for activity ${mainActivity.id} with repeats`);
    try {
      const petName = await getPetName(mainActivity.pet_id);
      console.log(`🐾 Pet name: ${petName}`);

      // Планируем уведомления для всех дат повторов
      const mainNotificationIds = await scheduleMonthlyNotifications(mainActivity, petName, new Date(mainActivity.date));
      result.notificationIds.push(...mainNotificationIds);
      
      console.log(`✅ Activity notifications scheduled: ${mainNotificationIds.length} notifications`);
    } catch (error) {
      console.error('❌ Failed to schedule activity notifications:', error);
      result.errors.push(`Failed to schedule activity notifications: ${error}`);
    }

    // 3. Планируем напоминание о продлении только для стандартных интервалов
    if (shouldCreateRepeats(activityData.repeat_type) && activityData.repeat_interval === 1) {
      try {
        const extensionReminderId = await scheduleExtensionReminder(mainActivity, activityData.repeat_type, activityData.repeat_interval);
        if (extensionReminderId) {
          result.extensionReminderId = extensionReminderId;
          console.log(`📲 Extension reminder scheduled:`, extensionReminderId);
        }
      } catch (error) {
        console.error('❌ Failed to schedule extension reminder:', error);
        result.errors.push(`Failed to schedule extension reminder: ${error}`);
      }
    }

    result.success = true;
    console.log(`🎉 Activity creation complete with repeat fields`);
    console.log(`🔔 Final notification summary: ${result.notificationIds.length} notifications scheduled`);
    
    if (result.errors.length > 0) {
      console.warn('⚠️ Some errors occurred:', result.errors);
    }

    return result;

  } catch (error) {
    console.error('❌ Failed to create activity with enhanced repeats:', error);
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
    console.log('🔄 Updating activity with enhanced repeats:', activityId);

    // 1. Отменяем все существующие уведомления для этой активности
    await notificationService.cancelAllNotificationsForActivity(activityId);

    // 2. Обновляем основную активность
    const updatedActivity = await apiService.updateActivityRecord(activityId, activityUpdate);
    result.mainActivity = updatedActivity;
    
    console.log('✅ Main activity updated:', updatedActivity.id);

    // 3. Планируем новые уведомления для обновленной активности с гибридным подходом
    try {
      const petName = await getPetName(updatedActivity.pet_id);
      const notificationIds = await scheduleMonthlyNotifications(updatedActivity, petName, new Date(updatedActivity.date));
      result.notificationIds.push(...notificationIds);
      console.log(`✅ Rescheduled ${notificationIds.length} notifications for updated activity with hybrid approach`);
    } catch (error) {
      console.error('❌ Failed to reschedule notifications for updated activity:', error);
      result.errors.push(`Failed to reschedule notifications: ${error}`);
    }

    // 4. Если изменились параметры повторения, пересоздаем повторяющиеся активности
    if (activityUpdate.repeat_type !== undefined || activityUpdate.date || activityUpdate.time) {
      console.log('🔄 Repeat parameters changed, recreating repeat activities...');
      
      // TODO: Удалить существующие повторения (если они есть)
      // Это потребует дополнительной логики отслеживания связанных активностей
      
      // Создаем новые повторения если нужно
      if (shouldCreateRepeats(updatedActivity.repeat_type)) {
        const baseDate = new Date(updatedActivity.date);
        const repeatDates = getRepeatDates(
          baseDate, 
          updatedActivity.repeat_type, 
          updatedActivity.repeat_interval,
          updatedActivity.repeat_end_date,
          updatedActivity.repeat_count
        );
        
        const activityData: ActivityRecordCreate = {
          pet_id: updatedActivity.pet_id,
          category: updatedActivity.category,
          title: updatedActivity.title,
          date: updatedActivity.date,
          time: updatedActivity.time,
          repeat_type: updatedActivity.repeat_type,
          repeat_interval: updatedActivity.repeat_interval,
          repeat_end_date: updatedActivity.repeat_end_date,
          repeat_count: updatedActivity.repeat_count,
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

        // НЕ планируем уведомления для новых повторений - они уже запланированы в основной активности
        console.log(`🔔 Skipping notification scheduling for ${result.repeatActivities.length} updated repeat activities (already handled by main activity)`);
      }
    }

    result.success = true;
    return result;

  } catch (error) {
    console.error('❌ Failed to update activity with enhanced repeats:', error);
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
  repeat: RepeatType | undefined | null
): { willCreateRepeats: boolean; description: string; count: number } {
  if (!shouldCreateRepeats(repeat)) {
    return {
      willCreateRepeats: false,
      description: 'Будет создана только одна запись',
      count: 1,
    };
  }

  const countMap: Record<RepeatType, number> = { day: 7, week: 4, month: 3, year: 1, none: 0 };
  const repeatType = repeat || 'day';
  const count = countMap[repeatType] + 1; // +1 для основной записи
  
  return {
    willCreateRepeats: true,
    description: `Будет создано ${count} записей: основная + ${count - 1} повторений (${getRepeatDescription(repeatType)})`,
    count,
  };
}

/**
 * Проверяет и планирует пропущенные уведомления
 */
export async function checkAndScheduleMissedNotifications(): Promise<void> {
  // 🌐 Skip missed notifications check for web platform
  if (Platform.OS === 'web') {
    console.log('🌐 Skipping missed notifications check for web platform');
    return;
  }

  try {
    console.log('🔍 Checking for missed notifications in repeat service...');
    
    // Получаем все активности пользователя
    const allActivities = await apiService.getAllUserActivityRecords();
    const now = new Date();
    
    for (const activity of allActivities) {
      if (activity.notify) {
        const activityDate = new Date(activity.date);
        
        // Если активность в прошлом, но уведомления включены
        if (activityDate < now) {
          console.log(`⚠️ Found past activity ${activity.id} with notifications enabled`);
          
          // Для повторяющихся активностей планируем следующие уведомления
          if (activity.repeat_type && activity.repeat_type !== 'none') {
            const petName = await getPetName(activity.pet_id);
            const nextDate = dayjs(now).add(1, 'day').toDate(); // Начинаем с завтра
            
            // Используем локальное форматирование времени
            const formatLocalDateTime = (date: Date): string => {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              const hours = String(date.getHours()).padStart(2, '0');
              const minutes = String(date.getMinutes()).padStart(2, '0');
              const seconds = String(date.getSeconds()).padStart(2, '0');
              return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
            };
            
            const tempActivity: ActivityRecord = {
              ...activity,
              date: formatLocalDateTime(nextDate),
              time: formatLocalDateTime(nextDate),
            };
            
            await scheduleMonthlyNotifications(tempActivity, petName, nextDate);
            console.log(`✅ Rescheduled notifications for past repeating activity ${activity.id}`);
          }
        }
      }
    }
  } catch (error) {
    console.error('❌ Failed to check and schedule missed notifications:', error);
  }
} 