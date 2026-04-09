import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AIScreen() {
  const handleNewChat = () => {
    router.push('/ai/history');
  };

  return (
    <View style={styles.container}>
      <View style={styles.content}>
        <Ionicons name="chatbubbles" size={80} color="#0066FF" />
        <Text style={styles.title}>AI Assistant</Text>
        <Text style={styles.subtitle}>Chat with AI to find products and get help</Text>
        
        <TouchableOpacity style={styles.button} onPress={handleNewChat}>
          <Ionicons name="add-circle-outline" size={24} color="#FFF" />
          <Text style={styles.buttonText}>View Chat History</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  content: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  title: { fontSize: 28, fontWeight: 'bold', marginTop: 20, color: '#000' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8, textAlign: 'center', marginBottom: 40 },
  button: { flexDirection: 'row', backgroundColor: '#0066FF', paddingHorizontal: 32, paddingVertical: 16, borderRadius: 12, alignItems: 'center', gap: 8 },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
