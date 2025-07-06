import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { useTranslation } from 'react-i18next';
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
        name="SelectType" 
        component={SelectTypeScreen}
        options={{
          title: t('activity.add_activity'),
          headerTitle: t('activity.add_activity_header'),
        }}
      />
      <Stack.Screen 
        name="FillDetails" 
        component={FillDetailsScreen}
        options={{
          title: t('activity.activity_details'),
          headerTitle: t('activity.activity_details_header'),
        }}
      />
      <Stack.Screen 
        name="SelectDateTime" 
        component={SelectDateTimeScreen}
        options={{
          title: t('activity.date_time'),
          headerTitle: t('activity.date_time_header'),
        }}
      />
      <Stack.Screen 
        name="SetRepeat" 
        component={SetRepeatScreen}
        options={{
          title: t('activity.repeat_schedule'),
          headerTitle: t('activity.repeat_settings_header'),
        }}
      />
      <Stack.Screen 
        name="Confirmation" 
        component={ConfirmationScreen}
        options={{
          title: t('activity.confirmation'),
          headerTitle: t('activity.confirm_activity_header'),
        }}
      />
    </Stack.Navigator>
  );
}; 