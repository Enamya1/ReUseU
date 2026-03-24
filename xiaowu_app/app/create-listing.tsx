/**
 * Create Listing Screen
 * Create new product listing
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { router } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { FormTextInput, FormTextArea } from '../src/components/forms/TextInput';
import { Select } from '../src/components/forms/Select';
import { FormImagePicker } from '../src/components/forms/ImagePicker';
import { Button } from '../src/components/ui/Button';

const categories = [
  { value: 1, label: 'Textbooks' },
  { value: 2, label: 'Electronics' },
  { value: 3, label: 'Furniture' },
  { value: 4, label: 'Clothing' },
  { value: 5, label: 'Other' },
];

const conditions = [
  { value: 1, label: 'New' },
  { value: 2, label: 'Like New' },
  { value: 3, label: 'Good' },
  { value: 4, label: 'Fair' },
];

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

  const handleSubmit = async () => {
    if (!title || !price || !category || !condition) {
      return;
    }

    setIsLoading(true);
    // Simulate API call
    setTimeout(() => {
      setIsLoading(false);
      router.back();
    }, 1000);
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
