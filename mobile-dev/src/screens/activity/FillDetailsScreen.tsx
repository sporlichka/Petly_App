import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CommonActions } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { ActivityStackParamList, ActivityFormData } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';

type FillDetailsScreenNavigationProp = StackNavigationProp<ActivityStackParamList, 'FillDetails'>;
type FillDetailsScreenRouteProp = RouteProp<ActivityStackParamList, 'FillDetails'>;

interface FillDetailsScreenProps {
  navigation: FillDetailsScreenNavigationProp;
  route: FillDetailsScreenRouteProp;
}

export const FillDetailsScreen: React.FC<FillDetailsScreenProps> = ({
  navigation,
  route,
}) => {
  const { t } = useTranslation();
  const { petId, category, editActivity, activityData: initialData, preselectedDate, fromScreen } = route.params;
  const isEditMode = !!editActivity;
  
  const [formData, setFormData] = useState<ActivityFormData>(() => {
    // Pre-populate form data if in edit mode
    if (isEditMode && initialData) {
      return initialData;
    }
    return {
      title: '',
      notes: '',
      food_type: '',
      quantity: '',
      duration: '',
    };
  });
  
  const [errors, setErrors] = useState<Partial<ActivityFormData>>({});

  // Handle back navigation for edit mode
  useEffect(() => {
    if (isEditMode) {
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        // Check if user is going back
        if (e.data.action.type === 'GO_BACK') {
          // Prevent default behavior
          e.preventDefault();
          
          // Navigate back to the appropriate screen based on source
          if (fromScreen === 'Calendar') {
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
          } else {
            // Default behavior for other sources - go back to previous screen
            navigation.getParent()?.goBack();
          }
        }
      });

      return unsubscribe;
    }
  }, [navigation, isEditMode, fromScreen]);

  const getCategoryInfo = () => {
    switch (category) {
      case 'FEEDING':
        return {
          emoji: '🥣',
          title: isEditMode ? t('activity.edit_feeding_details') : t('activity.feeding_details'),
          color: Colors.feeding,
        };
      case 'HEALTH':
        return {
          emoji: '🩺',
          title: isEditMode ? t('activity.edit_health_details') : t('activity.health_details'),
          color: Colors.health,
        };
      case 'ACTIVITY':
        return {
          emoji: '🎾',
          title: isEditMode ? t('activity.edit_activity_details') : t('activity.activity_details'),
          color: Colors.activity,
        };
      default:
        return { 
          emoji: '📝', 
          title: isEditMode ? t('activity.edit_activity_details') : t('activity.activity_details'), 
          color: Colors.primary 
        };
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ActivityFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = t('activity.title_required_error');
    }

    if (category === 'FEEDING') {
      if (!formData.food_type?.trim()) {
        newErrors.food_type = t('activity.food_type_required_error');
      }
    }

    if (category === 'ACTIVITY' && !formData.duration?.trim()) {
      newErrors.duration = t('activity.duration_required_error');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (!validateForm()) return;
    
    navigation.navigate('SelectDateTime', { 
      petId, 
      category,
      editActivity,
      activityData: formData,
      preselectedDate,
      fromScreen
    });
  };

  const updateFormData = (field: keyof ActivityFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const categoryInfo = getCategoryInfo();

  const renderFeedingForm = () => (
    <>
      <Input
        label={t('activity.food_type_required')}
        placeholder={t('activity.food_type_placeholder')}
        value={formData.food_type || ''}
        onChangeText={(text) => updateFormData('food_type', text)}
        error={errors.food_type}
        leftIcon={<Ionicons name="restaurant-outline" size={20} color={Colors.textSecondary} />}
      />
      
      <Input
        label={t('activity.quantity_optional')}
        placeholder={t('activity.quantity_placeholder')}
        value={formData.quantity || ''}
        onChangeText={(text) => updateFormData('quantity', text)}
        error={errors.quantity}
        leftIcon={<Ionicons name="scale-outline" size={20} color={Colors.textSecondary} />}
      />
    </>
  );

  const renderActivityForm = () => (
    <>
      <Input
        label={t('activity.duration_required')}
        placeholder={t('activity.duration_placeholder')}
        value={formData.duration || ''}
        onChangeText={(text) => updateFormData('duration', text)}
        error={errors.duration}
        leftIcon={<Ionicons name="time-outline" size={20} color={Colors.textSecondary} />}
      />
    </>
  );

  const getTitlePlaceholder = () => {
    switch (category) {
      case 'FEEDING':
        return t('activity.title_placeholder_feeding');
      case 'HEALTH':
        return t('activity.title_placeholder_health');
      case 'ACTIVITY':
        return t('activity.title_placeholder_activity');
      default:
        return t('activity.title_placeholder_activity');
    }
  };

  return (
    <LinearGradient
      colors={Colors.gradient.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                <Text style={styles.emoji}>{categoryInfo.emoji}</Text>
              </View>
              <Text style={styles.title}>{categoryInfo.title}</Text>
              <Text style={styles.subtitle}>
                {t('activity.fill_specific_details')}
              </Text>
            </View>

            {/* Form */}
            <Card variant="elevated" style={styles.formCard}>
              <Input
                label={t('activity.activity_title_required')}
                placeholder={getTitlePlaceholder()}
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                error={errors.title}
                leftIcon={<Ionicons name="create-outline" size={20} color={Colors.textSecondary} />}
              />

              {category === 'FEEDING' && renderFeedingForm()}
              {category === 'ACTIVITY' && renderActivityForm()}

              <Input
                label={t('activity.notes_optional')}
                placeholder={t('activity.notes_placeholder')}
                value={formData.notes}
                onChangeText={(text) => updateFormData('notes', text)}
                error={errors.notes}
                multiline
                numberOfLines={3}
                leftIcon={<Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />}
              />

              <Button
                title={t('activity.continue')}
                onPress={handleNext}
                size="large"
                style={styles.continueButton}
              />
            </Card>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>{t('activity.step_of', { current: 2, total: 5 })}</Text>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '40%' }]} />
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
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
  formCard: {
    marginBottom: 24,
  },
  continueButton: {
    marginTop: 8,
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