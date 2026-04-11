/**
 * Search Screen
 * Search products with text and visual search
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  Platform,
  FlatList,
  Modal,
  Pressable,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { Product } from '../src/types';
import { ProductCard } from '../src/components/products/ProductCard';
import { searchProducts, visualSearchProducts } from '../src/services/productService';
import { toggleFavorite } from '../src/services/favoritesService';

interface VisualSearchProduct extends Product {
  visual_similarity_score?: number;
}

export default function SearchScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [searchQuery, setSearchQuery] = useState('');
  const [products, setProducts] = useState<VisualSearchProduct[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [searchType, setSearchType] = useState<'text' | 'visual'>('text');
  const [resultCount, setResultCount] = useState(0);
  const [showOptionsModal, setShowOptionsModal] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<string[]>([]);

  const handleTextSearch = async (query: string) => {
    if (!query.trim()) {
      setProducts([]);
      setResultCount(0);
      return;
    }

    setIsLoading(true);
    setSearchType('text');
    try {
      const result = await searchProducts({ q: query, page: 1, page_size: 20 });
      setProducts(result.products);
      setResultCount(result.total);
    } catch (error: any) {
      Alert.alert('Error', error.message || 'Failed to search products');
      setProducts([]);
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const handleVisualSearch = async (imageUri: string) => {
    setIsLoading(true);
    setSearchType('visual');
    setSearchQuery('');
    try {
      const result = await visualSearchProducts(imageUri, 12);
      setProducts(result);
      setResultCount(result.length);
      
      if (result.length === 0) {
        Alert.alert('No Results', 'No similar products found. Try a different image.');
      }
    } catch (error: any) {
      const errorMsg = error.message || 'Visual search failed';
      if (errorMsg.includes('unavailable')) {
        Alert.alert('Service Unavailable', 'Visual search service is currently unavailable. Please try again later.');
      } else if (errorMsg.includes('Validation Error')) {
        Alert.alert('Invalid Image', 'Please select a valid image (JPG, PNG, or WebP, max 8MB).');
      } else {
        Alert.alert('Error', errorMsg);
      }
      setProducts([]);
      setResultCount(0);
    } finally {
      setIsLoading(false);
    }
  };

  const showCameraOptions = () => {
    console.log('Camera button pressed');
    setShowOptionsModal(true);
  };

  const openCamera = async () => {
    setShowOptionsModal(false);
    try {
      console.log('Opening camera...');
      const { status } = await ImagePicker.requestCameraPermissionsAsync();
      console.log('Camera permission status:', status);
      
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required', 
          'Camera permission is required for visual search. Please enable it in your device settings.'
        );
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      console.log('Camera result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('Image selected, starting search...');
        await handleVisualSearch(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening camera:', error);
      Alert.alert('Error', `Failed to open camera: ${error}`);
    }
  };

  const openGallery = async () => {
    setShowOptionsModal(false);
    try {
      console.log('Opening gallery...');
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: 0.8,
        allowsEditing: false,
      });

      console.log('Gallery result:', result);

      if (!result.canceled && result.assets[0]) {
        console.log('Image selected, starting search...');
        await handleVisualSearch(result.assets[0].uri);
      }
    } catch (error) {
      console.error('Error opening gallery:', error);
      Alert.alert('Error', `Failed to open gallery: ${error}`);
    }
  };

  const handleSearchSubmit = () => {
    handleTextSearch(searchQuery);
  };

  const handleProductPress = (product: Product) => {
    router.push(`/product/${product.id}`);
  };

  const handleFavoritePress = async (product: Product) => {
    const isFavorite = favoriteIds.includes(String(product.id));
    
    try {
      await toggleFavorite(product.id, isFavorite);
      
      if (isFavorite) {
        setFavoriteIds(prev => prev.filter(id => id !== String(product.id)));
      } else {
        setFavoriteIds(prev => [...prev, String(product.id)]);
      }
    } catch (error) {
      console.error('Error toggling favorite:', error);
    }
  };

  const renderProduct = ({ item }: { item: VisualSearchProduct }) => (
    <View style={styles.productWrapper}>
      <ProductCard
        product={item}
        onPress={() => handleProductPress(item)}
        onFavoritePress={() => handleFavoritePress(item)}
        isFavorite={favoriteIds.includes(String(item.id))}
      />
      {searchType === 'visual' && item.visual_similarity_score !== undefined && (
        <View style={[styles.similarityBadge, { backgroundColor: colors.primary }]}>
          <Text style={styles.similarityText}>
            {Math.round(item.visual_similarity_score * 100)}% match
          </Text>
        </View>
      )}
    </View>
  );

  const renderEmpty = () => {
    if (isLoading) return null;
    
    return (
      <View style={styles.emptyContainer}>
        <Text style={[styles.emptyIcon, { color: colors.textTertiary }]}>
          {searchType === 'visual' ? '📷' : '🔍'}
        </Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          {searchQuery || searchType === 'visual'
            ? 'No results found'
            : 'Start typing or use camera to search'}
        </Text>
        {searchType === 'text' && !searchQuery && (
          <Text style={[styles.emptyHint, { color: colors.textTertiary }]}>
            Tap the camera icon to search by image
          </Text>
        )}
      </View>
    );
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Options Modal */}
      <Modal
        visible={showOptionsModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowOptionsModal(false)}
      >
        <Pressable 
          style={styles.modalOverlay}
          onPress={() => setShowOptionsModal(false)}
        >
          <View style={[styles.modalContent, { backgroundColor: colors.surface }]}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>Visual Search</Text>
            <Text style={[styles.modalMessage, { color: colors.textSecondary }]}>
              Search for similar products using an image
            </Text>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={openCamera}
            >
              <Text style={styles.modalButtonText}>📷 Take Photo</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, { backgroundColor: colors.primary }]}
              onPress={openGallery}
            >
              <Text style={styles.modalButtonText}>🖼️ Choose from Gallery</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={[styles.modalButton, styles.modalCancelButton, { borderColor: colors.border }]}
              onPress={() => setShowOptionsModal(false)}
            >
              <Text style={[styles.modalCancelText, { color: colors.text }]}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>

      {/* Search Header */}
      <View style={[styles.header, { paddingTop: insets.top, backgroundColor: colors.background }]}>
        <View style={styles.searchRow}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
            <Text style={[styles.backIcon, { color: colors.text }]}>←</Text>
          </TouchableOpacity>
          <TextInput
            style={[styles.searchInput, { backgroundColor: colors.surfaceSecondary, color: colors.text }]}
            placeholder="Search products..."
            placeholderTextColor={colors.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchSubmit}
            returnKeyType="search"
            autoFocus={searchType === 'text'}
            editable={!isLoading}
          />
          <TouchableOpacity 
            style={[styles.cameraButton, { backgroundColor: colors.primary }]}
            onPress={showCameraOptions}
            disabled={isLoading}
            activeOpacity={0.7}
          >
            <Text style={styles.cameraIcon}>📷</Text>
          </TouchableOpacity>
        </View>
        
        {/* Search Info */}
        {(searchType === 'visual' || resultCount > 0) && (
          <View style={styles.searchInfo}>
            {searchType === 'visual' && (
              <Text style={[styles.searchTypeLabel, { color: colors.primary }]}>
                🔍 Visual Search
              </Text>
            )}
            {resultCount > 0 && (
              <Text style={[styles.resultCount, { color: colors.textSecondary }]}>
                {resultCount} {resultCount === 1 ? 'result' : 'results'}
              </Text>
            )}
          </View>
        )}
      </View>

      {/* Loading Indicator */}
      {isLoading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
            {searchType === 'visual' ? 'Analyzing image...' : 'Searching...'}
          </Text>
        </View>
      )}

      {/* Results */}
      {!isLoading && (
        <FlatList
          data={products}
          renderItem={renderProduct}
          keyExtractor={(item) => String(item.id)}
          numColumns={2}
          contentContainerStyle={styles.gridContainer}
          columnWrapperStyle={styles.row}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={renderEmpty}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(0,0,0,0.05)',
  },
  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  backButton: {
    padding: spacing.xs,
  },
  backIcon: {
    fontSize: 24,
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderRadius: spacing.sm,
    paddingHorizontal: spacing.md,
    fontSize: 16,
  },
  cameraButton: {
    width: 44,
    height: 44,
    borderRadius: spacing.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cameraIcon: {
    fontSize: 20,
  },
  searchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  searchTypeLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  resultCount: {
    fontSize: 12,
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
  },
  gridContainer: {
    padding: spacing.sm,
  },
  row: {
    justifyContent: 'flex-start',
  },
  productWrapper: {
    position: 'relative',
    flex: 1,
    margin: spacing.xs,
  },
  similarityBadge: {
    position: 'absolute',
    top: spacing.sm,
    right: spacing.sm,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: 12,
    zIndex: 10,
  },
  similarityText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    paddingVertical: spacing['4xl'],
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  emptyIcon: {
    fontSize: 48,
    marginBottom: spacing.md,
  },
  emptyText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  emptyHint: {
    fontSize: 13,
    textAlign: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  modalContent: {
    width: '100%',
    maxWidth: 400,
    borderRadius: spacing.md,
    padding: spacing.xl,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 5,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 14,
    marginBottom: spacing.lg,
    textAlign: 'center',
  },
  modalButton: {
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: spacing.sm,
    marginBottom: spacing.sm,
    alignItems: 'center',
  },
  modalButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  modalCancelButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
  },
  modalCancelText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
