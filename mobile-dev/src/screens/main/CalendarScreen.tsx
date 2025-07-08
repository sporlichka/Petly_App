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
import { Calendar, LocaleConfig } from 'react-native-calendars';
import { useFocusEffect, CommonActions } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp, CompositeNavigationProp } from '@react-navigation/native';
import { useTranslation } from 'react-i18next';

import { Colors } from '../../constants/Colors';
import { ActivityRecord, Pet, ActivityCategory, MainTabParamList, HomeStackParamList } from '../../types';
import { apiService } from '../../services/api';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';

type CalendarNavigationProp = CompositeNavigationProp<
  StackNavigationProp<MainTabParamList, 'Calendar'>,
  StackNavigationProp<HomeStackParamList>
>;

interface CalendarScreenProps {
  navigation: CalendarNavigationProp;
}

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

const PetSelectorModal: React.FC<PetSelectorModalProps> = ({ pets, onSelectPet, onCancel }) => {
  const { t } = useTranslation();
  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <Text style={styles.modalTitle}>{t('calendar.select_pet')}</Text>
        <Text style={styles.modalSubtitle}>{t('calendar.choose_pet')}</Text>
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
          title={t('calendar.cancel')}
          onPress={onCancel}
          variant="secondary"
          style={styles.cancelButton}
        />
      </View>
    </View>
  );
};

export const CalendarScreen: React.FC<CalendarScreenProps> = ({ navigation }) => {
  const { t, i18n } = useTranslation();
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

  // --- LocaleConfig for calendar localization ---
  React.useEffect(() => {
    LocaleConfig.locales['en'] = {
      monthNames: [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December'
      ],
      monthNamesShort: [
        'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
        'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
      ],
      dayNames: [
        'Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'
      ],
      dayNamesShort: [
        'Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'
      ],
      today: 'Today'
    };
    LocaleConfig.locales['ru'] = {
      monthNames: [
        'Январь', 'Февраль', 'Март', 'Апрель', 'Май', 'Июнь',
        'Июль', 'Август', 'Сентябрь', 'Октябрь', 'Ноябрь', 'Декабрь'
      ],
      monthNamesShort: [
        'Янв', 'Фев', 'Мар', 'Апр', 'Май', 'Июн',
        'Июл', 'Авг', 'Сен', 'Окт', 'Ноя', 'Дек'
      ],
      dayNames: [
        'Воскресенье', 'Понедельник', 'Вторник', 'Среда', 'Четверг', 'Пятница', 'Суббота'
      ],
      dayNamesShort: [
        'Вс', 'Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб'
      ],
      today: 'Сегодня'
    };
    LocaleConfig.defaultLocale = i18n.language.startsWith('ru') ? 'ru' : 'en';
  }, [i18n.language]);

  const getCategoryColor = (category: ActivityCategory): string => {
    switch (category) {
      case 'FEEDING':
        return Colors.feeding;
      case 'CARE':
        return Colors.care;
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
      case 'CARE':
        return '🦴';
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

      // Load activities for the current month (more efficient than loading all)
      await loadActivitiesForMonth(selectedDate);
      
      // Load activities for the currently selected date
      await loadActivitiesForDate(selectedDate);
    } catch (error) {
      console.error('Failed to load data:', error);
      Alert.alert(t('calendar.error'), t('calendar.failed_to_load'));
    } finally {
      setLoading(false);
    }
  };

  const loadActivitiesForDate = async (dateStr: string) => {
    try {
      // Use the new optimized API call for specific date
      const dateActivities = await apiService.getActivityRecordsByDate(dateStr);
      
      // Sort by time
      dateActivities.sort((a, b) => new Date(a.time).getTime() - new Date(b.time).getTime());
      setActivities(dateActivities);
    } catch (error) {
      console.error('Failed to load activities for date:', error);

      
      // Show user-friendly error message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      if (errorMessage.includes('authentication') || errorMessage.includes('401')) {
        Alert.alert(t('calendar.authentication_error'), t('calendar.please_log_in'));
      } else if (!errorMessage.includes('Network')) {
        // Only show alert for non-network errors to avoid spam
        Alert.alert(
          t('calendar.loading_error'),
          t('calendar.unable_to_load_activities'),
          [{ text: t('common.ok') }]
        );
      }
      
      // Fallback to client-side filtering if API call fails
      filterActivitiesByDate(dateStr);
    }
  };

  const loadActivitiesForMonth = async (dateStr: string) => {
    try {
      // Calculate start and end of month
      const date = new Date(dateStr);
      const startOfMonth = new Date(date.getFullYear(), date.getMonth(), 1);
      const endOfMonth = new Date(date.getFullYear(), date.getMonth() + 1, 0);
      
      const startDateStr = startOfMonth.toISOString().split('T')[0];
      const endDateStr = endOfMonth.toISOString().split('T')[0];
      
      // Use the new optimized API call for date range
      const monthActivities = await apiService.getActivityRecordsByDateRange(startDateStr, endDateStr);
      
      // Update calendar dots
      updateMarkedDates(monthActivities);
      
      // Store activities for client-side fallback
      setAllActivities(monthActivities);
    } catch (error) {
      console.error('Failed to load activities for month:', error);
      try {
        // Fallback to loading all activities
        const allActivities = await apiService.getAllUserActivityRecords();
        setAllActivities(allActivities);
        updateMarkedDates(allActivities);
      } catch (fallbackError) {
        console.error('Fallback also failed:', fallbackError);
        // If both fail, show error but don't crash
        Alert.alert(
          t('calendar.connection_error'),
          t('calendar.unable_to_load_calendar'),
          [{ text: t('common.ok') }]
        );
      }
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
    // Use the optimized API call for better performance
    loadActivitiesForDate(dateStr);
  };

  const handleMonthChange = (month: any) => {
    // Load activities for the new month when user navigates
    const monthDateStr = `${month.year}-${String(month.month).padStart(2, '0')}-01`;
    loadActivitiesForMonth(monthDateStr);
  };

  const handleAddActivity = () => {
    if (pets.length === 0) {
      Alert.alert(t('calendar.no_pets'), t('calendar.please_add_pet'));
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
    // Use CommonActions for nested navigation across tabs
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: {
          screen: 'ActivityWizard',
          params: {
            screen: 'SelectType',
            params: { 
              petId, 
              preselectedDate: selectedDate 
            }
          }
        }
      })
    );
  };

  const handleEditActivity = (activity: ActivityRecord) => {
    // Use CommonActions for nested navigation across tabs for editing
    navigation.dispatch(
      CommonActions.navigate({
        name: 'Home',
        params: {
          screen: 'ActivityWizard',
          params: {
            screen: 'SelectType',
            params: { 
              petId: activity.pet_id,
              editActivity: activity,
              preselectedDate: selectedDate,
              fromScreen: 'Calendar'
            }
          }
        }
      })
    );
  };

  const handleDeleteActivity = (activity: ActivityRecord) => {
    Alert.alert(
      t('calendar.delete_activity'),
      t('calendar.delete_activity_confirm', { title: activity.title }),
      [
        { text: t('calendar.cancel'), style: 'cancel' },
        {
          text: t('calendar.delete_activity'),
          style: 'destructive',
          onPress: async () => {
            try {
              await apiService.deleteActivityRecord(activity.id);
              await loadData(); // Reload data after deletion
              Alert.alert(t('calendar.success'), t('calendar.activity_deleted'));
            } catch (error) {
              console.error('Failed to delete activity:', error);
              Alert.alert(t('calendar.error'), t('calendar.failed_to_delete'));
            }
          },
        },
      ]
    );
  };

  const formatTime = (dateTime: string): string => {
    return new Date(dateTime).toLocaleTimeString(i18n.language, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatSelectedDate = (): string => {
    return new Date(selectedDate).toLocaleDateString(i18n.language, {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    });
  };

  const getPetName = (petId: number): string => {
    const pet = pets.find(p => p.id === petId);
    return pet?.name || 'Unknown Pet';
  };

  const renderActivityDetails = (activity: ActivityRecord): React.ReactNode => {
    const details = [];
    
    // Show feeding-specific details
    if (activity.category === 'FEEDING') {
      if (activity.food_type) {
        details.push(`🍽️ ${activity.food_type}`);
      }
      if (activity.quantity) {
        details.push(`📏 ${activity.quantity}`);
      }
    }
    
    // Show activity-specific details
    if (activity.category === 'ACTIVITY') {
      if (activity.duration) {
        details.push(`⏱️ ${activity.duration}`);
      }
    }
    
    // Show care-specific details (without temperature and weight)
    if (activity.category === 'CARE') {
      // Only show notes for care records, temperature and weight will be removed
    }
    
    if (details.length > 0) {
      return (
        <View style={styles.activityDetails}>
          {details.map((detail, index) => (
            <Text key={index} style={styles.activityDetail}>
              {detail}
            </Text>
          ))}
        </View>
      );
    }
    
    return null;
  };

  useFocusEffect(
    useCallback(() => {
      loadData();
    }, [])
  );

  if (loading) {
    return (
      <LinearGradient colors={Colors.gradient.background as any} style={styles.container}>
        <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>{t('calendar.loading_calendar')}</Text>
          </View>
        </SafeAreaView>
      </LinearGradient>
    );
  }

  return (
    <LinearGradient colors={Colors.gradient.background as any} style={styles.container}>
      <SafeAreaView style={styles.safeArea} edges={['top','bottom']}>
        <ScrollView
          style={styles.scrollView}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        >
          {/* Calendar */}
          <Card variant="elevated" style={styles.calendarCard}>
            <Calendar
              current={selectedDate}
              onDayPress={handleDateSelect}
              onMonthChange={handleMonthChange}
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
                        {renderActivityDetails(activity)}
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
                <Text style={styles.emptyTitle}>{t('calendar.no_activities')}</Text>
                <Text style={styles.emptyDescription}>
                  {t('calendar.tap_to_add', { date: formatSelectedDate() })}
                </Text>
              </Card>
            )}
          </View>
        </ScrollView>

        {/* Floating Add Button */}
        <View style={styles.fab}>
          <Button
            title={t('calendar.add_record')}
            onPress={handleAddActivity}
            variant="secondary"
            size="small"
          />
        </View>

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
  activityDetails: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  activityDetail: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginRight: 4,
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
  activityNotes: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 4,
  },
}); 

