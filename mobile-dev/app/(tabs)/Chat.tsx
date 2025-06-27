import React, { useState, useRef, useEffect } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView, KeyboardAvoidingView, Platform, Modal, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Send, MessageCircle, Trash2 } from 'react-native-feather';

const CHAT_KEY = 'CHAT_MESSAGES_KEY';

type ChatMessage = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
};

export default function ChatScreen() {
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    AsyncStorage.getItem(CHAT_KEY).then(data => {
      if (data) setChatMessages(JSON.parse(data));
    });
  }, []);

  useEffect(() => {
    AsyncStorage.setItem(CHAT_KEY, JSON.stringify(chatMessages));
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [chatMessages]);

  const addChatMessage = (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => {
    setChatMessages(prev => [
      ...prev,
      {
        ...msg,
        id: Date.now().toString() + Math.random().toString(36).slice(2),
        timestamp: new Date().toISOString()
      }
    ]);
  };

  const clearChatHistory = () => {
    Alert.alert('Clear chat', 'Are you sure you want to clear the chat history?', [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Clear', style: 'destructive', onPress: () => setChatMessages([]) }
    ]);
  };

  const handleSubmit = () => {
    if (!message.trim() || isLoading) return;
    const userMessage = message.trim();
    setMessage('');
    setIsLoading(true);
    addChatMessage({ role: 'user', content: userMessage });
    // Симуляция ответа AI
    setTimeout(() => {
      addChatMessage({ role: 'assistant', content: 'AI: ' + userMessage });
      setIsLoading(false);
    }, 1200);
  };

  return (
    <View style={styles.wrapper}>
      <View style={styles.header}>
        <View>
          <Text style={styles.title}>AI Assistant</Text>
          <Text style={styles.subtitle}>Ask questions about pet care</Text>
        </View>
        {chatMessages.length > 0 && (
          <TouchableOpacity
            onPress={clearChatHistory}
            style={styles.clearBtn}
            accessibilityLabel="Clear chat history"
          >
            <Trash2 width={22} height={22} stroke="#dc2626" />
          </TouchableOpacity>
        )}
      </View>
      <View style={styles.chatBox}>
        <ScrollView
          ref={scrollViewRef}
          contentContainerStyle={styles.messagesContainer}
          keyboardShouldPersistTaps="handled"
        >
          {chatMessages.length === 0 ? (
            <View style={styles.emptyBox}>
              <View style={styles.emptyIcon}>
                <MessageCircle width={40} height={40} stroke="#d97706" />
              </View>
              <Text style={styles.emptyTitle}>Welcome to AI Assistant</Text>
              <Text style={styles.emptyText}>I'm here to help with pet care questions!</Text>
              <View style={styles.suggestionBox}>
                <Text style={styles.suggestionTitle}>Try asking about:</Text>
                <Text style={styles.suggestionItem}>• Feeding schedules and nutrition</Text>
                <Text style={styles.suggestionItem}>• Health symptoms and care</Text>
                <Text style={styles.suggestionItem}>• Exercise and activity ideas</Text>
                <Text style={styles.suggestionItem}>• Behavioral training tips</Text>
              </View>
            </View>
          ) : (
            <>
              {chatMessages.map((msg) => (
                <View
                  key={msg.id}
                  style={[
                    styles.messageRow,
                    msg.role === 'user' ? styles.userRow : styles.assistantRow
                  ]}
                >
                  <View
                    style={[
                      styles.messageBubble,
                      msg.role === 'user' ? styles.userBubble : styles.assistantBubble
                    ]}
                  >
                    <Text style={msg.role === 'user' ? styles.userText : styles.assistantText}>{msg.content}</Text>
                    <Text style={styles.timestamp}>
                      {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </Text>
                  </View>
                </View>
              ))}
              {isLoading && (
                <View style={styles.assistantRow}>
                  <View style={styles.assistantBubble}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                      <View style={styles.typingDot} />
                      <View style={[styles.typingDot, { animationDelay: '0.1s' }]} />
                      <View style={[styles.typingDot, { animationDelay: '0.2s' }]} />
                      <Text style={styles.typingText}>AI is typing...</Text>
                    </View>
                  </View>
                </View>
              )}
            </>
          )}
        </ScrollView>
      </View>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={80}
      >
        <View style={styles.inputRow}>
          <TextInput
            value={message}
            onChangeText={setMessage}
            placeholder="Ask about pet care..."
            style={styles.input}
            editable={!isLoading}
            returnKeyType="send"
            onSubmitEditing={handleSubmit}
          />
          <TouchableOpacity
            onPress={handleSubmit}
            style={[styles.sendBtn, (!message.trim() || isLoading) && { opacity: 0.5 }]}
            disabled={!message.trim() || isLoading}
          >
            <Send width={22} height={22} stroke="#000" />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { flex: 1, backgroundColor: '#fff' },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 16, paddingBottom: 0 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000' },
  subtitle: { fontSize: 14, color: '#6b7280', marginBottom: 4 },
  clearBtn: { padding: 8, borderRadius: 8, backgroundColor: '#f3f4f6' },
  chatBox: { flex: 1, backgroundColor: '#fff', borderRadius: 16, margin: 16, marginTop: 8, shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8, elevation: 2 },
  messagesContainer: { padding: 16, paddingBottom: 32 },
  emptyBox: { alignItems: 'center', marginTop: 60 },
  emptyIcon: { backgroundColor: '#fef3c7', borderRadius: 32, width: 64, height: 64, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  emptyTitle: { fontSize: 18, fontWeight: '600', marginTop: 8 },
  emptyText: { color: '#6b7280', marginTop: 4, marginBottom: 8 },
  suggestionBox: { backgroundColor: '#f9fafb', borderRadius: 12, padding: 12, marginTop: 8, width: '100%' },
  suggestionTitle: { fontSize: 13, color: '#6b7280', marginBottom: 4 },
  suggestionItem: { fontSize: 13, color: '#6b7280' },
  messageRow: { flexDirection: 'row', marginBottom: 10 },
  userRow: { justifyContent: 'flex-end' },
  assistantRow: { justifyContent: 'flex-start' },
  messageBubble: { maxWidth: '80%', borderRadius: 16, padding: 12, marginBottom: 2 },
  userBubble: { backgroundColor: '#facc15' },
  assistantBubble: { backgroundColor: '#f3f4f6' },
  userText: { color: '#000', fontSize: 15 },
  assistantText: { color: '#111', fontSize: 15 },
  timestamp: { fontSize: 11, color: '#6b7280', marginTop: 4, alignSelf: 'flex-end' },
  inputRow: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: 0, backgroundColor: '#fff' },
  input: { flex: 1, borderWidth: 1, borderColor: '#d1d5db', borderRadius: 8, padding: 10, backgroundColor: '#f9fafb', fontSize: 15, marginRight: 8 },
  sendBtn: { backgroundColor: '#facc15', borderRadius: 8, padding: 10 },
  typingDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: '#9ca3af', marginRight: 3, marginTop: 2 },
  typingText: { fontSize: 13, color: '#6b7280', marginLeft: 8 },
});
