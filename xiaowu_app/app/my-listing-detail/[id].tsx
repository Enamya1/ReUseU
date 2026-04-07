import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert, TextInput } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { useLocalSearchParams, router } from 'expo-router';
import { Image } from 'expo-image';
import { normalizeImageUrl } from '@/src/config/env';
import { Ionicons } from '@expo/vector-icons';
import { Picker } from '@react-native-picker/picker';

export default function MyListingDetailScreen() {
  const { id } = useLocalSearchParams();
  const { getProductForEdit, updateProduct, markProductSold, getMetaOptions, getProductEngagement } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [engagement, setEngagement] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [editing, setEditing] = useState(false);
  
  // Edit form state
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [categoryId, setCategoryId] = useState<number | null>(null);
  const [conditionId, setConditionId] = useState<number | null>(null);
  const [categories, setCategories] = useState<any[]>([]);
  const [conditions, setConditions] = useState<any[]>([]);

  useEffect(() => {
    loadProduct();
    loadMetaOptions();
    loadEngagement();
  }, [id]);

  const loadProduct = async () => {
    try {
      setLoading(true);
      const response = await getProductForEdit(Number(id));
      if (response.product) {
        setProduct(response.product);
        setTitle(response.product.title || '');
        setDescription(response.product.description || '');
        setPrice(response.product.price?.toString() || '');
        setCategoryId(response.product.category_id);
        setConditionId(response.product.condition_level_id);
      }
    } catch (error) {
      console.error('Error loading product:', error);
      Alert.alert('Error', 'Failed to load product details');
    } finally {
      setLoading(false);
    }
  };

  const loadMetaOptions = async () => {
    try {
      const response = await getMetaOptions();
      if (response.categories) setCategories(response.categories);
      if (response.condition_levels) setConditions(response.condition_levels);
    } catch (error) {
      console.error('Error loading meta options:', error);
    }
  };

  const loadEngagement = async () => {
    try {
      const response = await getProductEngagement(Number(id));
      setEngagement(response);
    } catch (error) {
      console.error('Error loading engagement:', error);
    }
  };

  const handleSave = async () => {
    if (!title.trim() || !price) {
      Alert.alert('Required', 'Please fill in all required fields');
      return;
    }

    try {
      setSaving(true);
      await updateProduct(Number(id), {
        title: title.trim(),
        description: description.trim() || null,
        price: parseFloat(price),
        category_id: categoryId || undefined,
        condition_level_id: conditionId || undefined,
      });
      Alert.alert('Success', 'Product updated successfully');
      setEditing(false);
      loadProduct();
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to update product');
    } finally {
      setSaving(false);
    }
  };

  const handleMarkSold = async () => {
    Alert.alert(
      'Mark as Sold',
      'Are you sure you want to mark this product as sold?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Sold',
          style: 'destructive',
          onPress: async () => {
            try {
              await markProductSold(Number(id));
              Alert.alert('Success', 'Product marked as sold', [
                { text: 'OK', onPress: () => router.back() }
              ]);
            } catch (error: any) {
              Alert.alert('Error', error.message || 'Failed to mark product as sold');
            }
          }
        }
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0066FF" />
      </View>
    );
  }

  if (!product) {
    return (
      <View style={styles.center}>
        <Text style={styles.errorText}>Product not found</Text>
      </View>
    );
  }

  const primaryImage = product.images?.find((img: any) => img.is_primary) || product.images?.[0];

  return (
    <ScrollView style={styles.container}>
      {primaryImage && (
        <Image
          source={{ uri: normalizeImageUrl(primaryImage.image_url) }}
          style={styles.image}
          contentFit="cover"
        />
      )}

      <View style={styles.content}>
        {engagement && (
          <View style={styles.statsCard}>
            <Text style={styles.statsTitle}>Engagement</Text>
            <View style={styles.statsRow}>
              <View style={styles.stat}>
                <Ionicons name="eye-outline" size={24} color="#0066FF" />
                <Text style={styles.statValue}>{engagement.views || 0}</Text>
                <Text style={styles.statLabel}>Views</Text>
              </View>
              <View style={styles.stat}>
                <Ionicons name="hand-left-outline" size={24} color="#0066FF" />
                <Text style={styles.statValue}>{engagement.clicks || 0}</Text>
                <Text style={styles.statLabel}>Clicks</Text>
              </View>
            </View>
          </View>
        )}

        {editing ? (
          <View style={styles.editForm}>
            <Text style={styles.label}>Title *</Text>
            <TextInput
              style={styles.input}
              value={title}
              onChangeText={setTitle}
              placeholder="Product title"
            />

            <Text style={styles.label}>Description</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              value={description}
              onChangeText={setDescription}
              placeholder="Product description"
              multiline
              numberOfLines={4}
            />

            <Text style={styles.label}>Price *</Text>
            <TextInput
              style={styles.input}
              value={price}
              onChangeText={setPrice}
              placeholder="0.00"
              keyboardType="decimal-pad"
            />

            <View style={styles.buttonRow}>
              <TouchableOpacity 
                style={[styles.button, styles.cancelButton]} 
                onPress={() => setEditing(false)}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.button, styles.saveButton, saving && styles.buttonDisabled]} 
                onPress={handleSave}
                disabled={saving}
              >
                {saving ? (
                  <ActivityIndicator size="small" color="#FFF" />
                ) : (
                  <Text style={styles.saveButtonText}>Save</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        ) : (
          <View style={styles.detailsCard}>
            <Text style={styles.title}>{product.title}</Text>
            <Text style={styles.price}>¥{product.price}</Text>
            <Text style={styles.status}>Status: {product.status}</Text>
            {product.description && (
              <Text style={styles.description}>{product.description}</Text>
            )}
          </View>
        )}

        {!editing && product.status === 'available' && (
          <View style={styles.actions}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.editButton]} 
              onPress={() => setEditing(true)}
            >
              <Ionicons name="create-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Edit</Text>
            </TouchableOpacity>
            <TouchableOpacity 
              style={[styles.actionButton, styles.soldButton]} 
              onPress={handleMarkSold}
            >
              <Ionicons name="checkmark-circle-outline" size={20} color="#FFF" />
              <Text style={styles.actionButtonText}>Mark Sold</Text>
            </TouchableOpacity>
          </View>
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  image: { width: '100%', height: 300 },
  content: { padding: 16 },
  statsCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16 },
  statsTitle: { fontSize: 18, fontWeight: 'bold', marginBottom: 12 },
  statsRow: { flexDirection: 'row', justifyContent: 'space-around' },
  stat: { alignItems: 'center' },
  statValue: { fontSize: 24, fontWeight: 'bold', color: '#0066FF', marginTop: 8 },
  statLabel: { fontSize: 12, color: '#666', marginTop: 4 },
  detailsCard: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16 },
  title: { fontSize: 22, fontWeight: 'bold', marginBottom: 8 },
  price: { fontSize: 28, fontWeight: 'bold', color: '#0066FF', marginBottom: 8 },
  status: { fontSize: 14, color: '#666', marginBottom: 12, textTransform: 'capitalize' },
  description: { fontSize: 15, color: '#333', marginBottom: 12, lineHeight: 22 },
  editForm: { backgroundColor: '#FFF', padding: 16, borderRadius: 12, marginBottom: 16 },
  label: { fontSize: 14, fontWeight: '600', color: '#000', marginBottom: 8, marginTop: 12 },
  input: { backgroundColor: '#F5F5F5', padding: 12, borderRadius: 8, fontSize: 15 },
  textArea: { height: 100, textAlignVertical: 'top' },
  buttonRow: { flexDirection: 'row', marginTop: 20, gap: 12 },
  button: { flex: 1, padding: 14, borderRadius: 8, alignItems: 'center' },
  cancelButton: { backgroundColor: '#E0E0E0' },
  saveButton: { backgroundColor: '#0066FF' },
  buttonDisabled: { backgroundColor: '#CCC' },
  cancelButtonText: { color: '#666', fontSize: 16, fontWeight: '600' },
  saveButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  actions: { flexDirection: 'row', gap: 12, marginTop: 8 },
  actionButton: { flex: 1, flexDirection: 'row', padding: 14, borderRadius: 8, alignItems: 'center', justifyContent: 'center', gap: 8 },
  editButton: { backgroundColor: '#0066FF' },
  soldButton: { backgroundColor: '#34C759' },
  actionButtonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  errorText: { fontSize: 16, color: '#999' },
});
