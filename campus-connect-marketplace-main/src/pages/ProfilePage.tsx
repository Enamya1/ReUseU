import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { User, Camera, ArrowLeft, Save } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const ProfilePage: React.FC = () => {
  const { user, isAuthenticated, updateProfile, getUniversityOptions, updateUniversitySettings } = useAuth();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [isUniversityLoading, setIsUniversityLoading] = useState(false);
  const [isUniversitySaving, setIsUniversitySaving] = useState(false);
  const [universityFieldErrors, setUniversityFieldErrors] = useState<Record<string, string[]>>({});
  const [universities, setUniversities] = useState<Array<{ id: number; name: string }>>([]);
  const [dormitories, setDormitories] = useState<Array<{ id: number; dormitory_name: string; is_active?: boolean }>>([]);
  const [selectedUniversityId, setSelectedUniversityId] = useState<string>("");
  const [selectedDormitoryId, setSelectedDormitoryId] = useState<string>("");
  
  const [formData, setFormData] = useState({
    full_name: user?.full_name || '',
    username: user?.username || '',
    email: user?.email || '',
    phone_number: user?.phone_number || '',
    profile_picture: user?.profile_picture || '',
    bio: user?.bio || '',
    student_id: user?.student_id || '',
    date_of_birth: user?.date_of_birth || '',
    gender: user?.gender || '',
    language: user?.language || '',
    timezone: user?.timezone || '',
  });

  useEffect(() => {
    if (!user) return;
    setFormData({
      full_name: user.full_name || '',
      username: user.username || '',
      email: user.email || '',
      phone_number: user.phone_number || '',
      profile_picture: user.profile_picture || '',
      bio: user.bio || '',
      student_id: user.student_id || '',
      date_of_birth: user.date_of_birth || '',
      gender: user.gender || '',
      language: user.language || '',
      timezone: user.timezone || '',
    });
  }, [user]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const run = async () => {
      setIsUniversityLoading(true);
      try {
        const data = await getUniversityOptions();
        if (cancelled) return;

        setUniversities(data.universities || []);
        setDormitories(data.dormitories || []);

        const nextUniversityId = data.current?.university_id;
        const nextDormitoryId = data.current?.dormitory_id;
        setSelectedUniversityId(typeof nextUniversityId === "number" ? String(nextUniversityId) : "");
        setSelectedDormitoryId(typeof nextDormitoryId === "number" ? String(nextDormitoryId) : "");
      } catch {
        if (!cancelled) {
          toast({
            title: "Error",
            description: "Failed to load university options",
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
  }, [getUniversityOptions, isAuthenticated]);

  const handleUniversityChange = async (universityId: string) => {
    setSelectedUniversityId(universityId);
    setSelectedDormitoryId("");
    if (!universityId) {
      setDormitories([]);
    }
    setUniversityFieldErrors(prev => {
      if (!prev.university_id) return prev;
      const { university_id: _removed, ...rest } = prev;
      return rest;
    });

    const parsed = Number(universityId);
    if (!Number.isFinite(parsed)) return;

    setIsUniversityLoading(true);
    try {
      const data = await getUniversityOptions(parsed);
      setUniversities(data.universities || []);
      setDormitories(data.dormitories || []);

      const nextDormitoryId = data.current?.dormitory_id;
      if (typeof nextDormitoryId === "number") {
        setSelectedDormitoryId(String(nextDormitoryId));
      }
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      if (maybe?.errors) {
        setUniversityFieldErrors(maybe.errors);
        toast({
          title: maybe.message || "Validation error",
          description: "Please review your selection",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Error",
          description: maybe?.message || "Failed to load dormitories",
          variant: "destructive",
        });
      }
    } finally {
      setIsUniversityLoading(false);
    }
  };

  const handleDormitoryChange = (dormitoryId: string) => {
    setSelectedDormitoryId(dormitoryId);
    setUniversityFieldErrors(prev => {
      if (!prev.dormitory_id) return prev;
      const { dormitory_id: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleUniversitySubmit = async () => {
    setUniversityFieldErrors({});

    const universityId = Number(selectedUniversityId);
    const dormitoryId = Number(selectedDormitoryId);

    if (!Number.isFinite(universityId) || !Number.isFinite(dormitoryId)) {
      toast({
        title: "Missing selection",
        description: "Please choose both university and dormitory",
        variant: "destructive",
      });
      return;
    }

    setIsUniversitySaving(true);
    try {
      const success = await updateUniversitySettings({ university_id: universityId, dormitory_id: dormitoryId });
      if (!success) {
        toast({
          title: "Error",
          description: "Failed to update university settings",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Updated",
        description: "University settings updated successfully",
      });
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      if (maybe?.errors) {
        setUniversityFieldErrors(maybe.errors);
        toast({
          title: maybe.message || "Validation error",
          description: "Please review the highlighted fields",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error",
        description: maybe?.message || "Failed to update university settings",
        variant: "destructive",
      });
    } finally {
      setIsUniversitySaving(false);
    }
  };

  const handleChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const firstError = useMemo(() => {
    const get = (field: string) => fieldErrors[field]?.[0] || "";
    return { get };
  }, [fieldErrors]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setFieldErrors({});
    
    try {
      const success = await updateProfile({
        full_name: formData.full_name.trim() || undefined,
        username: formData.username.trim() || undefined,
        email: formData.email.trim() || undefined,
        phone_number: formData.phone_number.trim() || undefined,
        profile_picture: formData.profile_picture.trim() || undefined,
        bio: formData.bio.trim() || undefined,
        student_id: formData.student_id.trim() || undefined,
        date_of_birth: formData.date_of_birth || undefined,
        gender: formData.gender.trim() || undefined,
        language: formData.language.trim() || undefined,
        timezone: formData.timezone.trim() || undefined,
      });

      if (!success) {
        toast({
          title: "Error",
          description: "Failed to update profile",
          variant: "destructive",
        });
        return;
      }
      
      toast({
        title: "Profile updated",
        description: "Your changes have been saved",
      });
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      if (maybe?.errors) {
        setFieldErrors(maybe.errors);
        toast({
          title: maybe.message || "Validation error",
          description: "Please review the highlighted fields",
          variant: "destructive",
        });
        return;
      }
      toast({
        title: "Error",
        description: "Failed to update profile",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <User className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">Profile Settings</h1>
            <p className="text-muted-foreground mb-6">
              Log in to manage your profile.
            </p>
            <Button asChild>
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 md:py-12">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">
                Profile Settings
              </h1>
              <p className="text-muted-foreground">
                Manage your account information
              </p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Avatar Section */}
            <div className="flex items-center gap-6 p-6 rounded-2xl bg-muted/50 border border-border">
              <div className="relative">
                <Avatar className="w-24 h-24">
                  <AvatarImage src={user.profile_picture} alt={user.full_name} />
                  <AvatarFallback className="bg-tertiary text-tertiary-foreground text-2xl">
                    {user.full_name?.charAt(0) || 'U'}
                  </AvatarFallback>
                </Avatar>
                <button
                  type="button"
                  className="absolute bottom-0 right-0 p-2 rounded-full bg-primary text-primary-foreground shadow-lg"
                >
                  <Camera className="w-4 h-4" />
                </button>
              </div>
              <div>
                <h2 className="text-xl font-semibold">{user.full_name}</h2>
                <p className="text-muted-foreground">@{user.username}</p>
                <Badge variant="secondary" className="mt-2">
                  {user.role === 'admin' ? 'Admin' : 'Student'}
                </Badge>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="full_name">Full Name</Label>
                  <Input
                    id="full_name"
                    value={formData.full_name}
                    onChange={(e) => handleChange('full_name', e.target.value)}
                    className="h-11"
                  />
                  {firstError.get("full_name") ? (
                    <p className="text-xs text-destructive">{firstError.get("full_name")}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => handleChange('username', e.target.value)}
                    className="h-11"
                  />
                  {firstError.get("username") ? (
                    <p className="text-xs text-destructive">{firstError.get("username")}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => handleChange('email', e.target.value)}
                  className="h-11"
                />
                {firstError.get("email") ? (
                  <p className="text-xs text-destructive">{firstError.get("email")}</p>
                ) : null}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="phone_number">Phone Number</Label>
                  <Input
                    id="phone_number"
                    type="tel"
                    value={formData.phone_number}
                    onChange={(e) => handleChange('phone_number', e.target.value)}
                    placeholder="+1 (555) 000-0000"
                    className="h-11"
                  />
                  {firstError.get("phone_number") ? (
                    <p className="text-xs text-destructive">{firstError.get("phone_number")}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="student_id">Student ID</Label>
                  <Input
                    id="student_id"
                    value={formData.student_id}
                    onChange={(e) => handleChange('student_id', e.target.value)}
                    placeholder="e.g., STU2024001"
                    className="h-11"
                  />
                  {firstError.get("student_id") ? (
                    <p className="text-xs text-destructive">{firstError.get("student_id")}</p>
                  ) : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="profile_picture">Profile Picture URL</Label>
                <Input
                  id="profile_picture"
                  value={formData.profile_picture}
                  onChange={(e) => handleChange('profile_picture', e.target.value)}
                  placeholder="https://..."
                  className="h-11"
                />
                {firstError.get("profile_picture") ? (
                  <p className="text-xs text-destructive">{firstError.get("profile_picture")}</p>
                ) : null}
              </div>

              <div className="space-y-4 p-6 rounded-2xl bg-muted/30 border border-border">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <h3 className="text-base font-semibold text-foreground">University & Dormitory</h3>
                    <p className="text-sm text-muted-foreground">Used for campus matching and listings</p>
                  </div>
                  <Button type="button" onClick={handleUniversitySubmit} disabled={isUniversitySaving || isUniversityLoading}>
                    {isUniversitySaving ? "Saving..." : "Update"}
                  </Button>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>University</Label>
                    <Select value={selectedUniversityId} onValueChange={handleUniversityChange} disabled={isUniversityLoading}>
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={isUniversityLoading ? "Loading..." : "Select university"} />
                      </SelectTrigger>
                      <SelectContent>
                        {universities.map((u) => (
                          <SelectItem key={u.id} value={String(u.id)}>
                            {u.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {universityFieldErrors.university_id?.[0] ? (
                      <p className="text-xs text-destructive">{universityFieldErrors.university_id[0]}</p>
                    ) : null}
                  </div>

                  <div className="space-y-2">
                    <Label>Dormitory</Label>
                    <Select
                      value={selectedDormitoryId}
                      onValueChange={handleDormitoryChange}
                      disabled={!selectedUniversityId || isUniversityLoading}
                    >
                      <SelectTrigger className="h-11">
                        <SelectValue placeholder={isUniversityLoading ? "Loading..." : "Select dormitory"} />
                      </SelectTrigger>
                      <SelectContent>
                        {dormitories.map((d) => (
                          <SelectItem key={d.id} value={String(d.id)} disabled={d.is_active === false}>
                            {d.dormitory_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {universityFieldErrors.dormitory_id?.[0] ? (
                      <p className="text-xs text-destructive">{universityFieldErrors.dormitory_id[0]}</p>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="date_of_birth">Date of Birth</Label>
                  <Input
                    id="date_of_birth"
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => handleChange('date_of_birth', e.target.value)}
                    className="h-11"
                  />
                  {firstError.get("date_of_birth") ? (
                    <p className="text-xs text-destructive">{firstError.get("date_of_birth")}</p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="gender">Gender</Label>
                  <Select value={formData.gender} onValueChange={(value) => handleChange('gender', value)}>
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
                  {firstError.get("gender") ? <p className="text-xs text-destructive">{firstError.get("gender")}</p> : null}
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="language">Language</Label>
                  <Input
                    id="language"
                    value={formData.language}
                    onChange={(e) => handleChange('language', e.target.value)}
                    placeholder="e.g., en"
                    className="h-11"
                  />
                  {firstError.get("language") ? <p className="text-xs text-destructive">{firstError.get("language")}</p> : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <Input
                    id="timezone"
                    value={formData.timezone}
                    onChange={(e) => handleChange('timezone', e.target.value)}
                    placeholder="e.g., UTC, America/Los_Angeles"
                    className="h-11"
                  />
                  {firstError.get("timezone") ? <p className="text-xs text-destructive">{firstError.get("timezone")}</p> : null}
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  value={formData.bio}
                  onChange={(e) => handleChange('bio', e.target.value)}
                  placeholder="Tell other students a bit about yourself..."
                  rows={4}
                />
                {firstError.get("bio") ? <p className="text-xs text-destructive">{firstError.get("bio")}</p> : null}
              </div>
            </div>

            {/* Submit */}
            <div className="flex justify-end gap-4">
              <Button type="button" variant="outline" onClick={() => navigate(-1)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSaving}>
                <Save className="w-4 h-4" />
                {isSaving ? 'Saving...' : 'Save Changes'}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProfilePage;
