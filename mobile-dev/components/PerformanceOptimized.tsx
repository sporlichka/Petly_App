import React, { memo, useCallback, useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ViewStyle, TextStyle } from 'react-native';

// Memoized components for better performance
export const MemoizedView = memo<{ children: React.ReactNode; style?: ViewStyle }>(
  ({ children, style }) => <View style={style}>{children}</View>
);

export const MemoizedText = memo<{ children: React.ReactNode; style?: TextStyle }>(
  ({ children, style }) => <Text style={style}>{children}</Text>
);

export const MemoizedTouchableOpacity = memo<
  { children: React.ReactNode; style?: ViewStyle; onPress: () => void }
>(({ children, style, onPress }) => (
  <TouchableOpacity style={style} onPress={onPress}>
    {children}
  </TouchableOpacity>
));

// Performance-optimized FlatList item component
export const OptimizedListItem = memo<{
  id: string;
  title: string;
  subtitle?: string;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  leftIcon?: React.ReactNode;
  rightContent?: React.ReactNode;
}>(({ id, title, subtitle, onPress, onEdit, onDelete, leftIcon, rightContent }) => {
  const handlePress = useCallback(() => {
    onPress();
  }, [onPress]);

  const handleEdit = useCallback(() => {
    onEdit?.();
  }, [onEdit]);

  const handleDelete = useCallback(() => {
    onDelete?.();
  }, [onDelete]);

  return (
    <TouchableOpacity style={styles.listItem} onPress={handlePress}>
      {leftIcon && <View style={styles.leftIcon}>{leftIcon}</View>}
      <View style={styles.content}>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
      </View>
      {rightContent && <View style={styles.rightContent}>{rightContent}</View>}
      {(onEdit || onDelete) && (
        <View style={styles.actions}>
          {onEdit && (
            <TouchableOpacity style={styles.actionButton} onPress={handleEdit}>
              <Text style={styles.editText}>Edit</Text>
            </TouchableOpacity>
          )}
          {onDelete && (
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <Text style={styles.deleteText}>Delete</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
});

// Performance-optimized modal component
export const OptimizedModal = memo<{
  visible: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}>(({ visible, onClose, title, children }) => {
  const handleClose = useCallback(() => {
    onClose();
  }, [onClose]);

  if (!visible) return null;

  return (
    <View style={styles.modalOverlay}>
      <View style={styles.modalContent}>
        <View style={styles.modalHeader}>
          <Text style={styles.modalTitle}>{title}</Text>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <Text style={styles.closeText}>×</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.modalBody}>{children}</View>
      </View>
    </View>
  );
});

// Performance-optimized picker component
export const OptimizedPicker = memo<{
  selectedValue: string;
  onValueChange: (value: string) => void;
  items: Array<{ label: string; value: string }>;
  placeholder?: string;
}>(({ selectedValue, onValueChange, items, placeholder }) => {
  const handleValueChange = useCallback((value: string) => {
    onValueChange(value);
  }, [onValueChange]);

  const pickerItems = useMemo(() => {
    return items.map(item => (
      <Text key={item.value} style={styles.pickerItem}>
        {item.label}
      </Text>
    ));
  }, [items]);

  return (
    <View style={styles.pickerContainer}>
      <Text style={styles.pickerLabel}>
        {items.find(item => item.value === selectedValue)?.label || placeholder}
      </Text>
    </View>
  );
});

const styles = StyleSheet.create({
  listItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#e5e7eb',
  },
  leftIcon: {
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
  },
  subtitle: {
    fontSize: 14,
    color: '#6b7280',
    marginTop: 2,
  },
  rightContent: {
    marginLeft: 12,
  },
  actions: {
    flexDirection: 'row',
    marginLeft: 12,
  },
  actionButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    marginLeft: 8,
    borderRadius: 4,
  },
  editText: {
    color: '#2563eb',
    fontSize: 12,
  },
  deleteText: {
    color: '#dc2626',
    fontSize: 12,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#111827',
  },
  closeButton: {
    padding: 4,
  },
  closeText: {
    fontSize: 24,
    color: '#6b7280',
  },
  modalBody: {
    flex: 1,
  },
  pickerContainer: {
    borderWidth: 1,
    borderColor: '#d1d5db',
    borderRadius: 8,
    padding: 12,
    backgroundColor: '#fff',
  },
  pickerLabel: {
    fontSize: 16,
    color: '#111827',
  },
  pickerItem: {
    fontSize: 16,
    color: '#111827',
    padding: 8,
  },
}); 