import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

import { HomeStackParamList, Pet, ActivityRecord } from '../../types';
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
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActivitiesLoading, setIsActivitiesLoading] = useState(true);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    loadPetDetails();
    loadRecentActivities();
  }, [petId]);

  // Refresh pet details and activities when returning from edit screen or activity wizard
  useFocusEffect(
    React.useCallback(() => {
      loadPetDetails();
      loadRecentActivities();
    }, [petId])
  );

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

  const loadRecentActivities = async () => {
    try {
      setIsActivitiesLoading(true);
      const recentActivities = await apiService.getActivityRecords(petId, undefined, 0, 5);
      setActivities(recentActivities);
    } catch (error) {
      console.error('Failed to load activities:', error);
      // Don't show alert for activities failure, just log it
    } finally {
      setIsActivitiesLoading(false);
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

  const formatActivityDateTime = (dateString: string): string => {
    try {
      // The backend sends datetime strings without timezone info like "2025-06-28T18:34:00"
      // We need to parse this as local time to avoid timezone conversion issues
      
      // Parse the date components manually to ensure local time interpretation
      const dateMatch = dateString.match(/^(\d{4})-(\d{2})-(\d{2})T(\d{2}):(\d{2}):(\d{2})$/);
      if (!dateMatch) {
        console.error('Invalid date format:', dateString);
        return 'Invalid date';
      }
      
      const [, year, month, day, hour, minute, second] = dateMatch;
      
      // Create date as local time (months are 0-indexed in JavaScript)
      const date = new Date(
        parseInt(year),
        parseInt(month) - 1,
        parseInt(day),
        parseInt(hour),
        parseInt(minute),
        parseInt(second)
      );
      
      const now = new Date();
      
      // Check if date is valid
      if (isNaN(date.getTime())) {
        console.error('Invalid parsed date:', dateString);
        return 'Invalid date';
      }
      
      const diffInMs = now.getTime() - date.getTime();
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60));
      const diffInHours = Math.floor(diffInMs / (1000 * 60 * 60));
      
      console.log('Activity date string:', dateString);
      console.log('Parsed date (local):', date.toString());
      console.log('Now:', now.toString());
      console.log('Diff in ms:', diffInMs);
      console.log('Diff in minutes:', diffInMinutes);
      console.log('Diff in hours:', diffInHours);
      
      // Handle negative differences (future dates)
      if (diffInMs < 0) {
        return 'Future';
      }
      
      // Less than 1 minute
      if (diffInMinutes < 1) {
        return 'Just now';
      }
      
      // Less than 60 minutes
      if (diffInMinutes < 60) {
        return `${diffInMinutes} min ago`;
      }
      
      // Less than 24 hours
      if (diffInHours < 24) {
        return `${diffInHours}h ago`;
      }
      
      // Less than 48 hours
      if (diffInHours < 48) {
        return 'Yesterday';
      }
      
      // Older activities
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateString);
      return 'Unknown time';
    }
  };

  const getActivityIcon = (category: string): string => {
    switch (category) {
      case 'FEEDING':
        return '🥣';
      case 'HEALTH':
        return '🩺';
      case 'ACTIVITY':
        return '🎾';
      default:
        return '📝';
    }
  };

  const getActivityColor = (category: string): string => {
    switch (category) {
      case 'FEEDING':
        return Colors.feeding;
      case 'HEALTH':
        return Colors.health;
      case 'ACTIVITY':
        return Colors.activity;
      default:
        return Colors.primary;
    }
  };

  const handleAddActivity = () => {
    navigation.navigate('ActivityWizard', {
      screen: 'SelectType',
      params: { petId: pet!.id }
    });
  };

  const handleEditPet = () => {
    navigation.navigate('EditPet', { petId: pet!.id });
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

  const handleViewAllActivities = () => {
    navigation.navigate('ViewAllActivities', { petId });
  };

  const renderActivityItem = (activity: ActivityRecord) => {
    const activityColor = getActivityColor(activity.category);
    
    return (
      <View key={activity.id} style={styles.activityItem}>
        <View style={[styles.activityIcon, { backgroundColor: activityColor + '20' }]}>
          <Text style={styles.activityEmoji}>{getActivityIcon(activity.category)}</Text>
        </View>
        <View style={styles.activityContent}>
          <Text style={styles.activityTitle}>{activity.title}</Text>
          <Text style={styles.activityTime}>{formatActivityDateTime(activity.date)}</Text>
          
          {/* Show feeding-specific details */}
          {activity.category === 'FEEDING' && (activity.food_type || activity.quantity) && (
            <View style={styles.activityDetails}>
              {activity.food_type && (
                <Text style={styles.activityDetail}>🍽️ {activity.food_type}</Text>
              )}
              {activity.quantity && (
                <Text style={styles.activityDetail}>📏 {activity.quantity}</Text>
              )}
            </View>
          )}
          
          {activity.notes && (
            <Text style={styles.activityNotes} numberOfLines={1}>
              {activity.notes}
            </Text>
          )}
        </View>
        <View style={[styles.activityDot, { backgroundColor: activityColor }]} />
      </View>
    );
  };

  const renderActivitiesSection = () => {
    if (isActivitiesLoading) {
      return (
        <View style={styles.activitiesLoading}>
          <Text style={styles.loadingText}>Loading activities... 📝</Text>
        </View>
      );
    }

    if (activities.length === 0) {
      return (
        <View style={styles.emptyActivities}>
          <Text style={styles.emptyText}>📝</Text>
          <Text style={styles.emptyTitle}>No activities yet</Text>
          <Text style={styles.emptySubtitle}>
            Start tracking {pet?.name}'s daily activities
          </Text>
        </View>
      );
    }

    return (
      <View style={styles.activitiesList}>
        {activities.map(renderActivityItem)}
        {activities.length > 0 && (
          <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAllActivities}>
            <Text style={styles.viewAllText}>
              {activities.length === 1 ? 'View Activity Details' : `View All ${activities.length} Activities`}
            </Text>
            <Ionicons name="chevron-forward" size={16} color={Colors.primary} />
          </TouchableOpacity>
        )}
      </View>
    );
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

        {/* Recent Activities */}
        <Card variant="default" style={styles.activitiesCard}>
          <Text style={styles.sectionTitle}>Recent Activities</Text>
          {renderActivitiesSection()}
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
  activitiesLoading: {
    alignItems: 'center',
    paddingVertical: 20,
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
  activitiesList: {
    gap: 12,
  },
  activityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 4,
  },
  activityIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityEmoji: {
    fontSize: 20,
  },
  activityContent: {
    flex: 1,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  activityTime: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  activityNotes: {
    fontSize: 12,
    color: Colors.textLight,
    fontStyle: 'italic',
  },
  activityDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginLeft: 8,
  },
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    marginTop: 8,
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
    marginRight: 4,
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
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 2,
  },
  activityDetail: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginRight: 4,
  },
}); 