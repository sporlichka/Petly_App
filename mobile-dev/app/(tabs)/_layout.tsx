import React from 'react';
import FontAwesome from '@expo/vector-icons/FontAwesome';
import { Link, Tabs } from 'expo-router';
import { Pressable, View, StatusBar, Platform } from 'react-native';

import Colors from '@/constants/Colors';
import { useColorScheme } from '@/components/useColorScheme';
import { useClientOnlyValue } from '@/components/useClientOnlyValue';

// You can explore the built-in icon families and icons on the web at https://icons.expo.fyi/
function TabBarIcon(props: {
  name: React.ComponentProps<typeof FontAwesome>['name'];
  color: string;
}) {
  return <FontAwesome size={28} style={{ marginBottom: -3 }} {...props} />;
}

export default function TabLayout() {
  const colorScheme = useColorScheme();

  return (
    <View style={{ flex: 1, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 }}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors[colorScheme ?? 'light'].tint,
          headerShown: false,
        }}>
        <Tabs.Screen
          name="index"
          options={{
            title: 'Home',
            tabBarIcon: ({ color }) => <TabBarIcon name="home" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Health"
          options={{
            title: 'Health',
            tabBarIcon: ({ color }) => <TabBarIcon name="heart" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Feeding"
          options={{
            title: 'Feeding',
            tabBarIcon: ({ color }) => <TabBarIcon name="cutlery" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Activity"
          options={{
            title: 'Activity',
            tabBarIcon: ({ color }) => <TabBarIcon name="bolt" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Chat"
          options={{
            title: 'Chat',
            tabBarIcon: ({ color }) => <TabBarIcon name="comments" color={color} />,
          }}
        />
        <Tabs.Screen
          name="Settings"
          options={{
            title: 'Settings',
            tabBarIcon: ({ color }) => <TabBarIcon name="cog" color={color} />,
          }}
        />
      </Tabs>
    </View>
  );
}
