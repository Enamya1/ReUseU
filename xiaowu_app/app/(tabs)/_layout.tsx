/**
 * Tabs Layout
 * Bottom tab navigation for main app sections
 */

import React, { useEffect, useRef, useState } from 'react';
import { Text, Dimensions, View, Animated, StyleSheet, Image, TouchableOpacity, GestureResponderEvent } from 'react-native';
import { Tabs , usePathname } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useTheme } from '../../src/contexts/ThemeContext';
import { SellDropdown } from '../../src/components/SellDropdown';
import * as Haptics from 'expo-haptics';

// Import custom icons
const icons = {
  home: require('../../assets/images/icons/home.png'),
  nearby: require('../../assets/images/icons/nearby.png'),
  sell: require('../../assets/images/icons/sell.png'),
  chat: require('../../assets/images/icons/chat.png'),
  profile: require('../../assets/images/icons/profile.png'),
  ai: require('../../assets/images/icons/ai.png'),
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const IS_SMALL_DEVICE = SCREEN_WIDTH < 375;

function TabBarIndicator() {
  const pathname = usePathname();
  const { colors } = useTheme();
  const indicatorAnim = useRef(new Animated.Value(0)).current;
  const tabWidth = SCREEN_WIDTH / 5; // Changed from 6 to 5 tabs

  const getTabIndex = (path: string) => {
    if (path === '/' || path === '/index') return 0;
    if (path.includes('nearby')) return 1;
    if (path.includes('create')) return 2;
    if (path.includes('messages')) return 3;
    if (path.includes('profile')) return 4;
    return 0;
  };

  useEffect(() => {
    const index = getTabIndex(pathname);
    Animated.spring(indicatorAnim, {
      toValue: index * tabWidth,
      useNativeDriver: true,
      tension: 68,
      friction: 12,
    }).start();
  }, [pathname]);

  return (
    <Animated.View
      style={[
        styles.indicator,
        {
          backgroundColor: colors.text,
          width: tabWidth,
          transform: [{ translateX: indicatorAnim }],
        },
      ]}
    />
  );
}

export default function TabLayout() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const [showSellDropdown, setShowSellDropdown] = useState(false);
  const tabBarHeight = 64 + insets.bottom;
  const longPressTimer = useRef<NodeJS.Timeout | null>(null);

  const handleSellPressIn = () => {
    longPressTimer.current = setTimeout(() => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setShowSellDropdown(true);
    }, 300);
  };

  const handleSellPressOut = () => {
    if (longPressTimer.current) {
      clearTimeout(longPressTimer.current);
      longPressTimer.current = null;
    }
  };

  useEffect(() => {
    return () => {
      if (longPressTimer.current) {
        clearTimeout(longPressTimer.current);
      }
    };
  }, []);

  return (
    <>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.text,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: {
            backgroundColor: colors.background,
            borderTopColor: colors.border,
            borderTopWidth: 1,
            height: tabBarHeight,
            paddingBottom: insets.bottom + 8,
            paddingTop: 6,
            elevation: 0,
            shadowColor: 'transparent',
          },
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: '450',
            marginTop: 4,
            letterSpacing: -0.01,
          },
          tabBarItemStyle: {
            paddingVertical: 6,
          },
          tabBarBackground: () => (
            <View style={{ flex: 1, backgroundColor: colors.background }}>
              <TabBarIndicator />
            </View>
          ),
        }}
      >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color }) => (
            <Image 
              source={icons.home}
              style={{ width: 24, height: 24, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="nearby"
        options={{
          title: 'Nearby',
          tabBarIcon: ({ color }) => (
            <Image 
              source={icons.nearby}
              style={{ width: 24, height: 24, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Sell',
          tabBarIcon: ({ color }) => (
            <Image 
              source={icons.sell}
              style={{ width: 24, height: 24, tintColor: color }}
              resizeMode="contain"
            />
          ),
          tabBarButton: (props) => (
            <TouchableOpacity
              {...props}
              onPressIn={handleSellPressIn}
              onPressOut={handleSellPressOut}
              onPress={(e) => {
                e.preventDefault();
              }}
            />
          ),
        }}
      />
      <Tabs.Screen
        name="messages"
        options={{
          title: 'Messages',
          tabBarIcon: ({ color }) => (
            <Image 
              source={icons.chat}
              style={{ width: 24, height: 24, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: 'Profile',
          tabBarIcon: ({ color }) => (
            <Image 
              source={icons.profile}
              style={{ width: 24, height: 24, tintColor: color }}
              resizeMode="contain"
            />
          ),
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          href: null,
        }}
      />
    </Tabs>
    
    <SellDropdown
      visible={showSellDropdown}
      onClose={() => setShowSellDropdown(false)}
      tabBarHeight={tabBarHeight}
    />
    </>
  );
}

const styles = StyleSheet.create({
  indicator: {
    position: 'absolute',
    bottom: 8,
    height: 3,
    borderRadius: 3,
  },
});
