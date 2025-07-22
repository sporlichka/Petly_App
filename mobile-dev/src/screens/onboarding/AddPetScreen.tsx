import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { OnboardingStackParamList, PetCreate, PetFormData, PetGender, WeightUnit } from '../../types';
import { useSpeciesUtils } from '../../utils/speciesUtils';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { GenderPicker } from '../../components/GenderPicker';
import { WeightUnitPicker } from '../../components/WeightUnitPicker';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';
import { trackEvent } from '../../services/mixpanelService';

type AddPetScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'AddPet'>;

interface AddPetScreenProps {
  navigation: AddPetScreenNavigationProp;
  route: {
    params: {
      species?: string;
      allowSpeciesEdit?: boolean;
      fromScreen?: string;
      isOnboarding?: boolean;
    };
  };
}

export const AddPetScreen: React.FC<AddPetScreenProps> = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const { getSpeciesDisplayName, getSpeciesIcon } = useSpeciesUtils();
  const { species, allowSpeciesEdit = false, fromScreen, isOnboarding = false } = route.params || {};
  
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: species || '',
    breed: '',
    gender: 'Male',
    birthdate: new Date(),
    weight: '',
    weight_unit: 'kg',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<PetFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<PetFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('onboarding.name_required_error');
    }

    if (!formData.species.trim()) {
      newErrors.species = t('onboarding.species_required_error');
    }

    if (!formData.weight || isNaN(parseFloat(formData.weight))) {
      newErrors.weight = t('onboarding.weight_required_error');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSavePet = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const petData: PetCreate = {
        name: formData.name.trim(),
        species: formData.species.trim(),
        breed: formData.breed.trim() || undefined,
        gender: formData.gender,
        birthdate: formData.birthdate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        weight: parseFloat(formData.weight),
        weight_unit: formData.weight_unit,
        notes: formData.notes.trim() || undefined,
      };

      await apiService.createPet(petData);
      
      // Track pet addition event during onboarding
      trackEvent("adding the pet", {
        "Pet Species": formData.species,
        "Pet Gender": formData.gender,
        "Pet Weight Unit": formData.weight_unit,
        "OS": Platform.OS, // "ios" или "android"
        "Pet Name": formData.name,
        "Source": "Onboarding"
      });
      
      navigation.navigate('Success');
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to save pet information. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof PetFormData, value: string | Date | PetGender | WeightUnit) => {
    setFormData((prev: PetFormData) => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors((prev: Partial<PetFormData>) => ({ ...prev, [field]: undefined }));
    }
  };

  const formatDate = (date: Date): string => {
    return date.toLocaleDateString(t('i18n.locale') === 'ru-RU' ? 'ru-RU' : 'en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const onDateConfirm = (selectedDate: Date) => {
    setShowDatePicker(false);
    updateFormData('birthdate', selectedDate);
  };

  const onDateCancel = () => {
    setShowDatePicker(false);
  };

  // Update species when returning from PetSpeciesPicker
  useEffect(() => {
    if (species) {
      updateFormData('species', species);
    }
  }, [species]);

  return (
    <LinearGradient
      colors={Colors.gradient.background as [string, string]}
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
              <Text style={styles.emoji}>{formData.species ? getSpeciesIcon(formData.species) : '🐾'}</Text>
              <Text style={styles.title}>{t('onboarding.tell_about_pet')}</Text>
              <Text style={styles.subtitle}>
                {t('onboarding.personalized_care')}
              </Text>
            </View>

            {/* Pet Form */}
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.formTitle}>{t('onboarding.pet_information')}</Text>
              
              <Input
                label={t('onboarding.pet_name_required')}
                placeholder={t('onboarding.pet_name_placeholder')}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                error={errors.name}
                autoCapitalize="words"
                leftIcon={
                  <Ionicons name="heart-outline" size={20} color={Colors.textSecondary} />
                }
              />

              {/* Species Selection */}
              <View style={styles.speciesContainer}>
                <Text style={styles.inputLabel}>{t('onboarding.species_required')}</Text>
                <TouchableOpacity
                  style={[styles.speciesButton, errors.species && styles.errorInput]}
                  onPress={() => {
                    navigation.navigate('PetSpeciesPicker', {
                      fromScreen: 'AddPet',
                      isOnboarding: true
                    });
                  }}
                >
                  <Ionicons name="paw-outline" size={20} color={Colors.textSecondary} />
                  <Text style={[styles.speciesText, !formData.species && styles.placeholderText]}>
                    {formData.species ? getSpeciesDisplayName(formData.species) : t('onboarding.species_placeholder')}
                  </Text>
                  <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
                {errors.species && (
                  <Text style={styles.errorText}>{errors.species}</Text>
                )}
              </View>

              <GenderPicker
                label={t('onboarding.gender_required')}
                value={formData.gender}
                onValueChange={(gender) => updateFormData('gender', gender)}
                error={errors.gender}
                maleLabel={t('common.male')}
                femaleLabel={t('common.female')}
              />

              <Input
                label={t('onboarding.breed_optional')}
                placeholder={t('onboarding.breed_placeholder')}
                value={formData.breed}
                onChangeText={(text) => updateFormData('breed', text)}
                error={errors.breed}
                autoCapitalize="words"
                leftIcon={
                  <Ionicons name="library-outline" size={20} color={Colors.textSecondary} />
                }
              />

              {/* Birthdate Picker */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('onboarding.birthdate_required')}</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.dateText}>{formatDate(formData.birthdate)}</Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <DateTimePickerModal
                isVisible={showDatePicker}
                mode="date"
                value={formData.birthdate}
                onConfirm={onDateConfirm}
                onCancel={onDateCancel}
                maximumDate={new Date()}
                title="Select Birthdate"
                confirmButtonText="Apply"
              />

              <Input
                label={t('onboarding.weight_required')}
                placeholder={t('onboarding.weight_placeholder')}
                value={formData.weight}
                onChangeText={(text) => updateFormData('weight', text)}
                error={errors.weight}
                keyboardType="decimal-pad"
                leftIcon={
                  <Ionicons name="scale-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <WeightUnitPicker
                label={t('pet_form.weight_unit_label')}
                value={formData.weight_unit}
                onValueChange={(unit) => updateFormData('weight_unit', unit)}
                error={errors.weight_unit}
                kgLabel="kg"
                lbLabel="lb"
              />

              <Input
                label={t('onboarding.notes_optional')}
                placeholder={t('onboarding.notes_placeholder')}
                value={formData.notes}
                onChangeText={(text) => updateFormData('notes', text)}
                error={errors.notes}
                multiline
                numberOfLines={3}
                leftIcon={
                  <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <Button
                title={t('onboarding.save_pet')}
                onPress={handleSavePet}
                loading={isLoading}
                size="large"
                style={styles.saveButton}
              />
            </Card>

            {/* Helper Text */}
            <View style={styles.helperContainer}>
              <Text style={styles.helperText}>
                💡 Don't worry if you don't have all the details now. You can always edit this information later!
              </Text>
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
  emoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
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
    paddingHorizontal: 16,
  },
  formCard: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  inputContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.text,
  },
  speciesContainer: {
    marginBottom: 16,
  },
  speciesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  speciesText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  placeholderText: {
    color: Colors.textLight,
  },
  errorInput: {
    borderColor: Colors.error,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  dateText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  saveButton: {
    marginTop: 8,
  },
  helperContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  helperText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
    fontStyle: 'italic',
  },
}); 