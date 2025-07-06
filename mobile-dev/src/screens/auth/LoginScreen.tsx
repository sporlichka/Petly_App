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

import { AuthStackParamList, UserLogin } from '../../types';
import { Button } from '../../components/Button';
import { Input } from '../../components/Input';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';
import { LanguageModal } from '../../components/LanguageModal';

type LoginScreenNavigationProp = StackNavigationProp<AuthStackParamList, 'Login'>;

interface LoginScreenProps {
  navigation: LoginScreenNavigationProp;
  onAuthSuccess: () => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({
  navigation,
  onAuthSuccess,
}) => {
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState<UserLogin>({
    email: '',
    password: '',
  });
  const [errors, setErrors] = useState<Partial<UserLogin>>({});
  const [isLoading, setIsLoading] = useState(false);
  const [languageModalVisible, setLanguageModalVisible] = useState(false);

  const validateForm = (): boolean => {
    const newErrors: Partial<UserLogin> = {};

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

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLogin = async () => {
    if (!validateForm()) return;

    setIsLoading(true);
    try {
      await apiService.login(formData);
      onAuthSuccess();
    } catch (error) {
      Alert.alert(
        t('auth.login_failed'),
        error instanceof Error ? error.message : t('auth.login_failed_message'),
        [{ text: t('common.ok') }]
      );
    } finally {
      setIsLoading(false);
    }
  };

  const updateFormData = (field: keyof UserLogin, value: string) => {
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
              <Text style={styles.title}>{t('auth.login_title')}</Text>
              <Text style={styles.subtitle}>{t('auth.login_subtitle')}</Text>
            </View>

            {/* Login Form */}
            <Card variant="elevated" style={styles.formCard}>
              <Text style={styles.formTitle}>{t('auth.sign_in')}</Text>
              
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
                placeholder={t('auth.password_placeholder')}
                value={formData.password}
                onChangeText={(text) => updateFormData('password', text)}
                error={errors.password}
                secureTextEntry
                autoComplete="password"
                leftIcon={
                  <Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />
                }
              />

              <Button
                title={t('auth.sign_in')}
                onPress={handleLogin}
                loading={isLoading}
                size="large"
                style={styles.loginButton}
              />
            </Card>

            {/* Sign Up Link */}
            <View style={styles.signUpContainer}>
              <Text style={styles.signUpText}>{t('auth.dont_have_account')} </Text>
              <Button
                title={t('auth.sign_up')}
                variant="text"
                onPress={() => navigation.navigate('Register')}
                textStyle={styles.signUpButtonText}
              />
            </View>

            {/* Footer */}
            <View style={styles.footer}>
              <Text style={styles.footerText}>{t('auth.footer_login')}</Text>
            </View>
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
  loginButton: {
    marginTop: 8,
  },
  signUpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  signUpText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  signUpButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
  footer: {
    alignItems: 'center',
    marginBottom: 8,
  },
  footerText: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    lineHeight: 20,
  },
}); 