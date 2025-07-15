import * as Notifications from 'expo-notifications';
import { ActivityRecordCreate, ActivityRecord, RepeatType } from '../types';
import { extensionModalService } from '../services/extensionModalService';
import i18n from '../i18n';

/**
 * Генерирует список дат для повторяющихся активностей с кастомными интервалами
 */
export function getRepeatDates(
  baseDate: Date, 
  repeatType: RepeatType, 
  repeatInterval: number = 1,
  repeatEndDate?: string | null,
  repeatCount?: number | null
): Date[] {
  if (repeatType === 'none') {
    return [];
  }

  const result: Date[] = [];
  let currentDate = new Date(baseDate);
  let count = 0;

  // Определяем максимальное количество повторов
  let maxCount: number;
  if (repeatCount && repeatCount > 0) {
    maxCount = repeatCount;
  } else if (repeatEndDate) {
    // Вычисляем количество повторов до даты окончания
    const endDate = new Date(repeatEndDate);
    maxCount = calculateRepeatCount(currentDate, endDate, repeatType, repeatInterval);
  } else {
    // Значения по умолчанию
    const defaultCounts = { day: 7, week: 4, month: 3, year: 1 };
    maxCount = defaultCounts[repeatType];
  }

  // Генерируем даты
  while (count < maxCount) {
    const nextDate = new Date(currentDate);
    
    switch (repeatType) {
      case 'day':
        nextDate.setDate(currentDate.getDate() + (count + 1) * repeatInterval);
        break;
      case 'week':
        nextDate.setDate(currentDate.getDate() + (count + 1) * repeatInterval * 7);
        break;
      case 'month':
        nextDate.setMonth(currentDate.getMonth() + (count + 1) * repeatInterval);
        break;
      case 'year':
        nextDate.setFullYear(currentDate.getFullYear() + (count + 1) * repeatInterval);
        break;
    }

    // Проверяем, не превышает ли дата дату окончания
    if (repeatEndDate && nextDate > new Date(repeatEndDate)) {
      break;
    }

    result.push(nextDate);
    count++;
  }

  return result;
}

/**
 * Вычисляет количество повторов между двумя датами
 */
function calculateRepeatCount(startDate: Date, endDate: Date, repeatType: RepeatType, repeatInterval: number): number {
  const timeDiff = endDate.getTime() - startDate.getTime();
  const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

  switch (repeatType) {
    case 'day':
      return Math.floor(dayDiff / repeatInterval);
    case 'week':
      return Math.floor(dayDiff / (repeatInterval * 7));
    case 'month':
      // Приблизительно 30 дней в месяце
      return Math.floor(dayDiff / (repeatInterval * 30));
    case 'year':
      // Приблизительно 365 дней в году
      return Math.floor(dayDiff / (repeatInterval * 365));
    default:
      return 0;
  }
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
    // Для повторяющихся активностей используем новые поля
    repeat_type: 'none', // Дополнительные записи не повторяются сами
    repeat_interval: 1,
  };
}

/**
 * Вычисляет количество дней для напоминания о продлении
 */
export function getExtensionReminderDays(repeatType: RepeatType, repeatInterval: number = 1): number {
  const baseDays = { day: 7, week: 28, month: 90, year: 365 };
  const baseDay = baseDays[repeatType] || 7;
  return baseDay * repeatInterval;
}

/**
 * Планирует напоминание о продлении расписания
 */
export async function scheduleExtensionReminder(
  activity: ActivityRecord,
  repeatType: RepeatType,
  repeatInterval: number = 1
): Promise<string | null> {
  try {
    console.log(`📅 Scheduling extension reminder for activity ${activity.id} (${repeatType}, interval: ${repeatInterval})`);
    
    // Вычисляем дату последней активности в серии повторений
    const activityDate = new Date(activity.date);
    const lastActivityDate = new Date(activityDate);
    
    // Добавляем соответствующий период к дате активности
    const reminderDays = getExtensionReminderDays(repeatType, repeatInterval);
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
          repeatType: getRepeatTypeDescription(repeatType, repeatInterval),
          petName: 'your pet'
        }),
        sound: 'default',
        data: {
          type: 'repeat-extension',
          activityId: activity.id,
          originalRepeat: repeatType,
          originalInterval: repeatInterval,
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
        originalRepeat: repeatType,
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
export function createRepeatTitle(baseTitle: string, index: number, repeatType: RepeatType): string {
  // Для обычных записей возвращаем оригинальное название
  return baseTitle;
}

/**
 * Проверяет, нужно ли создавать повторения
 */
export function shouldCreateRepeats(repeatType: RepeatType | undefined | null): boolean {
  return repeatType !== undefined && repeatType !== null && repeatType !== 'none';
}

/**
 * Получает описание периода повторения для пользователя
 */
export function getRepeatDescription(repeatType: RepeatType, repeatInterval: number = 1): string {
  if (repeatInterval === 1) {
    switch (repeatType) {
      case 'day':
        return i18n.t('activity.every_day');
      case 'week':
        return i18n.t('activity.every_week');
      case 'month':
        return i18n.t('activity.every_month');
      case 'year':
        return i18n.t('activity.every_year');
      default:
        return '';
    }
  } else {
    switch (repeatType) {
      case 'day':
        return i18n.t('activity.every_x_days', { count: repeatInterval });
      case 'week':
        return i18n.t('activity.every_x_weeks', { count: repeatInterval });
      case 'month':
        return i18n.t('activity.every_x_months', { count: repeatInterval });
      case 'year':
        return i18n.t('activity.every_x_years', { count: repeatInterval });
      default:
        return '';
    }
  }
}

/**
 * Получает описание типа повтора для уведомлений
 */
export function getRepeatTypeDescription(repeatType: RepeatType, repeatInterval: number = 1): string {
  if (repeatInterval === 1) {
    switch (repeatType) {
      case 'day':
        return 'daily';
      case 'week':
        return 'weekly';
      case 'month':
        return 'monthly';
      case 'year':
        return 'yearly';
      default:
        return 'repeating';
    }
  } else {
    return `${repeatInterval}-${repeatType}`;
  }
} 