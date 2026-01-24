import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Upload, X, Plus, ImageIcon } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Step = 'details' | 'media' | 'tags' | 'review';

type MediaItem =
  | { kind: 'file'; file: File; previewUrl: string }
  | { kind: 'url'; url: string };

type CategoryOption = { id: number; name: string; icon?: string | null };
type ConditionLevelOption = { id: number; name: string; description?: string | null; sort_order?: number | null };
type TagOption = { id: number; name: string };
type DormitoryOption = { id: number; dormitory_name: string; is_active?: boolean; university_id?: number };

const CreateListingPage: React.FC = () => {
  const { user, isAuthenticated, createProduct, getMetaOptions, getDormitoriesByUniversity } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isMetaLoading, setIsMetaLoading] = useState(false);
  const [isDormitoriesLoading, setIsDormitoriesLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [media, setMedia] = useState<MediaItem[]>([]);
  const [primaryImageIndex, setPrimaryImageIndex] = useState(0);
  const [imageUrlDraft, setImageUrlDraft] = useState('');
  const mediaRef = useRef<MediaItem[]>([]);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [conditionLevels, setConditionLevels] = useState<ConditionLevelOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [dormitories, setDormitories] = useState<DormitoryOption[]>([]);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    condition_level_id: '',
    dormitory_id: user?.dormitory_id?.toString() || '',
    tags: [] as number[],
  });

  useEffect(() => {
    mediaRef.current = media;
  }, [media]);

  useEffect(() => {
    return () => {
      mediaRef.current.forEach((item) => {
        if (item.kind === 'file') URL.revokeObjectURL(item.previewUrl);
      });
    };
  }, []);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const run = async () => {
      setIsMetaLoading(true);
      try {
        const data = await getMetaOptions();
        if (cancelled) return;
        setCategories(data.categories || []);
        setConditionLevels(data.condition_levels || []);
        setTags(data.tags || []);
      } catch (error) {
        if (cancelled) return;
        const maybe = error as { message?: string } | undefined;
        toast({
          title: "Error",
          description: maybe?.message || "Failed to load listing options",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setIsMetaLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [getMetaOptions, isAuthenticated]);

  useEffect(() => {
    if (!user?.dormitory_id) return;
    setFormData((prev) => {
      if (prev.dormitory_id) return prev;
      return { ...prev, dormitory_id: String(user.dormitory_id) };
    });
  }, [user?.dormitory_id]);

  useEffect(() => {
    if (!isAuthenticated) return;
    let cancelled = false;

    const run = async () => {
      setIsDormitoriesLoading(true);
      try {
        const data = await getDormitoriesByUniversity();
        if (cancelled) return;
        setDormitories(data.dormitories || []);
      } catch (error) {
        if (cancelled) return;
        setDormitories([]);
        const maybe = error as { message?: string } | undefined;
        toast({
          title: "Error",
          description: maybe?.message || "Failed to load dormitories",
          variant: "destructive",
        });
      } finally {
        if (!cancelled) setIsDormitoriesLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [getDormitoriesByUniversity, isAuthenticated]);

  const steps: { id: Step; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'media', label: 'Photos' },
    { id: 'tags', label: 'Tags' },
    { id: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const updateField = (field: string, value: string | number[] | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setFieldErrors(prev => {
      if (!prev[field]) return prev;
      const { [field]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId],
    }));
    setFieldErrors(prev => {
      if (!prev.tag_ids) return prev;
      const { tag_ids: _removed, ...rest } = prev;
      return rest;
    });
  };

  const addFiles = (files: FileList | null) => {
    if (!files) return;

    const candidates: File[] = [];
    Array.from(files).forEach((file) => {
      const type = file.type.toLowerCase();
      const allowed =
        type === 'image/jpeg' ||
        type === 'image/jpg' ||
        type === 'image/png' ||
        type === 'image/webp';
      if (!allowed) return;
      candidates.push(file);
    });

    setMedia(prev => {
      const remaining = Math.max(0, 6 - prev.length);
      const slice = candidates.slice(0, remaining);
      const nextItems: MediaItem[] = slice.map((file) => ({
        kind: 'file',
        file,
        previewUrl: URL.createObjectURL(file),
      }));
      return [...prev, ...nextItems];
    });
    setFieldErrors(prev => {
      if (!prev.images) return prev;
      const { images: _removed, ...rest } = prev;
      return rest;
    });
  };

  const addImageUrl = () => {
    const url = imageUrlDraft.trim();
    if (!url) return;
    setMedia(prev => {
      if (prev.length >= 6) return prev;
      return [...prev, { kind: 'url', url }];
    });
    setImageUrlDraft('');
    setFieldErrors(prev => {
      if (!prev.image_urls) return prev;
      const { image_urls: _removed, ...rest } = prev;
      return rest;
    });
  };

  const removeMedia = (index: number) => {
    setMedia(prev => {
      const target = prev[index];
      if (target?.kind === 'file') URL.revokeObjectURL(target.previewUrl);

      const next = prev.filter((_, i) => i !== index);
      setPrimaryImageIndex((prevPrimary) => {
        if (prevPrimary >= next.length) return Math.max(0, next.length - 1);
        if (index < prevPrimary) return Math.max(0, prevPrimary - 1);
        if (index === prevPrimary) return Math.min(prevPrimary, Math.max(0, next.length - 1));
        return prevPrimary;
      });
      return next;
    });
  };

  const dormitoryRequired = !user?.dormitory_id;
  const mediaPreviewUrls = useMemo(() => {
    return media.map((item) => (item.kind === 'file' ? item.previewUrl : item.url));
  }, [media]);

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'details':
        return !!(
          formData.title &&
          formData.price &&
          Number.parseFloat(formData.price) >= 0.01 &&
          formData.category_id &&
          formData.condition_level_id &&
          (!dormitoryRequired || !!formData.dormitory_id)
        );
      case 'media':
        return media.length > 0;
      case 'tags':
        return true;
      case 'review':
        return true;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (currentStepIndex < steps.length - 1) {
      setCurrentStep(steps[currentStepIndex + 1].id);
    }
  };

  const prevStep = () => {
    if (currentStepIndex > 0) {
      setCurrentStep(steps[currentStepIndex - 1].id);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setFieldErrors({});
    
    try {
      const categoryId = Number(formData.category_id);
      const conditionLevelId = Number(formData.condition_level_id);
      const price = Number.parseFloat(formData.price);
      const dormitoryId = formData.dormitory_id
        ? Number(formData.dormitory_id)
        : typeof user?.dormitory_id === 'number'
          ? user.dormitory_id
          : undefined;

      if (!Number.isFinite(categoryId) || !Number.isFinite(conditionLevelId) || !Number.isFinite(price)) {
        toast({ title: "Missing fields", description: "Please fill the required fields", variant: "destructive" });
        setCurrentStep('details');
        return;
      }
      if (price < 0.01) {
        toast({ title: "Invalid price", description: "Price must be at least 0.01", variant: "destructive" });
        setCurrentStep('details');
        return;
      }
      if (dormitoryRequired && !Number.isFinite(dormitoryId)) {
        toast({ title: "Missing location", description: "Please select your dormitory", variant: "destructive" });
        setCurrentStep('details');
        return;
      }

      const files = media
        .filter((item): item is Extract<MediaItem, { kind: 'file' }> => item.kind === 'file')
        .map((item) => item.file);
      const urls = media
        .filter((item): item is Extract<MediaItem, { kind: 'url' }> => item.kind === 'url')
        .map((item) => item.url);

      const result = await createProduct({
        category_id: categoryId,
        condition_level_id: conditionLevelId,
        title: formData.title.trim(),
        description: formData.description.trim() || null,
        price,
        dormitory_id: Number.isFinite(dormitoryId) ? dormitoryId : undefined,
        tag_ids: formData.tags.length ? formData.tags : null,
        primary_image_index: media.length ? primaryImageIndex : null,
        images: files.length ? files : null,
        image_urls: urls.length ? urls : null,
      });

      toast({
        title: "Listing created!",
        description: result.message || "Your item is now live on SCU",
      });
      navigate('/my-listings');
    } catch (error) {
      const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
      if (maybe?.errors) {
        setFieldErrors(maybe.errors);
        const errorKeys = Object.keys(maybe.errors);
        if (errorKeys.some((k) => k.includes('image'))) setCurrentStep('media');
        else setCurrentStep('details');
        toast({
          title: maybe.message || "Validation error",
          description: "Please review the highlighted fields",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Error",
        description: maybe?.message || "Failed to create listing",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Upload className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">Start selling</h1>
            <p className="text-muted-foreground mb-6">
              Log in to create a listing and start selling to your campus community.
            </p>
            <Button asChild>
              <Link to="/login">
                Log in to continue
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const selectedCategory = categories.find(c => c.id.toString() === formData.category_id);
  const selectedCondition = conditionLevels.find(c => c.id.toString() === formData.condition_level_id);
  const selectedDormitory = dormitories.find(d => d.id.toString() === formData.dormitory_id);
  const selectedTags = tags.filter(t => formData.tags.includes(t.id));
  const primaryPreviewUrl = mediaPreviewUrls[primaryImageIndex] || mediaPreviewUrls[0] || '';

  return (
    <MainLayout showFooter={false}>
      <div className="min-h-[calc(100vh-4rem)] flex flex-col">
        {/* Progress Header */}
        <div className="border-b border-border bg-card">
          <div className="container py-4">
            <div className="flex items-center justify-between mb-4">
              <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
                <ArrowLeft className="w-4 h-4" />
                Back
              </Button>
              <h1 className="font-display font-bold text-lg">Create Listing</h1>
              <div className="w-20" /> {/* Spacer */}
            </div>
            
            {/* Step Indicators */}
            <div className="flex items-center gap-2">
              {steps.map((step, index) => (
                <React.Fragment key={step.id}>
                  <button
                    onClick={() => index < currentStepIndex && setCurrentStep(step.id)}
                    disabled={index > currentStepIndex}
                    className={cn(
                      "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium transition-colors",
                      currentStep === step.id
                        ? "bg-primary text-primary-foreground"
                        : index < currentStepIndex
                        ? "bg-success text-success-foreground cursor-pointer"
                        : "bg-muted text-muted-foreground"
                    )}
                  >
                    <span className="w-5 h-5 rounded-full bg-current/20 flex items-center justify-center text-xs">
                      {index + 1}
                    </span>
                    <span className="hidden sm:inline">{step.label}</span>
                  </button>
                  {index < steps.length - 1 && (
                    <div className={cn(
                      "flex-1 h-0.5 rounded-full",
                      index < currentStepIndex ? "bg-success" : "bg-muted"
                    )} />
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

        {/* Form Content */}
        <div className="flex-1 container py-8">
          <div className="max-w-2xl mx-auto">
            {/* Details Step */}
            {currentStep === 'details' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Item Details</h2>
                  <p className="text-muted-foreground">Tell us about what you're selling</p>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="title">Title *</Label>
                    <Input
                      id="title"
                      placeholder="e.g., MacBook Pro 2021"
                      value={formData.title}
                      onChange={(e) => updateField('title', e.target.value)}
                      className="h-12"
                    />
                    {fieldErrors.title?.[0] ? <p className="text-xs text-destructive">{fieldErrors.title[0]}</p> : null}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="description">Description</Label>
                    <Textarea
                      id="description"
                      placeholder="Describe your item, condition, and any details buyers should know..."
                      value={formData.description}
                      onChange={(e) => updateField('description', e.target.value)}
                      rows={4}
                    />
                    {fieldErrors.description?.[0] ? (
                      <p className="text-xs text-destructive">{fieldErrors.description[0]}</p>
                    ) : null}
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="price">Price ($) *</Label>
                      <Input
                        id="price"
                        type="number"
                        placeholder="0"
                        value={formData.price}
                        onChange={(e) => updateField('price', e.target.value)}
                        className="h-12"
                        min="0.01"
                        step="0.01"
                      />
                      {fieldErrors.price?.[0] ? <p className="text-xs text-destructive">{fieldErrors.price[0]}</p> : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => updateField('category_id', value)}
                        disabled={isMetaLoading}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={isMetaLoading ? "Loading..." : "Select category"} />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.icon ? `${category.icon} ` : ''}{category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.category_id?.[0] ? (
                        <p className="text-xs text-destructive">{fieldErrors.category_id[0]}</p>
                      ) : null}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select
                        value={formData.condition_level_id}
                        onValueChange={(value) => updateField('condition_level_id', value)}
                        disabled={isMetaLoading}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={isMetaLoading ? "Loading..." : "Select condition"} />
                        </SelectTrigger>
                        <SelectContent>
                          {conditionLevels.map((level) => (
                            <SelectItem key={level.id} value={level.id.toString()}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {fieldErrors.condition_level_id?.[0] ? (
                        <p className="text-xs text-destructive">{fieldErrors.condition_level_id[0]}</p>
                      ) : null}
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dormitory">Location{dormitoryRequired ? ' *' : ''}</Label>
                      <Select
                        value={formData.dormitory_id}
                        onValueChange={(value) => updateField('dormitory_id', value)}
                        disabled={isDormitoriesLoading || (dormitoryRequired && dormitories.length === 0)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder={isDormitoriesLoading ? "Loading..." : "Select dormitory"} />
                        </SelectTrigger>
                        <SelectContent>
                          {isDormitoriesLoading ? (
                            <SelectItem value="__loading" disabled>
                              Loading...
                            </SelectItem>
                          ) : dormitories.length ? (
                            dormitories.map((dorm) => (
                              <SelectItem key={dorm.id} value={dorm.id.toString()}>
                                {dorm.dormitory_name}
                              </SelectItem>
                            ))
                          ) : (
                            <SelectItem value="__empty" disabled>
                              No dormitories available
                            </SelectItem>
                          )}
                        </SelectContent>
                      </Select>
                      {fieldErrors.dormitory_id?.[0] ? (
                        <p className="text-xs text-destructive">{fieldErrors.dormitory_id[0]}</p>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Media Step */}
            {currentStep === 'media' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Add Photos</h2>
                  <p className="text-muted-foreground">Add up to 6 photos of your item</p>
                </div>

                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label htmlFor="image_files">Upload images</Label>
                    <Input
                      id="image_files"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      multiple
                      onChange={(e) => addFiles(e.target.files)}
                      ref={fileInputRef}
                    />
                    {fieldErrors.images?.[0] ? <p className="text-xs text-destructive">{fieldErrors.images[0]}</p> : null}
                  </div>

                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label htmlFor="image_url" className="sr-only">
                        Image URL
                      </Label>
                      <Input
                        id="image_url"
                        placeholder="https://example.com/image.jpg"
                        value={imageUrlDraft}
                        onChange={(e) => setImageUrlDraft(e.target.value)}
                      />
                    </div>
                    <Button type="button" variant="outline" onClick={addImageUrl} disabled={media.length >= 6}>
                      Add URL
                    </Button>
                  </div>
                  {fieldErrors.image_urls?.[0] ? (
                    <p className="text-xs text-destructive">{fieldErrors.image_urls[0]}</p>
                  ) : null}
                </div>

                <div className="grid grid-cols-3 gap-4">
                  {mediaPreviewUrls.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                      <button
                        type="button"
                        onClick={() => setPrimaryImageIndex(index)}
                        className="absolute inset-0"
                      >
                        <img src={image} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      </button>
                      <button
                        type="button"
                        onClick={() => removeMedia(index)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/80 text-background opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === primaryImageIndex && (
                        <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground">
                          Primary
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {media.length < 6 && (
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm font-medium">Add Photos</span>
                    </button>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> Click a photo to set it as the primary image.
                </p>
              </div>
            )}

            {/* Tags Step */}
            {currentStep === 'tags' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Add Tags</h2>
                  <p className="text-muted-foreground">Help buyers find your item with relevant tags</p>
                </div>

                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      onClick={() => toggleTag(tag.id)}
                      className={cn(
                        "px-4 py-2 rounded-full text-sm font-medium transition-all",
                        formData.tags.includes(tag.id)
                          ? "bg-primary text-primary-foreground"
                          : "bg-muted text-muted-foreground hover:bg-accent hover:text-accent-foreground"
                      )}
                    >
                      #{tag.name}
                    </button>
                  ))}
                </div>
                {fieldErrors.tag_ids?.[0] ? <p className="text-xs text-destructive">{fieldErrors.tag_ids[0]}</p> : null}

                {formData.tags.length > 0 && (
                  <p className="text-sm text-muted-foreground">
                    {formData.tags.length} tag{formData.tags.length !== 1 ? 's' : ''} selected
                  </p>
                )}
              </div>
            )}

            {/* Review Step */}
            {currentStep === 'review' && (
              <div className="space-y-6 animate-fade-in">
                <div>
                  <h2 className="text-2xl font-display font-bold mb-2">Review Listing</h2>
                  <p className="text-muted-foreground">Make sure everything looks good</p>
                </div>

                {/* Preview Card */}
                <div className="rounded-2xl border border-border overflow-hidden bg-card">
                  {primaryPreviewUrl ? (
                    <div className="aspect-video bg-muted">
                      <img
                        src={primaryPreviewUrl}
                        alt={formData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  ) : null}
                  
                  <div className="p-6 space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-2xl font-bold">${formData.price}</p>
                        <h3 className="text-lg font-semibold">{formData.title || 'Untitled'}</h3>
                      </div>
                    </div>

                    {formData.description && (
                      <p className="text-muted-foreground">{formData.description}</p>
                    )}

                    <div className="flex flex-wrap gap-2">
                      {selectedCategory && (
                        <Badge variant="secondary">
                          {selectedCategory.icon} {selectedCategory.name}
                        </Badge>
                      )}
                      {selectedCondition && (
                        <Badge variant="outline">{selectedCondition.name}</Badge>
                      )}
                      {selectedDormitory && (
                        <Badge variant="outline">{selectedDormitory.dormitory_name}</Badge>
                      )}
                    </div>

                    {selectedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {selectedTags.map(tag => (
                          <Badge key={tag.id} className="bg-accent text-accent-foreground">
                            #{tag.name}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Actions */}
        <div className="border-t border-border bg-card py-4">
          <div className="container flex justify-between max-w-2xl mx-auto">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={currentStepIndex === 0}
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>

            {currentStep === 'review' ? (
              <Button
                variant="hero"
                onClick={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? 'Publishing...' : 'Publish Listing'}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                onClick={nextStep}
                disabled={!canProceed()}
              >
                Continue
                <ArrowRight className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default CreateListingPage;
