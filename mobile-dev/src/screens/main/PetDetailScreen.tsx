import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { HomeStackParamList, Pet } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';

type PetDetailScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'PetDetail'>;
type PetDetailScreenRouteProp = RouteProp<HomeStackParamList, 'PetDetail'>;

interface PetDetailScreenProps {
  navigation: PetDetailScreenNavigationProp;
  route: PetDetailScreenRouteProp;
}

export const PetDetailScreen: React.FC<PetDetailScreenProps> = ({
  navigation,
  route,
}) => {
  const { petId } = route.params;
  const [pet, setPet] = useState<Pet | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPetDetails();
  }, [petId]);

  const loadPetDetails = async () => {
    try {
      // For now, get from the pets list since we don't have a single pet endpoint
      const pets = await apiService.getPets();
      const foundPet = pets.find(p => p.id === petId);
      setPet(foundPet || null);
    } catch (error) {
      Alert.alert('Error', 'Failed to load pet details');
      navigation.goBack();
    } finally {
      setIsLoading(false);
    }
  };

  const calculateAge = (birthdate: string): string => {
    const birth = new Date(birthdate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));
    
    if (ageInYears < 1) {
      const ageInMonths = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 30.44));
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
    }
    
    return `${ageInYears} year${ageInYears !== 1 ? 's' : ''} old`;
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const handleAddActivity = () => {
    Alert.alert('Add Activity', 'Navigate to activity creation wizard');
    // TODO: Navigate to activity creation wizard
  };

  const handleEditPet = () => {
    Alert.alert('Edit Pet', 'Navigate to edit pet screen');
    // TODO: Navigate to edit pet screen
  };

  const handleDeletePet = () => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet?.name}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: confirmDeletePet,
        },
      ]
    );
  };

  const confirmDeletePet = async () => {
    if (!pet) return;

    setIsDeleting(true);
    try {
      await apiService.deletePet(pet.id);
      Alert.alert('Success', `${pet.name} has been deleted.`, [
        { text: 'OK', onPress: () => navigation.goBack() }
      ]);
    } catch (error) {
      Alert.alert('Error', 'Failed to delete pet. Please try again.');
    } finally {
      setIsDeleting(false);
    }
  };

  const getPetIcon = (species: string): string => {
    const lowerSpecies = species.toLowerCase();
    if (lowerSpecies.includes('dog')) return '🐕';
    if (lowerSpecies.includes('cat')) return '🐱';
    if (lowerSpecies.includes('bird')) return '🐦';
    if (lowerSpecies.includes('rabbit')) return '🐰';
    if (lowerSpecies.includes('fish')) return '🐟';
    return '🐾';
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>Loading pet details... 🐾</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!pet) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
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
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <ScrollView
        contentContainerStyle={styles.scrollContainer}
        showsVerticalScrollIndicator={false}
      >
        {/* Pet Header */}
        <Card variant="elevated" style={styles.headerCard}>
          <View style={styles.petHeader}>
            <View style={styles.petIconContainer}>
              <Text style={styles.petIcon}>{getPetIcon(pet.species)}</Text>
            </View>
            <View style={styles.petMainInfo}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petSpecies}>
                {pet.gender} {pet.species}
              </Text>
              {pet.breed && (
                <Text style={styles.petBreed}>{pet.breed}</Text>
              )}
              <Text style={styles.petAge}>{calculateAge(pet.birthdate)}</Text>
            </View>
          </View>
        </Card>

        {/* Pet Details */}
        <Card variant="default" style={styles.detailsCard}>
          <Text style={styles.sectionTitle}>Details</Text>
          
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Birthday</Text>
              <Text style={styles.detailValue}>{formatDate(pet.birthdate)}</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Weight</Text>
              <Text style={styles.detailValue}>{pet.weight} kg</Text>
            </View>
          </View>

          <View style={styles.detailRow}>
            <Ionicons name="transgender-outline" size={20} color={Colors.textSecondary} />
            <View style={styles.detailContent}>
              <Text style={styles.detailLabel}>Gender</Text>
              <Text style={styles.detailValue}>{pet.gender}</Text>
            </View>
          </View>

          {pet.notes && (
            <View style={styles.detailRow}>
              <Ionicons name="document-text-outline" size={20} color={Colors.textSecondary} />
              <View style={styles.detailContent}>
                <Text style={styles.detailLabel}>Notes</Text>
                <Text style={styles.detailValue}>{pet.notes}</Text>
              </View>
            </View>
          )}
        </Card>

        {/* Add Activity Button */}
        <Button
          title="➕ Add Activity"
          onPress={handleAddActivity}
          size="large"
          style={styles.addActivityButton}
        />

        {/* Recent Activities Preview */}
        <Card variant="default" style={styles.activitiesCard}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          <View style={styles.emptyActivities}>
            <Text style={styles.emptyText}>📝</Text>
            <Text style={styles.emptyTitle}>No activities yet</Text>
            <Text style={styles.emptySubtitle}>
              Start tracking {pet.name}'s daily activities
            </Text>
          </View>
        </Card>

        {/* Action Buttons */}
        <View style={styles.actionButtons}>
          <Button
            title="✏️ Edit"
            onPress={handleEditPet}
            variant="outline"
            style={styles.actionButton}
          />
          <Button
            title="🗑 Delete"
            onPress={handleDeletePet}
            variant="outline"
            loading={isDeleting}
            style={StyleSheet.flatten([styles.actionButton, styles.deleteButton])}
            textStyle={styles.deleteButtonText}
          />
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
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
  scrollContainer: {
    padding: 24,
  },
  headerCard: {
    marginBottom: 24,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 20,
  },
  petIcon: {
    fontSize: 40,
  },
  petMainInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  petSpecies: {
    fontSize: 18,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 16,
    color: Colors.textLight,
    marginBottom: 4,
  },
  petAge: {
    fontSize: 16,
    color: Colors.primary,
    fontWeight: '500',
  },
  detailsCard: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  detailContent: {
    flex: 1,
    marginLeft: 12,
  },
  detailLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  detailValue: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
  },
  addActivityButton: {
    marginBottom: 24,
  },
  activitiesCard: {
    marginBottom: 24,
  },
  emptyActivities: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyText: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  emptySubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  actionButton: {
    flex: 1,
  },
  deleteButton: {
    borderColor: Colors.error,
  },
  deleteButtonText: {
    color: Colors.error,
  },
}); 