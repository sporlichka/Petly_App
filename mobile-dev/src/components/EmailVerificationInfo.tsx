import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Colors } from '../constants/Colors';

interface EmailVerificationInfoProps {
  email: string;
}

export const EmailVerificationInfo: React.FC<EmailVerificationInfoProps> = ({
  email
}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.label}>Verification email sent to:</Text>
      <Text style={styles.email}>{email}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    padding: 16,
    alignItems: 'center',
  },
  label: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginBottom: 4,
  },
  email: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.primary,
  },
}); 