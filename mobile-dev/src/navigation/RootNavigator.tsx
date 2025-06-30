import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { apiService } from '../services/api';
import { Colors } from '../constants/Colors';
import { notificationService } from '../services/notificationService';

export const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    initializeApp();
  }, []);

  const initializeApp = async () => {
    // Initialize notification service (LOCAL notifications only)
    try {
      console.log('🔔 Attempting to initialize LOCAL notification service...');
      const notificationInitialized = await notificationService.initialize();
      if (notificationInitialized) {
        console.log('✅ LOCAL notification service initialized successfully');
      } else {
        console.log('⚠️ LOCAL notification service not available (this is normal in simulators)');
      }
    } catch (error) {
      console.error('❌ LOCAL notification service initialization failed:', error);
      // Don't block app startup for notification initialization failures
      // This is expected in Expo Go or simulators
    }

    // Check authentication status
    await checkAuthStatus();
  };

  const checkAuthStatus = async () => {
    try {
      console.log('🔍 Checking authentication status...');
      const authenticated = await apiService.isAuthenticated();
      console.log('🔍 Authentication result:', authenticated);
      
      setIsAuthenticated(authenticated);

      if (authenticated) {
        console.log('✅ User is authenticated, checking onboarding status...');
        await checkOnboardingStatus();
      } else {
        console.log('❌ User is not authenticated');
        setHasCompletedOnboarding(false);
      }
    } catch (error) {
      console.error('❌ Auth check failed:', error);
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const checkOnboardingStatus = async () => {
    try {
      const pets = await apiService.getPets();
      const completed = pets.length > 0;
      console.log(`📊 Found ${pets.length} pets, onboarding completed: ${completed}`);
      setHasCompletedOnboarding(completed);
    } catch (error) {
      console.error('❌ Failed to check onboarding status:', error);
      // If we can't get pets, it might be an auth issue
      // The API service will handle token cleanup automatically
      setIsAuthenticated(false);
      setHasCompletedOnboarding(false);
    }
  };

  const handleAuthSuccess = async () => {
    console.log('🎉 Auth success - updating state...');
    setIsAuthenticated(true);
    setIsLoading(true);
    
    await checkOnboardingStatus();
    setIsLoading(false);
  };

  const handleOnboardingComplete = () => {
    console.log('🎉 Onboarding completed!');
    setHasCompletedOnboarding(true);
  };

  const handleLogout = async () => {
    console.log('👋 Logging out...');
    await apiService.logout();
    setIsAuthenticated(false);
    setHasCompletedOnboarding(false);
  };

  if (isLoading) {
    return (
      <View style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
      }}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  // Render the appropriate navigator based on current state
  const renderCurrentNavigator = () => {
    console.log(`🧭 Navigation state - Auth: ${isAuthenticated}, Onboarding: ${hasCompletedOnboarding}`);
    
    if (!isAuthenticated) {
      console.log('📱 Rendering AuthNavigator');
      return (
        <AuthNavigator
          onAuthSuccess={handleAuthSuccess}
        />
      );
    }
    
    if (!hasCompletedOnboarding) {
      console.log('📱 Rendering OnboardingNavigator');
      return (
        <OnboardingNavigator
          onComplete={handleOnboardingComplete}
        />
      );
    }
    
    console.log('📱 Rendering MainNavigator');
    return (
      <MainNavigator
        onLogout={handleLogout}
      />
    );
  };

  return (
    <NavigationContainer>
      {renderCurrentNavigator()}
    </NavigationContainer>
  );
}; 