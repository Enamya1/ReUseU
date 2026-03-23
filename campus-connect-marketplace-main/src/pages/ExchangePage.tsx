import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import { type Product } from '@/lib/mockData';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Search, ArrowRightLeft, User, Package } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Link } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeImageUrl } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

const ExchangePage: React.FC = () => {
  const { t } = useTranslation();
  const { formatWithSelectedCurrency } = useCurrency();
  const { isAuthenticated, getRecommendedExchangeProducts } = useAuth();
  const [searchQuery, setSearchQuery] = useState('');
  const [exchangeProducts, setExchangeProducts] = useState<Product[]>([]);

  type ApiSeller = { id: number; username: string; profile_picture?: string };
  type ApiDormitory = { latitude?: number; longitude?: number };
  type ApiCategory = { id: number; name: string; parent_id?: number | null };
  type ApiCondition = { id: number; name: string; level?: number | null };
  type ApiTag = { id: number; name: string };
  type ApiProductImage = {
    image_url?: string | null;
    image_thumbnail_url?: string | null;
    is_primary?: boolean;
  };
  type ApiProduct = {
    id?: number;
    title?: string;
    description?: string | null;
    price?: number;
    currency?: string;
    status?: 'available' | 'sold' | 'reserved';
    created_at?: string;
    is_promoted?: number | boolean | null;
    seller_id?: number;
    seller?: ApiSeller;
    dormitory_id?: number | null;
    dormitory?: ApiDormitory;
    category_id?: number;
    category?: ApiCategory;
    condition_level_id?: number;
    condition_level?: ApiCondition;
    tags?: ApiTag[];
    image_url?: string | null;
    image_thumbnail_url?: string | null;
    images?: ApiProductImage[];
  };
  type ApiExchange = {
    exchange_type?: 'exchange_only' | 'exchange_or_purchase';
    target_product_title?: string | null;
    target_product_category?: { id?: number; name?: string };
    target_product_condition?: { id?: number; name?: string; level?: number | null };
    expiration_date?: string | null;
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setExchangeProducts([]);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const data = await getRecommendedExchangeProducts({
          page: 1,
          page_size: 10,
          random_count: 3,
          lookback_days: 30,
        });
        if (cancelled) return;
        const mapped = (data.exchange_products || []).map((item, index) => {
          const product = (item.product || {}) as ApiProduct;
          const ex = (item.exchange_product || {}) as ApiExchange;
          const productId = typeof product.id === 'number' ? product.id : index + 1;

          const images: Product['images'] = Array.isArray(product.images)
            ? product.images
                .map((image, imageIndex) => {
                  const rawImageUrl = image.image_url || image.image_thumbnail_url;
                  const rawThumbnailUrl = image.image_thumbnail_url || image.image_url;
                  if (!rawImageUrl && !rawThumbnailUrl) return null;
                  const normalizedImage = normalizeImageUrl(rawImageUrl || '') || rawImageUrl || '';
                  const normalizedThumbnail = normalizeImageUrl(rawThumbnailUrl || '') || rawThumbnailUrl || normalizedImage;
                  return {
                    id: imageIndex,
                    product_id: productId,
                    image_url: normalizedImage,
                    image_thumbnail_url: normalizedThumbnail,
                    is_primary: Boolean(image.is_primary),
                  };
                })
                .filter((image): image is NonNullable<typeof image> => !!image)
            : [];

          if (!images.length) {
            const fallbackImageUrl = product.image_thumbnail_url || product.image_url;
            if (fallbackImageUrl) {
              const normalized = normalizeImageUrl(fallbackImageUrl) || fallbackImageUrl;
              images.push({
                id: 0,
                product_id: productId,
                image_url: normalized,
                image_thumbnail_url: normalized,
                is_primary: true,
              });
            }
          }

          const conditionLevel = product.condition_level
            ? {
                id: product.condition_level.id!,
                name: product.condition_level.name!,
                description: undefined,
                sort_order: product.condition_level.level ?? 0,
              }
            : undefined;

          return {
            id: productId,
            seller_id: product.seller_id ?? 0,
            seller: product.seller
              ? {
                  id: product.seller.id,
                  full_name: product.seller.username,
                  username: product.seller.username,
                  email: '',
                  profile_picture: product.seller.profile_picture,
                  role: 'user',
                  status: 'active',
                }
              : undefined,
            dormitory_id: product.dormitory_id ?? 0,
            dormitory:
              typeof product.dormitory?.latitude === 'number' && typeof product.dormitory?.longitude === 'number'
                ? {
                    id: 0,
                    dormitory_name: '',
                    domain: '',
                    location: undefined,
                    lat: product.dormitory.latitude,
                    lng: product.dormitory.longitude,
                    is_active: true,
                    university_id: 0,
                  }
                : undefined,
            category_id: product.category_id ?? 0,
            category: product.category
              ? { id: product.category.id!, name: product.category.name!, parent_id: product.category.parent_id ?? undefined, icon: undefined }
              : undefined,
            condition_level_id: product.condition_level_id ?? product.condition_level?.id ?? 0,
            condition_level: conditionLevel,
            title: product.title || 'Untitled',
            description: product.description ?? undefined,
            price: typeof product.price === 'number' ? product.price : 0,
            currency: typeof product.currency === 'string' ? product.currency : undefined,
            status: (product.status as Product['status']) ?? 'available',
            is_promoted: Boolean(product.is_promoted),
            created_at: product.created_at || new Date().toISOString(),
            images,
            tags: Array.isArray(product.tags)
              ? product.tags.map((tag) => ({ id: tag.id!, name: tag.name! }))
              : [],
            exchange_type: ex.exchange_type ?? null,
            target_product_title: ex.target_product_title ?? null,
            target_product_category_id: ex.target_product_category?.id ?? null,
            target_product_condition_id: ex.target_product_condition?.id ?? null,
            expiration_date: ex.expiration_date ?? null,
          } as Product;
        });
        setExchangeProducts(mapped);
      } catch (error) {
        if (cancelled) return;
        const maybe = error as { detail?: string; message?: string } | undefined;
        toast({
          title: 'Unable to load exchange products',
          description: maybe?.detail || maybe?.message || 'Could not load exchange recommendations.',
          variant: 'destructive',
        });
        setExchangeProducts([]);
      }
    };
    run();
    return () => {
      cancelled = true;
    };
  }, [getRecommendedExchangeProducts, isAuthenticated]);

  const filteredExchangeProducts = useMemo(() => {
    const q = searchQuery.toLowerCase();
    return exchangeProducts.filter((product) => {
      const hasExchange = !!(product.target_product_title || product.exchange_target || product.exchange_type);
      const matchesSearch =
        product.title.toLowerCase().includes(q) ||
        (product.description?.toLowerCase().includes(q) ?? false) ||
        (product.exchange_target?.toLowerCase().includes(q) ?? false) ||
        (product.target_product_title?.toLowerCase().includes(q) ?? false);
      return hasExchange && matchesSearch;
    });
  }, [exchangeProducts, searchQuery]);

  return (
    <MainLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              {t('exchange.title')}
            </h1>
            <p className="text-muted-foreground mt-1">
              {t('exchange.subtitle')}
            </p>
          </div>
          <div className="relative w-full md:w-96">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="text"
              placeholder={t('exchange.searchPlaceholder')}
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {filteredExchangeProducts.length > 0 ? (
          <div className="flex flex-col gap-4">
            {filteredExchangeProducts.map((product) => {
              const primaryImage = product.images?.find((image) => image.is_primary) || product.images?.[0];
              const thumbnailUrl = primaryImage?.image_thumbnail_url || primaryImage?.image_url;

              return (
              <Card key={product.id} className="overflow-hidden transition-all hover:shadow-md group">
                <CardContent className="p-0">
                  <div className="flex flex-col md:flex-row items-stretch">
                    {/* Product Info - List Style */}
                    <div className="flex-1 p-6 flex flex-col justify-center">
                      <div className="flex items-center gap-2 mb-2 text-primary/60">
                        <Package className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {t('exchange.productInfo')}
                        </span>
                      </div>
                      <div className="flex items-center justify-between gap-3">
                        <Link to={`/product/${product.id}`} className="block min-w-0">
                          <h2 className="font-bold text-xl group-hover:text-primary transition-colors line-clamp-1">
                            {product.title}
                          </h2>
                        </Link>
                        <Link to={`/product/${product.id}`} className="shrink-0">
                          {thumbnailUrl ? (
                            <img
                              src={normalizeImageUrl(thumbnailUrl)}
                              alt={product.title}
                              className="h-12 w-12 rounded-lg object-cover"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-lg bg-muted flex items-center justify-center">
                              <Package className="h-4 w-4 text-muted-foreground" />
                            </div>
                          )}
                        </Link>
                      </div>
                      <div className="flex items-center gap-3 mt-2">
                        <span className="text-sm font-semibold text-muted-foreground">
                          {formatWithSelectedCurrency(product.price, product.currency)}
                        </span>
                        <Badge variant="outline" className="text-[10px] h-5 px-1.5 text-primary uppercase font-bold tracking-tighter">
                          {product.status}
                        </Badge>
                      </div>
                    </div>

                    {/* Exchange Logic - Visual Connector */}
                    <div className="hidden md:flex items-center justify-center px-4 bg-muted/30">
                      <div className="h-8 w-8 rounded-full bg-background flex items-center justify-center shadow-sm">
                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                      </div>
                    </div>

                    {/* Target Exchange */}
                    <div className="flex-1 p-6 flex flex-col justify-center bg-primary/[0.02]">
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center gap-2 text-primary/60">
                          <ArrowRightLeft className="h-3.5 w-3.5 md:hidden" />
                          <span className="text-[10px] font-bold uppercase tracking-widest">
                            {t('exchange.wants')}
                          </span>
                        </div>
                        {product.exchange_type && (
                          <Badge variant="secondary" className="text-[9px] h-4 px-1 uppercase font-bold tracking-tighter">
                            {product.exchange_type === 'exchange_only' ? t('createListing.exchangeOnly') : t('createListing.exchangeOrPurchase')}
                          </Badge>
                        )}
                      </div>
                      <div className="p-3 rounded-lg bg-background shadow-sm">
                        <p className="font-semibold text-primary text-sm md:text-base line-clamp-2">
                          {product.target_product_title || product.exchange_target}
                        </p>
                        {product.category?.name && !product.target_product_title && product.exchange_target && (
                           <p className="text-[10px] text-muted-foreground mt-1">
                             {product.category.name}
                           </p>
                        )}
                      </div>
                    </div>

                    {/* Seller Info */}
                    <div className="w-full md:w-64 p-6 flex flex-col justify-center bg-muted/10">
                      <div className="flex items-center gap-2 mb-3 text-primary/60">
                        <User className="h-3.5 w-3.5" />
                        <span className="text-[10px] font-bold uppercase tracking-widest">
                          {t('exchange.sellerInfo')}
                        </span>
                      </div>
                      <Link to={`/seller/${product.seller?.id}`} className="flex items-center gap-3 hover:opacity-80 transition-opacity">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={product.seller?.profile_picture} />
                          <AvatarFallback className="bg-primary/5 text-primary">
                            {product.seller?.full_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <p className="font-bold text-sm truncate">
                            {product.seller?.full_name}
                          </p>
                          <p className="text-[11px] text-muted-foreground truncate">
                            @{product.seller?.username}
                          </p>
                        </div>
                      </Link>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )})}
          </div>
        ) : (
          <div className="text-center py-20 bg-muted/30 rounded-3xl">
            <Package className="h-12 w-12 text-muted-foreground mx-auto mb-4 opacity-20" />
            <p className="text-xl font-medium text-muted-foreground">
              {t('exchange.noResults')}
            </p>
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default ExchangePage;
