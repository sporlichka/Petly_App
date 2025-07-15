import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Pet, HomeStackParamList } from '../../types';
import { PetCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';
import { useSpeciesUtils } from '../../utils/speciesUtils';

type HomeScreenNavigationProp = StackNavigationProp<HomeStackParamList, 'PetList'>;

interface HomeScreenProps {
  navigation: HomeScreenNavigationProp;
}

export const HomeScreen: React.FC<HomeScreenProps> = ({ navigation }) => {
  const { t } = useTranslation();
  const { getSpeciesDisplayName, getSpeciesIcon } = useSpeciesUtils();
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  // Refresh pets when screen comes into focus (e.g., returning from AddPet screen)
  useFocusEffect(
    React.useCallback(() => {
      loadPets();
    }, [])
  );

  const loadPets = async () => {
    try {
      console.log('🏠 Loading pets...');
      const petsData = await apiService.getPets();
      console.log(`🏠 Successfully loaded ${petsData.length} pets`);
      setPets(petsData);
    } catch (error) {
      console.error('🏠 Failed to load pets:', error);
      
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      
      if (errorMessage.includes('Authentication expired')) {
        Alert.alert(
          t('home.session_expired'),
          t('home.session_expired_message'),
          [{ text: t('common.ok') }]
        );
      } else if (errorMessage.includes('Network error')) {
        Alert.alert(
          t('home.connection_error'),
          t('home.connection_error_message'),
          [
            { text: t('home.cancel') },
            { text: t('home.retry'), onPress: () => loadPets() }
          ]
        );
      } else {
        Alert.alert(
          t('home.load_pets_error'),
          t('home.load_pets_error_message'),
          [
            { text: t('home.cancel') },
            { text: t('home.retry'), onPress: () => loadPets() }
          ]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await loadPets();
    setIsRefreshing(false);
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const calculateAge = (birthdate: string): string => {
    const birth = new Date(birthdate);
    const today = new Date();
    const ageInMs = today.getTime() - birth.getTime();
    const ageInYears = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 365.25));
    
    if (ageInYears < 1) {
      const ageInMonths = Math.floor(ageInMs / (1000 * 60 * 60 * 24 * 30.44));
      return t('pets.age_months', { count: ageInMonths });
    }
    
    return t('pets.age_years', { count: ageInYears });
  };

  const renderPetCard = ({ item: pet }: { item: Pet }) => (
    <PetCard
      onPress={() => {
        navigation.navigate('PetDetail', { petId: pet.id });
      }}
    >
      <View style={styles.petCardContent}>
        <View style={styles.petHeader}>
          <View style={styles.petIcon}>
            <Text style={styles.petIconText}>
              {getSpeciesIcon(pet.species || '')}
            </Text>
          </View>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petSpecies}>
              {pet.gender ? t(`pets.${pet.gender.toLowerCase()}`) : ''} {getSpeciesDisplayName(pet.species || '')}
            </Text>
            {pet.breed && <Text style={styles.petBreed}>{pet.breed}</Text>}
          </View>
        </View>
        
        <View style={styles.petDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{pet.birthdate ? calculateAge(pet.birthdate) : ''}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{pet.weight ? t('pets.weight_kg', { weight: pet.weight }) : ''}</Text>
          </View>
        </View>

        {pet.notes && (
          <Text style={styles.petNotes} numberOfLines={2}>
            {pet.notes}
          </Text>
        )}
      </View>
    </PetCard>
  );

  const renderEmptyState = () => (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🐾</Text>
      <Text style={styles.emptyTitle}>{t('home.no_pets')}</Text>
      <Text style={styles.emptyDescription}>
        {t('home.add_first_pet')}
      </Text>
      <Button
        title={t('home.add_first_pet_button')}
        onPress={() => {
          navigation.navigate('PetSpeciesPicker', {
            fromScreen: 'Home',
            isOnboarding: false
          });
        }}
        style={styles.addPetButton}
      />
    </View>
  );

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loadingContainer} edges={['top','bottom']}>
        <Text style={styles.loadingText}>{t('home.loading_pets')}</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top','bottom']}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>{t('home.welcome_back')}</Text>
        <Text style={styles.subtitle}>
          {pets.length > 0 
            ? t('home.pets_to_care_for', { count: pets.length })
            : t('home.ready_to_add_pet')
          }
        </Text>
      </View>

      <FlatList
        data={pets}
        renderItem={renderPetCard}
        keyExtractor={(item) => item.id.toString()}
        contentContainerStyle={styles.listContainer}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[Colors.primary]}
            tintColor={Colors.primary}
          />
        }
        ListEmptyComponent={renderEmptyState}
      />

      {pets.length > 0 && (
        <View style={styles.fab}>
          <Button
            title={t('home.add_pet')}
            onPress={() => {
              navigation.navigate('PetSpeciesPicker', {
                fromScreen: 'Home',
                isOnboarding: false
              });
            }}
            variant="secondary"
            size="small"
          />
        </View>
      )}
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
    backgroundColor: Colors.background,
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    padding: 24,
    paddingBottom: 16,
  },
  welcomeText: {
    fontSize: 24,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  listContainer: {
    padding: 24,
    paddingTop: 8,
  },
  petCardContent: {
    gap: 12,
  },
  petHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  petIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  petIconText: {
    fontSize: 24,
  },
  petInfo: {
    flex: 1,
  },
  petName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 2,
  },
  petSpecies: {
    fontSize: 16,
    color: Colors.textSecondary,
    marginBottom: 2,
  },
  petBreed: {
    fontSize: 14,
    color: Colors.textLight,
  },
  petDetails: {
    flexDirection: 'row',
    gap: 16,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  detailText: {
    fontSize: 14,
    color: Colors.textSecondary,
  },
  petNotes: {
    fontSize: 14,
    color: Colors.textLight,
    fontStyle: 'italic',
    lineHeight: 20,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
  },
  emptyTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyDescription: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  addPetButton: {
    paddingHorizontal: 32,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
  },
}); 