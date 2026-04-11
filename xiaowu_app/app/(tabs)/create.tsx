import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, Image, Alert, ActivityIndicator, KeyboardAvoidingView, Platform } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../../src/contexts/AuthContext';
import { Picker } from '@react-native-picker/picker';
import { apiClient } from '../../src/services/api';

type Step = 'type' | 'details' | 'media' | 'tags' | 'review';

export default function CreateScreen() {
  const { user, getMetaOptions, getDormitoriesByUniversity, createTag } = useAuth();
  const params = useLocalSearchParams();
  const initialType = params.type as 'sell' | 'exchange' | undefined;
  const [step, setStep] = useState<Step>(initialType ? 'details' : 'type');
  const [listingType, setListingType] = useState<'sell' | 'exchange'>(initialType || 'sell');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [conditionId, setConditionId] = useState('');
  const [dormitoryId, setDormitoryId] = useState(user?.dormitory_id?.toString() || '');
  const [images, setImages] = useState<string[]>([]);
  const [primaryIndex, setPrimaryIndex] = useState(0);
  const [categories, setCategories] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);
  const [dormitories, setDormitories] = useState<any[]>([]);
  const [tags, setTags] = useState<any[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [newTagName, setNewTagName] = useState('');
  const [isCreatingTag, setIsCreatingTag] = useState(false);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [exchangeType, setExchangeType] = useState<'exchange_only' | 'exchange_or_purchase'>('exchange_only');
  const [targetTitle, setTargetTitle] = useState('');

  useEffect(() => {
    loadOptions();
  }, []);

  const loadOptions = async () => {
    try {
      setLoading(true);
      const [meta, dorms] = await Promise.all([getMetaOptions(), getDormitoriesByUniversity()]);
      setCategories(meta.categories || []);
      setConditions(meta.condition_levels || []);
      setTags(meta.tags || []);
      setDormitories(dorms.dormitories || []);
    } catch (error) {
      Alert.alert('Error', 'Failed to load options');
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tagId: number) => {
    setSelectedTags(prev => 
      prev.includes(tagId) ? prev.filter(id => id !== tagId) : [...prev, tagId]
    );
  };

  const handleCreateTag = async () => {
    const name = newTagName.trim();
    if (!name) {
      Alert.alert('Error', 'Tag name is required');
      return;
    }
    if (isCreatingTag) return;

    setIsCreatingTag(true);
    try {
      const result = await createTag({ name });
      const createdTag = result.tag;
      if (!createdTag) {
        Alert.alert('Error', result.message || 'Failed to create tag');
        return;
      }

      setTags(prev => prev.some(tag => tag.id === createdTag.id) ? prev : [createdTag, ...prev]);
      setSelectedTags(prev => prev.includes(createdTag.id) ? prev : [...prev, createdTag.id]);
      setNewTagName('');
      Alert.alert('Success', 'Tag created successfully');
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create tag');
    } finally {
      setIsCreatingTag(false);
    }
  };

  const pickImages = async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert('Permission Required', 'Camera roll permission is needed');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsMultipleSelection: true,
      quality: 0.8,
      selectionLimit: 6 - images.length,
    });

    if (!result.canceled && result.assets) {
      setImages(prev => [...prev, ...result.assets.map(a => a.uri)].slice(0, 6));
    }
  };

  const removeImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index));
    if (primaryIndex >= images.length - 1) setPrimaryIndex(Math.max(0, images.length - 2));
  };

  const canProceed = () => {
    if (step === 'type') return !!listingType;
    if (step === 'details') return title && price && categoryId && conditionId && dormitoryId;
    if (step === 'media') return images.length > 0;
    if (step === 'tags') return true;
    return true;
  };

  const handleSubmit = async () => {
    if (!canProceed()) return;

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append('title', title.trim());
      formData.append('description', description.trim());
      formData.append('price', price);
      formData.append('category_id', categoryId);
      formData.append('condition_level_id', conditionId);
      formData.append('dormitory_id', dormitoryId);
      formData.append('primary_image_index', primaryIndex.toString());

      if (selectedTags.length > 0) {
        selectedTags.forEach(tagId => {
          formData.append('tag_ids[]', tagId.toString());
        });
      }

      images.forEach((uri, index) => {
        const filename = uri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';
        formData.append('images[]', { uri, name: filename, type } as any);
      });

      const endpoint = listingType === 'exchange' ? '/api/exchange-products' : '/api/user/products';
      
      if (listingType === 'exchange') {
        formData.append('exchange_type', exchangeType);
        if (targetTitle) formData.append('target_product_title', targetTitle.trim());
      }

      await apiClient.post(endpoint, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });

      Alert.alert('Success', 'Listing created successfully!', [
        { text: 'OK', onPress: () => router.replace('/(tabs)') }
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create listing');
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Listing</Text>
        <View style={styles.steps}>
          {['type', 'details', 'media', 'tags', 'review'].map((s, i) => (
            <View key={s} style={[styles.stepDot, step === s && styles.stepDotActive]} />
          ))}
        </View>
      </View>

      <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
        {step === 'type' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>What would you like to do?</Text>
            <TouchableOpacity
              style={[styles.typeCard, listingType === 'sell' && styles.typeCardActive]}
              onPress={() => setListingType('sell')}
            >
              <Ionicons name="pricetag" size={32} color={listingType === 'sell' ? '#0066FF' : '#666'} />
              <Text style={[styles.typeTitle, listingType === 'sell' && styles.typeTextActive]}>Sell</Text>
              <Text style={styles.typeDesc}>List an item for sale</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[styles.typeCard, listingType === 'exchange' && styles.typeCardActive]}
              onPress={() => setListingType('exchange')}
            >
              <Ionicons name="swap-horizontal" size={32} color={listingType === 'exchange' ? '#0066FF' : '#666'} />
              <Text style={[styles.typeTitle, listingType === 'exchange' && styles.typeTextActive]}>Exchange</Text>
              <Text style={styles.typeDesc}>Trade with other students</Text>
            </TouchableOpacity>
          </View>
        )}

        {step === 'details' && (
          <View style={styles.section}>
            <Text style={styles.label}>Title *</Text>
            <TextInput style={styles.input} value={title} onChangeText={setTitle} placeholder="What are you selling?" />

            <Text style={styles.label}>Price *</Text>
            <TextInput style={styles.input} value={price} onChangeText={setPrice} placeholder="0.00" keyboardType="decimal-pad" />

            <Text style={styles.label}>Category *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={categoryId} onValueChange={setCategoryId}>
                <Picker.Item label="Select category" value="" />
                {categories.map(c => <Picker.Item key={c.id} label={c.name} value={c.id.toString()} />)}
              </Picker>
            </View>

            <Text style={styles.label}>Condition *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={conditionId} onValueChange={setConditionId}>
                <Picker.Item label="Select condition" value="" />
                {conditions.map(c => <Picker.Item key={c.id} label={c.name} value={c.id.toString()} />)}
              </Picker>
            </View>

            <Text style={styles.label}>Location *</Text>
            <View style={styles.pickerContainer}>
              <Picker selectedValue={dormitoryId} onValueChange={setDormitoryId}>
                <Picker.Item label="Select location" value="" />
                {dormitories.map(d => <Picker.Item key={d.id} label={d.dormitory_name} value={d.id.toString()} />)}
              </Picker>
            </View>

            <Text style={styles.label}>Description</Text>
            <TextInput style={[styles.input, styles.textArea]} value={description} onChangeText={setDescription} placeholder="Describe your item..." multiline numberOfLines={4} />

            {listingType === 'exchange' && (
              <>
                <Text style={styles.label}>Exchange Type</Text>
                <View style={styles.row}>
                  <TouchableOpacity style={[styles.chip, exchangeType === 'exchange_only' && styles.chipActive]} onPress={() => setExchangeType('exchange_only')}>
                    <Text style={[styles.chipText, exchangeType === 'exchange_only' && styles.chipTextActive]}>Exchange Only</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.chip, exchangeType === 'exchange_or_purchase' && styles.chipActive]} onPress={() => setExchangeType('exchange_or_purchase')}>
                    <Text style={[styles.chipText, exchangeType === 'exchange_or_purchase' && styles.chipTextActive]}>Exchange or Purchase</Text>
                  </TouchableOpacity>
                </View>
                <Text style={styles.label}>Looking for (optional)</Text>
                <TextInput style={styles.input} value={targetTitle} onChangeText={setTargetTitle} placeholder="What do you want in exchange?" />
              </>
            )}
          </View>
        )}

        {step === 'media' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Photos</Text>
            <TouchableOpacity style={styles.uploadBtn} onPress={pickImages} disabled={images.length >= 6}>
              <Ionicons name="camera" size={32} color="#0066FF" />
              <Text style={styles.uploadText}>Upload Photos ({images.length}/6)</Text>
            </TouchableOpacity>
            <View style={styles.imageGrid}>
              {images.map((uri, i) => (
                <View key={i} style={styles.imageItem}>
                  <Image source={{ uri }} style={styles.imagePreview} />
                  <TouchableOpacity style={styles.removeBtn} onPress={() => removeImage(i)}>
                    <Ionicons name="close-circle" size={24} color="#FF3B30" />
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.primaryBtn} onPress={() => setPrimaryIndex(i)}>
                    <Ionicons name={primaryIndex === i ? "radio-button-on" : "radio-button-off"} size={20} color="#0066FF" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        )}

        {step === 'tags' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Add Tags</Text>
            <Text style={styles.label}>Create New Tag</Text>
            <View style={styles.row}>
              <TextInput 
                style={[styles.input, { flex: 1 }]} 
                value={newTagName} 
                onChangeText={setNewTagName} 
                placeholder="Enter tag name" 
              />
              <TouchableOpacity 
                style={[styles.nextBtn, { flex: 0, paddingHorizontal: 20 }]} 
                onPress={handleCreateTag}
                disabled={isCreatingTag || !newTagName.trim()}
              >
                {isCreatingTag ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.nextText}>Create</Text>
                )}
              </TouchableOpacity>
            </View>
            
            <Text style={styles.label}>Select Tags (Optional)</Text>
            <View style={styles.tagContainer}>
              {tags.map(tag => (
                <TouchableOpacity
                  key={tag.id}
                  style={[
                    styles.tag,
                    selectedTags.includes(tag.id) && styles.tagSelected
                  ]}
                  onPress={() => toggleTag(tag.id)}
                >
                  <Text style={[
                    styles.tagText,
                    selectedTags.includes(tag.id) && styles.tagTextSelected
                  ]}>#{tag.name}</Text>
                </TouchableOpacity>
              ))}
            </View>
            {selectedTags.length > 0 && (
              <Text style={styles.tagCount}>{selectedTags.length} tag(s) selected</Text>
            )}
          </View>
        )}

        {step === 'review' && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Review Your Listing</Text>
            {images[primaryIndex] && <Image source={{ uri: images[primaryIndex] }} style={styles.reviewImage} />}
            <Text style={styles.reviewTitle}>{title}</Text>
            <Text style={styles.reviewPrice}>${price}</Text>
            {description && <Text style={styles.reviewDesc}>{description}</Text>}
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Category:</Text>
              <Text style={styles.reviewValue}>{categories.find(c => c.id.toString() === categoryId)?.name}</Text>
            </View>
            <View style={styles.reviewRow}>
              <Text style={styles.reviewLabel}>Condition:</Text>
              <Text style={styles.reviewValue}>{conditions.find(c => c.id.toString() === conditionId)?.name}</Text>
            </View>
            {selectedTags.length > 0 && (
              <View style={styles.reviewRow}>
                <Text style={styles.reviewLabel}>Tags:</Text>
                <View style={{ flex: 1, flexDirection: 'row', flexWrap: 'wrap', gap: 4, justifyContent: 'flex-end' }}>
                  {selectedTags.map(tagId => {
                    const tag = tags.find(t => t.id === tagId);
                    return tag ? (
                      <Text key={tagId} style={{ fontSize: 12, color: '#0066FF' }}>#{tag.name}</Text>
                    ) : null;
                  })}
                </View>
              </View>
            )}
          </View>
        )}
      </ScrollView>

      <View style={styles.footer}>
        {step !== 'type' && (
          <TouchableOpacity style={styles.backBtn} onPress={() => {
            const steps: Step[] = ['type', 'details', 'media', 'tags', 'review'];
            const idx = steps.indexOf(step);
            if (idx > 0) setStep(steps[idx - 1]);
          }}>
            <Text style={styles.backText}>Back</Text>
          </TouchableOpacity>
        )}
        <TouchableOpacity
          style={[styles.nextBtn, !canProceed() && styles.nextBtnDisabled]}
          onPress={() => {
            if (step === 'review') handleSubmit();
            else {
              const steps: Step[] = ['type', 'details', 'media', 'tags', 'review'];
              const idx = steps.indexOf(step);
              if (idx < steps.length - 1) setStep(steps[idx + 1]);
            }
          }}
          disabled={!canProceed() || submitting}
        >
          {submitting ? (
            <ActivityIndicator size="small" color="#FFF" />
          ) : (
            <Text style={styles.nextText}>{step === 'review' ? 'Publish' : 'Continue'}</Text>
          )}
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: { backgroundColor: '#FFF', padding: 16, borderBottomWidth: 1, borderBottomColor: '#E0E0E0' },
  headerTitle: { fontSize: 20, fontWeight: 'bold', textAlign: 'center', marginBottom: 12 },
  steps: { flexDirection: 'row', justifyContent: 'center', gap: 8 },
  stepDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: '#E0E0E0' },
  stepDotActive: { backgroundColor: '#0066FF', width: 24 },
  content: { flex: 1 },
  section: { padding: 16 },
  sectionTitle: { fontSize: 22, fontWeight: 'bold', marginBottom: 20, textAlign: 'center' },
  typeCard: { backgroundColor: '#FFF', padding: 24, borderRadius: 12, marginBottom: 16, alignItems: 'center', borderWidth: 2, borderColor: '#E0E0E0' },
  typeCardActive: { borderColor: '#0066FF', backgroundColor: '#F0F7FF' },
  typeTitle: { fontSize: 18, fontWeight: 'bold', marginTop: 12, color: '#000' },
  typeTextActive: { color: '#0066FF' },
  typeDesc: { fontSize: 14, color: '#666', marginTop: 4 },
  label: { fontSize: 14, fontWeight: '600', marginBottom: 8, marginTop: 16 },
  input: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, padding: 12, fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  pickerContainer: { backgroundColor: '#FFF', borderWidth: 1, borderColor: '#E0E0E0', borderRadius: 8, overflow: 'hidden' },
  row: { flexDirection: 'row', gap: 8 },
  chip: { flex: 1, padding: 12, borderRadius: 8, borderWidth: 1, borderColor: '#E0E0E0', alignItems: 'center' },
  chipActive: { backgroundColor: '#0066FF', borderColor: '#0066FF' },
  chipText: { fontSize: 14, color: '#666' },
  chipTextActive: { color: '#FFF', fontWeight: '600' },
  uploadBtn: { backgroundColor: '#FFF', padding: 32, borderRadius: 12, alignItems: 'center', borderWidth: 2, borderColor: '#0066FF', borderStyle: 'dashed' },
  uploadText: { fontSize: 16, color: '#0066FF', marginTop: 8, fontWeight: '600' },
  imageGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 16 },
  imageItem: { width: '31%', aspectRatio: 1, position: 'relative' },
  imagePreview: { width: '100%', height: '100%', borderRadius: 8 },
  removeBtn: { position: 'absolute', top: 4, right: 4 },
  primaryBtn: { position: 'absolute', bottom: 4, left: 4 },
  reviewImage: { width: '100%', height: 200, borderRadius: 12, marginBottom: 16 },
  reviewTitle: { fontSize: 24, fontWeight: 'bold', marginBottom: 8 },
  reviewPrice: { fontSize: 28, fontWeight: 'bold', color: '#0066FF', marginBottom: 16 },
  reviewDesc: { fontSize: 15, color: '#666', marginBottom: 16 },
  reviewRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F0F0F0' },
  reviewLabel: { fontSize: 14, color: '#666' },
  reviewValue: { fontSize: 14, fontWeight: '600' },
  footer: { flexDirection: 'row', padding: 16, backgroundColor: '#FFF', borderTopWidth: 1, borderTopColor: '#E0E0E0', gap: 12 },
  backBtn: { flex: 1, padding: 16, borderRadius: 8, backgroundColor: '#F0F0F0', alignItems: 'center' },
  backText: { fontSize: 16, fontWeight: '600', color: '#666' },
  nextBtn: { flex: 2, padding: 16, borderRadius: 8, backgroundColor: '#0066FF', alignItems: 'center' },
  nextBtnDisabled: { backgroundColor: '#CCC' },
  nextText: { fontSize: 16, fontWeight: '600', color: '#FFF' },
  tagContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  tag: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F0F0F0', borderWidth: 1, borderColor: '#E0E0E0' },
  tagSelected: { backgroundColor: '#0066FF', borderColor: '#0066FF' },
  tagText: { fontSize: 14, color: '#666' },
  tagTextSelected: { color: '#FFF', fontWeight: '600' },
  tagCount: { fontSize: 14, color: '#666', marginTop: 12, textAlign: 'center' },
});
