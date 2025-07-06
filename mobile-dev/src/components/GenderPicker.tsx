import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { PetGender } from '../types';
import { Colors } from '../constants/Colors';

interface GenderPickerProps {
  label?: string;
  value: PetGender;
  onValueChange: (gender: PetGender) => void;
  error?: string;
  maleLabel: string;
  femaleLabel: string;
}

export const GenderPicker: React.FC<GenderPickerProps> = ({
  label,
  value,
  onValueChange,
  error,
  maleLabel,
  femaleLabel,
}) => {
  const options: { value: PetGender; label: string; icon: string; emoji: string }[] = [
    { value: 'Male', label: maleLabel, icon: 'male', emoji: '♂️' },
    { value: 'Female', label: femaleLabel, icon: 'female', emoji: '♀️' },
  ];

  return (
    <View style={styles.container}>
      {label && (
        <Text style={[styles.label, { color: error ? Colors.error : Colors.text }]}>
          {label}
        </Text>
      )}
      
      <View style={styles.optionsContainer}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.value}
            style={[
              styles.option,
              value === option.value && styles.selectedOption,
              error && styles.errorOption,
            ]}
            onPress={() => onValueChange(option.value)}
            activeOpacity={0.7}
          >
            <View style={styles.optionContent}>
              <Text style={styles.emoji}>{option.emoji}</Text>
              <Text style={[
                styles.optionText,
                value === option.value && styles.selectedText,
              ]}>
                {option.label}
              </Text>
              <View style={[
                styles.radioCircle,
                value === option.value && styles.selectedRadio,
              ]}>
                {value === option.value && (
                  <Ionicons name="checkmark" size={16} color={Colors.primary} />
                )}
              </View>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 8,
    color: Colors.text,
  },
  optionsContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    backgroundColor: Colors.surface,
    borderWidth: 2,
    borderColor: Colors.border,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
  },
  selectedOption: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  errorOption: {
    borderColor: Colors.error,
  },
  optionContent: {
    alignItems: 'center',
    gap: 8,
  },
  emoji: {
    fontSize: 24,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedText: {
    color: Colors.primary,
    fontWeight: '600',
  },
  radioCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedRadio: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  errorText: {
    fontSize: 12,
    marginTop: 4,
    marginHorizontal: 4,
    color: Colors.error,
  },
}); 