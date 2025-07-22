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
import { RouteProp } from '@react-navigation/native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { HomeStackParamList, PetUpdate, PetFormData, PetGender, Pet, WeightUnit } from '../../types';
import { useSpeciesUtils } from '../../utils/speciesUtils';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { GenderPicker } from '../../components/GenderPicker';
import { WeightUnitPicker } from '../../components/WeightUnitPicker';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';

type EditPetScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'EditPet'>;
type EditPetScreenRouteProp = RouteProp<HomeStackParamList, 'EditPet'>;

interface EditPetScreenProps {
  navigation: EditPetScreenNavigationProp;
  route: EditPetScreenRouteProp;
}

export const EditPetScreen: React.FC<EditPetScreenProps> = ({ navigation, route }) => {
  const { t, i18n } = useTranslation();
  const { getSpeciesDisplayName, getSpeciesIcon } = useSpeciesUtils();
  const { petId } = route.params;
  
  const [pet, setPet] = useState<Pet | null>(null);
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: '',
    breed: '',
    gender: 'Male',
    birthdate: new Date(),
    weight: '',
    weight_unit: 'kg',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<PetFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingPet, setIsLoadingPet] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadPetDetails();
  }, [petId]);

  React.useEffect(() => {
    if (pet) {
      navigation.setOptions({
        title: t('pet_form.edit_title', { name: pet.name }),
      });
    }
  }, [navigation, t, pet]);



  const loadPetDetails = async () => {
    try {
      setIsLoadingPet(true);
      const pets = await apiService.getPets();
      const currentPet = pets.find(p => p.id === petId);
      
      if (currentPet) {
        setPet(currentPet);
        // Pre-populate form with existing pet data
        setFormData({
          name: currentPet.name,
          species: currentPet.species || '',
          breed: currentPet.breed || '',
          gender: (currentPet.gender as PetGender) || 'Male',
          birthdate: currentPet.birthdate ? new Date(currentPet.birthdate) : new Date(),
          weight: currentPet.weight?.toString() || '',
          weight_unit: currentPet.weight_unit || 'kg',
          notes: currentPet.notes || '',
        });
      } else {
        Alert.alert(t('pet_form.error'), t('pet_form.pet_not_found'), [
          { text: t('common.ok'), onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to load pet details:', error);
      Alert.alert(t('pet_form.error'), t('pet_form.error_edit'), [
        { text: t('common.ok'), onPress: () => navigation.goBack() }
      ]);
    } finally {
      setIsLoadingPet(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PetFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = t('pet_form.name_label') + ' ' + t('validation.required');
    }

    if (!formData.species.trim()) {
      newErrors.species = t('pet_form.species_label') + ' ' + t('validation.required');
    }

    if (!formData.weight || isNaN(parseFloat(formData.weight))) {
      newErrors.weight = t('validation.weight_positive');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleUpdatePet = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      const petData: PetUpdate = {
        name: formData.name.trim(),
        species: formData.species.trim(),
        breed: formData.breed.trim() || undefined,
        gender: formData.gender,
        birthdate: formData.birthdate.toISOString().split('T')[0], // Convert to YYYY-MM-DD format
        weight: parseFloat(formData.weight),
        weight_unit: formData.weight_unit,
        notes: formData.notes.trim() || undefined,
      };

      await apiService.updatePet(petId, petData);
      
      // Show success message and navigate back to pet detail
      Alert.alert(
        t('pet_form.success_edit'),
        t('pet_form.success_edit_message', { name: formData.name }),
        [
          {
            text: t('common.ok'),
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        t('pet_form.error'),
        error instanceof Error ? error.message : t('pet_form.error_edit'),
        [{ text: t('common.ok') }]
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
    return date.toLocaleDateString(i18n.language, {
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

  if (isLoadingPet) {
    return (
      <LinearGradient
        colors={Colors.gradient.background as any}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('pet_form.loading_details')}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  if (!pet) {
    return (
      <LinearGradient
        colors={Colors.gradient.background as any}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorTitle}>{t('pet_form.pet_not_found')}</Text>
            <Text style={styles.errorText}>{t('pet_form.pet_deleted')}</Text>
            <Button
              title={t('pet_form.go_back')}
              onPress={() => navigation.goBack()}
              style={styles.goBackButton}
            />
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
              <Text style={styles.emoji}>{getSpeciesIcon(formData.species)}</Text>
              <Text style={styles.title}>{t('pet_form.edit_title', { name: pet.name })}</Text>
              <Text style={styles.subtitle}>{t('pet_form.edit_subtitle')}</Text>
            </View>

            {/* Pet Form */}
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.formTitle}>{t('pet_form.form_title')}</Text>
              
              <Input
                label={t('pet_form.name_label')}
                placeholder={t('pet_form.name_placeholder')}
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                error={errors.name}
                autoCapitalize="words"
                leftIcon={
                  <Ionicons name="heart-outline" size={20} color={Colors.textSecondary} />
                }
              />

              {/* Species Display (Read-only) */}
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>{t('pet_form.species_label')}</Text>
                <View style={styles.disabledInput}>
                  <Ionicons name="paw-outline" size={20} color={Colors.textLight} />
                  <Text style={styles.disabledText}>{getSpeciesDisplayName(formData.species)}</Text>
                  <Ionicons name="lock-closed" size={16} color={Colors.textLight} />
                </View>
                <Text style={styles.disabledHint}>
                  {t('pet_form.species_cannot_edit')}
                </Text>
              </View>

              <GenderPicker
                label={t('pet_form.gender_label')}
                value={formData.gender}
                onValueChange={(gender) => updateFormData('gender', gender)}
                error={errors.gender}
                maleLabel={t('pet_form.male')}
                femaleLabel={t('pet_form.female')}
              />

              <Input
                label={t('pet_form.breed_label')}
                placeholder={t('pet_form.breed_placeholder')}
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
                <Text style={styles.inputLabel}>{t('pet_form.birthdate_label')}</Text>
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
                title={t('pet_form.birthdate_edit_picker_title')}
                confirmButtonText={t('pet_form.birthdate_apply')}
              />

              <Input
                label={t('pet_form.weight_label')}
                placeholder={t('pet_form.weight_placeholder')}
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
                label={t('pet_form.notes_label')}
                placeholder={t('pet_form.notes_placeholder')}
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
                title={t('pet_form.edit_button')}
                onPress={handleUpdatePet}
                loading={isLoading}
                size="large"
                style={styles.saveButton}
              />
            </Card>

            {/* Helper Text */}
            <View style={styles.helperContainer}>
              <Text style={styles.helperText}>{t('pet_form.helper_edit')}</Text>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  errorText: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
  },
  goBackButton: {
    paddingHorizontal: 32,
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
  disabledInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.borderLight,
    borderRadius: 12,
    paddingHorizontal: 16,
    minHeight: 48,
  },
  disabledText: {
    flex: 1,
    fontSize: 16,
    color: Colors.textLight,
    marginLeft: 12,
  },
  disabledHint: {
    fontSize: 12,
    color: Colors.textLight,
    marginTop: 4,
    fontStyle: 'italic',
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