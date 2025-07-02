import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Ionicons } from '@expo/vector-icons';

import { Colors } from '../constants/Colors';

interface DateTimePickerModalProps {
  isVisible: boolean;
  mode: 'date' | 'time';
  value: Date;
  onConfirm: (date: Date) => void;
  onCancel: () => void;
  maximumDate?: Date;
  minimumDate?: Date;
  title?: string;
  confirmButtonText?: string;
}

export const DateTimePickerModal: React.FC<DateTimePickerModalProps> = ({
  isVisible,
  mode,
  value,
  onConfirm,
  onCancel,
  maximumDate,
  minimumDate,
  title,
  confirmButtonText = 'Confirm',
}) => {
  const [selectedDate, setSelectedDate] = useState(value);

  // Reset selectedDate when modal opens
  React.useEffect(() => {
    if (isVisible) {
      if (mode === 'time') {
        // For time mode, ensure we have a valid time value
        const timeValue = new Date(value);
        if (isNaN(timeValue.getTime())) {
          // If invalid date, use current time
          setSelectedDate(new Date());
        } else {
          setSelectedDate(timeValue);
        }
      } else {
        setSelectedDate(value);
      }
    }
  }, [isVisible, value, mode]);

  const handleDateChange = (event: any, date?: Date) => {
    if (date) {
      // For time mode, preserve the date part and only update time
      if (mode === 'time') {
        const updatedDate = new Date(selectedDate);
        updatedDate.setHours(date.getHours());
        updatedDate.setMinutes(date.getMinutes());
        updatedDate.setSeconds(date.getSeconds());
        setSelectedDate(updatedDate);
      } else {
        setSelectedDate(date);
      }
    }
  };

  const handleConfirm = () => {
    onConfirm(selectedDate);
  };

  const handleCancel = () => {
    setSelectedDate(value); // Reset to original value
    onCancel();
  };

  const getTitle = () => {
    if (title) return title;
    return mode === 'date' ? 'Select Date' : 'Select Time';
  };

  const getIcon = () => {
    return mode === 'date' ? 'calendar-outline' : 'time-outline';
  };

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="slide"
      statusBarTranslucent
    >
      <TouchableWithoutFeedback onPress={handleCancel}>
        <View style={styles.overlay}>
          <TouchableWithoutFeedback>
            <View style={styles.modalContainer}>
              {/* Header */}
              <View style={styles.header}>
                <View style={styles.headerContent}>
                  <Ionicons 
                    name={getIcon() as any} 
                    size={24} 
                    color={Colors.primary} 
                  />
                  <Text style={styles.title}>{getTitle()}</Text>
                </View>
              </View>

              {/* Date/Time Picker */}
              <View style={styles.pickerContainer}>
                <DateTimePicker
                  value={selectedDate}
                  mode={mode}
                  display="spinner"
                  onChange={handleDateChange}
                  maximumDate={mode === 'date' ? maximumDate : undefined}
                  minimumDate={mode === 'date' ? minimumDate : undefined}
                  textColor={Colors.text}
                  style={styles.picker}
                  minuteInterval={1}
                  locale="en"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.buttonContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={handleCancel}
                >
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>{confirmButtonText}</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingBottom: 34, // Safe area padding
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginLeft: 8,
  },
  pickerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    alignItems: 'center',
  },
  picker: {
    width: '100%',
    height: 200,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 16,
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.white,
  },
}); 