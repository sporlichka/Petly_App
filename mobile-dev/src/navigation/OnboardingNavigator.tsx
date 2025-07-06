import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';

import { OnboardingStackParamList } from '../types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { AddPetScreen } from '../screens/onboarding/AddPetScreen';
import { SuccessScreen } from '../screens/onboarding/SuccessScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

export const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen 
        name="Welcome" 
        component={WelcomeScreen}
        options={{
          title: t('navigation.onboarding.welcome')
        }}
      />
      <Stack.Screen 
        name="AddPet" 
        component={AddPetScreen}
        options={{
          title: t('navigation.onboarding.add_pet')
        }}
      />
      <Stack.Screen 
        name="Success"
        options={{
          title: t('navigation.onboarding.success')
        }}
      >
        {(props) => (
          <SuccessScreen {...props} onComplete={onComplete} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}; 