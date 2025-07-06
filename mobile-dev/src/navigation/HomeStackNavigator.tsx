import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
import { HomeStackParamList } from '../types';
import { Colors } from '../constants/Colors';

import { HomeScreen } from '../screens/main/HomeScreen';
import { PetDetailScreen } from '../screens/main/PetDetailScreen';
import { AddPetScreen } from '../screens/main/AddPetScreen';
import { EditPetScreen } from '../screens/main/EditPetScreen';
import { ViewAllActivitiesScreen } from '../screens/main/ViewAllActivitiesScreen';
import { ActivityStackNavigator } from './ActivityStackNavigator';

const Stack = createStackNavigator<HomeStackParamList>();

export const HomeStackNavigator: React.FC = () => {
  const { t } = useTranslation();

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
          title: t('navigation.pet_details'),
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="AddPet" 
        component={AddPetScreen}
        options={{
          title: t('navigation.add_new_pet'),
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="EditPet" 
        component={EditPetScreen}
        options={{
          title: t('navigation.edit_pet'),
          headerShown: true,
        }}
      />
      <Stack.Screen 
        name="ViewAllActivities" 
        component={ViewAllActivitiesScreen}
        options={{
          title: t('navigation.all_activities'),
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