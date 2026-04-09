import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, Alert, TextInput, Modal } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';

type Session = {
  session_id: string;
  title: string;
  updated_at: string;
  latest_message?: { content: string };
};

export default function ChatAIScreen() {
  const { getAiHistory, deleteAiHistory, renameAiHistory, createAiSession } = useAuth();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [loading, setLoading] = useState(false);
  const [editingSession, setEditingSession] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');

  useEffect(() => {
    loadHistory();
  }, []);

  const loadHistory = async () => {
    try {
      setLoading(true);
      const response = await getAiHistory({ page: 1, page_size: 50, include_messages: true });
      setSessions(response.history || []);
    } catch (error) {
      console.error('Error loading history:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleNewChat = async () => {
    try {
      const response = await createAiSession();
      if (response.session_id) {
        router.push('/ai/assistant');
      }
    } catch (error) {
      Alert.alert('Error', 'Failed to create new chat');
    }
  };

  const handleDeleteSession = async (sessionId: string) => {
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

  const handleRenameSession = async (sessionId: string) => {
    if (!editTitle.trim()) return;
    try {
      await renameAiHistory(sessionId, editTitle.trim());
      setSessions(prev => prev.map(s => s.session_id === sessionId ? { ...s, title: editTitle.trim() } : s));
      setEditingSession(null);
      setEditTitle('');
    } catch (error) {
      Alert.alert('Error', 'Failed to rename chat');
    }
  };

  const renderSession = ({ item }: { item: Session }) => (
    <View style={styles.sessionItem}>
      {editingSession === item.session_id ? (
        <View style={styles.editContainer}>
          <TextInput
            style={styles.editInput}
            value={editTitle}
            onChangeText={setEditTitle}
            autoFocus
            placeholder="Chat title"
            placeholderTextColor="#999"
          />
          <TouchableOpacity onPress={() => handleRenameSession(item.session_id)} style={styles.editButton}>
            <Text style={styles.editButtonText}>✓</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEditingSession(null); setEditTitle(''); }} style={styles.editButton}>
            <Text style={styles.editButtonText}>✕</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <>
          <TouchableOpacity style={styles.sessionContent} onPress={() => router.push(`/ai/assistant?session_id=${item.session_id}`)}>
            <Text style={styles.sessionTitle} numberOfLines={1}>{item.title || 'New Chat'}</Text>
            <Text style={styles.sessionPreview} numberOfLines={1}>{item.latest_message?.content || ''}</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => { setEditingSession(item.session_id); setEditTitle(item.title); }} style={styles.actionButton}>
            <Text style={styles.actionIcon}>✎</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={() => handleDeleteSession(item.session_id)} style={styles.actionButton}>
            <Text style={styles.deleteIcon}>✕</Text>
          </TouchableOpacity>
        </>
      )}
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
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerText}>Chat History</Text>
        <TouchableOpacity onPress={handleNewChat} style={styles.newButton}>
          <Text style={styles.newIcon}>+</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={sessions}
        keyExtractor={item => item.session_id}
        renderItem={renderSession}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyText}>No chat history</Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFF' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF' },
  header: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#CCCCCC' },
  backButton: { padding: 8 },
  backIcon: { fontSize: 24, color: '#000' },
  headerText: { flex: 1, fontSize: 18, fontWeight: '600', color: '#000', textAlign: 'center' },
  newButton: { padding: 8 },
  newIcon: { fontSize: 28, color: '#000' },
  list: { padding: 16 },
  sessionItem: { flexDirection: 'row', alignItems: 'center', paddingVertical: 16, paddingHorizontal: 12, backgroundColor: '#FFF', borderBottomWidth: 1, borderBottomColor: '#F5F5F5' },
  sessionContent: { flex: 1 },
  sessionTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 4 },
  sessionPreview: { fontSize: 14, color: '#666' },
  actionButton: { padding: 8, marginLeft: 8 },
  actionIcon: { fontSize: 18, color: '#000' },
  deleteIcon: { fontSize: 20, color: '#000' },
  editContainer: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8 },
  editInput: { flex: 1, backgroundColor: '#F5F5F5', padding: 10, borderRadius: 8, fontSize: 15, color: '#000', borderWidth: 1, borderColor: '#CCCCCC' },
  editButton: { padding: 8 },
  editButtonText: { fontSize: 18, color: '#000' },
  empty: { flex: 1, justifyContent: 'center', alignItems: 'center', paddingTop: 100 },
  emptyText: { fontSize: 16, color: '#999' },
});
