import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import AMapLoader from '@amap/amap-jsapi-loader';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { universities } from '@/lib/dummyData';
import { ArrowLeft, CalendarDays, DollarSign, MapPin, Package, Tag, Heart, Eye, MousePointerClick } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type AMapMap = {
  setZoom: (zoom: number) => void;
  setCenter: (center: [number, number]) => void;
  destroy?: () => void;
};

type AMapMarker = {
  setPosition: (position: [number, number]) => void;
  setMap: (map: AMapMap | null) => void;
};

type AMapNamespace = {
  Map: new (container: HTMLDivElement, options: { zoom: number; center: [number, number]; mapStyle?: string }) => AMapMap;
  Marker: new (options: { position: [number, number]; map: AMapMap }) => AMapMarker;
};

type ProductDetailStateProduct = {
  id: string;
  title: string;
  status: 'active' | 'sold' | 'reserved' | 'blocked';
  images: string[];
  tags: string[];
  categoryName: string;
  universityName: string;
  conditionName: string;
  conditionLevel?: number;
  description: string;
  views: number;
  clicks: number;
  favorites: number;
  price: string;
  createdAt: string;
  updatedAt: string;
  sellerName: string;
  sellerId: string;
  sellerEmail?: string;
  sellerAvatar?: string;
  dormitoryName: string;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  location: string;
  locationLat?: number;
  locationLng?: number;
  conditionId?: string;
};

type ProductDetailState = {
  product?: ProductDetailStateProduct;
};

type ApiProductImage = {
  id?: number;
  image_url?: string | null;
  image_thumbnail_url?: string | null;
  is_primary?: number | boolean;
};

type ApiProductTag = {
  id?: number;
  name?: string | null;
};

type ApiProductCategory = {
  id?: number;
  name?: string | null;
};

type ApiProductConditionLevel = {
  id?: number;
  name?: string | null;
  sort_order?: number | null;
};

type ApiProductSeller = {
  id?: number;
  full_name?: string | null;
  username?: string | null;
  email?: string | null;
  profile_picture?: string | null;
};

type ApiProductDormitory = {
  id?: number;
  dormitory_name?: string | null;
  domain?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  university_id?: number | null;
  university?: {
    id?: number;
    name?: string | null;
  } | null;
};

type ApiProduct = {
  id?: number;
  seller_id?: number | null;
  dormitory_id?: number | null;
  category_id?: number | null;
  condition_level_id?: number | null;
  title?: string | null;
  description?: string | null;
  price?: string | number | null;
  status?: string | null;
  views?: number | string | null;
  clicks?: number | string | null;
  favorites?: number | string | null;
  created_at?: string | null;
  updated_at?: string | null;
  images?: ApiProductImage[];
  tags?: ApiProductTag[];
  category?: ApiProductCategory | null;
  condition_level?: ApiProductConditionLevel | null;
  seller?: ApiProductSeller | null;
  dormitory?: ApiProductDormitory | null;
};

type ProductResponse = {
  message?: string;
  product?: ApiProduct;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const PRODUCT_IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL ?? API_BASE_URL ?? 'http://127.0.0.1:8000';
const AMAP_JS_KEY = import.meta.env.VITE_AMAP_JS_KEY ?? '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE ?? '';

const normalizeProductStatus = (status: string | null | undefined): 'active' | 'sold' | 'reserved' | 'blocked' => {
  const normalized = status?.toLowerCase();
  if (normalized === 'block' || normalized === 'blocked') {
    return 'blocked';
  }
  if (normalized === 'sold') {
    return 'sold';
  }
  if (normalized === 'reserved') {
    return 'reserved';
  }
  return 'active';
};

const resolveProductImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return '';
  }
  const baseUrl = PRODUCT_IMAGE_BASE_URL.replace(/\/+$/, '');
  const trimmed = imageUrl.trim().replace(/\\/g, '/');
  const normalizedPath = trimmed.replace(/\/{2,}/g, '/');
  const normalizedHttp = normalizedPath.replace(/^http:\//i, 'http://').replace(/^https:\//i, 'https://');
  if (normalizedHttp.startsWith('http://') || normalizedHttp.startsWith('https://')) {
    try {
      const resolvedUrl = new URL(normalizedHttp);
      if (resolvedUrl.hostname === 'localhost') {
        const base = new URL(baseUrl);
        resolvedUrl.protocol = base.protocol;
        resolvedUrl.host = base.host;
      }
      return resolvedUrl.toString();
    } catch {
      return normalizedHttp;
    }
  }
  if (normalizedPath.startsWith('/')) {
    return `${baseUrl}${normalizedPath}`;
  }
  return `${baseUrl}/${normalizedPath}`;
};

const buildProductDetailState = (
  apiProduct: ApiProduct,
  fallback?: ProductDetailStateProduct | null,
): ProductDetailStateProduct => {
  const sellerName =
    apiProduct.seller?.full_name
    || apiProduct.seller?.username
    || fallback?.sellerName
    || 'N/A';
  const dormitoryName = apiProduct.dormitory?.dormitory_name || fallback?.dormitoryName || 'N/A';
  const universityName =
    apiProduct.dormitory?.university?.name
    || fallback?.universityName
    || 'N/A';
  const images = (apiProduct.images ?? [])
    .map((image) => resolveProductImageUrl(image.image_url ?? image.image_thumbnail_url ?? undefined))
    .filter(Boolean);
  const categoryName = apiProduct.category?.name || fallback?.categoryName || 'N/A';
  const tags = (apiProduct.tags ?? [])
    .map((tag) => tag.name ?? '')
    .map((tag) => tag.trim())
    .filter(Boolean);
  const conditionName = apiProduct.condition_level?.name || fallback?.conditionName || 'N/A';
  const conditionLevel =
    typeof apiProduct.condition_level?.sort_order === 'number'
      ? apiProduct.condition_level.sort_order
      : fallback?.conditionLevel;
  const price =
    apiProduct.price !== undefined && apiProduct.price !== null
      ? String(apiProduct.price)
      : fallback?.price || 'N/A';
  const locationLat = apiProduct.dormitory?.latitude ?? fallback?.locationLat;
  const locationLng = apiProduct.dormitory?.longitude ?? fallback?.locationLng;

  return {
    id: apiProduct.id !== undefined && apiProduct.id !== null ? String(apiProduct.id) : fallback?.id || '',
    title: apiProduct.title ?? fallback?.title ?? '',
    status: normalizeProductStatus(apiProduct.status ?? fallback?.status),
    images: images.length > 0 ? images : fallback?.images ?? [],
    tags: tags.length > 0 ? tags : fallback?.tags ?? [],
    categoryName,
    universityName,
    conditionName,
    conditionLevel,
    description: apiProduct.description ?? fallback?.description ?? '',
    views: Number(apiProduct.views ?? fallback?.views) || 0,
    clicks: Number(apiProduct.clicks ?? fallback?.clicks) || 0,
    favorites: Number(apiProduct.favorites ?? fallback?.favorites) || 0,
    price,
    createdAt: apiProduct.created_at ?? fallback?.createdAt ?? '',
    updatedAt: apiProduct.updated_at ?? fallback?.updatedAt ?? '',
    sellerName,
    sellerId:
      apiProduct.seller_id !== undefined && apiProduct.seller_id !== null
        ? String(apiProduct.seller_id)
        : apiProduct.seller?.id !== undefined && apiProduct.seller?.id !== null
        ? String(apiProduct.seller.id)
        : fallback?.sellerId || '',
    sellerEmail: apiProduct.seller?.email ?? fallback?.sellerEmail,
    sellerAvatar: resolveProductImageUrl(apiProduct.seller?.profile_picture ?? fallback?.sellerAvatar),
    dormitoryName,
    pickupAvailable: fallback?.pickupAvailable ?? false,
    deliveryAvailable: fallback?.deliveryAvailable ?? false,
    location: apiProduct.dormitory?.domain || dormitoryName || fallback?.location || 'N/A',
    locationLat: typeof locationLat === 'number' ? locationLat : undefined,
    locationLng: typeof locationLng === 'number' ? locationLng : undefined,
    conditionId:
      apiProduct.condition_level_id !== undefined && apiProduct.condition_level_id !== null
        ? String(apiProduct.condition_level_id)
        : apiProduct.condition_level?.id !== undefined && apiProduct.condition_level?.id !== null
        ? String(apiProduct.condition_level.id)
        : fallback?.conditionId,
  };
};

export default function ProductDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();
  const { admin } = useAuth();
  const stateProduct = (location.state as ProductDetailState | null)?.product;
  const [product, setProduct] = useState<ProductDetailStateProduct | null>(stateProduct ?? null);
  const [loading, setLoading] = useState(Boolean(id));
  const [error, setError] = useState<string | null>(null);
  const [isBlockDialogOpen, setIsBlockDialogOpen] = useState(false);
  const [blockReason, setBlockReason] = useState('');
  const [blockError, setBlockError] = useState<string | null>(null);
  const [isBlocking, setIsBlocking] = useState(false);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const markerRef = useRef<AMapMarker | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);

  useEffect(() => {
    if (!id || !admin) {
      return;
    }
    let ignore = false;
    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/products/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data: ProductResponse | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.product) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : response.status === 404
              ? 'Product not found.'
              : response.status === 422
              ? 'Validation Error'
              : 'Failed to load product';
          if (!ignore) {
            setError(message);
          }
          return;
        }
        if (!ignore) {
          setProduct(buildProductDetailState(data.product, stateProduct ?? null));
        }
      } catch {
        if (!ignore) {
          setError('Failed to load product');
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    fetchProduct();
    return () => {
      ignore = true;
    };
  }, [admin, id, stateProduct]);

  const conditionLevel = product?.conditionLevel;
  const hasCoordinates = typeof product?.locationLat === 'number' && typeof product?.locationLng === 'number';
  const universityLocation = universities.find((item) => item.name === product?.universityName);
  const sellerInitial = product?.sellerName?.trim().charAt(0).toUpperCase() || 'U';
  const universityCoords = useMemo(() => {
    if (!universityLocation) {
      return null;
    }
    return { lat: universityLocation.lat, lng: universityLocation.lng };
  }, [universityLocation]);
  const mapCenter = useMemo<[number, number]>(() => {
    if (hasCoordinates) {
      return [product?.locationLat ?? 39.8283, product?.locationLng ?? -98.5795];
    }
    if (universityCoords) {
      return [universityCoords.lat, universityCoords.lng];
    }
    return [39.8283, -98.5795];
  }, [hasCoordinates, product?.locationLat, product?.locationLng, universityCoords]);
  const mapZoom = hasCoordinates || universityLocation ? 12 : 3;

  const updateLocationMarker = useCallback(() => {
    if (!mapRef.current || !amapRef.current) {
      return;
    }
    const AMap = amapRef.current;
    const position: [number, number] | null = hasCoordinates
      ? [product?.locationLng ?? mapCenter[1], product?.locationLat ?? mapCenter[0]]
      : universityCoords
      ? [universityCoords.lng, universityCoords.lat]
      : null;
    if (position) {
      if (!markerRef.current) {
        markerRef.current = new AMap.Marker({ position, map: mapRef.current });
      } else {
        markerRef.current.setPosition(position);
        markerRef.current.setMap(mapRef.current);
      }
    } else if (markerRef.current) {
      markerRef.current.setMap(null);
      markerRef.current = null;
    }
  }, [hasCoordinates, mapCenter, product?.locationLat, product?.locationLng, universityCoords]);

  useEffect(() => {
    if (!mapContainerRef.current || !AMAP_JS_KEY || !AMAP_SECURITY_CODE) {
      return;
    }
    const amapWindow = window as Window & { _AMapSecurityConfig?: { securityJsCode: string } };
    amapWindow._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
    let cancelled = false;
    AMapLoader.load({ key: AMAP_JS_KEY, version: '2.0' })
      .then((AMap) => {
        if (cancelled || !mapContainerRef.current) {
          return;
        }
        amapRef.current = AMap;
        if (!mapRef.current) {
          mapRef.current = new AMap.Map(mapContainerRef.current, {
            zoom: mapZoom,
            center: [mapCenter[1], mapCenter[0]],
            mapStyle: 'amap://styles/dark',
          });
        }
        mapRef.current.setZoom(mapZoom);
        mapRef.current.setCenter([mapCenter[1], mapCenter[0]]);
        updateLocationMarker();
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current?.destroy) {
        mapRef.current.destroy();
      }
      mapRef.current = null;
      markerRef.current = null;
      amapRef.current = null;
    };
  }, [mapCenter, mapZoom, updateLocationMarker]);

  useEffect(() => {
    if (!mapRef.current || !amapRef.current) {
      return;
    }
    mapRef.current.setZoom(mapZoom);
    mapRef.current.setCenter([mapCenter[1], mapCenter[0]]);
    updateLocationMarker();
  }, [mapCenter, mapZoom, updateLocationMarker]);

  const handleBlockProduct = async () => {
    if (!product || !admin) {
      return;
    }
    const trimmedReason = blockReason.trim();
    if (!trimmedReason) {
      setBlockError('Reason is required.');
      return;
    }
    setIsBlocking(true);
    setBlockError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/products/${product.id}/block`, {
        method: 'PATCH',
        headers: {
          Authorization: `${admin.tokenType} ${admin.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ reason: trimmedReason }),
      });
      const data: ProductResponse | undefined = await response.json().catch(() => undefined);
      if (!response.ok || !data?.product) {
        const message =
          data && typeof data.message === 'string'
            ? data.message
            : response.status === 403
            ? 'Unauthorized: Only administrators can access this endpoint.'
            : response.status === 404
            ? 'Product not found.'
            : response.status === 422
            ? 'Validation Error'
            : 'Failed to block product';
        setBlockError(message);
        return;
      }
      setProduct((prev) => {
        if (!prev) {
          return prev;
        }
        return {
          ...prev,
          status: normalizeProductStatus(data.product?.status ?? prev.status),
        };
      });
      setIsBlockDialogOpen(false);
      setBlockReason('');
    } catch {
      setBlockError('Failed to block product');
    } finally {
      setIsBlocking(false);
    }
  };

  if (!product) {
    if (loading) {
      return (
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-96">
            <p className="text-xl text-muted-foreground mb-4">Loading product...</p>
          </div>
        </DashboardLayout>
      );
    }
    if (error) {
      return (
        <DashboardLayout>
          <div className="flex flex-col items-center justify-center h-96">
            <p className="text-xl text-muted-foreground mb-4">{error}</p>
            <Button onClick={() => navigate(-1)}>Go Back</Button>
          </div>
        </DashboardLayout>
      );
    }
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-xl text-muted-foreground mb-4">Product not found</p>
          <Button onClick={() => navigate(-1)}>Go Back</Button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">{product.title}</h1>
            <p className="text-muted-foreground">Product details and listing information</p>
          </div>
          <span
            className={cn(
              "px-3 py-1 rounded-full text-sm font-medium capitalize",
              product.status === 'active' && "bg-primary/10 text-primary",
              product.status === 'sold' && "bg-success/10 text-success",
              product.status === 'reserved' && "bg-warning/10 text-warning",
              product.status === 'blocked' && "bg-destructive/10 text-destructive"
            )}
          >
            {product.status}
          </span>
        </div>
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm px-4 py-2 rounded-lg border border-destructive/20">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {product.images.map((image, index) => (
                  <div key={`${product.id}-${index}`} className="h-56 rounded-lg border border-border bg-secondary/30 overflow-hidden">
                    <img src={image} alt={`${product.title} ${index + 1}`} className="h-full w-full object-cover" />
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {product.tags.length > 0 ? (
                      product.tags.map((tag) => (
                        <button
                          key={`${product.id}-${tag}`}
                          type="button"
                          className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                          onClick={() => navigate('/')}
                        >
                          {tag}
                        </button>
                      ))
                    ) : (
                      <div className="text-xs text-muted-foreground">No tags</div>
                    )}
                  </div>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground">Condition Level</p>
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                      onClick={() => navigate('/')}
                    >
                      {product.conditionName}
                    </button>
                    {conditionLevel !== undefined && (
                      <button
                        type="button"
                        className="px-2 py-1 rounded-full text-xs font-medium bg-secondary text-foreground hover:bg-secondary/70 transition-colors"
                        onClick={() => navigate('/')}
                      >
                        Level {conditionLevel}
                      </button>
                    )}
                  </div>
                </div>
              </div>
              <h2 className="text-lg font-semibold text-foreground mb-3">Description</h2>
              <p className="text-sm text-muted-foreground leading-relaxed">{product.description}</p>
              <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Eye className="w-4 h-4" />
                  <span>{product.views} views</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <MousePointerClick className="w-4 h-4" />
                  <span>{product.clicks} clicks</span>
                </div>
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Heart className="w-4 h-4" />
                  <span>{product.favorites} favorites</span>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 text-2xl font-bold text-foreground">
                <DollarSign className="w-5 h-5 text-primary" />
                <span>{product.price}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Eye className="w-4 h-4" />
                <span>{product.views} views</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Heart className="w-4 h-4" />
                <span>{product.favorites} favorites</span>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <Tag className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Category</p>
                  <p className="text-sm text-foreground">{product.categoryName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Package className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Condition</p>
                  <p className="text-sm text-foreground">{product.conditionName}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Created</p>
                  <p className="text-sm text-foreground">{product.createdAt}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <CalendarDays className="w-5 h-5 text-muted-foreground" />
                <div>
                  <p className="text-xs text-muted-foreground">Updated</p>
                  <p className="text-sm text-foreground">{product.updatedAt}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full border border-border bg-secondary/50 overflow-hidden flex items-center justify-center">
                  {product.sellerAvatar ? (
                    <img src={product.sellerAvatar} alt={product.sellerName} className="h-full w-full object-cover" />
                  ) : (
                    <span className="text-sm font-medium text-foreground">{sellerInitial}</span>
                  )}
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Seller</p>
                  <p className="text-sm text-foreground">{product.sellerName}</p>
                  <p className="text-xs text-muted-foreground">{product.universityName}</p>
                  <p className="text-xs text-muted-foreground">{product.dormitoryName}</p>
                </div>
              </div>
              <Button variant="outline" className="w-full" onClick={() => navigate(`/users/${product.sellerId}`)}>
                View Seller Profile
              </Button>
              {product.sellerEmail && (
                <div className="text-xs text-muted-foreground">
                  {product.sellerEmail}
                </div>
              )}
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center justify-between">
                <p className="text-sm font-medium text-foreground">Moderation</p>
                <span
                  className={cn(
                    "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                    product.status === 'blocked' && "bg-destructive/10 text-destructive",
                    product.status !== 'blocked' && "bg-secondary text-foreground"
                  )}
                >
                  {product.status}
                </span>
              </div>
              <Dialog open={isBlockDialogOpen} onOpenChange={setIsBlockDialogOpen}>
                <Button
                  variant="destructive"
                  className="w-full"
                  onClick={() => {
                    setBlockError(null);
                    setIsBlockDialogOpen(true);
                  }}
                  disabled={isBlocking || product.status === 'blocked'}
                >
                  Block Product
                </Button>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Block Product</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-2">
                    <Label htmlFor="block-reason">Reason</Label>
                    <Textarea
                      id="block-reason"
                      value={blockReason}
                      onChange={(event) => setBlockReason(event.target.value)}
                      placeholder="Enter the reason for blocking this product..."
                      className="min-h-[120px]"
                    />
                    {blockError && (
                      <div className="text-sm text-destructive">{blockError}</div>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setIsBlockDialogOpen(false)}
                      disabled={isBlocking}
                    >
                      Cancel
                    </Button>
                    <Button onClick={handleBlockProduct} disabled={isBlocking}>
                      {isBlocking ? 'Blocking...' : 'Confirm Block'}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-3">
              <p className="text-sm font-medium text-foreground">Availability</p>
              <div className="text-sm text-muted-foreground">
                {product.pickupAvailable ? 'Pickup available' : 'Pickup unavailable'}
              </div>
              <div className="text-sm text-muted-foreground">
                {product.deliveryAvailable ? 'Delivery available' : 'Delivery unavailable'}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 space-y-4">
              <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                <MapPin className="w-4 h-4 text-primary" />
                <span>Location Map</span>
              </div>
              <div className="h-56 rounded-lg overflow-hidden border border-border">
                {AMAP_JS_KEY && AMAP_SECURITY_CODE ? (
                  <div ref={mapContainerRef} className="h-full w-full" />
                ) : (
                  <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                    Missing AMap keys.
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
