import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, MapPin, Clock, User, ChevronLeft, ChevronRight, MessageCircle, AlertCircle, ArrowLeftRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { formatRelativeTime } from '@/lib/mockData';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import ProductGrid from '@/components/products/ProductGrid';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import type { Category, ConditionLevel, Dormitory, Product, ProductImage, Tag, User as UserProfile, MetaCategoryOption, MetaConditionLevelOption } from '@/lib/mockData';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated, getProductDetail, getSimilarProducts, getMetaOptions } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const { formatSelectedCurrencyParts } = useCurrency();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);
  const [product, setProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [similarProducts, setSimilarProducts] = useState<Product[]>([]);
  const [similarLoading, setSimilarLoading] = useState(true);
  const [categories, setCategories] = useState<MetaCategoryOption[]>([]);
  const [conditions, setConditions] = useState<MetaConditionLevelOption[]>([]);

  useEffect(() => {
    const fetchMeta = async () => {
      if (!isAuthenticated) return;
      try {
        const data = await getMetaOptions();
        if (data.categories) setCategories(data.categories);
        if (data.condition_levels) setConditions(data.condition_levels);
      } catch (error) {
        console.error('Error fetching meta options:', error);
      }
    };
    fetchMeta();
  }, [getMetaOptions, isAuthenticated]);

  useEffect(() => {
    if (!id) {
      setProduct(null);
      setIsLoading(false);
      return;
    }
    if (!isAuthenticated) {
      toast({
        title: t('product.loginRequired'),
        description: t('product.loginToContact'),
      });
      navigate('/login');
      setProduct(null);
      setIsLoading(false);
      return;
    }
    const productId = Number(id);
    if (!Number.isFinite(productId)) {
      setProduct(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    setCurrentImageIndex(0);

    const mapProductImage = (image: {
      id?: number;
      image_url?: string;
      image_thumbnail_url?: string | null;
      is_primary?: boolean;
    }, index: number, fallbackProductId: number): ProductImage | null => {
      const url = image.image_url || image.image_thumbnail_url;
      if (!url) return null;
      return {
        id: typeof image.id === 'number' ? image.id : index + 1,
        product_id: fallbackProductId,
        image_url: url,
        image_thumbnail_url: image.image_thumbnail_url ?? undefined,
        is_primary: Boolean(image.is_primary),
      };
    };

    const mapApiProduct = (data: {
      id?: number;
      title?: string;
      description?: string | null;
      price?: number;
      currency?: string;
      status?: 'available' | 'sold' | 'reserved';
      created_at?: string;
      is_promoted?: number | boolean | null;
      seller_id?: number;
      seller?: Partial<UserProfile>;
      dormitory_id?: number | null;
      dormitory?: Partial<Dormitory>;
      category_id?: number;
      category?: Partial<Category>;
      condition_level_id?: number;
      condition_level?: Partial<ConditionLevel> & { level?: number | null };
      tags?: Partial<Tag>[];
      images?: Array<{
        id?: number;
        image_url?: string;
        image_thumbnail_url?: string | null;
        is_primary?: boolean;
      }>;
      distance_km?: number | null;
      image_url?: string | null;
      image_thumbnail_url?: string | null;
      exchange_type?: 'exchange_only' | 'exchange_or_purchase' | null;
      exchange_target?: string;
      target_product_title?: string | null;
      target_product_category_id?: number | null;
      target_product_condition_id?: number | null;
      expiration_date?: string | null;
    }): Product => {
      const resolvedId = typeof data.id === 'number' ? data.id : productId;
      const images: ProductImage[] = Array.isArray(data.images)
        ? data.images
            .map((image, index) => mapProductImage(image, index, resolvedId))
            .filter((image): image is ProductImage => !!image)
        : [];

      if (images.length === 0) {
        const fallbackUrl = data.image_url || data.image_thumbnail_url;
        if (fallbackUrl) {
          images.push({
            id: 1,
            product_id: resolvedId,
            image_url: fallbackUrl,
            image_thumbnail_url: data.image_thumbnail_url ?? undefined,
            is_primary: true,
          });
        }
      }

      const category = data.category?.id
        ? {
            id: data.category.id,
            name: data.category.name || '',
            parent_id: data.category.parent_id,
            icon: data.category.icon,
          }
        : undefined;

      const conditionLevel = data.condition_level?.id
        ? {
            id: data.condition_level.id,
            name: data.condition_level.name || '',
            description: data.condition_level.description,
            sort_order:
              typeof data.condition_level.sort_order === 'number'
                ? data.condition_level.sort_order
                : data.condition_level.level ?? 0,
          }
        : undefined;

      const dormitory = data.dormitory?.id
        ? {
            id: data.dormitory.id,
            dormitory_name: data.dormitory.dormitory_name || '',
            domain: data.dormitory.domain || '',
            location: data.dormitory.location,
            lat: data.dormitory.lat,
            lng: data.dormitory.lng,
            is_active: data.dormitory.is_active ?? true,
            university_id: data.dormitory.university_id ?? 0,
          }
        : undefined;

      const tags = Array.isArray(data.tags)
        ? data.tags
            .filter((tag): tag is Partial<Tag> & { id: number } => typeof tag.id === 'number')
            .map((tag) => ({ id: tag.id, name: tag.name || '' }))
        : [];

      const seller = data.seller?.id
        ? ({
            id: data.seller.id,
            full_name: data.seller.full_name || '',
            username: data.seller.username || '',
            email: data.seller.email || '',
            phone_number: data.seller.phone_number,
            profile_picture: data.seller.profile_picture,
            student_id: data.seller.student_id,
            bio: data.seller.bio,
            date_of_birth: data.seller.date_of_birth,
            gender: data.seller.gender,
            language: data.seller.language,
            timezone: data.seller.timezone,
            dormitory_id: data.seller.dormitory_id,
            account_completed: data.seller.account_completed,
            role: data.seller.role || 'user',
            status: data.seller.status || 'active',
          } as UserProfile)
        : undefined;

      return {
        id: resolvedId,
        seller_id: data.seller_id ?? data.seller?.id ?? 0,
        seller,
        dormitory_id: data.dormitory_id ?? data.dormitory?.id ?? 0,
        dormitory,
        category_id: data.category_id ?? data.category?.id ?? 0,
        category,
        condition_level_id: data.condition_level_id ?? data.condition_level?.id ?? 0,
        condition_level: conditionLevel,
        title: data.title || 'Untitled',
        description: data.description ?? undefined,
        price: typeof data.price === 'number' ? data.price : 0,
        currency: typeof data.currency === 'string' ? data.currency : undefined,
        status: data.status ?? 'available',
        is_promoted: Boolean(data.is_promoted),
        created_at: data.created_at || new Date().toISOString(),
        images,
        tags,
        distance_km: typeof data.distance_km === 'number' ? data.distance_km : undefined,
        exchange_type: data.exchange_type,
        exchange_target: data.exchange_target,
        target_product_title: data.target_product_title,
        target_product_category_id: data.target_product_category_id,
        target_product_condition_id: data.target_product_condition_id,
        expiration_date: data.expiration_date,
      };
    };

    const run = async () => {
      try {
        const data = await getProductDetail(productId);
        if (cancelled) return;
        if (!data.product) {
          setProduct(null);
          setIsLoading(false);
          return;
        }
        setProduct(mapApiProduct(data.product));
      } catch (error) {
        if (cancelled) return;
        const maybe = error as { message?: string } | undefined;
        if (maybe?.message && maybe.message.toLowerCase().includes('unauthorized')) {
          toast({
            title: t('product.loginRequired'),
            description: maybe.message,
          });
          navigate('/login');
          setProduct(null);
          setIsLoading(false);
          return;
        }
        if (maybe?.message && maybe.message.toLowerCase().includes('unauthenticated')) {
          toast({
            title: t('product.loginRequired'),
            description: maybe.message,
          });
          navigate('/login');
          setProduct(null);
          setIsLoading(false);
          return;
        }
        setProduct(null);
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [getProductDetail, id, isAuthenticated, navigate, t]);

  useEffect(() => {
    const parsedId = id ? Number(id) : NaN;
    const similarProductId = product?.id ?? (Number.isFinite(parsedId) ? parsedId : null);

    if (!similarProductId) {
      setSimilarProducts([]);
      setSimilarLoading(false);
      return;
    }
    if (!isAuthenticated) {
      setSimilarProducts([]);
      setSimilarLoading(false);
      return;
    }
    let cancelled = false;
    setSimilarLoading(true);

    const mapSimilarProduct = (item: {
      id?: number;
      product_id?: number;
      title?: string;
      price?: number;
      currency?: string;
      status?: 'available' | 'sold' | 'reserved';
      created_at?: string;
      category_id?: number;
      condition_level_id?: number;
      is_promoted?: number | boolean | null;
      dormitory?: { latitude?: number; longitude?: number };
      condition_level?: Partial<ConditionLevel> & { level?: number | null };
      image_thumbnail_url?: string | null;
      tags?: Partial<Tag>[];
    }): Product | null => {
      const resolvedId =
        typeof item.id === 'number'
          ? item.id
          : typeof item.product_id === 'number'
            ? item.product_id
            : null;
      if (!resolvedId) return null;
      const title = item.title || 'Untitled';
      const price = typeof item.price === 'number' ? item.price : 0;
      const status = item.status ?? 'available';
      const conditionLevel = item.condition_level?.id
        ? {
            id: item.condition_level.id,
            name: item.condition_level.name || '',
            description: item.condition_level.description,
            sort_order:
              typeof item.condition_level.sort_order === 'number'
                ? item.condition_level.sort_order
                : item.condition_level.level ?? 0,
          }
        : undefined;

      const dormitory = item.dormitory
        ? {
            id: 0,
            dormitory_name: '',
            domain: '',
            location: undefined,
            lat: item.dormitory.latitude,
            lng: item.dormitory.longitude,
            is_active: true,
            university_id: 0,
          }
        : undefined;

      const tags = Array.isArray(item.tags)
        ? item.tags
            .filter((tag): tag is Partial<Tag> & { id: number } => typeof tag.id === 'number')
            .map((tag) => ({ id: tag.id, name: tag.name || '' }))
        : [];

      const images: ProductImage[] = item.image_thumbnail_url
        ? [
            {
              id: 1,
              product_id: resolvedId,
              image_url: item.image_thumbnail_url,
              image_thumbnail_url: item.image_thumbnail_url ?? undefined,
              is_primary: true,
            },
          ]
        : [];

      return {
        id: resolvedId,
        seller_id: 0,
        dormitory_id: 0,
        dormitory,
        category_id: item.category_id ?? 0,
        condition_level_id: item.condition_level_id ?? item.condition_level?.id ?? 0,
        title,
        description: undefined,
        price,
        currency: typeof item.currency === 'string' ? item.currency : undefined,
        status,
        is_promoted: Boolean(item.is_promoted),
        created_at: item.created_at || new Date().toISOString(),
        images,
        tags,
        condition_level: conditionLevel,
        category: undefined,
        seller: undefined,
        distance_km: undefined,
      };
    };

    const run = async () => {
      try {
        const data = await getSimilarProducts(similarProductId, { page: 1, page_size: 10 });
        if (cancelled) return;
        const items = Array.isArray(data.products) ? data.products : [];
        const mapped = items
          .map((item) => mapSimilarProduct(item))
          .filter((item): item is Product => !!item);
        setSimilarProducts(mapped);
      } catch {
        if (!cancelled) {
          setSimilarProducts([]);
        }
      } finally {
        if (!cancelled) {
          setSimilarLoading(false);
        }
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [getSimilarProducts, id, isAuthenticated, product?.id]);

  if (isLoading) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center text-sm text-muted-foreground">Loading...</div>
        </div>
      </MainLayout>
    );
  }

  if (!product) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">{t('product.notFoundTitle')}</h1>
            <p className="text-muted-foreground mb-6">
              {t('product.notFoundSubtitle')}
            </p>
            <Button asChild>
              <Link to="/">{t('product.browseOther')}</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const favorite = isFavorite(product.id);
  const displayPrice = formatSelectedCurrencyParts(product.price, product.currency);

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast({
        title: t('product.loginRequired'),
        description: t('product.loginToFavorites'),
      });
      navigate('/login');
      return;
    }
    toggleFavorite(product.id);
    toast({
      title: favorite ? t('product.favoriteRemoved') : t('product.favoriteAdded'),
      description: favorite ? t('product.favoriteRemovedDesc') : t('product.favoriteAddedDesc'),
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.title,
        text: t('product.shareText', { title: product.title }),
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('product.shareTitle'),
        description: t('product.shareDesc'),
      });
    }
  };

  const handleContact = () => {
    if (!isAuthenticated) {
      toast({
        title: t('product.loginRequired'),
        description: t('product.loginToContact'),
      });
      navigate('/login');
      return;
    }
    const receiverId = product.seller_id || product.seller?.id;
    if (!receiverId) {
      toast({
        title: t('product.messageSent'),
        description: t('product.messageSentDesc'),
      });
      return;
    }
    const receiverName = product.seller?.full_name || product.seller?.username || '';
    const params = new URLSearchParams();
    params.set('receiverId', String(receiverId));
    if (receiverName) params.set('receiverName', receiverName);
    navigate(`/messages?${params.toString()}`);
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  const getTargetCategoryName = (id?: number | null) => {
    if (!id) return null;
    return categories.find(c => c.id === id)?.name;
  };

  const getTargetConditionName = (id?: number | null) => {
    if (!id) return null;
    return conditions.find(c => c.id === id)?.name;
  };

  return (
    <MainLayout>
      <div className="container py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">{t('product.breadcrumbHome')}</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link 
                to={`/category/${product.category.name.toLowerCase()}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground truncate">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              {product.images.length > 0 ? (
                <>
                  <img
                    src={normalizeImageUrl(product.images[currentImageIndex]?.image_url)}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
                      aria-label={t('product.previousImage')}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
                      aria-label={t('product.nextImage')}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  {t('product.noImages')}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors",
                      currentImageIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/50"
                    )}
                  >
                    <img
                      src={normalizeImageUrl(image.image_url)}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Price & Status */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {product.is_promoted && (
                    <Badge className="bg-warning text-warning-foreground border-0">
                      {t('product.featured')}
                    </Badge>
                  )}
                  {product.status !== 'available' && (
                    <Badge variant="secondary">
                      {product.status === 'sold' ? t('product.sold') : t('product.reserved')}
                    </Badge>
                  )}
                </div>
                <h1 className="price-text inline-flex items-baseline gap-2 text-3xl font-display font-bold text-foreground">
                  <span>{displayPrice.amount}</span>
                  <span className="text-[0.48em] font-semibold leading-none">{displayPrice.currency}</span>
                </h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={favorite ? "default" : "outline"}
                  size="icon"
                  onClick={handleFavorite}
                  aria-label={favorite ? t('productCard.favoriteRemove') : t('productCard.favoriteAdd')}
                >
                  <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  aria-label={t('product.shareAction')}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-foreground">
              {product.title}
            </h2>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {product.dormitory && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{product.dormitory.dormitory_name}</span>
                </div>
              )}
              {product.distance_km !== undefined && (
                <Badge variant="outline" className="numeric-text text-tertiary border-tertiary">
                  {t('product.distanceKm', { count: product.distance_km })}
                </Badge>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{t('product.posted', { time: formatRelativeTime(product.created_at) })}</span>
              </div>
            </div>

            {/* Condition & Category */}
            <div className="flex flex-wrap gap-2">
              {product.condition_level && (
                <Badge variant="outline">
                  {t('product.conditionLabel', { name: product.condition_level.name })}
                </Badge>
              )}
              {product.category && (
                <Badge variant="secondary">
                  {product.category.icon} {product.category.name}
                </Badge>
              )}
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="bg-accent text-accent-foreground cursor-pointer hover:bg-accent/80"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">{t('product.description')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Exchange Settings */}
            {(product.exchange_type || product.target_product_title) && (
              <div className="p-4 rounded-xl bg-primary/5 border border-primary/10 space-y-4">
                <h3 className="font-semibold text-primary flex items-center gap-2">
                  <ArrowLeftRight className="w-4 h-4" />
                  {t('createListing.exchangeSettingsTitle')}
                </h3>
                <div className="grid gap-3 text-sm">
                  {product.exchange_type && (
                    <div className="flex justify-between items-center">
                      <span className="text-muted-foreground">{t('createListing.exchangeTypeLabel')}</span>
                      <Badge variant="hero" className="text-[10px] uppercase font-bold tracking-tighter">
                        {product.exchange_type === 'exchange_only' ? t('createListing.exchangeOnly') : t('createListing.exchangeOrPurchase')}
                      </Badge>
                    </div>
                  )}
                  {product.target_product_title && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('createListing.targetProductTitleLabel')}</span>
                      <span className="font-medium">{product.target_product_title}</span>
                    </div>
                  )}
                  {product.target_product_category_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('createListing.targetProductCategoryLabel')}</span>
                      <span className="font-medium">{getTargetCategoryName(product.target_product_category_id) || t('common.loading')}</span>
                    </div>
                  )}
                  {product.target_product_condition_id && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('createListing.targetProductConditionLabel')}</span>
                      <span className="font-medium">{getTargetConditionName(product.target_product_condition_id) || t('common.loading')}</span>
                    </div>
                  )}
                  {product.expiration_date && (
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">{t('createListing.expirationDateLabel')}</span>
                      <span className="font-medium">{new Date(product.expiration_date).toLocaleDateString()}</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Seller Info */}
            {product.seller && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={normalizeImageUrl(product.seller.profile_picture)} alt={product.seller.full_name} />
                    <AvatarFallback className="bg-tertiary text-tertiary-foreground text-lg">
                      {product.seller.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{product.seller.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{product.seller.username}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/seller/${product.seller.id}`}>
                      <User className="w-4 h-4" />
                      {t('product.viewProfile')}
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons: Contact Seller ( contact seller btn yawld l97ba ) */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="hero"
                size="xl"
                className="flex-1"
                onClick={handleContact}
                disabled={product.status !== 'available'}
              >
                <MessageCircle className="w-5 h-5" />
                {t('product.contactSeller')}
              </Button>
            </div>
          </div>
        </div>

        <section className="mt-16">
          <h2 className="text-2xl font-display font-bold text-foreground mb-6">
            {t('product.similarItems')}
          </h2>
          {similarLoading ? (
            <div className="text-sm text-muted-foreground">Loading...</div>
          ) : similarProducts.length > 0 ? (
            <ProductGrid
              products={similarProducts}
              getProductLink={(item) => (item.id > 0 ? `/product/${item.id}` : '#')}
            />
          ) : (
            <div className="text-sm text-muted-foreground">No similar items yet.</div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default ProductDetailPage;
