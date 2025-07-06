import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ActivityStackParamList, DateTimeData } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';
import { Colors } from '../../constants/Colors';

type SelectDateTimeScreenNavigationProp = StackNavigationProp<ActivityStackParamList, 'SelectDateTime'>;
type SelectDateTimeScreenRouteProp = RouteProp<ActivityStackParamList, 'SelectDateTime'>;

interface SelectDateTimeScreenProps {
  navigation: SelectDateTimeScreenNavigationProp;
  route: SelectDateTimeScreenRouteProp;
}

export const SelectDateTimeScreen: React.FC<SelectDateTimeScreenProps> = ({
  navigation,
  route,
}) => {
  const { t, i18n } = useTranslation();
  const { petId, category, editActivity, activityData, preselectedDate, fromScreen } = route.params;
  const isEditMode = !!editActivity;
  
  const [dateTimeData, setDateTimeData] = useState<DateTimeData>(() => {
    const now = new Date();
    
    // Pre-populate with existing data if in edit mode
    if (isEditMode && editActivity) {
      const activityDate = new Date(editActivity.date);
      const activityTime = new Date(editActivity.time);
      
      // Create proper time object with today's date but activity's time
      const timeToUse = isNaN(activityTime.getTime()) ? now : 
        new Date(now.getFullYear(), now.getMonth(), now.getDate(),
                activityTime.getHours(), activityTime.getMinutes(), activityTime.getSeconds());
      
      // Ensure dates are valid
      return {
        date: isNaN(activityDate.getTime()) ? now : activityDate,
        time: timeToUse,
      };
    }
    
    // Use preselected date from calendar if provided
    if (preselectedDate) {
      const selectedDate = new Date(preselectedDate);
      return {
        date: isNaN(selectedDate.getTime()) ? now : selectedDate,
        time: now, // Current time
      };
    }
    
    return {
      date: now,
      time: now,
    };
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
      case 'HEALTH':
        return { emoji: '🩺', color: Colors.health };
      case 'ACTIVITY':
        return { emoji: '🎾', color: Colors.activity };
      default:
        return { emoji: '📝', color: Colors.primary };
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(i18n.language, {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date): string => {
    return time.toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    setDateTimeData(prev => ({ ...prev, date: selectedDate }));
  };

  const handleTimeConfirm = (selectedTime: Date) => {
    setShowTimePicker(false);
    // Сохраняем выбранное время как есть, без изменения даты
    setDateTimeData(prev => ({ ...prev, time: selectedTime }));
  };

  const handleDateCancel = () => {
    setShowDatePicker(false);
  };

  const handleTimeCancel = () => {
    setShowTimePicker(false);
  };

  const getQuickTimePresets = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    const oneHourLater = new Date(now.getTime() + 60 * 60 * 1000);
    const twoHoursLater = new Date(now.getTime() + 2 * 60 * 60 * 1000);
    
    return [
      { label: t('activity.now'), time: now },
      { label: t('activity.one_hour_ago'), time: oneHourAgo },
      { label: t('activity.two_hours_ago'), time: twoHoursAgo },
      { label: t('activity.in_one_hour'), time: oneHourLater },
      { label: t('activity.in_two_hours'), time: twoHoursLater },
    ];
  };

  const handleQuickTimeSelect = (time: Date) => {
    // Создаем время с текущей датой и выбранным временем
    const today = new Date();
    const selectedTime = new Date(today.getFullYear(), today.getMonth(), today.getDate(), 
                                 time.getHours(), time.getMinutes(), time.getSeconds());
    
    // Когда выбираем будущее время, также устанавливаем дату на сегодня если она не уже установлена на будущее
    const selectedDate = time > new Date() ? today : dateTimeData.date;
    setDateTimeData(prev => ({ ...prev, time: selectedTime, date: selectedDate }));
  };

  const handleNext = () => {
    const combinedDateTime = {
      ...activityData,
      // Convert Date objects to ISO strings for navigation serialization
      date: dateTimeData.date.toISOString(),
      time: dateTimeData.time.toISOString(),
    };
    
    navigation.navigate('SetRepeat', { 
      petId, 
      category,
      editActivity,
      activityData: combinedDateTime,
      preselectedDate,
      fromScreen
    });
  };

  const categoryInfo = getCategoryInfo();

  return (
    <LinearGradient
      colors={Colors.gradient.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
              <Text style={styles.emoji}>{categoryInfo.emoji}</Text>
            </View>
            <Text style={styles.title}>
              {isEditMode ? t('activity.update_date_time') : t('activity.when_does_happen')}
            </Text>
            <Text style={styles.subtitle}>
              {isEditMode ? t('activity.modify_date_time') : t('activity.select_when_activity')}
            </Text>
          </View>

          {/* Quick Time Presets */}
          <Card variant="default" style={styles.presetsCard}>
            <Text style={styles.sectionTitle}>{t('activity.quick_select')}</Text>
            <View style={styles.presetsContainer}>
              {getQuickTimePresets().map((preset, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.presetButton}
                  onPress={() => handleQuickTimeSelect(preset.time)}
                >
                  <Ionicons name="time-outline" size={16} color={Colors.primary} />
                  <Text style={styles.presetText}>{preset.label}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </Card>

          {/* Date & Time Selection */}
          <Card variant="elevated" style={styles.selectionCard}>
            {/* Date Selection */}
            <TouchableOpacity
              style={styles.selectionRow}
              onPress={() => setShowDatePicker(true)}
            >
              <View style={styles.selectionLeft}>
                <Ionicons name="calendar-outline" size={24} color={categoryInfo.color} />
                <View style={styles.selectionText}>
                  <Text style={styles.selectionLabel}>{t('activity.date')}</Text>
                  <Text style={styles.selectionValue}>{formatDate(dateTimeData.date)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>

            <View style={styles.separator} />

            {/* Time Selection */}
            <TouchableOpacity
              style={styles.selectionRow}
              onPress={() => setShowTimePicker(true)}
            >
              <View style={styles.selectionLeft}>
                <Ionicons name="time-outline" size={24} color={categoryInfo.color} />
                <View style={styles.selectionText}>
                  <Text style={styles.selectionLabel}>{t('activity.time')}</Text>
                  <Text style={styles.selectionValue}>{formatTime(dateTimeData.time)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </Card>

          {/* Continue Button */}
          <Button
            title={t('activity.continue')}
            onPress={handleNext}
            size="large"
            style={styles.continueButton}
          />

          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>{t('activity.step_of', { current: 3, total: 5 })}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
          </View>

          {/* Date/Time Pickers */}
          <DateTimePickerModal
            isVisible={showDatePicker}
            mode="date"
            value={dateTimeData.date}
            onConfirm={handleDateConfirm}
            onCancel={handleDateCancel}
            minimumDate={new Date(new Date().getFullYear() - 2, 0, 1)} // 2 years ago
            maximumDate={new Date(new Date().getFullYear() + 1, 11, 31)} // 1 year ahead
            title={t('activity.select_activity_date')}
          />

          <DateTimePickerModal
            isVisible={showTimePicker}
            mode="time"
            value={dateTimeData.time}
            onConfirm={handleTimeConfirm}
            onCancel={handleTimeCancel}
            title={t('activity.select_activity_time')}
          />
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: '5%',
  },
  content: {
    flex: 1,
    padding: '6%',
    minHeight: '100%',
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
  presetsCard: {
    marginBottom: '4%',
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  presetsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  presetButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: Colors.primaryLight,
    borderRadius: 10,
    marginRight: '2%',
    marginBottom: '2%',
    minWidth: '30%',
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
    marginLeft: 6,
  },
  selectionCard: {
    marginBottom: '8%',
  },
  selectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
  },
  selectionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  selectionText: {
    marginLeft: 16,
    flex: 1,
  },
  selectionLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  selectionValue: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  separator: {
    height: 1,
    backgroundColor: Colors.borderLight,
    marginHorizontal: 16,
  },
  continueButton: {
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