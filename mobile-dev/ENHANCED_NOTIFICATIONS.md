# 🔔 Enhanced Notification System

## 🎯 Overview

Vetly AI теперь использует улучшенную систему уведомлений, которая обеспечивает надежную доставку напоминаний даже когда приложение не активно или закрыто.

## ✨ Key Features

### 1. 🧠 Background Task Management
- **expo-task-manager** + **expo-background-fetch** для фоновых задач
- Автоматическая проверка пропущенных уведомлений каждый час
- Работает даже когда приложение закрыто

### 2. 📆 Mass Notification Scheduling
- Планирование уведомлений на месяц вперед
- Для повторяющихся активностей: создается до 30 уведомлений сразу
- Предотвращает пропуск важных напоминаний

### 3. 📱 AppState Monitoring
- Отслеживание состояния приложения (активно/неактивно)
- Автоматическая проверка пропущенных уведомлений при открытии приложения
- Восстановление уведомлений для повторяющихся активностей

### 4. 💾 Notification ID Storage
- Сохранение ID уведомлений в AsyncStorage
- Возможность отмены/редактирования конкретных уведомлений
- Очистка устаревших уведомлений

### 5. 🧹 Smart Cleanup
- Автоматическая очистка устаревших уведомлений
- Удаление дублирующихся уведомлений
- Оптимизация производительности

## 🏗️ Architecture

### Services

#### 1. `NotificationService` (Enhanced)
```typescript
// Основные возможности:
- scheduleActivityNotification() // Планирование с сохранением ID
- cancelNotificationForActivity() // Отмена по ID активности
- checkAndScheduleMissedNotifications() // Проверка пропущенных
- cleanupExpiredNotifications() // Очистка устаревших
- getNotificationInfo() // Получение информации об уведомлении
```

#### 2. `BackgroundTaskService` (New)
```typescript
// Основные возможности:
- initialize() // Инициализация фоновых задач
- registerBackgroundFetchTask() // Регистрация фоновой задачи
- handleAppBecameActive() // Обработка активации приложения
- getBackgroundFetchStatus() // Статус фоновых задач
```

#### 3. `RepeatActivityService` (Enhanced)
```typescript
// Основные возможности:
- scheduleMonthlyNotifications() // Планирование на месяц
- checkAndScheduleMissedNotifications() // Проверка пропущенных
- createActivityWithRepeats() // Создание с массовым планированием
```

### Background Tasks

#### 1. Background Fetch Task
- **Частота**: Каждый час
- **Действия**:
  - Проверка пропущенных уведомлений
  - Очистка устаревших уведомлений
  - Перепланирование повторяющихся активностей

#### 2. App State Listener
- **Триггер**: При активации приложения
- **Действия**:
  - Проверка пропущенных уведомлений
  - Очистка устаревших уведомлений

## 📱 Platform Support

### iOS
- **Background Modes**: `fetch`, `remote-notification`, `background-processing`
- **Permissions**: Полные разрешения для уведомлений
- **Background Fetch**: Поддерживается системой

### Android
- **Permissions**: `RECEIVE_BOOT_COMPLETED`, `SCHEDULE_EXACT_ALARM`, `USE_EXACT_ALARM`
- **Notification Channels**: Создаются автоматически
- **Background Tasks**: Работают через WorkManager

## 🔧 Configuration

### app.json
```json
{
  "ios": {
    "infoPlist": {
      "UIBackgroundModes": ["fetch", "remote-notification", "background-processing"]
    }
  },
  "android": {
    "permissions": [
      "RECEIVE_BOOT_COMPLETED",
      "SCHEDULE_EXACT_ALARM",
      "USE_EXACT_ALARM"
    ]
  },
  "plugins": [
    ["expo-background-fetch", {
      "minimumInterval": 3600
    }]
  ]
}
```

### Dependencies
```json
{
  "expo-task-manager": "~12.0.0",
  "expo-background-fetch": "~12.0.0",
  "dayjs": "^1.11.10"
}
```

## 🚀 Usage Examples

### Создание активности с уведомлениями
```typescript
const result = await createActivityWithRepeats({
  pet_id: 1,
  category: 'FEEDING',
  title: 'Feed Max',
  date: '2024-12-26T15:30:00',
  repeat: 'daily',
  notify: true
});

// Результат содержит:
// - mainActivity: основная активность
// - repeatActivities: повторяющиеся активности
// - notificationIds: ID всех запланированных уведомлений
```

### Проверка статуса уведомлений
```typescript
const notificationInfo = await notificationService.getNotificationInfo(activityId);
if (notificationInfo) {
  console.log(`Notification scheduled for: ${notificationInfo.scheduledDate}`);
}
```

### Отмена уведомлений
```typescript
await notificationService.cancelAllNotificationsForActivity(activityId);
```

## 📊 Monitoring

### Settings Screen
- **Notification Status**: Показывает количество запланированных уведомлений
- **Background Tasks**: Статус фоновых задач
- **Missed Notifications**: Автоматическая проверка пропущенных

### Debug Information
```typescript
// Получение статистики уведомлений
const count = await notificationService.getScheduledNotificationsCount();

// Получение статуса фоновых задач
const status = await backgroundTaskService.getBackgroundFetchStatus();
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Уведомления не приходят
- Проверьте разрешения в настройках устройства
- Убедитесь, что приложение не в режиме "Не беспокоить"
- Проверьте статус фоновых задач в Settings

#### 2. Фоновые задачи не работают
- На iOS: убедитесь, что включен Background App Refresh
- На Android: проверьте настройки батареи и оптимизации
- Перезапустите приложение

#### 3. Дублирующиеся уведомления
- Система автоматически очищает дубликаты
- Проверьте логи для диагностики

### Debug Commands
```typescript
// Тестовое уведомление
await notificationService.scheduleTestNotification();

// Принудительная проверка пропущенных
await checkAndScheduleMissedNotifications();

// Очистка всех уведомлений
await notificationService.cancelAllNotifications();
```

## 🔄 Migration from Old System

### Automatic Migration
- Старые уведомления автоматически переносятся
- Новые активности используют улучшенную систему
- Обратная совместимость сохранена

### Manual Migration (if needed)
```typescript
// Отмена старых уведомлений
await notificationService.cancelAllNotifications();

// Пересоздание с новой системой
const activities = await apiService.getAllUserActivityRecords();
for (const activity of activities) {
  if (activity.notify) {
    await notificationService.scheduleActivityNotification(activity);
  }
}
```

## 📈 Performance

### Optimizations
- **Lazy Loading**: Уведомления загружаются по мере необходимости
- **Batch Operations**: Массовое планирование уведомлений
- **Smart Cleanup**: Автоматическая очистка устаревших данных
- **Memory Management**: Эффективное использование памяти

### Limits
- **Max Notifications**: 30 уведомлений на активность (защита от спама)
- **Background Interval**: Минимум 1 час между фоновыми задачами
- **Storage**: Ограниченное хранение ID уведомлений

## 🔮 Future Enhancements

### Planned Features
- **Smart Scheduling**: Адаптивное планирование на основе поведения пользователя
- **Priority Notifications**: Приоритетные уведомления для важных событий
- **Notification Analytics**: Статистика доставки и взаимодействия
- **Custom Sounds**: Пользовательские звуки для разных типов активностей

### API Improvements
- **Webhook Support**: Интеграция с внешними системами
- **Push Notifications**: Серверные push-уведомления
- **Cross-Platform Sync**: Синхронизация уведомлений между устройствами

---

## 📝 Notes

- Система работает только на физических устройствах (не в симуляторах)
- Для полной функциональности требуется пересборка приложения
- Рекомендуется тестирование на реальных устройствах
- Логи содержат подробную информацию для диагностики 