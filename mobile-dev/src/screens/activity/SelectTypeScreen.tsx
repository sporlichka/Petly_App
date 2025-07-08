import React, { useEffect } from 'react';
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
import { useTranslation } from 'react-i18next';

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
  const { t } = useTranslation();
  const { petId, editActivity, preselectedDate, fromScreen } = route.params;
  const isEditMode = !!editActivity;

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

  const activityTypes = [
    {
      id: 'feeding',
      category: 'FEEDING' as ActivityCategory,
      emoji: '🥣',
      title: t('activity.feeding'),
      description: t('activity.feeding_description'),
      color: Colors.feeding,
    },
    {
      id: 'care',
      category: 'CARE' as ActivityCategory,
      icon: '🦴',
      title: t('activity.care'),
      description: t('activity.care_description'),
      color: Colors.care,
    },
    {
      category: 'ACTIVITY' as ActivityCategory,
      emoji: '🎾',
      title: t('activity.activity'),
      description: t('activity.activity_description'),
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
      duration: editActivity.duration || '',
    } : undefined;

    navigation.navigate('FillDetails', { 
      petId, 
      category,
      editActivity,
      activityData: initialData,
      preselectedDate,
      fromScreen
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
              <Text style={styles.title}>{t('activity.loading_activity')}</Text>
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
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
          <View style={styles.header}>
            <Text style={styles.title}>{t('activity.what_type_activity')}</Text>
            <Text style={styles.subtitle}>
              {t('activity.choose_category')}
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
            <Text style={styles.progressText}>{t('activity.step_of', { current: 1, total: 5 })}</Text>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '20%' }]} />
            </View>
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
    marginBottom: '10%',
    marginTop: '3%',
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
  },
  typeCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 2,
    marginBottom: '4%',
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
    marginTop: '5%',
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