import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';

import { User } from '../../types';
import { Button } from '../../components/Button';
import { Card } from '../../components/Card';
import { Input } from '../../components/Input';
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
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: '',
  });
  const [passwordErrors, setPasswordErrors] = useState<{[key: string]: string}>({});
  const [isChangingPassword, setIsChangingPassword] = useState(false);

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
          'Notifications are now enabled for Vetly AI reminders.',
          [{ text: 'OK' }]
        );
        await loadNotificationStatus();
      } else {
        Alert.alert(
          'Permission Denied',
          'Please enable notifications in your device settings to receive Vetly AI reminders.',
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
              title="🚫 Disable All Notifications"
              onPress={handleDisableAllNotifications}
              loading={isLoading}
              variant="outline" 
              style={styles.disableButton}
              textStyle={styles.disableButtonText}
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
          <Text style={styles.appTitle}>Vetly AI</Text>
          <Text style={styles.appVersion}>Version 1.0.0</Text>
          <Text style={styles.appDescription}>
            AI-powered veterinary assistant for pet health and activity tracking
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
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 100,
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
  disableButton: {
    marginTop: 12,
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