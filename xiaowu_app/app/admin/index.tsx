import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useAuth } from '@/src/contexts/AuthContext';
import { router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

export default function AdminScreen() {
  const { user, isAdmin, logout } = useAuth();

  if (!isAdmin) {
    return (
      <View style={styles.center}>
        <Ionicons name="lock-closed-outline" size={64} color="#999" />
        <Text style={styles.errorText}>Access Denied</Text>
        <Text style={styles.errorSubtext}>Admin privileges required</Text>
        <TouchableOpacity style={styles.button} onPress={() => router.back()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const adminMenuItems = [
    { icon: 'people-outline', title: 'Users', subtitle: 'Manage users', route: '/admin/users' },
    { icon: 'cube-outline', title: 'Products', subtitle: 'Manage products', route: '/admin/products' },
    { icon: 'stats-chart-outline', title: 'Analytics', subtitle: 'View statistics', route: '/admin/analytics' },
    { icon: 'settings-outline', title: 'Settings', subtitle: 'System settings', route: '/admin/settings' },
  ];

  return (
    <ScrollView style={styles.container}>
      <View style={styles.header}>
        <View style={styles.headerContent}>
          <Ionicons name="shield-checkmark" size={48} color="#0066FF" />
          <Text style={styles.headerTitle}>Admin Panel</Text>
          <Text style={styles.headerSubtitle}>Welcome, {user?.username}</Text>
        </View>
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Management</Text>
        {adminMenuItems.map((item, index) => (
          <TouchableOpacity 
            key={index}
            style={styles.menuItem}
            onPress={() => router.push(item.route as any)}
          >
            <View style={styles.menuIcon}>
              <Ionicons name={item.icon as any} size={24} color="#0066FF" />
            </View>
            <View style={styles.menuContent}>
              <Text style={styles.menuTitle}>{item.title}</Text>
              <Text style={styles.menuSubtitle}>{item.subtitle}</Text>
            </View>
            <Ionicons name="chevron-forward" size={20} color="#999" />
          </TouchableOpacity>
        ))}

        <TouchableOpacity 
          style={[styles.menuItem, styles.logoutItem]}
          onPress={logout}
        >
          <View style={styles.menuIcon}>
            <Ionicons name="log-out-outline" size={24} color="#FF3B30" />
          </View>
          <View style={styles.menuContent}>
            <Text style={[styles.menuTitle, styles.logoutText]}>Logout</Text>
            <Text style={styles.menuSubtitle}>Sign out from admin panel</Text>
          </View>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F5F5F5' },
  center: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  header: { backgroundColor: '#0066FF', paddingTop: 60, paddingBottom: 30 },
  headerContent: { alignItems: 'center' },
  headerTitle: { fontSize: 28, fontWeight: 'bold', color: '#FFF', marginTop: 12 },
  headerSubtitle: { fontSize: 16, color: '#FFF', opacity: 0.9, marginTop: 4 },
  content: { padding: 16 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#000', marginBottom: 12, marginTop: 8 },
  menuItem: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    backgroundColor: '#FFF', 
    padding: 16, 
    borderRadius: 12, 
    marginBottom: 12,
    elevation: 1,
  },
  menuIcon: { 
    width: 48, 
    height: 48, 
    borderRadius: 24, 
    backgroundColor: '#F0F7FF', 
    justifyContent: 'center', 
    alignItems: 'center',
    marginRight: 12,
  },
  menuContent: { flex: 1 },
  menuTitle: { fontSize: 16, fontWeight: '600', color: '#000', marginBottom: 2 },
  menuSubtitle: { fontSize: 13, color: '#666' },
  logoutItem: { marginTop: 20 },
  logoutText: { color: '#FF3B30' },
  errorText: { fontSize: 20, fontWeight: 'bold', color: '#999', marginTop: 16 },
  errorSubtext: { fontSize: 14, color: '#999', marginTop: 8 },
  button: { 
    backgroundColor: '#0066FF', 
    paddingHorizontal: 24, 
    paddingVertical: 12, 
    borderRadius: 8, 
    marginTop: 24,
  },
  buttonText: { color: '#FFF', fontSize: 16, fontWeight: '600' },
});
