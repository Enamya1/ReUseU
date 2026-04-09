import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

type Session = {
  session_id: string;
  title: string;
  created_at: string;
  updated_at: string;
  total_messages: number;
  latest_message?: { content: string; created_at: string };
};

export default function AIHistoryScreen() {
  const { getAiHistory, deleteAiHistory, renameAiHistory, createAiSession } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await getAiHistory({ page: 1, page_size: 50 });
      setSessions(response.history || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadHistory();
    setRefreshing(false);
  };

  const handleNewChat = async () => {
    try {
      const response = await createAiSession();
      if (response.session_id) {
        router.push(`/ai/chat/${response.session_id}`);
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create new chat');
    }
  };

  const handleDelete = (sessionId: string) => {
    Alert.alert('Delete Chat', 'Are you sure?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await deleteAiHistory(sessionId);
            setSessions(prev => prev.filter(s => s.session_id !== sessionId));
          } catch (error) {
            Alert.alert('Error', 'Failed to delete chat');
          }
        },
      },
    ]);
  };

  const handleRename = async (sessionId: string) => {
    if (!editTitle.trim()) return;
    try {
      await renameAiHistory(sessionId, editTitle.trim());
      setSessions(prev => prev.map(s => s.session_id === sessionId ? { ...s, title: editTitle.trim() } : s));
      setEditingId(null);
      setEditTitle('');
    } catch (error) {
      Alert.alert('Error', 'Failed to rename chat');
    }
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const hours = Math.floor(diff / 3600000);
    
    if (hours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    }
    return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  const renderSession = ({ item }: { item: Session }) => (
    <View style={styles.sessionCard}>
      {editingId === item.session_id ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editTitle}
            onChangeText={setEditTitle}
            autoFocus
            placeholder="Chat title"
          />
          <TouchableOpacity onPress={() => handleRename(item.session_id)} style={styles.iconBtn}>
            <Ionicons name="checkmark" size={24} color="#22C55E" />
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEditingId(null); setEditTitle(''); }} style={styles.iconBtn}>
            <Ionicons name="close" size={24} color="#999" />
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity 
            style={styles.sessionContent} 
            onPress={() => router.push(`/ai/chat/${item.session_id}`)}
          >
            <View style={styles.sessionHeader}>
              <Text style={styles.sessionTitle} numberOfLines={1}>{item.title || 'New Chat'}</Text>
              <Text style={styles.sessionDate}>{formatDate(item.updated_at)}</Text>
            </View>
            {item.latest_message && (
              <Text style={styles.sessionPreview} numberOfLines={2}>{item.latest_message.content}</Text>
            )}
            <Text style={styles.sessionMeta}>{item.total_messages} messages</Text>
          </TouchableOpacity>
          <View style={styles.actions}>
            <TouchableOpacity 
              onPress={() => { setEditingId(item.session_id); setEditTitle(item.title); }} 
              style={styles.iconBtn}
            >
              <Ionicons name="create-outline" size={20} color="#666" />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => handleDelete(item.session_id)} style={styles.iconBtn}>
              <Ionicons name="trash-outline" size={20} color="#EF4444" />
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Chat History</Text>
        <TouchableOpacity onPress={handleNewChat} style={styles.newBtn}>
          <Ionicons name="add" size={28} color="#0066FF" />
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={item => item.session_id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        refreshing={refreshing}
        onRefresh={onRefresh}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Ionicons name="chatbubbles-outline" size={64} color="#CCC" />
            <Text style={styles.emptyText}>No chat history</Text>
            <TouchableOpacity style={styles.emptyBtn} onPress={handleNewChat}>
              <Text style={styles.emptyBtnText}>Start New Chat</Text>
            </TouchableOpacity>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  backBtn: { padding: 8 },
  headerTitle: { flex: 1, fontSize: 18, fontWeight: '600', textAlign: 'center' },
  newBtn: { padding: 8 },
  list: { padding: 16 },
  sessionCard: { backgroundColor: '#FFF', borderRadius: 12, padding: 16, marginBottom: 12, elevation: 1 },
  sessionContent: { flex: 1 },
  sessionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  sessionTitle: { flex: 1, fontSize: 16, fontWeight: '600', color: '#000' },
  sessionDate: { fontSize: 12, color: '#999', marginLeft: 8 },
  sessionPreview: { fontSize: 14, color: '#666', marginBottom: 8 },
  sessionMeta: { fontSize: 12, color: '#999' },
  actions: { flexDirection: 'row', gap: 8, marginTop: 8 },
  iconBtn: { padding: 8 },
  editContainer: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: { flex: 1, backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, fontSize: 15, borderWidth: 1, borderColor: '#E0E0E0' },
  empty: { alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#999', marginTop: 16, marginBottom: 24 },
  emptyBtn: { backgroundColor: '#0066FF', paddingHorizontal: 24, paddingVertical: 12, borderRadius: 8 },
  emptyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
