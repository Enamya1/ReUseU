import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';
import { Picker } from '@react-native-picker/picker';

export default function OnboardingScreen() {
  const { getUniversityOptions, updateUniversitySettings, user } = useAuth();
  const [universities, setUniversities] = useState<any[]>([]);
  const [dormitories, setDormitories] = useState<any[]>([]);
  const [selectedUniversity, setSelectedUniversity] = useState<number | null>(null);
  const [selectedDormitory, setSelectedDormitory] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(true);

  React.useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoadingOptions(true);
      const response = await getUniversityOptions();
      if (response.universities) {
        setUniversities(response.universities);
      }
      if (response.dormitories) {
        setDormitories(response.dormitories);
      }
    } catch (error) {
      console.error('Error loading options:', error);
    } finally {
      setLoadingOptions(false);
    }
  };

  const loadDormitories = async (universityId: number) => {
    try {
      const response = await getUniversityOptions(universityId);
      if (response.dormitories) {
        setDormitories(response.dormitories);
      }
    } catch (error) {
      console.error('Error loading dormitories:', error);
    }
  };

  const handleUniversityChange = (universityId: number) => {
    setSelectedUniversity(universityId);
    setSelectedDormitory(null);
    loadDormitories(universityId);
  };

  const handleComplete = async () => {
    if (!selectedUniversity || !selectedDormitory) {
      Alert.alert('Required', 'Please select both university and dormitory');
      return;
    }

    try {
      setLoading(true);
      await updateUniversitySettings({
        university_id: selectedUniversity,
        dormitory_id: selectedDormitory,
      });
      Alert.alert('Success', 'Profile setup completed!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update settings');
    } finally {
      setLoading(false);
    }
  };

  if (loadingOptions) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.header}>
        <Text style={styles.title}>Welcome to Suki!</Text>
        <Text style={styles.subtitle}>Let's set up your profile</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.label}>Select Your University</Text>
        <View style={styles.pickerContainer}>
          <Picker
            selectedValue={selectedUniversity}
            onValueChange={handleUniversityChange}
            style={styles.picker}
          >
            <Picker.Item label="Choose a university..." value={null} />
            {universities.map(uni => (
              <Picker.Item key={uni.id} label={uni.name} value={uni.id} />
            ))}
          </Picker>
        </View>
      </View>

      {selectedUniversity && (
        <View style={styles.section}>
          <Text style={styles.label}>Select Your Dormitory</Text>
          <View style={styles.pickerContainer}>
            <Picker
              selectedValue={selectedDormitory}
              onValueChange={setSelectedDormitory}
              style={styles.picker}
            >
              <Picker.Item label="Choose a dormitory..." value={null} />
              {dormitories.map(dorm => (
                <Picker.Item key={dorm.id} label={dorm.dormitory_name} value={dorm.id} />
              ))}
            </Picker>
          </View>
        </View>
      )}

      <TouchableOpacity 
        style={[styles.button, (!selectedUniversity || !selectedDormitory || loading) && styles.buttonDisabled]}
        onPress={handleComplete}
        disabled={!selectedUniversity || !selectedDormitory || loading}
      >
        {loading ? (
          <ActivityIndicator size="small" color="#FFF" />
        ) : (
          <Text style={styles.buttonText}>Complete Setup</Text>
        )}
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { padding: 20 },
  header: { alignItems: 'center', marginTop: 40, marginBottom: 40 },
  title: { fontSize: 28, fontWeight: 'bold', color: '#000', marginBottom: 8 },
  subtitle: { fontSize: 16, color: '#666' },
  section: { marginBottom: 24 },
  label: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 8 },
  pickerContainer: { backgroundColor: '#FFF', borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0' },
  picker: { height: 50 },
  button: { 
    backgroundColor: '#0066FF', 
    padding: 16, 
    borderRadius: 8, 
    alignItems: 'center',
    marginTop: 20,
  },
  buttonDisabled: { backgroundColor: '#CCC' },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
