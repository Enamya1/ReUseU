/**
 * Onboarding Screen
 * Multi-step form for completing user profile after signup
 * Matches web platform's OnboardingPage.tsx
 */

import React, { useState, useEffect, useMemo } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { router } from 'expo-router';
import { useTheme } from '../../src/contexts/ThemeContext';
import { useAuth } from '../../src/contexts/AuthContext';
import { spacing } from '../../src/theme/spacing';
import { FormTextInput } from '../../src/components/forms/TextInput';
import { Select } from '../../src/components/forms/Select';
import { Button } from '../../src/components/ui/Button';
import { useToast } from '../../src/hooks/useToast';
import type { University, Dormitory } from '../../src/types';

const TOTAL_STEPS = 3;

const genderOptions = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'other', label: 'Other' },
  { value: 'prefer_not_to_say', label: 'Prefer not to say' },
];

const languageOptions = [
  { value: 'en', label: 'English' },
  { value: 'zh', label: '中文' },
  { value: 'ar', label: 'العربية' },
];

export default function OnboardingScreen() {
  const { colors } = useTheme();
  const { user, updateProfile, getUniversityOptions, updateUniversitySettings } = useAuth();
  const insets = useSafeAreaInsets();
  const { toast } = useToast();

  const [currentStep, setCurrentStep] = useState(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Form data
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    phone_number: user?.phone_number || '',
    student_id: user?.student_id || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    language: user?.language || 'en',
  });

  // University/Dormitory
  const [universities, setUniversities] = useState<University[]>([]);
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<number | undefined>();
  const [selectedDormitoryId, setSelectedDormitoryId] = useState<number | undefined>();

  // Load university options
  useEffect(() => {
    const loadOptions = async () => {
      try {
        setIsLoading(true);
        const data = await getUniversityOptions();
        setUniversities(data.universities || []);
        setDormitories(data.dormitories || []);
        
        if (data.current?.university_id) {
          setSelectedUniversityId(data.current.university_id);
        }
        if (data.current?.dormitory_id) {
          setSelectedDormitoryId(data.current.dormitory_id);
        }
      } catch (error) {
        toast({
          title: 'Error',
          description: 'Failed to load options. Please try again.',
          type: 'error',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadOptions();
  }, []);

  // Load dormitories when university changes
  const handleUniversityChange = async (universityId: number) => {
    setSelectedUniversityId(universityId);
    setSelectedDormitoryId(undefined);

    try {
      const data = await getUniversityOptions(universityId);
      setDormitories(data.dormitories || []);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to load dormitories.',
        type: 'error',
      });
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const canAdvanceFromStep = (step: number): boolean => {
    if (step === 0) {
      return !!(formData.full_name && formData.phone_number && formData.student_id);
    }
    if (step === 1) {
      return selectedDormitoryId !== undefined;
    }
    if (step === 2) {
      return !!(formData.date_of_birth && formData.gender && formData.language);
    }
    return false;
  };

  const handleNextStep = () => {
    if (!canAdvanceFromStep(currentStep)) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        type: 'warning',
      });
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, TOTAL_STEPS - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async () => {
    if (!canAdvanceFromStep(currentStep) || !selectedDormitoryId) {
      toast({
        title: 'Missing Fields',
        description: 'Please fill in all required fields.',
        type: 'warning',
      });
      return;
    }

    setIsSaving(true);

    try {
      // Update profile
      const success = await updateProfile({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        student_id: formData.student_id,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        language: formData.language,
      });

      if (!success) {
        toast({
          title: 'Error',
          description: 'Failed to update profile.',
          type: 'error',
        });
        return;
      }

      // Update university settings
      await updateUniversitySettings({
        university_id: selectedUniversityId!,
        dormitory_id: selectedDormitoryId,
      });

      toast({
        title: 'Profile Complete!',
        description: 'Welcome to Campus Trade!',
        type: 'success',
      });

      // Navigation is handled by AuthGuard
      router.replace('/(tabs)');
    } catch (error: any) {
      toast({
        title: 'Error',
        description: error.message || 'Failed to save profile.',
        type: 'error',
      });
    } finally {
      setIsSaving(false);
    }
  };

  const isLastStep = currentStep === TOTAL_STEPS - 1;

  const universityOptions = useMemo(() => 
    universities.map(u => ({ value: u.id, label: u.name })),
    [universities]
  );

  const dormitoryOptions = useMemo(() => 
    dormitories.map(d => ({ value: d.id, label: d.dormitory_name })),
    [dormitories]
  );

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      style={[styles.container, { backgroundColor: colors.background }]}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        contentContainerStyle={[
          styles.content,
          { paddingTop: insets.top + spacing.xl, paddingBottom: insets.bottom + spacing.xl },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Header */}
        <View style={styles.header}>
          <Text style={[styles.title, { color: colors.text }]}>
            Complete Your Profile
          </Text>
          <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
            Step {currentStep + 1} of {TOTAL_STEPS}
          </Text>
        </View>

        {/* Progress Dots */}
        <View style={styles.progressContainer}>
          {Array.from({ length: TOTAL_STEPS }).map((_, index) => (
            <View
              key={index}
              style={[
                styles.progressDot,
                {
                  backgroundColor: index === currentStep ? colors.primary : colors.border,
                },
              ]}
            />
          ))}
        </View>

        {/* Step Content */}
        <View style={styles.formContainer}>
          {/* Step 1: Personal Info */}
          {currentStep === 0 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Personal Information
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Tell us a bit about yourself
              </Text>

              <FormTextInput
                label="Full Name"
                placeholder="Enter your full name"
                value={formData.full_name}
                onChangeText={(value) => handleChange('full_name', value)}
                required
              />

              <FormTextInput
                label="Phone Number"
                placeholder="Enter your phone number"
                value={formData.phone_number}
                onChangeText={(value) => handleChange('phone_number', value)}
                keyboardType="phone-pad"
                required
              />

              <FormTextInput
                label="Student ID"
                placeholder="Enter your student ID"
                value={formData.student_id}
                onChangeText={(value) => handleChange('student_id', value)}
                required
              />
            </View>
          )}

          {/* Step 2: Campus Info */}
          {currentStep === 1 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Campus Information
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Where are you located?
              </Text>

              <Select
                label="University"
                options={universityOptions}
                value={selectedUniversityId}
                onChange={(value) => handleUniversityChange(value as number)}
                placeholder="Select your university"
                required
              />

              <Select
                label="Dormitory"
                options={dormitoryOptions}
                value={selectedDormitoryId}
                onChange={(value) => setSelectedDormitoryId(value as number)}
                placeholder="Select your dormitory"
                required
              />
            </View>
          )}

          {/* Step 3: Preferences */}
          {currentStep === 2 && (
            <View style={styles.stepContainer}>
              <Text style={[styles.stepTitle, { color: colors.text }]}>
                Preferences
              </Text>
              <Text style={[styles.stepDescription, { color: colors.textSecondary }]}>
                Set your profile preferences
              </Text>

              <FormTextInput
                label="Date of Birth"
                placeholder="YYYY-MM-DD"
                value={formData.date_of_birth}
                onChangeText={(value) => handleChange('date_of_birth', value)}
                required
              />

              <Select
                label="Gender"
                options={genderOptions}
                value={formData.gender}
                onChange={(value) => handleChange('gender', value as string)}
                placeholder="Select gender"
                required
              />

              <Select
                label="Language"
                options={languageOptions}
                value={formData.language}
                onChange={(value) => handleChange('language', value as string)}
                placeholder="Select language"
                required
              />
            </View>
          )}
        </View>

        {/* Navigation Buttons */}
        <View style={styles.buttonContainer}>
          {currentStep > 0 && (
            <Button
              title="Back"
              onPress={handlePreviousStep}
              variant="outline"
              style={styles.button}
            />
          )}
          
          {isLastStep ? (
            <Button
              title="Complete Profile"
              onPress={handleSubmit}
              loading={isSaving}
              style={styles.button}
            />
          ) : (
            <Button
              title="Next"
              onPress={handleNextStep}
              style={styles.button}
            />
          )}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flexGrow: 1,
    paddingHorizontal: spacing.screenPadding,
  },
  header: {
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.xl,
  },
  progressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  formContainer: {
    flex: 1,
  },
  stepContainer: {
    marginBottom: spacing.xl,
  },
  stepTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  stepDescription: {
    fontSize: 14,
    marginBottom: spacing.lg,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  button: {
    flex: 1,
    maxWidth: 200,
  },
});
