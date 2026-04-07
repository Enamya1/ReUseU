import React, { useState, useEffect, useRef, useCallback } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ActivityIndicator, Image, Alert, Modal, Keyboard } from 'react-native';
import { useLocalSearchParams, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { getMessages, sendMessage, transferMoney, createPaymentRequest, confirmPaymentRequest } from '@/src/services/messageService';
import { getUserProducts } from '@/src/services/productService';
import { normalizeImageUrl } from '@/src/config/env';
import type { Message } from '@/src/types';
import { useAuth } from '@/src/contexts/AuthContext';

export default function ChatScreen() {
  const { id, receiverId, receiverName, productId } = useLocalSearchParams();
  const { user } = useAuth();
  const [messages, setMessages] = useState<Message[]>([]);
  const [conversation, setConversation] = useState<any>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showActions, setShowActions] = useState(false);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showTransferModal, setShowTransferModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [userProducts, setUserProducts] = useState<any[]>([]);
  const [loadingProducts, setLoadingProducts] = useState(false);
  const [amount, setAmount] = useState('');
  const [currency, setCurrency] = useState('CNY');
  const [reference, setReference] = useState('');
  const [lastMessageId, setLastMessageId] = useState<number | null>(null);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const flatListRef = useRef<FlatList>(null);
  const scrollViewRef = useRef<any>(null);

  const loadMessages = useCallback(async (silent = false) => {
    if (!id || id === '0') return;
    try {
      if (!silent) setLoading(true);
      
      const response = await getMessages({
        conversation_id: Number(id),
        limit: 50,
      });
      
      // Only update conversation on initial load
      if (!silent) {
        setConversation(response.conversation);
      }
      
      if (response.messages.length > 0) {
        const latestMessageId = response.messages[response.messages.length - 1]?.id;
        
        if (silent && lastMessageId) {
          // Only add new messages
          const newMessages = response.messages.filter(
            msg => typeof msg.id === 'number' && typeof lastMessageId === 'number' && msg.id > lastMessageId
          );
          if (newMessages.length > 0) {
            setMessages(prev => [...prev, ...newMessages]);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
          }
        } else {
          // Initial load
          setMessages(response.messages);
        }
        
        if (typeof latestMessageId === 'number') {
          setLastMessageId(latestMessageId);
        }
      } else {
        if (!silent) setMessages([]);
      }
    } catch (error) {
      console.error('Error loading messages:', error);
    } finally {
      if (!silent) setLoading(false);
    }
  }, [id, lastMessageId]); // Keep dependencies minimal

  useEffect(() => {
    if (id && id !== '0') {
      loadMessages(false);
      const interval = setInterval(() => loadMessages(true), 5000);
      return () => clearInterval(interval);
    } else {
      setLoading(false);
    }
  }, [id]); // Remove loadMessages from dependencies

  useEffect(() => {
    const keyboardDidShowListener = Keyboard.addListener(
      Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow',
      () => {
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    );

    return () => {
      keyboardDidShowListener.remove();
    };
  }, []);

  const loadUserProducts = async () => {
    try {
      setLoadingProducts(true);
      const response = await getUserProducts();
      // Filter only available products
      const availableProducts = response.products.filter(p => p.status === 'available');
      setUserProducts(availableProducts);
    } catch (error) {
      console.error('Error loading user products:', error);
      Alert.alert('Error', 'Failed to load your products');
    } finally {
      setLoadingProducts(false);
    }
  };

  const handleProductMention = async (product: any) => {
    setShowProductModal(false);
    
    const actualReceiverId = conversation?.other_user?.id || Number(receiverId);
    if (!actualReceiverId) {
      Alert.alert('Error', 'Cannot send message: receiver not found');
      return;
    }

    const tempMessage: Message = {
      id: Date.now(),
      sender_id: user?.id || 0,
      sender_username: user?.username,
      message_text: `Check out this product: ${product.title}`,
      message_type: 'product_mention',
      status: 'sent',
      created_at: new Date().toISOString(),
      product: {
        id: product.id,
        seller_id: product.seller_id,
        title: product.title,
        price: product.price,
        currency: product.currency || 'CNY',
        image_url: product.images?.[0]?.image_url || product.image_thumbnail_url,
      },
    };

    setMessages(prev => [...prev, tempMessage]);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await sendMessage({
        receiver_id: actualReceiverId,
        message_text: `Check out this product: ${product.title}`,
        product_id: product.id,
      });
      
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id ? response.message_data : m
      ));
      
      if (typeof response.message_data.id === 'number') {
        setLastMessageId(response.message_data.id);
      }
      
      if (response.conversation_id && (!id || id === '0')) {
        router.replace({
          pathname: `/chat/${response.conversation_id}`,
          params: { receiverId: actualReceiverId, receiverName, productId },
        });
      }
    } catch (error: any) {
      console.error('Error sending product mention:', error);
      Alert.alert('Error', error.message || 'Failed to send product mention');
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    }
  };

  const handleSend = async () => {
    if (!inputText.trim() || sending) return;

    const actualReceiverId = conversation?.other_user?.id || Number(receiverId);
    if (!actualReceiverId) {
      Alert.alert('Error', 'Cannot send message: receiver not found');
      return;
    }

    const tempMessage: Message = {
      id: Date.now(),
      sender_id: user?.id || 0,
      sender_username: user?.username,
      message_text: inputText.trim(),
      message_type: 'text',
      status: 'sent',
      created_at: new Date().toISOString(),
    };

    setMessages(prev => [...prev, tempMessage]);
    setInputText('');
    setSending(true);
    setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);

    try {
      const response = await sendMessage({
        receiver_id: actualReceiverId,
        message_text: inputText.trim(),
        product_id: productId ? Number(productId) : undefined,
      });
      
      // Replace temp message with real one
      setMessages(prev => prev.map(m => 
        m.id === tempMessage.id ? response.message_data : m
      ));
      
      if (typeof response.message_data.id === 'number') {
        setLastMessageId(response.message_data.id);
      }
      
      // Handle new conversation
      if (response.conversation_id && (!id || id === '0')) {
        router.replace({
          pathname: `/chat/${response.conversation_id}`,
          params: { receiverId: actualReceiverId, receiverName, productId },
        });
      }
    } catch (error: any) {
      console.error('Error sending message:', error);
      Alert.alert('Error', error.message || 'Failed to send message');
      setMessages(prev => prev.filter(m => m.id !== tempMessage.id));
    } finally {
      setSending(false);
    }
  };

  const handleTransfer = async () => {
    if (!amount || !id) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0.01) {
      Alert.alert('Error', 'Amount must be at least 0.01');
      return;
    }
    try {
      const response = await transferMoney({
        conversation_id: Number(id),
        amount: amountNum,
        currency: currency.toUpperCase(),
        reference: reference || undefined,
      });
      setShowTransferModal(false);
      setAmount('');
      setReference('');
      Alert.alert('Success', response.message || 'Transfer completed successfully');
      await loadMessages(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Transfer failed');
    }
  };

  const handlePaymentRequest = async () => {
    if (!amount || !id) {
      Alert.alert('Error', 'Please enter an amount');
      return;
    }
    const amountNum = parseFloat(amount);
    if (isNaN(amountNum) || amountNum < 0.01) {
      Alert.alert('Error', 'Amount must be at least 0.01');
      return;
    }
    try {
      const response = await createPaymentRequest({
        conversation_id: Number(id),
        amount: amountNum,
        currency: currency.toUpperCase(),
        product_id: productId ? Number(productId) : undefined,
        message: reference || undefined,
      });
      setShowPaymentModal(false);
      setAmount('');
      setReference('');
      Alert.alert('Success', response.message || 'Payment request sent');
      await loadMessages(true);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create payment request');
    }
  };

  const handleConfirmPayment = async (requestId: number) => {
    if (!requestId) {
      Alert.alert('Error', 'Invalid payment request');
      return;
    }
    Alert.alert(
      'Confirm Payment',
      'Are you sure you want to pay this request?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Pay',
          onPress: async () => {
            try {
              const response = await confirmPaymentRequest(requestId);
              Alert.alert('Success', response.message || 'Payment completed');
              await loadMessages(true);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Payment failed');
            }
          },
        },
      ]
    );
  };

  const renderMessage = useCallback(({ item }: { item: Message }) => {
    const isMe = item.sender_id === user?.id;
    const messageText = item.message_text || item.content || '';

    if (item.message_type === 'payment_request') {
      const isPending = item.payment_request_status === 'pending';
      const isReceiver = !isMe;
      return (
        <View style={[styles.messageContainer, styles.systemMessage]}>
          <View style={[styles.paymentBubble, { backgroundColor: isPending ? '#FFF3CD' : '#D4EDDA' }]}>
            <Text style={styles.paymentTitle}>💳 Payment Request</Text>
            <Text style={styles.paymentAmount}>
              {item.transfer_data?.currency || 'CNY'} {item.transfer_data?.amount || 0}
            </Text>
            {item.transfer_data?.message && (
              <Text style={styles.paymentRef}>{item.transfer_data.message}</Text>
            )}
            {item.message_text && (
              <Text style={styles.paymentRef}>{item.message_text}</Text>
            )}
            {isPending && isReceiver && item.transfer_data?.payment_request_id && (
              <TouchableOpacity
                style={styles.payButton}
                onPress={() => handleConfirmPayment(item.transfer_data.payment_request_id)}
              >
                <Text style={styles.payButtonText}>Pay Now</Text>
              </TouchableOpacity>
            )}
            {isPending && isMe && (
              <Text style={styles.pendingText}>⏳ Pending</Text>
            )}
            {!isPending && <Text style={styles.paidText}>✓ Paid</Text>}
          </View>
        </View>
      );
    }

    if (item.message_type === 'transfer' || item.message_type === 'payment_confirmation') {
      const title = item.message_type === 'transfer' ? '💸 Transfer' : '✅ Payment Confirmed';
      return (
        <View style={[styles.messageContainer, styles.systemMessage]}>
          <View style={[styles.paymentBubble, { backgroundColor: '#D1ECF1' }]}>
            <Text style={styles.paymentTitle}>{title}</Text>
            <Text style={styles.paymentAmount}>
              {item.transfer_data?.currency || 'CNY'} {item.transfer_data?.amount || 0}
            </Text>
            {item.transfer_data?.reference && (
              <Text style={styles.paymentRef}>{item.transfer_data.reference}</Text>
            )}
            {item.message_text && (
              <Text style={styles.paymentRef}>{item.message_text}</Text>
            )}
            <Text style={styles.transferFrom}>
              {isMe ? 'You sent' : `From ${item.sender_username || 'User'}`}
            </Text>
          </View>
        </View>
      );
    }

    if (item.message_type === 'product_mention' && item.product) {
      console.log('Rendering product mention:', item.product);
      const productImageUrl = item.product.image_url || item.product?.images?.[0]?.image_url;
      
      return (
        <View style={[styles.messageContainer, styles.systemMessage]}>
          <TouchableOpacity
            style={styles.productBubble}
            onPress={() => router.push(`/product/${item.product?.id}`)}
          >
            {productImageUrl ? (
              <Image 
                source={{ uri: normalizeImageUrl(productImageUrl) }} 
                style={styles.productImage}
                resizeMode="cover"
                onError={(e) => console.log('Image load error:', e.nativeEvent.error)}
              />
            ) : (
              <View style={[styles.productImage, { backgroundColor: '#F0F0F0', justifyContent: 'center', alignItems: 'center' }]}>
                <Ionicons name="image-outline" size={48} color="#CCC" />
              </View>
            )}
            <View style={styles.productInfo}>
              <Text style={styles.productTitle}>🛍️ {item.product.title}</Text>
              <Text style={styles.productPrice}>
                {item.product.currency || 'CNY'} {item.product.price}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.messageContainer, isMe ? styles.myMessage : styles.theirMessage]}>
        <View style={[styles.messageBubble, { backgroundColor: isMe ? '#0066FF' : '#F0F0F0' }]}>
          {item.image_url && (
            <Image source={{ uri: normalizeImageUrl(item.image_url) }} style={styles.messageImage} />
          )}
          {messageText && (
            <Text style={[styles.messageText, { color: isMe ? '#FFF' : '#000' }]}>
              {messageText}
            </Text>
          )}
        </View>
        <Text style={styles.messageTime}>
          {new Date(item.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </Text>
      </View>
    );
  }, [user?.id, handleConfirmPayment]);

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
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
    >
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{receiverName || conversation?.other_user?.username || 'Chat'}</Text>
        <TouchableOpacity onPress={() => setShowActions(!showActions)} style={styles.moreButton}>
          <Ionicons name="ellipsis-vertical" size={24} color="#000" />
        </TouchableOpacity>
      </View>

      {showActions && (
        <View style={styles.actionsMenu}>
          <TouchableOpacity style={styles.actionItem} onPress={() => { setShowTransferModal(true); setShowActions(false); }}>
            <Ionicons name="cash-outline" size={20} color="#0066FF" />
            <Text style={styles.actionText}>Send Money</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => { setShowPaymentModal(true); setShowActions(false); }}>
            <Ionicons name="card-outline" size={20} color="#0066FF" />
            <Text style={styles.actionText}>Request Payment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionItem} onPress={() => { loadUserProducts(); setShowProductModal(true); setShowActions(false); }}>
            <Ionicons name="pricetag-outline" size={20} color="#0066FF" />
            <Text style={styles.actionText}>Mention Product</Text>
          </TouchableOpacity>
        </View>
      )}

      <FlatList
        ref={flatListRef}
        data={messages}
        renderItem={renderMessage}
        keyExtractor={(item, index) => `msg-${item.id}-${index}`}
        contentContainerStyle={styles.messageList}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
        removeClippedSubviews={true}
        maxToRenderPerBatch={10}
        updateCellsBatchingPeriod={50}
        windowSize={21}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No messages yet</Text>
          </View>
        }
      />

      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          value={inputText}
          onChangeText={setInputText}
          placeholder="Type a message..."
          multiline
          maxLength={2000}
          onFocus={() => {
            setIsInputFocused(true);
            setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 300);
          }}
          onBlur={() => setIsInputFocused(false)}
        />
        <TouchableOpacity
          style={[styles.sendButton, (!inputText.trim() || sending) && styles.sendButtonDisabled]}
          onPress={handleSend}
          disabled={!inputText.trim() || sending}
        >
          {sending ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Ionicons name="send" size={20} color="#FFF" />
          )}
        </TouchableOpacity>
      </View>

      <Modal visible={showTransferModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Send Money</Text>
            <TextInput style={styles.modalInput} placeholder="Amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.modalInput} placeholder="Currency (CNY, USD)" value={currency} onChangeText={setCurrency} />
            <TextInput style={styles.modalInput} placeholder="Reference (optional)" value={reference} onChangeText={setReference} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowTransferModal(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handleTransfer}>
                <Text style={styles.modalButtonPrimaryText}>Send</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showPaymentModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Request Payment</Text>
            <TextInput style={styles.modalInput} placeholder="Amount" keyboardType="decimal-pad" value={amount} onChangeText={setAmount} />
            <TextInput style={styles.modalInput} placeholder="Currency (CNY, USD)" value={currency} onChangeText={setCurrency} />
            <TextInput style={styles.modalInput} placeholder="Message (optional)" value={reference} onChangeText={setReference} />
            <View style={styles.modalButtons}>
              <TouchableOpacity style={styles.modalButton} onPress={() => setShowPaymentModal(false)}>
                <Text>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.modalButton, styles.modalButtonPrimary]} onPress={handlePaymentRequest}>
                <Text style={styles.modalButtonPrimaryText}>Request</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      <Modal visible={showProductModal} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, styles.productModalContent]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Product to Mention</Text>
              <TouchableOpacity onPress={() => setShowProductModal(false)}>
                <Ionicons name="close" size={24} color="#000" />
              </TouchableOpacity>
            </View>
            {loadingProducts ? (
              <ActivityIndicator size="large" color="#0066FF" style={{ marginVertical: 20 }} />
            ) : userProducts.length === 0 ? (
              <View style={styles.emptyProducts}>
                <Text style={styles.emptyProductsText}>No available products</Text>
              </View>
            ) : (
              <FlatList
                data={userProducts}
                keyExtractor={(item) => item.id.toString()}
                renderItem={({ item }) => (
                  <TouchableOpacity
                    style={styles.productItem}
                    onPress={() => handleProductMention(item)}
                  >
                    {(item.images?.[0]?.image_url || item.image_thumbnail_url) && (
                      <Image
                        source={{ uri: normalizeImageUrl(item.images?.[0]?.image_url || item.image_thumbnail_url) }}
                        style={styles.productItemImage}
                      />
                    )}
                    <View style={styles.productItemInfo}>
                      <Text style={styles.productItemTitle} numberOfLines={2}>{item.title}</Text>
                      <Text style={styles.productItemPrice}>{item.currency || 'CNY'} {item.price}</Text>
                    </View>
                  </TouchableOpacity>
                )}
                style={styles.productList}
              />
            )}
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', padding: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backButton: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  moreButton: { padding: 8 },
  actionsMenu: { backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0', padding: 8 },
  actionItem: { flexDirection: 'row', alignItems: 'center', padding: 12, gap: 8 },
  actionText: { fontSize: 15, color: '#0066FF' },
  messageList: { padding: 16, flexGrow: 1 },
  messageContainer: { marginBottom: 12, maxWidth: '80%' },
  myMessage: { alignSelf: 'flex-end', alignItems: 'flex-end' },
  theirMessage: { alignSelf: 'flex-start', alignItems: 'flex-start' },
  systemMessage: { alignSelf: 'center', maxWidth: '90%' },
  messageBubble: { padding: 12, borderRadius: 16, maxWidth: '100%' },
  messageText: { fontSize: 15, lineHeight: 20 },
  messageImage: { width: 200, height: 200, borderRadius: 8, marginBottom: 8 },
  messageTime: { fontSize: 11, color: '#999', marginTop: 4 },
  paymentBubble: { padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', alignItems: 'center' },
  paymentTitle: { fontSize: 14, fontWeight: '600', marginBottom: 8 },
  paymentAmount: { fontSize: 20, fontWeight: 'bold', color: '#0066FF', marginBottom: 4 },
  paymentRef: { fontSize: 12, color: '#666', marginBottom: 8, textAlign: 'center' },
  payButton: { backgroundColor: '#0066FF', paddingHorizontal: 20, paddingVertical: 8, borderRadius: 8, marginTop: 8 },
  payButtonText: { color: '#FFF', fontWeight: '600' },
  paidText: { color: '#22C55E', fontWeight: '600', marginTop: 8 },
  pendingText: { color: '#FF9800', fontWeight: '600', marginTop: 8 },
  transferFrom: { fontSize: 11, color: '#888', marginTop: 4 },
  productBubble: { backgroundColor: '#FFF', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#DDD', overflow: 'hidden' },
  productImage: { width: '100%', height: 150, borderRadius: 8, marginBottom: 8 },
  productInfo: { paddingHorizontal: 4 },
  productTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  productPrice: { fontSize: 16, fontWeight: 'bold', color: '#0066FF' },
  inputContainer: { flexDirection: 'row', padding: 12, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  input: { flex: 1, backgroundColor: '#F5F5F5', borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8, marginRight: 8, maxHeight: 100 },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#0066FF', justifyContent: 'center', alignItems: 'center' },
  sendButtonDisabled: { backgroundColor: '#CCC' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { marginTop: 16, fontSize: 16, color: '#999' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' },
  modalContent: { backgroundColor: '#FFF', borderRadius: 12, padding: 20, width: '80%' },
  modalTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 16 },
  modalInput: { borderWidth: 1, borderColor: '#DDD', borderRadius: 8, padding: 12, marginBottom: 12 },
  modalButtons: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 8 },
  modalButton: { flex: 1, padding: 12, borderRadius: 8, alignItems: 'center', marginHorizontal: 4, backgroundColor: '#F0F0F0' },
  modalButtonPrimary: { backgroundColor: '#0066FF' },
  modalButtonPrimaryText: { color: '#FFF', fontWeight: '600' },
  productModalContent: { width: '90%', maxHeight: '80%' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  productList: { maxHeight: 400 },
  productItem: { flexDirection: 'row', padding: 12, backgroundColor: '#F5F5F5', borderRadius: 8, marginBottom: 8 },
  productItemImage: { width: 60, height: 60, borderRadius: 8, marginRight: 12 },
  productItemInfo: { flex: 1, justifyContent: 'center' },
  productItemTitle: { fontSize: 14, fontWeight: '600', marginBottom: 4 },
  productItemPrice: { fontSize: 14, color: '#0066FF', fontWeight: 'bold' },
  emptyProducts: { padding: 40, alignItems: 'center' },
  emptyProductsText: { fontSize: 14, color: '#999' },
});
