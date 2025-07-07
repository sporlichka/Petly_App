import * as Notifications from 'expo-notifications';
import { ActivityRecordCreate, ActivityRecord } from '../types';
import { extensionModalService } from '../services/extensionModalService';
import i18n from '../i18n';

/**
 * Генерирует список дат для повторяющихся активностей
 */
export function getRepeatDates(baseDate: Date, repeat: 'daily' | 'weekly' | 'monthly'): Date[] {
  const countMap = { daily: 7, weekly: 4, monthly: 3 };
  const count = countMap[repeat];
  const result: Date[] = [];

  for (let i = 1; i <= count; i++) {
    const date = new Date(baseDate);
    if (repeat === 'daily') {
      date.setDate(date.getDate() + i);
    } else if (repeat === 'weekly') {
      date.setDate(date.getDate() + i * 7);
    } else if (repeat === 'monthly') {
      date.setMonth(date.getMonth() + i);
    }
    result.push(date);
  }

  return result;
}

/**
 * Создает копию активности с новой датой
 */
export function createRepeatActivity(
  baseActivity: ActivityRecordCreate,
  newDate: Date
): ActivityRecordCreate {
  // Форматируем дату как локальную строку без изменения времени
  const formatLocalDateTime = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
  };

  const newDateTimeString = formatLocalDateTime(newDate);

  return {
    ...baseActivity,
    date: newDateTimeString,
    time: newDateTimeString,
    // Убираем repeat для дополнительных записей - они не должны создавать еще больше повторений
    repeat: undefined,
  };
}

/**
 * Вычисляет количество дней для напоминания о продлении
 */
export function getExtensionReminderDays(repeat: 'daily' | 'weekly' | 'monthly'): number {
  switch (repeat) {
    case 'daily':
      return 7;
    case 'weekly':
      return 28; // 4 недели
    case 'monthly':
      return 90; // 3 месяца
    default:
      return 7;
  }
}

/**
 * Планирует напоминание о продлении расписания
 */
export async function scheduleExtensionReminder(
  activity: ActivityRecord,
  repeat: 'daily' | 'weekly' | 'monthly'
): Promise<string | null> {
  try {
    console.log(`📅 Scheduling extension reminder for activity ${activity.id} (${repeat})`);
    
    // Вычисляем дату последней активности в серии повторений
    const activityDate = new Date(activity.date);
    const lastActivityDate = new Date(activityDate);
    
    // Добавляем соответствующий период к дате активности
    const reminderDays = getExtensionReminderDays(repeat);
    lastActivityDate.setDate(lastActivityDate.getDate() + reminderDays);
    
    // Напоминание планируется на СЛЕДУЮЩИЙ день после завершения серии
    const reminderDate = new Date(lastActivityDate);
    reminderDate.setDate(reminderDate.getDate() + 1);
    reminderDate.setHours(10, 0, 0, 0); // Устанавливаем время на 10:00 утра
    
    console.log(`📅 Extension reminder calculation:`);
    console.log(`  - Activity date: ${activityDate.toLocaleDateString()}`);
    console.log(`  - Last activity in series: ${lastActivityDate.toLocaleDateString()}`);
    console.log(`  - Reminder scheduled for: ${reminderDate.toLocaleString()}`);
    console.log(`  - Days in series: ${reminderDays}`);

    // Проверяем, что дата в будущем
    if (reminderDate <= new Date()) {
      console.warn('⚠️ Reminder date is in the past, skipping');
      return null;
    }

    // Планируем уведомление
    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: i18n.t('activity.notifications.extension_reminder_title'),
        body: i18n.t('activity.notifications.extension_reminder_body', {
          repeatType: repeat,
          petName: 'your pet'
        }),
        sound: 'default',
        data: {
          type: 'repeat-extension',
          activityId: activity.id,
          originalRepeat: repeat,
          petId: activity.pet_id,
          category: activity.category,
        },
      },
      trigger: {
        type: Notifications.SchedulableTriggerInputTypes.DATE,
        date: reminderDate,
      },
    });

    // Планируем модальное окно на ту же дату
    try {
      await extensionModalService.scheduleExtensionModal({
        activityId: activity.id,
        activityTitle: activity.title,
        originalRepeat: repeat,
        petId: activity.pet_id,
        category: activity.category,
        scheduledDate: reminderDate.toISOString(),
        createdAt: new Date().toISOString(),
      });
      console.log(`📋 Scheduled extension modal for activity ${activity.id}`);
    } catch (modalError) {
      console.error('❌ Failed to schedule extension modal:', modalError);
      // Не блокируем основной процесс из-за ошибки модалки
    }

    console.log(`✅ Extension reminder scheduled: ${notificationId}`);
    console.log(`   Will fire on: ${reminderDate.toLocaleString()}`);
    return notificationId;
  } catch (error) {
    console.error('❌ Failed to schedule extension reminder:', error);
    return null;
  }
}

/**
 * Создает уникальное название для повторяющихся активностей
 */
export function createRepeatTitle(baseTitle: string, index: number, repeat: string): string {
  // Для обычных записей возвращаем оригинальное название
  return baseTitle;
}

/**
 * Проверяет, нужно ли создавать повторения
 */
export function shouldCreateRepeats(repeat: string | undefined | null): boolean {
  return repeat !== undefined && repeat !== null && repeat !== 'none';
}

/**
 * Получает описание периода повторения для пользователя
 */
export function getRepeatDescription(repeat: 'daily' | 'weekly' | 'monthly'): string {
  switch (repeat) {
    case 'daily':
      return i18n.t('activity.notifications.repeat_descriptions.daily');
    case 'weekly':
      return i18n.t('activity.notifications.repeat_descriptions.weekly');
    case 'monthly':
      return i18n.t('activity.notifications.repeat_descriptions.monthly');
    default:
      return '';
  }
} 