import React, { useEffect, useMemo, useRef, useState } from 'react';
import { createRoot } from 'react-dom/client';
import AMapLoader from '@amap/amap-jsapi-loader';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Slider } from '@/components/ui/slider';
import ProductCard from '@/components/products/ProductCard';
import MapPointer from '@/components/MapPointer';
import OtherLocationPointer from '@/components/OtherLocationPointer';
import { type Product } from '@/lib/mockData';
import { normalizeImageUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';

const AMAP_JS_KEY = import.meta.env.VITE_AMAP_JS_KEY ?? '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE ?? '';

const defaultCenter = { lat: 35.8617, lng: 104.1954 };

type AMapMap = {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  getZoom?: () => number;
  lngLatToContainer?: (position: [number, number]) => { x: number; y: number };
  on?: (event: string, handler: () => void) => void;
  off?: (event: string, handler: () => void) => void;
  resize?: () => void;
  destroy?: () => void;
};

type AMapMarker = {
  on: (event: 'click', handler: () => void) => void;
  setMap: (map: AMapMap | null) => void;
  setPosition?: (position: [number, number]) => void;
  setContent?: (content: HTMLElement | string) => void;
};

type AMapNamespace = {
  Map: new (container: HTMLDivElement, options: { zoom: number; center: [number, number]; mapStyle?: string }) => AMapMap;
  Marker: new (options: { position: [number, number]; map: AMapMap; content?: HTMLElement | string }) => AMapMarker;
};

type DormGroup = {
  dormitoryId: number;
  dormitoryName: string;
  lat: number;
  lng: number;
  products: Product[];
};

type NearbyApiProductImage = {
  id?: number;
  product_id?: number;
  image_url?: string;
  image_thumbnail_url?: string | null;
  is_primary?: boolean;
};

type NearbyApiProduct = {
  id?: number;
  seller_id?: number;
  seller?: {
    id?: number;
    full_name?: string;
    username?: string;
    email?: string;
    profile_picture?: string | null;
  };
  dormitory_id?: number | null;
  dormitory?: {
    id?: number;
    dormitory_name?: string;
    domain?: string;
    location?: string;
    lat?: number;
    lng?: number;
    is_active?: boolean;
    university_id?: number;
  };
  category_id?: number;
  category?: {
    id?: number;
    name?: string;
    parent_id?: number | null;
    icon?: string | null;
  };
  condition_level_id?: number;
  condition_level?: {
    id?: number;
    name?: string;
    description?: string | null;
    sort_order?: number | null;
    level?: number | null;
  };
  title?: string;
  description?: string | null;
  price?: number;
  status?: 'available' | 'sold' | 'reserved';
  is_promoted?: number | boolean | null;
  created_at?: string;
  images?: NearbyApiProductImage[];
  tags?: Array<{ id?: number; name?: string }>;
  distance_km?: number | null;
};

type NearbyResponseBody = {
  message?: string;
  center?: { lat?: number; lng?: number };
  distance_km?: number;
  products?: NearbyApiProduct[];
  meta?: {
    categories?: Array<{ id: number; name: string; icon?: string | null }>;
    condition_levels?: Array<{ id: number; name: string; description?: string | null; sort_order?: number | null }>;
  };
  errors?: Record<string, string[]>;
};

const toRadians = (value: number) => (value * Math.PI) / 180;

const getDistanceKm = (from: { lat: number; lng: number }, to: { lat: number; lng: number }) => {
  const earthRadiusKm = 6371;
  const deltaLat = toRadians(to.lat - from.lat);
  const deltaLng = toRadians(to.lng - from.lng);
  const fromLat = toRadians(from.lat);
  const toLat = toRadians(to.lat);
  const a =
    Math.sin(deltaLat / 2) * Math.sin(deltaLat / 2) +
    Math.sin(deltaLng / 2) * Math.sin(deltaLng / 2) * Math.cos(fromLat) * Math.cos(toLat);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return earthRadiusKm * c;
};

const getZoomForDistance = (distanceKm: number, latitude: number, viewportPx: number) => {
  const diameterMeters = Math.max(distanceKm, 1) * 2000;
  const metersPerPixel = diameterMeters / Math.max(viewportPx, 1);
  const zoom =
    Math.log2((156543.03392 * Math.cos(toRadians(latitude))) / Math.max(metersPerPixel, 1));
  return Math.min(18, Math.max(3, zoom));
};

const getDistanceForZoom = (zoom: number, latitude: number, viewportPx: number) => {
  const metersPerPixel = (156543.03392 * Math.cos(toRadians(latitude))) / Math.pow(2, zoom);
  const diameterMeters = metersPerPixel * Math.max(viewportPx, 1);
  return diameterMeters / 2000;
};

const NearbyPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const sonarCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const markersRef = useRef<AMapMarker[]>([]);
  const userMarkerRef = useRef<AMapMarker | null>(null);
  const productMarkerRootsRef = useRef<ReturnType<typeof createRoot>[]>([]);
  const productMarkerContainersRef = useRef<HTMLDivElement[]>([]);
  const userMarkerContainerRef = useRef<HTMLDivElement | null>(null);
  const userMarkerRootRef = useRef<ReturnType<typeof createRoot> | null>(null);
  const sonarOpacityRef = useRef(1);
  const sonarIdleTimerRef = useRef<number | null>(null);
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [conditionId, setConditionId] = useState<string>('all');
  const [distanceKm, setDistanceKm] = useState<number>(10);
  const [selectedDormitoryId, setSelectedDormitoryId] = useState<number | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [mapReady, setMapReady] = useState(false);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Array<{ id: number; name: string; icon?: string | null }>>([]);
  const [conditionLevels, setConditionLevels] = useState<
    Array<{ id: number; name: string; description?: string | null; sort_order?: number | null }>
  >([]);
  const [isLoading, setIsLoading] = useState(false);
  const { user, getNearby } = useAuth();
  const profileImage = useMemo(
    () => normalizeImageUrl(user?.profile_picture) ?? '/placeholder.svg',
    [user?.profile_picture],
  );

  const mapApiProduct = (data: NearbyApiProduct, fallbackId: number): Product | null => {
    const resolvedId = typeof data.id === 'number' ? data.id : fallbackId;
    const title = data.title || 'Untitled';
    const price = typeof data.price === 'number' ? data.price : 0;
    const status = data.status ?? 'available';
    const createdAt = data.created_at || new Date().toISOString();
    const images: Product['images'] = Array.isArray(data.images)
      ? data.images.flatMap((image, index) => {
          const url = image.image_url || image.image_thumbnail_url;
          if (!url) return [];
          return [
            {
              id: typeof image.id === 'number' ? image.id : index + 1,
              product_id: resolvedId,
              image_url: url,
              image_thumbnail_url: image.image_thumbnail_url ?? undefined,
              is_primary: Boolean(image.is_primary),
            },
          ];
        })
      : [];

    const category = data.category?.id
      ? {
          id: data.category.id,
          name: data.category.name || '',
          parent_id: data.category.parent_id ?? undefined,
          icon: data.category.icon ?? undefined,
        }
      : undefined;

    const conditionLevel = data.condition_level?.id
      ? {
          id: data.condition_level.id,
          name: data.condition_level.name || '',
          description: data.condition_level.description ?? undefined,
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

    const seller = data.seller?.id
      ? {
          id: data.seller.id,
          full_name: data.seller.full_name || '',
          username: data.seller.username || '',
          email: data.seller.email || '',
          profile_picture: data.seller.profile_picture ?? undefined,
          role: 'user' as const,
          status: 'active' as const,
        }
      : undefined;

    const tags = Array.isArray(data.tags)
      ? data.tags
          .filter((tag): tag is { id: number; name?: string } => typeof tag.id === 'number')
          .map((tag) => ({ id: tag.id, name: tag.name || '' }))
      : [];

    const sellerId = typeof data.seller_id === 'number' ? data.seller_id : seller?.id ?? 0;
    const dormitoryId =
      typeof data.dormitory_id === 'number'
        ? data.dormitory_id
        : typeof dormitory?.id === 'number'
          ? dormitory.id
          : 0;
    const categoryId =
      typeof data.category_id === 'number'
        ? data.category_id
        : typeof category?.id === 'number'
          ? category.id
          : 0;
    const conditionLevelId =
      typeof data.condition_level_id === 'number'
        ? data.condition_level_id
        : typeof conditionLevel?.id === 'number'
          ? conditionLevel.id
          : 0;

    return {
      id: resolvedId,
      seller_id: sellerId,
      seller,
      dormitory_id: dormitoryId,
      dormitory,
      category_id: categoryId,
      category,
      condition_level_id: conditionLevelId,
      condition_level: conditionLevel,
      title,
      description: data.description ?? undefined,
      price,
      status,
      is_promoted: Boolean(data.is_promoted),
      created_at: createdAt,
      images,
      tags,
      distance_km: typeof data.distance_km === 'number' ? data.distance_km : undefined,
    };
  };

  const filteredProducts = useMemo(() => products, [products]);

  const dormGroups = useMemo<DormGroup[]>(() => {
    const grouped = new Map<number, DormGroup>();
    filteredProducts.forEach((product) => {
      const dormitoryId = product.dormitory_id;
      const dormitory = product.dormitory;
      if (!dormitory?.lat || !dormitory?.lng) {
        return;
      }
      if (!grouped.has(dormitoryId)) {
        grouped.set(dormitoryId, {
          dormitoryId,
          dormitoryName: dormitory.dormitory_name,
          lat: dormitory.lat,
          lng: dormitory.lng,
          products: [],
        });
      }
      grouped.get(dormitoryId)!.products.push(product);
    });
    return Array.from(grouped.values());
  }, [filteredProducts]);

  const distanceCenter = userLocation ?? defaultCenter;

  const visibleDormGroups = useMemo(() => {
    return dormGroups.filter((group) => {
      const distance = getDistanceKm(distanceCenter, { lat: group.lat, lng: group.lng });
      return distance <= distanceKm;
    });
  }, [distanceCenter, distanceKm, dormGroups]);

  const visibleDormitoryIds = useMemo(
    () => new Set(visibleDormGroups.map((group) => group.dormitoryId)),
    [visibleDormGroups],
  );

  const selectedDormitoryProducts = useMemo(() => {
    if (!selectedDormitoryId) {
      return [];
    }
    if (!visibleDormitoryIds.has(selectedDormitoryId)) {
      return [];
    }
    return filteredProducts.filter((product) => product.dormitory_id === selectedDormitoryId);
  }, [filteredProducts, selectedDormitoryId, visibleDormitoryIds]);

  useEffect(() => {
    if (selectedDormitoryId && !visibleDormitoryIds.has(selectedDormitoryId)) {
      setSelectedDormitoryId(null);
    }
  }, [selectedDormitoryId, visibleDormitoryIds]);

  useEffect(() => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }, []);

  useEffect(() => {
    const center = userLocation ?? defaultCenter;
    let cancelled = false;
    setIsLoading(true);
    const timeoutId = window.setTimeout(() => {
      void (async () => {
        try {
          const data = (await getNearby({
            lat: center.lat,
            lng: center.lng,
            distance_km: distanceKm,
            category_id: categoryId === 'all' ? undefined : Number(categoryId),
            condition_level_id: conditionId === 'all' ? undefined : Number(conditionId),
            q: query.trim() || undefined,
            location_q: locationQuery.trim() || undefined,
          })) as NearbyResponseBody;
          if (cancelled) return;

          const mapped = Array.isArray(data.products)
            ? data.products
                .map((item, index) => mapApiProduct(item, index + 1))
                .filter((item): item is Product => !!item)
            : [];
          setProducts(mapped);
          setCategories(data.meta?.categories ?? []);
          setConditionLevels(data.meta?.condition_levels ?? []);
        } catch (error) {
          if (cancelled) return;
          const maybe = error as { message?: string } | undefined;
          toast({
            title: "Failed to load nearby listings",
            description: maybe?.message || "Please try again.",
            variant: "destructive",
          });
          setProducts([]);
        } finally {
          if (!cancelled) setIsLoading(false);
        }
      })();
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [categoryId, conditionId, distanceKm, getNearby, locationQuery, query, userLocation]);

  useEffect(() => {
    if (!mapContainerRef.current || !AMAP_JS_KEY || !AMAP_SECURITY_CODE) {
      return;
    }
    const amapWindow = window as Window & { _AMapSecurityConfig?: { securityJsCode: string } };
    amapWindow._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
    let cancelled = false;
    AMapLoader.load({ key: AMAP_JS_KEY, version: '2.0' })
      .then((AMap) => {
        if (cancelled || !mapContainerRef.current || mapRef.current) {
          return;
        }
        amapRef.current = AMap as AMapNamespace;
        mapRef.current = new AMap.Map(mapContainerRef.current, {
          zoom: 4,
          center: [defaultCenter.lng, defaultCenter.lat],
          mapStyle: 'amap://styles/dark',
        });
        setMapReady(true);
        window.requestAnimationFrame(() => {
          mapRef.current?.resize?.();
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker.setMap(null));
      markersRef.current = [];
      userMarkerRef.current?.setMap(null);
      userMarkerRef.current = null;
      productMarkerRootsRef.current.forEach((root) => root.unmount());
      productMarkerRootsRef.current = [];
      productMarkerContainersRef.current = [];
      userMarkerRootRef.current?.unmount();
      userMarkerRootRef.current = null;
      userMarkerContainerRef.current = null;
      if (mapRef.current?.destroy) {
        mapRef.current.destroy();
      }
      mapRef.current = null;
      amapRef.current = null;
      setMapReady(false);
    };
  }, []);

  useEffect(() => {
    if (!mapRef.current || !amapRef.current || !mapReady) {
      return;
    }
    markersRef.current.forEach((marker) => marker.setMap(null));
    productMarkerRootsRef.current.forEach((root) => root.unmount());
    productMarkerRootsRef.current = [];
    productMarkerContainersRef.current = [];
    markersRef.current = visibleDormGroups.map((group) => {
      const container = document.createElement('div');
      const root = createRoot(container);
      const previewProduct = group.products[0];
      const primaryImage =
        previewProduct?.images?.find((image) => image.is_primary)?.image_url ||
        previewProduct?.images?.[0]?.image_url;
      const imageSrc = normalizeImageUrl(primaryImage) ?? '/placeholder.svg';
      root.render(<OtherLocationPointer src={imageSrc} alt={group.dormitoryName} hasTail />);
      const marker = new amapRef.current!.Marker({
        position: [group.lng, group.lat],
        map: mapRef.current!,
        content: container,
      });
      marker.on('click', () => {
        setSelectedDormitoryId(group.dormitoryId);
      });
      productMarkerRootsRef.current.push(root);
      productMarkerContainersRef.current.push(container);
      return marker;
    });
  }, [mapReady, visibleDormGroups]);

  useEffect(() => {
    if (!mapRef.current || !amapRef.current || !userLocation || !mapReady) {
      return;
    }
    mapRef.current.setCenter([userLocation.lng, userLocation.lat]);
    const viewportSize =
      Math.min(mapContainerRef.current?.clientWidth ?? 0, mapContainerRef.current?.clientHeight ?? 0) ||
      600;
    mapRef.current.setZoom(getZoomForDistance(distanceKm, userLocation.lat, viewportSize));
    mapRef.current.resize?.();
    if (!userMarkerContainerRef.current) {
      userMarkerContainerRef.current = document.createElement('div');
    }
    if (!userMarkerRootRef.current) {
      userMarkerRootRef.current = createRoot(userMarkerContainerRef.current);
    }
    userMarkerRootRef.current.render(
      <MapPointer src={profileImage} alt={user?.full_name || 'profile'} hasTail />,
    );
    if (!userMarkerRef.current) {
      userMarkerRef.current = new amapRef.current.Marker({
        position: [userLocation.lng, userLocation.lat],
        map: mapRef.current,
        content: userMarkerContainerRef.current,
      });
    } else {
      userMarkerRef.current.setPosition?.([userLocation.lng, userLocation.lat]);
      userMarkerRef.current.setMap(mapRef.current);
      userMarkerRef.current.setContent?.(userMarkerContainerRef.current);
    }
  }, [distanceKm, mapReady, profileImage, user?.full_name, userLocation]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }
    const center = userLocation ?? defaultCenter;
    const viewportSize =
      Math.min(mapContainerRef.current?.clientWidth ?? 0, mapContainerRef.current?.clientHeight ?? 0) ||
      600;
    mapRef.current.setCenter([center.lng, center.lat]);
    mapRef.current.setZoom(getZoomForDistance(distanceKm, center.lat, viewportSize));
  }, [distanceKm, mapReady, userLocation]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }
    const handleZoomEnd = () => {
      const zoom = mapRef.current?.getZoom?.();
      if (zoom === undefined) {
        return;
      }
      const viewportSize =
        Math.min(mapContainerRef.current?.clientWidth ?? 0, mapContainerRef.current?.clientHeight ?? 0) ||
        600;
      const centerLat = (userLocation ?? defaultCenter).lat;
      const distance = getDistanceForZoom(zoom, centerLat, viewportSize);
      const clamped = Math.min(50, Math.max(1, Math.round(distance)));
      if (clamped !== distanceKm) {
        setDistanceKm(clamped);
      }
    };
    mapRef.current.on?.('zoomend', handleZoomEnd);
    return () => {
      mapRef.current?.off?.('zoomend', handleZoomEnd);
    };
  }, [distanceKm, mapReady, userLocation]);

  useEffect(() => {
    if (!mapRef.current || !mapReady) {
      return;
    }
    const handleMoveStart = () => {
      sonarOpacityRef.current = 0;
      if (sonarIdleTimerRef.current) {
        window.clearTimeout(sonarIdleTimerRef.current);
      }
    };
    const handleMoveEnd = () => {
      if (sonarIdleTimerRef.current) {
        window.clearTimeout(sonarIdleTimerRef.current);
      }
      sonarIdleTimerRef.current = window.setTimeout(() => {
        sonarOpacityRef.current = 1;
      }, 400);
    };
    mapRef.current.on?.('movestart', handleMoveStart);
    mapRef.current.on?.('moveend', handleMoveEnd);
    mapRef.current.on?.('zoomstart', handleMoveStart);
    mapRef.current.on?.('zoomend', handleMoveEnd);
    mapRef.current.on?.('dragstart', handleMoveStart);
    mapRef.current.on?.('dragend', handleMoveEnd);
    return () => {
      mapRef.current?.off?.('movestart', handleMoveStart);
      mapRef.current?.off?.('moveend', handleMoveEnd);
      mapRef.current?.off?.('zoomstart', handleMoveStart);
      mapRef.current?.off?.('zoomend', handleMoveEnd);
      mapRef.current?.off?.('dragstart', handleMoveStart);
      mapRef.current?.off?.('dragend', handleMoveEnd);
      if (sonarIdleTimerRef.current) {
        window.clearTimeout(sonarIdleTimerRef.current);
      }
      sonarOpacityRef.current = 1;
    };
  }, [mapReady]);

  useEffect(() => {
    const canvas = sonarCanvasRef.current;
    if (!canvas) {
      return;
    }
    const ctx = canvas.getContext('2d');
    if (!ctx) {
      return;
    }
    let width = 0;
    let height = 0;
    let animationFrameId = 0;
    let particles: Array<{
      x: number;
      y: number;
      circleId: number;
      idx: number;
      radius: number;
      lightness: number;
      alpha?: number;
    }> = [];
    let circles: Array<{ id: number; minDiameter: number; currentDiameter: number }> = [];
    let mouseX = -1000;
    let mouseY = -1000;
    let mousePresent = false;
    const circleCount = 4;
    const particlesPerCircle = 60;
    const maxParticleRadius = 3.5;
    const attractionStrength = 0.04;
    const attractionRadius = 160;
    const centerLocation = userLocation ?? defaultCenter;
    const getMaxDiameter = () => {
      const viewport = Math.min(width, height) || 600;
      const zoom = getZoomForDistance(distanceKm, centerLocation.lat, viewport);
      const metersPerPixel =
        (156543.03392 * Math.cos(toRadians(centerLocation.lat))) / Math.pow(2, zoom);
      const diameterPx = (distanceKm * 2000) / Math.max(metersPerPixel, 1);
      return Math.min(Math.max(diameterPx, 120), Math.min(width, height) * 0.95);
    };
    const createParticle = (circleId: number, indexInCircle: number) => ({
      x: 0,
      y: 0,
      circleId,
      idx: indexInCircle,
      radius: Math.random() * maxParticleRadius + 1.2,
      lightness: Math.random() * 12 + 88,
    });
    const getCenterPoint = () => {
      if (mapRef.current?.lngLatToContainer) {
        const point = mapRef.current.lngLatToContainer([centerLocation.lng, centerLocation.lat]);
        if (point && Number.isFinite(point.x) && Number.isFinite(point.y)) {
          return { x: point.x, y: point.y };
        }
      }
      return { x: width / 2, y: height / 2 };
    };
    const initWorld = () => {
      const maxDiameter = getMaxDiameter();
      const minDiameter = Math.max(12, maxDiameter * 0.08);
      circles = [];
      for (let i = 0; i < circleCount; i += 1) {
        const offset = i / circleCount;
        const startDiameter = minDiameter + offset * (maxDiameter - minDiameter);
        circles.push({ id: i, minDiameter, currentDiameter: startDiameter });
      }
      particles = [];
      for (let c = 0; c < circleCount; c += 1) {
        for (let j = 0; j < particlesPerCircle; j += 1) {
          particles.push(createParticle(c, j));
        }
      }
      const { x: centerX, y: centerY } = getCenterPoint();
      for (const particle of particles) {
        const circle = circles[particle.circleId];
        const radius = circle.currentDiameter / 2;
        const angle = (particle.idx / particlesPerCircle) * Math.PI * 2;
        particle.x = centerX + Math.cos(angle) * radius;
        particle.y = centerY + Math.sin(angle) * radius;
      }
    };
    const resizeCanvas = () => {
      width = canvas.clientWidth;
      height = canvas.clientHeight;
      canvas.width = width;
      canvas.height = height;
      initWorld();
    };
    const handleMouseMove = (event: MouseEvent) => {
      const rect = canvas.getBoundingClientRect();
      mouseX = event.clientX - rect.left;
      mouseY = event.clientY - rect.top;
      mousePresent = true;
    };
    const handleMouseLeave = () => {
      mousePresent = false;
    };
    const animate = () => {
      ctx.fillStyle = 'rgba(0, 0, 0, 0)';
      ctx.clearRect(0, 0, width, height);
      const { x: centerX, y: centerY } = getCenterPoint();
      const maxDiameter = getMaxDiameter();
      const opacityScale = sonarOpacityRef.current;
      for (const circle of circles) {
        circle.currentDiameter = Math.min(circle.currentDiameter + 1.6, maxDiameter);
        const radius = circle.currentDiameter / 2;
        const progress = (circle.currentDiameter - circle.minDiameter) / (maxDiameter - circle.minDiameter);
        const alpha = Math.max(0, 1 - progress) * opacityScale;
        for (const particle of particles) {
          if (particle.circleId !== circle.id) continue;
          const angle = (particle.idx / particlesPerCircle) * Math.PI * 2;
          const targetX = centerX + Math.cos(angle) * radius;
          const targetY = centerY + Math.sin(angle) * radius;
          const dx = targetX - particle.x;
          const dy = targetY - particle.y;
          particle.x += dx * 0.1;
          particle.y += dy * 0.1;
          particle.alpha = alpha;
        }
        if (circle.currentDiameter >= maxDiameter) {
          circle.currentDiameter = circle.minDiameter;
          const resetRadius = circle.minDiameter / 2;
          for (const particle of particles) {
            if (particle.circleId !== circle.id) continue;
            const angle = (particle.idx / particlesPerCircle) * Math.PI * 2;
            particle.x = centerX + Math.cos(angle) * resetRadius;
            particle.y = centerY + Math.sin(angle) * resetRadius;
          }
        }
      }
      if (mousePresent) {
        for (const particle of particles) {
          const dx = mouseX - particle.x;
          const dy = mouseY - particle.y;
          const dist = Math.hypot(dx, dy);
          if (dist < attractionRadius && dist > 0.1) {
            const force = attractionStrength * (1 - dist / attractionRadius);
            particle.x += dx * force;
            particle.y += dy * force;
          }
        }
      }
      for (const particle of particles) {
        const alpha = particle.alpha ?? 1;
        const grad = ctx.createRadialGradient(
          particle.x,
          particle.y,
          0,
          particle.x,
          particle.y,
          particle.radius * 1.8,
        );
        const lightness = particle.lightness;
        grad.addColorStop(0, `hsla(0, 0%, ${lightness}%, ${alpha * 0.9})`);
        grad.addColorStop(0.5, `hsla(0, 0%, ${Math.max(70, lightness - 12)}%, ${alpha * 0.5})`);
        grad.addColorStop(1, 'hsla(0, 0%, 60%, 0)');
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 1.5, 0, Math.PI * 2);
        ctx.fillStyle = grad;
        ctx.fill();
        ctx.beginPath();
        ctx.arc(particle.x, particle.y, particle.radius * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = `hsla(0, 0%, ${Math.min(96, lightness + 4)}%, ${alpha * 0.8})`;
        ctx.fill();
        particle.alpha = undefined;
      }
      animationFrameId = window.requestAnimationFrame(animate);
    };
    window.addEventListener('resize', resizeCanvas);
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseleave', handleMouseLeave);
    resizeCanvas();
    animate();
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseleave', handleMouseLeave);
      window.cancelAnimationFrame(animationFrameId);
    };
  }, [distanceKm, mapReady, userLocation]);

  useEffect(() => {
    if (!mapReady || !mapRef.current) {
      return;
    }
    const handleResize = () => {
      mapRef.current?.resize?.();
    };
    window.addEventListener('resize', handleResize);
    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [mapReady]);

  const handleRetryLocation = () => {
    if (!navigator.geolocation) {
      setLocationStatus('denied');
      return;
    }
    setLocationStatus('requesting');
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setUserLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude });
        setLocationStatus('granted');
      },
      () => {
        setLocationStatus('denied');
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  };

  return (
    <MainLayout showFooter={false} headerClassName="bg-black text-white mix-blend-normal">
      <div className="relative h-[calc(100vh-4rem)]">
        <div className="absolute inset-0">
          {AMAP_JS_KEY && AMAP_SECURITY_CODE ? (
            <div ref={mapContainerRef} className="h-full w-full" />
          ) : (
            <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
              Map keys are missing.
            </div>
          )}
        </div>
        <div className="pointer-events-none absolute inset-0 z-[1]">
          <canvas ref={sonarCanvasRef} className="h-full w-full" />
        </div>
        <div className="pointer-events-none absolute left-4 top-4 z-[2]">
          <img
            src="/compose rose/compose_rose.png"
            alt="compose rose"
            className="h-28 w-28 object-contain"
          />
        </div>

        <div className="absolute bottom-4 left-4 right-4 lg:right-[360px] z-10">
          <div className="flex flex-col gap-4 rounded-2xl bg-card/80 p-4 shadow-card backdrop-blur">
            <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
              <MapPin className="w-4 h-4 text-primary" />
              <span>Discover products near your location</span>
              {locationStatus === 'granted' && userLocation && (
                <Badge variant="outline" className="text-tertiary border-tertiary">
                  Location active
                </Badge>
              )}
              {locationStatus === 'denied' && (
                <Button variant="outline" size="sm" onClick={handleRetryLocation}>
                  Enable location
                </Button>
              )}
              {locationStatus === 'requesting' && (
                <span className="text-xs text-muted-foreground">Requesting location…</span>
              )}
              {isLoading && (
                <span className="text-xs text-muted-foreground">Loading nearby listings…</span>
              )}
            </div>

            <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search nearby items..."
                  className="pl-9"
                />
              </div>
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={locationQuery}
                  onChange={(event) => setLocationQuery(event.target.value)}
                  placeholder="Search by dorm or area..."
                  className="pl-9"
                />
              </div>
              <div className="flex flex-1 flex-col gap-2">
                <div className="flex items-center justify-between text-xs font-semibold text-foreground">
                  <span>Distance</span>
                  <span>{distanceKm} km</span>
                </div>
                <Slider
                  min={1}
                  max={50}
                  step={1}
                  value={[distanceKm]}
                  onValueChange={(value) => setDistanceKm(value[0] ?? 1)}
                />
              </div>
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full lg:w-[220px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {categories.map((category) => (
                    <SelectItem key={category.id} value={String(category.id)}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={conditionId} onValueChange={setConditionId}>
                <SelectTrigger className="w-full lg:w-[220px]">
                  <SelectValue placeholder="Condition" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All conditions</SelectItem>
                  {conditionLevels.map((condition) => (
                    <SelectItem key={condition.id} value={String(condition.id)}>
                      {condition.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <div className="hidden lg:flex items-center gap-2 text-sm font-semibold text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </div>
            </div>
          </div>
        </div>

        <div className="pointer-events-none absolute inset-0 z-10">
          <div className="pointer-events-auto absolute right-0 top-0 bottom-0 hidden w-[360px] h-full overflow-hidden bg-card/85 p-4 shadow-card backdrop-blur lg:block">
            <div className="text-sm font-semibold text-foreground">Selected dormitory</div>
            <div className="mt-4 flex h-[calc(100%-1.5rem)] min-h-0 flex-col gap-4">
              {selectedDormitoryId ? (
                <div className="text-sm text-muted-foreground">
                  {selectedDormitoryProducts.length} listing
                  {selectedDormitoryProducts.length === 1 ? '' : 's'} available
                </div>
              ) : (
                <div className="flex h-24 items-center justify-center text-sm text-muted-foreground">
                  Click a dorm pin to preview listings.
                </div>
              )}
              <div className="min-h-0 flex-1 overflow-y-auto pr-1">
                <div className="grid gap-3">
                  {selectedDormitoryProducts.map((product) => (
                    <div
                      key={product.id}
                      className="rounded-2xl border border-white/10 bg-background/70 p-3 shadow-sm transition hover:border-primary/40 hover:bg-background/90"
                    >
                      <ProductCard product={product} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default NearbyPage;
