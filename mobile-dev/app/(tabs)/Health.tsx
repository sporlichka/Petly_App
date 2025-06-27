import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, Modal, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Picker } from '@react-native-picker/picker';
import { Heart, Calendar, Repeat, Edit2, Trash2, Plus } from 'react-native-feather';
import { useFocusEffect } from '@react-navigation/native';
import DateTimePicker from '@react-native-community/datetimepicker';

type Pet = { id: string; name: string };
type HealthRecord = {
  id: string;
  petId: string;
  type: 'Vaccination' | 'Medication' | 'Vet Visit';
  title: string;
  date: string;
  time: string;
  repeat: 'none' | 'daily' | 'weekly' | 'monthly';
  notes: string;
};

const PETS_KEY = 'PETS_KEY';
const HEALTH_KEY = 'HEALTH_KEY';

export default function HealthScreen() {
  const [pets, setPets] = useState<Pet[]>([]);
  const [selectedPetId, setSelectedPetId] = useState('');
  const [records, setRecords] = useState<HealthRecord[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<HealthRecord | null>(null);
  const [form, setForm] = useState<Omit<HealthRecord, 'id' | 'petId'>>({
    type: 'Vaccination',
    title: '',
    date: '',
    time: '',
    repeat: 'none',
    notes: ''
  });
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);

  useFocusEffect(React.useCallback(() => {
    const load = async () => {
      const petsRaw = await AsyncStorage.getItem(PETS_KEY);
      const recRaw = await AsyncStorage.getItem(HEALTH_KEY);
      const petsParsed = petsRaw ? JSON.parse(petsRaw) : [];
      const recParsed = recRaw ? JSON.parse(recRaw) : [];

      setPets(petsParsed);
      setRecords(recParsed);
      if (petsParsed.length && !selectedPetId) setSelectedPetId(petsParsed[0].id);
    };
    load();
  }, []));

  useEffect(() => {
    AsyncStorage.setItem(HEALTH_KEY, JSON.stringify(records));
  }, [records]);

  const handleEdit = (r: HealthRecord) => {
    setEditing(r);
    setForm({
      type: r.type,
      title: r.title,
      date: r.date,
      time: r.time,
      repeat: r.repeat,
      notes: r.notes
    });
    setShowForm(true);
  };

  const handleDelete = (id: string) => {
    Alert.alert('Delete', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => setRecords(r => r.filter(x => x.id !== id)) }
    ]);
  };

  const handleSave = () => {
    if (!form.title || !form.date || !form.time || !selectedPetId) return;
    if (editing) {
      setRecords(r =>
        r.map(x => x.id === editing.id ? { ...editing, ...form } : x)
      );
    } else {
      const newRecord: HealthRecord = {
        id: Date.now().toString(),
        petId: selectedPetId,
        ...form
      };
      setRecords(r => [newRecord, ...r]);
    }
    setForm({
      type: 'Vaccination',
      title: '',
      date: '',
      time: '',
      repeat: 'none',
      notes: ''
    });
    setEditing(null);
    setShowForm(false);
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'Vaccination': return <Heart width={16} height={16} stroke="#059669" />;
      case 'Medication': return <Heart width={16} height={16} stroke="#2563eb" />;
      case 'Vet Visit': return <Heart width={16} height={16} stroke="#7c3aed" />;
      default: return null;
    }
  };

  const getColorBox = (type: string) => {
    switch (type) {
      case 'Vaccination': return { backgroundColor: '#d1fae5' };
      case 'Medication': return { backgroundColor: '#dbeafe' };
      case 'Vet Visit': return { backgroundColor: '#ede9fe' };
      default: return {};
    }
  };

  const filtered = records
    .filter(r => r.petId === selectedPetId)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <View style={styles.wrapper}>
      <ScrollView contentContainerStyle={styles.container}>
        <Text style={styles.title}>Health</Text>
        <Text style={styles.subtitle}>Track your pet's health records</Text>

        {pets.length === 0 && (
          <View style={styles.emptyBox}>
            <Heart width={48} height={48} stroke="#9ca3af" />
            <Text style={styles.emptyTitle}>No pets yet</Text>
            <Text style={styles.emptyText}>Add a pet first to track health records</Text>
          </View>
        )}

        {pets.length > 0 && (
          <>
            <Text style={styles.label}>Select Pet</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={selectedPetId}
                onValueChange={v => setSelectedPetId(v)}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                {pets.map(pet => (
                  <Picker.Item key={pet.id} label={pet.name} value={pet.id} />
                ))}
              </Picker>
            </View>

            <Text style={styles.sectionTitle}>Health Records</Text>
            <Text style={styles.sectionSub}>
              All health records for {pets.find(p => p.id === selectedPetId)?.name}
            </Text>

            {filtered.length === 0 ? (
              <View style={{ marginTop: 24, alignItems: 'center' }}>
                <Heart width={32} height={32} stroke="#9ca3af" />
                <Text style={{ color: '#6b7280', marginTop: 4 }}>No health records yet</Text>
              </View>
            ) : (
              filtered.map(r => (
                <View key={r.id} style={styles.recordCard}>
                  <View style={[styles.typeIconBox, getColorBox(r.type)]}>
                    {getTypeIcon(r.type)}
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.recordTitle}>{r.title}</Text>
                    <Text style={styles.recordType}>{r.type}</Text>
                    <View style={styles.recordInfoRow}>
                      <Calendar width={14} height={14} stroke="#6b7280" />
                      <Text style={styles.recordInfoText}>
                        {new Date(r.date).toLocaleDateString()} at {r.time}
                      </Text>
                    </View>
                    {r.repeat !== 'none' && (
                      <View style={styles.recordInfoRow}>
                        <Repeat width={14} height={14} stroke="#6b7280" />
                        <Text style={styles.recordInfoText}>{r.repeat}</Text>
                      </View>
                    )}
                    {r.notes && (
                      <Text style={styles.notes}>{r.notes}</Text>
                    )}
                  </View>
                  <View style={styles.actions}>
                    <TouchableOpacity onPress={() => handleEdit(r)} style={styles.iconBtn}>
                      <Edit2 width={14} height={14} stroke="#000" />
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => handleDelete(r.id)} style={styles.iconBtn}>
                      <Trash2 width={14} height={14} stroke="#dc2626" />
                    </TouchableOpacity>
                  </View>
                </View>
              ))
            )}
          </>
        )}
      </ScrollView>

      {pets.length > 0 && (
        <TouchableOpacity
          style={styles.fab}
          onPress={() => {
            setEditing(null);
            setForm({
              type: 'Vaccination',
              title: '',
              date: '',
              time: '',
              repeat: 'none',
              notes: ''
            });
            setShowForm(true);
          }}
        >
          <Plus width={24} height={24} stroke="#000" />
        </TouchableOpacity>
      )}

      {/* Add/Edit Modal */}
      <Modal visible={showForm} animationType="slide" transparent>
        <View style={styles.modalOverlay}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{editing ? 'Edit Health Record' : 'Add Health Record'}</Text>
            <Text style={styles.label}>Type</Text>
            <Text style={{ color: '#111', marginBottom: 4 }}>{form.type}</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.type}
                onValueChange={v => setForm(prev => ({ ...prev, type: v as any }))}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="Vaccination" value="Vaccination" />
                <Picker.Item label="Medication" value="Medication" />
                <Picker.Item label="Vet Visit" value="Vet Visit" />
              </Picker>
            </View>
            <Text style={styles.label}>Title</Text>
            <TextInput
              value={form.title}
              onChangeText={v => setForm(prev => ({ ...prev, title: v }))}
              style={styles.input}
              placeholder="e.g. Rabies shot"
            />
            <Text style={styles.label}>Date</Text>
            <TouchableOpacity onPress={() => setShowDatePicker(true)} style={styles.input}>
              <Text style={{ color: '#111' }}>{form.date || 'Select date'}</Text>
            </TouchableOpacity>
            {showDatePicker && (
              <DateTimePicker
                value={form.date ? new Date(form.date) : new Date()}
                mode="date"
                display="spinner"
                onChange={(_, selected) => {
                  setShowDatePicker(false);
                  if (selected) {
                    setForm(prev => ({ ...prev, date: selected.toISOString().split('T')[0] }));
                  }
                }}
                textColor="#111"
              />
            )}
            <Text style={styles.label}>Time</Text>
            <TouchableOpacity onPress={() => setShowTimePicker(true)} style={styles.input}>
              <Text style={{ color: '#111' }}>{form.time || 'Select time'}</Text>
            </TouchableOpacity>
            {showTimePicker && (
              <DateTimePicker
                value={form.time ? new Date(`1970-01-01T${form.time}:00`) : new Date()}
                mode="time"
                display="spinner"
                onChange={(_, selected) => {
                  setShowTimePicker(false);
                  if (selected) {
                    const h = selected.getHours().toString().padStart(2, '0');
                    const m = selected.getMinutes().toString().padStart(2, '0');
                    setForm(prev => ({ ...prev, time: `${h}:${m}` }));
                  }
                }}
                textColor="#111"
              />
            )}
            <Text style={styles.label}>Repeat</Text>
            <Text style={{ color: '#111', marginBottom: 4 }}>{form.repeat}</Text>
            <View style={styles.pickerWrapper}>
              <Picker
                selectedValue={form.repeat}
                onValueChange={v => setForm(prev => ({ ...prev, repeat: v as any }))}
                style={styles.picker}
                itemStyle={styles.pickerItem}
              >
                <Picker.Item label="No repeat" value="none" />
                <Picker.Item label="Daily" value="daily" />
                <Picker.Item label="Weekly" value="weekly" />
                <Picker.Item label="Monthly" value="monthly" />
              </Picker>
            </View>
            <Text style={styles.label}>Notes</Text>
            <TextInput
              value={form.notes}
              onChangeText={v => setForm(prev => ({ ...prev, notes: v }))}
              style={[styles.input, { height: 60 }]}
              multiline
              placeholder="Additional notes, instructions, or observations..."
            />
            <View style={{ flexDirection: 'row', marginTop: 16 }}>
              <TouchableOpacity style={styles.cancelBtn} onPress={() => setShowForm(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={{ color: '#fff' }}>{editing ? 'Update Record' : 'Add Record'}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  container: { padding: 16 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 16 },
  emptyBox: { alignItems: 'center', marginTop: 80 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 16 },
  emptyText: { color: '#6b7280', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '500', color: '#000', marginBottom: 4, marginTop: 8 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 24 },
  sectionSub: { fontSize: 13, color: '#6b7280', marginBottom: 12 },
  pickerWrapper: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, backgroundColor: '#f9fafb' },
  picker: {
    height: 59,
    color: '#111',
    backgroundColor: '#fff'
  },
  pickerItem: {
    color: '#111',
    fontSize: 14
  },
  recordCard: { flexDirection: 'row', padding: 12, backgroundColor: '#f9fafb', borderRadius: 12, marginBottom: 12 },
  typeIconBox: { marginRight: 12, padding: 6, borderRadius: 8 },
  recordTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  recordType: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  recordInfoRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 2, gap: 4 },
  recordInfoText: { fontSize: 13, color: '#4b5563', marginLeft: 4 },
  notes: { fontSize: 12, color: '#6b7280', marginTop: 4 },
  actions: { justifyContent: 'space-between', alignItems: 'center', marginLeft: 8 },
  iconBtn: { padding: 4 },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalBox: { width: '90%', backgroundColor: '#fff', borderRadius: 16, padding: 16 },
  modalTitle: { fontSize: 20, fontWeight: 'bold', marginBottom: 12 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 8, backgroundColor: '#f9fafb', marginBottom: 8 },
  cancelBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, marginRight: 8, backgroundColor: '#f3f4f6' },
  saveBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', backgroundColor: '#facc15', borderRadius: 8 },
  fab: { position: 'absolute', bottom: 32, right: 24, backgroundColor: '#facc15', width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 6, elevation: 6 }
});
