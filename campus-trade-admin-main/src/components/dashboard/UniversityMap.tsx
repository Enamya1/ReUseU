import { useEffect, useRef } from 'react';
import AMapLoader from '@amap/amap-jsapi-loader';
import { useNavigate } from 'react-router-dom';
import { universities } from '@/lib/dummyData';
import { MapPin } from 'lucide-react';

const AMAP_JS_KEY = import.meta.env.VITE_AMAP_JS_KEY ?? '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE ?? '';
const defaultCenter: [number, number] = [-98.5795, 39.8283];

type AMapMap = {
  destroy?: () => void;
};

type AMapMarker = {
  on: (event: 'click', handler: () => void) => void;
  setMap: (map: AMapMap | null) => void;
};

type AMapInfoWindow = {
  setContent: (content: HTMLElement) => void;
  open: (map: AMapMap, position: [number, number]) => void;
};

type AMapNamespace = {
  Map: new (container: HTMLDivElement, options: { zoom: number; center: [number, number]; mapStyle?: string }) => AMapMap;
  Marker: new (options: { position: [number, number]; map: AMapMap }) => AMapMarker;
  InfoWindow: new (options: { offset: unknown }) => AMapInfoWindow;
  Pixel: new (x: number, y: number) => unknown;
};

export function UniversityMap() {
  const navigate = useNavigate();
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const infoWindowRef = useRef<AMapInfoWindow | null>(null);
  const markersRef = useRef<AMapMarker[]>([]);

  useEffect(() => {
    if (!mapContainerRef.current || !AMAP_JS_KEY || !AMAP_SECURITY_CODE) {
      return;
    }
    const amapWindow = window as Window & { _AMapSecurityConfig?: { securityJsCode: string } };
    amapWindow._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
    let cancelled = false;
    AMapLoader.load({ key: AMAP_JS_KEY, version: '2.0' })
      .then((AMap: AMapNamespace) => {
        if (cancelled || !mapContainerRef.current || mapRef.current) {
          return;
        }
        mapRef.current = new AMap.Map(mapContainerRef.current, {
          zoom: 4,
          center: defaultCenter,
          mapStyle: 'amap://styles/dark',
        });
        infoWindowRef.current = new AMap.InfoWindow({
          offset: new AMap.Pixel(0, -30),
        });
        markersRef.current = universities.map((university) => {
          const position: [number, number] = [university.lng, university.lat];
          const marker = new AMap.Marker({ position, map: mapRef.current });
          marker.on('click', () => {
            const container = document.createElement('div');
            container.className = 'p-2 min-w-[200px]';
            const title = document.createElement('h4');
            title.className = 'font-bold text-foreground text-base mb-2';
            title.textContent = university.name;
            const location = document.createElement('p');
            location.className = 'text-muted-foreground text-sm mb-2';
            location.textContent = university.location;
            const stats = document.createElement('div');
            stats.className = 'flex items-center gap-4 text-xs text-muted-foreground mb-3';
            const students = document.createElement('span');
            students.className = 'flex items-center gap-1';
            students.textContent = `${university.studentCount.toLocaleString()} students`;
            const dorms = document.createElement('span');
            dorms.className = 'flex items-center gap-1';
            dorms.textContent = `${university.dormitoriesCount} dorms`;
            stats.appendChild(students);
            stats.appendChild(dorms);
            const button = document.createElement('button');
            button.type = 'button';
            button.className =
              'w-full rounded-md bg-primary text-primary-foreground px-3 py-1.5 text-xs font-medium';
            button.textContent = 'View Details';
            button.addEventListener('click', () => navigate(`/university/${university.id}`));
            container.appendChild(title);
            container.appendChild(location);
            container.appendChild(stats);
            container.appendChild(button);
            infoWindowRef.current.setContent(container);
            infoWindowRef.current.open(mapRef.current, position);
          });
          return marker;
        });
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      markersRef.current.forEach((marker) => marker?.setMap?.(null));
      markersRef.current = [];
      if (mapRef.current?.destroy) {
        mapRef.current.destroy();
      }
      mapRef.current = null;
      infoWindowRef.current = null;
    };
  }, [navigate]);

  return (
    <div className="bg-card rounded-xl border border-border p-6">
      <div className="flex items-center gap-3 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="text-lg font-semibold text-foreground">University Locations</h3>
      </div>
      <div className="h-[400px] rounded-lg overflow-hidden border border-border">
        {AMAP_JS_KEY && AMAP_SECURITY_CODE ? (
          <div ref={mapContainerRef} className="h-full w-full" />
        ) : (
          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
            Missing AMap keys.
          </div>
        )}
      </div>
    </div>
  );
}
