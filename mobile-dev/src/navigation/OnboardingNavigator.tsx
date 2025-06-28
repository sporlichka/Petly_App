import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { OnboardingStackParamList } from '../types';
import { WelcomeScreen } from '../screens/onboarding/WelcomeScreen';
import { AddPetScreen } from '../screens/onboarding/AddPetScreen';
import { SuccessScreen } from '../screens/onboarding/SuccessScreen';

const Stack = createStackNavigator<OnboardingStackParamList>();

interface OnboardingNavigatorProps {
  onComplete: () => void;
}

export const OnboardingNavigator: React.FC<OnboardingNavigatorProps> = ({ onComplete }) => {
  return (
    <Stack.Navigator
      initialRouteName="Welcome"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Welcome" component={WelcomeScreen} />
      <Stack.Screen name="AddPet" component={AddPetScreen} />
      <Stack.Screen name="Success">
        {(props) => (
          <SuccessScreen {...props} onComplete={onComplete} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}; 