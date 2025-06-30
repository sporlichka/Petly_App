import React, { useState } from 'react';
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
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

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
  const { petId, category, editActivity, activityData: initialData, preselectedDate } = route.params;
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

  const getCategoryInfo = () => {
    switch (category) {
      case 'FEEDING':
        return {
          emoji: '🥣',
          title: isEditMode ? 'Edit Feeding Details' : 'Feeding Details',
          color: Colors.feeding,
        };
      case 'HEALTH':
        return {
          emoji: '🩺',
          title: isEditMode ? 'Edit Health Details' : 'Health Details',
          color: Colors.health,
        };
      case 'ACTIVITY':
        return {
          emoji: '🎾',
          title: isEditMode ? 'Edit Activity Details' : 'Activity Details',
          color: Colors.activity,
        };
      default:
        return { 
          emoji: '📝', 
          title: isEditMode ? 'Edit Activity Details' : 'Activity Details', 
          color: Colors.primary 
        };
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<ActivityFormData> = {};

    if (!formData.title.trim()) {
      newErrors.title = 'Activity title is required';
    }

    if (category === 'FEEDING') {
      if (!formData.food_type?.trim()) {
        newErrors.food_type = 'Food type is required';
      }
    }

    if (category === 'ACTIVITY' && !formData.duration?.trim()) {
      newErrors.duration = 'Duration is required';
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
      preselectedDate
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
        label="Food Type *"
        placeholder="e.g., Dry food, Wet food, Treats"
        value={formData.food_type || ''}
        onChangeText={(text) => updateFormData('food_type', text)}
        error={errors.food_type}
        leftIcon={<Ionicons name="restaurant-outline" size={20} color={Colors.textSecondary} />}
      />
      
      <Input
        label="Quantity (Optional)"
        placeholder="e.g., 2 cups, 200g, 1 can"
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
        label="Duration *"
        placeholder="e.g., 30 minutes, 1 hour"
        value={formData.duration || ''}
        onChangeText={(text) => updateFormData('duration', text)}
        error={errors.duration}
        leftIcon={<Ionicons name="time-outline" size={20} color={Colors.textSecondary} />}
      />
    </>
  );

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
                Fill in the specific details for this activity
              </Text>
            </View>

            {/* Form */}
            <Card variant="elevated" style={styles.formCard}>
              <Input
                label="Activity Title *"
                placeholder={`e.g., ${category === 'FEEDING' ? 'Morning breakfast' : category === 'HEALTH' ? 'Vet checkup' : 'Morning walk'}`}
                value={formData.title}
                onChangeText={(text) => updateFormData('title', text)}
                error={errors.title}
                leftIcon={<Ionicons name="create-outline" size={20} color={Colors.textSecondary} />}
              />

              {category === 'FEEDING' && renderFeedingForm()}
              {category === 'ACTIVITY' && renderActivityForm()}

              <Input
                label="Notes (Optional)"
                placeholder="Any additional notes..."
                value={formData.notes}
                onChangeText={(text) => updateFormData('notes', text)}
                error={errors.notes}
                multiline
                numberOfLines={3}
                leftIcon={<Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />}
              />

              <Button
                title="Continue"
                onPress={handleNext}
                size="large"
                style={styles.continueButton}
              />
            </Card>

            {/* Progress */}
            <View style={styles.progressContainer}>
              <Text style={styles.progressText}>Step 2 of 5</Text>
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