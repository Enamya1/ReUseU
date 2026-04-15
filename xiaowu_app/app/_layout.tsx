/**
 * Root Layout
 * Main app layout with all providers and auth routing
 */

import React from 'react';
import { Stack, useRouter, useSegments } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ActivityIndicator, View } from 'react-native';

import { ThemeProvider, useTheme } from '../src/contexts/ThemeContext';
import { AuthProvider, useAuth } from '../src/contexts/AuthContext';
import { FavoritesProvider } from '../src/contexts/FavoritesContext';
import { CurrencyProvider } from '../src/contexts/CurrencyContext';
import { ToastProvider } from '../src/hooks/useToast';

/**
 * Auth Guard Component
 * Handles routing based on authentication state
 */
function AuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading, user } = useAuth();
  const segments = useSegments();
  const router = useRouter();

  React.useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';
    const inTabsGroup = segments[0] === '(tabs)';

    // Not authenticated - redirect to login
    if (!isAuthenticated && !inAuthGroup) {
      router.replace('/(auth)/login');
      return;
    }

    // Authenticated but needs onboarding
    if (isAuthenticated && user && user.account_completed === false && user.role !== 'admin') {
      if (segments[0] !== '(auth)' || segments[1] !== 'onboarding') {
        router.replace('/(auth)/onboarding');
      }
      return;
    }

    // Authenticated with completed account - redirect away from auth screens
    if (isAuthenticated && inAuthGroup) {
      // If onboarding screen but account is complete, go to tabs
      if (segments[1] === 'onboarding' && user?.account_completed !== false) {
        router.replace('/(tabs)');
        return;
      }
      // If login/signup screen and authenticated, go to tabs
      if (segments[1] === 'login' || segments[1] === 'signup') {
        router.replace('/(tabs)');
        return;
      }
    }
  }, [isAuthenticated, isLoading, user, segments, router]);

  // Show loading screen while checking auth
  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return <>{children}</>;
}

export const unstable_settings = {
  anchor: '(tabs)',
};

function RootStack() {
  const { isDark } = useTheme();

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <AuthGuard>
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
          }}
        >
          <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
          <Stack.Screen name="(auth)" options={{ headerShown: false }} />
          <Stack.Screen 
            name="product/[id]" 
            options={{ 
              headerShown: true,
              title: 'Product Details',
            }} 
          />
          <Stack.Screen 
            name="seller/[id]" 
            options={{ 
              headerShown: true,
              title: 'Seller Profile',
            }} 
          />
          <Stack.Screen 
            name="create-listing" 
            options={{ 
              headerShown: true,
              title: 'Create Listing',
            }} 
          />
          <Stack.Screen 
            name="favorites" 
            options={{ 
              headerShown: true,
              title: 'Favorites',
            }} 
          />
          <Stack.Screen 
            name="wallet" 
            options={{ 
              headerShown: true,
              title: 'Wallet',
            }} 
          />
          <Stack.Screen
            name="my-listings"
            options={{
              headerShown: true,
              title: 'My Listings',
            }}
          />
          <Stack.Screen
            name="my-listing-detail/[id]"
            options={{
              headerShown: true,
              title: 'Edit Listing',
            }}
          />
          <Stack.Screen
            name="search"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="products"
            options={{
              headerShown: true,
              title: 'All Products',
            }}
          />
          <Stack.Screen
            name="exchange"
            options={{
              headerShown: true,
              title: 'Exchange',
            }}
          />
          <Stack.Screen 
            name="exchange-product/[id]" 
            options={{ 
              headerShown: true,
              title: 'Exchange Details',
            }} 
          />
          <Stack.Screen
            name="chat/[id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ai/assistant"
            options={{
              headerShown: true,
              title: 'AI Assistant',
            }}
          />
          <Stack.Screen
            name="ai/chat/[session_id]"
            options={{
              headerShown: false,
            }}
          />
          <Stack.Screen
            name="ai/history"
            options={{
              headerShown: true,
              title: 'AI Chat History',
            }}
          />
          <Stack.Screen
            name="ai/voice"
            options={{
              headerShown: true,
              title: 'AI Voice Call',
            }}
          />
          <Stack.Screen
            name="chat-ai/index"
            options={{
              headerShown: true,
              title: 'AI Chat',
            }}
          />
          <Stack.Screen
            name="admin/index"
            options={{
              headerShown: true,
              title: 'Admin Panel',
            }}
          />
          <Stack.Screen
            name="modal"
            options={{
              presentation: 'modal',
              title: 'Modal',
            }}
          />
        </Stack>
      </AuthGuard>
    </>
  );
}

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <ThemeProvider>
          <AuthProvider>
            <FavoritesProvider>
              <CurrencyProvider>
                <ToastProvider>
                  <RootStack />
                </ToastProvider>
              </CurrencyProvider>
            </FavoritesProvider>
          </AuthProvider>
        </ThemeProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
