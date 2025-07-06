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
 * Планирует уведомления на месяц вперед для повторяющихся активностей
 */
async function scheduleMonthlyNotifications(
  activity: ActivityRecord, 
  petName: string,
  startDate: Date
): Promise<string[]> {
  const notificationIds: string[] = [];
  try {
    console.log(`📅 Scheduling notifications for activity ${activity.id}`);
    // Отменяем все старые уведомления для этой активности
    await notificationService.cancelAllNotificationsForActivity(activity.id);

    if (!activity.repeat || activity.repeat === 'none') {
      // Для одиночных активностей планируем только одно уведомление
      const notificationId = await scheduleNotificationForActivity(activity, petName);
      if (notificationId) {
        notificationIds.push(notificationId);
      }
      return notificationIds;
    }

    // Для повторяющихся активностей планируем уведомления только на нужные даты
    const repeatType = activity.repeat as 'daily' | 'weekly' | 'monthly';
    const repeatDates = getRepeatDates(startDate, repeatType);
    let notificationCount = 0;
    for (const date of repeatDates) {
      // Формируем дату в локальном времени, сохраняя оригинальное время
      const localDate = new Date(date.getFullYear(), date.getMonth(), date.getDate(), startDate.getHours(), startDate.getMinutes(), startDate.getSeconds());
      
      // Используем локальное форматирование времени вместо toISOString()
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
        date: formatLocalDateTime(localDate),
        time: formatLocalDateTime(localDate),
      };
      const notificationId = await scheduleNotificationForActivity(tempActivity, petName);
      if (notificationId) {
        notificationIds.push(notificationId);
        notificationCount++;
      }
    }
    console.log(`✅ Scheduled ${notificationIds.length} notifications for activity ${activity.id}`);
    return notificationIds;
  } catch (error) {
    console.error(`❌ Failed to schedule notifications for activity ${activity.id}:`, error);
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
 * Создает основную активность и все повторяющиеся записи с улучшенным планированием уведомлений
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
    console.log('🔄 Creating activity with enhanced repeats:', activityData);

    // 1. Создаем основную активность
    const mainActivity = await apiService.createActivityRecord(activityData);
    result.mainActivity = mainActivity;
    
    console.log('✅ Main activity created:', mainActivity.id);

    // 2. Планируем уведомления для основной активности
    console.log(`🔔 Planning notifications for main activity ${mainActivity.id}`);
    try {
      const petName = await getPetName(mainActivity.pet_id);
      console.log(`🐾 Pet name: ${petName}`);

      // Планируем уведомления на месяц вперед
      const mainNotificationIds = await scheduleMonthlyNotifications(mainActivity, petName, new Date(mainActivity.date));
      result.notificationIds.push(...mainNotificationIds);
      
      console.log(`✅ Main activity notifications scheduled: ${mainNotificationIds.length} notifications`);
    } catch (error) {
      console.error('❌ Failed to schedule main activity notifications:', error);
      result.errors.push(`Failed to schedule main activity notifications: ${error}`);
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

    // 6. НЕ планируем уведомления для повторяющихся активностей
    // Уведомления уже запланированы для основной активности в scheduleMonthlyNotifications
    console.log(`🔔 Skipping notification scheduling for ${result.repeatActivities.length} repeat activities (already handled by main activity)`);
    
    console.log(`✅ Total notifications scheduled: ${result.notificationIds.length}`);

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
    
    console.log(`🎉 Enhanced repeat creation complete: ${totalCreated}/${totalExpected} activities created`);
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

    // 3. Планируем новые уведомления для обновленной активности
    try {
      const petName = await getPetName(updatedActivity.pet_id);
      const notificationIds = await scheduleMonthlyNotifications(updatedActivity, petName, new Date(updatedActivity.date));
      result.notificationIds.push(...notificationIds);
      console.log(`✅ Rescheduled ${notificationIds.length} notifications for updated activity`);
    } catch (error) {
      console.error('❌ Failed to reschedule notifications for updated activity:', error);
      result.errors.push(`Failed to reschedule notifications: ${error}`);
    }

    // 4. Если изменились параметры повторения, пересоздаем повторяющиеся активности
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

/**
 * Проверяет и планирует пропущенные уведомления
 */
export async function checkAndScheduleMissedNotifications(): Promise<void> {
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
          if (activity.repeat && activity.repeat !== 'none') {
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