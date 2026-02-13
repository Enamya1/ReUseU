import { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { University } from '@/lib/dummyData';
import { Plus, GraduationCap, MapPin, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import AMapLoader from '@amap/amap-jsapi-loader';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const AMAP_JS_KEY = import.meta.env.VITE_AMAP_JS_KEY ?? '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE ?? '';
const defaultCenter: [number, number] = [-98.5795, 39.8283];

type ApiUniversity = {
  id: number | string;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  location?: string | null;
  address?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  students_count?: number | string | null;
  student_count?: number | string | null;
  users_count?: number | string | null;
  dormitories_count?: number | string | null;
  dormitoriesCount?: number | string | null;
};

type UniversitiesResponse = {
  message: string;
  universities:
    | ApiUniversity[]
    | {
        current_page?: number;
        data?: ApiUniversity[];
        last_page?: number;
        per_page?: number;
        total?: number;
      };
};

type AddressSuggestion = {
  text: string;
  location: {
    lat: number;
    lng: number;
  };
};

type AMapLngLat = { lng: number; lat: number } | [number, number];

type AMapPoi = {
  name?: string;
  address?: string;
  location?: AMapLngLat;
};

type AMapGeocodeResult = {
  regeocode?: {
    formattedAddress?: string;
    pois?: AMapPoi[];
  };
};

type AMapMap = {
  setCenter: (center: [number, number]) => void;
  setZoom: (zoom: number) => void;
  on: (event: 'click', handler: (event: { lnglat: { lng: number; lat: number } }) => void) => void;
  resize: () => void;
  destroy?: () => void;
};

type AMapMarker = {
  setPosition: (position: [number, number]) => void;
  setMap: (map: AMapMap | null) => void;
};

type AMapGeocoder = {
  getAddress: (lnglat: [number, number], callback: (status: string, result: AMapGeocodeResult) => void) => void;
};

type AMapNamespace = {
  Map: new (container: HTMLDivElement, options: { zoom: number; center: [number, number]; mapStyle?: string }) => AMapMap;
  Marker: new (options: { position: [number, number]; map: AMapMap }) => AMapMarker;
  Geocoder: new (options: { radius: number; extensions: string }) => AMapGeocoder;
};

const formatLocation = (lat: number | null, lng: number | null, location?: string | null) => {
  if (location && location.trim().length > 0) {
    return location;
  }
  if (lat !== null && lng !== null) {
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  }
  return 'N/A';
};

const buildUniversity = (university: ApiUniversity): University => {
  const latValue =
    typeof university.latitude === 'number'
      ? university.latitude
      : typeof university.lat === 'number'
      ? university.lat
      : 0;
  const lngValue =
    typeof university.longitude === 'number'
      ? university.longitude
      : typeof university.lng === 'number'
      ? university.lng
      : 0;
  const name = university.name?.trim() || 'Unnamed University';
  const location = formatLocation(
    Number.isFinite(latValue) ? latValue : null,
    Number.isFinite(lngValue) ? lngValue : null,
    university.address ?? university.location ?? null,
  );
  const createdAt =
    typeof university.created_at === 'string'
      ? university.created_at.split('T')[0]
      : typeof university.createdAt === 'string'
      ? university.createdAt.split('T')[0]
      : 'N/A';
  const studentCount =
    Number(university.students_count ?? university.student_count ?? university.users_count ?? 0) || 0;
  const dormitoriesCount =
    Number(university.dormitories_count ?? university.dormitoriesCount ?? 0) || 0;
  return {
    id: String(university.id ?? name),
    name,
    location,
    studentCount,
    dormitoriesCount,
    createdAt,
    lat: Number.isFinite(latValue) ? latValue : 0,
    lng: Number.isFinite(lngValue) ? lngValue : 0,
  };
};

export default function Universities() {
  const { admin } = useAuth();
  const navigate = useNavigate();
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createStep, setCreateStep] = useState(1);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const markerRef = useRef<AMapMarker | null>(null);
  const geocoderRef = useRef<AMapGeocoder | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const [newUniversity, setNewUniversity] = useState({
    name: '',
    domain: '',
    imageUrl: '',
    latitude: '',
    longitude: '',
  });
  const ITEMS_PER_PAGE = 10;

  const selectedPosition = useMemo<[number, number] | null>(() => {
    const lat = Number(newUniversity.latitude);
    const lng = Number(newUniversity.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
    return null;
  }, [newUniversity.latitude, newUniversity.longitude]);

  useEffect(() => {
    if (!isDialogOpen) {
      setAddressSuggestions([]);
      setSelectedAddress(null);
    }
  }, [isDialogOpen]);

  useEffect(() => {
    if (!isDialogOpen || createStep !== 3 || !mapContainerRef.current || !AMAP_JS_KEY || !AMAP_SECURITY_CODE) {
      return;
    }
    const amapWindow = window as Window & { _AMapSecurityConfig?: { securityJsCode: string } };
    amapWindow._AMapSecurityConfig = { securityJsCode: AMAP_SECURITY_CODE };
    let cancelled = false;
    AMapLoader.load({ key: AMAP_JS_KEY, version: '2.0', plugins: ['AMap.Geocoder'] })
      .then((AMap: AMapNamespace) => {
        if (cancelled || !mapContainerRef.current) {
          return;
        }
        amapRef.current = AMap;
        if (!mapRef.current) {
          mapRef.current = new AMap.Map(mapContainerRef.current, {
            zoom: 4,
            center: defaultCenter,
            mapStyle: 'amap://styles/dark',
          });
          geocoderRef.current = new AMap.Geocoder({ radius: 1000, extensions: 'all' });
          mapRef.current.on('click', (event) => {
            const { lng, lat } = event.lnglat;
            setNewUniversity((prev) => ({
              ...prev,
              latitude: lat.toFixed(6),
              longitude: lng.toFixed(6),
            }));
            setSelectedAddress(null);
            if (geocoderRef.current) {
              geocoderRef.current.getAddress([lng, lat], (status, result) => {
                if (status !== 'complete' || !result?.regeocode) {
                  setAddressSuggestions([]);
                  return;
                }
                const suggestions: AddressSuggestion[] = [];
                const formatted = result.regeocode.formattedAddress;
                if (formatted) {
                  suggestions.push({ text: formatted, location: { lat, lng } });
                  setSelectedAddress(formatted);
                }
                if (Array.isArray(result.regeocode.pois)) {
                  result.regeocode.pois.forEach((poi) => {
                    const location = poi.location;
                    if (!location) {
                      return;
                    }
                    const coords = Array.isArray(location)
                      ? { lng: location[0], lat: location[1] }
                      : { lng: location.lng, lat: location.lat };
                    if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
                      return;
                    }
                    const poiText = `${poi.name ?? ''}${poi.address ? ` · ${poi.address}` : ''}`.trim();
                    suggestions.push({
                      text: poiText || 'Unknown location',
                      location: { lat: coords.lat, lng: coords.lng },
                    });
                  });
                }
                setAddressSuggestions(suggestions);
              });
            }
          });
        } else {
          mapRef.current.resize();
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
      if (mapRef.current?.destroy) {
        mapRef.current.destroy();
      }
      mapRef.current = null;
      markerRef.current = null;
      geocoderRef.current = null;
      amapRef.current = null;
    };
  }, [isDialogOpen, createStep]);

  useEffect(() => {
    if (!mapRef.current || !amapRef.current) {
      return;
    }
    const position: [number, number] | null = selectedPosition ? [selectedPosition[1], selectedPosition[0]] : null;
    if (position) {
      mapRef.current.setCenter(position);
      mapRef.current.setZoom(13);
      if (!markerRef.current) {
        markerRef.current = new amapRef.current.Marker({ position, map: mapRef.current });
      } else {
        markerRef.current.setPosition(position);
        markerRef.current.setMap(mapRef.current);
      }
    } else {
      mapRef.current.setCenter(defaultCenter);
      mapRef.current.setZoom(4);
      if (markerRef.current) {
        markerRef.current.setMap(null);
        markerRef.current = null;
      }
    }
  }, [selectedPosition]);

  useEffect(() => {
    if (!admin) {
      setUniversities([]);
      setTotalPages(1);
      setTotalCount(0);
      return;
    }
    let ignore = false;
    const fetchUniversities = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/universities?per_page=${ITEMS_PER_PAGE}&page=${currentPage}`,
          {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
          },
        );
        const data: UniversitiesResponse | undefined = await response.json().catch(() => undefined);
        const universitiesPayload = data?.universities;
        const pagedData = Array.isArray(universitiesPayload)
          ? universitiesPayload
          : universitiesPayload?.data ?? [];
        if (!response.ok || !universitiesPayload) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : response.status === 422
              ? 'Validation Error'
              : 'Failed to load universities';
          if (!ignore) {
            setError(message);
            setUniversities([]);
          }
          return;
        }
        const mapped = pagedData.map(buildUniversity);
        const lastPageValue = Array.isArray(universitiesPayload)
          ? 1
          : Math.max(1, Number(universitiesPayload?.last_page ?? 1));
        const totalValue = Array.isArray(universitiesPayload)
          ? mapped.length
          : Number(universitiesPayload?.total ?? mapped.length);
        if (!ignore) {
          setUniversities(mapped);
          setTotalPages(lastPageValue);
          setTotalCount(totalValue);
          if (currentPage > lastPageValue) {
            setCurrentPage(lastPageValue);
          }
        }
      } catch {
        if (!ignore) {
          setError('Failed to load universities');
          setUniversities([]);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    fetchUniversities();
    return () => {
      ignore = true;
    };
  }, [admin, currentPage]);

  const columns = [
    {
      header: 'University',
      accessorKey: (row: University) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {row.location}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Students',
      accessorKey: (row: University) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{row.studentCount.toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'Dormitories',
      accessorKey: (row: University) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span>{row.dormitoriesCount}</span>
        </div>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'createdAt' as keyof University,
    },
  ];

  const handleCreate = async () => {
    if (!newUniversity.name.trim() || !newUniversity.domain.trim()) {
      toast.error('Please fill in required fields');
      return;
    }
    if (!admin) {
      toast.error('You must be logged in to create a university');
      return;
    }
    const latitudeValue = newUniversity.latitude.trim();
    const longitudeValue = newUniversity.longitude.trim();
    const latitude = latitudeValue ? Number(latitudeValue) : null;
    const longitude = longitudeValue ? Number(longitudeValue) : null;
    if (latitudeValue && (Number.isNaN(latitude) || latitude < -90 || latitude > 90)) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }
    if (longitudeValue && (Number.isNaN(longitude) || longitude < -180 || longitude > 180)) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }
    setIsSubmitting(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/set_university`, {
        method: 'POST',
        headers: {
          Authorization: `${admin.tokenType} ${admin.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newUniversity.name.trim(),
          domain: newUniversity.domain.trim(),
          latitude,
          longitude,
          address: selectedAddress?.trim() || null,
          pic: newUniversity.imageUrl.trim() || null,
        }),
      });
      const data = await response.json().catch(() => undefined);
      if (!response.ok) {
        if (response.status === 422 && data?.errors) {
          const errorMessages = Object.values(data.errors)
            .flat()
            .filter((item) => typeof item === 'string');
          if (errorMessages.length > 0) {
            toast.error(errorMessages.join(', '));
            return;
          }
        }
        const message =
          data && typeof data.message === 'string' ? data.message : 'Failed to create university';
        toast.error(message);
        return;
      }
      const createdUniversity = data?.university;
      const createdLat =
        typeof createdUniversity?.latitude === 'number' ? createdUniversity.latitude : latitude ?? 0;
      const createdLng =
        typeof createdUniversity?.longitude === 'number' ? createdUniversity.longitude : longitude ?? 0;
      const createdAt =
        typeof createdUniversity?.created_at === 'string'
          ? createdUniversity.created_at.split('T')[0]
          : new Date().toISOString().split('T')[0];
      const location =
        typeof createdUniversity?.address === 'string' && createdUniversity.address.trim()
          ? createdUniversity.address.trim()
          : selectedAddress?.trim()
          ? selectedAddress.trim()
          : latitude !== null && longitude !== null
          ? `${latitude.toFixed(5)}, ${longitude.toFixed(5)}`
          : 'N/A';
      const university: University = {
        id: createdUniversity?.id ? String(createdUniversity.id) : String(universities.length + 1),
        name: createdUniversity?.name ?? newUniversity.name.trim(),
        location,
        studentCount: 0,
        dormitoriesCount: 0,
        createdAt,
        lat: createdLat,
        lng: createdLng,
      };
      setUniversities((prev) => [university, ...prev]);
      setNewUniversity({
        name: '',
        domain: '',
        imageUrl: '',
        latitude: '',
        longitude: '',
      });
      setSelectedAddress(null);
      setImageFile(null);
      setCreateStep(1);
      setIsDialogOpen(false);
      toast.success('University created successfully');
    } catch {
      toast.error('Failed to create university');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleNextStep = () => {
    if (createStep === 1) {
      if (!newUniversity.name.trim() || !newUniversity.domain.trim()) {
        toast.error('Please fill in required fields');
        return;
      }
    }
    setCreateStep((step) => Math.min(step + 1, 3));
  };

  const handlePreviousStep = () => {
    setCreateStep((step) => Math.max(step - 1, 1));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Universities</h1>
            <p className="text-muted-foreground">Manage universities on the platform</p>
          </div>
          <Dialog
            open={isDialogOpen}
            onOpenChange={(open) => {
              setIsDialogOpen(open);
              if (open) {
                setCreateStep(1);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add University
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border w-[92vw] max-w-4xl max-h-[85vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create University</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new university to the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <div className="text-xs text-muted-foreground">Step {createStep} of 3</div>
                  <div className="flex items-center gap-2">
                    <span
                      className={
                        createStep >= 1
                          ? 'h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20'
                          : 'h-2.5 w-2.5 rounded-full bg-muted'
                      }
                    />
                    <span className={createStep >= 2 ? 'h-0.5 flex-1 bg-primary' : 'h-0.5 flex-1 bg-muted'} />
                    <span
                      className={
                        createStep >= 2
                          ? 'h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20'
                          : 'h-2.5 w-2.5 rounded-full bg-muted'
                      }
                    />
                    <span className={createStep >= 3 ? 'h-0.5 flex-1 bg-primary' : 'h-0.5 flex-1 bg-muted'} />
                    <span
                      className={
                        createStep >= 3
                          ? 'h-2.5 w-2.5 rounded-full bg-primary ring-4 ring-primary/20'
                          : 'h-2.5 w-2.5 rounded-full bg-muted'
                      }
                    />
                  </div>
                </div>
                {createStep === 1 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">University Name</Label>
                      <Input
                        id="name"
                        placeholder="e.g., MIT"
                        value={newUniversity.name}
                        onChange={(e) => setNewUniversity({ ...newUniversity, name: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="domain">University Domain</Label>
                      <Input
                        id="domain"
                        placeholder="e.g., mit.edu"
                        value={newUniversity.domain}
                        onChange={(e) => setNewUniversity({ ...newUniversity, domain: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                  </div>
                )}
                {createStep === 2 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="imageUrl">Image URL</Label>
                      <Input
                        id="imageUrl"
                        placeholder="https://example.com/university.jpg"
                        value={newUniversity.imageUrl}
                        onChange={(e) => setNewUniversity({ ...newUniversity, imageUrl: e.target.value })}
                        className="bg-secondary/50"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="imageFile">Upload Image</Label>
                      <Input
                        id="imageFile"
                        type="file"
                        accept="image/*"
                        onChange={(e) => setImageFile(e.target.files?.[0] ?? null)}
                        className="bg-secondary/50"
                      />
                      {imageFile ? (
                        <p className="text-xs text-muted-foreground">{imageFile.name}</p>
                      ) : (
                        <p className="text-xs text-muted-foreground">No image selected</p>
                      )}
                    </div>
                  </div>
                )}
                {createStep === 3 && (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Map</Label>
                      <div className="flex items-center justify-between gap-3">
                        <Button
                          type="button"
                          variant="outline"
                          className={
                            selectedPosition
                              ? 'border-primary bg-primary text-primary-foreground'
                              : 'border-muted-foreground/40 text-muted-foreground'
                          }
                        >
                          {selectedPosition ? 'Location selected' : 'Select a location'}
                        </Button>
                        {selectedPosition ? (
                          <span className="text-xs text-muted-foreground">
                            {selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">No location selected</span>
                        )}
                      </div>
                      <div className="h-[320px] rounded-lg overflow-hidden border border-border">
                        {AMAP_JS_KEY && AMAP_SECURITY_CODE ? (
                          <div ref={mapContainerRef} className="h-full w-full" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Missing AMap keys.
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="rounded-lg border border-border bg-secondary/30 p-3">
                      <p className="text-xs font-medium text-foreground">Suggested address</p>
                      {addressSuggestions.length === 0 ? (
                        <p className="text-xs text-muted-foreground">
                          {selectedPosition
                            ? 'No address suggestions found for this location.'
                            : 'Click on the map to generate address suggestions.'}
                        </p>
                      ) : (
                        <div className="mt-2 space-y-2">
                          {addressSuggestions.map((item, index) => (
                            <button
                              key={`${item.text}-${index}`}
                              type="button"
                              onClick={() => {
                                setSelectedAddress(item.text);
                                setNewUniversity((prev) => ({
                                  ...prev,
                                  latitude: item.location.lat.toFixed(6),
                                  longitude: item.location.lng.toFixed(6),
                                }));
                              }}
                              className={
                                selectedAddress === item.text
                                  ? 'w-full rounded-md border border-primary bg-primary/10 px-3 py-2 text-left text-xs text-foreground'
                                  : 'w-full rounded-md border border-border bg-background/40 px-3 py-2 text-left text-xs text-muted-foreground'
                              }
                            >
                              {item.text}
                            </button>
                          ))}
                        </div>
                      )}
                      {selectedPosition && (
                        <p className="mt-2 text-xs text-muted-foreground">
                          Selected coordinates: {selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <DialogFooter className="gap-2 sm:justify-between">
                <div className="flex items-center gap-2">
                  <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  {createStep > 1 && (
                    <Button variant="outline" onClick={handlePreviousStep}>
                      Back
                    </Button>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {createStep < 3 ? (
                    <Button onClick={handleNextStep} className="gradient-primary text-primary-foreground">
                      Next
                    </Button>
                  ) : (
                    <Button
                      onClick={handleCreate}
                      className="gradient-primary text-primary-foreground"
                      disabled={isSubmitting}
                    >
                      {isSubmitting ? 'Creating...' : 'Create'}
                    </Button>
                  )}
                </div>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {loading ? (
            Array.from({ length: 3 }, (_, index) => (
              <div key={`universities-stat-skeleton-${index}`} className="bg-card rounded-xl border border-border p-4">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="mt-3 h-7 w-20" />
              </div>
            ))
          ) : (
            <>
            <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Universities</p>
              <p className="text-2xl font-bold text-foreground">{totalCount}</p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Students</p>
                <p className="text-2xl font-bold text-foreground">
                  {universities.reduce((acc, u) => acc + u.studentCount, 0).toLocaleString()}
                </p>
              </div>
              <div className="bg-card rounded-xl border border-border p-4">
                <p className="text-sm text-muted-foreground">Total Dormitories</p>
                <p className="text-2xl font-bold text-foreground">
                  {universities.reduce((acc, u) => acc + u.dormitoriesCount, 0)}
                </p>
              </div>
            </>
          )}
        </div>

        {/* Table */}
        {error && (
          <div className="text-sm text-destructive">{error}</div>
        )}
        {loading ? (
          <div className="rounded-lg border border-border bg-card">
            <div className="border-b border-border px-4 py-3">
              <Skeleton className="h-4 w-48" />
            </div>
            <div className="divide-y divide-border">
              {Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
                <div key={`universities-row-skeleton-${index}`} className="flex items-center justify-between gap-4 px-4 py-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-40" />
                      <Skeleton className="h-3 w-32" />
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-6">
                    <Skeleton className="h-5 w-16" />
                    <Skeleton className="h-5 w-20" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <DataTable
            columns={columns}
            data={universities}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={(page) => {
              if (page < 1 || page > totalPages) {
                return;
              }
              setCurrentPage(page);
            }}
            onRowClick={(row) => navigate(`/university/${row.id}`)}
          />
        )}
      </div>
    </DashboardLayout>
  );
}
