/**
 * Screen Component
 * Screen wrapper with consistent layout
 */

import React from 'react';
import {
  View,
  StyleSheet,
  ViewStyle,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../contexts/ThemeContext';
import { spacing } from '../../theme/spacing';
import { Header, SearchHeader } from './Header';

interface ScreenProps {
  children: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  safeArea?: boolean;
  refreshControl?: {
    refreshing: boolean;
    onRefresh: () => void;
  };
}

export const Screen: React.FC<ScreenProps> = ({
  children,
  style,
  scroll = false,
  keyboardAvoiding = false,
  safeArea = true,
  refreshControl,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        safeArea && {
          paddingTop: insets.top,
          paddingBottom: insets.bottom,
        },
        style,
      ]}
    >
      {scroll ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          refreshControl={
            refreshControl ? (
              <RefreshControl
                refreshing={refreshControl.refreshing}
                onRefresh={refreshControl.onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        children
      )}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
};

interface ScreenWithHeaderProps {
  children: React.ReactNode;
  title?: string;
  subtitle?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
  keyboardAvoiding?: boolean;
  refreshControl?: {
    refreshing: boolean;
    onRefresh: () => void;
  };
}

export const ScreenWithHeader: React.FC<ScreenWithHeaderProps> = ({
  children,
  title,
  subtitle,
  leftAction,
  rightAction,
  style,
  scroll = false,
  keyboardAvoiding = false,
  refreshControl,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  const content = (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        style,
      ]}
    >
      <Header
        title={title}
        subtitle={subtitle}
        leftAction={leftAction}
        rightAction={rightAction}
      />
      
      {scroll ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.tabBarHeight },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            refreshControl ? (
              <RefreshControl
                refreshing={refreshControl.refreshing}
                onRefresh={refreshControl.onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { paddingBottom: insets.bottom }]}>
          {children}
        </View>
      )}
    </View>
  );

  if (keyboardAvoiding) {
    return (
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    );
  }

  return content;
};

interface ScreenWithSearchProps {
  children: React.ReactNode;
  searchValue: string;
  onSearchChange: (text: string) => void;
  onSearch?: () => void;
  placeholder?: string;
  leftAction?: React.ReactNode;
  rightAction?: React.ReactNode;
  style?: ViewStyle;
  scroll?: boolean;
  refreshControl?: {
    refreshing: boolean;
    onRefresh: () => void;
  };
}

export const ScreenWithSearch: React.FC<ScreenWithSearchProps> = ({
  children,
  searchValue,
  onSearchChange,
  onSearch,
  placeholder,
  leftAction,
  rightAction,
  style,
  scroll = false,
  refreshControl,
}) => {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <View
      style={[
        styles.container,
        { backgroundColor: colors.background },
        style,
      ]}
    >
      <SearchHeader
        value={searchValue}
        onChangeText={onSearchChange}
        onSearch={onSearch}
        placeholder={placeholder}
        leftAction={leftAction}
        rightAction={rightAction}
      />
      
      {scroll ? (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingBottom: insets.bottom + spacing.tabBarHeight },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            refreshControl ? (
              <RefreshControl
                refreshing={refreshControl.refreshing}
                onRefresh={refreshControl.onRefresh}
                tintColor={colors.primary}
              />
            ) : undefined
          }
        >
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { paddingBottom: insets.bottom }]}>
          {children}
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.screenPadding,
  },
  content: {
    flex: 1,
  },
});

export default Screen;
