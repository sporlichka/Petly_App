import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
  Image,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';

import { AuthStackParamList, UserCreate } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { api } from '../../services/api';
import { LanguageModal } from '../../components/LanguageModal';

type RegisterScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Register'>;

interface RegisterScreenProps {
  navigation: RegisterScreenNavigationProp;
  onAuthSuccess: () => void;
}

export const RegisterScreen: React.FC<RegisterScreenProps> = ({
  navigation,
  onAuthSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<UserCreate & { confirmPassword: string }>({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<Partial<UserCreate & { confirmPassword: string }>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserCreate & { confirmPassword: string }> = {};

    if (!formData.username.trim()) {
      newErrors.username = t('validation.username_required');
    } else if (formData.username.length < 3) {
      newErrors.username = t('validation.username_min');
    }

    if (!formData.email.trim()) {
      newErrors.email = t('validation.email_required');
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = t('validation.email_invalid');
    }

    if (!formData.password) {
      newErrors.password = t('validation.password_required');
    } else if (formData.password.length < 6) {
      newErrors.password = t('validation.password_min');
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.confirm_password_required');
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('validation.passwords_must_match');
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      // Register the user
      const registerResponse = await api.auth.register({
        username: formData.username,
        email: formData.email,
        password: formData.password,
      });

      // Проверяем, был ли отправлен email для верификации
      if (registerResponse.email_verification_sent) {
        Alert.alert(
          t('auth.verification.pending.title'),
          t('auth.verification.pending.subtitle'),
          [
            {
              text: t('common.ok'),
              onPress: () => navigation.navigate('EmailVerificationPending', { 
                email: formData.email 
              })
            }
          ]
        );
        return;
      }

      // Если email уже подтвержден, автоматически входим
      if (registerResponse.user.email_verified) {
        onAuthSuccess();
      } else {
        // Переходим к экрану ожидания верификации
        navigation.navigate('EmailVerificationPending', { 
          email: formData.email 
        });
      }
    } catch (error: any) {
      console.error('Registration error:', error);
      
      // Обработка специфических ошибок Firebase
      if (error.code === 'EMAIL_ALREADY_EXISTS') {
        Alert.alert(
          t('auth.register_failed'),
          t('auth.email_already_exists'),
          [{ text: t('common.ok') }]
        );
      } else if (error.code === 'WEAK_PASSWORD') {
        Alert.alert(
          t('auth.register_failed'),
          t('auth.weak_password'),
          [{ text: t('common.ok') }]
        );
      } else if (error.code === 'NETWORK_ERROR') {
        Alert.alert(
          t('auth.register_failed'),
          t('auth.network_error'),
          [{ text: t('common.ok') }]
        );
      } else {
        Alert.alert(
          t('auth.register_failed'),
          error.message || t('auth.register_failed_message'),
          [{ text: t('common.ok') }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof (UserCreate & { confirmPassword: string }), value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleLanguageChange = (lang: string) => {
    i18n.changeLanguage(lang);
    setLanguageModalVisible(false);
  };

  return (
    <LinearGradient
      colors={Colors.gradient.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <ScrollView
            contentContainerStyle={styles.scrollContainer}
            showsVerticalScrollIndicator={false}
          >
            {/* Language Button */}
            <View style={{ position: 'absolute', top: 0, right: 0, zIndex: 10, padding: 16 }}>
              <Button
                title={i18n.language.startsWith('ru') ? 'RU' : 'EN'}
                onPress={() => setLanguageModalVisible(true)}
                variant="outline"
                size="small"
                style={{ minWidth: 48 }}
              />
            </View>
            <LanguageModal
              visible={languageModalVisible}
              onClose={() => setLanguageModalVisible(false)}
              currentLanguage={i18n.language}
              onSelectLanguage={handleLanguageChange}
              title={t('auth.language')}
              cancelLabel={t('common.cancel')}
            />
            {/* Header */}
            <View style={styles.header}>
              <Image 
                source={require('../../../assets/vetly-logo.png')}
                style={styles.logo}
                resizeMode="contain"
              />
              <Text style={styles.title}>{t('auth.register_title')}</Text>
              <Text style={styles.subtitle}>{t('auth.register_subtitle')}</Text>
            </View>

            {/* Registration Form */}
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.formTitle}>{t('auth.create_account')}</Text>
              
              <Input
                label={t('auth.username')}
                placeholder={t('auth.username_placeholder')}
                value={formData.username}
                onChangeText={(text) => updateFormData('username', text)}
                error={errors.username}
                autoCapitalize="none"
                autoComplete="username"
                leftIcon={
                  <Ionicons name="person-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <Input
                label={t('auth.email')}
                placeholder={t('auth.email_placeholder')}
                value={formData.email}
                onChangeText={(text) => updateFormData('email', text)}
                error={errors.email}
                keyboardType="email-address"
                autoCapitalize="none"
                autoComplete="email"
                leftIcon={
                  <Ionicons name="mail-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <Input
                label={t('auth.password')}
                placeholder={t('auth.password_create_placeholder')}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                error={errors.password}
                secureTextEntry
                autoComplete="new-password"
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <Input
                label={t('auth.confirm_password')}
                placeholder={t('auth.confirm_password_placeholder')}
                value={formData.confirmPassword}
                onChangeText={(text) => updateFormData('confirmPassword', text)}
                error={errors.confirmPassword}
                secureTextEntry
                autoComplete="new-password"
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <Button
                title={t('auth.create_account')}
                onPress={handleRegister}
                loading={isLoading}
                size="large"
                style={styles.registerButton}
              />
            </Card>

            {/* Sign In Link */}
            <View style={styles.signInContainer}>
              <Text style={styles.signInText}>{t('auth.already_have_account')} </Text>
              <Button
                title={t('auth.sign_in')}
                variant="text"
                onPress={() => navigation.navigate('Login')}
                textStyle={styles.signInButtonText}
              />
            </View>

            {/* Footer */}
                
          </ScrollView>
        </KeyboardAvoidingView>
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
  keyboardView: {
    flex: 1,
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
    marginTop: 32,
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logo: {
    width: 80,
    height: 80,
    marginBottom: 16,
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
  },
  formCard: {
    marginBottom: 24,
  },
  formTitle: {
    fontSize: 24,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 24,
  },
  registerButton: {
    marginTop: 8,
  },
  signInContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
  },
  signInText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  signInButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
  },
  footerText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 