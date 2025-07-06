import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TouchableWithoutFeedback,
  ScrollView,
  Dimensions,
} from 'react-native';
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

const { height: screenHeight } = Dimensions.get('window');
const ITEM_HEIGHT = 50;
const VISIBLE_ITEMS = 5;

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

  // Date picker state
  const [selectedDay, setSelectedDay] = useState(value.getDate());
  const [selectedMonth, setSelectedMonth] = useState(value.getMonth());
  const [selectedYear, setSelectedYear] = useState(value.getFullYear());

  // Time picker state
  const [selectedHour, setSelectedHour] = useState(value.getHours());
  const [selectedMinute, setSelectedMinute] = useState(value.getMinutes());

  // Reset values when modal opens
  useEffect(() => {
    if (isVisible) {
      const dateValue = new Date(value);
      if (isNaN(dateValue.getTime())) {
        const now = new Date();
        setSelectedDate(now);
        if (mode === 'date') {
          setSelectedDay(now.getDate());
          setSelectedMonth(now.getMonth());
          setSelectedYear(now.getFullYear());
        } else {
          setSelectedHour(now.getHours());
          setSelectedMinute(now.getMinutes());
        }
      } else {
        setSelectedDate(dateValue);
        if (mode === 'date') {
          setSelectedDay(dateValue.getDate());
          setSelectedMonth(dateValue.getMonth());
          setSelectedYear(dateValue.getFullYear());
        } else {
          setSelectedHour(dateValue.getHours());
          setSelectedMinute(dateValue.getMinutes());
        }
      }
    }
  }, [isVisible, value, mode]);

  // Generate arrays for pickers
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'
  ];

  const generateYears = () => {
    const currentYear = new Date().getFullYear();
    const years = [];
    for (let year = currentYear; year >= currentYear - 25; year--) {
      years.push(year);
    }
    return years;
  };

  const generateDays = () => {
    const daysInMonth = new Date(selectedYear, selectedMonth + 1, 0).getDate();
    const days = [];
    for (let day = 1; day <= daysInMonth; day++) {
      days.push(day);
    }
    return days;
  };

  const generateHours = () => {
    const hours = [];
    for (let hour = 0; hour < 24; hour++) {
      hours.push(hour);
    }
    return hours;
  };

  const generateMinutes = () => {
    const minutes = [];
    for (let minute = 0; minute < 60; minute++) {
      minutes.push(minute);
    }
    return minutes;
  };

  const years = generateYears();
  const days = generateDays();
  const hours = generateHours();
  const minutes = generateMinutes();

  const handleConfirm = () => {
    let newDate: Date;
    if (mode === 'date') {
      newDate = new Date(selectedYear, selectedMonth, selectedDay, value.getHours(), value.getMinutes(), value.getSeconds());
    } else {
      // Важно: сохраняем дату из value, но меняем только время
      newDate = new Date(value);
      newDate.setHours(selectedHour);
      newDate.setMinutes(selectedMinute);
      newDate.setSeconds(0);
    }
    onConfirm(newDate);
  };

  const handleCancel = () => {
    // Reset to original values
    if (mode === 'date') {
      setSelectedDay(value.getDate());
      setSelectedMonth(value.getMonth());
      setSelectedYear(value.getFullYear());
    } else {
      setSelectedHour(value.getHours());
      setSelectedMinute(value.getMinutes());
    }
    onCancel();
  };

  const getTitle = () => {
    if (title) return title;
    return mode === 'date' ? 'Select Date' : 'Select Time';
  };

  const getIcon = () => {
    return mode === 'date' ? 'calendar-outline' : 'time-outline';
  };

  const renderPickerColumn = (
    items: (string | number)[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    valueFormatter?: (item: string | number) => string
  ) => {
    const selectedIndex = items.findIndex(item => 
      typeof item === 'number' ? item === selectedValue : items.indexOf(selectedValue) === items.indexOf(item)
    );

    return (
      <View style={styles.pickerColumn}>
        <ScrollView
          showsVerticalScrollIndicator={false}
          snapToInterval={ITEM_HEIGHT}
          decelerationRate="fast"
          contentContainerStyle={{
            paddingVertical: ITEM_HEIGHT * 2,
          }}
          onMomentumScrollEnd={(event) => {
            const index = Math.round(event.nativeEvent.contentOffset.y / ITEM_HEIGHT);
            const clampedIndex = Math.max(0, Math.min(index, items.length - 1));
            const newValue = typeof items[clampedIndex] === 'number' 
              ? items[clampedIndex] as number
              : clampedIndex;
            onValueChange(newValue);
          }}
          contentOffset={{ x: 0, y: selectedIndex * ITEM_HEIGHT }}
        >
          {items.map((item, index) => {
            const isSelected = index === selectedIndex;
            const distance = Math.abs(index - selectedIndex);
            const opacity = Math.max(0.3, 1 - distance * 0.3);
            
            return (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pickerItem,
                  isSelected && styles.selectedPickerItem
                ]}
                onPress={() => {
                  const newValue = typeof item === 'number' ? item : index;
                  onValueChange(newValue);
                }}
              >
                <Text style={[
                  styles.pickerItemText,
                  isSelected && styles.selectedPickerItemText,
                  { opacity }
                ]}>
                  {valueFormatter ? valueFormatter(item) : item}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
        <View style={styles.pickerOverlay}>
          <View style={styles.selectedItemIndicator} />
        </View>
      </View>
    );
  };

  const formatNumber = (item: string | number): string => {
    const num = typeof item === 'number' ? item : parseInt(item.toString());
    return num.toString().padStart(2, '0');
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

              {/* Custom Picker */}
              <View style={styles.pickerContainer}>
                {mode === 'date' ? (
                  <View style={styles.datePickerRow}>
                    {/* Month */}
                    {renderPickerColumn(
                      months,
                      selectedMonth,
                      setSelectedMonth
                    )}
                    
                    {/* Day */}
                    {renderPickerColumn(
                      days,
                      selectedDay,
                      setSelectedDay,
                      formatNumber
                    )}
                    
                    {/* Year */}
                    {renderPickerColumn(
                      years,
                      selectedYear,
                      setSelectedYear
                    )}
                  </View>
                ) : (
                  <View style={styles.timePickerRow}>
                    {/* Hour */}
                    {renderPickerColumn(
                      hours,
                      selectedHour,
                      setSelectedHour,
                      formatNumber
                    )}
                    
                    <Text style={styles.timeSeparator}>:</Text>
                    
                    {/* Minute */}
                    {renderPickerColumn(
                      minutes,
                      selectedMinute,
                      setSelectedMinute,
                      formatNumber
                    )}
                  </View>
                )}
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
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 10,
  },
  header: {
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.borderLight,
    alignItems: 'center',
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    marginLeft: 8,
  },
  pickerContainer: {
    paddingHorizontal: 24,
    paddingVertical: 24,
    height: ITEM_HEIGHT * VISIBLE_ITEMS + 40,
  },
  datePickerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    height: '100%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  timePickerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: '100%',
    backgroundColor: Colors.backgroundLight,
    borderRadius: 16,
    paddingHorizontal: 20,
  },
  pickerColumn: {
    flex: 1,
    height: '100%',
    position: 'relative',
    marginHorizontal: 4,
  },
  pickerItem: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
  },
  selectedPickerItem: {
    backgroundColor: Colors.primaryLight + '30',
  },
  pickerItemText: {
    fontSize: 18,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  selectedPickerItemText: {
    color: Colors.primary,
    fontWeight: '700',
    fontSize: 20,
  },
  pickerOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    pointerEvents: 'none',
  },
  selectedItemIndicator: {
    height: ITEM_HEIGHT,
    marginHorizontal: 8,
    borderRadius: 12,
    backgroundColor: Colors.primary + '15',
    borderWidth: 2,
    borderColor: Colors.primary + '30',
  },
  timeSeparator: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.primary,
    marginHorizontal: 16,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: 24,
    paddingTop: 20,
    gap: 16,
  },
  button: {
    flex: 1,
    paddingVertical: 18,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: Colors.backgroundLight,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  confirmButton: {
    backgroundColor: Colors.primary,
    shadowColor: Colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.white,
  },
}); 