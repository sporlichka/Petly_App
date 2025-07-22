import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  ActivityIndicator,
  ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { api } from '../../services/api';
import { AuthStackParamList } from '../../types';
import { useTranslation } from 'react-i18next';

type EmailVerificationScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'EmailVerification'
>;

type EmailVerificationScreenRouteProp = RouteProp<
  AuthStackParamList,
  'EmailVerification'
>;

type VerificationState = 'loading' | 'success' | 'error' | 'expired';

export const EmailVerificationScreen: React.FC = () => {
  const navigation = useNavigation<EmailVerificationScreenNavigationProp>();
  const route = useRoute<EmailVerificationScreenRouteProp>();
  const { t } = useTranslation();
  
  const { token } = route.params;
  
  const [verificationState, setVerificationState] = useState<VerificationState>('loading');
  const [errorMessage, setErrorMessage] = useState<string>('');

  useEffect(() => {
    verifyEmailToken();
  }, []);

  const verifyEmailToken = async () => {
    try {
      const response = await api.auth.verifyEmailToken(token);
      
      if (response.success) {
        setVerificationState('success');
      } else {
        setVerificationState('error');
        setErrorMessage(t('auth.verification.tokenError.invalid'));
      }
    } catch (error: any) {
      console.error('Error verifying email token:', error);
      
      if (error.code === 'TOKEN_EXPIRED') {
        setVerificationState('expired');
        setErrorMessage(t('auth.verification.tokenError.expired'));
      } else if (error.code === 'TOKEN_INVALID') {
        setVerificationState('error');
        setErrorMessage(t('auth.verification.tokenError.invalid'));
      } else {
        setVerificationState('error');
        setErrorMessage(t('auth.verification.tokenError.general'));
      }
    }
  };

  const handleResendVerification = () => {
    navigation.navigate('EmailVerificationPending', { email: '' });
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const handleContinue = () => {
    navigation.navigate('Login');
  };

  const getIconAndColor = () => {
    switch (verificationState) {
      case 'loading':
        return { icon: 'hourglass-outline', color: Colors.primary, size: 64 };
      case 'success':
        return { icon: 'checkmark-circle', color: Colors.success, size: 80 };
      case 'error':
        return { icon: 'close-circle', color: Colors.error, size: 80 };
      case 'expired':
        return { icon: 'time-outline', color: Colors.warning, size: 80 };
    }
  };

  const renderContent = () => {
    const iconData = getIconAndColor();

    switch (verificationState) {
      case 'loading':
        return (
          <Card variant="elevated" style={styles.mainCard}>
            <View style={styles.iconContainer}>
              <ActivityIndicator size="large" color={Colors.primary} />
            </View>
            <Text style={styles.statusTitle}>
              {t('auth.verification.verifying')}
            </Text>
            <Text style={styles.statusSubtitle}>
              Please wait while we verify your email...
            </Text>
          </Card>
        );

      case 'success':
        return (
          <View style={styles.contentContainer}>
            <Card variant="elevated" style={styles.successMainCard}>
              <View style={styles.iconContainer}>
                <Ionicons name={iconData.icon as any} size={iconData.size} color={iconData.color} />
              </View>
              <Text style={styles.successTitle}>
                {t('auth.verification.success.title')}
              </Text>
              <Text style={styles.statusSubtitle}>
                {t('auth.verification.success.subtitle')}
              </Text>
              
              <Button
                title={t('auth.verification.success.continue')}
                onPress={handleContinue}
                size="large"
                style={styles.primaryButton}
              />
            </Card>
          </View>
        );

              case 'error':
        return (
          <View style={styles.contentContainer}>
            <Card variant="elevated" style={styles.errorMainCard}>
              <View style={styles.iconContainer}>
                <Ionicons name={iconData.icon as any} size={iconData.size} color={iconData.color} />
              </View>
              <Text style={styles.errorTitle}>
                {t('auth.verification.error.title')}
              </Text>
              <Text style={styles.statusSubtitle}>
                {errorMessage}
              </Text>
              
              <Button
                title={t('auth.verification.error.resend')}
                onPress={handleResendVerification}
                size="large"
                style={styles.primaryButton}
              />
              
              <Button
                title={t('auth.verification.error.backToLogin')}
                onPress={handleBackToLogin}
                variant="outline"
                size="large"
                style={styles.outlineButton}
              />
            </Card>
          </View>
        );

      case 'expired':
        return (
          <View style={styles.contentContainer}>
            <Card variant="elevated" style={styles.warningMainCard}>
              <View style={styles.iconContainer}>
                <Ionicons name={iconData.icon as any} size={iconData.size} color={iconData.color} />
              </View>
              <Text style={styles.warningTitle}>
                {t('auth.verification.expired.title')}
              </Text>
              <Text style={styles.statusSubtitle}>
                {t('auth.verification.expired.subtitle')}
              </Text>
              
              <Button
                title={t('auth.verification.expired.resend')}
                onPress={handleResendVerification}
                size="large"
                style={styles.primaryButton}
              />
              
              <Button
                title={t('auth.verification.expired.backToLogin')}
                onPress={handleBackToLogin}
                variant="outline"
                size="large"
                style={styles.outlineButton}
              />
            </Card>
          </View>
        );
    }
  };

  return (
    <LinearGradient
      colors={Colors.gradient.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          contentContainerStyle={styles.scrollContainer}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.header}>
            <Text style={styles.title}>
              {t('auth.verification.title')}
            </Text>
          </View>

          {renderContent()}
        </ScrollView>
      </SafeAreaView>
    </LinearGradient>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 16,
  },
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
  },
  contentContainer: {
    flex: 1,
  },
  mainCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
  },
  successMainCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
    borderWidth: 1,
  },
  errorMainCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    borderWidth: 1,
  },
  warningMainCard: {
    padding: 32,
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  successCard: {
    backgroundColor: Colors.successLight,
    borderColor: Colors.success,
    borderWidth: 1,
  },
  errorCard: {
    backgroundColor: Colors.errorLight,
    borderColor: Colors.error,
    borderWidth: 1,
  },
  warningCard: {
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.success,
    marginBottom: 12,
    textAlign: 'center',
  },
  errorTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.error,
    marginBottom: 12,
    textAlign: 'center',
  },
  warningTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.warning,
    marginBottom: 12,
    textAlign: 'center',
  },
  iconContainer: {
    marginBottom: 24,
  },
  statusTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 12,
    textAlign: 'center',
  },
  statusSubtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 24,
  },
  primaryButton: {
    marginBottom: 12,
    width: '100%',
  },
  outlineButton: {
    marginBottom: 0,
    width: '100%',
  },
}); 