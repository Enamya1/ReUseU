import React, { useCallback, useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import { formatPrice, type Product } from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { normalizeImageUrl } from '@/lib/api';
import { toast } from '@/hooks/use-toast';

type CategoryOption = {
  id: number;
  name: string;
  description?: string | null;
  parent_id?: number | null;
  icon?: string | null;
  logo?: string | null;
};

type ConditionLevelOption = {
  id: number;
  name: string;
  description?: string | null;
  sort_order?: number | null;
  level?: number | null;
};

type TagOption = {
  id: number;
  name: string;
};

type RecommendationProductImage = {
  id?: number;
  product_id?: number;
  image_url?: string;
  image_thumbnail_url?: string | null;
  is_primary?: boolean;
};

type RecommendationProduct = {
  id?: number;
  title?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  status?: 'available' | 'sold' | 'reserved';
  created_at?: string;
  is_promoted?: number | boolean | null;
  seller_id?: number;
  dormitory_id?: number | null;
  dormitory?: {
    latitude?: number;
    longitude?: number;
  };
  category_id?: number;
  condition_level_id?: number;
  condition_level?: {
    id: number;
    name: string;
    level?: number | null;
  };
  tags?: TagOption[];
  image_thumbnail_url?: string | null;
};

const ProductsPage: React.FC = () => {
  const { isAuthenticated, getMetaOptions, getRecommendedProducts } = useAuth();
  const { convertPrice, selectedCurrency } = useCurrency();
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<CategoryOption[]>([]);
  const [conditionLevels, setConditionLevels] = useState<ConditionLevelOption[]>([]);
  const [tags, setTags] = useState<TagOption[]>([]);
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [sortValue, setSortValue] = useState('default');
  const [page, setPage] = useState(1);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const isImageLike = (value?: string | null) => {
    if (!value) return false;
    const trimmed = value.trim();
    if (!trimmed) return false;
    return /^(https?:\/\/|\/|data:|blob:)/i.test(trimmed);
  };

  const requestLocation = useCallback(() => {
    if (!navigator.geolocation) {
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setUserLocation({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {},
      { enableHighAccuracy: true, maximumAge: 60000 },
    );
  }, []);

  const calculateDistanceKm = useCallback(
    (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
    const toRad = (value: number) => (value * Math.PI) / 180;
    const radiusKm = 6371;
    const dLat = toRad(to.lat - from.lat);
    const dLng = toRad(to.lng - from.lng);
    const lat1 = toRad(from.lat);
    const lat2 = toRad(to.lat);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.sin(dLng / 2) * Math.sin(dLng / 2) * Math.cos(lat1) * Math.cos(lat2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return radiusKm * c;
    },
    [],
  );

  useEffect(() => {
    if (!isAuthenticated) {
      setCategories([]);
      setConditionLevels([]);
      setTags([]);
      return;
    }
    let cancelled = false;

    const run = async () => {
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
          title: 'Unable to load filters',
          description: maybe?.message || 'Filters could not be loaded.',
          variant: 'destructive',
        });
        setCategories([]);
        setConditionLevels([]);
        setTags([]);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [getMetaOptions, isAuthenticated]);

  useEffect(() => {
    if (userLocation) return;
    requestLocation();
  }, [requestLocation, userLocation]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProducts([]);
      return;
    }
    let cancelled = false;

    const run = async () => {
      try {
        const data = await getRecommendedProducts({
          page: 1,
          page_size: 10,
          random_count: 3,
          lookback_days: 30,
        });
        if (cancelled) return;
        const mapped = (data.products || []).map((item, index) => {
          const product = item as RecommendationProduct;
          const productId = typeof product.id === 'number' ? product.id : index + 1;
          const images: Product['images'] = [];
          if (product.image_thumbnail_url) {
            const normalized = normalizeImageUrl(product.image_thumbnail_url) || product.image_thumbnail_url;
            images.push({
              id: 0,
              product_id: productId,
              image_url: normalized,
              image_thumbnail_url: normalized,
              is_primary: true,
            });
          }

          const conditionLevel = product.condition_level
            ? {
                id: product.condition_level.id,
                name: product.condition_level.name,
                description: undefined,
                sort_order: product.condition_level.level ?? 0,
              }
            : undefined;

          const dormitory =
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
              : undefined;

          const distanceKm =
            userLocation && dormitory?.lat != null && dormitory?.lng != null
              ? calculateDistanceKm(userLocation, { lat: dormitory.lat, lng: dormitory.lng })
              : undefined;

          return {
            id: productId,
            seller_id: product.seller_id ?? 0,
            dormitory_id: product.dormitory_id ?? 0,
            dormitory,
            category_id: product.category_id ?? 0,
            condition_level_id: product.condition_level_id ?? product.condition_level?.id ?? 0,
            condition_level: conditionLevel,
            title: product.title || 'Untitled',
            description: product.description ?? undefined,
            price: typeof product.price === 'number' ? product.price : 0,
            currency: typeof product.currency === 'string' ? product.currency : undefined,
            status: product.status ?? 'available',
            is_promoted: Boolean(product.is_promoted),
            created_at: product.created_at || new Date().toISOString(),
            images,
            tags: Array.isArray(product.tags)
              ? product.tags.map((tag) => ({ id: tag.id, name: tag.name }))
              : [],
            distance_km: distanceKm,
          } as Product;
        });

        setProducts(mapped);
      } catch (error) {
        if (cancelled) return;
        const maybe = error as { detail?: string; message?: string } | undefined;
        toast({
          title: 'Unable to load products',
          description: maybe?.detail || maybe?.message || 'Products could not be loaded.',
          variant: 'destructive',
        });
        setProducts([]);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [calculateDistanceKm, getRecommendedProducts, isAuthenticated, userLocation]);

  useEffect(() => {
    if (!userLocation) return;
    setProducts((prev) =>
      prev.map((product) => {
        if (product.dormitory?.lat == null || product.dormitory?.lng == null) return product;
        const distanceKm = calculateDistanceKm(userLocation, {
          lat: product.dormitory.lat,
          lng: product.dormitory.lng,
        });
        return { ...product, distance_km: distanceKm };
      }),
    );
  }, [calculateDistanceKm, userLocation]);

  const displayPrices = useMemo(() => {
    return products.reduce<Record<number, number>>((acc, product) => {
      acc[product.id] = convertPrice(product.price, product.currency);
      return acc;
    }, {});
  }, [convertPrice, products]);

  const maxPrice = useMemo(
    () => Math.max(0, ...Object.values(displayPrices)),
    [displayPrices],
  );

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const categoryCounts = useMemo(() => {
    return products.reduce<Record<number, number>>((acc, product) => {
      acc[product.category_id] = (acc[product.category_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let results = products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.title.toLowerCase().includes(normalizedSearch) ||
        (product.description ?? '').toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(product.category_id);
      const displayPrice = displayPrices[product.id] ?? 0;
      const matchesPrice = displayPrice >= priceRange[0] && displayPrice <= priceRange[1];
      const matchesCondition =
        selectedConditions.length === 0 ||
        selectedConditions.includes(product.condition_level_id);
      const matchesTags =
        selectedTags.length === 0 ||
        product.tags.some((tag) => selectedTags.includes(tag.id));
      return matchesSearch && matchesCategory && matchesPrice && matchesCondition && matchesTags;
    });

    if (sortValue === 'price-asc') {
      results = [...results].sort((a, b) => (displayPrices[a.id] ?? 0) - (displayPrices[b.id] ?? 0));
    }
    if (sortValue === 'price-desc') {
      results = [...results].sort((a, b) => (displayPrices[b.id] ?? 0) - (displayPrices[a.id] ?? 0));
    }
    if (sortValue === 'newest') {
      results = [...results].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return results;
  }, [displayPrices, priceRange, products, search, selectedCategories, selectedConditions, selectedTags, sortValue]);

  useEffect(() => {
    setPage(1);
  }, [search, priceRange, selectedCategories, selectedConditions, selectedTags, sortValue]);

  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, 'ellipsis', totalPages];
    }
    if (page >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages];
  }, [page, totalPages]);

  const toggleValue = <T,>(value: T, setValue: React.Dispatch<React.SetStateAction<T[]>>) => {
    setValue((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  return (
    <MainLayout>
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products"
                  className="pl-9"
                />
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Price</div>
                <Slider
                  min={0}
                  max={maxPrice}
                  step={5}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span className="price-text">{formatPrice(priceRange[0], selectedCurrency)}</span>
                  <span className="price-text">{formatPrice(priceRange[1], selectedCurrency)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Category</div>
                <div className="space-y-2">
                  {categories.map((category) => (
                    <label key={category.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleValue(category.id, setSelectedCategories)}
                        />
                        <span className="flex items-center gap-1">
                          {isImageLike(category.logo) ? (
                            <img
                              src={normalizeImageUrl(category.logo)}
                              alt={category.name}
                              className="h-4 w-4 rounded-full object-contain"
                              loading="lazy"
                            />
                          ) : (
                            <span>{category.logo || category.icon}</span>
                          )}
                          <span>{category.name}</span>
                        </span>
                      </span>
                      <span className="numeric-text text-xs">{categoryCounts[category.id] ?? 0}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Condition</div>
                <div className="space-y-2">
                  {conditionLevels.map((condition) => (
                    <label key={condition.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedConditions.includes(condition.id)}
                          onCheckedChange={() => toggleValue(condition.id, setSelectedConditions)}
                        />
                        <span>{condition.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">
                        #{condition.sort_order ?? condition.level ?? 0}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {tags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleValue(tag.id, setSelectedTags)}
                      className={cn(
                        "rounded-full border border-border px-3 py-1 text-xs transition-colors",
                        selectedTags.includes(tag.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearch('');
                  setSelectedCategories([]);
                  setSelectedConditions([]);
                  setSelectedTags([]);
                  setSortValue('default');
                  setPriceRange([0, maxPrice]);
                }}
              >
                Reset
              </Button>
            </div>
          </aside>

          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Category</h2>
                  <p className="text-sm text-muted-foreground">Pick the right collection to start browsing.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {categories.slice(0, 6).map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm"
                    >
                      {isImageLike(category.logo) ? (
                        <img
                          src={normalizeImageUrl(category.logo)}
                          alt={category.name}
                          className="h-6 w-6 rounded-full object-contain"
                          loading="lazy"
                        />
                      ) : (
                        <span className="text-lg">{category.logo || category.icon}</span>
                      )}
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing</span>
                  <Badge variant="secondary">{filteredProducts.length}</Badge>
                  <span>items</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={sortValue} onValueChange={setSortValue}>
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue placeholder="Default sorting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default sorting</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-asc">Price: low to high</SelectItem>
                      <SelectItem value="price-desc">Price: high to low</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {conditionLevels.map((condition) => (
                  <Badge key={condition.id} variant="outline" className="text-xs">
                    {condition.name}
                  </Badge>
                ))}
              </div>
            </div>

            <ProductGrid
              products={pagedProducts as Product[]}
              className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
              emptyMessage="No products match these filters."
            />

            {totalPages > 1 ? (
              <Pagination>
                <PaginationContent>
                  {page > 1 ? (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage((prev) => Math.max(1, prev - 1));
                        }}
                      />
                    </PaginationItem>
                  ) : null}

                  {paginationItems.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={item === page}
                          onClick={(event) => {
                            event.preventDefault();
                            setPage(item as number);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  {page < totalPages ? (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage((prev) => Math.min(totalPages, prev + 1));
                        }}
                      />
                    </PaginationItem>
                  ) : null}
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductsPage;
