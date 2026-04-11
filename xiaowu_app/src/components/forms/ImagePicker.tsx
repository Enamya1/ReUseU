/**
 * ImagePicker Component
 * Image selection component for forms
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Image,
  ScrollView,
  ViewStyle,
  ActionSheetIOS,
  Platform,
  Alert,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';

interface ImagePickerProps {
  images: string[];
  onChange: (images: string[]) => void;
  maxImages?: number;
  label?: string;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
}

export const FormImagePicker: React.FC<ImagePickerProps> = ({
  images,
  onChange,
  maxImages = 5,
  label,
  error,
  disabled = false,
  containerStyle,
}) => {
  const { colors } = useTheme();
  const [isLoading, setIsLoading] = useState(false);

  const showImageOptions = () => {
    if (images.length >= maxImages || disabled) return;

    if (Platform.OS === 'ios') {
      ActionSheetIOS.showActionSheetWithOptions(
        {
          options: ['Cancel', 'Take Photo', 'Choose from Gallery'],
          cancelButtonIndex: 0,
        },
        (buttonIndex) => {
          if (buttonIndex === 1) {
            takePhoto();
          } else if (buttonIndex === 2) {
            pickImage();
          }
        }
      );
    } else {
      Alert.alert(
        'Add Photo',
        'Choose an option',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Take Photo', onPress: takePhoto },
          { text: 'Choose from Gallery', onPress: pickImage },
        ],
        { cancelable: true }
      );
    }
  };

  const pickImage = async () => {
    if (images.length >= maxImages || disabled) return;

    try {
      setIsLoading(true);
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsMultipleSelection: true,
        quality: 0.8,
        selectionLimit: maxImages - images.length,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        onChange([...images, ...newImages].slice(0, maxImages));
      }
    } catch (err) {
      console.error('Error picking image:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const takePhoto = async () => {
    if (images.length >= maxImages || disabled) return;

    try {
      setIsLoading(true);
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      
      if (status !== 'granted') {
        alert('Camera permission is required to take photos.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets) {
        const newImages = result.assets.map((asset) => asset.uri);
        onChange([...images, ...newImages].slice(0, maxImages));
      }
    } catch (err) {
      console.error('Error taking photo:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const removeImage = (index: number) => {
    const newImages = [...images];
    newImages.splice(index, 1);
    onChange(newImages);
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.imageList}
      >
        {images.map((uri, index) => (
          <View key={index} style={styles.imageWrapper}>
            <Image source={{ uri }} style={styles.image} />
            <TouchableOpacity
              style={[styles.removeButton, { backgroundColor: colors.destructive }]}
              onPress={() => removeImage(index)}
            >
              <Text style={styles.removeText}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        
        {images.length < maxImages && (
          <TouchableOpacity
            style={[
              styles.addButton,
              {
                backgroundColor: colors.surfaceSecondary,
                borderColor: colors.border,
              },
              disabled && { opacity: 0.5 },
            ]}
            onPress={showImageOptions}
            disabled={disabled || isLoading}
          >
            <Text style={styles.addIcon}>+</Text>
            <Text style={[styles.addText, { color: colors.textSecondary }]}>
              Add Photo
            </Text>
          </TouchableOpacity>
        )}
      </ScrollView>

      <Text style={[styles.hint, { color: colors.textSecondary }]}>
        {images.length} / {maxImages} images
      </Text>

      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

interface SingleImagePickerProps {
  value?: string;
  onChange: (uri: string) => void;
  label?: string;
  error?: string;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  size?: number;
}

export const FormSingleImagePicker: React.FC<SingleImagePickerProps> = ({
  value,
  onChange,
  label,
  error,
  disabled = false,
  containerStyle,
  size = 120,
}) => {
  const { colors } = useTheme();

  const pickImage = async () => {
    if (disabled) return;

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
      });

      if (!result.canceled && result.assets[0]) {
        onChange(result.assets[0].uri);
      }
    } catch (err) {
      console.error('Error picking image:', err);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {label && (
        <Text style={[styles.label, { color: colors.text }]}>
          {label}
        </Text>
      )}
      
      <TouchableOpacity
        style={[
          styles.singleImageContainer,
          {
            width: size,
            height: size,
            backgroundColor: colors.surfaceSecondary,
            borderColor: colors.border,
          },
          disabled && { opacity: 0.5 },
        ]}
        onPress={pickImage}
        disabled={disabled}
      >
        {value ? (
          <Image source={{ uri: value }} style={styles.singleImage} />
        ) : (
          <View style={styles.placeholder}>
            <Text style={styles.placeholderIcon}>📷</Text>
            <Text style={[styles.placeholderText, { color: colors.textSecondary }]}>
              Add Photo
            </Text>
          </View>
        )}
      </TouchableOpacity>

      {error && (
        <Text style={[styles.error, { color: colors.destructive }]}>
          {error}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginBottom: spacing.lg,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  imageList: {
    flexDirection: 'row',
  },
  imageWrapper: {
    width: 100,
    height: 100,
    marginRight: spacing.sm,
    borderRadius: spacing.sm,
    overflow: 'hidden',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  removeButton: {
    position: 'absolute',
    top: 4,
    right: 4,
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  removeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  addButton: {
    width: 100,
    height: 100,
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addIcon: {
    fontSize: 24,
    color: '#999',
  },
  addText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  cameraButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    marginTop: spacing.sm,
    borderWidth: 1,
    borderRadius: spacing.sm,
  },
  cameraIcon: {
    fontSize: 20,
    marginRight: spacing.sm,
  },
  cameraText: {
    fontSize: 14,
    fontWeight: '500',
  },
  hint: {
    fontSize: 12,
    marginTop: spacing.sm,
  },
  error: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  singleImageContainer: {
    borderRadius: spacing.sm,
    borderWidth: 1,
    borderStyle: 'dashed',
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  placeholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  placeholderIcon: {
    fontSize: 32,
  },
  placeholderText: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
});

export default FormImagePicker;
