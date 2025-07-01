import { useState, useEffect, useCallback } from 'react';
import { Alert } from 'react-native';
import * as Notifications from 'expo-notifications';
import { 
  ExtensionModalData, 
  extensionModalService 
} from '../services/extensionModalService';
import { 
  activityExtensionService, 
  ActivityExtensionResult 
} from '../services/activityExtensionService';

export const useExtensionModal = () => {
  const [modalVisible, setModalVisible] = useState(false);
  const [currentModalData, setCurrentModalData] = useState<ExtensionModalData | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  // Проверяем наличие pending модалок при инициализации
  useEffect(() => {
    checkPendingModals();
    setupNotificationListeners();
    
    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  /**
   * Проверяет наличие модальных окон, готовых к показу
   */
  const checkPendingModals = useCallback(async () => {
    try {
      console.log('🔍 Checking for pending extension modals...');
      
      // Очистка устаревших модалок
      await extensionModalService.cleanupExpiredModals();
      
      // Получение готовых модалок
      const pendingModals = await extensionModalService.getPendingModals();
      
      if (pendingModals.length > 0) {
        console.log(`📋 Found ${pendingModals.length} pending extension modals`);
        
        // Показываем первую модалку
        const modalToShow = pendingModals[0];
        showExtensionModal(modalToShow);
      } else {
        console.log('📋 No pending extension modals found');
      }
    } catch (error) {
      console.error('Failed to check pending modals:', error);
    }
  }, []);

  /**
   * Настраивает слушатели уведомлений
   */
  const setupNotificationListeners = useCallback(() => {
    // Слушатель нажатий на уведомления
    const subscription = Notifications.addNotificationResponseReceivedListener(response => {
      const data = response.notification.request.content.data;
      
      if (data?.type === 'repeat-extension') {
        console.log('📲 Extension notification tapped:', data);
        handleExtensionNotificationTap(data);
      }
    });

    return () => subscription.remove();
  }, []);

  /**
   * Обрабатывает нажатие на уведомление о продлении
   */
  const handleExtensionNotificationTap = useCallback(async (data: any) => {
    try {
      // Создаем данные модалки из уведомления
      const modalData: ExtensionModalData = {
        activityId: data.activityId,
        activityTitle: `Activity ${data.activityId}`, // Базовое название, будет заменено
        originalRepeat: data.originalRepeat,
        petId: data.petId,
        category: data.category,
        scheduledDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
      };

      // Попытка получить более точные данные из сохраненных модалок
      const savedModals = await extensionModalService.getModalQueue();
      const savedModal = Object.values(savedModals).find(
        modal => modal.activityId === data.activityId
      );

      if (savedModal) {
        console.log('📋 Found saved modal data, using it');
        showExtensionModal(savedModal);
      } else {
        console.log('📋 No saved modal data, using notification data');
        showExtensionModal(modalData);
      }
    } catch (error) {
      console.error('Failed to handle extension notification tap:', error);
    }
  }, []);

  /**
   * Показывает модальное окно продления
   */
  const showExtensionModal = useCallback((data: ExtensionModalData) => {
    console.log(`📋 Showing extension modal for activity ${data.activityId}: ${data.activityTitle}`);
    setCurrentModalData(data);
    setModalVisible(true);
  }, []);

  /**
   * Обрабатывает продление активности
   */
  const handleExtendActivity = useCallback(async (data: ExtensionModalData): Promise<void> => {
    try {
      setIsLoading(true);
      console.log(`🔄 Extending activity ${data.activityId}`);

      const result: ActivityExtensionResult = await activityExtensionService.extendActivity(data);

      if (result.success) {
        // Удаляем модалку из очереди
        await extensionModalService.removeExtensionModal(data.activityId, data.scheduledDate);

        // Показываем успешное сообщение
        Alert.alert(
          'Activity Extended! 🎉',
          `Created ${result.newActivities.length} new records.\n${result.notificationIds.length} reminders set up.${result.extensionReminderId ? '\n\nNext extension notification scheduled!' : ''}`,
          [{ text: 'Great!' }]
        );

        console.log(`✅ Activity extension successful: ${result.newActivities.length} activities created`);
      } else {
        throw new Error(result.error || 'Failed to extend activity');
      }
    } catch (error) {
      console.error('Failed to extend activity:', error);
      
      let errorMessage = 'Failed to extend activity. Please try again.';
      
      if (error instanceof Error) {
        if (error.message.includes('Pet not found') || error.message.includes('access denied')) {
          errorMessage = 'Pet not found or access denied. The pet may have been deleted. Please check your pets list.';
        } else if (error.message.includes('network') || error.message.includes('Network')) {
          errorMessage = 'Network issue. Please check your internet connection and try again.';
        } else if (error.message.includes('unauthorized') || error.message.includes('Unauthorized')) {
          errorMessage = 'Session expired. Please log in to the app again.';
        } else {
          errorMessage = error.message;
        }
      }
      
      Alert.alert(
        'Extension Error',
        errorMessage,
        [{ text: 'OK' }]
      );
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * Обрабатывает отклонение продления
   */
  const handleDismissExtension = useCallback(async (data: ExtensionModalData): Promise<void> => {
    try {
      console.log(`❌ User dismissed extension for activity ${data.activityId}`);
      
      // Удаляем модалку из очереди
      await extensionModalService.removeExtensionModal(data.activityId, data.scheduledDate);
      
      console.log('📋 Extension modal dismissed and removed from queue');
    } catch (error) {
      console.error('Failed to dismiss extension:', error);
    }
  }, []);

  /**
   * Закрывает модальное окно
   */
  const closeModal = useCallback(() => {
    setModalVisible(false);
    setCurrentModalData(null);
    setIsLoading(false);
  }, []);

  /**
   * Ручная проверка модальных окон (для отладки)
   */
  const manualCheckModals = useCallback(async (): Promise<number> => {
    const pendingModals = await extensionModalService.getPendingModals();
    
    if (pendingModals.length > 0) {
      showExtensionModal(pendingModals[0]);
    }
    
    return pendingModals.length;
  }, [showExtensionModal]);

  return {
    // State
    modalVisible,
    currentModalData,
    isLoading,
    
    // Actions
    handleExtendActivity,
    handleDismissExtension,
    closeModal,
    checkPendingModals,
    manualCheckModals,
  };
}; 