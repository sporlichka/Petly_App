import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, Alert, ScrollView
} from 'react-native';
import { Lock, LogOut, User, CheckCircle, XCircle } from 'react-native-feather';

const MOCK_USER = {
  name: 'John Doe',
  email: 'john@example.com',
};

export default function SettingsScreen() {
  const [user] = useState(MOCK_USER);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [passwordData, setPasswordData] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [passwordMessage, setPasswordMessage] = useState<null | { type: 'success' | 'error', text: string }>(null);

  const handlePasswordChange = () => {
    setPasswordMessage(null);
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordMessage({ type: 'error', text: 'New passwords do not match' });
      return;
    }
    if (passwordData.newPassword.length < 6) {
      setPasswordMessage({ type: 'error', text: 'Password must be at least 6 characters long' });
      return;
    }
    if (passwordData.oldPassword !== 'password') { // mock check
      setPasswordMessage({ type: 'error', text: 'Current password is incorrect' });
      return;
    }
    setPasswordMessage({ type: 'success', text: 'Password changed successfully' });
    setPasswordData({ oldPassword: '', newPassword: '', confirmPassword: '' });
    setShowPasswordForm(false);
  };

  const handleLogout = () => {
    Alert.alert('Logout', 'Are you sure you want to logout?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Logout', style: 'destructive', onPress: () => {/* TODO: implement real logout */} }
    ]);
  };

  return (
    <ScrollView style={styles.wrapper} contentContainerStyle={{ padding: 16 }}>
      <View style={styles.header}>
        <Text style={styles.title}>Settings</Text>
        <Text style={styles.subtitle}>Manage your account preferences</Text>
      </View>
      {/* User Profile */}
      <View style={styles.card}>
        <View style={styles.profileRow}>
          <View style={styles.profileIcon}>
            <User width={28} height={28} stroke="#000" />
          </View>
          <View>
            <Text style={styles.profileName}>{user.name}</Text>
            <Text style={styles.profileEmail}>{user.email}</Text>
          </View>
        </View>
      </View>
      {/* Password Change */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <Lock width={24} height={24} stroke="#6b7280" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.sectionTitle}>Change Password</Text>
              <Text style={styles.sectionSub}>Update your account password</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={() => setShowPasswordForm(!showPasswordForm)}
            style={styles.yellowBtn}
          >
            <Text style={styles.yellowBtnText}>{showPasswordForm ? 'Cancel' : 'Change'}</Text>
          </TouchableOpacity>
        </View>
        {showPasswordForm && (
          <View style={styles.form}>
            <Text style={styles.label}>Current Password</Text>
            <TextInput
              value={passwordData.oldPassword}
              onChangeText={v => setPasswordData(prev => ({ ...prev, oldPassword: v }))}
              style={styles.input}
              placeholder="Current password"
              secureTextEntry
            />
            <Text style={styles.label}>New Password</Text>
            <TextInput
              value={passwordData.newPassword}
              onChangeText={v => setPasswordData(prev => ({ ...prev, newPassword: v }))}
              style={styles.input}
              placeholder="New password"
              secureTextEntry
            />
            <Text style={styles.label}>Confirm New Password</Text>
            <TextInput
              value={passwordData.confirmPassword}
              onChangeText={v => setPasswordData(prev => ({ ...prev, confirmPassword: v }))}
              style={styles.input}
              placeholder="Confirm new password"
              secureTextEntry
            />
            {passwordMessage && (
              <View style={[styles.messageBox, passwordMessage.type === 'success' ? styles.successBox : styles.errorBox]}>
                {passwordMessage.type === 'success' ? (
                  <CheckCircle width={18} height={18} stroke="#059669" />
                ) : (
                  <XCircle width={18} height={18} stroke="#dc2626" />
                )}
                <Text style={styles.messageText}>{passwordMessage.text}</Text>
              </View>
            )}
            <TouchableOpacity style={styles.yellowBtn} onPress={handlePasswordChange}>
              <Text style={styles.yellowBtnText}>Update Password</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
      {/* Logout */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            <LogOut width={24} height={24} stroke="#dc2626" />
            <View style={{ marginLeft: 10 }}>
              <Text style={styles.sectionTitle}>Logout</Text>
              <Text style={styles.sectionSub}>Sign out of your account</Text>
            </View>
          </View>
          <TouchableOpacity
            onPress={handleLogout}
            style={styles.logoutBtn}
          >
            <Text style={styles.logoutBtnText}>Logout</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  header: { marginBottom: 24 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 14, color: '#6b7280', marginTop: 4 },
  card: { backgroundColor: '#fff', borderRadius: 16, padding: 16, marginBottom: 18, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  profileRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 4 },
  profileIcon: { backgroundColor: '#facc15', borderRadius: 24, width: 48, height: 48, alignItems: 'center', justifyContent: 'center', marginRight: 12 },
  profileName: { fontSize: 18, fontWeight: '600', color: '#000' },
  profileEmail: { color: '#6b7280', fontSize: 14 },
  rowBetween: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sectionTitle: { fontSize: 16, fontWeight: '600', color: '#111827' },
  sectionSub: { fontSize: 13, color: '#6b7280' },
  yellowBtn: { backgroundColor: '#facc15', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18, marginLeft: 8 },
  yellowBtnText: { color: '#000', fontWeight: '600', fontSize: 15 },
  logoutBtn: { backgroundColor: '#fee2e2', borderRadius: 8, paddingVertical: 8, paddingHorizontal: 18, marginLeft: 8 },
  logoutBtnText: { color: '#dc2626', fontWeight: '600', fontSize: 15 },
  form: { marginTop: 18 },
  label: { fontSize: 14, fontWeight: '500', color: '#000', marginBottom: 4, marginTop: 8 },
  input: { borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, backgroundColor: '#f9fafb', fontSize: 15, marginBottom: 4 },
  messageBox: { flexDirection: 'row', alignItems: 'center', padding: 8, borderRadius: 8, marginVertical: 8 },
  successBox: { backgroundColor: '#dcfce7' },
  errorBox: { backgroundColor: '#fee2e2' },
  messageText: { marginLeft: 8, fontSize: 14 },
});
