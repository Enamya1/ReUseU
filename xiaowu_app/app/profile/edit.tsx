import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing } from '../../src/theme/spacing';
import { Avatar } from '../../src/components/ui/Avatar';
import { Card } from '../../src/components/ui/Card';
import { Button } from '../../src/components/ui/Button';
import { Divider } from '../../src/components/ui/Divider';
import { Input, TextArea } from '../../src/components/ui/Input';
import { Select } from '../../src/components/forms/Select';
import { ImagePickerModal } from '../../src/components/ui/ImagePickerModal';
import { useImagePicker } from '../../src/hooks/useImagePicker';
import { normalizeImageUrl } from '../../src/config/env';
import { uploadProfilePicture } from '../../src/services/authService';

type FieldErrors = Record<string, string[]>;

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: 'Chinese (中文)' },
  { value: 'ar', label: 'Arabic (العربية)' },
];

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const timezoneOptions = [
  { value: 'UTC', label: 'UTC' },
  { value: 'Asia/Shanghai', label: 'Asia/Shanghai' },
  { value: 'Asia/Tokyo', label: 'Asia/Tokyo' },
  { value: 'Europe/London', label: 'Europe/London' },
  { value: 'America/New_York', label: 'America/New_York' },
  { value: 'America/Los_Angeles', label: 'America/Los_Angeles' },
];

export default function EditProfileScreen() {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();
  const {
    user,
    isAuthenticated,
    updateProfile,
    refreshUser,
    getUniversityOptions,
    updateUniversitySettings,
  } = useAuth();
  const { pickImage, takePhoto, isLoading: imageLoading } = useImagePicker();

  const [showImagePicker, setShowImagePicker] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isLoadingCampus, setIsLoadingCampus] = useState(false);
  const [isSavingCampus, setIsSavingCampus] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [campusErrors, setCampusErrors] = useState<FieldErrors>({});
  const [universities, setUniversities] = useState<{ id: number; name: string }[]>([]);
  const [dormitories, setDormitories] = useState<{ id: number; dormitory_name: string; is_active?: boolean }[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>('');
  const [selectedDormitoryId, setSelectedDormitoryId] = useState<string>('');
  const [formData, setFormData] = useState({
    full_name: '',
    username: '',
    email: '',
    phone_number: '',
    student_id: '',
    date_of_birth: '',
    gender: '',
    language: 'en',
    timezone: '',
    bio: '',
  });

  useEffect(() => {
    if (!user) return;
    setFormData({
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      student_id: user.student_id || '',
      date_of_birth: user.date_of_birth || '',
      gender: user.gender || '',
      language: user.language || 'en',
      timezone: user.timezone || '',
      bio: user.bio || '',
    });
  }, [user]);

  const loadCampusOptions = useCallback(async (universityId?: number) => {
    setIsLoadingCampus(true);
    try {
      const response = await getUniversityOptions(universityId);
      setUniversities(response.universities || []);
      setDormitories(response.dormitories || []);
      const currentUniversityId = response.current?.university_id;
      const currentDormitoryId = response.current?.dormitory_id;
      setSelectedUniversityId(typeof currentUniversityId === 'number' ? String(currentUniversityId) : '');
      setSelectedDormitoryId(typeof currentDormitoryId === 'number' ? String(currentDormitoryId) : '');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load campus settings';
      Alert.alert('Campus Settings', message);
    } finally {
      setIsLoadingCampus(false);
    }
  }, [getUniversityOptions]);

  useEffect(() => {
    if (!isAuthenticated) return;
    loadCampusOptions();
  }, [isAuthenticated, loadCampusOptions]);

  const avatarSource = useMemo(() => {
    const normalized = normalizeImageUrl(user?.profile_picture);
    return normalized ? { uri: normalized } : undefined;
  }, [user?.profile_picture]);

  const errorFor = (field: string) => fieldErrors[field]?.[0];
  const campusErrorFor = (field: string) => campusErrors[field]?.[0];

  const clearFieldError = (field: string) => {
    setFieldErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const clearCampusError = (field: string) => {
    setCampusErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const updateField = (field: keyof typeof formData, value: string) => {
    clearFieldError(field);
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleUniversityChange = async (value: string | number) => {
    const nextUniversityId = String(value);
    setSelectedUniversityId(nextUniversityId);
    setSelectedDormitoryId('');
    clearCampusError('university_id');

    const parsed = Number(nextUniversityId);
    if (!Number.isFinite(parsed)) {
      setDormitories([]);
      return;
    }

    setIsLoadingCampus(true);
    try {
      const response = await getUniversityOptions(parsed);
      setUniversities(response.universities || []);
      setDormitories(response.dormitories || []);
      const currentDormitoryId = response.current?.dormitory_id;
      setSelectedDormitoryId(typeof currentDormitoryId === 'number' ? String(currentDormitoryId) : '');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load dormitories';
      Alert.alert('Campus Settings', message);
    } finally {
      setIsLoadingCampus(false);
    }
  };

  const handleDormitoryChange = (value: string | number) => {
    clearCampusError('dormitory_id');
    setSelectedDormitoryId(String(value));
  };

  const handleAvatarUpdate = async (uri: string) => {
    try {
      await uploadProfilePicture(uri);
      await refreshUser();
      Alert.alert('Success', 'Profile picture updated successfully');
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to upload profile picture';
      Alert.alert('Upload Failed', message);
    }
  };

  const onCameraSelect = async () => {
    const result = await takePhoto();
    if (result?.uri) {
      await handleAvatarUpdate(result.uri);
    }
  };

  const onGallerySelect = async () => {
    const result = await pickImage();
    if (result?.uri) {
      await handleAvatarUpdate(result.uri);
    }
  };

  const handleSaveProfile = async () => {
    setFieldErrors({});
    setIsSavingProfile(true);
    try {
      await updateProfile({
        full_name: formData.full_name.trim() || undefined,
        username: formData.username.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone_number: formData.phone_number.trim() || undefined,
        student_id: formData.student_id.trim() || undefined,
        date_of_birth: formData.date_of_birth.trim() || undefined,
        gender: formData.gender.trim() || undefined,
        language: formData.language.trim() || undefined,
        timezone: formData.timezone.trim() || undefined,
        bio: formData.bio.trim() || undefined,
      });
      await refreshUser();
      Alert.alert('Profile Updated', 'Your profile changes have been saved.');
    } catch (error: unknown) {
      const maybeValidation = error as { message?: string; errors?: FieldErrors };
      if (maybeValidation?.errors) {
        setFieldErrors(maybeValidation.errors);
      }
      Alert.alert('Save Failed', maybeValidation?.message || 'Failed to update profile settings');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleSaveCampus = async () => {
    setCampusErrors({});
    const universityId = Number(selectedUniversityId);
    const dormitoryId = Number(selectedDormitoryId);
    if (!Number.isFinite(universityId) || !Number.isFinite(dormitoryId)) {
      Alert.alert('Missing Selection', 'Please select both university and dormitory.');
      return;
    }

    setIsSavingCampus(true);
    try {
      await updateUniversitySettings({ university_id: universityId, dormitory_id: dormitoryId });
      await refreshUser();
      Alert.alert('Campus Updated', 'University and dormitory settings were updated.');
    } catch (error: unknown) {
      const maybeValidation = error as { message?: string; errors?: FieldErrors };
      if (maybeValidation?.errors) {
        setCampusErrors(maybeValidation.errors);
      }
      Alert.alert('Update Failed', maybeValidation?.message || 'Failed to update campus settings');
    } finally {
      setIsSavingCampus(false);
    }
  };

  if (!user) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background, justifyContent: 'center', alignItems: 'center' }]}>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>Sign in to edit your profile</Text>
        <Button title="Go to Login" onPress={() => router.replace('/(auth)/login')} />
      </View>
    );
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: insets.bottom + spacing['2xl'] }}
      showsVerticalScrollIndicator={false}
    >
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => router.back()}>
          <Text style={[styles.backText, { color: colors.primary }]}>‹ Back</Text>
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.text }]}>Edit Profile</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Keep your profile complete and easy for other students to trust.
        </Text>
      </View>

      <Card style={styles.heroCard}>
        <View style={styles.heroRow}>
          <View>
            <Avatar source={avatarSource} name={user.full_name || user.username} size="xl" />
            <TouchableOpacity
              onPress={() => setShowImagePicker(true)}
              disabled={imageLoading}
              style={[styles.avatarEditButton, { backgroundColor: colors.primary }]}
            >
              <Text style={{ color: colors.primaryForeground, fontWeight: '700' }}>
                {imageLoading ? '...' : 'Edit'}
              </Text>
            </TouchableOpacity>
          </View>
          <View style={styles.heroText}>
            <Text style={[styles.heroName, { color: colors.text }]}>{user.full_name || 'User'}</Text>
            <Text style={[styles.heroMeta, { color: colors.textSecondary }]}>@{user.username || 'username'}</Text>
            <Text style={[styles.heroMeta, { color: colors.textSecondary }]}>{user.email || ''}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Personal Information</Text>
        <Divider />
        <View style={styles.sectionBody}>
          <Input
            label="Full Name"
            value={formData.full_name}
            onChangeText={(value) => updateField('full_name', value)}
            error={errorFor('full_name')}
          />
          <Input
            label="Username"
            value={formData.username}
            onChangeText={(value) => updateField('username', value)}
            error={errorFor('username')}
          />
          <Input
            label="Email"
            value={formData.email}
            keyboardType="email-address"
            autoCapitalize="none"
            onChangeText={(value) => updateField('email', value)}
            error={errorFor('email')}
          />
          <Input
            label="Phone Number"
            value={formData.phone_number}
            keyboardType="phone-pad"
            onChangeText={(value) => updateField('phone_number', value)}
            error={errorFor('phone_number')}
          />
          <Input
            label="Student ID"
            value={formData.student_id}
            onChangeText={(value) => updateField('student_id', value)}
            error={errorFor('student_id')}
          />
          <Input
            label="Date of Birth (YYYY-MM-DD)"
            value={formData.date_of_birth}
            onChangeText={(value) => updateField('date_of_birth', value)}
            error={errorFor('date_of_birth')}
            placeholder="2004-09-18"
          />
          <Select
            label="Gender"
            options={genderOptions}
            value={formData.gender}
            onChange={(value) => updateField('gender', String(value))}
            error={errorFor('gender')}
            placeholder="Select gender"
          />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <View style={styles.sectionHeaderRow}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Campus Details</Text>
          <Button
            title={isSavingCampus ? 'Saving...' : 'Update'}
            loading={isSavingCampus}
            disabled={isSavingCampus || isLoadingCampus}
            onPress={handleSaveCampus}
            size="sm"
          />
        </View>
        <Divider />
        {isLoadingCampus ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator size="small" color={colors.primary} />
          </View>
        ) : (
          <View style={styles.sectionBody}>
            <Select
              label="University"
              options={universities.map((u) => ({ value: String(u.id), label: u.name }))}
              value={selectedUniversityId}
              onChange={handleUniversityChange}
              error={campusErrorFor('university_id')}
              placeholder="Select university"
            />
            <Select
              label="Dormitory"
              options={dormitories
                .filter((d) => d.is_active !== false)
                .map((d) => ({ value: String(d.id), label: d.dormitory_name }))}
              value={selectedDormitoryId}
              onChange={handleDormitoryChange}
              error={campusErrorFor('dormitory_id')}
              disabled={!selectedUniversityId}
              placeholder="Select dormitory"
            />
          </View>
        )}
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Preferences</Text>
        <Divider />
        <View style={styles.sectionBody}>
          <Select
            label="Language"
            options={languageOptions}
            value={formData.language}
            onChange={(value) => updateField('language', String(value))}
            error={errorFor('language')}
          />
          <Select
            label="Timezone"
            options={timezoneOptions}
            value={formData.timezone}
            onChange={(value) => updateField('timezone', String(value))}
            error={errorFor('timezone')}
            placeholder="Select timezone"
          />
        </View>
      </Card>

      <Card style={styles.sectionCard}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Bio</Text>
        <Divider />
        <View style={styles.sectionBody}>
          <TextArea
            value={formData.bio}
            onChangeText={(value) => updateField('bio', value)}
            error={errorFor('bio')}
            placeholder="Tell other students a bit about yourself..."
            rows={5}
          />
        </View>
      </Card>

      <View style={styles.footerActions}>
        <Button title="Cancel" variant="outline" onPress={() => router.back()} style={styles.cancelButton} />
        <Button
          title={isSavingProfile ? 'Saving...' : 'Save Changes'}
          loading={isSavingProfile}
          disabled={isSavingProfile}
          onPress={handleSaveProfile}
          style={styles.saveButton}
        />
      </View>

      <ImagePickerModal
        visible={showImagePicker}
        onClose={() => setShowImagePicker(false)}
        onCamera={onCameraSelect}
        onGallery={onGallerySelect}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.screenPadding,
    paddingBottom: spacing.md,
    gap: spacing.xs,
  },
  backText: {
    fontSize: 16,
    fontWeight: '600',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
  },
  subtitle: {
    fontSize: 14,
    lineHeight: 20,
  },
  heroCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  heroText: {
    flex: 1,
    justifyContent: 'center',
    gap: spacing.xs,
  },
  heroName: {
    fontSize: 20,
    fontWeight: '700',
  },
  heroMeta: {
    fontSize: 13,
  },
  avatarEditButton: {
    marginTop: spacing.sm,
    borderRadius: spacing.radius.full,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    alignItems: 'center',
  },
  sectionCard: {
    marginHorizontal: spacing.screenPadding,
    marginBottom: spacing.md,
    padding: spacing.md,
    gap: spacing.sm,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
  },
  sectionBody: {
    paddingTop: spacing.sm,
  },
  loadingBox: {
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  footerActions: {
    marginTop: spacing.sm,
    paddingHorizontal: spacing.screenPadding,
    flexDirection: 'row',
    gap: spacing.sm,
  },
  cancelButton: {
    flex: 1,
  },
  saveButton: {
    flex: 1,
  },
  emptyTitle: {
    fontSize: 18,
    marginBottom: spacing.md,
  },
});
