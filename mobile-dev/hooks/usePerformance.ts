import { useCallback, useMemo, useRef, useEffect, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Debounced hook for search and filtering
export const useDebounce = <T>(value: T, delay: number): T => {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

// Optimized AsyncStorage hook with caching
export const useAsyncStorage = <T>(key: string, initialValue: T) => {
  const [storedValue, setStoredValue] = useState<T>(initialValue);
  const [isLoading, setIsLoading] = useState(true);
  const cacheRef = useRef<Map<string, T>>(new Map());

  const setValue = useCallback(async (value: T) => {
    try {
      const valueToStore = value instanceof Function ? value(storedValue) : value;
      setStoredValue(valueToStore);
      cacheRef.current.set(key, valueToStore);
      await AsyncStorage.setItem(key, JSON.stringify(valueToStore));
    } catch (error) {
      console.error('Error setting AsyncStorage value:', error);
    }
  }, [key, storedValue]);

  const getValue = useCallback(async () => {
    try {
      // Check cache first
      if (cacheRef.current.has(key)) {
        const cachedValue = cacheRef.current.get(key)!;
        setStoredValue(cachedValue);
        setIsLoading(false);
        return cachedValue;
      }

      const item = await AsyncStorage.getItem(key);
      if (item !== null) {
        const parsedValue = JSON.parse(item);
        setStoredValue(parsedValue);
        cacheRef.current.set(key, parsedValue);
        setIsLoading(false);
        return parsedValue;
      }
      setIsLoading(false);
      return initialValue;
    } catch (error) {
      console.error('Error reading AsyncStorage value:', error);
      setIsLoading(false);
      return initialValue;
    }
  }, [key, initialValue]);

  useEffect(() => {
    getValue();
  }, [getValue]);

  return { value: storedValue, setValue, isLoading, refresh: getValue };
};

// Optimized list filtering and sorting hook
export const useOptimizedList = <T>(
  items: T[],
  filterFn?: (item: T) => boolean,
  sortFn?: (a: T, b: T) => number
) => {
  return useMemo(() => {
    let result = items;
    
    if (filterFn) {
      result = result.filter(filterFn);
    }
    
    if (sortFn) {
      result = [...result].sort(sortFn);
    }
    
    return result;
  }, [items, filterFn, sortFn]);
};

// Optimized form state hook
export const useOptimizedForm = <T extends Record<string, any>>(initialState: T) => {
  const [formData, setFormData] = useState<T>(initialState);
  const initialRef = useRef(initialState);

  const updateField = useCallback((field: keyof T, value: T[keyof T]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  const updateMultipleFields = useCallback((updates: Partial<T>) => {
    setFormData(prev => ({ ...prev, ...updates }));
  }, []);

  const resetForm = useCallback(() => {
    setFormData(initialRef.current);
  }, []);

  const setForm = useCallback((newData: T) => {
    setFormData(newData);
  }, []);

  return {
    formData,
    updateField,
    updateMultipleFields,
    resetForm,
    setForm,
  };
};

// Optimized modal state hook
export const useOptimizedModal = (initialState = false) => {
  const [isVisible, setIsVisible] = useState(initialState);
  const [modalData, setModalData] = useState<any>(null);

  const openModal = useCallback((data?: any) => {
    setIsVisible(true);
    if (data) setModalData(data);
  }, []);

  const closeModal = useCallback(() => {
    setIsVisible(false);
    setModalData(null);
  }, []);

  return {
    isVisible,
    modalData,
    openModal,
    closeModal,
  };
};

// Optimized date/time picker hook
export const useOptimizedDateTimePicker = () => {
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<Date | null>(null);

  const openDatePicker = useCallback(() => {
    setShowDatePicker(true);
  }, []);

  const openTimePicker = useCallback(() => {
    setShowTimePicker(true);
  }, []);

  const closeDatePicker = useCallback(() => {
    setShowDatePicker(false);
  }, []);

  const closeTimePicker = useCallback(() => {
    setShowTimePicker(false);
  }, []);

  const handleDateChange = useCallback((_: any, date?: Date) => {
    setShowDatePicker(false);
    if (date) {
      setSelectedDate(date);
    }
  }, []);

  const handleTimeChange = useCallback((_: any, time?: Date) => {
    setShowTimePicker(false);
    if (time) {
      setSelectedTime(time);
    }
  }, []);

  return {
    showDatePicker,
    showTimePicker,
    selectedDate,
    selectedTime,
    openDatePicker,
    openTimePicker,
    closeDatePicker,
    closeTimePicker,
    handleDateChange,
    handleTimeChange,
  };
};

// Optimized FlatList performance hook
export const useOptimizedFlatList = <T>(
  data: T[],
  keyExtractor: (item: T, index: number) => string
) => {
  const getItemLayout = useCallback(
    (data: T[] | null, index: number) => ({
      length: 80, // Adjust based on your item height
      offset: 80 * index,
      index,
    }),
    []
  );

  const renderItem = useCallback(
    (item: T, index: number) => ({
      key: keyExtractor(item, index),
      item,
      index,
    }),
    [keyExtractor]
  );

  return {
    getItemLayout,
    renderItem,
    keyExtractor,
    removeClippedSubviews: true,
    maxToRenderPerBatch: 10,
    windowSize: 10,
    initialNumToRender: 10,
    updateCellsBatchingPeriod: 50,
  };
}; 