import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  Alert,
} from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';

import { Button } from './Button';
import { Card } from './Card';
import { Colors } from '../constants/Colors';
import { ExtensionModalData, extensionModalService } from '../services/extensionModalService';

interface ExtensionModalProps {
  visible: boolean;
  data: ExtensionModalData | null;
  onExtend: (data: ExtensionModalData) => Promise<void>;
  onDismiss: (data: ExtensionModalData) => Promise<void>;
  onClose: () => void;
}

export const ExtensionModal: React.FC<ExtensionModalProps> = ({
  visible,
  data,
  onExtend,
  onDismiss,
  onClose,
}) => {
  const [isLoading, setIsLoading] = useState(false);

  if (!data) return null;

  const getCategoryInfo = () => {
    switch (data.category) {
      case 'FEEDING':
        return { emoji: '🥣', color: Colors.feeding, title: 'Feeding' };
      case 'CARE':
        return { emoji: '🦴', color: Colors.care, title: 'Care' };
      case 'ACTIVITY':
        return { emoji: '🎾', color: Colors.activity, title: 'Activity' };
      default:
        return { emoji: '📝', color: Colors.primary, title: 'Activity' };
    }
  };

  const handleExtend = async () => {
    try {
      setIsLoading(true);
      await onExtend(data);
      onClose();
    } catch (error) {
      console.error('Failed to extend activity:', error);
      Alert.alert(
        'Error',
        'Failed to extend activity. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const handleDismiss = async () => {
    try {
      await onDismiss(data);
      onClose();
    } catch (error) {
      console.error('Failed to dismiss extension:', error);
      onClose(); // Close anyway
    }
  };

  const categoryInfo = getCategoryInfo();
  const extensionInfo = extensionModalService.getExtensionPeriodText(data.originalRepeat);

  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent={true}
      onRequestClose={handleDismiss}
    >
      <View style={styles.overlay}>
        <LinearGradient
          colors={Colors.gradient.background as any}
          style={styles.modalBackground}
        >
          <Card variant="elevated" style={styles.modalCard}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.categoryIcon, { backgroundColor: categoryInfo.color + '20' }]}>
                <Text style={styles.emoji}>{categoryInfo.emoji}</Text>
              </View>
              <Text style={styles.title}>Extend Activity?</Text>
            </View>

            {/* Content */}
            <View style={styles.content}>
              <Text style={styles.activityTitle}>«{data.activityTitle}»</Text>
              <Text style={styles.categoryLabel}>{categoryInfo.title}</Text>
              
              <View style={styles.infoContainer}>
                <Ionicons name="time-outline" size={20} color={categoryInfo.color} />
                <View style={styles.infoContent}>
                  <Text style={styles.infoLabel}>Schedule completed</Text>
                  <Text style={styles.infoValue}>
                    Would you like to extend for another {extensionInfo.period}?
                  </Text>
                </View>
              </View>

              <View style={styles.benefitsContainer}>
                <Text style={styles.benefitsTitle}>✨ When extended:</Text>
                <Text style={styles.benefitItem}>📅 New calendar entries will be created</Text>
                <Text style={styles.benefitItem}>🔔 New reminders will be set up</Text>
                <Text style={styles.benefitItem}>⏰ Next extension notification will be scheduled</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actions}>
              <Button
                title="No, thanks"
                onPress={handleDismiss}
                variant="outline"
                style={styles.dismissButton}
              />
              <Button
                title="Extend"
                onPress={handleExtend}
                loading={isLoading}
                variant="primary"
                style={styles.extendButton}
              />
            </View>
          </Card>
        </LinearGradient>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  modalBackground: {
    width: '90%',
    maxWidth: 400,
    borderRadius: 20,
  },
  modalCard: {
    margin: 0,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  categoryIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  emoji: {
    fontSize: 28,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  content: {
    marginBottom: 24,
  },
  activityTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 4,
  },
  categoryLabel: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 20,
    padding: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
  },
  infoContent: {
    flex: 1,
    marginLeft: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  infoValue: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
  benefitsContainer: {
    backgroundColor: Colors.primaryLight,
    padding: 16,
    borderRadius: 12,
  },
  benefitsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 8,
  },
  benefitItem: {
    fontSize: 13,
    color: Colors.textSecondary,
    lineHeight: 18,
    marginBottom: 4,
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  dismissButton: {
    flex: 1,
    minHeight: 50,
  },
  extendButton: {
    flex: 1,
    minHeight: 50,
  },
}); 