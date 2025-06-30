import React, { useState } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { ActivityStackParamList, RepeatData } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';

type SetRepeatScreenNavigationProp = StackNavigationProp<ActivityStackParamList, 'SetRepeat'>;
type SetRepeatScreenRouteProp = RouteProp<ActivityStackParamList, 'SetRepeat'>;

interface SetRepeatScreenProps {
  navigation: SetRepeatScreenNavigationProp;
  route: SetRepeatScreenRouteProp;
}

export const SetRepeatScreen: React.FC<SetRepeatScreenProps> = ({
  navigation,
  route,
}) => {
  const { petId, category, editActivity, activityData } = route.params;
  const isEditMode = !!editActivity;
  
  const [repeatData, setRepeatData] = useState<RepeatData>(() => {
    // Pre-populate with existing data if in edit mode
    if (isEditMode && editActivity) {
      // Validate repeat value to ensure it matches expected types
      const validRepeatValues: Array<'none' | 'daily' | 'weekly' | 'monthly'> = ['none', 'daily', 'weekly', 'monthly'];
      const repeat = validRepeatValues.includes(editActivity.repeat as any) 
        ? (editActivity.repeat as 'none' | 'daily' | 'weekly' | 'monthly')
        : 'none';
      
      return {
        repeat,
        notifications: editActivity.notify || false,
      };
    }
    return {
      repeat: 'none',
      notifications: false,
    };
  });

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

  const repeatOptions = [
    {
      value: 'none' as const,
      emoji: '📅',
      title: 'One-time',
      description: 'This activity happens just once',
    },
    {
      value: 'daily' as const,
      emoji: '🔄',
      title: 'Daily',
      description: 'Repeat every day at the same time',
    },
    {
      value: 'weekly' as const,
      emoji: '📆',
      title: 'Weekly',
      description: 'Repeat every week on the same day',
    },
    {
      value: 'monthly' as const,
      emoji: '🗓️',
      title: 'Monthly',
      description: 'Repeat every month on the same date',
    },
  ];

  const handleRepeatSelect = (repeat: RepeatData['repeat']) => {
    setRepeatData(prev => ({ ...prev, repeat }));
  };

  const handleNotificationToggle = (value: boolean) => {
    setRepeatData(prev => ({ ...prev, notifications: value }));
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
      activityData: finalData 
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
            <Text style={styles.title}>
              {isEditMode ? 'Update repeat settings' : 'Set repeat schedule'}
            </Text>
            <Text style={styles.subtitle}>
              {isEditMode 
                ? 'Modify how often this activity repeats'
                : 'Choose how often this activity should repeat'
              }
            </Text>
          </View>

          <ScrollView 
            style={styles.scrollView}
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.scrollContent}
          >
            {/* Repeat Options */}
            <Card variant="elevated" style={styles.optionsCard}>
              <Text style={styles.sectionTitle}>Repeat Schedule</Text>
              
              {repeatOptions.map((option) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.optionRow,
                    repeatData.repeat === option.value && styles.optionRowSelected
                  ]}
                  onPress={() => handleRepeatSelect(option.value)}
                >
                  <View style={styles.optionLeft}>
                    <View style={[
                      styles.optionIcon,
                      repeatData.repeat === option.value && { backgroundColor: categoryInfo.color + '20' }
                    ]}>
                      <Text style={styles.optionEmoji}>{option.emoji}</Text>
                    </View>
                    <View style={styles.optionText}>
                      <Text style={[
                        styles.optionTitle,
                        repeatData.repeat === option.value && { color: categoryInfo.color }
                      ]}>
                        {option.title}
                      </Text>
                      <Text style={styles.optionDescription}>{option.description}</Text>
                    </View>
                  </View>
                  <View style={[
                    styles.radioButton,
                    repeatData.repeat === option.value && { 
                      borderColor: categoryInfo.color,
                      backgroundColor: categoryInfo.color 
                    }
                  ]}>
                    {repeatData.repeat === option.value && (
                      <Ionicons name="checkmark" size={14} color="white" />
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </Card>

            {/* Notifications */}
            <Card variant="default" style={styles.notificationCard}>
              <View style={styles.notificationRow}>
                <View style={styles.notificationLeft}>
                  <Ionicons name="notifications-outline" size={20} color={categoryInfo.color} />
                  <View style={styles.notificationText}>
                    <Text style={styles.notificationTitle}>Notifications</Text>
                    <Text style={styles.notificationDescription}>
                      Get reminded when it's time for this activity
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

            {/* Info Text */}
            {repeatData.repeat !== 'none' && (
              <View style={styles.infoContainer}>
                <Ionicons name="information-circle-outline" size={14} color={Colors.textSecondary} />
                <Text style={styles.infoText}>
                  This will create a recurring activity schedule. You can modify or stop it anytime from the calendar.
                </Text>
              </View>
            )}
          </ScrollView>

          {/* Bottom Section */}
          <View style={styles.bottomSection}>
            {/* Continue Button */}
            <Button
              title="Continue"
              onPress={handleNext}
              size="large"
              style={styles.continueButton}
            />

            {/* Progress */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Step 4 of 5</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '80%' }]} />
              </View>
            </View>
          </View>
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
    padding: 20,
  },
  header: {
    alignItems: 'center',
    marginBottom: 20,
    marginTop: 10,
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
  },
  optionsCard: {
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    borderRadius: 10,
    marginBottom: 6,
  },
  optionRowSelected: {
    backgroundColor: Colors.primaryLight,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  optionIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  optionEmoji: {
    fontSize: 18,
  },
  optionText: {
    flex: 1,
  },
  optionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 1,
  },
  optionDescription: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: Colors.border,
    justifyContent: 'center',
    alignItems: 'center',
  },
  notificationCard: {
    marginBottom: 12,
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
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.info + '10',
    padding: 12,
    borderRadius: 10,
    marginBottom: 12,
  },
  infoText: {
    fontSize: 12,
    color: Colors.textSecondary,
    lineHeight: 16,
    marginLeft: 6,
    flex: 1,
  },
  bottomSection: {
    paddingTop: 12,
  },
  continueButton: {
    marginBottom: 16,
  },
  progressContainer: {
    alignItems: 'center',
    paddingBottom: 8,
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