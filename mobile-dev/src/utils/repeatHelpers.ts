import * as Notifications from 'expo-notifications';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityRecordCreate, ActivityRecord } from '../types';

const DEV_MODE_STORAGE_KEY = 'repeat_test_mode';

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

// Режим разработки для быстрого тестирования уведомлений
let DEVELOPMENT_MODE = __DEV__;
const TEST_REMINDER_MINUTES = 2; // Напоминание через 2 минуты в режиме разработки

/**
 * Устанавливает режим разработки для уведомлений
 */
export async function setDevelopmentMode(enabled: boolean): Promise<void> {
  DEVELOPMENT_MODE = enabled;
  try {
    await AsyncStorage.setItem(DEV_MODE_STORAGE_KEY, enabled.toString());
    console.log(`🔧 Development mode for notifications: ${enabled ? 'enabled' : 'disabled'} (saved to storage)`);
  } catch (error) {
    console.error('Failed to save development mode to storage:', error);
  }
}

/**
 * Получает текущий режим разработки
 */
export function getDevelopmentMode(): boolean {
  return DEVELOPMENT_MODE;
}

/**
 * Загружает режим разработки из хранилища
 */
export async function loadDevelopmentMode(): Promise<boolean> {
  try {
    const stored = await AsyncStorage.getItem(DEV_MODE_STORAGE_KEY);
    if (stored !== null) {
      const enabled = stored === 'true';
      DEVELOPMENT_MODE = enabled;
      console.log(`🔧 Loaded development mode from storage: ${enabled}`);
      return enabled;
    }
  } catch (error) {
    console.error('Failed to load development mode from storage:', error);
  }
  
  // По умолчанию используем __DEV__
  DEVELOPMENT_MODE = __DEV__;
  return __DEV__;
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
    // Проверяем текущий режим разработки
    const currentDevMode = getDevelopmentMode();
    console.log(`🔧 Current development mode: ${currentDevMode}`);
    console.log(`🔧 __DEV__: ${__DEV__}`);
    console.log(`🔧 DEVELOPMENT_MODE variable: ${DEVELOPMENT_MODE}`);
    
    // Вычисляем дату напоминания
    const reminderDate = new Date();
    
    if (currentDevMode && __DEV__) {
      // В режиме разработки добавляем минуты для быстрого тестирования
      reminderDate.setMinutes(reminderDate.getMinutes() + TEST_REMINDER_MINUTES);
      console.log(`🔧 Development mode: scheduling reminder in ${TEST_REMINDER_MINUTES} minutes`);
    } else {
      // В продакшене добавляем дни
      const reminderDays = getExtensionReminderDays(repeat);
      reminderDate.setDate(reminderDate.getDate() + reminderDays);
      reminderDate.setHours(10, 0, 0, 0); // Устанавливаем время на 10:00 утра
      console.log(`📅 Production mode: scheduling reminder in ${reminderDays} days`);
    }
    
    console.log(`📅 Scheduling extension reminder for activity ${activity.id}:`);
    console.log(`  - Current time: ${new Date().toLocaleString()}`);
    console.log(`  - Reminder date: ${reminderDate.toLocaleString()}`);
    console.log(`  - Mode: ${(currentDevMode && __DEV__) ? 'Development' : 'Production'}`);
    console.log(`  - Time difference: ${(reminderDate.getTime() - new Date().getTime()) / 1000 / 60} minutes`);

    // Проверяем, что дата в будущем
    if (reminderDate <= new Date()) {
      console.warn('⚠️ Reminder date is in the past, skipping');
      return null;
    }

    const notificationId = await Notifications.scheduleNotificationAsync({
      content: {
        title: '⏰ Расписание активности завершилось',
        body: `Хотите продлить расписание "${activity.title}" на следующие дни?`,
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
      return 'каждый день в течение 7 дней (с уведомлениями для каждого дня)';
    case 'weekly':
      return 'каждую неделю в течение 4 недель (с уведомлениями для каждой недели)';
    case 'monthly':
      return 'каждый месяц в течение 3 месяцев (с уведомлениями для каждого месяца)';
    default:
      return '';
  }
} 