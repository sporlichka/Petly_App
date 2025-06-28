import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { ActivityStackParamList } from '../types';
import { Colors } from '../constants/Colors';

import {
  SelectTypeScreen,
  FillDetailsScreen,
  SelectDateTimeScreen,
  SetRepeatScreen,
  ConfirmationScreen,
} from '../screens/activity';

const Stack = createStackNavigator<ActivityStackParamList>();

export const ActivityStackNavigator: React.FC = () => {
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
        name="SelectType" 
        component={SelectTypeScreen}
        options={{
          title: 'Add Activity',
          headerTitle: '📝 Add Activity',
        }}
      />
      <Stack.Screen 
        name="FillDetails" 
        component={FillDetailsScreen}
        options={{
          title: 'Activity Details',
          headerTitle: '✏️ Activity Details',
        }}
      />
      <Stack.Screen 
        name="SelectDateTime" 
        component={SelectDateTimeScreen}
        options={{
          title: 'Date & Time',
          headerTitle: '📅 Date & Time',
        }}
      />
      <Stack.Screen 
        name="SetRepeat" 
        component={SetRepeatScreen}
        options={{
          title: 'Repeat Settings',
          headerTitle: '🔄 Repeat Settings',
        }}
      />
      <Stack.Screen 
        name="Confirmation" 
        component={ConfirmationScreen}
        options={{
          title: 'Confirm Activity',
          headerTitle: '✅ Confirm Activity',
        }}
      />
    </Stack.Navigator>
  );
}; 