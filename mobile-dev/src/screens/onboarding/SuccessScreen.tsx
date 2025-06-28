import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { LinearGradient } from 'expo-linear-gradient';

import { OnboardingStackParamList } from '../../types';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/Colors';

type SuccessScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Success'>;

interface SuccessScreenProps {
  navigation: SuccessScreenNavigationProp;
  onComplete: () => void;
}

export const SuccessScreen: React.FC<SuccessScreenProps> = ({ onComplete }) => {
  const handleContinue = () => {
    onComplete();
  };

  return (
    <LinearGradient
      colors={Colors.gradient.background}
      style={styles.container}
    >
      <SafeAreaView style={styles.safeArea}>
        <View style={styles.content}>
          {/* Celebration Illustration */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.celebrationEmoji}>🎉</Text>
            <Text style={styles.petEmoji}>🐾</Text>
            <Text style={styles.heartEmoji}>💛</Text>
          </View>

          {/* Success Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Perfect! 🌟</Text>
            <Text style={styles.subtitle}>
              Your pet has been added successfully
            </Text>
            <Text style={styles.description}>
              You're all set to start tracking your pet's health, activities, and happiness. 
              Our AI assistant is ready to help you with any questions!
            </Text>
          </View>

          {/* Features Preview */}
          <View style={styles.featuresContainer}>
            <Text style={styles.featuresTitle}>What you can do now:</Text>
            
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>📱</Text>
              <Text style={styles.featureText}>Add daily activities and feeding schedules</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>📅</Text>
              <Text style={styles.featureText}>View activity calendar and history</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🤖</Text>
              <Text style={styles.featureText}>Chat with our AI vet assistant</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🔔</Text>
              <Text style={styles.featureText}>Set reminders for important activities</Text>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaContainer}>
            <Button
              title="Start Tracking Activities!"
              onPress={handleContinue}
              size="large"
              style={styles.ctaButton}
            />
            <Text style={styles.ctaSubtext}>
              Ready to give your pet the best care? Let's go! 🚀
            </Text>
          </View>
        </View>
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
  content: {
    flex: 1,
    padding: 24,
    justifyContent: 'space-between',
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
    marginVertical: 40,
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
    marginVertical: 20,
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