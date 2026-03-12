import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Search, Camera, Upload } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { type Product } from '@/lib/mockData';
import { toast } from '@/hooks/use-toast';

type SearchApiProduct = {
  id?: number;
  seller_id?: number;
  category_id?: number;
  condition_level_id?: number;
  seller?: {
    id?: number;
    full_name?: string;
    username?: string;
    profile_picture?: string;
  };
  dormitory?: {
    id?: number;
    dormitory_name?: string;
    location?: string;
    address?: string;
    lat?: number;
    lng?: number;
    is_active?: boolean;
    university_id?: number;
  };
  category?: {
    id?: number;
    name?: string;
    parent_id?: number | null;
    icon?: string | null;
  };
  condition_level?: {
    id?: number;
    name?: string;
    sort_order?: number | null;
  };
  title?: string;
  description?: string | null;
  price?: number;
  currency?: string;
  status?: 'available' | 'sold' | 'reserved';
  is_promoted?: boolean | number | null;
  created_at?: string;
  image_thumbnail_url?: string;
  images?: Array<{
    id?: number;
    product_id?: number;
    image_url?: string;
    image_thumbnail_url?: string | null;
    is_primary?: boolean;
  }>;
  tags?: Array<{ id?: number; name?: string }>;
  visual_similarity_score?: number;
};

type SearchMode = 'text' | 'visual';
type SearchPageLocationState = {
  visualFile?: File;
} | null;

const PAGE_SIZE = 12;
const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const ALLOWED_IMAGE_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];

const SearchResultsPage: React.FC = () => {
  const { isAuthenticated, searchProducts, searchVisualProducts } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const locationState = (location.state as SearchPageLocationState) ?? null;
  const modeParam: SearchMode = searchParams.get('mode') === 'visual' ? 'visual' : 'text';
  const initialQuery = modeParam === 'text' ? searchParams.get('q')?.trim() ?? '' : '';
  const initialPage = Number(searchParams.get('page') ?? '1');
  const queryPage = Number.isFinite(initialPage) && initialPage > 0 ? initialPage : 1;

  const [queryInput, setQueryInput] = useState(initialQuery);
  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(queryPage);
  const [normalizedQuery, setNormalizedQuery] = useState(initialQuery);
  const [isLoading, setIsLoading] = useState(false);
  const [showVisualUploader, setShowVisualUploader] = useState(modeParam === 'visual');
  const [isDragOverUpload, setIsDragOverUpload] = useState(false);
  const [visualImageName, setVisualImageName] = useState('');
  const [visualPreviewUrl, setVisualPreviewUrl] = useState('');
  const [visualMeta, setVisualMeta] = useState<{
    top_k?: number;
    model_name?: string;
    embedding_dim?: number;
  } | null>(null);
  const visualInputRef = useRef<HTMLInputElement>(null);
  const lastVisualFileRef = useRef<File | null>(null);

  useEffect(() => {
    setQueryInput(initialQuery);
    setCurrentPage(queryPage);
  }, [initialQuery, queryPage]);

  useEffect(() => {
    if (modeParam === 'visual') {
      setShowVisualUploader(true);
    }
  }, [modeParam]);

  const runVisualSearch = useCallback(
    async (file: File) => {
      if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
        toast({
          title: 'Invalid image format',
          description: 'Please upload JPG, JPEG, PNG, or WEBP.',
          variant: 'destructive',
        });
        return;
      }
      if (file.size > MAX_IMAGE_BYTES) {
        toast({
          title: 'Image too large',
          description: 'Maximum allowed image size is 8MB.',
          variant: 'destructive',
        });
        return;
      }

      setIsLoading(true);
      setVisualImageName(file.name);
      setVisualPreviewUrl((previous) => {
        if (previous.startsWith('blob:')) {
          URL.revokeObjectURL(previous);
        }
        return URL.createObjectURL(file);
      });
      setVisualMeta(null);

      setSearchParams((prev) => {
        const next = new URLSearchParams(prev);
        next.delete('q');
        next.set('mode', 'visual');
        next.set('page', '1');
        return next;
      });

      try {
        const response = await searchVisualProducts({
          image: file,
          top_k: PAGE_SIZE,
        });

        const mappedProducts = (response.products ?? []).flatMap((item, index) => {
          const mapped = mapApiProductToProduct(item as SearchApiProduct, index);
          return mapped ? [mapped] : [];
        });

        setProducts(mappedProducts);
        setTotal(typeof response.count === 'number' ? response.count : mappedProducts.length);
        setTotalPages(1);
        setCurrentPage(1);
        setNormalizedQuery('Visual search');
        setVisualMeta({
          top_k: response.query?.top_k,
          model_name: response.query?.model_name,
          embedding_dim: response.query?.embedding_dim,
        });
      } catch (error) {
        const maybe = error as
          | {
              message?: string;
              detail?: string;
              errors?: Record<string, string[]>;
            }
          | undefined;
        const imageError = maybe?.errors?.image?.[0];
        const topKError = maybe?.errors?.top_k?.[0];
        toast({
          title: 'Unable to run visual search',
          description: imageError || topKError || maybe?.message || maybe?.detail || 'Visual search request failed.',
          variant: 'destructive',
        });
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
      } finally {
        setIsLoading(false);
      }
    },
    [searchVisualProducts, setSearchParams],
  );

  useEffect(() => {
    const visualFile = locationState?.visualFile;
    if (modeParam !== 'visual' || !visualFile) {
      return;
    }
    if (lastVisualFileRef.current === visualFile) {
      return;
    }
    lastVisualFileRef.current = visualFile;
    setShowVisualUploader(true);
    void runVisualSearch(visualFile);
  }, [locationState, modeParam, runVisualSearch]);

  useEffect(() => {
    return () => {
      if (visualPreviewUrl.startsWith('blob:')) {
        URL.revokeObjectURL(visualPreviewUrl);
      }
    };
  }, [visualPreviewUrl]);

  useEffect(() => {
    const handlePaste = (event: ClipboardEvent) => {
      if (!showVisualUploader) return;
      if (!event.clipboardData?.items?.length) return;
      const imageItem = Array.from(event.clipboardData.items).find((item) => item.type.startsWith('image/'));
      if (!imageItem) return;
      const file = imageItem.getAsFile();
      if (!file) return;
      event.preventDefault();
      void runVisualSearch(file);
    };

    document.addEventListener('paste', handlePaste);
    return () => {
      document.removeEventListener('paste', handlePaste);
    };
  }, [runVisualSearch, showVisualUploader]);

  useEffect(() => {
    if (!isAuthenticated) {
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
      setNormalizedQuery(initialQuery);
      setVisualMeta(null);
      return;
    }

    if (modeParam === 'visual') {
      return;
    }

    if (!initialQuery) {
      setProducts([]);
      setTotal(0);
      setTotalPages(1);
      setNormalizedQuery('');
      setVisualMeta(null);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const run = async () => {
      try {
        const response = await searchProducts({
          q: initialQuery,
          page: queryPage,
          page_size: PAGE_SIZE,
        });
        if (cancelled) return;

        const mappedProducts = (response.products ?? []).flatMap((item, index) => {
          const mapped = mapApiProductToProduct(item as SearchApiProduct, index);
          return mapped ? [mapped] : [];
        });

        setProducts(mappedProducts);
        setTotal(typeof response.total === 'number' ? response.total : mappedProducts.length);
        setTotalPages(
          typeof response.total_pages === 'number' && response.total_pages > 0
            ? response.total_pages
            : 1,
        );
        setNormalizedQuery(response.query?.normalized?.trim() || initialQuery);
        setVisualMeta(null);
      } catch (error) {
        if (cancelled) return;
        const maybe = error as { message?: string; detail?: string } | undefined;
        toast({
          title: 'Unable to load search results',
          description: maybe?.message || maybe?.detail || 'Search request failed.',
          variant: 'destructive',
        });
        setProducts([]);
        setTotal(0);
        setTotalPages(1);
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
  }, [initialQuery, isAuthenticated, modeParam, queryPage, searchProducts]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, index) => index + 1);
    }

    const pages = new Set<number>([1, totalPages, currentPage, currentPage - 1, currentPage + 1]);
    const sortedPages = Array.from(pages)
      .filter((value) => value >= 1 && value <= totalPages)
      .sort((a, b) => a - b);

    const result: Array<number | 'ellipsis'> = [];
    sortedPages.forEach((page, index) => {
      if (index > 0 && page - sortedPages[index - 1] > 1) {
        result.push('ellipsis');
      }
      result.push(page);
    });
    return result;
  }, [currentPage, totalPages]);

  const handleSearchSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextQuery = queryInput.trim();
    if (!nextQuery) return;
    setSearchParams({
      q: nextQuery,
      page: '1',
    });
  };

  const handlePageChange = (page: number) => {
    if (modeParam === 'visual') return;
    if (page < 1 || page > totalPages) return;
    setCurrentPage(page);
    setSearchParams({ q: initialQuery, page: String(page) });
  };

  const handleVisualPickClick = () => {
    setShowVisualUploader(true);
    visualInputRef.current?.click();
  };

  const handleVisualFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    void runVisualSearch(file);
    event.target.value = '';
  };

  const handleVisualDrop = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setIsDragOverUpload(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    void runVisualSearch(file);
  };

  return (
    <MainLayout>
      <div className="container py-8 md:py-10">
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card px-5 py-5 md:px-6">
            <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
              <div>
                <h1 className="text-xl font-semibold text-foreground">Search Results</h1>
                <div className="mt-2 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Mode</span>
                  <Badge variant="secondary">{modeParam === 'visual' ? 'Visual' : 'Text'}</Badge>
                  <span>Query</span>
                  <Badge variant="secondary">
                    {modeParam === 'visual' ? visualImageName || 'Image search' : normalizedQuery || initialQuery || '-'}
                  </Badge>
                  <span>Results</span>
                  <Badge variant="secondary">{total}</Badge>
                  {visualMeta?.model_name ? (
                    <>
                      <span>Model</span>
                      <Badge variant="secondary">{visualMeta.model_name}</Badge>
                    </>
                  ) : null}
                </div>
              </div>
            </div>
            <form onSubmit={handleSearchSubmit} className="mt-4 flex flex-wrap items-center gap-2">
              {modeParam === 'visual' && visualPreviewUrl ? (
                <div className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 px-3 py-2">
                  <img
                    src={visualPreviewUrl}
                    alt="Uploaded visual search"
                    className="h-12 w-12 rounded-md object-cover"
                  />
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-foreground">{visualImageName || 'Selected image'}</p>
                    <p className="text-xs text-muted-foreground">{isLoading ? 'Searching with this image...' : 'Image ready for visual search'}</p>
                  </div>
                </div>
              ) : null}
              <input
                ref={visualInputRef}
                type="file"
                accept="image/jpeg,image/jpg,image/png,image/webp"
                onChange={handleVisualFileChange}
                className="hidden"
              />
            </form>
            {showVisualUploader ? (
              <div className="mt-4">
                <h3 className="text-center text-xl font-semibold text-foreground">Upload the image in the following way</h3>
                <div
                  className={`mt-3 rounded-xl border border-dashed p-6 transition-colors ${isDragOverUpload ? 'border-primary bg-primary/5' : 'border-border'}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    setIsDragOverUpload(true);
                  }}
                  onDragLeave={() => setIsDragOverUpload(false)}
                  onDrop={handleVisualDrop}
                >
                  <div className="mx-auto flex max-w-sm flex-col items-center gap-3 text-center">
                    <Button
                      type="button"
                      className="h-12 rounded-full bg-foreground px-8 text-base text-background hover:bg-foreground/90"
                      onClick={() => visualInputRef.current?.click()}
                    >
                      <Upload className="mr-2 h-4 w-4" />
                      Upload Image
                    </Button>
                    <p className="text-base text-foreground">or drag image here</p>
                    <p className="text-base text-foreground">
                      or press <span className="font-semibold text-destructive">Ctrl+V</span> to paste
                    </p>
                    <p className="text-sm text-muted-foreground">Maximum file size: 8MB</p>
                  </div>
                </div>
              </div>
            ) : null}
          </div>

          {!isAuthenticated ? (
            <div className="rounded-2xl border border-border bg-card p-8 text-center">
              <p className="text-foreground">Please log in to search products.</p>
              <Button className="mt-4" onClick={() => navigate('/login')}>
                Go to Login
              </Button>
            </div>
          ) : isLoading ? (
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
              {Array.from({ length: 10 }).map((_, index) => (
                <div key={index} className="animate-pulse rounded-xl border border-border bg-card p-3">
                  <div className="aspect-square rounded-lg bg-muted" />
                  <div className="mt-3 h-4 w-2/3 rounded bg-muted" />
                  <div className="mt-2 h-3 w-full rounded bg-muted" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <ProductGrid
                products={products}
                className="grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5"
                emptyMessage={
                  modeParam === 'visual'
                    ? 'Upload an image to find similar products.'
                    : initialQuery
                      ? 'No products found for this search.'
                      : 'Start typing to search products.'
                }
              />

              {modeParam === 'text' && totalPages > 1 ? (
                <Pagination>
                  <PaginationContent>
                    {currentPage > 1 ? (
                      <PaginationItem>
                        <PaginationPrevious
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            handlePageChange(currentPage - 1);
                          }}
                        />
                      </PaginationItem>
                    ) : null}

                    {paginationItems.map((item, index) =>
                      item === 'ellipsis' ? (
                        <PaginationItem key={`ellipsis-${index}`}>
                          <PaginationEllipsis />
                        </PaginationItem>
                      ) : (
                        <PaginationItem key={item}>
                          <PaginationLink
                            href="#"
                            isActive={item === currentPage}
                            onClick={(event) => {
                              event.preventDefault();
                              handlePageChange(item);
                            }}
                          >
                            {item}
                          </PaginationLink>
                        </PaginationItem>
                      ),
                    )}

                    {currentPage < totalPages ? (
                      <PaginationItem>
                        <PaginationNext
                          href="#"
                          onClick={(event) => {
                            event.preventDefault();
                            handlePageChange(currentPage + 1);
                          }}
                        />
                      </PaginationItem>
                    ) : null}
                  </PaginationContent>
                </Pagination>
              ) : null}
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

const mapApiProductToProduct = (item: SearchApiProduct, fallbackIndex: number): Product | null => {
  const id = typeof item.id === 'number' ? item.id : fallbackIndex + 1;
  const title = item.title?.trim() || 'Untitled';
  const status = item.status ?? 'available';
  const createdAt = item.created_at || new Date().toISOString();

  const images: Product['images'] = Array.isArray(item.images)
    ? item.images.flatMap((image, index) => {
        if (!image.image_url) return [];
        return [
          {
            id: typeof image.id === 'number' ? image.id : index + 1,
            product_id: typeof image.product_id === 'number' ? image.product_id : id,
            image_url: image.image_url,
            image_thumbnail_url: image.image_thumbnail_url ?? undefined,
            is_primary: Boolean(image.is_primary),
          },
        ];
      })
    : item.image_thumbnail_url
      ? [
          {
            id: 1,
            product_id: id,
            image_url: item.image_thumbnail_url,
            image_thumbnail_url: item.image_thumbnail_url,
            is_primary: true,
          },
        ]
      : [];

  return {
    id,
    seller_id: typeof item.seller?.id === 'number' ? item.seller.id : item.seller_id ?? 0,
    seller: item.seller?.id
      ? {
          id: item.seller.id,
          full_name: item.seller.full_name || item.seller.username || '',
          username: item.seller.username || '',
          email: '',
          profile_picture: item.seller.profile_picture,
          role: 'user',
          status: 'active',
        }
      : undefined,
    dormitory_id: typeof item.dormitory?.id === 'number' ? item.dormitory.id : 0,
    dormitory: item.dormitory?.id
      ? {
          id: item.dormitory.id,
          dormitory_name: item.dormitory.dormitory_name || item.dormitory.address || '',
          domain: '',
          location: item.dormitory.location,
          lat: item.dormitory.lat,
          lng: item.dormitory.lng,
          is_active: item.dormitory.is_active ?? true,
          university_id: item.dormitory.university_id ?? 0,
        }
      : undefined,
    category_id: typeof item.category?.id === 'number' ? item.category.id : item.category_id ?? 0,
    category: item.category?.id
      ? {
          id: item.category.id,
          name: item.category.name || '',
          parent_id: item.category.parent_id ?? undefined,
          icon: item.category.icon ?? undefined,
        }
      : undefined,
    condition_level_id:
      typeof item.condition_level?.id === 'number' ? item.condition_level.id : item.condition_level_id ?? 0,
    condition_level: item.condition_level?.id
      ? {
          id: item.condition_level.id,
          name: item.condition_level.name || '',
          description: undefined,
          sort_order: item.condition_level.sort_order ?? 0,
        }
      : undefined,
    title,
    description: item.description ?? undefined,
    price: typeof item.price === 'number' ? item.price : 0,
    currency: item.currency,
    status,
    is_promoted: Boolean(item.is_promoted),
    created_at: createdAt,
    images,
    tags: Array.isArray(item.tags)
      ? item.tags
          .filter((tag): tag is { id: number; name?: string } => typeof tag.id === 'number')
          .map((tag) => ({ id: tag.id, name: tag.name || '' }))
      : [],
  };
};

export default SearchResultsPage;
