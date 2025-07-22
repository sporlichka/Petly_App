import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  Alert,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { Colors } from '../constants/Colors';
import { Button } from './Button';

interface DeleteAccountModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: (password: string) => Promise<void>;
}

export const DeleteAccountModal: React.FC<DeleteAccountModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    if (!password.trim()) {
      Alert.alert('Error', 'Please enter your password');
      return;
    }

    setIsLoading(true);
    try {
      await onConfirm(password);
      setPassword('');
      onClose();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to delete account');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    setPassword('');
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modal}>
          <Text style={styles.title}>Delete Account</Text>
          
          <Text style={styles.warning}>
            ⚠️ WARNING: This action cannot be undone!
          </Text>
          
          <Text style={styles.description}>
            This will permanently delete:
            {'\n'}• Your account
            {'\n'}• All your pets
            {'\n'}• All activity records
            {'\n'}• All data
          </Text>

          <Text style={styles.passwordLabel}>
            Enter your password to confirm deletion:
          </Text>

          <TextInput
            style={styles.passwordInput}
            placeholder="Password"
            secureTextEntry
            value={password}
            onChangeText={setPassword}
            editable={!isLoading}
            autoFocus
          />

          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={[styles.button, styles.cancelButton]} 
              onPress={handleCancel}
              disabled={isLoading}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={[styles.button, styles.deleteButton]} 
              onPress={handleConfirm}
              disabled={isLoading || !password.trim()}
            >
              {isLoading ? (
                <ActivityIndicator color="white" size="small" />
              ) : (
                <Text style={styles.deleteButtonText}>Delete Forever</Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 24,
    width: '100%',
    maxWidth: 400,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  warning: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.error,
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 20,
    lineHeight: 20,
  },
  passwordLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
    marginBottom: 8,
  },
  passwordInput: {
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    backgroundColor: Colors.backgroundLight,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 44,
  },
  cancelButton: {
    backgroundColor: Colors.border,
  },
  deleteButton: {
    backgroundColor: Colors.error,
  },
  cancelButtonText: {
    color: Colors.text,
    fontSize: 16,
    fontWeight: '500',
  },
  deleteButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: '600',
  },
}); 