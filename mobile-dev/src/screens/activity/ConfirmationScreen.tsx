import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ActivityStackParamList, ActivityRecordCreate, ActivityRecordUpdate } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';
import { useActivityNotifications } from '../../hooks/useActivityNotifications';
import { 
  createActivityWithRepeats, 
  updateActivityWithRepeats, 
  getRepeatSummary 
} from '../../services/repeatActivityService';

type ConfirmationScreenNavigationProp = StackNavigationProp<ActivityStackParamList, 'Confirmation'>;
type ConfirmationScreenRouteProp = RouteProp<ActivityStackParamList, 'Confirmation'>;

interface ConfirmationScreenProps {
  navigation: ConfirmationScreenNavigationProp;
  route: ConfirmationScreenRouteProp;
}

export const ConfirmationScreen: React.FC<ConfirmationScreenProps> = ({
  navigation,
  route,
}) => {
  const { t, i18n } = useTranslation();
  const { petId, category, editActivity, activityData, preselectedDate, fromScreen } = route.params;
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!editActivity;

  // Initialize notification hook
  const {
    scheduleActivityNotification,
    rescheduleActivityNotification,
    cancelActivityNotification,
  } = useActivityNotifications();

  // Handle back navigation for edit mode from Calendar
  useEffect(() => {
    if (isEditMode && fromScreen === 'Calendar') {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Check if user is going back
        if (e.data.action.type === 'GO_BACK') {
          // Prevent default behavior
          e.preventDefault();
          
          // Navigate back to Calendar tab - need to go up to MainNavigator (Tab Navigator)
          navigation.getParent()?.getParent()?.navigate('Calendar');
        }
      });

      return unsubscribe;
    }
  }, [navigation, isEditMode, fromScreen]);

  const getCategoryInfo = () => {
    switch (category) {
      case 'FEEDING':
        return { emoji: '🥣', color: Colors.feeding, title: t('activity.feeding_activity') };
      case 'CARE':
        return { emoji: '🦴', color: Colors.care, title: t('activity.care_activity') };
      case 'ACTIVITY':
        return { emoji: '🎾', color: Colors.activity, title: t('activity.physical_activity') };
      default:
        return { emoji: '📝', color: Colors.primary, title: t('activity.title') };
    }
  };

  const formatDateTime = () => {
    if (!activityData.date || !activityData.time) {
      return t('activity.now');
    }
    
    const date = new Date(activityData.date);
    const time = new Date(activityData.time);
    
    // Combine date and time
    const combined = new Date(
      date.getFullYear(),
      date.getMonth(),
      date.getDate(),
      time.getHours(),
      time.getMinutes()
    );
    
    return combined.toLocaleDateString(i18n.language, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRepeatText = () => {
    if (!activityData.repeat_type || activityData.repeat_type === 'none') {
      return `📅 ${t('activity.one_time')}`;
    }

    const interval = activityData.repeat_interval || 1;
    const type = activityData.repeat_type;
    
    let repeatText = '';
    if (interval === 1) {
      switch (type) {
        case 'day':
          repeatText = `🔄 ${t('activity.every_day')}`;
          break;
        case 'week':
          repeatText = `📆 ${t('activity.every_week')}`;
          break;
        case 'month':
          repeatText = `🗓️ ${t('activity.every_month')}`;
          break;
        case 'year':
          repeatText = `📅 ${t('activity.every_year')}`;
          break;
      }
    } else {
      switch (type) {
        case 'day':
          repeatText = `🔄 ${t('activity.every_x_days', { count: interval })}`;
          break;
        case 'week':
          repeatText = `📆 ${t('activity.every_x_weeks', { count: interval })}`;
          break;
        case 'month':
          repeatText = `🗓️ ${t('activity.every_x_months', { count: interval })}`;
          break;
        case 'year':
          repeatText = `📅 ${t('activity.every_x_years', { count: interval })}`;
          break;
      }
    }

    // Добавляем информацию об окончании
    if (activityData.repeat_end_date) {
      repeatText += ` ${t('activity.until')} ${new Date(activityData.repeat_end_date).toLocaleDateString()}`;
    } else if (activityData.repeat_count) {
      repeatText += ` ${t('activity.times', { count: activityData.repeat_count })}`;
    }

    return repeatText;
  };

  const getRepeatSummary = () => {
    if (!activityData.repeat_type || activityData.repeat_type === 'none') {
      return {
        willCreateRepeats: false,
        description: t('activity.one_time_description'),
        count: 1,
      };
    }

    const interval = activityData.repeat_interval || 1;
    const type = activityData.repeat_type;
    
    let count = 1; // Основная запись
    let description = '';

    if (activityData.repeat_count && activityData.repeat_count > 0) {
      count = activityData.repeat_count;
      description = t('activity.repeat_count_description', { count: count - 1 });
    } else if (activityData.repeat_end_date) {
      // Вычисляем примерное количество повторов до даты окончания
      const startDate = new Date(activityData.date);
      const endDate = new Date(activityData.repeat_end_date);
      const timeDiff = endDate.getTime() - startDate.getTime();
      const dayDiff = Math.floor(timeDiff / (1000 * 60 * 60 * 24));

      switch (type) {
        case 'day':
          count = Math.floor(dayDiff / interval) + 1;
          break;
        case 'week':
          count = Math.floor(dayDiff / (interval * 7)) + 1;
          break;
        case 'month':
          count = Math.floor(dayDiff / (interval * 30)) + 1;
          break;
        case 'year':
          count = Math.floor(dayDiff / (interval * 365)) + 1;
          break;
      }
      description = t('activity.repeat_until_date_description', { 
        date: endDate.toLocaleDateString(),
        count: count - 1 
      });
    } else {
      // Значения по умолчанию
      const defaultCounts: Record<string, number> = { day: 7, week: 4, month: 3, year: 1 };
      count = (defaultCounts[type] || 1) + 1;
      description = t('activity.repeat_default_description', { 
        count: count - 1,
        type: t(`activity.repeat_${type}s`)
      });
    }

    return {
      willCreateRepeats: true,
      description,
      count,
    };
  };

  const repeatSummary = getRepeatSummary();

  const handleSaveActivity = async () => {
    setIsSaving(true);
    
    try {
      // Prepare the activity data for the API
      const date = activityData.date ? new Date(activityData.date) : new Date();
      const time = activityData.time ? new Date(activityData.time) : new Date();
      
      // Combine date and time for the actual datetime
      const combined = new Date(
        date.getFullYear(),
        date.getMonth(),
        date.getDate(),
        time.getHours(),
        time.getMinutes()
      );
      
      // Format datetime as local time string (YYYY-MM-DDTHH:mm:ss) to avoid timezone conversion
      const formatLocalDateTime = (date: Date): string => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
      };
      
      const localDateTimeString = formatLocalDateTime(combined);
      
      if (isEditMode && editActivity) {
        // Update existing activity with new repeat fields
        const activityUpdate: ActivityRecordUpdate = {
          title: activityData.title,
          date: localDateTimeString,
          time: localDateTimeString,
          repeat_type: activityData.repeat_type,
          repeat_interval: activityData.repeat_interval,
          repeat_end_date: activityData.repeat_end_date,
          repeat_count: activityData.repeat_count,
          notify: activityData.notifications !== undefined ? activityData.notifications : true,
          notes: activityData.notes || undefined,
          food_type: activityData.food_type || undefined,
          quantity: activityData.quantity || undefined,
          duration: activityData.duration || undefined,
        };

        console.log('Updating activity record with new repeat fields:', activityUpdate);
        
        // For edit mode, use simpler logic for now - just update the main activity
        // TODO: Implement full repeat handling for edit mode
        const updatedActivity = await apiService.updateActivityRecord(editActivity.id, activityUpdate);
        
        // Handle notification scheduling for updated activity
        try {
          if (activityData.notifications) {
            // Reschedule notification with new data
            const notificationScheduled = await rescheduleActivityNotification(updatedActivity);
            console.log(`Notification ${notificationScheduled ? 'scheduled' : 'failed'} for updated activity ${updatedActivity.id}`);
          } else {
            // Cancel notification if notifications are disabled
            await cancelActivityNotification(editActivity.id);
            console.log(`Cancelled notification for activity ${editActivity.id}`);
          }
        } catch (notificationError) {
          console.error('Failed to handle notifications for updated activity:', notificationError);
          // Don't block the success flow for notification errors
        }
        
        // Remove Alert.alert and navigate directly after update
        if (fromScreen === 'Calendar') {
          navigation.getParent()?.getParent()?.navigate('Calendar');
        } else {
          navigation.getParent()?.goBack();
        }
      } else {
        // Create new activity with new repeat fields
        const activityRecord: ActivityRecordCreate = {
          pet_id: petId,
          category: category as "FEEDING" | "CARE" | "ACTIVITY",
          title: activityData.title,
          date: localDateTimeString,
          time: localDateTimeString,
          repeat_type: activityData.repeat_type || 'none',
          repeat_interval: activityData.repeat_interval || 1,
          repeat_end_date: activityData.repeat_end_date,
          repeat_count: activityData.repeat_count,
          notify: activityData.notifications !== undefined ? activityData.notifications : true,
          notes: activityData.notes || undefined,
          food_type: activityData.food_type || undefined,
          quantity: activityData.quantity || undefined,
          duration: activityData.duration || undefined,
        };

        console.log('Creating activity record with new repeat fields:', activityRecord);
        
        // Use new repeat service with hybrid approach to create activities
        const repeatResult = await createActivityWithRepeats(activityRecord);
        
        if (!repeatResult.success) {
          throw new Error(`Failed to create activities: ${repeatResult.errors.join(', ')}`);
        }
        
        const createdActivity = repeatResult.mainActivity;
        
        // Вычисляем количество виртуальных записей, которые будут показаны
        let virtualCount = 1; // Основная запись
        let notificationCount = repeatResult.notificationIds.length;
        
        if (activityData.repeat_type && activityData.repeat_type !== 'none') {
          const baseDate = new Date(activityData.date);
          const { getRepeatDates } = await import('../../utils/repeatHelpers');
          const repeatDates = getRepeatDates(
            baseDate,
            activityData.repeat_type,
            activityData.repeat_interval,
            activityData.repeat_end_date,
            activityData.repeat_count
          );
          virtualCount += repeatDates.length;
          
          // Для кастомных интервалов показываем количество созданных уведомлений
          if (activityData.repeat_interval > 1) {
            notificationCount = Math.min(7, repeatDates.length); // Максимум 7 уведомлений для кастомных интервалов
          }
        }
        
        console.log(`✅ Created 1 activity with hybrid repeat approach, will show ${virtualCount} virtual records`);
        console.log(`📱 Notifications scheduled: ${notificationCount} (hybrid approach)`);
        
        // Notifications are already scheduled by the repeat service with hybrid approach
        // No need to schedule them again here
        
        const successMessage = virtualCount > 1 
          ? `${activityData.title} has been added to your pet's activity log.\n\n📅 Will show ${virtualCount} activities total (including ${virtualCount - 1} repeats).${notificationCount > 0 ? `\n\n📱 ${notificationCount} reminders have been set with hybrid approach!` : ''}${repeatResult.extensionReminderId ? '\n\n⏰ Extension reminder scheduled!' : ''}`
          : `${activityData.title} has been added to your pet's activity log.${activityData.notifications ? '\n\n📱 Reminder has been set!' : ''}`;

        // Remove Alert.alert and navigate directly after creation
        if (fromScreen === 'Calendar') {
          navigation.getParent()?.getParent()?.navigate('Calendar');
        } else {
          navigation.getParent()?.goBack();
        }
      }
    } catch (error) {
      console.error('Failed to save activity:', error);
      // Remove Alert.alert for error, but keep error logging
      // Optionally, you could add a non-blocking error toast/snackbar here
    } finally {
      setIsSaving(false);
    }
  };

  const categoryInfo = getCategoryInfo();

  return (
    <LinearGradient
      colors={Colors.gradient.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={styles.emoji}>{categoryInfo.emoji}</Text>
            </View>
            <Text style={styles.title}>
              {isEditMode ? t('activity.review_changes') : t('activity.review_save')}
            </Text>
            <Text style={styles.subtitle}>
              {isEditMode 
                ? t('activity.check_updated_details')
                : t('activity.check_details')
              }
            </Text>
          </View>

          {/* Activity Summary */}
          <Card variant="elevated" style={styles.summaryCard}>
            <Text style={styles.sectionTitle}>{categoryInfo.title}</Text>
            
            {/* Title */}
            <View style={styles.detailRow}>
              <Ionicons name="create-outline" size={20} color={categoryInfo.color} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('activity.title_label')}</Text>
                <Text style={styles.detailValue}>{activityData.title}</Text>
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={categoryInfo.color} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('activity.date_time_header')}</Text>
                <Text style={styles.detailValue}>{formatDateTime()}</Text>
              </View>
            </View>

            {/* Repeat */}
            <View style={styles.detailRow}>
              <Ionicons name="repeat-outline" size={20} color={categoryInfo.color} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>{t('activity.repeat_settings_header')}</Text>
                <Text style={styles.detailValue}>{getRepeatText()}</Text>
                {repeatSummary.willCreateRepeats && (
                  <Text style={styles.detailSubtext}>{repeatSummary.description}</Text>
                )}
              </View>
            </View>

            {/* Notifications */}
            {activityData.notifications && (
              <View style={styles.detailRow}>
                <Ionicons name="notifications-outline" size={20} color={categoryInfo.color} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>{t('activity.notifications_label')}</Text>
                  <Text style={styles.detailValue}>{t('activity.enabled_label')}</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Category-specific Details */}
          {(activityData.food_type || activityData.quantity || activityData.duration) && (
            <Card variant="default" style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>{t('activity.additional_details')}</Text>
              
              {activityData.food_type && (
                <View style={styles.detailRow}>
                  <Ionicons name="restaurant" size={20} color={Colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('activity.food_type')}</Text>
                    <Text style={styles.detailValue}>{activityData.food_type}</Text>
                  </View>
                </View>
              )}

              {activityData.quantity && (
                <View style={styles.detailRow}>
                  <Ionicons name="scale-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('activity.quantity_label')}</Text>
                    <Text style={styles.detailValue}>{activityData.quantity}</Text>
                  </View>
                </View>
              )}

              {activityData.duration && (
                <View style={styles.detailRow}>
                  <Ionicons name="timer-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>{t('activity.duration_label')}</Text>
                    <Text style={styles.detailValue}>{activityData.duration}</Text>
                  </View>
                </View>
              )}
            </Card>
          )}

          {/* Notes */}
          {activityData.notes && (
            <Card variant="default" style={styles.notesCard}>
              <Text style={styles.sectionTitle}>{t('activity.notes_label')}</Text>
              <Text style={styles.notesText}>{activityData.notes}</Text>
            </Card>
          )}

          {/* Save Button */}
          <Button
            title={isEditMode ? t('activity.update_activity_button') : t('activity.save_activity_button')}
            onPress={handleSaveActivity}
            loading={isSaving}
            size="large"
            style={styles.saveButton}
          />

          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{t('activity.step_of', { current: 5, total: 5 })}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '100%' }]} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: '6%',
    paddingBottom: '5%',
  },
  header: {
    alignItems: 'center',
    marginBottom: '8%',
    marginTop: '3%',
  },
  categoryIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  emoji: {
    fontSize: 36,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
  },
  summaryCard: {
    marginBottom: '4%',
  },
  detailsCard: {
    marginBottom: '4%',
  },
  notesCard: {
    marginBottom: '6%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  detailSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
    lineHeight: 16,
  },
  notesText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  saveButton: {
    marginBottom: '6%',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressText: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 8,
  },
  progressBar: {
    width: '100%',
    height: 4,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
}); 