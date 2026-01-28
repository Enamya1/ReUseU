import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { AlertCircle, ArrowLeft, Package } from 'lucide-react';
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
import { formatPrice, formatRelativeTime } from '@/lib/mockData';
import { normalizeImageUrl } from '@/lib/api';

type CategoryOption = { id: number; name: string; icon?: string | null; parent_id?: number | null };
type ConditionLevelOption = { id: number; name: string; description?: string | null; sort_order?: number | null };
type TagOption = { id: number; name: string };
type DormitoryOption = { id: number; dormitory_name: string; is_active?: boolean; university_id?: number };
type ProductImage = { id: number; product_id: number; image_url: string; image_thumbnail_url?: string | null; is_primary: boolean };
type EditableProduct = {
  id: number;
  title: string;
  description?: string | null;
  price: number;
  status: 'available' | 'sold' | 'reserved';
  created_at?: string;
  category_id: number;
  condition_level_id: number;
  dormitory_id?: number | null;
  images?: ProductImage[];
  tags?: TagOption[];
  tag_ids?: number[];
  category?: CategoryOption;
  condition_level?: ConditionLevelOption;
  dormitory?: DormitoryOption;
};

const MyListingDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const {
    user,
    isAuthenticated,
    getMetaOptions,
    getDormitoriesByUniversity,
    getProductForEdit,
    updateProduct,
    markProductSold,
  } = useAuth();
  const [product, setProduct] = useState<EditableProduct | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: '',
    category_id: '',
    condition_level_id: '',
    dormitory_id: '',
    tags: [] as number[],
  });
  const [fieldErrors, setFieldErrors] = useState<Record<string, string[]>>({});
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [conditionLevels, setConditionLevels] = useState<ConditionLevelOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [dormitories, setDormitories] = useState<DormitoryOption[]>([]);
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isMarkingSold, setIsMarkingSold] = useState(false);
  const [errorState, setErrorState] = useState<'not_found' | 'error' | null>(null);

  const productId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    if (!productId) {
      setErrorState('not_found');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setErrorState(null);
    setFieldErrors({});

    const run = async () => {
      try {
        const [meta, dorms, detail] = await Promise.all([
          getMetaOptions(),
          getDormitoriesByUniversity(),
          getProductForEdit(productId),
        ]);
        if (cancelled) return;

        setCategories(meta.categories || []);
        setConditionLevels(meta.condition_levels || []);
        setTags(meta.tags || []);
        setDormitories(dorms.dormitories || []);

        if (!detail.product) {
          setErrorState('not_found');
          setProduct(null);
          return;
        }

        setProduct(detail.product as EditableProduct);
        setCurrentImageIndex(0);
        setFormData({
          title: detail.product.title || '',
          description: detail.product.description || '',
          price: typeof detail.product.price === 'number' ? String(detail.product.price) : '',
          category_id: detail.product.category_id ? String(detail.product.category_id) : '',
          condition_level_id: detail.product.condition_level_id ? String(detail.product.condition_level_id) : '',
          dormitory_id: detail.product.dormitory_id ? String(detail.product.dormitory_id) : '',
          tags: detail.product.tag_ids || detail.product.tags?.map(tag => tag.id) || [],
        });
      } catch (error) {
        if (cancelled) return;
        const maybe = error as { message?: string; errors?: Record<string, string[]> } | undefined;
        if (maybe?.errors) setFieldErrors(maybe.errors);
        if (maybe?.message?.toLowerCase().includes('not found')) {
          setErrorState('not_found');
        } else {
          setErrorState('error');
          toast({
            title: "Error",
            description: maybe?.message || "Failed to load listing",
            variant: "destructive",
          });
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [getDormitoriesByUniversity, getMetaOptions, getProductForEdit, isAuthenticated, productId, user]);

  const updateField = (key: keyof typeof formData, value: string | number[]) => {
    setFormData(prev => ({ ...prev, [key]: value }));
    setFieldErrors(prev => {
      if (!prev[key]) return prev;
      const { [key]: _removed, ...rest } = prev;
      return rest;
    });
  };

  const toggleTag = (tagId: number) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags.includes(tagId) ? prev.tags.filter(id => id !== tagId) : [...prev.tags, tagId],
    }));
    setFieldErrors(prev => {
      if (!prev.tag_ids) return prev;
      const { tag_ids: _removed, ...rest } = prev;
      return rest;
    });
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!product) return;

    const validationErrors: Record<string, string[]> = {};
    if (!formData.title.trim()) validationErrors.title = ["Title is required"];
    if (!formData.category_id) validationErrors.category_id = ["Category is required"];
    if (!formData.condition_level_id) validationErrors.condition_level_id = ["Condition is required"];
    const parsedPrice = Number(formData.price);
    if (!Number.isFinite(parsedPrice) || parsedPrice <= 0) validationErrors.price = ["Enter a valid price"];

    if (Object.keys(validationErrors).length > 0) {
      setFieldErrors(validationErrors);
      toast({
        title: "Validation error",
        description: "Please review the highlighted fields",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    setFieldErrors({});
    try {
      const payload = {
        title: formData.title.trim(),
        description: formData.description.trim() ? formData.description.trim() : null,
        price: parsedPrice,
        category_id: Number(formData.category_id),
        condition_level_id: Number(formData.condition_level_id),
        dormitory_id: formData.dormitory_id ? Number(formData.dormitory_id) : null,
        tag_ids: formData.tags.length ? formData.tags : null,
      };

      const result = await updateProduct(product.id, payload);
      const nextProduct = result.product ? (result.product as EditableProduct) : { ...product, ...payload };
      setProduct(nextProduct);
      toast({
        title: "Listing updated",
        description: result.message || "Changes saved",
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
      } else {
        toast({
          title: "Error",
          description: maybe?.message || "Failed to update listing",
          variant: "destructive",
        });
      }
    } finally {
      setIsSaving(false);
    }
  };

  const handleMarkSold = async () => {
    if (!product) return;
    setIsMarkingSold(true);
    try {
      const result = await markProductSold(product.id);
      setProduct(prev => (prev ? { ...prev, status: result.product?.status || 'sold' } : prev));
      toast({
        title: "Marked as sold",
        description: result.message || "Your item is now marked as sold",
      });
    } catch (error) {
      const maybe = error as { message?: string } | undefined;
      toast({
        title: "Error",
        description: maybe?.message || "Failed to mark as sold",
        variant: "destructive",
      });
    } finally {
      setIsMarkingSold(false);
    }
  };

  if (!isAuthenticated || !user) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">Manage your listings</h1>
            <p className="text-muted-foreground mb-6">
              Log in to view and manage your listings.
            </p>
            <Button asChild>
              <Link to="/login">Log in</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (errorState === 'not_found') {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">Listing not found</h1>
            <p className="text-muted-foreground mb-6">
              This listing may have been removed or is no longer available.
            </p>
            <Button asChild>
              <Link to="/my-listings">Back to My Listings</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  if (isLoading || !product) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Loading listing...</h2>
            <p className="text-muted-foreground">Fetching your item details</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  const images = product.images || [];
  const primaryImage = images[currentImageIndex] || images.find(img => img.is_primary) || images[0];
  const selectedTags = tags.filter(tag => formData.tags.includes(tag.id));

  return (
    <MainLayout>
      <div className="container py-8 md:py-12 space-y-8">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <Button variant="ghost" size="sm" onClick={() => navigate(-1)}>
              <ArrowLeft className="w-4 h-4" />
              Back
            </Button>
            <h1 className="text-3xl font-display font-bold text-foreground mt-2">
              {product.title || "Listing details"}
            </h1>
            <div className="flex flex-wrap gap-2 mt-2">
              <Badge variant={product.status === 'sold' ? "secondary" : "outline"}>
                {product.status === 'sold' ? 'Sold' : product.status === 'reserved' ? 'Reserved' : 'Available'}
              </Badge>
              {product.category?.name ? (
                <Badge variant="secondary">
                  {product.category.icon ? `${product.category.icon} ` : ''}{product.category.name}
                </Badge>
              ) : null}
              {product.condition_level?.name ? (
                <Badge variant="outline">{product.condition_level.name}</Badge>
              ) : null}
            </div>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button
              variant="ghost"
              disabled={product.status === 'sold' || isMarkingSold}
              onClick={handleMarkSold}
              className={cn(
                "mark-sold-btn",
                product.status === 'sold' && "mark-sold-btn--sold"
              )}
            >
              {product.status === 'sold' ? 'Marked Sold' : 'Mark as Sold'}
            </Button>
            <Button
              variant="outline"
              onClick={() => navigate('/my-listings')}
            >
              Back to Listings
            </Button>
          </div>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="space-y-6">
            <div className="rounded-2xl border border-border overflow-hidden bg-card">
              <div className="relative aspect-square bg-muted">
                {primaryImage ? (
                  <img
                    src={normalizeImageUrl(primaryImage.image_url)}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    No image
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="grid grid-cols-5 gap-2 p-4">
                  {images.map((image, index) => (
                    <button
                      key={image.id}
                      type="button"
                      onClick={() => setCurrentImageIndex(index)}
                      className={cn(
                        "relative aspect-square rounded-lg overflow-hidden border-2 transition-colors",
                        index === currentImageIndex ? "border-primary" : "border-transparent"
                      )}
                    >
                      <img
                        src={normalizeImageUrl(image.image_thumbnail_url || image.image_url)}
                        alt={`${product.title} ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border bg-card p-6 space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Listed price</p>
                  <p className="text-2xl font-display font-bold">{formatPrice(product.price)}</p>
                </div>
                {product.created_at ? (
                  <div className="text-right">
                    <p className="text-sm text-muted-foreground">Listed</p>
                    <p className="text-sm font-medium">{formatRelativeTime(product.created_at)}</p>
                  </div>
                ) : null}
              </div>

              {product.description ? (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Description</p>
                  <p className="text-sm text-foreground leading-relaxed">{product.description}</p>
                </div>
              ) : null}

              {selectedTags.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {selectedTags.map(tag => (
                    <Badge key={tag.id} className="bg-accent text-accent-foreground">
                      #{tag.name}
                    </Badge>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6">
            <form className="space-y-5" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
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
                  value={formData.description}
                  onChange={(e) => updateField('description', e.target.value)}
                  rows={4}
                />
                {fieldErrors.description?.[0] ? (
                  <p className="text-xs text-destructive">{fieldErrors.description[0]}</p>
                ) : null}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($) *</Label>
                  <Input
                    id="price"
                    type="number"
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
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select category" />
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

              <div className="grid gap-4 md:grid-cols-2">
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
                  <Label htmlFor="dormitory">Location</Label>
                  <Select
                    value={formData.dormitory_id}
                    onValueChange={(value) => updateField('dormitory_id', value)}
                  >
                    <SelectTrigger className="h-12">
                      <SelectValue placeholder="Select dormitory" />
                    </SelectTrigger>
                    <SelectContent>
                      {dormitories.length ? (
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

              <div className="space-y-3">
                <Label>Tags</Label>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
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
              </div>

              <div className="flex flex-wrap gap-3 pt-2">
                <Button type="submit" disabled={isSaving}>
                  {isSaving ? 'Saving...' : 'Save Changes'}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate('/my-listings')}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default MyListingDetailPage;
