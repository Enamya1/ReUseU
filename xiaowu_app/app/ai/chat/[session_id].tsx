import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Alert } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { useAuth } from '@/src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { normalizeImageUrl } from '@/src/config/env';

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

export default function AIChatScreen() {
  const { session_id } = useLocalSearchParams<{ session_id: string }>();
  const { sendAiSessionMessage, getAiSessionMessages } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    if (session_id) {
      loadMessages();
    }
  }, [session_id]);

  const loadMessages = async () => {
    try {
      setLoading(true);
      const response = await getAiSessionMessages(session_id);
      if (response.messages) {
        const formatted = response.messages.map((m: any) => ({
          id: m.id?.toString() || Math.random().toString(),
          role: m.message_type === 'user' ? 'user' : 'assistant',
          content: m.content || '',
          timestamp: new Date(m.created_at || Date.now()),
          products: m.products || undefined,
        }));
        setMessages(formatted);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
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
      const response = await sendAiSessionMessage({
        session_id,
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
      Alert.alert('Error', error.message || 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== userMessage.id));
    } finally {
      setSending(false);
    }
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => (
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
  ), []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView 
      style={styles.container} 
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>AI Chat</Text>
        <View style={{ width: 40 }} />
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
            <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>Start a conversation</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={input}
          onChangeText={setInput}
          placeholder="Type a message..."
          multiline
          maxLength={5000}
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
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  messageList: { padding: 16, flexGrow: 1 },
  messageRow: { marginBottom: 16 },
  userRow: { alignItems: 'flex-end' },
  assistantRow: { alignItems: 'flex-start' },
  bubble: { maxWidth: '75%', paddingHorizontal: 16, paddingVertical: 12, borderRadius: 20 },
  userBubble: { backgroundColor: '#0066FF' },
  assistantBubble: { backgroundColor: '#FFF', elevation: 1 },
  messageText: { fontSize: 15, lineHeight: 20 },
  userText: { color: '#FFF' },
  assistantText: { color: '#000' },
  productsContainer: { marginTop: 12, gap: 8 },
  productCard: { flexDirection: 'row', backgroundColor: '#F5F5F5', borderRadius: 8, padding: 8, gap: 8 },
  productImage: { width: 60, height: 60, borderRadius: 4 },
  productInfo: { flex: 1, justifyContent: 'center' },
  productTitle: { fontSize: 13, fontWeight: '600', marginBottom: 4 },
  productPrice: { fontSize: 12, color: '#0066FF', fontWeight: '600' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0', alignItems: 'center' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 10, marginRight: 8, maxHeight: 100, fontSize: 15 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0066FF', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#CCC' },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
});
