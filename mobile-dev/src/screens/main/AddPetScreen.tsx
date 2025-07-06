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

import { HomeStackParamList, PetCreate, PetFormData, PetGender } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { GenderPicker } from '../../components/GenderPicker';
import { DateTimePickerModal } from '../../components/DateTimePickerModal';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';

type AddPetScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'AddPet'>;

interface AddPetScreenProps {
  navigation: AddPetScreenNavigationProp;
}

export const AddPetScreen: React.FC<AddPetScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<PetFormData>({
    name: '',
    species: '',
    breed: '',
    gender: 'Male',
    birthdate: new Date(),
    weight: '',
    notes: '',
  });
  const [errors, setErrors] = useState<Partial<PetFormData>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const getPetEmoji = (species: string) => {
    const s = species.trim().toLowerCase();
    if (['dog', 'собака'].includes(s)) return '🐕';
    if (['cat', 'кошка', 'кот'].includes(s)) return '🐱';
    if (['bird', 'птица'].includes(s)) return '🐦';
    if (['rabbit', 'кролик'].includes(s)) return '🐰';
    if (['fish', 'рыба'].includes(s)) return '🐟';
    return '🐾';
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
        notes: formData.notes.trim() || undefined,
      };

      await apiService.createPet(petData);
      
      // Show success message and navigate back to pet list
      Alert.alert(
        t('pet_form.success_add'),
        t('pet_form.success_add_message', { name: formData.name }),
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
        error instanceof Error ? error.message : t('pet_form.error_add'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof PetFormData, value: string | Date | PetGender) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
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

  useEffect(() => {
    navigation.setOptions({
      title: t('pet_form.add_title'),
    });
  }, [navigation, t]);

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
              <Text style={styles.emoji}>{getPetEmoji(formData.species)}</Text>
              <Text style={styles.title}>{t('pet_form.add_title')}</Text>
              <Text style={styles.subtitle}>{t('pet_form.add_subtitle')}</Text>
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

              <Input
                label={t('pet_form.species_label')}
                placeholder={t('pet_form.species_placeholder')}
                value={formData.species}
                onChangeText={(text) => updateFormData('species', text)}
                error={errors.species}
                autoCapitalize="words"
                leftIcon={
                  <Ionicons name="paw-outline" size={20} color={Colors.textSecondary} />
                }
              />

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
                title={t('pet_form.birthdate_picker_title')}
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
                title={t('pet_form.add_button')}
                onPress={handleSavePet}
                loading={isLoading}
                size="large"
                style={styles.saveButton}
              />
            </Card>

            {/* Helper Text */}
            <View style={styles.helperContainer}>
              <Text style={styles.helperText}>{t('pet_form.helper_add')}</Text>
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