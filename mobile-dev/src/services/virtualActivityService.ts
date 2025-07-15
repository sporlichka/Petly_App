import { ActivityRecord, RepeatType } from '../types';
import { getRepeatDates } from '../utils/repeatHelpers';

export interface VirtualActivityRecord extends ActivityRecord {
  isVirtual?: boolean;
  originalActivityId?: number;
  virtualIndex?: number;
}

/**
 * Генерирует виртуальные записи активностей на основе одной записи с полями повторов
 */
export function generateVirtualActivities(activity: ActivityRecord): VirtualActivityRecord[] {
  // Если нет повторов, возвращаем только оригинальную запись
  if (!activity.repeat_type || activity.repeat_type === 'none') {
    return [activity];
  }

  const activities: VirtualActivityRecord[] = [];
  
  // Добавляем основную запись
  activities.push({
    ...activity,
    isVirtual: false,
    virtualIndex: 0,
  });

  // Генерируем даты для повторов
  const baseDate = new Date(activity.date);
  const repeatDates = getRepeatDates(
    baseDate,
    activity.repeat_type,
    activity.repeat_interval,
    activity.repeat_end_date,
    activity.repeat_count
  );

      // Создаем виртуальные записи для каждой даты повтора
    repeatDates.forEach((date, index) => {
      const virtualActivity: VirtualActivityRecord = {
        ...activity,
        id: activity.id + (index + 1) * 1000000, // Виртуальный ID
        date: formatLocalDateTime(date),
        time: formatLocalDateTime(date),
        isVirtual: true,
        originalActivityId: activity.id,
        virtualIndex: index + 1,
        // Сохраняем информацию о повторах для отображения
        repeat_type: activity.repeat_type,
        repeat_interval: activity.repeat_interval,
        repeat_end_date: activity.repeat_end_date,
        repeat_count: activity.repeat_count,
      };
      
      activities.push(virtualActivity);
    });

  return activities;
}

/**
 * Форматирует дату как локальную строку времени
 */
function formatLocalDateTime(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const seconds = String(date.getSeconds()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
}

/**
 * Получает все виртуальные активности для списка записей
 */
export function generateVirtualActivitiesForList(activities: ActivityRecord[]): VirtualActivityRecord[] {
  const allVirtualActivities: VirtualActivityRecord[] = [];
  
  activities.forEach(activity => {
    const virtualActivities = generateVirtualActivities(activity);
    allVirtualActivities.push(...virtualActivities);
  });
  
  return allVirtualActivities;
}

/**
 * Фильтрует виртуальные активности по дате
 */
export function filterVirtualActivitiesByDate(
  activities: VirtualActivityRecord[],
  targetDate: Date
): VirtualActivityRecord[] {
  const targetDateString = targetDate.toISOString().split('T')[0]; // YYYY-MM-DD
  
  return activities.filter(activity => {
    const activityDate = new Date(activity.date);
    const activityDateString = activityDate.toISOString().split('T')[0];
    return activityDateString === targetDateString;
  });
}

/**
 * Фильтрует виртуальные активности по диапазону дат
 */
export function filterVirtualActivitiesByDateRange(
  activities: VirtualActivityRecord[],
  startDate: Date,
  endDate: Date
): VirtualActivityRecord[] {
  return activities.filter(activity => {
    const activityDate = new Date(activity.date);
    return activityDate >= startDate && activityDate <= endDate;
  });
}

/**
 * Получает оригинальную запись по виртуальной
 */
export function getOriginalActivity(
  virtualActivity: VirtualActivityRecord,
  allActivities: ActivityRecord[]
): ActivityRecord | null {
  if (!virtualActivity.isVirtual || !virtualActivity.originalActivityId) {
    return null;
  }
  
  return allActivities.find(activity => activity.id === virtualActivity.originalActivityId) || null;
}

/**
 * Проверяет, является ли запись виртуальной
 */
export function isVirtualActivity(activity: VirtualActivityRecord): boolean {
  return activity.isVirtual === true;
}

/**
 * Получает описание повтора для виртуальной записи
 */
export function getVirtualActivityRepeatDescription(activity: VirtualActivityRecord): string {
  if (!activity.isVirtual || !activity.originalActivityId) {
    return '';
  }
  
  // Для виртуальных записей используем данные из самой записи
  // так как оригинальная запись может быть недоступна в контексте
  const interval = activity.repeat_interval || 1;
  const type = activity.repeat_type;
  
  if (interval === 1) {
    switch (type) {
      case 'day': return 'Ежедневно';
      case 'week': return 'Еженедельно';
      case 'month': return 'Ежемесячно';
      case 'year': return 'Ежегодно';
      default: return '';
    }
  } else {
    switch (type) {
      case 'day': return `Каждые ${interval} дней`;
      case 'week': return `Каждые ${interval} недель`;
      case 'month': return `Каждые ${interval} месяцев`;
      case 'year': return `Каждые ${interval} лет`;
      default: return '';
    }
  }
} 