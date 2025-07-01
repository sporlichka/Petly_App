import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import 'react-native-gesture-handler';

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

  return (
    <SafeAreaProvider>
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
    </SafeAreaProvider>
  );
}
