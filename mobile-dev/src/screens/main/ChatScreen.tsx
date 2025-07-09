import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TextInput,
  TouchableOpacity,
  Alert,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Markdown from 'react-native-markdown-display';
import { Colors } from '../../constants/Colors';
import { apiService } from '../../services/api';
import { ChatMessage, ChatSession } from '../../types';
import { useTranslation } from 'react-i18next';

export const ChatScreen: React.FC = () => {
  const { t, i18n } = useTranslation();
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [currentMessage, setCurrentMessage] = useState('');
  const [sessionId, setSessionId] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingHistory, setIsLoadingHistory] = useState(true);
  const flatListRef = useRef<FlatList>(null);
  const suggestionChips = t('chat.suggestions', { returnObjects: true }) as string[];

  useEffect(() => {
    initializeChat();
  }, []);

  const initializeChat = async () => {
    try {
      setIsLoadingHistory(true);
      
      // Check if we have existing sessions
      const sessions = await apiService.getChatSessions();
      
      if (sessions.length > 0) {
        // Use the most recent session
        const recentSession = sessions.sort((a, b) => 
          new Date(b.update_time || b.create_time || '').getTime() - 
          new Date(a.update_time || a.create_time || '').getTime()
        )[0];
        
        setSessionId(recentSession.id);
        
        // Load messages from this session
        const sessionMessages = await apiService.getChatSessionMessages(recentSession.id);
        setMessages(sessionMessages);
      } else {
        // Add welcome message for new chat
        const welcomeMessage: ChatMessage = {
          id: 'welcome',
          content: t('chat.ai_welcome'),
          isUser: false,
          timestamp: new Date().toISOString(),
        };
        setMessages([welcomeMessage]);
      }
    } catch (error) {
      console.error('Failed to initialize chat:', error);
      Alert.alert(t('chat.error_loading_chat_history'));
    } finally {
      setIsLoadingHistory(false);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const textToSend = messageText || currentMessage.trim();
    
    if (!textToSend) return;

    // Add user message to UI immediately
    const userMessage: ChatMessage = {
      id: Date.now().toString(),
      content: textToSend,
      isUser: true,
      timestamp: new Date().toISOString(),
    };

    setMessages(prev => [...prev, userMessage]);
    setCurrentMessage('');
    setIsLoading(true);

    try {
      // Send message to AI
      const response = await apiService.sendChatMessage({
        message: textToSend,
        session_id: sessionId || undefined,
      });

      // Update session ID if it's new
      if (!sessionId) {
        setSessionId(response.session_id);
      }

      // Add AI response
      const aiMessage: ChatMessage = {
        id: (Date.now() + 1).toString(),
        content: response.response,
        isUser: false,
        timestamp: new Date().toISOString(),
      };

      setMessages(prev => [...prev, aiMessage]);

      // Scroll to bottom
      setTimeout(() => {
        flatListRef.current?.scrollToEnd({ animated: true });
      }, 100);

    } catch (error) {
      console.error('Failed to send message:', error);
      Alert.alert(t('chat.error_sending_message'));
      
      // Remove the user message on error
      setMessages(prev => prev.filter(msg => msg.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestionPress = (suggestion: string) => {
    sendMessage(suggestion);
  };

  const clearChat = () => {
    Alert.alert(
      t('chat.clear_chat'),
      t('chat.clear_chat_confirm'),
      [
        { text: t('chat.cancel'), style: 'cancel' },
        {
          text: t('chat.clear'),
          style: 'destructive',
          onPress: async () => {
            try {
              if (sessionId) {
                await apiService.clearChatSessionMessages(sessionId);
              }
              setMessages([]);
              setSessionId('');
              await initializeChat();
            } catch (error) {
              console.error('Failed to clear chat:', error);
              Alert.alert(t('chat.error_clear_chat'));
            }
          },
        },
      ]
    );
  };

  const renderMessage = ({ item }: { item: ChatMessage }) => (
    <View style={[
      styles.messageContainer,
      item.isUser ? styles.userMessageContainer : styles.aiMessageContainer
    ]}>
      {!item.isUser && (
        <View style={styles.aiAvatar}>
          <Text style={styles.aiAvatarText}>🤖</Text>
        </View>
      )}
      
      <View style={[
        styles.messageBubble,
        item.isUser ? styles.userBubble : styles.aiBubble
      ]}>
        {item.isUser ? (
          // User messages: plain text
          <Text style={[styles.messageText, styles.userText]}>
            {item.content}
          </Text>
        ) : (
          // AI messages: markdown rendering
          <Markdown style={markdownStyles}>
            {item.content || ''}
          </Markdown>
        )}
        
        {item.timestamp && (
          <Text style={[
            styles.timestamp,
            item.isUser ? styles.userTimestamp : styles.aiTimestamp
          ]}>
            {new Date(item.timestamp).toLocaleTimeString(i18n.language, { 
              hour: '2-digit', 
              minute: '2-digit' 
            })}
          </Text>
        )}
      </View>
      
      {item.isUser && (
        <View style={styles.userAvatar}>
          <Text style={styles.userAvatarText}>👤</Text>
        </View>
      )}
    </View>
  );

  const renderSuggestionChips = () => (
    <View style={styles.suggestionsContainer}>
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.suggestionsContent}
      >
        {suggestionChips.map((suggestion, index) => (
          <TouchableOpacity
            key={index}
            style={styles.suggestionChip}
            onPress={() => handleSuggestionPress(suggestion)}
          >
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );

  if (isLoadingHistory) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.loadingContainer}>
          <Text style={styles.loadingText}>{t('chat.loading_chat')}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.fullContainer} 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <SafeAreaView style={styles.container} edges={['top']}>
        {/* Header Card */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <View style={styles.headerAvatar}>
              <Text style={styles.headerAvatarText}>🤖</Text>
            </View>
            <View>
              <Text style={styles.headerTitle}>{t('chat.title')}</Text>
              <Text style={styles.headerSubtitle}>{t('chat.subtitle')}</Text>
            </View>
          </View>
          
          <TouchableOpacity onPress={clearChat} style={styles.clearButton}>
            <Text style={styles.clearButtonText}>{t('chat.clear')}</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.chatContainer}>
        {/* Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={item => item.id}
          renderItem={renderMessage}
          style={styles.messagesList}
          contentContainerStyle={styles.messagesContent}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          showsVerticalScrollIndicator={false}
        />

        {/* Suggestion Chips (only show when no messages or just welcome) */}
        {messages.length <= 1 && renderSuggestionChips()}

          {/* Input Area */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <TextInput
                style={styles.textInput}
                value={currentMessage}
                onChangeText={setCurrentMessage}
                placeholder={t('chat.placeholder')}
                placeholderTextColor={Colors.textSecondary}
                multiline
                maxLength={1000}
                onSubmitEditing={() => sendMessage()}
                blurOnSubmit={false}
              />
              
              <TouchableOpacity
                style={[
                  styles.sendButton,
                  (!currentMessage.trim() || isLoading) && styles.sendButtonDisabled
                ]}
                onPress={() => sendMessage()}
                disabled={!currentMessage.trim() || isLoading}
              >
                <Text style={styles.sendButtonText}>
                  {isLoading ? '⏳' : '➤'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  fullContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    backgroundColor: Colors.background,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    fontSize: 16,
    color: Colors.textSecondary,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: Colors.surface,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  headerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  headerAvatarText: {
    fontSize: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: Colors.text,
  },
  headerSubtitle: {
    fontSize: 14,
    color: Colors.textSecondary,
    marginTop: 2,
  },
  clearButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: Colors.error,
  },
  clearButtonText: {
    color: 'white',
    fontSize: 14,
    fontWeight: '500',
  },
  chatContainer: {
    flex: 1,
  },
  messagesList: {
    flex: 1,
  },
  messagesContent: {
    paddingVertical: 20,
    paddingBottom: 10,
  },
  messageContainer: {
    flexDirection: 'row',
    marginVertical: 6,
    paddingHorizontal: 20,
    alignItems: 'flex-end',
  },
  userMessageContainer: {
    justifyContent: 'flex-end',
  },
  aiMessageContainer: {
    justifyContent: 'flex-start',
  },
  aiAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    marginBottom: 4,
  },
  aiAvatarText: {
    fontSize: 18,
  },
  userAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.secondary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
    marginBottom: 4,
  },
  userAvatarText: {
    fontSize: 18,
  },
  messageBubble: {
    maxWidth: '70%',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 14,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userBubble: {
    backgroundColor: '#FFA726', // Darker yellow for better contrast
    borderBottomRightRadius: 6,
  },
  aiBubble: {
    backgroundColor: '#F0F0F0',
    borderBottomLeftRadius: 6,
  },
  messageText: {
    fontSize: 16,
    lineHeight: 24,
  },
  userText: {
    color: 'white',
    fontWeight: '500',
  },
  aiText: {
    color: '#2E2E2E',
  },
  timestamp: {
    fontSize: 12,
    marginTop: 6,
    opacity: 0.8,
  },
  userTimestamp: {
    color: 'rgba(255, 255, 255, 0.8)',
    textAlign: 'right',
  },
  aiTimestamp: {
    color: Colors.textSecondary,
    textAlign: 'left',
  },
  suggestionsContainer: {
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  suggestionsContent: {
    paddingVertical: 4,
  },
  suggestionChip: {
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: 16,
    paddingHorizontal: 14,
    paddingVertical: 8,
    marginRight: 10,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 1,
  },
  suggestionText: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  inputContainer: {
    backgroundColor: Colors.surface,
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    backgroundColor: Colors.background,
    borderRadius: 28,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: 18,
    paddingVertical: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    minHeight: 56,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: Colors.text,
    maxHeight: 120,
    minHeight: 32,
    textAlignVertical: 'center',
    paddingVertical: 0,
    lineHeight: 20,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 12,
    shadowColor: Colors.shadow,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
    elevation: 3,
  },
  sendButtonDisabled: {
    backgroundColor: Colors.textSecondary,
    opacity: 0.5,
  },
  sendButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: '600',
  },
});

// Markdown styles for AI messages
const markdownStyles = {
  body: {
    fontSize: 16,
    lineHeight: 24,
    color: '#2E2E2E',
    margin: 0,
  },
  paragraph: {
    marginTop: 0,
    marginBottom: 8,
    fontSize: 16,
    lineHeight: 24,
    color: '#2E2E2E',
  },
  strong: {
    fontWeight: '600' as const,
    color: '#1E1E1E',
  },
  emphasis: {
    fontStyle: 'italic' as const,
  },
  list_item: {
    flexDirection: 'row' as const,
    justifyContent: 'flex-start' as const,
    alignItems: 'flex-start' as const,
    marginBottom: 4,
  },
  bullet_list: {
    marginBottom: 8,
  },
  ordered_list: {
    marginBottom: 8,
  },
  bullet_list_icon: {
    marginLeft: 0,
    marginRight: 8,
    marginTop: 6,
    fontSize: 16,
    lineHeight: 24,
  },
  bullet_list_content: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#2E2E2E',
  },
  ordered_list_icon: {
    marginLeft: 0,
    marginRight: 8,
    marginTop: 0,
    fontSize: 16,
    lineHeight: 24,
    fontWeight: '600' as const,
  },
  ordered_list_content: {
    flex: 1,
    fontSize: 16,
    lineHeight: 24,
    color: '#2E2E2E',
  },
  code_inline: {
    backgroundColor: '#F5F5F5',
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    fontSize: 14,
    fontFamily: Platform.OS === 'ios' ? 'Menlo' : 'monospace',
  },
  blockquote: {
    backgroundColor: '#F9F9F9',
    borderLeftWidth: 4,
    borderLeftColor: Colors.primary,
    paddingLeft: 12,
    paddingVertical: 8,
    marginVertical: 8,
  },
  heading1: {
    fontSize: 20,
    fontWeight: '700' as const,
    color: '#1E1E1E',
    marginBottom: 8,
  },
  heading2: {
    fontSize: 18,
    fontWeight: '600' as const,
    color: '#1E1E1E',
    marginBottom: 6,
  },
  link: {
    color: Colors.primary,
    textDecorationLine: 'underline' as const,
  },
}; 