import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { Platform, ScrollView, View } from 'react-native';
import 'react-native-gesture-handler';

import './src/i18n'; // Initialize i18n

// 🌐 Подключаем CSS стили только для веб-версии
if (Platform.OS === 'web') {
  require('./web-styles.css');
}
import { RootNavigator } from './src/navigation/RootNavigator';
import { ExtensionModal } from './src/components/ExtensionModal';
import { useExtensionModal } from './src/hooks/useExtensionModal';

export default function App() {
  const {
    modalVisible,
    currentModalData,
    handleExtendActivity,
    handleDismissExtension,
    closeModal,
  } = useExtensionModal();

  const AppContent = (
    <>
      <StatusBar style="auto" />
      <RootNavigator />
      
      {/* Глобальное модальное окно продления активностей */}
      <ExtensionModal
        visible={modalVisible}
        data={currentModalData}
        onExtend={handleExtendActivity}
        onDismiss={handleDismissExtension}
        onClose={closeModal}
      />
    </>
  );

  return (
    <SafeAreaProvider>
      {Platform.OS === 'web' ? (
        <ScrollView
          contentContainerStyle={{ 
            flexGrow: 1, 
            minHeight: '100vh' as any,
            width: '100%',
            maxWidth: '100vw' as any
          }}
          style={{ 
            flex: 1,
            width: '100%',
            maxWidth: '100vw' as any,
            overflow: 'auto' as any
          }}
          showsVerticalScrollIndicator={false}
          showsHorizontalScrollIndicator={false}
          bounces={false}
          overScrollMode="never"
        >
          {AppContent}
        </ScrollView>
      ) : (
        <View style={{ flex: 1 }}>
          {AppContent}
        </View>
      )}
    </SafeAreaProvider>
  );
}
