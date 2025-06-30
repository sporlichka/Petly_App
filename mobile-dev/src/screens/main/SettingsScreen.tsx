import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { User } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import { useActivityNotifications } from '../../hooks/useActivityNotifications';

interface SettingsScreenProps {
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [isTestingNotification, setIsTestingNotification] = useState(false);

  const { getAllScheduledCount } = useActivityNotifications();

  useEffect(() => {
    loadUserInfo();
    loadNotificationStatus();
  }, []);

  const loadUserInfo = async () => {
    try {
      const storedUser = await apiService.getStoredUser();
      if (storedUser) {
        setUser(storedUser);
      } else {
        // Fallback: get from API
        const currentUser = await apiService.getCurrentUser();
        setUser(currentUser);
      }
    } catch (error) {
      console.error('Failed to load user info:', error);
    }
  };

  const loadNotificationStatus = async () => {
    try {
      const enabled = await notificationService.isNotificationEnabled();
      setNotificationEnabled(enabled);
      
      if (enabled) {
        const count = await getAllScheduledCount();
        setScheduledCount(count);
      }
    } catch (error) {
      console.error('Failed to load notification status:', error);
    }
  };

  const handleTestNotification = async () => {
    try {
      setIsTestingNotification(true);
      
      // Schedule a test notification for 5 seconds from now
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + 5);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🐾 Test Notification',
          body: 'Your PetCare notifications are working correctly!',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: testTime,
        },
      });
      
      Alert.alert(
        'Test Notification Scheduled! 📱',
        'You should receive a test notification in 5 seconds.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to schedule test notification:', error);
      Alert.alert(
        'Test Failed',
        'Unable to schedule test notification. Please check your notification permissions.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleTestActivityNotification = async () => {
    try {
      setIsTestingNotification(true);
      
      // Schedule a test activity notification for 2 minutes from now
      const testTime = new Date();
      testTime.setMinutes(testTime.getMinutes() + 2);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '🐾 Test Activity Notification',
          body: 'This is a test activity notification.',
          sound: 'default',
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: testTime,
        },
      });
      
      Alert.alert(
        'Test Activity Notification Scheduled! 🐾',
        'You should receive a test activity notification in 2 minutes.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to schedule test activity notification:', error);
      Alert.alert(
        'Test Failed',
        'Unable to schedule test activity notification. Please check your notification permissions.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsTestingNotification(false);
    }
  };

  const handleRequestNotificationPermission = async () => {
    try {
      const success = await notificationService.initialize();
      if (success) {
        setNotificationEnabled(true);
        Alert.alert(
          'Permissions Granted! ✅',
          'Notifications are now enabled for PetCare reminders.',
          [{ text: 'OK' }]
        );
        await loadNotificationStatus();
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive PetCare reminders.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to request notification permission:', error);
      Alert.alert('Error', 'Failed to request notification permissions.');
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Logout',
      'Are you sure you want to logout?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Logout',
          style: 'destructive',
          onPress: async () => {
            setIsLoading(true);
            try {
              await apiService.logout();
              onLogout();
            } catch (error) {
              Alert.alert('Error', 'Failed to logout. Please try again.');
            } finally {
              setIsLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleChangePassword = () => {
    Alert.alert('Change Password', 'This feature will be available soon!');
  };

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <View style={styles.content}>
        {/* User Info */}
        <Card variant="elevated" style={styles.userCard}>
          <View style={styles.userHeader}>
            <View style={styles.userAvatar}>
              <Ionicons name="person" size={32} color={Colors.primary} />
            </View>
            <View style={styles.userInfo}>
              <Text style={styles.userName}>{user?.username || 'User'}</Text>
              <Text style={styles.userEmail}>{user?.email || 'user@example.com'}</Text>
            </View>
          </View>
        </Card>

        {/* Notifications Section */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <Card style={styles.settingCard}>
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons 
                  name={notificationEnabled ? "notifications" : "notifications-off"} 
                  size={24} 
                  color={notificationEnabled ? Colors.success : Colors.textSecondary} 
                />
                <View style={styles.notificationInfo}>
                  <Text style={styles.settingText}>
                    {notificationEnabled ? 'Notifications Enabled' : 'Notifications Disabled'}
                  </Text>
                  {notificationEnabled && (
                    <Text style={styles.notificationSubtext}>
                      {scheduledCount} reminder{scheduledCount !== 1 ? 's' : ''} scheduled
                    </Text>
                  )}
                </View>
              </View>
              <View style={[
                styles.statusIndicator,
                { backgroundColor: notificationEnabled ? Colors.success : Colors.textSecondary }
              ]} />
            </View>
          </Card>

          {!notificationEnabled && (
            <Button
              title="Enable Notifications"
              onPress={handleRequestNotificationPermission}
              variant="outline"
              style={styles.enableButton}
            />
          )}

          {notificationEnabled && (
            <Button
              title="Test Notification"
              onPress={handleTestNotification}
              loading={isTestingNotification}
              variant="outline"
              style={styles.testButton}
            />
          )}

          {notificationEnabled && (
            <Button
              title="Test Activity Notification (2 min)"
              onPress={handleTestActivityNotification}
              loading={isTestingNotification}
              variant="outline" 
              style={[styles.testButton, { marginTop: 8 }]}
            />
          )}
        </View>

        {/* Settings Options */}
        <View style={styles.settingsSection}>
          <Text style={styles.sectionTitle}>Account</Text>
          
          <Card
            style={styles.settingCard}
            onPress={handleChangePassword}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="lock-closed-outline" size={24} color={Colors.textSecondary} />
                <Text style={styles.settingText}>Change Password</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
            </View>
          </Card>
        </View>

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appTitle}>PetCare App</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Your trusted companion for pet health and activity tracking
          </Text>
        </View>

        {/* Logout Button */}
        <View style={styles.logoutContainer}>
          <Button
            title="Logout"
            onPress={handleLogout}
            loading={isLoading}
            variant="outline"
            style={styles.logoutButton}
            textStyle={styles.logoutText}
          />
        </View>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  content: {
    flex: 1,
    padding: 24,
  },
  userCard: {
    marginBottom: 32,
  },
  userHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userAvatar: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  settingsSection: {
    marginBottom: 32,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 16,
  },
  settingCard: {
    marginBottom: 8,
  },
  settingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  settingLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  settingText: {
    fontSize: 16,
    color: Colors.text,
    marginLeft: 12,
  },
  appInfo: {
    alignItems: 'center',
    marginBottom: 40,
  },
  appTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: 4,
  },
  appVersion: {
    fontSize: 14,
    color: Colors.textLight,
    marginBottom: 8,
  },
  appDescription: {
    fontSize: 14,
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  logoutContainer: {
    marginTop: 'auto',
  },
  logoutButton: {
    borderColor: Colors.error,
  },
  logoutText: {
    color: Colors.error,
  },
  notificationInfo: {
    flex: 1,
    marginLeft: 12,
  },
  notificationSubtext: {
    fontSize: 12,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  statusIndicator: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  enableButton: {
    marginTop: 12,
    borderColor: Colors.primary,
  },
  testButton: {
    marginTop: 12,
    borderColor: Colors.success,
  },
}); 