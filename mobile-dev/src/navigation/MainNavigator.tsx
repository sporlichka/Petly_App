import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MainTabParamList } from '../types';
import { Colors } from '../constants/Colors';

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
      })}
    >
      <Tab.Screen 
        name="Home" 
        component={HomeStackNavigator}
        options={{
          title: 'My Pets',
          headerTitle: '🐾 My Pets',
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
                headerShown: false,
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
                headerShown: true,
              });
            }
          },
        })}
      />
      <Tab.Screen 
        name="Calendar"
        options={{
          title: 'Activities',
          headerTitle: '📅 Activities',
        }}
      >
        {(props) => <CalendarScreen {...props} />}
      </Tab.Screen>
      <Tab.Screen 
        name="Chat" 
        component={ChatScreen}
        options={{
          title: 'Vet Chat',
          headerTitle: '🩺 PetCare Assistant',
        }}
      />
      <Tab.Screen 
        name="Settings"
        options={{
          title: 'Settings',
          headerTitle: '⚙️ Settings',
        }}
      >
        {(props) => (
          <SettingsScreen {...props} onLogout={onLogout} />
        )}
      </Tab.Screen>
    </Tab.Navigator>
  );
}; 