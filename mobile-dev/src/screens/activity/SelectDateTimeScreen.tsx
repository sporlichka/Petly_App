import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';

import { ActivityStackParamList, DateTimeData } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
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
  const { petId, category, activityData } = route.params;
  
  const [dateTimeData, setDateTimeData] = useState<DateTimeData>({
    date: new Date(),
    time: new Date(),
  });
  
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);

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
    return date.toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const formatTime = (time: Date): string => {
    return time.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const handleDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      setDateTimeData(prev => ({ ...prev, date: selectedDate }));
    }
  };

  const handleTimeChange = (event: any, selectedTime?: Date) => {
    setShowTimePicker(false);
    if (selectedTime) {
      setDateTimeData(prev => ({ ...prev, time: selectedTime }));
    }
  };

  const getQuickTimePresets = () => {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const twoHoursAgo = new Date(now.getTime() - 2 * 60 * 60 * 1000);
    
    return [
      { label: 'Now', time: now },
      { label: '1 hour ago', time: oneHourAgo },
      { label: '2 hours ago', time: twoHoursAgo },
    ];
  };

  const handleQuickTimeSelect = (time: Date) => {
    setDateTimeData(prev => ({ ...prev, time, date: new Date() }));
  };

  const handleNext = () => {
    const combinedDateTime = {
      ...activityData,
      ...dateTimeData,
    };
    
    navigation.navigate('SetRepeat', { 
      petId, 
      category, 
      activityData: combinedDateTime 
    });
  };

  const categoryInfo = getCategoryInfo();

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
            <Text style={styles.title}>When did this happen?</Text>
            <Text style={styles.subtitle}>
              Select the date and time for this activity
            </Text>
          </View>

          {/* Quick Time Presets */}
          <Card variant="default" style={styles.presetsCard}>
            <Text style={styles.sectionTitle}>Quick Select</Text>
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
                  <Text style={styles.selectionLabel}>Date</Text>
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
                  <Text style={styles.selectionLabel}>Time</Text>
                  <Text style={styles.selectionValue}>{formatTime(dateTimeData.time)}</Text>
                </View>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </TouchableOpacity>
          </Card>

          {/* Continue Button */}
          <Button
            title="Continue"
            onPress={handleNext}
            size="large"
            style={styles.continueButton}
          />

          {/* Progress */}
          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step 3 of 5</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '60%' }]} />
            </View>
          </View>

          {/* Date/Time Pickers */}
          {showDatePicker && (
            <DateTimePicker
              value={dateTimeData.date}
              mode="date"
              display="default"
              onChange={handleDateChange}
              maximumDate={new Date()}
            />
          )}

          {showTimePicker && (
            <DateTimePicker
              value={dateTimeData.time}
              mode="time"
              display="default"
              onChange={handleTimeChange}
            />
          )}
        </View>
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
  content: {
    flex: 1,
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
  presetsCard: {
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  presetsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  presetButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    gap: 6,
  },
  presetText: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.primary,
  },
  selectionCard: {
    marginBottom: 32,
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