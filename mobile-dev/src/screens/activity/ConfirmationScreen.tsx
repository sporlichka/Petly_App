import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ActivityStackParamList, ActivityRecordCreate, ActivityRecordUpdate } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';
import { useActivityNotifications } from '../../hooks/useActivityNotifications';

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
  const { petId, category, editActivity, activityData, preselectedDate } = route.params;
  const [isSaving, setIsSaving] = useState(false);
  const isEditMode = !!editActivity;

  // Initialize notification hook
  const {
    scheduleActivityNotification,
    rescheduleActivityNotification,
    cancelActivityNotification,
  } = useActivityNotifications();

  const getCategoryInfo = () => {
    switch (category) {
      case 'FEEDING':
        return { emoji: '🥣', color: Colors.feeding, title: 'Feeding Activity' };
      case 'HEALTH':
        return { emoji: '🩺', color: Colors.health, title: 'Health Activity' };
      case 'ACTIVITY':
        return { emoji: '🎾', color: Colors.activity, title: 'Physical Activity' };
      default:
        return { emoji: '📝', color: Colors.primary, title: 'Activity' };
    }
  };

  const formatDateTime = () => {
    if (!activityData.date || !activityData.time) {
      return 'Now';
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
    
    return combined.toLocaleDateString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRepeatText = () => {
    switch (activityData.repeat) {
      case 'daily':
        return '🔄 Daily';
      case 'weekly':
        return '📆 Weekly';
      case 'monthly':
        return '🗓️ Monthly';
      default:
        return '📅 One-time';
    }
  };

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
        // Update existing activity
        const activityUpdate: ActivityRecordUpdate = {
          title: activityData.title,
          date: localDateTimeString,
          time: localDateTimeString,
          repeat: activityData.repeat === 'none' ? undefined : activityData.repeat,
          notify: activityData.notifications || true,
          notes: activityData.notes || undefined,
          food_type: activityData.food_type || undefined,
          quantity: activityData.quantity || undefined,
          duration: activityData.duration || undefined,
          temperature: activityData.temperature ? parseFloat(activityData.temperature) : undefined,
          weight: activityData.weight ? parseFloat(activityData.weight) : undefined,
        };

        console.log('Updating activity record:', activityUpdate);
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
        
        Alert.alert(
          'Activity Updated! ✅',
          `${activityData.title} has been successfully updated.${activityData.notifications ? '\n\n📱 Reminder has been updated!' : ''}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to activities list
                navigation.getParent()?.goBack();
              }
            }
          ]
        );
      } else {
        // Create new activity
        const activityRecord: ActivityRecordCreate = {
          pet_id: petId,
          category,
          title: activityData.title,
          date: localDateTimeString,
          time: localDateTimeString,
          repeat: activityData.repeat === 'none' ? undefined : activityData.repeat,
          notify: activityData.notifications || true,
          notes: activityData.notes || undefined,
          food_type: activityData.food_type || undefined,
          quantity: activityData.quantity || undefined,
          duration: activityData.duration || undefined,
          temperature: activityData.temperature ? parseFloat(activityData.temperature) : undefined,
          weight: activityData.weight ? parseFloat(activityData.weight) : undefined,
        };

        console.log('Creating activity record:', activityRecord);
        const createdActivity = await apiService.createActivityRecord(activityRecord);
        
        // Handle notification scheduling for new activity
        try {
          if (activityData.notifications) {
            const notificationScheduled = await scheduleActivityNotification(createdActivity);
            console.log(`Notification ${notificationScheduled ? 'scheduled' : 'failed'} for new activity ${createdActivity.id}`);
          }
        } catch (notificationError) {
          console.error('Failed to schedule notification for new activity:', notificationError);
          // Don't block the success flow for notification errors
        }
        
        Alert.alert(
          'Activity Saved! 🎉',
          `${activityData.title} has been added to your pet's activity log.${activityData.notifications ? '\n\n📱 Reminder has been set!' : ''}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to the home stack, specifically to PetDetail
                navigation.getParent()?.goBack();
              }
            }
          ]
        );
      }
    } catch (error) {
      console.error('Failed to save activity:', error);
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save activity. Please try again.',
        [{ text: 'OK' }]
      );
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
              {isEditMode ? 'Review Changes' : 'Review & Save'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditMode 
                ? 'Check the updated details and save changes'
                : 'Check the details and save this activity'
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
                <Text style={styles.detailLabel}>Title</Text>
                <Text style={styles.detailValue}>{activityData.title}</Text>
              </View>
            </View>

            {/* Date & Time */}
            <View style={styles.detailRow}>
              <Ionicons name="time-outline" size={20} color={categoryInfo.color} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Date & Time</Text>
                <Text style={styles.detailValue}>{formatDateTime()}</Text>
              </View>
            </View>

            {/* Repeat */}
            <View style={styles.detailRow}>
              <Ionicons name="repeat-outline" size={20} color={categoryInfo.color} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Repeat</Text>
                <Text style={styles.detailValue}>{getRepeatText()}</Text>
              </View>
            </View>

            {/* Notifications */}
            {activityData.notifications && (
              <View style={styles.detailRow}>
                <Ionicons name="notifications-outline" size={20} color={categoryInfo.color} />
                <View style={styles.detailContent}>
                  <Text style={styles.detailLabel}>Notifications</Text>
                  <Text style={styles.detailValue}>Enabled</Text>
                </View>
              </View>
            )}
          </Card>

          {/* Category-specific Details */}
          {(activityData.food_type || activityData.quantity || activityData.duration || activityData.weight || activityData.temperature) && (
            <Card variant="default" style={styles.detailsCard}>
              <Text style={styles.sectionTitle}>Additional Details</Text>
              
              {activityData.food_type && (
                <View style={styles.detailRow}>
                  <Ionicons name="restaurant" size={20} color={Colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Food Type</Text>
                    <Text style={styles.detailValue}>{activityData.food_type}</Text>
                  </View>
                </View>
              )}

              {activityData.quantity && (
                <View style={styles.detailRow}>
                  <Ionicons name="scale-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Quantity</Text>
                    <Text style={styles.detailValue}>{activityData.quantity}</Text>
                  </View>
                </View>
              )}

              {activityData.duration && (
                <View style={styles.detailRow}>
                  <Ionicons name="timer-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Duration</Text>
                    <Text style={styles.detailValue}>{activityData.duration}</Text>
                  </View>
                </View>
              )}

              {activityData.weight && (
                <View style={styles.detailRow}>
                  <Ionicons name="scale-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Weight</Text>
                    <Text style={styles.detailValue}>{activityData.weight}</Text>
                  </View>
                </View>
              )}

              {activityData.temperature && (
                <View style={styles.detailRow}>
                  <Ionicons name="thermometer-outline" size={20} color={Colors.textSecondary} />
                  <View style={styles.detailContent}>
                    <Text style={styles.detailLabel}>Temperature</Text>
                    <Text style={styles.detailValue}>{activityData.temperature}</Text>
                  </View>
                </View>
              )}
            </Card>
          )}

          {/* Notes */}
          {activityData.notes && (
            <Card variant="default" style={styles.notesCard}>
              <Text style={styles.sectionTitle}>Notes</Text>
              <Text style={styles.notesText}>{activityData.notes}</Text>
            </Card>
          )}

          {/* Save Button */}
          <Button
            title={isEditMode ? "Update Activity" : "Save Activity"}
            onPress={handleSaveActivity}
            loading={isSaving}
            size="large"
            style={styles.saveButton}
          />

          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step 5 of 5</Text>
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
    marginTop: 20,
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
    marginBottom: 16,
  },
  detailsCard: {
    marginBottom: 16,
  },
  notesCard: {
    marginBottom: 24,
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
  notesText: {
    fontSize: 16,
    color: Colors.text,
    lineHeight: 24,
  },
  saveButton: {
    marginBottom: 24,
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