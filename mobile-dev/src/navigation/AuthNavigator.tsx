import React from 'react';
import { createStackNavigator } from '@react-navigation/stack';
import { AuthStackParamList } from '../types';
import { LoginScreen } from '../screens/auth/LoginScreen';
import { RegisterScreen } from '../screens/auth/RegisterScreen';
import { EmailVerificationScreen } from '../screens/auth/EmailVerificationScreen';
import { EmailVerificationPendingScreen } from '../screens/auth/EmailVerificationPendingScreen';

const Stack = createStackNavigator<AuthStackParamList>();

interface AuthNavigatorProps {
  onAuthSuccess: () => void;
}

export const AuthNavigator: React.FC<AuthNavigatorProps> = ({ onAuthSuccess }) => {
  return (
    <Stack.Navigator
      initialRouteName="Login"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Login">
        {(props) => (
          <LoginScreen {...props} onAuthSuccess={onAuthSuccess} />
        )}
      </Stack.Screen>
      <Stack.Screen name="Register">
        {(props) => (
          <RegisterScreen {...props} onAuthSuccess={onAuthSuccess} />
        )}
      </Stack.Screen>
      <Stack.Screen name="EmailVerification">
        {(props) => (
          <EmailVerificationScreen {...props} />
        )}
      </Stack.Screen>
      <Stack.Screen name="EmailVerificationPending">
        {(props) => (
          <EmailVerificationPendingScreen {...props} />
        )}
      </Stack.Screen>
    </Stack.Navigator>
  );
}; 