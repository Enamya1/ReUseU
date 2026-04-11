/**
 * Create Listing Screen
 * Create new product listing
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { FormTextInput, FormTextArea } from '../src/components/forms/TextInput';
import { Select } from '../src/components/forms/Select';
import { FormImagePicker } from '../src/components/forms/ImagePicker';
import { Button } from '../src/components/ui/Button';
import { metaApi, productsApi } from '../src/services/api';

export default function CreateListingScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [price, setPrice] = useState('');
  const [category, setCategory] = useState<number | undefined>();
  const [condition, setCondition] = useState<number | undefined>();
  const [images, setImages] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState<{ value: number; label: string }[]>([]);
  const [conditions, setConditions] = useState<{ value: number; label: string }[]>([]);

  useEffect(() => {
    loadMetadata();
  }, []);

  const loadMetadata = async () => {
    try {
      const response = await metaApi.getOptions();
      
      if (response.categories) {
        setCategories(
          response.categories.map((cat: any) => ({
            value: cat.id,
            label: cat.name,
          }))
        );
      }
      
      if (response.condition_levels) {
        setConditions(
          response.condition_levels.map((cond: any) => ({
            value: cond.id,
            label: cond.name,
          }))
        );
      }
    } catch (error) {
      console.error('Error loading metadata:', error);
    }
  };

  const handleSubmit = async () => {
    if (!title || !price || !category || !condition) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (images.length === 0) {
      Alert.alert('Error', 'Please add at least one image');
      return;
    }

    setIsLoading(true);
    try {
      const formData = new FormData();
      
      formData.append('title', title);
      formData.append('description', description);
      formData.append('price', price);
      formData.append('category_id', category.toString());
      formData.append('condition_level_id', condition.toString());
      
      images.forEach((imageUri, index) => {
        const filename = imageUri.split('/').pop() || `image_${index}.jpg`;
        const match = /\.(\w+)$/.exec(filename);
        const type = match ? `image/${match[1]}` : 'image/jpeg';

        formData.append('images', {
          uri: imageUri,
          name: filename,
          type,
        } as any);
      });

      await productsApi.create(formData);
      
      Alert.alert('Success', 'Product created successfully!', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to create product');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
        keyboardShouldPersistTaps="handled"
      >
        {/* Images */}
        <FormImagePicker
          images={images}
          onChange={setImages}
          maxImages={5}
          label="Photos"
        />

        {/* Basic Info */}
        <View style={styles.section}>
          <FormTextInput
            label="Title"
            placeholder="What are you selling?"
            value={title}
            onChangeText={setTitle}
            required
          />

          <FormTextArea
            label="Description"
            placeholder="Describe your item..."
            value={description}
            onChangeText={setDescription}
            rows={4}
          />

          <FormTextInput
            label="Price"
            placeholder="0.00"
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            required
          />
        </View>

        {/* Category & Condition */}
        <View style={styles.section}>
          <Select
            label="Category"
            options={categories}
            value={category}
            onChange={(val) => setCategory(val as number)}
            placeholder="Select category"
            required
          />

          <Select
            label="Condition"
            options={conditions}
            value={condition}
            onChange={(val) => setCondition(val as number)}
            placeholder="Select condition"
            required
          />
        </View>

        {/* Submit Button */}
        <View style={styles.submitSection}>
          <Button
            title="Create Listing"
            onPress={handleSubmit}
            loading={isLoading}
            fullWidth
          />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  section: {
    padding: spacing.screenPadding,
  },
  submitSection: {
    padding: spacing.screenPadding,
    marginTop: spacing.md,
  },
});
