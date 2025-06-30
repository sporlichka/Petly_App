import React from 'react';
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

import { ActivityStackParamList, ActivityCategory } from '../../types';
import { Colors } from '../../constants/Colors';

type SelectTypeScreenNavigationProp = StackNavigationProp<ActivityStackParamList, 'SelectType'>;
type SelectTypeScreenRouteProp = RouteProp<ActivityStackParamList, 'SelectType'>;

interface SelectTypeScreenProps {
  navigation: SelectTypeScreenNavigationProp;
  route: SelectTypeScreenRouteProp;
}

export const SelectTypeScreen: React.FC<SelectTypeScreenProps> = ({
  navigation,
  route,
}) => {
  const { petId, editActivity } = route.params;
  const isEditMode = !!editActivity;

  const activityTypes = [
    {
      category: 'FEEDING' as ActivityCategory,
      emoji: '🥣',
      title: 'Feeding',
      description: 'Track meals, treats, and feeding schedules',
      color: Colors.feeding,
    },
    {
      category: 'HEALTH' as ActivityCategory,
      emoji: '🩺',
      title: 'Health',
      description: 'Record vet visits, medications, and symptoms',
      color: Colors.health,
    },
    {
      category: 'ACTIVITY' as ActivityCategory,
      emoji: '🎾',
      title: 'Activity',
      description: 'Log exercises, walks, and playtime',
      color: Colors.activity,
    },
  ];

  const handleSelectType = (category: ActivityCategory) => {
    // In edit mode, pre-populate the form data
    const initialData = isEditMode ? {
      title: editActivity.title,
      notes: editActivity.notes || '',
      food_type: editActivity.food_type || '',
      quantity: editActivity.quantity?.toString() || '',
      duration: '', // Not stored in current model
      weight: '', // Not stored in current model  
      temperature: '', // Not stored in current model
    } : undefined;

    navigation.navigate('FillDetails', { 
      petId, 
      category,
      editActivity,
      activityData: initialData
    });
  };

  // In edit mode, skip type selection and go directly to details
  React.useEffect(() => {
    if (isEditMode && editActivity) {
      handleSelectType(editActivity.category);
    }
  }, [isEditMode, editActivity]);

  // If in edit mode, show loading while auto-navigating
  if (isEditMode) {
    return (
      <LinearGradient
        colors={Colors.gradient.background as any}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.content}>
            <View style={styles.header}>
              <Text style={styles.title}>Loading activity...</Text>
            </View>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient
      colors={Colors.gradient.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>What type of activity?</Text>
            <Text style={styles.subtitle}>
              Choose the category that best describes this activity
            </Text>
          </View>

          <View style={styles.typesContainer}>
            {activityTypes.map((type) => (
              <TouchableOpacity
                key={type.category}
                style={[
                  styles.typeCard,
                  { borderColor: type.color }
                ]}
                onPress={() => handleSelectType(type.category)}
                activeOpacity={0.7}
              >
                <View style={styles.typeContent}>
                  <View style={[styles.emojiContainer, { backgroundColor: type.color + '20' }]}>
                    <Text style={styles.emoji}>{type.emoji}</Text>
                  </View>
                  <View style={styles.typeText}>
                    <Text style={styles.typeTitle}>{type.title}</Text>
                    <Text style={styles.typeDescription}>{type.description}</Text>
                  </View>
                  <View style={styles.arrow}>
                    <Text style={styles.arrowText}>→</Text>
                  </View>
                </View>
              </TouchableOpacity>
            ))}
          </View>

          <View style={styles.progressContainer}>
            <Text style={styles.progressText}>Step 1 of 5</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '20%' }]} />
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
    padding: 24,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
    marginTop: 20,
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
  typesContainer: {
    flex: 1,
    gap: 16,
  },
  typeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  typeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
  },
  emojiContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  emoji: {
    fontSize: 28,
  },
  typeText: {
    flex: 1,
  },
  typeTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  typeDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  arrow: {
    marginLeft: 16,
  },
  arrowText: {
    fontSize: 20,
    color: Colors.textLight,
    fontWeight: '600',
  },
  progressContainer: {
    alignItems: 'center',
    marginTop: 20,
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