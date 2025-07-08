import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types';
import { Colors } from '../constants/Colors';
import { useTranslation } from 'react-i18next';

import { HomeStackNavigator } from './HomeStackNavigator';
import { CalendarScreen } from '../screens/main/CalendarScreen';
import { ChatScreen } from '../screens/main/ChatScreen';
import { SettingsScreen } from '../screens/main/SettingsScreen';

const Tab = createBottomTabNavigator<MainTabParamList>();

interface MainNavigatorProps {
  onLogout: () => void;
}

export const MainNavigator: React.FC<MainNavigatorProps> = ({ onLogout }) => {
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        tabBarIcon: ({ focused, color, size }) => {
          let iconName: keyof typeof Ionicons.glyphMap = 'home';

          switch (route.name) {
            case 'Home':
              iconName = focused ? 'home' : 'home-outline';
              break;
            case 'Calendar':
              iconName = focused ? 'calendar' : 'calendar-outline';
              break;
            case 'Chat':
              iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
              break;
            case 'Settings':
              iconName = focused ? 'settings' : 'settings-outline';
              break;
          }

          return <Ionicons name={iconName} size={size} color={color} />;
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarStyle: {
          backgroundColor: Colors.surface,
          borderTopColor: Colors.borderLight,
          borderTopWidth: 1,
          paddingBottom: Math.max(insets.bottom, 5),
          paddingTop: 5,
          height: 60 + Math.max(insets.bottom - 5, 0),
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: '500',
        },
        headerShown: false,
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          tabBarLabel: t('home.title'),
        }}
        listeners={({ navigation }) => ({
          state: (e) => {
            // Hide tab bar when navigating to nested screens
            const state = navigation.getState();
            const homeRoute = state.routes.find(route => route.name === 'Home');
            const homeState = homeRoute?.state;
            
            if (homeState && homeState.index !== undefined && homeState.index > 0) {
              navigation.setOptions({
                tabBarStyle: { display: 'none' },
              });
            } else {
              navigation.setOptions({
                tabBarStyle: {
                  backgroundColor: Colors.surface,
                  borderTopColor: Colors.borderLight,
                  borderTopWidth: 1,
                  paddingBottom: Math.max(insets.bottom, 5),
                  paddingTop: 5,
                  height: 60 + Math.max(insets.bottom - 5, 0),
                },
              });
            }
          },
        })}
      />
      <Tab.Screen 
        name="Calendar"
        options={{
          tabBarLabel: t('calendar.title'),
        }}
      >
        {(props) => <CalendarScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          tabBarLabel: t('common.petly_assistant'),
        }}
      />
      <Tab.Screen 
        name="Settings"
        options={{
          tabBarLabel: t('settings.title'),
        }}
      >
        {(props) => (
          <SettingsScreen {...props} onLogout={onLogout} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}; 