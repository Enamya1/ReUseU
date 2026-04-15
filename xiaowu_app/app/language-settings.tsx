/**
 * Language Settings Screen
 * Allow users to change app language
 */

import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../src/contexts/ThemeContext';
import { spacing } from '../src/theme/spacing';
import { getLanguage, updateLanguage } from '../src/services/authService';
import { Divider } from '../src/components/ui/Divider';

interface Language {
  code: string;
  name: string;
  nativeName: string;
  flag: string;
}

const LANGUAGES: Language[] = [
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'zh', name: 'Chinese', nativeName: '中文', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
];

export default function LanguageSettingsScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [selectedLanguage, setSelectedLanguage] = useState<string>('en');
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    loadCurrentLanguage();
  }, []);

  const loadCurrentLanguage = async () => {
    try {
      setLoading(true);
      const lang = await getLanguage();
      setSelectedLanguage(lang);
    } catch (error) {
      console.error('Error loading language:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleLanguageSelect = async (code: string) => {
    if (code === selectedLanguage) return;

    try {
      setUpdating(true);
      await updateLanguage(code);
      setSelectedLanguage(code);
      // Show success feedback
      setTimeout(() => {
        router.back();
      }, 500);
    } catch (error) {
      console.error('Error updating language:', error);
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Text style={[styles.backText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>
          Language
        </Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Choose your preferred language
        </Text>
      </View>

      {/* Language Options */}
      <View style={[styles.card, { backgroundColor: colors.card }]}>
        {LANGUAGES.map((language, index) => (
          <React.Fragment key={language.code}>
            <TouchableOpacity
              style={styles.languageItem}
              onPress={() => handleLanguageSelect(language.code)}
              disabled={updating}
            >
              <View style={styles.languageInfo}>
                <Text style={styles.flag}>{language.flag}</Text>
                <View style={styles.languageText}>
                  <Text style={[styles.languageName, { color: colors.text }]}>
                    {language.name}
                  </Text>
                  <Text style={[styles.languageNative, { color: colors.textSecondary }]}>
                    {language.nativeName}
                  </Text>
                </View>
              </View>
              {selectedLanguage === language.code && (
                <Text style={[styles.checkmark, { color: colors.primary }]}>✓</Text>
              )}
            </TouchableOpacity>
            {index < LANGUAGES.length - 1 && <Divider />}
          </React.Fragment>
        ))}
      </View>

      {updating && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" color={colors.primary} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  center: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.lg,
  },
  backButton: {
    marginBottom: spacing.md,
  },
  backText: {
    fontSize: 16,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 14,
  },
  card: {
    marginHorizontal: spacing.screenPadding,
    borderRadius: spacing.md,
    overflow: 'hidden',
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  languageInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  flag: {
    fontSize: 32,
    marginRight: spacing.md,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    fontSize: 16,
    fontWeight: '600',
  },
  languageNative: {
    fontSize: 14,
    marginTop: 2,
  },
  checkmark: {
    fontSize: 24,
    fontWeight: '600',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
