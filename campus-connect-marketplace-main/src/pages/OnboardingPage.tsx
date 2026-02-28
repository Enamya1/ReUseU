import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import MainLayout from "@/components/layout/MainLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "@/hooks/use-toast";
import { useTranslation } from "react-i18next";

const ONBOARDING_STORAGE_KEY = "onboarding.completed";

const OnboardingPage: React.FC = () => {
  const { user, isAuthenticated, updateProfile, getUniversityOptions } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();
  const [formData, setFormData] = useState({
    full_name: user?.full_name || "",
    phone_number: user?.phone_number || "",
    student_id: user?.student_id || "",
    date_of_birth: user?.date_of_birth || "",
    gender: user?.gender || "",
    language: user?.language || i18n.resolvedLanguage || "en",
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [universities, setUniversities] = useState<Array<{ id: number; name: string }>>([]);
  const [dormitories, setDormitories] = useState<Array<{ id: number; dormitory_name: string; is_active?: boolean }>>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("");
  const [selectedDormitoryId, setSelectedDormitoryId] = useState<string>("");
  const [isUniversityLoading, setIsUniversityLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [currentStep, setCurrentStep] = useState(0);

  const languageOptions = useMemo(
    () => [
      { value: "en", label: "English" },
      { value: "zh", label: "中文" },
      { value: "ar", label: "العربية" },
    ],
    [],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      navigate("/login", { replace: true });
      return;
    }
    if (user?.role === "admin") {
      navigate("/products", { replace: true });
      return;
    }
    if (user?.account_completed !== false) {
      navigate("/products", { replace: true });
    }
  }, [isAuthenticated, navigate, user?.account_completed, user?.role]);

  useEffect(() => {
    if (!user) return;
    setFormData({
      full_name: user.full_name || "",
      phone_number: user.phone_number || "",
      student_id: user.student_id || "",
      date_of_birth: user.date_of_birth || "",
      gender: user.gender || "",
      language: user.language || i18n.resolvedLanguage || "en",
    });
  }, [i18n.resolvedLanguage, user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const run = async () => {
      setIsUniversityLoading(true);
      try {
        const data = await getUniversityOptions();
        if (cancelled) return;
        const nextUniversities = data.universities || [];
        const nextDormitories = data.dormitories || [];
        setUniversities(nextUniversities);
        setDormitories(nextDormitories);
        const nextUniversityId = data.current?.university_id;
        const nextDormitoryId = data.current?.dormitory_id;
        setSelectedUniversityId(typeof nextUniversityId === "number" ? String(nextUniversityId) : "");
        if (typeof nextDormitoryId === "number" && nextDormitories.some(d => d.id === nextDormitoryId)) {
          setSelectedDormitoryId(String(nextDormitoryId));
        } else {
          setSelectedDormitoryId("");
        }
      } catch {
        if (!cancelled) {
          toast({
            title: t("onboarding.loadErrorTitle"),
            description: t("onboarding.loadErrorDesc"),
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setIsUniversityLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [getUniversityOptions, isAuthenticated, t]);

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleUniversityChange = async (universityId: string) => {
    setSelectedUniversityId(universityId);
    setSelectedDormitoryId("");
    setFieldErrors(prev => {
      if (!prev.university_id) return prev;
      const { university_id: _removed, ...rest } = prev;
      return rest;
    });

    const parsed = Number(universityId);
    if (!Number.isFinite(parsed)) {
      setDormitories([]);
      return;
    }

    setIsUniversityLoading(true);
    try {
      const data = await getUniversityOptions(parsed);
      const nextUniversities = data.universities || [];
      const nextDormitories = data.dormitories || [];
      setUniversities(nextUniversities);
      setDormitories(nextDormitories);

      const nextDormitoryId = data.current?.dormitory_id;
      if (typeof nextDormitoryId === "number" && nextDormitories.some(d => d.id === nextDormitoryId)) {
        setSelectedDormitoryId(String(nextDormitoryId));
      }
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      if (maybe?.errors) {
        setFieldErrors(maybe.errors);
        toast({
          title: maybe.message || t("onboarding.validationTitle"),
          description: t("onboarding.validationDesc"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("onboarding.loadErrorTitle"),
          description: maybe?.message || t("onboarding.loadErrorDesc"),
          variant: "destructive",
        });
      }
    } finally {
      setIsUniversityLoading(false);
    }
  };

  const handleDormitoryChange = (dormitoryId: string) => {
    setSelectedDormitoryId(dormitoryId);
    setFieldErrors(prev => {
      if (!prev.dormitory_id) return prev;
      const { dormitory_id: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleLanguageChange = (value: string) => {
    handleChange("language", value);
    if (value && i18n.resolvedLanguage !== value) {
      void i18n.changeLanguage(value);
    }
  };

  const totalSteps = 3;
  const isLastStep = currentStep === totalSteps - 1;

  const showMissingFields = () => {
    toast({
      title: t("onboarding.missingFields"),
      description: t("onboarding.missingFields"),
      variant: "destructive",
    });
  };

  const canAdvanceFromStep = (step: number) => {
    if (step === 0) {
      return !!(formData.full_name && formData.phone_number && formData.student_id);
    }
    if (step === 1) {
      const dormitoryId = Number(selectedDormitoryId);
      return Number.isFinite(dormitoryId);
    }
    if (step === 2) {
      return !!(formData.date_of_birth && formData.gender && formData.language);
    }
    return false;
  };

  const handleNextStep = () => {
    if (!canAdvanceFromStep(currentStep)) {
      showMissingFields();
      return;
    }
    setCurrentStep(prev => Math.min(prev + 1, totalSteps - 1));
  };

  const handlePreviousStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 0));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    const dormitoryId = Number(selectedDormitoryId);

    if (
      !formData.full_name ||
      !formData.phone_number ||
      !formData.student_id ||
      !formData.date_of_birth ||
      !formData.gender ||
      !formData.language ||
      !Number.isFinite(dormitoryId)
    ) {
      showMissingFields();
      return;
    }

    setIsSaving(true);
    try {
      const success = await updateProfile({
        full_name: formData.full_name,
        phone_number: formData.phone_number,
        student_id: formData.student_id,
        dormitory_id: dormitoryId,
        date_of_birth: formData.date_of_birth,
        gender: formData.gender,
        language: formData.language,
      });

      if (!success) {
        toast({
          title: t("onboarding.updateErrorTitle"),
          description: t("onboarding.updateErrorDesc"),
          variant: "destructive",
        });
        return;
      }

      try {
        localStorage.setItem(ONBOARDING_STORAGE_KEY, "true");
      } catch {
        void 0;
      }

      toast({
        title: t("onboarding.updateSuccessTitle"),
        description: t("onboarding.updateSuccessDesc"),
      });
      navigate("/products", { replace: true });
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      if (maybe?.errors) {
        setFieldErrors(maybe.errors);
        toast({
          title: maybe.message || t("onboarding.validationTitle"),
          description: t("onboarding.validationDesc"),
          variant: "destructive",
        });
      } else {
        toast({
          title: t("onboarding.updateErrorTitle"),
          description: maybe?.message || t("onboarding.updateErrorDesc"),
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const firstError = useMemo(() => {
    return new Map(Object.entries(fieldErrors).map(([key, value]) => [key, value?.[0]]));
  }, [fieldErrors]);

  return (
    <MainLayout>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm px-4 py-10">
        <div className="w-full max-w-3xl max-h-[90vh] overflow-y-auto rounded-3xl border border-border bg-card shadow-2xl">
          <div className="px-8 pt-8 pb-6 text-center border-b border-border/60">
            <h1 className="text-3xl font-semibold text-foreground">{t("onboarding.title")}</h1>
            <p className="mt-2 text-muted-foreground">{t("onboarding.subtitle")}</p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <span>{`Step ${currentStep + 1} of ${totalSteps}`}</span>
                <span className="font-medium text-foreground">
                  {currentStep === 0
                    ? t("onboarding.personalTitle")
                    : currentStep === 1
                      ? t("onboarding.campusTitle")
                      : "Preferences"}
                </span>
              </div>

              {currentStep === 0 ? (
                <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{t("onboarding.personalTitle")}</h2>
                    <p className="text-sm text-muted-foreground">{t("onboarding.personalSubtitle")}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="onboarding_full_name">{t("onboarding.fullName")}</Label>
                      <Input
                        id="onboarding_full_name"
                        value={formData.full_name}
                        onChange={(e) => handleChange("full_name", e.target.value)}
                        className="h-11"
                      />
                      {firstError.get("full_name") ? (
                        <p className="text-xs text-destructive">{firstError.get("full_name")}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="onboarding_phone_number">{t("onboarding.phoneNumber")}</Label>
                      <Input
                        id="onboarding_phone_number"
                        type="tel"
                        value={formData.phone_number}
                        onChange={(e) => handleChange("phone_number", e.target.value)}
                        placeholder={t("onboarding.phonePlaceholder")}
                        className="h-11"
                      />
                      {firstError.get("phone_number") ? (
                        <p className="text-xs text-destructive">{firstError.get("phone_number")}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="onboarding_student_id">{t("onboarding.studentId")}</Label>
                    <Input
                      id="onboarding_student_id"
                      value={formData.student_id}
                      onChange={(e) => handleChange("student_id", e.target.value)}
                      placeholder={t("onboarding.studentIdPlaceholder")}
                      className="h-11"
                    />
                    {firstError.get("student_id") ? (
                      <p className="text-xs text-destructive">{firstError.get("student_id")}</p>
                    ) : null}
                  </div>
                </div>
              ) : null}

              {currentStep === 1 ? (
                <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">{t("onboarding.campusTitle")}</h2>
                    <p className="text-sm text-muted-foreground">{t("onboarding.campusSubtitle")}</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label>{t("onboarding.university")}</Label>
                      <Select value={selectedUniversityId} onValueChange={handleUniversityChange} disabled={isUniversityLoading}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={isUniversityLoading ? t("common.loading") : t("onboarding.selectUniversity")} />
                        </SelectTrigger>
                        <SelectContent>
                          {universities.map((u) => (
                            <SelectItem key={u.id} value={String(u.id)}>
                              {u.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {firstError.get("university_id") ? (
                        <p className="text-xs text-destructive">{firstError.get("university_id")}</p>
                      ) : null}
                    </div>
                    <div className="space-y-2">
                      <Label>{t("onboarding.dormitory")}</Label>
                      <Select
                        value={selectedDormitoryId}
                        onValueChange={handleDormitoryChange}
                        disabled={!selectedUniversityId || isUniversityLoading}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder={isUniversityLoading ? t("common.loading") : t("onboarding.selectDormitory")} />
                        </SelectTrigger>
                        <SelectContent>
                          {dormitories.map((d) => (
                            <SelectItem key={d.id} value={String(d.id)} disabled={d.is_active === false}>
                              {d.dormitory_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {firstError.get("dormitory_id") ? (
                        <p className="text-xs text-destructive">{firstError.get("dormitory_id")}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              {currentStep === 2 ? (
                <div className="rounded-2xl border border-border bg-muted/20 p-6 space-y-6">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">Preferences</h2>
                    <p className="text-sm text-muted-foreground">Set your profile and locale preferences.</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="onboarding_date_of_birth">Date of Birth</Label>
                      <Input
                        id="onboarding_date_of_birth"
                        type="date"
                        value={formData.date_of_birth}
                        onChange={(e) => handleChange("date_of_birth", e.target.value)}
                        className="h-11"
                      />
                      {firstError.get("date_of_birth") ? (
                        <p className="text-xs text-destructive">{firstError.get("date_of_birth")}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="onboarding_gender">Gender</Label>
                      <Select value={formData.gender} onValueChange={(value) => handleChange("gender", value)}>
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="male">Male</SelectItem>
                          <SelectItem value="female">Female</SelectItem>
                          <SelectItem value="other">Other</SelectItem>
                          <SelectItem value="prefer_not_to_say">Prefer not to say</SelectItem>
                        </SelectContent>
                      </Select>
                      {firstError.get("gender") ? (
                        <p className="text-xs text-destructive">{firstError.get("gender")}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="onboarding_language">Language</Label>
                      <Select
                        value={formData.language || i18n.resolvedLanguage || "en"}
                        onValueChange={handleLanguageChange}
                      >
                        <SelectTrigger className="h-11">
                          <SelectValue placeholder="Select language" />
                        </SelectTrigger>
                        <SelectContent>
                          {languageOptions.map((option) => (
                            <SelectItem key={option.value} value={option.value}>
                              {option.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {firstError.get("language") ? (
                        <p className="text-xs text-destructive">{firstError.get("language")}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              ) : null}

              <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                <Button
                  type="button"
                  variant="outline"
                  className="h-11 px-8"
                  onClick={handlePreviousStep}
                  disabled={currentStep === 0 || isSaving}
                >
                  Back
                </Button>
                {isLastStep ? (
                  <Button type="submit" className="h-11 px-8" disabled={isSaving}>
                    {isSaving ? t("onboarding.saving") : t("onboarding.save")}
                  </Button>
                ) : (
                  <Button type="button" className="h-11 px-8" onClick={handleNextStep} disabled={isSaving}>
                    Next
                  </Button>
                )}
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default OnboardingPage;
