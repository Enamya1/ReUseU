import React, { useState, useCallback, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { normalizeImageUrl } from '@/src/config/env';
import { router } from 'expo-router';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: Array<{
    id: number;
    title: string;
    price: number;
    currency: string;
    image: string;
  }>;
};

export default function AIAssistantScreen() {
  const { createAiSession, sendAiSessionMessage, getAiSessionMessages, getAiHistory, deleteAiHistory, renameAiHistory } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [chatTitle, setChatTitle] = useState('AI Assistant');
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    try {
      setLoading(true);
      const history = await getAiHistory({ page: 1, page_size: 1, include_messages: true });
      
      if (history.history && history.history.length > 0) {
        const latestSession = history.history[0];
        setSessionId(latestSession.session_id || null);
        setChatTitle(latestSession.title || 'AI Assistant');
        
        if (latestSession.session_id) {
          const messagesResponse = await getAiSessionMessages(latestSession.session_id);
          if (messagesResponse.messages) {
            const formattedMessages = messagesResponse.messages.map((msg: any) => ({
              id: msg.id?.toString() || Math.random().toString(),
              role: msg.message_type === 'user' ? 'user' : 'assistant',
              content: msg.message || msg.response || msg.content || '',
              timestamp: new Date(msg.created_at || Date.now()),
              products: msg.products || undefined,
            }));
            setMessages(formattedMessages);
          }
        }
      } else {
        const response = await createAiSession();
        if (response.session_id) {
          setSessionId(response.session_id);
          setMessages([{
            id: '1',
            role: 'assistant',
            content: 'What are you looking for?',
            timestamp: new Date(),
          }]);
        }
      }
    } catch (error) {
      console.error('Error initializing AI session:', error);
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'What are you looking for?',
        timestamp: new Date(),
      }]);
    } finally {
      setLoading(false);
    }
  };

  const sendMessage = async () => {
    if (!input.trim() || sending) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setSending(true);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const response = await createAiSession();
        currentSessionId = response.session_id || null;
        setSessionId(currentSessionId);
      }

      if (!currentSessionId) {
        throw new Error('Failed to create session');
      }

      const response = await sendAiSessionMessage({
        session_id: currentSessionId,
        message: userMessage.content,
        message_type: 'text',
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'I could not generate a response.',
        timestamp: new Date(),
        products: response.products ? response.products.map((p: any) => ({
          id: p.id,
          title: p.title || 'Untitled',
          price: p.price || 0,
          currency: p.currency || 'CNY',
          image: normalizeImageUrl(p.image_thumbnail_url || p.image_url || p.image) || '',
        })) : undefined,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
    } catch (error: any) {
      console.error('Error sending message:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: error.message || 'AI service unavailable.',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await createAiSession();
      if (response.session_id) {
        setSessionId(response.session_id);
        setChatTitle('AI Assistant');
        setMessages([{
          id: '1',
          role: 'assistant',
          content: 'What are you looking for?',
          timestamp: new Date(),
        }]);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create new chat');
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={styles.messageContainer}>
      <View style={[styles.messageBubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
        <Text style={[styles.messageText, item.role === 'user' ? styles.userText : styles.assistantText]}>
          {item.content}
        </Text>
        {item.products && item.products.length > 0 && (
          <View style={styles.productsContainer}>
            {item.products.map((product) => (
              <TouchableOpacity
                key={product.id}
                style={styles.productCard}
                onPress={() => router.push(`/product/${product.id}`)}
              >
                <Image
                  source={{ uri: product.image }}
                  style={styles.productImage}
                  contentFit="cover"
                />
                <View style={styles.productInfo}>
                  <Text style={styles.productTitle} numberOfLines={2}>{product.title}</Text>
                  <Text style={styles.productPrice}>{product.currency} {product.price}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Initializing AI Assistant...</Text>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={100}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Ionicons name="sparkles" size={20} color="#0066FF" />
          <Text style={styles.headerText}>{chatTitle}</Text>
        </View>
        <View style={styles.headerActions}>
          <TouchableOpacity onPress={() => router.push('/ai/voice')} style={styles.iconButton}>
            <Ionicons name="mic" size={24} color="#0066FF" />
          </TouchableOpacity>
          <TouchableOpacity onPress={handleNewChat} style={styles.iconButton}>
            <Ionicons name="add" size={24} color="#0066FF" />
          </TouchableOpacity>
        </View>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Start a conversation with AI</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Ask about products..."
          multiline
          maxLength={1000}
        />
        <TouchableOpacity 
          style={[styles.sendButton, (!input.trim() || sending) && styles.sendButtonDisabled]} 
          onPress={sendMessage}
          disabled={!input.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  headerText: { fontSize: 16, fontWeight: '600' },
  headerActions: { flexDirection: 'row', gap: 8 },
  iconButton: { padding: 8 },
  messageList: { padding: 16, flexGrow: 1 },
  messageContainer: { marginBottom: 12 },
  messageBubble: { maxWidth: '80%', padding: 12, borderRadius: 16 },
  userBubble: { alignSelf: 'flex-end', backgroundColor: '#0066FF' },
  assistantBubble: { alignSelf: 'flex-start', backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0' },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: '#FFF' },
  assistantText: { color: '#000' },
  productsContainer: { marginTop: 12, gap: 8 },
  productCard: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 8, overflow: 'hidden', padding: 8, gap: 8 },
  productImage: { width: 60, height: 60, borderRadius: 4 },
  productInfo: { flex: 1, justifyContent: 'center' },
  productTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  productPrice: { fontSize: 12, color: '#0066FF', fontWeight: '600' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0066FF', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#CCC' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
});
