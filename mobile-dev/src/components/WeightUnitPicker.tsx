import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { Colors } from '../constants/Colors';
import { WeightUnit } from '../types';

interface WeightUnitPickerProps {
  label: string;
  value: WeightUnit;
  onValueChange: (unit: WeightUnit) => void;
  error?: string;
  kgLabel?: string;
  lbLabel?: string;
}

export const WeightUnitPicker: React.FC<WeightUnitPickerProps> = ({
  label,
  value,
  onValueChange,
  error,
  kgLabel = 'kg',
  lbLabel = 'lb',
}) => {
  const { t } = useTranslation();

  return (
    <View style={styles.container}>
      <Text style={styles.label}>{label}</Text>
      
      <View style={styles.pickerContainer}>
        <TouchableOpacity
          style={[
            styles.option,
            value === 'kg' && styles.selectedOption,
            error && styles.errorOption,
          ]}
          onPress={() => onValueChange('kg')}
        >
          <Ionicons 
            name="scale-outline" 
            size={24} 
            color={value === 'kg' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.optionText,
            value === 'kg' && styles.selectedOptionText,
          ]}>
            {kgLabel}
          </Text>
          {value === 'kg' && (
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.option,
            value === 'lb' && styles.selectedOption,
            error && styles.errorOption,
          ]}
          onPress={() => onValueChange('lb')}
        >
          <Ionicons 
            name="scale-outline" 
            size={24} 
            color={value === 'lb' ? Colors.primary : Colors.textSecondary} 
          />
          <Text style={[
            styles.optionText,
            value === 'lb' && styles.selectedOptionText,
          ]}>
            {lbLabel}
          </Text>
          {value === 'lb' && (
            <Ionicons name="checkmark-circle" size={20} color={Colors.primary} />
          )}
        </TouchableOpacity>
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
  pickerContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  option: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 20,
    gap: 8,
  },
  selectedOption: {
    backgroundColor: Colors.primaryLight,
    borderColor: Colors.primary,
  },
  errorOption: {
    borderColor: Colors.error,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.text,
  },
  selectedOptionText: {
    color: Colors.primary,
  },
  errorText: {
    fontSize: 12,
    color: Colors.error,
    marginTop: 4,
  },
}); 