import React, { useCallback, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
  TextInput
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Plus, Calendar, FileText, Edit2, Trash2 } from 'react-native-feather';
import { useAsyncStorage, useOptimizedForm, useOptimizedModal, useOptimizedDateTimePicker } from '../../hooks/usePerformance';
import { MemoizedView, MemoizedText, MemoizedTouchableOpacity } from '../../components/PerformanceOptimized';

export type Pet = {
  id: string;
  name: string;
  species: 'Cat' | 'Dog' | 'Hamster';
  gender: 'Male' | 'Female';
  breed: string;
  dateOfBirth: string;
  weight: number;
  notes: string;
};

const PETS_KEY = 'PETS_KEY';

// Memoized Pet Card Component
const PetCard = React.memo<{
  pet: Pet;
  onEdit: (pet: Pet) => void;
  onDelete: (pet: Pet) => void;
}>(({ pet, onEdit, onDelete }) => {
  const handleEdit = useCallback(() => {
    onEdit(pet);
  }, [onEdit, pet]);

  const handleDelete = useCallback(() => {
    onDelete(pet);
  }, [onDelete, pet]);

  const age = useMemo(() => {
    if (!pet.dateOfBirth) return '';
    const today = new Date();
    const birthDate = new Date(pet.dateOfBirth);
    let calculatedAge = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) calculatedAge--;
    return calculatedAge;
  }, [pet.dateOfBirth]);

  return (
    <MemoizedView style={styles.cardWrapper}>
      <MemoizedView style={styles.cardHeader}>
        <MemoizedText style={styles.initial}>{pet.name.charAt(0).toUpperCase()}</MemoizedText>
        <MemoizedView style={styles.headerActions}>
          <MemoizedTouchableOpacity onPress={handleEdit} style={styles.iconButton}>
            <Edit2 width={16} height={16} stroke="#000" />
          </MemoizedTouchableOpacity>
          <MemoizedTouchableOpacity onPress={handleDelete} style={styles.iconButtonRed}>
            <Trash2 width={16} height={16} stroke="#dc2626" />
          </MemoizedTouchableOpacity>
        </MemoizedView>
      </MemoizedView>
      <MemoizedView style={styles.cardBody}>
        <MemoizedText style={styles.petName}>{pet.name}</MemoizedText>
        <MemoizedView style={styles.infoRow}>
          <MemoizedText style={styles.infoLabel}>Species:</MemoizedText>
          <MemoizedText style={styles.infoValue}>{pet.species}</MemoizedText>
        </MemoizedView>
        <MemoizedView style={styles.infoRow}>
          <MemoizedText style={styles.infoLabel}>Breed:</MemoizedText>
          <MemoizedText style={styles.infoValue}>{pet.breed || 'Not specified'}</MemoizedText>
        </MemoizedView>
        <MemoizedView style={styles.infoRow}>
          <MemoizedText style={styles.infoLabel}>Age:</MemoizedText>
          <Calendar width={16} height={16} stroke="#6b7280" />
          <MemoizedText style={styles.infoValue}>{age} years old</MemoizedText>
        </MemoizedView>
        <MemoizedView style={styles.infoRow}>
          <MemoizedText style={styles.infoLabel}>Weight:</MemoizedText>
          <MemoizedText style={styles.infoValue}>{pet.weight}kg</MemoizedText>
        </MemoizedView>
        {pet.notes ? (
          <MemoizedView style={styles.infoRow}>
            <FileText width={16} height={16} stroke="#6b7280" />
            <MemoizedText style={styles.notes}>{pet.notes}</MemoizedText>
          </MemoizedView>
        ) : null}
      </MemoizedView>
    </MemoizedView>
  );
});

// Memoized Empty State Component
const EmptyState = React.memo<{
  onAddPet: () => void;
}>(({ onAddPet }) => (
  <MemoizedView style={styles.emptyContainer}>
    <MemoizedView style={styles.emptyIcon}>
      <Plus width={40} height={40} stroke="#d97706" />
    </MemoizedView>
    <MemoizedText style={styles.emptyTitle}>No pets yet</MemoizedText>
    <MemoizedText style={styles.emptyText}>Add your first pet to get started</MemoizedText>
    <MemoizedTouchableOpacity style={styles.addButton} onPress={onAddPet}>
      <MemoizedText style={styles.addButtonText}>Add Your First Pet</MemoizedText>
    </MemoizedTouchableOpacity>
  </MemoizedView>
));

// Memoized Form Modal Component
const PetFormModal = React.memo<{
  visible: boolean;
  onClose: () => void;
  onSubmit: () => void;
  formData: any;
  onFormChange: (field: string, value: any) => void;
  showDatePicker: boolean;
  onDateChange: (event: any, date?: Date) => void;
  editingPet: Pet | null;
}>(({ visible, onClose, onSubmit, formData, onFormChange, showDatePicker, onDateChange, editingPet }) => {
  const handleSubmit = useCallback(() => {
    onSubmit();
  }, [onSubmit]);

  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  return (
    <Modal visible={visible} animationType="slide" transparent>
      <MemoizedView style={styles.modalOverlay}>
        <MemoizedView style={styles.modalBox}>
          <MemoizedText style={styles.modalTitle}>
            {editingPet ? 'Edit Pet' : 'Add New Pet'}
          </MemoizedText>
          
          <ScrollView style={styles.formContainer}>
            <MemoizedText style={styles.label}>Name *</MemoizedText>
            <TextInput
              value={formData.name}
              onChangeText={(value) => onFormChange('name', value)}
              style={styles.input}
              placeholder="Enter pet's name"
            />

            <MemoizedText style={styles.label}>Species</MemoizedText>
            <MemoizedView style={styles.pickerWrapper}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => onFormChange('species', 'Cat')}
              >
                <MemoizedText style={[
                  styles.pickerOption,
                  formData.species === 'Cat' && styles.pickerOptionSelected
                ]}>Cat</MemoizedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => onFormChange('species', 'Dog')}
              >
                <MemoizedText style={[
                  styles.pickerOption,
                  formData.species === 'Dog' && styles.pickerOptionSelected
                ]}>Dog</MemoizedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => onFormChange('species', 'Hamster')}
              >
                <MemoizedText style={[
                  styles.pickerOption,
                  formData.species === 'Hamster' && styles.pickerOptionSelected
                ]}>Hamster</MemoizedText>
              </TouchableOpacity>
            </MemoizedView>

            <MemoizedText style={styles.label}>Gender</MemoizedText>
            <MemoizedView style={styles.pickerWrapper}>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => onFormChange('gender', 'Male')}
              >
                <MemoizedText style={[
                  styles.pickerOption,
                  formData.gender === 'Male' && styles.pickerOptionSelected
                ]}>Male</MemoizedText>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.pickerButton}
                onPress={() => onFormChange('gender', 'Female')}
              >
                <MemoizedText style={[
                  styles.pickerOption,
                  formData.gender === 'Female' && styles.pickerOptionSelected
                ]}>Female</MemoizedText>
              </TouchableOpacity>
            </MemoizedView>

            <MemoizedText style={styles.label}>Breed</MemoizedText>
            <TextInput
              value={formData.breed}
              onChangeText={(value) => onFormChange('breed', value)}
              style={styles.input}
              placeholder="Enter breed"
            />

            <MemoizedText style={styles.label}>Date of Birth *</MemoizedText>
            <TouchableOpacity
              style={styles.input}
              onPress={() => onFormChange('showDatePicker', true)}
            >
              <MemoizedText style={{ color: '#111' }}>
                {formData.dateOfBirth || 'Select date'}
              </MemoizedText>
            </TouchableOpacity>

            {showDatePicker && (
              <DateTimePicker
                value={formData.dateOfBirth ? new Date(formData.dateOfBirth) : new Date()}
                mode="date"
                display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                onChange={onDateChange}
              />
            )}

            <MemoizedText style={styles.label}>Weight (kg)</MemoizedText>
            <TextInput
              value={formData.weight}
              onChangeText={(value) => onFormChange('weight', value)}
              style={styles.input}
              placeholder="Enter weight"
              keyboardType="numeric"
            />

            <MemoizedText style={styles.label}>Notes</MemoizedText>
            <TextInput
              value={formData.notes}
              onChangeText={(value) => onFormChange('notes', value)}
              style={[styles.input, styles.textArea]}
              placeholder="Add any notes about your pet"
              multiline
              numberOfLines={3}
            />
          </ScrollView>

          <MemoizedView style={styles.modalActions}>
            <MemoizedTouchableOpacity style={styles.cancelButton} onPress={handleClose}>
              <MemoizedText style={styles.cancelButtonText}>Cancel</MemoizedText>
            </MemoizedTouchableOpacity>
            <MemoizedTouchableOpacity style={styles.saveButton} onPress={handleSubmit}>
              <MemoizedText style={styles.saveButtonText}>Save</MemoizedText>
            </MemoizedTouchableOpacity>
          </MemoizedView>
        </MemoizedView>
      </MemoizedView>
    </Modal>
  );
});

export default function HomeScreen() {
  const { value: pets, setValue: setPets } = useAsyncStorage<Pet[]>(PETS_KEY, []);
  const { isVisible: showForm, openModal, closeModal } = useOptimizedModal();
  const { formData, updateField, resetForm, setForm } = useOptimizedForm({
    name: '',
    species: 'Cat' as Pet['species'],
    gender: 'Male' as Pet['gender'],
    breed: '',
    dateOfBirth: '',
    weight: '',
    notes: ''
  });
  const { showDatePicker, openDatePicker, closeDatePicker, handleDateChange } = useOptimizedDateTimePicker();
  const [editingPet, setEditingPet] = React.useState<Pet | null>(null);

  const handleFormChange = useCallback((field: string, value: any) => {
    if (field === 'showDatePicker') {
      if (value) {
        openDatePicker();
      } else {
        closeDatePicker();
      }
    } else {
      updateField(field as keyof typeof formData, value);
    }
  }, [updateField, openDatePicker, closeDatePicker]);

  const handleSubmit = useCallback(() => {
    if (!formData.name || !formData.dateOfBirth) {
      Alert.alert('Validation', 'Name and Date of Birth are required.');
      return;
    }
    
    const petData: Pet = {
      ...formData,
      weight: parseFloat(formData.weight) || 0,
      id: editingPet ? editingPet.id : Date.now().toString()
    };
    
    if (editingPet) {
      setPets(pets.map(p => p.id === editingPet.id ? petData : p));
      setEditingPet(null);
    } else {
      setPets([...pets, petData]);
    }
    
    resetForm();
    closeModal();
  }, [formData, editingPet, pets, setPets, resetForm, closeModal]);

  const handleEdit = useCallback((pet: Pet) => {
    setEditingPet(pet);
    setForm({
      name: pet.name,
      species: pet.species,
      gender: pet.gender,
      breed: pet.breed,
      dateOfBirth: pet.dateOfBirth,
      weight: pet.weight.toString(),
      notes: pet.notes
    });
    openModal();
  }, [setForm, openModal]);

  const handleDelete = useCallback((pet: Pet) => {
    Alert.alert(
      'Delete Pet',
      `Are you sure you want to delete ${pet.name}? This will also delete all related records.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive', 
          onPress: () => setPets(pets.filter(p => p.id !== pet.id)) 
        }
      ]
    );
  }, [pets, setPets]);

  const handleCancel = useCallback(() => {
    closeModal();
    setEditingPet(null);
    resetForm();
  }, [closeModal, resetForm]);

  const handleAddPet = useCallback(() => {
    setEditingPet(null);
    resetForm();
    openModal();
  }, [resetForm, openModal]);

  const handleDatePickerChange = useCallback((_: any, selected?: Date) => {
    closeDatePicker();
    if (selected) {
      updateField('dateOfBirth', selected.toISOString().split('T')[0]);
    }
  }, [closeDatePicker, updateField]);

  const renderPetCard = useCallback(({ item }: { item: Pet }) => (
    <PetCard
      pet={item}
      onEdit={handleEdit}
      onDelete={handleDelete}
    />
  ), [handleEdit, handleDelete]);

  const keyExtractor = useCallback((item: Pet) => item.id, []);

  const flatListProps = useMemo(() => ({
    data: pets,
    keyExtractor,
    renderItem: renderPetCard,
    contentContainerStyle: styles.cardsGrid,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 10,
    updateCellsBatchingPeriod: 50,
  }), [pets, keyExtractor, renderPetCard]);

  return (
    <MemoizedView style={styles.container}>
      <MemoizedView style={styles.header}>
        <MemoizedText style={styles.headerTitle}>Pets</MemoizedText>
        <MemoizedText style={styles.headerSubtitle}>Manage your beloved companions</MemoizedText>
      </MemoizedView>
      
      {pets.length === 0 ? (
        <EmptyState onAddPet={handleAddPet} />
      ) : (
        <FlatList {...flatListProps} />
      )}
      
      {pets.length > 0 && (
        <MemoizedTouchableOpacity style={styles.fab} onPress={handleAddPet}>
          <Plus width={24} height={24} stroke="#fff" />
        </MemoizedTouchableOpacity>
      )}

      <PetFormModal
        visible={showForm}
        onClose={handleCancel}
        onSubmit={handleSubmit}
        formData={formData}
        onFormChange={handleFormChange}
        showDatePicker={showDatePicker}
        onDateChange={handleDatePickerChange}
        editingPet={editingPet}
      />
    </MemoizedView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#fff', padding: 16 },
  header: { marginBottom: 24 },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 4 },
  headerSubtitle: { fontSize: 16, color: '#6b7280' },
  emptyContainer: { alignItems: 'center', marginTop: 80 },
  emptyIcon: { backgroundColor: '#fde68a', width: 80, height: 80, borderRadius: 40, alignItems: 'center', justifyContent: 'center', marginBottom: 16 },
  emptyTitle: { fontSize: 20, fontWeight: '600', color: '#000', marginBottom: 4 },
  emptyText: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  addButton: { backgroundColor: '#facc15', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 12 },
  addButtonText: { color: '#000', fontWeight: '600', fontSize: 16 },
  cardsGrid: { paddingBottom: 100 },
  cardWrapper: { backgroundColor: '#fff', borderRadius: 16, overflow: 'hidden', marginBottom: 16, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 8, elevation: 4 },
  cardHeader: { backgroundColor: '#fde047', height: 96, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  initial: { fontSize: 36, fontWeight: 'bold', color: '#000' },
  headerActions: { position: 'absolute', top: 12, right: 12, flexDirection: 'row', opacity: 1 },
  iconButton: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8, marginLeft: 8 },
  iconButtonRed: { backgroundColor: 'rgba(255,255,255,0.9)', padding: 8, borderRadius: 8, marginLeft: 8 },
  cardBody: { padding: 16 },
  petName: { fontSize: 20, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  infoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 6 },
  infoLabel: { width: 80, fontSize: 14, fontWeight: '500', color: '#374151' },
  infoValue: { fontSize: 14, color: '#374151' },
  notes: { fontSize: 12, color: '#6b7280', marginLeft: 6 },
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#facc15', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center', padding: 16 },
  modalBox: { width: '100%', maxWidth: 400, maxHeight: '90%', backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 22, fontWeight: 'bold', color: '#000', marginBottom: 12 },
  formContainer: { marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '500', color: '#000', marginBottom: 4 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8, fontSize: 16, backgroundColor: '#f9fafb' },
  pickerWrapper: { flexDirection: 'row', marginBottom: 12 },
  pickerButton: { flex: 1, paddingVertical: 8, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginHorizontal: 4, backgroundColor: '#f3f4f6' },
  pickerOption: { fontSize: 14, color: '#374151' },
  pickerOptionSelected: { color: '#000', fontWeight: '600' },
  modalActions: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 16 },
  cancelButton: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginRight: 8, backgroundColor: '#f3f4f6' },
  cancelButtonText: { fontSize: 14, color: '#374151' },
  saveButton: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#facc15', borderRadius: 8, marginLeft: 8 },
  saveButtonText: { fontSize: 14, color: '#fff', fontWeight: '600' },
  textArea: { height: 60 }
});
