/**
 * Create Listing Screen
 * Create new product listing
 */

import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { spacing } from '../../src/theme/spacing';
import { Button } from '../../src/components/ui/Button';

export default function CreateScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.content, { paddingTop: insets.top }]}>
        <Text style={[styles.icon, { color: colors.text }]}>📝</Text>
        <Text style={[styles.title, { color: colors.text }]}>
          Create Listing
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Sell or exchange your items with other students
        </Text>
        
        <Button
          title="Create New Listing"
          onPress={() => router.push('/create-listing')}
          fullWidth
          style={styles.button}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.screenPadding,
  },
  icon: {
    fontSize: 64,
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: spacing['2xl'],
  },
  button: {
    maxWidth: 300,
  },
});
