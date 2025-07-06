import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';
import { useTranslation } from 'react-i18next';

import { OnboardingStackParamList } from '../../types';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/Colors';

type SuccessScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Success'>;

interface SuccessScreenProps {
  navigation: SuccessScreenNavigationProp;
  onComplete: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ onComplete }) => {
  const { t, i18n } = useTranslation();

  const handleContinue = () => {
    onComplete();
  };

  return (
    <LinearGradient
      colors={Colors.gradient.background as any}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView 
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.content}>
          {/* Celebration Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.petEmoji}>🐾</Text>
            <Text style={styles.heartEmoji}>💛</Text>
          </View>

          {/* Success Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>{t('onboarding.success_title')}</Text>
            <Text style={styles.subtitle}>
              {t('onboarding.success_subtitle')}
            </Text>
            <Text style={styles.description}>
              {t('onboarding.success_description')}
            </Text>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>{t('onboarding.what_you_can_do')}</Text>
            
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>📱</Text>
              <Text style={styles.featureText}>{t('onboarding.feature_add_activities')}</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>📅</Text>
              <Text style={styles.featureText}>{t('onboarding.feature_view_calendar')}</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🤖</Text>
              <Text style={styles.featureText}>{t('onboarding.feature_chat_ai')}</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🔔</Text>
              <Text style={styles.featureText}>{t('onboarding.feature_set_reminders')}</Text>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaContainer}>
            <Button
              title={t('onboarding.start_tracking')}
              onPress={handleContinue}
              size="large"
              style={styles.ctaButton}
            />
            <Text style={styles.ctaSubtext}>
              {t('onboarding.ready_to_care')}
            </Text>
          </View>
        </View>
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
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
  },
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
    minHeight: '100%',
  },
  illustrationContainer: {
    alignItems: 'center',
    marginTop: 60,
    position: 'relative',
  },
  celebrationEmoji: {
    fontSize: 64,
    marginBottom: 8,
  },
  petEmoji: {
    fontSize: 48,
    position: 'absolute',
    top: 20,
    left: -30,
  },
  heartEmoji: {
    fontSize: 32,
    position: 'absolute',
    top: 30,
    right: -20,
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 20,
  },
  title: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 16,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '500',
    color: Colors.primary,
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 16,
  },
  featuresContainer: {
    marginVertical: 10,
  },
  featuresTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
    marginBottom: 20,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 8,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 20,
    marginRight: 12,
  },
  featureText: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  ctaContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  ctaButton: {
    width: '100%',
    marginBottom: 16,
  },
  ctaSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
    fontWeight: '500',
  },
}); 