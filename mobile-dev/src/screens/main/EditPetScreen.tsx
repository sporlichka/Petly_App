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
import DateTimePicker from '@react-native-community/datetimepicker';

import { HomeStackParamList, PetUpdate, PetFormData, PetGender, Pet } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { GenderPicker } from '../../components/GenderPicker';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';

type EditPetScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'EditPet'>;
type EditPetScreenRouteProp = RouteProp<HomeStackParamList, 'EditPet'>;

interface EditPetScreenProps {
  navigation: EditPetScreenNavigationProp;
  route: EditPetScreenRouteProp;
}

export const EditPetScreen: React.FC<EditPetScreenProps> = ({ navigation, route }) => {
  const { petId } = route.params;
  
  const [pet, setPet] = useState<Pet | null>(null);
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
  const [isLoadingPet, setIsLoadingPet] = useState(true);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useEffect(() => {
    loadPetDetails();
  }, [petId]);

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
          species: currentPet.species,
          breed: currentPet.breed || '',
          gender: currentPet.gender,
          birthdate: new Date(currentPet.birthdate),
          weight: currentPet.weight.toString(),
          notes: currentPet.notes || '',
        });
      } else {
        Alert.alert('Error', 'Pet not found', [
          { text: 'OK', onPress: () => navigation.goBack() }
        ]);
      }
    } catch (error) {
      console.error('Failed to load pet details:', error);
      Alert.alert('Error', 'Failed to load pet details', [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } finally {
      setIsLoadingPet(false);
    }
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PetFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Pet name is required';
    }

    if (!formData.species.trim()) {
      newErrors.species = 'Species is required';
    }

    if (!formData.weight || isNaN(parseFloat(formData.weight))) {
      newErrors.weight = 'Please enter a valid weight';
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
        notes: formData.notes.trim() || undefined,
      };

      await apiService.updatePet(petId, petData);
      
      // Show success message and navigate back to pet detail
      Alert.alert(
        'Success! 🎉',
        `${formData.name}'s information has been updated!`,
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            }
          }
        ]
      );
    } catch (error) {
      Alert.alert(
        'Error',
        error instanceof Error ? error.message : 'Failed to update pet information. Please try again.',
        [{ text: 'OK' }]
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
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const onDateChange = (event: any, selectedDate?: Date) => {
    setShowDatePicker(false);
    if (selectedDate) {
      updateFormData('birthdate', selectedDate);
    }
  };

  if (isLoadingPet) {
    return (
      <LinearGradient
        colors={Colors.gradient.background as any}
        style={styles.container}
      >
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading pet details... 🐾</Text>
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
            <Text style={styles.errorTitle}>Pet not found</Text>
            <Text style={styles.errorText}>This pet may have been deleted.</Text>
            <Button
              title="Go Back"
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
              <Text style={styles.emoji}>✏️</Text>
              <Text style={styles.title}>Edit {pet.name}</Text>
              <Text style={styles.subtitle}>
                Update your pet's information
              </Text>
            </View>

            {/* Pet Form */}
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.formTitle}>Pet Information</Text>
              
              <Input
                label="Pet Name *"
                placeholder="What's your pet's name?"
                value={formData.name}
                onChangeText={(text) => updateFormData('name', text)}
                error={errors.name}
                autoCapitalize="words"
                leftIcon={
                  <Ionicons name="heart-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <Input
                label="Species *"
                placeholder="e.g., Dog, Cat, Rabbit, Bird..."
                value={formData.species}
                onChangeText={(text) => updateFormData('species', text)}
                error={errors.species}
                autoCapitalize="words"
                leftIcon={
                  <Ionicons name="paw-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <GenderPicker
                label="Gender *"
                value={formData.gender}
                onValueChange={(gender) => updateFormData('gender', gender)}
                error={errors.gender}
              />

              <Input
                label="Breed (Optional)"
                placeholder="e.g., Golden Retriever, Persian..."
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
                <Text style={styles.inputLabel}>Birthdate *</Text>
                <TouchableOpacity
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
                  <Text style={styles.dateText}>{formatDate(formData.birthdate)}</Text>
                  <Ionicons name="chevron-down" size={20} color={Colors.textSecondary} />
                </TouchableOpacity>
              </View>

              {showDatePicker && (
                <DateTimePicker
                  value={formData.birthdate}
                  mode="date"
                  display="default"
                  onChange={onDateChange}
                  maximumDate={new Date()}
                />
              )}

              <Input
                label="Weight (kg) *"
                placeholder="Enter weight in kilograms"
                value={formData.weight}
                onChangeText={(text) => updateFormData('weight', text)}
                error={errors.weight}
                keyboardType="decimal-pad"
                leftIcon={
                  <Ionicons name="scale-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <Input
                label="Notes (Optional)"
                placeholder="Any special notes about your pet..."
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
                title="Update Pet"
                onPress={handleUpdatePet}
                loading={isLoading}
                size="large"
                style={styles.saveButton}
              />
            </Card>

            {/* Helper Text */}
            <View style={styles.helperContainer}>
              <Text style={styles.helperText}>
                💡 Changes will be saved immediately and reflected across all screens.
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