import React from 'react';
import { Modal, View, Text } from 'react-native';
import { Button } from './Button';
import { Colors } from '../constants/Colors';

interface LanguageModalProps {
  visible: boolean;
  onClose: () => void;
  currentLanguage: string;
  onSelectLanguage: (lang: string) => void;
  title?: string;
  cancelLabel?: string;
}

export const LanguageModal: React.FC<LanguageModalProps> = ({
  visible,
  onClose,
  currentLanguage,
  onSelectLanguage,
  title = 'Select Language',
  cancelLabel = 'Cancel',
}) => (
  <Modal
    visible={visible}
    transparent
    animationType="fade"
    onRequestClose={onClose}
  >
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: 'rgba(0,0,0,0.4)' }}>
      <View style={{ backgroundColor: Colors.surface, borderRadius: 12, padding: 24, minWidth: 220, alignItems: 'center' }}>
        <Text style={{ fontSize: 18, fontWeight: '600', marginBottom: 16 }}>{title}</Text>
        <Button
          title="EN - English"
          onPress={() => onSelectLanguage('en-US')}
          variant={currentLanguage.startsWith('en') ? 'primary' : 'outline'}
          style={{ marginBottom: 12, minWidth: 160 }}
        />
        <Button
          title="RU - Русский"
          onPress={() => onSelectLanguage('ru-RU')}
          variant={currentLanguage.startsWith('ru') ? 'primary' : 'outline'}
          style={{ marginBottom: 12, minWidth: 160 }}
        />
        <Button
          title={cancelLabel}
          onPress={onClose}
          variant="outline"
          style={{ minWidth: 160 }}
        />
      </View>
    </View>
  </Modal>
); 