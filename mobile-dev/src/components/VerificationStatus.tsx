import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface VerificationStatusProps {
  status: 'pending' | 'verified' | 'error';
  message?: string;
}

export const VerificationStatus: React.FC<VerificationStatusProps> = ({
  status,
  message
}) => {
  const getStatusConfig = () => {
    switch (status) {
      case 'pending':
        return {
          backgroundColor: Colors.warning,
          textColor: Colors.white,
          icon: '⏳',
          defaultMessage: 'Email verification pending'
        };
      case 'verified':
        return {
          backgroundColor: Colors.success,
          textColor: Colors.white,
          icon: '✅',
          defaultMessage: 'Email verified'
        };
      case 'error':
        return {
          backgroundColor: Colors.error,
          textColor: Colors.white,
          icon: '❌',
          defaultMessage: 'Verification error'
        };
    }
  };

  const config = getStatusConfig();

  return (
    <View style={[styles.container, { backgroundColor: config.backgroundColor }]}>
      <Text style={styles.icon}>{config.icon}</Text>
      <Text style={[styles.message, { color: config.textColor }]}>
        {message || config.defaultMessage}
      </Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    borderRadius: 8,
    marginVertical: 8,
  },
  icon: {
    fontSize: 20,
    marginRight: 12,
  },
  message: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
}); 