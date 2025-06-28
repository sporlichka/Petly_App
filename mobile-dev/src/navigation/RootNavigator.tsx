import React, { useEffect, useState } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { View, ActivityIndicator } from 'react-native';

import { AuthNavigator } from './AuthNavigator';
import { MainNavigator } from './MainNavigator';
import { OnboardingNavigator } from './OnboardingNavigator';
import { apiService } from '../services/api';
import { Colors } from '../constants/Colors';

export const RootNavigator: React.FC = () => {
  const [isLoading, setIsLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const authenticated = await apiService.isAuthenticated();
      setIsAuthenticated(authenticated);

      if (authenticated) {
        // Check if user has pets (completed onboarding)
        const pets = await apiService.getPets();
        setHasCompletedOnboarding(pets.length > 0);
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      setIsAuthenticated(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleAuthSuccess = async () => {
    console.log('🎉 Auth success - updating state...');
    setIsAuthenticated(true);
    setIsLoading(true);
    
    try {
      // Check if user has pets (completed onboarding)
      const pets = await apiService.getPets();
      const hasCompletedOnboarding = pets.length > 0;
      console.log(`📊 User has ${pets.length} pets, onboarding completed: ${hasCompletedOnboarding}`);
      setHasCompletedOnboarding(hasCompletedOnboarding);
    } catch (error) {
      console.error('Failed to check onboarding status:', error);
      setHasCompletedOnboarding(false);
    } finally {
      setIsLoading(false);
    }
  };

  const handleOnboardingComplete = () => {
    setHasCompletedOnboarding(true);
  };

  const handleLogout = () => {
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