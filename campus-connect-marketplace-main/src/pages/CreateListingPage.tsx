import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { ArrowLeft, ArrowRight, Upload, X, Plus, ImageIcon } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { mockCategories, mockConditionLevels, mockTags, mockDormitories } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

type Step = 'details' | 'media' | 'tags' | 'review';

const CreateListingPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  const [currentStep, setCurrentStep] = useState<Step>('details');
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    condition_level_id: '',
    dormitory_id: user?.dormitory_id?.toString() || '',
    tags: [] as number[],
    images: [] as string[],
  });

  const steps: { id: Step; label: string }[] = [
    { id: 'details', label: 'Details' },
    { id: 'media', label: 'Photos' },
    { id: 'tags', label: 'Tags' },
    { id: 'review', label: 'Review' },
  ];

  const currentStepIndex = steps.findIndex(s => s.id === currentStep);

  const updateField = (field: string, value: string | number[] | string[]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId)
        ? prev.tags.filter(id => id !== tagId)
        : [...prev.tags, tagId],
    }));
  };

  const addImage = () => {
    // Demo: add placeholder images
    const demoImages = [
      'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=600&h=400&fit=crop',
      'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=600&h=400&fit=crop',
    ];
    
    if (formData.images.length < 6) {
      const nextImage = demoImages[formData.images.length % demoImages.length];
      updateField('images', [...formData.images, nextImage]);
    }
  };

  const removeImage = (index: number) => {
    updateField('images', formData.images.filter((_, i) => i !== index));
  };

  const canProceed = (): boolean => {
    switch (currentStep) {
      case 'details':
        return !!(formData.title && formData.price && formData.category_id && formData.condition_level_id);
      case 'media':
        return formData.images.length > 0;
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
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    toast({
      title: "Listing created!",
      description: "Your item is now live on SafeGate",
    });
    
    navigate('/my-listings');
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

  const selectedCategory = mockCategories.find(c => c.id.toString() === formData.category_id);
  const selectedCondition = mockConditionLevels.find(c => c.id.toString() === formData.condition_level_id);
  const selectedDormitory = mockDormitories.find(d => d.id.toString() === formData.dormitory_id);
  const selectedTags = mockTags.filter(t => formData.tags.includes(t.id));

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
                        min="0"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="category">Category *</Label>
                      <Select
                        value={formData.category_id}
                        onValueChange={(value) => updateField('category_id', value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockCategories.map((category) => (
                            <SelectItem key={category.id} value={category.id.toString()}>
                              {category.icon} {category.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="condition">Condition *</Label>
                      <Select
                        value={formData.condition_level_id}
                        onValueChange={(value) => updateField('condition_level_id', value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select condition" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockConditionLevels.map((level) => (
                            <SelectItem key={level.id} value={level.id.toString()}>
                              {level.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="dormitory">Location</Label>
                      <Select
                        value={formData.dormitory_id}
                        onValueChange={(value) => updateField('dormitory_id', value)}
                      >
                        <SelectTrigger className="h-12">
                          <SelectValue placeholder="Select dormitory" />
                        </SelectTrigger>
                        <SelectContent>
                          {mockDormitories.map((dorm) => (
                            <SelectItem key={dorm.id} value={dorm.id.toString()}>
                              {dorm.dormitory_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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

                <div className="grid grid-cols-3 gap-4">
                  {formData.images.map((image, index) => (
                    <div key={index} className="relative aspect-square rounded-xl overflow-hidden bg-muted group">
                      <img src={image} alt={`Photo ${index + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => removeImage(index)}
                        className="absolute top-2 right-2 p-1.5 rounded-full bg-foreground/80 text-background opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <X className="w-4 h-4" />
                      </button>
                      {index === 0 && (
                        <Badge className="absolute bottom-2 left-2 bg-primary text-primary-foreground">
                          Primary
                        </Badge>
                      )}
                    </div>
                  ))}
                  
                  {formData.images.length < 6 && (
                    <button
                      onClick={addImage}
                      className="aspect-square rounded-xl border-2 border-dashed border-border hover:border-primary hover:bg-primary/5 transition-colors flex flex-col items-center justify-center gap-2 text-muted-foreground hover:text-primary"
                    >
                      <Plus className="w-8 h-8" />
                      <span className="text-sm font-medium">Add Photo</span>
                    </button>
                  )}
                </div>

                <p className="text-sm text-muted-foreground">
                  <strong>Tip:</strong> The first photo will be your primary image. 
                  Click "Add Photo" to add demo images.
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
                  {mockTags.map((tag) => (
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
                  {formData.images.length > 0 && (
                    <div className="aspect-video bg-muted">
                      <img
                        src={formData.images[0]}
                        alt={formData.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  
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
