import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications';

import { User } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';
import { notificationService } from '../../services/notificationService';
import { useActivityNotifications } from '../../hooks/useActivityNotifications';
import { setDevelopmentMode, getDevelopmentMode, loadDevelopmentMode } from '../../utils/repeatHelpers';

interface SettingsScreenProps {
  onLogout: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({ onLogout }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notificationEnabled, setNotificationEnabled] = useState(false);
  const [scheduledCount, setScheduledCount] = useState(0);
  const [isTestingNotification, setIsTestingNotification] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [testNotificationMode, setTestNotificationMode] = useState(false);

  const { getAllScheduledCount } = useActivityNotifications();

  useEffect(() => {
    loadUserInfo();
    loadNotificationStatus();
    loadTestModeState();
  }, []);

  const loadTestModeState = async () => {
    try {
      const devMode = await loadDevelopmentMode();
      setTestNotificationMode(devMode);
    } catch (error) {
      console.error('Failed to load test mode state:', error);
    }
  };

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

  const handleTestExtensionReminder = async () => {
    try {
      // Schedule extension reminder for 10 seconds from now
      const testTime = new Date();
      testTime.setSeconds(testTime.getSeconds() + 10);
      
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '⏰ Расписание активности завершилось',
          body: 'Хотите продлить расписание "Test Activity" на следующие дни?',
          sound: 'default',
          data: {
            type: 'repeat-extension',
            activityId: 999,
            originalRepeat: 'daily',
            petId: 1,
            category: 'FEEDING',
          },
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.DATE,
          date: testTime,
        },
      });
      
      Alert.alert(
        'Extension Reminder Scheduled! ⏰',
        'You should receive an extension reminder in 10 seconds.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to schedule extension reminder:', error);
      Alert.alert(
        'Test Failed',
        'Unable to schedule extension reminder. Please check your notification permissions.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleDebugNotifications = async () => {
    try {
      const { activityNotifications, extensionReminders, other } = await notificationService.getAllNotificationsByType();
      
      const totalCount = activityNotifications.length + extensionReminders.length + other.length;
      
      const debugInfo = `📊 Notification Debug Info:

📱 Total Scheduled: ${totalCount}
🔔 Activity Notifications: ${activityNotifications.length}
⏰ Extension Reminders: ${extensionReminders.length}
📝 Other Notifications: ${other.length}

${extensionReminders.length > 0 ? 
  `\n⏰ Extension Reminders:\n${extensionReminders.map((n, i) => 
    `${i + 1}. Activity ${n.content.data?.activityId} - ${new Date(n.trigger.value).toLocaleString()}`
  ).join('\n')}` : 
  '\n⏰ No extension reminders found'
}

${activityNotifications.length > 0 ? 
  `\n🔔 Activity Notifications:\n${activityNotifications.slice(0, 3).map((n, i) => 
    `${i + 1}. Activity ${n.content.data?.activityId} - ${n.content.title}`
  ).join('\n')}${activityNotifications.length > 3 ? '\n...' : ''}` : 
  '\n🔔 No activity notifications found'
}`;

      Alert.alert(
        'Notification Debug',
        debugInfo,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to debug notifications:', error);
      Alert.alert('Debug Failed', 'Unable to get notification information.');
    }
  };

  const handleNotificationInfo = () => {
    Alert.alert(
      'Notification System Info',
      `📱 How notifications work in PetCare:

🔄 REPEAT ACTIVITIES:
• Daily: Creates 8 activities (1+7 repeats) with individual notifications for each day
• Weekly: Creates 5 activities (1+4 repeats) with individual notifications for each week  
• Monthly: Creates 4 activities (1+3 repeats) with individual notifications for each month

⏰ TIMING:
• Each repeat activity gets its own separate notification scheduled for the exact date/time
• Monthly activities will receive notifications exactly 1, 2, and 3 months after the original

🔔 RELIABILITY:
• Daily/Weekly: Very reliable (system repeating notifications)
• Monthly: Reliable (individual date-based notifications)

⚠️ LIMITATIONS:
• Notifications may not work if app is uninstalled/data cleared
• System may limit notifications scheduled far in the future
• Battery optimization settings can affect delivery

💡 TIP: Use Debug button to see all scheduled notifications!`,
      [{ text: 'Got it!' }]
    );
  };

  const handleTestExtensionModal = async () => {
    try {
      // Получаем реального питомца пользователя для тестирования
      const pets = await apiService.getPets();
      
      if (pets.length === 0) {
        Alert.alert(
          'No Pets Found',
          'Please add a pet to the app first to test the extension modal.',
          [{ text: 'OK' }]
        );
        return;
      }

      const firstPet = pets[0];
      const { extensionModalService } = await import('../../services/extensionModalService');
      
      // Планируем тестовое модальное окно на текущее время с реальным питомцем
      await extensionModalService.scheduleExtensionModal({
        activityId: 999, // Тестовый ID
        activityTitle: `Test walk for ${firstPet.name}`,
        originalRepeat: 'daily',
        petId: firstPet.id,
        category: 'ACTIVITY',
        scheduledDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      });
      
      Alert.alert(
        '📋 Test Extension Modal Scheduled',
        `Created test extension modal for pet "${firstPet.name}". The modal should appear on next app restart or check via "Check Extension Modals".`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to test extension modal:', error);
              Alert.alert(
          'Error', 
          error instanceof Error && error.message.includes('Pet not found') 
            ? 'Pet not found. Make sure you have pets in the app.'
            : 'Failed to schedule test extension modal'
        );
    }
  };

  const handleDebugExtensionModals = async () => {
    try {
      const { extensionModalService } = await import('../../services/extensionModalService');
      
      const queue = await extensionModalService.getModalQueue();
      const pending = await extensionModalService.getPendingModals();
      
      const debugText = `
📋 Extension Modals Debug:

📊 Total queued: ${Object.keys(queue).length}
🔔 Ready to show: ${pending.length}

📋 Queued Modals:
${Object.entries(queue).map(([key, data]) => {
  const scheduledDate = new Date(data.scheduledDate);
  const isPending = scheduledDate <= new Date();
  return `• ${data.activityTitle} (ID: ${data.activityId})
  📅 Scheduled: ${scheduledDate.toLocaleString()}
  🔄 Repeat: ${data.originalRepeat}
  ${isPending ? '🟢 READY' : '🔵 WAITING'}`;
}).join('\n\n')}

${Object.keys(queue).length === 0 ? '📋 No extension modals in queue' : ''}
      `.trim();

      Alert.alert('📋 Extension Modals Debug', debugText);
    } catch (error) {
      console.error('Failed to debug extension modals:', error);
      Alert.alert('Error', 'Failed to get extension modals information');
    }
  };

  const handleForceCheckExtensionModals = async () => {
    try {
      const { extensionModalService } = await import('../../services/extensionModalService');
      
      const pending = await extensionModalService.getPendingModals();
      
      if (pending.length > 0) {
        Alert.alert(
          '📋 Ready Extension Modals Found!',
          `Found ${pending.length} extension modals ready to show. Restart the app to see them.`,
          [{ text: 'OK' }]
        );
      } else {
        Alert.alert(
          '📋 No Extension Modals Found',
          'No extension modals ready to show.',
          [{ text: 'OK' }]
        );
      }
    } catch (error) {
      console.error('Failed to check extension modals:', error);
      Alert.alert('Error', 'Failed to check extension modals');
    }
  };

  const handleTestWithPetSelection = async () => {
    try {
      const pets = await apiService.getPets();
      
      if (pets.length === 0) {
        Alert.alert(
          'No Pets Found',
          'Please add a pet to the app first for testing.',
          [{ text: 'OK' }]
        );
        return;
      }

      // Создаем кнопки для каждого питомца
      const petButtons = pets.slice(0, 3).map(pet => ({
        text: `🐾 ${pet.name}`,
        onPress: async () => {
          try {
            const { extensionModalService } = await import('../../services/extensionModalService');
            
            await extensionModalService.scheduleExtensionModal({
              activityId: 888, // Другой тестовый ID
              activityTitle: `Test activity for ${pet.name}`,
              originalRepeat: 'weekly', // Тестируем weekly
              petId: pet.id,
              category: 'FEEDING',
              scheduledDate: new Date().toISOString(),
              createdAt: new Date().toISOString(),
            });
            
            Alert.alert(
              '✅ Extension Modal Created!',
              `Created test extension modal for pet "${pet.name}" with weekly repeat.`,
              [{ text: 'OK' }]
            );
          } catch (error) {
            console.error('Failed to create modal for pet:', error);
            Alert.alert('Error', `Failed to create extension modal for ${pet.name}`);
          }
        },
      }));

      // Добавляем кнопку отмены
      petButtons.push({ text: 'Cancel', style: 'cancel' as any });

      Alert.alert(
        '🐾 Select Pet for Testing',
        'For which pet would you like to create a test extension modal?',
        petButtons
      );
    } catch (error) {
      console.error('Failed to load pets for testing:', error);
      Alert.alert('Error', 'Failed to load pets list');
    }
  };

  const handleDisableAllNotifications = async () => {
    try {
      Alert.alert(
        'Disable All Notifications',
        'Are you sure you want to disable all scheduled notifications? This will cancel all reminders for your pets.',
        [
          { text: 'Cancel', style: 'cancel' },
          {
            text: 'Disable All',
            style: 'destructive',
            onPress: async () => {
              setIsLoading(true);
              try {
                const success = await notificationService.cancelAllNotifications();
                if (success) {
                  setScheduledCount(0);
                  Alert.alert(
                    'All Notifications Disabled ✅',
                    'All scheduled notifications have been cancelled. You can re-enable them individually from the activities list.',
        [{ text: 'OK' }]
                  );
                } else {
                  Alert.alert('Error', 'Failed to disable all notifications. Please try again.');
                }
              } catch (error) {
                console.error('Failed to disable notifications:', error);
                Alert.alert('Error', 'Failed to disable all notifications. Please try again.');
              } finally {
                setIsLoading(false);
              }
            },
          },
        ]
      );
    } catch (error) {
      console.error('Error in handleDisableAllNotifications:', error);
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

  const validatePasswordForm = (): boolean => {
    const errors: {[key: string]: string} = {};

    if (!passwordForm.currentPassword) {
      errors.currentPassword = 'Current password is required';
    }

    if (!passwordForm.newPassword) {
      errors.newPassword = 'New password is required';
    } else if (passwordForm.newPassword.length < 6) {
      errors.newPassword = 'Password must be at least 6 characters';
    }

    if (!passwordForm.confirmPassword) {
      errors.confirmPassword = 'Please confirm your new password';
    } else if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match';
    }

    if (passwordForm.currentPassword === passwordForm.newPassword) {
      errors.newPassword = 'New password must be different from current password';
    }

    setPasswordErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleChangePassword = () => {
    setShowPasswordModal(true);
  };

  const handleSubmitPasswordChange = async () => {
    if (!validatePasswordForm()) return;

    setIsChangingPassword(true);
    try {
      await apiService.changePassword(passwordForm.currentPassword, passwordForm.newPassword);
      
      Alert.alert(
        'Password Changed Successfully! ✅',
        'Your password has been updated. You may need to log in again.',
        [
          {
            text: 'OK',
            onPress: () => {
              setShowPasswordModal(false);
              setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
              setPasswordErrors({});
            }
          }
        ]
      );
    } catch (error) {
      console.error('Failed to change password:', error);
      Alert.alert(
        'Password Change Failed',
        error instanceof Error ? error.message : 'Failed to change password. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setIsChangingPassword(false);
    }
  };

  const handleTestModeToggle = async (enabled: boolean) => {
    setTestNotificationMode(enabled);
    
    try {
      await setDevelopmentMode(enabled);
      
      Alert.alert(
        'Test Mode Updated',
        enabled 
          ? 'Extension reminders will now be scheduled for 2 minutes instead of days. Perfect for testing!'
          : 'Extension reminders will now use normal intervals (7/28/90 days).',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Failed to update test mode:', error);
      Alert.alert('Error', 'Failed to update test mode setting.');
      // Revert UI state on error
      setTestNotificationMode(!enabled);
    }
  };

  const handleDeleteProfile = () => {
    Alert.alert(
      'Delete Profile',
      '⚠️ WARNING: This action cannot be undone!\n\nThis will permanently delete:\n• Your account\n• All your pets\n• All activity records\n• All data\n\nAre you absolutely sure?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'I understand, delete everything',
          style: 'destructive',
          onPress: () => {
            // Second confirmation
            Alert.alert(
              'Final Confirmation',
              'This is your last chance to cancel. Type DELETE to confirm permanent deletion.',
              [
                { text: 'Cancel', style: 'cancel' },
                {
                  text: 'Delete Forever',
                  style: 'destructive',
                  onPress: async () => {
                    setIsLoading(true);
                    try {
                      await apiService.deleteProfile();
                      Alert.alert(
                        'Profile Deleted',
                        'Your profile has been permanently deleted.',
                        [
                          {
                            text: 'OK',
                            onPress: () => onLogout()
                          }
                        ]
                      );
                    } catch (error) {
                      console.error('Failed to delete profile:', error);
                      Alert.alert(
                        'Deletion Failed',
                        error instanceof Error ? error.message : 'Failed to delete profile. Please try again.',
                        [{ text: 'OK' }]
                      );
                    } finally {
                      setIsLoading(false);
                    }
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <ScrollView 
        style={styles.content} 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
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

          {__DEV__ && (
            <Card style={styles.settingCard}>
              <View style={styles.settingRow}>
                <View style={styles.settingLeft}>
                  <Ionicons name="flask-outline" size={24} color={Colors.primary} />
                  <View style={styles.notificationInfo}>
                    <Text style={styles.settingText}>Test Mode (Dev Only)</Text>
                    <Text style={styles.notificationSubtext}>
                      Extension reminders in 2 minutes instead of days
                    </Text>
                  </View>
                </View>
                <Switch
                  value={testNotificationMode}
                  onValueChange={handleTestModeToggle}
                  trackColor={{ false: Colors.border, true: Colors.primary + '40' }}
                  thumbColor={testNotificationMode ? Colors.primary : Colors.textLight}
                />
              </View>
            </Card>
          )}

          {!notificationEnabled && (
            <Button
              title="Enable Notifications"
              onPress={handleRequestNotificationPermission}
              variant="outline"
              style={styles.enableButton}
            />
          )}

          {notificationEnabled && (
            <>
            <Button
              title="🔔 Test Notification (5s)"
              onPress={handleTestNotification}
              loading={isTestingNotification}
              variant="outline"
              style={styles.testButton}
            />

            {__DEV__ && (
              <>
                <Button
                  title="⏰ Test Extension Reminder (10s)"
                  onPress={handleTestExtensionReminder}
                  variant="outline"
                  style={[styles.testButton, { marginTop: 8 }]}
                />
                
                <Button
                  title="🔍 Debug Notifications"
                  onPress={handleDebugNotifications}
                  variant="outline"
                  style={[styles.testButton, { marginTop: 8 }]}
                />

                <Button
                  title="ℹ️ Notification Info"
                  onPress={handleNotificationInfo}
                  variant="outline"
                  style={[styles.testButton, { marginTop: 8 }]}
                />

                <Button
                  title="📋 Test Extension Modal"
                  onPress={handleTestExtensionModal}
                  variant="outline"
                  style={[styles.testButton, { marginTop: 8 }]}
                />

                <Button
                  title="🔍 Debug Extension Modals"
                  onPress={handleDebugExtensionModals}
                  variant="outline"
                  style={[styles.testButton, { marginTop: 8 }]}
                />

                <Button
                  title="✅ Check Extension Modals"
                  onPress={handleForceCheckExtensionModals}
                  variant="outline"
                  style={[styles.testButton, { marginTop: 8 }]}
                />

                <Button
                  title="🐾 Test with Pet Selection"
                  onPress={handleTestWithPetSelection}
                  variant="outline"
                  style={[styles.testButton, { marginTop: 8 }]}
                />
              </>
            )}

            <Button
                title="🚫 Disable All Notifications"
                onPress={handleDisableAllNotifications}
                loading={isLoading}
              variant="outline" 
                style={[styles.disableButton, { marginTop: 8 }]}
                textStyle={styles.disableButtonText}
            />
            </>
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

          <Card
            style={styles.settingCard}
            onPress={handleDeleteProfile}
          >
            <View style={styles.settingRow}>
              <View style={styles.settingLeft}>
                <Ionicons name="trash-outline" size={24} color={Colors.error} />
                <Text style={[styles.settingText, { color: Colors.error }]}>Delete Profile</Text>
              </View>
              <Ionicons name="chevron-forward" size={20} color={Colors.textLight} />
        </View>
          </Card>
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

        {/* App Info */}
        <View style={styles.appInfo}>
          <Text style={styles.appTitle}>PetCare App</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            Your trusted companion for pet health and activity tracking
          </Text>
        </View>

        {/* Password Change Modal */}
        <Modal
          visible={showPasswordModal}
          animationType="slide"
          presentationStyle="formSheet"
          onRequestClose={() => setShowPasswordModal(false)}
        >
          <SafeAreaView style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Change Password</Text>
              <Button
                title="Cancel"
                variant="text"
                onPress={() => {
                  setShowPasswordModal(false);
                  setPasswordForm({ currentPassword: '', newPassword: '', confirmPassword: '' });
                  setPasswordErrors({});
                }}
                textStyle={styles.cancelButtonText}
              />
      </View>

            <ScrollView style={styles.modalContent} showsVerticalScrollIndicator={false}>
              <Input
                label="Current Password"
                placeholder="Enter your current password"
                value={passwordForm.currentPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, currentPassword: text }))}
                error={passwordErrors.currentPassword}
                secureTextEntry
                leftIcon={<Ionicons name="lock-closed-outline" size={20} color={Colors.textSecondary} />}
              />

              <Input
                label="New Password"
                placeholder="Enter your new password"
                value={passwordForm.newPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, newPassword: text }))}
                error={passwordErrors.newPassword}
                secureTextEntry
                leftIcon={<Ionicons name="key-outline" size={20} color={Colors.textSecondary} />}
              />

              <Input
                label="Confirm New Password"
                placeholder="Confirm your new password"
                value={passwordForm.confirmPassword}
                onChangeText={(text) => setPasswordForm(prev => ({ ...prev, confirmPassword: text }))}
                error={passwordErrors.confirmPassword}
                secureTextEntry
                leftIcon={<Ionicons name="checkmark-circle-outline" size={20} color={Colors.textSecondary} />}
              />

              <Button
                title="Change Password"
                onPress={handleSubmitPasswordChange}
                loading={isChangingPassword}
                style={styles.changePasswordButton}
              />
            </ScrollView>
          </SafeAreaView>
        </Modal>
      </ScrollView>
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
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: 24, // Reduced top padding to bring user data closer to top
    paddingHorizontal: 24,
    paddingBottom: 100, // Bottom padding for tab navigation
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
    marginTop: 40,
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
    marginTop: 40,
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
  disableButton: {
    borderColor: Colors.error,
  },
  disableButtonText: {
    color: Colors.error,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: Colors.text,
  },
  cancelButtonText: {
    color: Colors.primary,
  },
  modalContent: {
    flex: 1,
    padding: 24,
  },
  changePasswordButton: {
    marginTop: 24,
  },
}); 