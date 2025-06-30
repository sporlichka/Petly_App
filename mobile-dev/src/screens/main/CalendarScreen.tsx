import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Calendar } from 'react-native-calendars';
import { useFocusEffect } from '@react-navigation/native';

import { Colors } from '../../constants/Colors';
import { ActivityRecord, Pet, ActivityCategory } from '../../types';
import { apiService } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

interface MarkedDates {
  [key: string]: {
    marked: boolean;
    dotColor: string;
  };
}

interface PetSelectorModalProps {
  pets: Pet[];
  onSelectPet: (petId: number) => void;
  onCancel: () => void;
}

const PetSelectorModal: React.FC<PetSelectorModalProps> = ({ pets, onSelectPet, onCancel }) => (
  <View style={styles.modalOverlay}>
    <View style={styles.modalContent}>
      <Text style={styles.modalTitle}>Select a Pet</Text>
      <Text style={styles.modalSubtitle}>Choose which pet to add an activity for</Text>
      
      <ScrollView style={styles.petList}>
        {pets.map((pet) => (
          <TouchableOpacity
            key={pet.id}
            style={styles.petItem}
            onPress={() => onSelectPet(pet.id)}
          >
            <Text style={styles.petEmoji}>🐾</Text>
            <View style={styles.petInfo}>
              <Text style={styles.petName}>{pet.name}</Text>
              <Text style={styles.petDetails}>{pet.species} • {pet.breed}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color={Colors.textSecondary} />
          </TouchableOpacity>
        ))}
      </ScrollView>
      
      <Button
        title="Cancel"
        onPress={onCancel}
        variant="secondary"
        style={styles.cancelButton}
      />
    </View>
  </View>
);

export const CalendarScreen: React.FC = () => {
  const [selectedDate, setSelectedDate] = useState<string>(
    new Date().toISOString().split('T')[0]
  );
  const [activities, setActivities] = useState<ActivityRecord[]>([]);
  const [allActivities, setAllActivities] = useState<ActivityRecord[]>([]);
  const [markedDates, setMarkedDates] = useState<MarkedDates>({});
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [showPetSelector, setShowPetSelector] = useState(false);

  const getCategoryColor = (category: ActivityCategory): string => {
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

  const getCategoryIcon = (category: ActivityCategory): string => {
    switch (category) {
      case 'FEEDING':
        return 'restaurant';
      case 'HEALTH':
        return 'medical';
      case 'ACTIVITY':
        return 'fitness';
      default:
        return 'document-text';
    }
  };

  const loadData = async () => {
    try {
      const [petsResponse] = await Promise.all([
        apiService.getPets(),
      ]);
      setPets(petsResponse);

      // Load activities for all pets
      const allPetActivities: ActivityRecord[] = [];
      for (const pet of petsResponse) {
        try {
          const petActivities = await apiService.getActivityRecords(pet.id);
          allPetActivities.push(...petActivities);
        } catch (error) {
          console.error(`Failed to load activities for pet ${pet.id}:`, error);
        }
      }

      setAllActivities(allPetActivities);
      updateMarkedDates(allPetActivities);
      filterActivitiesByDate(selectedDate, allPetActivities);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert('Error', 'Failed to load calendar data. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const updateMarkedDates = (activityList: ActivityRecord[]) => {
    const marked: MarkedDates = {};
    
    activityList.forEach((activity) => {
      const dateStr = new Date(activity.date).toISOString().split('T')[0];
      marked[dateStr] = {
        marked: true,
        dotColor: getCategoryColor(activity.category),
      };
    });

    // Mark selected date
    marked[selectedDate] = {
      ...marked[selectedDate],
      marked: marked[selectedDate]?.marked || false,
      dotColor: marked[selectedDate]?.dotColor || Colors.primary,
    };

    setMarkedDates(marked);
  };

  const filterActivitiesByDate = (dateStr: string, activityList?: ActivityRecord[]) => {
    const activitiesToFilter = activityList || allActivities;
    const filtered = activitiesToFilter.filter((activity) => {
      const activityDate = new Date(activity.date).toISOString().split('T')[0];
      return activityDate === dateStr;
    });
    
    // Sort by time
    filtered.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
    setActivities(filtered);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadData();
    setRefreshing(false);
  };

  const handleDateSelect = (day: any) => {
    const dateStr = day.dateString;
    setSelectedDate(dateStr);
    filterActivitiesByDate(dateStr);
  };

  const handleAddActivity = () => {
    if (pets.length === 0) {
      Alert.alert('No Pets', 'Please add a pet first before creating activities.');
      return;
    }
    
    if (pets.length === 1) {
      // If only one pet, go directly to activity creation
      navigateToActivityCreation(pets[0].id);
    } else {
      // Show pet selector
      setShowPetSelector(true);
    }
  };

  const navigateToActivityCreation = (petId: number) => {
    // For now, we'll show an alert. In a full implementation, you'd navigate to the activity wizard
    // navigation.navigate('ActivityWizard', { 
    //   screen: 'SelectType', 
    //   params: { petId, preselectedDate: selectedDate } 
    // });
    Alert.alert(
      'Add Activity',
      `This would open the activity creation wizard for pet ID ${petId} with date ${selectedDate}. Implementation needed in navigation.`
    );
  };

  const handleEditActivity = (activity: ActivityRecord) => {
    Alert.alert(
      'Edit Activity',
      `This would open the edit screen for activity: ${activity.title}. Implementation needed.`
    );
  };

  const handleDeleteActivity = (activity: ActivityRecord) => {
    Alert.alert(
      'Delete Activity',
      `Are you sure you want to delete "${activity.title}"?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteActivityRecord(activity.id);
              await loadData(); // Reload data after deletion
              Alert.alert('Success', 'Activity deleted successfully.');
            } catch (error) {
              console.error('Failed to delete activity:', error);
              Alert.alert('Error', 'Failed to delete activity. Please try again.');
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateTime: string): string => {
    return new Date(dateTime).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSelectedDate = (): string => {
    return new Date(selectedDate).toLocaleDateString('en-US', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPetName = (petId: number): string => {
    const pet = pets.find(p => p.id === petId);
    return pet?.name || 'Unknown Pet';
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradient.background as any} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading calendar...</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradient.background as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Calendar */}
          <Card variant="elevated" style={styles.calendarCard}>
            <Calendar
              current={selectedDate}
              onDayPress={handleDateSelect}
              markedDates={{
                ...markedDates,
                [selectedDate]: {
                  ...markedDates[selectedDate],
                  selected: true,
                  selectedColor: Colors.primary,
                },
              }}
              theme={{
                backgroundColor: 'transparent',
                calendarBackground: 'transparent',
                textSectionTitleColor: Colors.text,
                selectedDayBackgroundColor: Colors.primary,
                selectedDayTextColor: '#ffffff',
                todayTextColor: Colors.primary,
                dayTextColor: Colors.text,
                textDisabledColor: Colors.textLight,
                dotColor: Colors.primary,
                selectedDotColor: '#ffffff',
                arrowColor: Colors.primary,
                disabledArrowColor: Colors.textLight,
                monthTextColor: Colors.text,
                indicatorColor: Colors.primary,
                textDayFontWeight: '500',
                textMonthFontWeight: '600',
                textDayHeaderFontWeight: '500',
              }}
            />
          </Card>

          {/* Selected Date Activities */}
          <View style={styles.activitiesSection}>
            <Text style={styles.sectionTitle}>
              {formatSelectedDate()}
            </Text>
            
            {activities.length > 0 ? (
              activities.map((activity) => (
                <Card key={activity.id} variant="default" style={styles.activityCard}>
                  <View style={styles.activityContent}>
                    <View style={styles.activityLeft}>
                      <View 
                        style={[
                          styles.activityIcon, 
                          { backgroundColor: getCategoryColor(activity.category) + '20' }
                        ]}
                      >
                        <Ionicons 
                          name={getCategoryIcon(activity.category) as any} 
                          size={20} 
                          color={getCategoryColor(activity.category)} 
                        />
                      </View>
                      <View style={styles.activityInfo}>
                        <View style={styles.activityHeader}>
                          <Text style={styles.activityTitle}>{activity.title}</Text>
                          <Text style={styles.activityTime}>{formatTime(activity.time)}</Text>
                        </View>
                        <Text style={styles.activityPet}>{getPetName(activity.pet_id)}</Text>
                        {activity.notes && (
                          <Text style={styles.activityNotes}>{activity.notes}</Text>
                        )}
                      </View>
                    </View>
                    
                    <View style={styles.activityActions}>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleEditActivity(activity)}
                      >
                        <Ionicons name="create-outline" size={20} color={Colors.primary} />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.actionButton}
                        onPress={() => handleDeleteActivity(activity)}
                      >
                        <Ionicons name="trash-outline" size={20} color={Colors.error} />
                      </TouchableOpacity>
                    </View>
                  </View>
                </Card>
              ))
            ) : (
              <Card variant="default" style={styles.emptyStateCard}>
                <Text style={styles.emptyEmoji}>🐾</Text>
                <Text style={styles.emptyTitle}>No activities on this date yet</Text>
                <Text style={styles.emptyDescription}>
                  Tap the + button to add your first activity for {formatSelectedDate()}
                </Text>
              </Card>
            )}
          </View>
        </ScrollView>

        {/* Floating Add Button */}
        <TouchableOpacity style={styles.fab} onPress={handleAddActivity}>
          <Ionicons name="add" size={28} color="#ffffff" />
        </TouchableOpacity>

        {/* Pet Selector Modal */}
        {showPetSelector && (
          <PetSelectorModal
            pets={pets}
            onSelectPet={(petId) => {
              setShowPetSelector(false);
              navigateToActivityCreation(petId);
            }}
            onCancel={() => setShowPetSelector(false)}
          />
        )}
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  calendarCard: {
    margin: 16,
    marginBottom: 8,
  },
  activitiesSection: {
    padding: 16,
    paddingBottom: 100, // Space for FAB
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  activityCard: {
    marginBottom: 12,
  },
  activityContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  activityLeft: {
    flexDirection: 'row',
    flex: 1,
  },
  activityIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  activityInfo: {
    flex: 1,
  },
  activityHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  activityTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    flex: 1,
    marginRight: 8,
  },
  activityTime: {
    fontSize: 14,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  activityPet: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
    marginBottom: 4,
  },
  activityNotes: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  activityActions: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  actionButton: {
    padding: 8,
    marginLeft: 4,
  },
  emptyStateCard: {
    alignItems: 'center',
    paddingVertical: 32,
  },
  emptyEmoji: {
    fontSize: 48,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    margin: 24,
    maxHeight: '70%',
    width: '100%',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  modalSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 24,
  },
  petList: {
    maxHeight: 300,
  },
  petItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 12,
    borderRadius: 12,
         backgroundColor: Colors.backgroundLight,
    marginBottom: 8,
  },
  petEmoji: {
    fontSize: 24,
    marginRight: 12,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  petDetails: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  cancelButton: {
    marginTop: 16,
  },
}); 