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

import { OnboardingStackParamList } from '../../types';
import { Button } from '../../components/Button';
import { Colors } from '../../constants/Colors';

type WelcomeScreenNavigationProp = StackNavigationProp<OnboardingStackParamList, 'Welcome'>;

interface WelcomeScreenProps {
  navigation: WelcomeScreenNavigationProp;
}

export const WelcomeScreen: React.FC<WelcomeScreenProps> = ({ navigation }) => {
  const handleGetStarted = () => {
    navigation.navigate('AddPet');
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
          {/* Illustration Section */}
          <View style={styles.illustrationContainer}>
            <Text style={styles.mainEmoji}>🐕‍🦺</Text>
            <Text style={styles.supportEmojis}>🐱 🐰 🐦</Text>
          </View>

          {/* Welcome Content */}
          <View style={styles.textContainer}>
            <Text style={styles.title}>Welcome to Vetly AI🎉</Text>
            <Text style={styles.description}>
              Track your pet's health and get AI-powered vet insights.
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🥣</Text>
              <Text style={styles.featureText}>Track feeding times and food types</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🩺</Text>
              <Text style={styles.featureText}>Monitor health and vet visits</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🎾</Text>
              <Text style={styles.featureText}>Log activities and exercise</Text>
            </View>
            <View style={styles.feature}>
              <Text style={styles.featureEmoji}>🤖</Text>
              <Text style={styles.featureText}>Get AI vet assistance</Text>
            </View>
          </View>

          {/* CTA Section */}
          <View style={styles.ctaContainer}>
            <Button
              title="Let's add your first pet!"
              onPress={handleGetStarted}
              size="large"
              style={styles.ctaButton}
            />
            <Text style={styles.ctaSubtext}>
              Don't worry, you can add more pets later 😊
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
    marginTop: 40,
  },
  mainEmoji: {
    fontSize: 80,
    marginBottom: 16,
  },
  supportEmojis: {
    fontSize: 32,
    letterSpacing: 8,
  },
  textContainer: {
    alignItems: 'center',
    marginVertical: 16,
  },
  title: {
    fontSize: 32,
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
    flex: 1,
  },
  feature: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 2,
  },
  featureEmoji: {
    fontSize: 24,
    marginRight: 16,
  },
  featureText: {
    fontSize: 16,
    color: Colors.text,
    fontWeight: '500',
    flex: 1,
  },
  ctaContainer: {
    alignItems: 'center',
    paddingBottom: 30,
  },
  ctaButton: {
    width: '100%',
    marginBottom: 16,
  },
  ctaSubtext: {
    fontSize: 14,
    color: Colors.textLight,
    textAlign: 'center',
  },
}); 