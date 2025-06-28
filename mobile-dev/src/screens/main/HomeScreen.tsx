import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  Alert,
  SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { Pet } from '../../types';
import { PetCard } from '../../components/Card';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';

export const HomeScreen: React.FC = () => {
  const [pets, setPets] = useState<Pet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);

  useEffect(() => {
    loadPets();
  }, []);

  const loadPets = async () => {
    try {
      const petsData = await apiService.getPets();
      setPets(petsData);
    } catch (error) {
      Alert.alert(
        'Error',
        'Failed to load pets. Please try again.',
        [{ text: 'OK' }]
      );
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
      return `${ageInMonths} month${ageInMonths !== 1 ? 's' : ''} old`;
    }
    
    return `${ageInYears} year${ageInYears !== 1 ? 's' : ''} old`;
  };

  const renderPetCard = ({ item: pet }: { item: Pet }) => (
    <PetCard
      onPress={() => {
        // TODO: Navigate to pet detail screen
        Alert.alert('Pet Details', `Navigate to ${pet.name}'s details`);
      }}
    >
      <View style={styles.petCardContent}>
        <View style={styles.petHeader}>
          <View style={styles.petIcon}>
            <Text style={styles.petIconText}>
              {pet.species.toLowerCase().includes('dog') ? '🐕' :
               pet.species.toLowerCase().includes('cat') ? '🐱' :
               pet.species.toLowerCase().includes('bird') ? '🐦' :
               pet.species.toLowerCase().includes('rabbit') ? '🐰' :
               pet.species.toLowerCase().includes('fish') ? '🐟' : '🐾'}
            </Text>
          </View>
          <View style={styles.petInfo}>
            <Text style={styles.petName}>{pet.name}</Text>
            <Text style={styles.petSpecies}>
              {pet.gender} {pet.species}
            </Text>
            {pet.breed && <Text style={styles.petBreed}>{pet.breed}</Text>}
          </View>
        </View>
        
        <View style={styles.petDetails}>
          <View style={styles.detailRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{calculateAge(pet.birthdate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Ionicons name="scale-outline" size={16} color={Colors.textSecondary} />
            <Text style={styles.detailText}>{pet.weight} kg</Text>
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
      <Text style={styles.emptyTitle}>No pets yet</Text>
      <Text style={styles.emptyDescription}>
        Add your first pet to start tracking their activities and health!
      </Text>
      <Button
        title="Add Your First Pet"
        onPress={() => {
          // TODO: Navigate to add pet screen
          Alert.alert('Add Pet', 'Navigate to add pet screen');
        }}
        style={styles.addPetButton}
      />
    </View>
  );

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <Text style={styles.loadingText}>Loading your pets... 🐾</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.welcomeText}>Welcome back! 👋</Text>
        <Text style={styles.subtitle}>
          {pets.length > 0 
            ? `You have ${pets.length} ${pets.length === 1 ? 'pet' : 'pets'} to care for`
            : 'Ready to add your first pet?'
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
            title="+ Add Activity"
            onPress={() => {
              // TODO: Navigate to add activity screen
              Alert.alert('Add Activity', 'Navigate to add activity screen');
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