import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { HomeStackParamList, ActivityRecord, Pet } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';
import { useActivityNotifications } from '../../hooks/useActivityNotifications';

type ViewAllActivitiesScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'ViewAllActivities'>;
type ViewAllActivitiesScreenRouteProp = RouteProp<HomeStackParamList, 'ViewAllActivities'>;

interface ViewAllActivitiesScreenProps {
  navigation: ViewAllActivitiesScreenNavigationProp;
  route: ViewAllActivitiesScreenRouteProp;
}

export const ViewAllActivitiesScreen: React.FC<ViewAllActivitiesScreenProps> = ({
  navigation,
  route,
}) => {
  const { t, i18n } = useTranslation();
  const { petId } = route.params;
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [deletingActivityId, setDeletingActivityId] = useState<number | null>(null);

  // Initialize notification hook
  const {
    cancelActivityNotification,
    rescheduleActivityNotification,
    isNotificationScheduled,
    cleanupOrphanedNotifications,
  } = useActivityNotifications();

  useEffect(() => {
    loadPetAndActivities();
  }, [petId]);

  // Refresh when returning from edit screens
  useFocusEffect(
    React.useCallback(() => {
      loadActivities();
    }, [petId])
  );

  const loadPetAndActivities = async () => {
    try {
      setIsLoading(true);
      await Promise.all([loadPet(), loadActivities()]);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load activities. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const loadPet = async () => {
    try {
      const pets = await apiService.getPets();
      const foundPet = pets.find(p => p.id === petId);
      setPet(foundPet || null);
    } catch (error) {
      console.error('Failed to load pet:', error);
    }
  };

  const loadActivities = async () => {
    try {
      const activityList = await apiService.getActivityRecords(petId, undefined, 0, 1000);
      // Sort by date/time descending (most recent first)
      const sortedActivities = activityList.sort((a, b) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setActivities(sortedActivities);
      
      // Cleanup orphaned notifications (notifications for activities that no longer exist)
      try {
        const activeActivityIds = sortedActivities.map(activity => activity.id);
        await cleanupOrphanedNotifications(activeActivityIds);
      } catch (cleanupError) {
        console.error('Failed to cleanup orphaned notifications:', cleanupError);
        // Don't block the main flow for cleanup errors
      }
    } catch (error) {
      console.error('Failed to load activities:', error);
      throw error;
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await loadActivities();
    } catch (error) {
      Alert.alert('Error', 'Failed to refresh activities');
    } finally {
      setIsRefreshing(false);
    }
  };

  const handleEditActivity = (activity: ActivityRecord) => {
    // Navigate to edit activity wizard with existing activity data
    navigation.navigate('ActivityWizard', {
      screen: 'SelectType',
      params: { 
        petId: activity.pet_id,
        editActivity: activity
      },
    });
  };

  const handleDeleteActivity = (activity: ActivityRecord) => {
    Alert.alert(
      t('activities.delete_activity'),
      t('activities.delete_activity_confirm', { title: activity.title }),
      [
        {
          text: t('common.cancel'),
          style: 'cancel',
        },
        {
          text: t('common.delete'),
          style: 'destructive',
          onPress: () => confirmDeleteActivity(activity.id),
        },
      ]
    );
  };

  const confirmDeleteActivity = async (activityId: number) => {
    try {
      setDeletingActivityId(activityId);
      
      // Cancel any associated notification first
      try {
        await cancelActivityNotification(activityId);
        console.log(`Cancelled notification for activity ${activityId}`);
      } catch (notificationError) {
        console.error('Failed to cancel notification:', notificationError);
        // Continue with deletion even if notification cancellation fails
      }
      
      // Delete the activity from the backend
      await apiService.deleteActivityRecord(activityId);
      await loadActivities(); // Refresh the list
      Alert.alert(t('common.success'), t('activities.activityDeletedSuccessfully'));
    } catch (error) {
      console.error('Failed to delete activity:', error);
      Alert.alert(t('common.error'), t('activities.errorDeletingActivity'));
    } finally {
      setDeletingActivityId(null);
    }
  };

  const handleToggleNotifications = async (activity: ActivityRecord) => {
    try {
      // Toggle notifications by modifying the notify field only
      const currentlyEnabled = isNotificationsEnabled(activity);
      const newNotifyValue = !currentlyEnabled;
      
      // Update local state immediately for better UX
      setActivities(prevActivities => 
        prevActivities.map(act => 
          act.id === activity.id 
            ? { ...act, notify: newNotifyValue } as ActivityRecord
            : act
        )
      );
      
      // Make API call (only change notify field, keep repeat unchanged)
      const updatedActivity = await apiService.updateActivityRecord(activity.id, {
        notify: newNotifyValue,
      });
      
      // Handle notification scheduling/cancellation
      try {
        if (newNotifyValue) {
          // Schedule notification for the updated activity
          const notificationScheduled = await rescheduleActivityNotification(updatedActivity);
          console.log(`Notification ${notificationScheduled ? 'scheduled' : 'failed'} for activity ${activity.id}`);
        } else {
          // Cancel notification
          await cancelActivityNotification(activity.id);
          console.log(`Cancelled notification for activity ${activity.id}`);
        }
      } catch (notificationError) {
        console.error('Failed to handle notification toggle:', notificationError);
        // Don't revert the notify state change, just log the error
      }
      
      // Show success message
      Alert.alert(
        'Notifications Updated',
        `Notifications ${currentlyEnabled ? 'disabled' : 'enabled'} for "${activity.title}"${newNotifyValue ? '\n\n📱 Reminder has been set!' : ''}`
      );
    } catch (error) {
      console.error('Failed to update notifications:', error);
      // Revert local state on error
      await loadActivities();
      Alert.alert('Error', 'Failed to update notifications. Please try again.');
    }
  };

  const handleAddActivity = () => {
    navigation.navigate('ActivityWizard', {
      screen: 'SelectType',
      params: { petId },
    });
  };

  const getActivityIcon = (category: string): string => {
    switch (category) {
      case 'FEEDING': return '🥣';
      case 'CARE': return '🦴';
      case 'ACTIVITY': return '🎾';
      default: return '📝';
    }
  };

  const getActivityColor = (category: string): string => {
    switch (category) {
      case 'FEEDING': return Colors.feeding;
      case 'CARE': return Colors.care;
      case 'ACTIVITY': return Colors.activity;
      default: return Colors.primary;
    }
  };

  const formatActivityDateTime = (date: string): string => {
    const activityDate = new Date(date);
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    const activityDateOnly = new Date(
      activityDate.getFullYear(),
      activityDate.getMonth(),
      activityDate.getDate()
    );

    let dateStr;
    if (activityDateOnly.getTime() === today.getTime()) {
      dateStr = t('common.today');
    } else if (activityDateOnly.getTime() === yesterday.getTime()) {
      dateStr = t('common.yesterday');
    } else {
      dateStr = activityDate.toLocaleDateString(i18n.language, {
        month: 'short',
        day: 'numeric',
      });
    }

    const timeStr = activityDate.toLocaleTimeString(i18n.language, {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });

    return t('common.date_at_time', { date: dateStr, time: timeStr });
  };

  const isNotificationsEnabled = (activity: ActivityRecord): boolean => {
    return Boolean(activity.notify);
  };

  const renderActivityItem = ({ item }: { item: ActivityRecord }) => {
    const activityColor = getActivityColor(item.category);
    const notificationsEnabled = isNotificationsEnabled(item);
    const isDeleting = deletingActivityId === item.id;
    const hasScheduledNotification = isNotificationScheduled(item.id);

    return (
      <Card variant="default" style={styles.activityCard}>
        <View style={styles.activityHeader}>
          <View style={styles.activityLeft}>
            <View style={[styles.activityIcon, { backgroundColor: activityColor + '20' }]}>
              <Text style={styles.activityEmoji}>{getActivityIcon(item.category)}</Text>
            </View>
            <View style={styles.activityInfo}>
              <Text style={styles.activityTitle}>{item.title}</Text>
              <Text style={styles.activityTime}>{formatActivityDateTime(item.date)}</Text>
              
              {/* Show feeding-specific details */}
              {item.category === 'FEEDING' && (item.food_type || item.quantity) && (
                <View style={styles.feedingDetails}>
                  {item.food_type && (
                    <Text style={styles.feedingDetail}>🍽️ {item.food_type}</Text>
                  )}
                  {item.quantity && (
                    <Text style={styles.feedingDetail}>📏 {item.quantity}</Text>
                  )}
                </View>
              )}
              
              {item.repeat && (
                <Text style={styles.activityRepeat}>
                  {t('activities.repeats')} {item.repeat}
                </Text>
              )}
              
              {hasScheduledNotification && (
                <Text style={styles.notificationScheduled}>
                  {t('activities.reminder_scheduled')}
                </Text>
              )}
            </View>
          </View>
          <View style={[styles.activityDot, { backgroundColor: activityColor }]} />
        </View>

        {item.notes && (
          <Text style={styles.activityNotes} numberOfLines={2}>
            {item.notes}
          </Text>
        )}

        {/* Action Buttons */}
        <View style={styles.activityActions}>
          <TouchableOpacity
            style={[styles.actionButton, styles.editButton]}
            onPress={() => handleEditActivity(item)}
          >
            <Ionicons name="create-outline" size={16} color={Colors.primary} />
            <Text style={styles.editButtonText}>{t('common.edit')}</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.notificationButton]}
            onPress={() => handleToggleNotifications(item)}
          >
            <Ionicons 
              name={notificationsEnabled ? "notifications" : "notifications-off"} 
              size={16} 
              color={notificationsEnabled ? Colors.success : Colors.textSecondary} 
            />
            <Text style={[
              styles.notificationButtonText,
              { color: notificationsEnabled ? Colors.success : Colors.textSecondary }
            ]}>
              {notificationsEnabled ? t('common.on') : t('common.off')}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.actionButton, styles.deleteButton]}
            onPress={() => handleDeleteActivity(item)}
            disabled={isDeleting}
          >
            <Ionicons 
              name={isDeleting ? "hourglass-outline" : "trash-outline"} 
              size={16} 
              color={Colors.error} 
            />
            <Text style={styles.deleteButtonText}>
              {isDeleting ? t('common.deleting') : t('common.delete')}
            </Text>
          </TouchableOpacity>
        </View>
      </Card>
    );
  };

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyIcon}>📝</Text>
      <Text style={styles.emptyTitle}>{t('activities.noActivitiesYet')}</Text>
      <Text style={styles.emptySubtitle}>
        {t('activities.startTracking', { name: pet?.name })}
      </Text>
      <Button
        title={t('activities.addFirstActivity')}
        onPress={handleAddActivity}
        style={styles.addFirstButton}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('activities.loadingActivities')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <LinearGradient
      colors={Colors.gradient.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>
            {pet?.name} {t('activities.activities')}
          </Text>
          <Text style={styles.headerSubtitle}>
            {t('activities.totalActivities', { count: activities.length })}
          </Text>
        </View>

        <FlatList
          data={activities}
          renderItem={renderActivityItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={[
            styles.listContainer,
            activities.length === 0 && styles.emptyListContainer
          ]}
          ListEmptyComponent={renderEmptyState}
          refreshControl={
            <RefreshControl
              refreshing={isRefreshing}
              onRefresh={handleRefresh}
              tintColor={Colors.primary}
            />
          }
          showsVerticalScrollIndicator={false}
        />


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
  header: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    backgroundColor: Colors.surface + '90',
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  listContainer: {
    padding: 16,
  },
  emptyListContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activityCard: {
    marginBottom: 12,
    padding: 16,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  activityLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 18,
  },
  activityInfo: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  activityRepeat: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginTop: 6,
  },
  activityNotes: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
    marginBottom: 12,
    paddingLeft: 52,
  },
  activityActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: Colors.borderLight,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    minWidth: 80,
    justifyContent: 'center',
  },
  editButton: {
    backgroundColor: Colors.primary + '10',
  },
  editButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  notificationButton: {
    backgroundColor: Colors.surface,
  },
  notificationButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
  },
  deleteButton: {
    backgroundColor: Colors.error + '10',
  },
  deleteButtonText: {
    marginLeft: 4,
    fontSize: 14,
    fontWeight: '500',
    color: Colors.error,
  },
  emptyState: {
    alignItems: 'center',
    padding: 32,
  },
  emptyIcon: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  addFirstButton: {
    minWidth: 200,
  },
  feedingDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  feedingDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 4,
  },
  notificationScheduled: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
}); 