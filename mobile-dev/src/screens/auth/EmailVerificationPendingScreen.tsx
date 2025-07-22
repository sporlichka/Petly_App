import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute, RouteProp } from '@react-navigation/native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '../../constants/Colors';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { VerificationStatus } from '../../components/VerificationStatus';
import { EmailVerificationInfo } from '../../components/EmailVerificationInfo';
import { api } from '../../services/api';
import { AuthStackParamList } from '../../types';
import { useTranslation } from 'react-i18next';

type EmailVerificationPendingScreenNavigationProp = StackNavigationProp<
  AuthStackParamList,
  'EmailVerificationPending'
>;

type EmailVerificationPendingScreenRouteProp = RouteProp<
  AuthStackParamList,
  'EmailVerificationPending'
>;

export const EmailVerificationPendingScreen: React.FC = () => {
  const navigation = useNavigation<EmailVerificationPendingScreenNavigationProp>();
  const route = useRoute<EmailVerificationPendingScreenRouteProp>();
  const { t } = useTranslation();
  
  const { email } = route.params;
  
  const [isResending, setIsResending] = useState(false);
  const [isChecking, setIsChecking] = useState(false);
  const [lastResendTime, setLastResendTime] = useState<Date | null>(null);
  const [canResend, setCanResend] = useState(true);

  // Check if we can resend verification email (limit to once per minute)
  useEffect(() => {
    if (lastResendTime) {
      const timeDiff = Date.now() - lastResendTime.getTime();
      const canResendNow = timeDiff >= 60000; // 1 minute
      setCanResend(canResendNow);
      
      if (!canResendNow) {
        const timer = setTimeout(() => {
          setCanResend(true);
        }, 60000 - timeDiff);
        
        return () => clearTimeout(timer);
      }
    }
  }, [lastResendTime]);

  const handleResendVerification = async () => {
    if (!canResend) return;
    
    setIsResending(true);
    try {
      await api.auth.resendVerificationEmail(email);
      setLastResendTime(new Date());
      Alert.alert(
        t('auth.verification.resendSuccess.title'),
        t('auth.verification.resendSuccess.message')
      );
    } catch (error) {
      console.error('Error resending verification email:', error);
      Alert.alert(
        t('auth.verification.resendError.title'),
        t('auth.verification.resendError.message')
      );
    } finally {
      setIsResending(false);
    }
  };

  const handleCheckVerification = async () => {
    setIsChecking(true);
    try {
      const response = await api.auth.checkEmailVerificationByEmail(email);
      
      if (response.email_verified) {
        Alert.alert(
          t('auth.verification.verified.title'),
          t('auth.verification.verified.message'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('Login')
            }
          ]
        );
      } else {
        Alert.alert(
          t('auth.verification.notVerified.title'),
          t('auth.verification.notVerified.message')
        );
      }
    } catch (error) {
      console.error('Error checking verification status:', error);
      Alert.alert(
        t('auth.verification.checkError.title'),
        t('auth.verification.checkError.message')
      );
    } finally {
      setIsChecking(false);
    }
  };

  const handleBackToLogin = () => {
    navigation.navigate('Login');
  };

  const getResendButtonText = () => {
    if (isResending) return t('auth.verification.resending');
    if (!canResend && lastResendTime) {
      const timeDiff = Date.now() - lastResendTime.getTime();
      const remainingSeconds = Math.ceil((60000 - timeDiff) / 1000);
      return t('auth.verification.resendIn', { seconds: remainingSeconds });
    }
    return t('auth.verification.resend');
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
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <Ionicons name="mail-outline" size={64} color={Colors.primary} />
            </View>
            <Text style={styles.title}>{t('auth.verification.pending.title')}</Text>
          </View>

          {/* Status Card */}
          <Card variant="elevated" style={styles.statusCard}>
            <EmailVerificationInfo email={email} />
            <View style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>1</Text>
              </View>
              <Text style={styles.instructionText}>
                {t('auth.verification.step1', { email })}
              </Text>
            </View>
            
            <View style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>2</Text>
              </View>
              <Text style={styles.instructionText}>
                {t('auth.verification.step2')}
              </Text>
            </View>
            
            <View style={styles.instructionRow}>
              <View style={styles.stepNumber}>
                <Text style={styles.stepNumberText}>3</Text>
              </View>
              <Text style={styles.instructionText}>
                {t('auth.verification.step3')}
              </Text>
            </View>
          </Card>

          {/* Actions Card */}
          <Card variant="elevated" style={styles.actionsCard}>
            <Text style={styles.actionsTitle}>{t('auth.verification.actions.title')}</Text>
            
            <Button
              title={t('auth.verification.check')}
              onPress={handleCheckVerification}
              loading={isChecking}
              size="large"
              style={styles.primaryButton}
              icon={
                <Ionicons name="checkmark-circle-outline" size={20} color={Colors.white} />
              }
            />

            {/* <Button
              title={getResendButtonText()}
              onPress={handleResendVerification}
              disabled={isResending || !canResend}
              loading={isResending}
              variant="secondary"
              size="large"
              style={styles.secondaryButton}
              icon={
                <Ionicons name="refresh-outline" size={20} color={Colors.primary} />
              }
            /> */}

            <Button
              title={t('auth.verification.backToLogin')}
              onPress={handleBackToLogin}
              variant="outline"
              size="large"
              style={styles.outlineButton}
              icon={
                <Ionicons name="arrow-back-outline" size={20} color={Colors.primary} />
              }
            />
          </Card>

          {/* Help Card */}
          <Card variant="elevated" style={styles.helpCard}>
            <View style={styles.helpHeader}>
              <Ionicons name="help-circle-outline" size={24} color={Colors.warning} />
              <Text style={styles.helpTitle}>{t('auth.verification.help.title')}</Text>
            </View>
            <Text style={styles.helpText}>
              {t('auth.verification.help.text')}
            </Text>
          </Card>
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
  logoContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  statusCard: {
    marginBottom: 16,
    padding: 20,
  },
  instructionsCard: {
    marginBottom: 16,
    padding: 20,
  },
  instructionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.white,
  },
  instructionText: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    lineHeight: 22,
  },
  actionsCard: {
    marginBottom: 16,
    padding: 20,
  },
  actionsTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  primaryButton: {
    marginBottom: 12,
  },
  secondaryButton: {
    marginBottom: 12,
  },
  outlineButton: {
    marginBottom: 0,
  },
  helpCard: {
    padding: 20,
    backgroundColor: Colors.warningLight,
    borderColor: Colors.warning,
    borderWidth: 1,
  },
  helpHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  helpTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.warning,
    marginLeft: 8,
  },
  helpText: {
    fontSize: 14,
    color: Colors.textSecondary,
    lineHeight: 20,
  },
}); 