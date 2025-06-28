import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { HomeStackParamList } from '../types';
import { Colors } from '../constants/Colors';

import { HomeScreen } from '../screens/main/HomeScreen';
import { PetDetailScreen } from '../screens/main/PetDetailScreen';
import { AddPetScreen } from '../screens/main/AddPetScreen';
import { ActivityStackNavigator } from './ActivityStackNavigator';

const Stack = createStackNavigator<HomeStackParamList>();

export const HomeStackNavigator: React.FC = () => {
  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: {
          backgroundColor: Colors.surface,
          borderBottomColor: Colors.borderLight,
          borderBottomWidth: 1,
        },
        headerTitleStyle: {
          color: Colors.text,
          fontSize: 18,
          fontWeight: '600',
        },
        headerTintColor: Colors.primary,
        headerBackTitle: '',
      }}
    >
      <Stack.Screen 
        name="PetList" 
        component={HomeScreen}
        options={{
          headerShown: false, // Home screen header is handled by tab navigator
        }}
      />
      <Stack.Screen 
        name="PetDetail" 
        component={PetDetailScreen}
        options={{
          title: 'Pet Details',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="AddPet" 
        component={AddPetScreen}
        options={{
          title: 'Add New Pet',
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="ActivityWizard" 
        component={ActivityStackNavigator}
        options={{
          headerShown: false, // Activity wizard handles its own headers
        }}
      />
    </Stack.Navigator>
  );
}; 