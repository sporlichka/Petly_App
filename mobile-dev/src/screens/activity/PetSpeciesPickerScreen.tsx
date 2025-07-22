import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Modal,
  TextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { StackNavigationProp } from '@react-navigation/stack';

import { Colors } from '../../constants/Colors';
import { Card } from '../../components/Card';
import { Button } from '../../components/Button';
import { SPECIES_LIST } from '../../utils/speciesUtils';

const SPECIES = SPECIES_LIST;

type PetSpeciesPickerScreenNavigationProp = StackNavigationProp<any, 'PetSpeciesPicker'>;

interface PetSpeciesPickerScreenProps {
  navigation: PetSpeciesPickerScreenNavigationProp;
  route: {
    params: {
      fromScreen?: string;
      isOnboarding?: boolean;
    };
  };
}

export const PetSpeciesPickerScreen: React.FC<PetSpeciesPickerScreenProps> = ({ 
  navigation, 
  route 
}) => {
  const { t, i18n } = useTranslation();
  const { fromScreen, isOnboarding } = route.params || {};
  const [showOtherModal, setShowOtherModal] = useState(false);
  const [otherSpecies, setOtherSpecies] = useState('');

  const getLocalizedLabel = (item: typeof SPECIES[0]) => {
    return i18n.language === 'ru-RU' ? item.ruLabel : item.label;
  };

  const handleSpeciesSelect = (species: string) => {
    if (species === 'Other') {
      setShowOtherModal(true);
    } else {
      const target = isOnboarding ? 'AddPet' : 'AddPet';
      navigation.navigate(target, {
        species,
        allowSpeciesEdit: false,
        fromScreen: 'PetSpeciesPicker',
        isOnboarding
      });
    }
  };

  const handleOtherSpeciesSubmit = () => {
    if (!otherSpecies.trim()) {
      Alert.alert(t('validation.required'), t('pet_form.species_required'));
      return;
    }

    const target = isOnboarding ? 'AddPet' : 'AddPet';
    navigation.navigate(target, {
      species: otherSpecies.trim(),
      allowSpeciesEdit: false,
      fromScreen: 'PetSpeciesPicker',
      isOnboarding
    });

    setShowOtherModal(false);
    setOtherSpecies('');
  };

  const handleBack = () => {
    if (fromScreen) {
      navigation.goBack();
    } else {
      navigation.navigate('Home');
    }
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <Text style={styles.emoji}>🐾</Text>
      <Text style={styles.title}>{t('pet_form.add_title')}</Text>
      <Text style={styles.subtitle}>{t('pet_form.add_subtitle')}</Text>
    </View>
  );

  const renderSpeciesItem = ({ item }: { item: typeof SPECIES[0] }) => (
    <TouchableOpacity
      style={styles.speciesItem}
      onPress={() => handleSpeciesSelect(item.value)}
    >
      <Text style={styles.speciesEmoji}>{item.emoji}</Text>
      <Text style={styles.speciesLabel}>
        {getLocalizedLabel(item)}
      </Text>
    </TouchableOpacity>
  );

  const renderContent = () => (
    <Card variant="elevated" style={styles.card}>
      <FlatList
        data={SPECIES}
        keyExtractor={(item) => item.value}
        numColumns={3}
        renderItem={renderSpeciesItem}
        contentContainerStyle={styles.speciesGrid}
        ListHeaderComponent={renderHeader}
        showsVerticalScrollIndicator={false}
      />
    </Card>
  );

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
          <View style={styles.navigationHeader}>
            <TouchableOpacity style={styles.backButton} onPress={handleBack}>
              <Ionicons name="arrow-back" size={24} color={Colors.text} />
            </TouchableOpacity>
          </View>
          <View style={styles.content}>
            {renderContent()}
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>

      {/* Modal for Other Species */}
      <Modal
        visible={showOtherModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowOtherModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>{t('pet_form.other_species_title')}</Text>
            <Text style={styles.modalSubtitle}>{t('pet_form.other_species_subtitle')}</Text>
            
            <TextInput
              style={styles.speciesInput}
              placeholder={t('pet_form.other_species_placeholder')}
              value={otherSpecies}
              onChangeText={setOtherSpecies}
              autoFocus={true}
              autoCapitalize="words"
              returnKeyType="done"
              onSubmitEditing={handleOtherSpeciesSubmit}
            />

            <View style={styles.modalButtons}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={() => {
                  setShowOtherModal(false);
                  setOtherSpecies('');
                }}
              >
                <Text style={styles.cancelButtonText}>{t('common.cancel')}</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={handleOtherSpeciesSubmit}
              >
                <Text style={styles.confirmButtonText}>{t('common.confirm')}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  navigationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 5,
    marginTop: 25,
  },
  backButton: {
    padding: 4,
  },
  content: {
    flex: 1,
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
  card: {
    flex: 1,
    padding: 20,
  },
  speciesGrid: {
    paddingBottom: 20,
    flexGrow: 1,
  },
  speciesItem: {
    flex: 1,
    alignItems: 'center',
    padding: 16,
    margin: 4,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  speciesEmoji: {
    fontSize: 32,
    marginBottom: 8,
  },
  speciesLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
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
    marginBottom: 20,
  },
  speciesInput: {
    backgroundColor: Colors.background,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: Colors.text,
    marginBottom: 20,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  confirmButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    backgroundColor: Colors.primary,
    alignItems: 'center',
  },
  confirmButtonText: {
    fontSize: 16,
    color: Colors.surface,
    fontWeight: '500',
  },
});
