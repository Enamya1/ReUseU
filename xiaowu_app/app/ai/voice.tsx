import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { Ionicons } from '@expo/vector-icons';

export default function AIVoiceCallScreen() {
  const { createAiSession, sendAiVoiceCallMessage } = useAuth();
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [response, setResponse] = useState('');

  useEffect(() => {
    initSession();
  }, []);

  const initSession = async () => {
    try {
      setLoading(true);
      const result = await createAiSession({ title: 'Voice Call Session' });
      if (result.session_id) {
        setSessionId(result.session_id);
      }
    } catch (error) {
      console.error('Error initializing voice session:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleRecording = () => {
    setIsRecording(!isRecording);
    // Note: Actual voice recording would require expo-av or react-native-voice
    // This is a placeholder for the UI structure
  };

  const sendVoiceMessage = async (message: string) => {
    if (!sessionId) return;
    
    try {
      setLoading(true);
      const result = await sendAiVoiceCallMessage({
        session_id: sessionId,
        message,
        audio_duration_seconds: 5,
      });
      
      if (result.voice_response?.text) {
        setResponse(result.voice_response.text);
      } else if (result.response) {
        setResponse(result.response);
      }
    } catch (error) {
      console.error('Error sending voice message:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading && !sessionId) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
        <Text style={styles.loadingText}>Initializing Voice Call...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Ionicons name="mic-circle" size={80} color="#0066FF" />
          <Text style={styles.title}>AI Voice Assistant</Text>
          <Text style={styles.subtitle}>Tap to speak</Text>
        </View>

        {transcript && (
          <View style={styles.transcriptBox}>
            <Text style={styles.label}>You said:</Text>
            <Text style={styles.transcript}>{transcript}</Text>
          </View>
        )}

        {response && (
          <View style={styles.responseBox}>
            <Text style={styles.label}>AI Response:</Text>
            <Text style={styles.response}>{response}</Text>
          </View>
        )}

        <View style={styles.controls}>
          <TouchableOpacity 
            style={[styles.recordButton, isRecording && styles.recordingButton]}
            onPress={toggleRecording}
            disabled={loading}
          >
            {loading ? (
              <ActivityIndicator size="large" color="#FFF" />
            ) : (
              <Ionicons 
                name={isRecording ? "stop-circle" : "mic"} 
                size={60} 
                color="#FFF" 
              />
            )}
          </TouchableOpacity>
          <Text style={styles.recordText}>
            {isRecording ? 'Recording...' : 'Tap to start'}
          </Text>
        </View>

        <View style={styles.info}>
          <Ionicons name="information-circle-outline" size={20} color="#666" />
          <Text style={styles.infoText}>
            Voice recording requires microphone permissions. This is a placeholder UI.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#666' },
  content: { padding: 20, alignItems: 'center' },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  title: { fontSize: 24, fontWeight: 'bold', marginTop: 16, color: '#000' },
  subtitle: { fontSize: 16, color: '#666', marginTop: 8 },
  transcriptBox: { width: '100%', backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16 },
  responseBox: { width: '100%', backgroundColor: '#E3F2FD', padding: 16, borderRadius: 12, marginBottom: 16 },
  label: { fontSize: 12, fontWeight: '600', color: '#666', marginBottom: 8 },
  transcript: { fontSize: 15, color: '#000' },
  response: { fontSize: 15, color: '#0066FF' },
  controls: { alignItems: 'center', marginVertical: 40 },
  recordButton: { 
    width: 120, 
    height: 120, 
    borderRadius: 60, 
    backgroundColor: '#0066FF', 
    justifyContent: 'center', 
    alignItems: 'center',
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  recordingButton: { backgroundColor: '#FF3B30' },
  recordText: { marginTop: 16, fontSize: 16, color: '#666' },
  info: { flexDirection: 'row', alignItems: 'center', padding: 16, backgroundColor: '#FFF9E6', borderRadius: 8, marginTop: 20 },
  infoText: { flex: 1, marginLeft: 8, fontSize: 13, color: '#666' },
});
