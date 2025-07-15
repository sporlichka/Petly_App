import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Switch,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ActivityStackParamList, RepeatType } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';
import { Colors } from '../../constants/Colors';

type SetRepeatScreenNavigationProp = StackNavigationProp<ActivityStackParamList, 'SetRepeat'>;
type SetRepeatScreenRouteProp = RouteProp<ActivityStackParamList, 'SetRepeat'>;

interface SetRepeatScreenProps {
  navigation: SetRepeatScreenNavigationProp;
  route: SetRepeatScreenRouteProp;
}

interface RepeatData {
  repeat_type: RepeatType;
  repeat_interval: number;
  repeat_end_date?: string | null;
  repeat_count?: number | null;
  notifications: boolean;
}

export const SetRepeatScreen: React.FC<SetRepeatScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const { petId, category, editActivity, activityData, preselectedDate, fromScreen } = route.params;
  const isEditMode = !!editActivity;
  
  const [repeatData, setRepeatData] = useState<RepeatData>(() => {
    // Pre-populate with existing data if in edit mode
    if (isEditMode && editActivity) {
      return {
        repeat_type: editActivity.repeat_type || 'none',
        repeat_interval: editActivity.repeat_interval || 1,
        repeat_end_date: editActivity.repeat_end_date || null,
        repeat_count: editActivity.repeat_count || null,
        notifications: editActivity.notify || false,
      };
    }
    return {
      repeat_type: 'none',
      repeat_interval: 1,
      notifications: false,
    };
  });

  const [showEndDatePicker, setShowEndDatePicker] = useState(false);
  const [endDateMode, setEndDateMode] = useState<'date' | 'count'>('date');

  // Handle back navigation for edit mode from Calendar
  useEffect(() => {
    if (isEditMode && fromScreen === 'Calendar') {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Check if user is going back
        if (e.data.action.type === 'GO_BACK') {
          // Prevent default behavior
          e.preventDefault();
          
          // Navigate back to Calendar
          navigation.dispatch(
            CommonActions.reset({
              index: 0,
              routes: [
                {
                  name: 'Calendar',
                }
              ],
            })
          );
        }
      });

      return unsubscribe;
    }
  }, [navigation, isEditMode, fromScreen]);

  const getCategoryInfo = () => {
    switch (category) {
      case 'FEEDING':
        return { emoji: '🥣', color: Colors.feeding };
      case 'CARE':
        return { emoji: '🦴', color: Colors.care };
      case 'ACTIVITY':
        return { emoji: '🎾', color: Colors.activity };
      default:
        return { emoji: '📝', color: Colors.primary };
    }
  };

  const repeatTypeOptions = [
    { value: 'day' as RepeatType, label: t('activity.repeat_days'), emoji: '📅' },
    { value: 'week' as RepeatType, label: t('activity.repeat_weeks'), emoji: '📆' },
    { value: 'month' as RepeatType, label: t('activity.repeat_months'), emoji: '🗓️' },
    { value: 'year' as RepeatType, label: t('activity.repeat_years'), emoji: '📅' },
  ];

  const intervalOptions = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29, 30];

  const handleRepeatToggle = (enabled: boolean) => {
    setRepeatData(prev => ({
      ...prev,
      repeat_type: enabled ? 'day' : 'none',
      repeat_interval: 1,
      repeat_end_date: null,
      repeat_count: null,
    }));
  };

  const handleRepeatTypeSelect = (repeatType: RepeatType) => {
    setRepeatData(prev => ({ ...prev, repeat_type: repeatType }));
  };

  const handleIntervalSelect = (interval: number) => {
    setRepeatData(prev => ({ ...prev, repeat_interval: interval }));
  };

  const handleEndDateModeChange = (mode: 'date' | 'count') => {
    setEndDateMode(mode);
    if (mode === 'date') {
      setRepeatData(prev => ({ ...prev, repeat_count: null }));
    } else {
      setRepeatData(prev => ({ ...prev, repeat_end_date: null }));
    }
  };

  const handleEndDateChange = (selectedDate: Date) => {
    setRepeatData(prev => ({
      ...prev,
      repeat_end_date: selectedDate.toISOString().split('T')[0],
    }));
  };

  const handleCountChange = (count: string) => {
    const numCount = parseInt(count) || 0;
    setRepeatData(prev => ({
      ...prev,
      repeat_count: numCount > 0 ? numCount : null,
    }));
  };

  const handleNotificationToggle = (value: boolean) => {
    setRepeatData(prev => ({ ...prev, notifications: value }));
  };

  const getRepeatDescription = () => {
    if (repeatData.repeat_type === 'none') {
      return t('activity.one_time_description');
    }

    const interval = repeatData.repeat_interval;
    const type = repeatData.repeat_type;
    
    let description = '';
    if (interval === 1) {
      switch (type) {
        case 'day':
          description = t('activity.every_day');
          break;
        case 'week':
          description = t('activity.every_week');
          break;
        case 'month':
          description = t('activity.every_month');
          break;
        case 'year':
          description = t('activity.every_year');
          break;
      }
    } else {
      switch (type) {
        case 'day':
          description = t('activity.every_x_days', { count: interval });
          break;
        case 'week':
          description = t('activity.every_x_weeks', { count: interval });
          break;
        case 'month':
          description = t('activity.every_x_months', { count: interval });
          break;
        case 'year':
          description = t('activity.every_x_years', { count: interval });
          break;
      }
    }

    if (repeatData.repeat_end_date) {
      description += ` ${t('activity.until')} ${new Date(repeatData.repeat_end_date).toLocaleDateString()}`;
    } else if (repeatData.repeat_count) {
      description += ` ${t('activity.times', { count: repeatData.repeat_count })}`;
    }

    return description;
  };

  const handleNext = () => {
    const finalData = {
      ...activityData,
      ...repeatData,
    };
    
    navigation.navigate('Confirmation', { 
      petId, 
      category,
      editActivity,
      activityData: finalData,
      preselectedDate,
      fromScreen
    });
  };

  const categoryInfo = getCategoryInfo();
  const isRepeatEnabled = repeatData.repeat_type !== 'none';

  return (
    <LinearGradient
      colors={Colors.gradient.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={styles.emoji}>{categoryInfo.emoji}</Text>
            </View>
            <Text style={styles.title}>
              {isEditMode ? t('activity.update_repeat_settings') : t('activity.set_repeat_schedule')}
            </Text>
            <Text style={styles.subtitle}>
              {isEditMode 
                ? t('activity.modify_repeat_frequency')
                : t('activity.choose_repeat_frequency')
              }
            </Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Repeat Toggle */}
            <Card variant="elevated" style={styles.toggleCard}>
              <View style={styles.toggleRow}>
                <View style={styles.toggleLeft}>
                  <Ionicons name="repeat-outline" size={20} color={categoryInfo.color} />
                  <View style={styles.toggleText}>
                    <Text style={styles.toggleTitle}>{t('activity.repeat_activity')}</Text>
                    <Text style={styles.toggleDescription}>{getRepeatDescription()}</Text>
                  </View>
                </View>
                <Switch
                  value={isRepeatEnabled}
                  onValueChange={handleRepeatToggle}
                  trackColor={{ false: Colors.border, true: categoryInfo.color + '40' }}
                  thumbColor={isRepeatEnabled ? categoryInfo.color : Colors.textLight}
                />
              </View>
            </Card>

            {/* Repeat Settings */}
            {isRepeatEnabled && (
              <>
                {/* Repeat Type */}
                <Card variant="elevated" style={styles.settingsCard}>
                  <Text style={styles.sectionTitle}>{t('activity.repeat_period')}</Text>
                  <View style={styles.optionsGrid}>
                    {repeatTypeOptions.map((option) => (
                      <TouchableOpacity
                        key={option.value}
                        style={[
                          styles.optionButton,
                          repeatData.repeat_type === option.value && styles.optionButtonSelected
                        ]}
                        onPress={() => handleRepeatTypeSelect(option.value)}
                      >
                        <Text style={styles.optionEmoji}>{option.emoji}</Text>
                        <Text style={[
                          styles.optionLabel,
                          repeatData.repeat_type === option.value && { color: categoryInfo.color }
                        ]}>
                          {option.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>

                {/* Repeat Interval */}
                <Card variant="elevated" style={styles.settingsCard}>
                  <Text style={styles.sectionTitle}>{t('activity.repeat_frequency')}</Text>
                  <ScrollView 
                    horizontal 
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.intervalContainer}
                  >
                    {intervalOptions.map((interval) => (
                      <TouchableOpacity
                        key={interval}
                        style={[
                          styles.intervalButton,
                          repeatData.repeat_interval === interval && styles.intervalButtonSelected
                        ]}
                        onPress={() => handleIntervalSelect(interval)}
                      >
                        <Text style={[
                          styles.intervalText,
                          repeatData.repeat_interval === interval && { color: categoryInfo.color }
                        ]}>
                          {interval}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Card>

                {/* End Date/Count */}
                <Card variant="elevated" style={styles.settingsCard}>
                  <Text style={styles.sectionTitle}>{t('activity.repeat_end')}</Text>
                  
                  {/* Mode Toggle */}
                  <View style={styles.endModeContainer}>
                    <TouchableOpacity
                      style={[
                        styles.endModeButton,
                        endDateMode === 'date' && styles.endModeButtonSelected
                      ]}
                      onPress={() => handleEndDateModeChange('date')}
                    >
                      <Text style={[
                        styles.endModeText,
                        endDateMode === 'date' && { color: categoryInfo.color }
                      ]}>
                        {t('activity.until_date')}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[
                        styles.endModeButton,
                        endDateMode === 'count' && styles.endModeButtonSelected
                      ]}
                      onPress={() => handleEndDateModeChange('count')}
                    >
                      <Text style={[
                        styles.endModeText,
                        endDateMode === 'count' && { color: categoryInfo.color }
                      ]}>
                        {t('activity.times_count')}
                      </Text>
                    </TouchableOpacity>
                  </View>

                  {/* Date Picker */}
                  {endDateMode === 'date' && (
                    <TouchableOpacity
                      style={styles.datePickerButton}
                      onPress={() => setShowEndDatePicker(true)}
                    >
                      <Ionicons name="calendar-outline" size={20} color={categoryInfo.color} />
                      <Text style={styles.datePickerText}>
                        {repeatData.repeat_end_date 
                          ? new Date(repeatData.repeat_end_date).toLocaleDateString()
                          : t('activity.select_end_date')
                        }
                      </Text>
                      <Ionicons name="chevron-forward" size={16} color={Colors.textSecondary} />
                    </TouchableOpacity>
                  )}

                  {/* Count Input */}
                  {endDateMode === 'count' && (
                    <View style={styles.countContainer}>
                      <Input
                        value={repeatData.repeat_count?.toString() || ''}
                        onChangeText={handleCountChange}
                        placeholder={t('activity.enter_count')}
                        keyboardType="numeric"
                        leftIcon={<Ionicons name="calculator-outline" size={20} color={Colors.textSecondary} />}
                        containerStyle={styles.countInputContainer}
                      />
                      <Text style={styles.countLabel}>{t('activity.times')}</Text>
                    </View>
                  )}
                </Card>
              </>
            )}

            {/* Notifications */}
            <Card variant="default" style={styles.notificationCard}>
              <View style={styles.notificationRow}>
                <View style={styles.notificationLeft}>
                  <Ionicons name="notifications-outline" size={20} color={categoryInfo.color} />
                  <View style={styles.notificationText}>
                    <Text style={styles.notificationTitle}>{t('activity.nots')}</Text>
                    <Text style={styles.notificationDescription}>
                      {t('activity.notifications_description')}
                    </Text>
                  </View>
                </View>
                <Switch
                  value={repeatData.notifications}
                  onValueChange={handleNotificationToggle}
                  trackColor={{ false: Colors.border, true: categoryInfo.color + '40' }}
                  thumbColor={repeatData.notifications ? categoryInfo.color : Colors.textLight}
                />
              </View>
            </Card>
          </ScrollView>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Continue Button */}
            <Button
              title={t('activity.continue')}
              onPress={handleNext}
              size="large"
              style={styles.continueButton}
            />

            {/* Progress */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{t('activity.step_of', { current: 4, total: 5 })}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '80%' }]} />
              </View>
            </View>
          </View>
        </View>
      </SafeAreaView>

      {/* Custom Date Picker Modal */}
      <DateTimePickerModal
        isVisible={showEndDatePicker}
        mode="date"
        value={repeatData.repeat_end_date ? new Date(repeatData.repeat_end_date) : new Date()}
        onConfirm={handleEndDateChange}
        onCancel={() => setShowEndDatePicker(false)}
        minimumDate={new Date()}
        title={t('activity.select_end_date')}
        confirmButtonText={t('common.confirm')}
      />
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
  content: {
    flex: 1,
    padding: '5%',
  },
  header: {
    alignItems: 'center',
    marginBottom: '5%',
    marginTop: '2%',
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: '3%',
  },
  toggleCard: {
    marginBottom: '3%',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  toggleText: {
    marginLeft: 12,
    flex: 1,
  },
  toggleTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 1,
  },
  toggleDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  settingsCard: {
    marginBottom: '3%',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '48%',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    marginBottom: 8,
  },
  optionButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  optionEmoji: {
    fontSize: 20,
    marginBottom: 4,
  },
  optionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  intervalContainer: {
    paddingHorizontal: 4,
  },
  intervalButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
  },
  intervalButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  intervalText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  endModeContainer: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  endModeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    marginRight: 8,
    alignItems: 'center',
  },
  endModeButtonSelected: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  endModeText: {
    fontSize: 12,
    fontWeight: '500',
    color: Colors.text,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  datePickerText: {
    flex: 1,
    marginLeft: 12,
    fontSize: 14,
    color: Colors.text,
  },
  countContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  countInputContainer: {
    flex: 1,
    marginBottom: 0,
    marginRight: 8,
  },
  countLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  notificationCard: {
    marginBottom: '3%',
  },
  notificationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  notificationLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  notificationText: {
    marginLeft: 12,
    flex: 1,
  },
  notificationTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 1,
  },
  notificationDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  bottomSection: {
    paddingTop: '3%',
  },
  continueButton: {
    marginBottom: '4%',
  },
  progressContainer: {
    alignItems: 'center',
    paddingBottom: '2%',
  },
  progressText: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 6,
  },
  progressBar: {
    width: '100%',
    height: 3,
    backgroundColor: Colors.borderLight,
    borderRadius: 2,
  },
  progressFill: {
    height: '100%',
    backgroundColor: Colors.primary,
    borderRadius: 2,
  },
}); 