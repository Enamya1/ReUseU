import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { Image } from 'expo-image';
import { normalizeImageUrl } from '@/src/config/env';
import { router, useLocalSearchParams } from 'expo-router';

type Message = {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  products?: {
    id: number;
    title: string;
    price: number;
    currency: string;
    image: string;
  }[];
};

export default function AIAssistantScreen() {
  const { createAiSession, sendAiSessionMessage, getAiHistory } = useAuth();
  const { session_id } = useLocalSearchParams<{ session_id?: string }>();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (session_id) {
      loadExistingSession(session_id);
    } else {
      initSession();
    }
  }, [session_id]);

  const loadExistingSession = async (sid: string) => {
    try {
      setLoading(true);
      setSessionId(sid);
      const response = await getAiHistory({ page: 1, page_size: 1 });
      const session = response.history?.find((s: any) => s.session_id === sid);
      if (session?.messages) {
        const loadedMessages: Message[] = session.messages.map((m: any, idx: number) => ({
          id: `${m.timestamp || idx}`,
          role: m.role,
          content: m.content,
          timestamp: new Date(m.timestamp || Date.now()),
          products: m.products ? m.products.map((p: any) => ({
            id: p.id,
            title: p.title || '',
            price: p.price || 0,
            currency: p.currency || 'CNY',
            image: normalizeImageUrl(p.image_thumbnail_url || p.image_url || p.image) || '',
          })) : undefined,
        }));
        setMessages(loadedMessages);
      }
    } catch (error) {
      console.error('Error loading session:', error);
    } finally {
      setLoading(false);
    }
  };

  const initSession = async () => {
    try {
      setLoading(true);
      const response = await createAiSession();
      if (response.session_id) {
        setSessionId(response.session_id);
      }
    } catch (error) {
      console.error('Error initializing session:', error);
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
    const messageText = input.trim();
    setInput('');
    setSending(true);

    try {
      let currentSessionId = sessionId;
      if (!currentSessionId) {
        const response = await createAiSession();
        currentSessionId = response.session_id || null;
        setSessionId(currentSessionId);
      }

      if (!currentSessionId) throw new Error('Failed to create session');

      const response = await sendAiSessionMessage({
        session_id: currentSessionId,
        message: messageText,
        message_type: 'text',
      });

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.response || 'No response',
        timestamp: new Date(),
        products: response.products ? response.products.map((p: any) => ({
          id: p.id,
          title: p.title || '',
          price: p.price || 0,
          currency: p.currency || 'CNY',
          image: normalizeImageUrl(p.image_thumbnail_url || p.image_url || p.image) || '',
        })) : undefined,
      };
      
      setMessages(prev => [...prev, assistantMessage]);
      setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
    } catch (error: any) {
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Service unavailable',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setSending(false);
    }
  };

  const renderMessage = ({ item }: { item: Message }) => (
    <View style={[styles.messageRow, item.role === 'user' ? styles.userRow : styles.assistantRow]}>
      <View style={[styles.bubble, item.role === 'user' ? styles.userBubble : styles.assistantBubble]}>
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
                <Image source={{ uri: product.image }} style={styles.productImage} contentFit="cover" />
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
        <ActivityIndicator size="large" color="#000" />
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
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>AI Chat</Text>
        <TouchableOpacity onPress={() => router.push('/chat-ai')} style={styles.historyButton}>
          <Text style={styles.historyIcon}>☰</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>Ask me anything</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          placeholderTextColor="#999"
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
            <Text style={styles.sendIcon}>→</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#CCCCCC' },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, color: '#000' },
  headerText: { flex: 1, fontSize: 18, fontWeight: '600', color: '#000', textAlign: 'center' },
  historyButton: { padding: 8 },
  historyIcon: { fontSize: 24, color: '#000' },
  messageList: { padding: 16, flexGrow: 1 },
  messageRow: { marginBottom: 16 },
  userRow: { alignItems: 'flex-end' },
  assistantRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { backgroundColor: '#000' },
  assistantBubble: { backgroundColor: '#F5F5F5' },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: '#FFF' },
  assistantText: { color: '#000' },
  productsContainer: { marginTop: 12, gap: 8 },
  productCard: { flexDirection: 'row', backgroundColor: '#FFF', borderRadius: 8, padding: 8, gap: 8, borderWidth: 1, borderColor: '#CCCCCC' },
  productImage: { width: 60, height: 60, borderRadius: 4 },
  productInfo: { flex: 1, justifyContent: 'center' },
  productTitle: { fontSize: 13, fontWeight: '600', color: '#000', marginBottom: 4 },
  productPrice: { fontSize: 12, color: '#333', fontWeight: '600' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#CCCCCC', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, maxHeight: 100, fontSize: 15, color: '#000' },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#000', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#CCCCCC' },
  sendIcon: { fontSize: 20, color: '#FFF' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#999' },
});
