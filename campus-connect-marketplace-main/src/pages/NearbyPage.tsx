import React, { useEffect, useMemo, useRef, useState } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import MainLayout from '@/components/layout/MainLayout';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import ProductCard from '@/components/products/ProductCard';
import {
  mockCategories,
  mockConditionLevels,
  mockProducts,
  type Product,
} from '@/lib/mockData';
import { MapPin, Search, SlidersHorizontal } from 'lucide-react';

const AMAP_JS_KEY = import.meta.env.VITE_AMAP_JS_KEY ?? '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE ?? '';

const defaultCenter = { lat: 35.8617, lng: 104.1954 };
const userMarkerIcon = '/map_pointer/icons8-map-50.png';

type AMapMap = {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  resize?: () => void;
  destroy?: () => void;
};

type AMapMarker = {
  on: (event: 'click', handler: () => void) => void;
  setMap: (map: AMapMap | null) => void;
  setPosition?: (position: [number, number]) => void;
};

type AMapNamespace = {
  Map: new (container: HTMLDivElement, options: { zoom: number; center: [number, number]; mapStyle?: string }) => AMapMap;
  Marker: new (options: { position: [number, number]; map: AMapMap; icon?: string }) => AMapMarker;
};

type LocationPoint = {
  lat: number;
  lng: number;
  product: Product;
};

const NearbyPage: React.FC = () => {
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const markersRef = useRef<AMapMarker[]>([]);
  const userMarkerRef = useRef<AMapMarker | null>(null);
  const [query, setQuery] = useState('');
  const [locationQuery, setLocationQuery] = useState('');
  const [categoryId, setCategoryId] = useState<string>('all');
  const [conditionId, setConditionId] = useState<string>('all');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locationStatus, setLocationStatus] = useState<'idle' | 'requesting' | 'granted' | 'denied'>('idle');
  const [mapReady, setMapReady] = useState(false);

  const filteredProducts = useMemo(() => {
    return mockProducts.filter((product) => {
      if (categoryId !== 'all' && product.category_id !== Number(categoryId)) {
        return false;
      }
      if (conditionId !== 'all' && product.condition_level_id !== Number(conditionId)) {
        return false;
      }
      if (query.trim()) {
        const q = query.trim().toLowerCase();
        const matchesTitle = product.title.toLowerCase().includes(q);
        const matchesDesc = product.description?.toLowerCase().includes(q) ?? false;
        return matchesTitle || matchesDesc;
      }
      if (locationQuery.trim()) {
        const q = locationQuery.trim().toLowerCase();
        const dormitoryName = product.dormitory?.dormitory_name?.toLowerCase() ?? '';
        return dormitoryName.includes(q);
      }
      return true;
    });
  }, [categoryId, conditionId, locationQuery, query]);

  const productPoints = useMemo<LocationPoint[]>(() => {
    const center = userLocation ?? defaultCenter;
    return filteredProducts.map((product) => {
      const angle = (product.id * 73) % 360;
      const radius = 0.002 + (product.id % 5) * 0.0012;
      const rad = (angle * Math.PI) / 180;
      const lat = center.lat + Math.cos(rad) * radius;
      const lng = center.lng + Math.sin(rad) * radius;
      return { product, lat, lng };
    });
  }, [filteredProducts, userLocation]);

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
    markersRef.current = productPoints.map((point) => {
      const marker = new amapRef.current!.Marker({
        position: [point.lng, point.lat],
        map: mapRef.current!,
      });
      marker.on('click', () => {
        setSelectedProduct(point.product);
      });
      return marker;
    });
  }, [mapReady, productPoints]);

  useEffect(() => {
    if (!mapRef.current || !amapRef.current || !userLocation) {
      return;
    }
    mapRef.current.setCenter([userLocation.lng, userLocation.lat]);
    mapRef.current.setZoom(13);
    mapRef.current.resize?.();
    if (!userMarkerRef.current) {
      userMarkerRef.current = new amapRef.current.Marker({
        position: [userLocation.lng, userLocation.lat],
        map: mapRef.current,
        icon: userMarkerIcon,
      });
    } else {
      userMarkerRef.current.setPosition?.([userLocation.lng, userLocation.lat]);
      userMarkerRef.current.setMap(mapRef.current);
    }
  }, [userLocation]);

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

        <div className="absolute bottom-4 left-4 right-[360px] z-10">
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
              <Select value={categoryId} onValueChange={setCategoryId}>
                <SelectTrigger className="w-full lg:w-[220px]">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All categories</SelectItem>
                  {mockCategories.map((category) => (
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
                  {mockConditionLevels.map((condition) => (
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
          <div className="pointer-events-auto absolute right-0 top-0 bottom-0 w-[360px] overflow-y-auto bg-card/85 p-4 shadow-card backdrop-blur">
            <div className="text-sm font-semibold text-foreground">Selected listing</div>
            <div className="mt-4 flex flex-col gap-4">
              {selectedProduct ? (
                <ProductCard product={selectedProduct} />
              ) : (
                <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
                  Click a map pin to preview the listing.
                </div>
              )}
              <div className="pt-4 space-y-2">
                <div className="text-xs uppercase tracking-[0.3em] text-muted-foreground">
                  Nearby picks
                </div>
                <div className="grid gap-3">
                  {filteredProducts.slice(0, 3).map((product) => (
                    <button
                      key={product.id}
                      onClick={() => setSelectedProduct(product)}
                      className="text-left rounded-lg border border-white/10 bg-background/40 p-3 hover:border-primary/60 transition-colors"
                    >
                      <div className="text-sm font-medium text-foreground">{product.title}</div>
                      <div className="text-xs text-muted-foreground">{product.category?.name}</div>
                    </button>
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
