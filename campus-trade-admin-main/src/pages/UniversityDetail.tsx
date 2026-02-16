import { useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { universities } from '@/lib/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { ArrowLeft, Building2, ChevronLeft, ChevronRight, Globe, GraduationCap, Mail, MapPin, Phone, ShoppingBag, Users } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import AMapLoader from '@amap/amap-jsapi-loader';
import { toast } from 'sonner';
const AMAP_JS_KEY = import.meta.env.VITE_AMAP_JS_KEY ?? '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE ?? '';
const defaultCenter: [number, number] = [104.1954, 35.8617];

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
  getAddress: (lnglat: [number, number], callback: (status: string, result: { regeocode?: { formattedAddress?: string; pois?: Array<{ name?: string; address?: string; location?: { lng: number; lat: number } | [number, number] }> } }) => void) => void;
};

type AMapNamespace = {
  Map: new (container: HTMLDivElement, options: { zoom: number; center: [number, number]; mapStyle?: string }) => AMapMap;
  Marker: new (options: { position: [number, number]; map: AMapMap }) => AMapMarker;
  Geocoder: new (options: { radius: number; extensions: string }) => AMapGeocoder;
};

type UniversityProfile = {
  id: string;
  name: string;
  domain: string;
  address: string;
  latitude: string;
  longitude: string;
  website: string;
  contactEmail: string;
  contactPhone: string;
  description: string;
  createdAt: string;
  status: 'active' | 'inactive';
};

type UniversityMedia = {
  id: string;
  url: string;
  label: string;
};

type UniversityAdmin = {
  id: string;
  name: string;
  role: string;
  email: string;
  status: 'active' | 'pending';
};

type UniversityListing = {
  id: string;
  title: string;
  price?: string;
  status?: 'active' | 'pending' | 'sold';
  seller: string;
  createdAt: string;
};

export default function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const baseUniversity = universities.find((item) => item.id === id);
  const [profile, setProfile] = useState<UniversityProfile>({
    id: id ?? 'new-university',
    name: baseUniversity?.name ?? 'Summit Valley University',
    domain: 'svu.edu',
    address: baseUniversity?.location ?? '850 Campus Drive, Downtown District',
    latitude: '39.910000',
    longitude: '116.404000',
    website: 'https://svu.edu',
    contactEmail: 'admin@svu.edu',
    contactPhone: '+1 (415) 555-0182',
    description:
      'A modern campus focused on entrepreneurship, digital commerce, and student-led resale initiatives.',
    createdAt: baseUniversity?.createdAt ?? '2026-02-01',
    status: 'active',
  });

  const [mediaItems, setMediaItems] = useState<UniversityMedia[]>([
    { id: 'media-1', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80', label: 'Campus' },
    { id: 'media-2', url: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=900&q=80', label: 'Campus' },
    { id: 'media-3', url: 'https://images.unsplash.com/photo-1462536943532-57a629f6cc60?auto=format&fit=crop&w=900&q=80', label: 'Campus' },
    { id: 'media-4', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', label: 'Campus' },
  ]);
  const [activeMediaIndex, setActiveMediaIndex] = useState(0);
  const mediaCount = mediaItems.length;

  useEffect(() => {
    if (mediaCount === 0) {
      return;
    }

    const interval = window.setInterval(() => {
      setActiveMediaIndex((prev) => (prev + 1) % mediaCount);
    }, 5000);

    return () => {
      window.clearInterval(interval);
    };
  }, [mediaCount]);

  const handlePrevMedia = () => {
    if (mediaCount === 0) {
      return;
    }

    setActiveMediaIndex((prev) => (prev - 1 + mediaCount) % mediaCount);
  };

  const handleNextMedia = () => {
    if (mediaCount === 0) {
      return;
    }

    setActiveMediaIndex((prev) => (prev + 1) % mediaCount);
  };

  const [admins, setAdmins] = useState<UniversityAdmin[]>([]);

  const [listings, setListings] = useState<UniversityListing[]>([
    { id: 'list-1', title: 'Engineering Textbooks Bundle', seller: 'A. Kim', createdAt: '2026-02-10' },
    { id: 'list-2', title: 'Dorm Mini Fridge', seller: 'J. Park', createdAt: '2026-02-11' },
    { id: 'list-3', title: 'Studio Headphones', seller: 'R. Gomez', createdAt: '2026-02-08' },
  ]);
  const [usersCount, setUsersCount] = useState<number>(0);
  const [dormitoriesCount, setDormitoriesCount] = useState<number>(0);
  const [listingsTotal, setListingsTotal] = useState<number>(0);
  const [categoriesTotal, setCategoriesTotal] = useState<number>(0);
  const [categoryChartData, setCategoryChartData] = useState<{ name: string; count: number }[]>([
    { name: 'Electronics', count: 42 },
    { name: 'Books', count: 28 },
    { name: 'Dorm', count: 18 },
    { name: 'Apparel', count: 24 },
    { name: 'Sports', count: 12 },
  ]);
  const [averageOrderValue, setAverageOrderValue] = useState<number>(0);
  const [averageDailyUploads, setAverageDailyUploads] = useState<number>(0);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteChoice, setDeleteChoice] = useState<string>('');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<
    { text: string; location: { lat: number; lng: number } }[]
  >([]);
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const SUGGESTIONS_PER_PAGE = 6;
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const markerRef = useRef<AMapMarker | null>(null);
  const geocoderRef = useRef<AMapGeocoder | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchAdmins = async () => {
      if (!admin) {
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/admins`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data: {
          message?: string;
          admins?: Array<{ id: number | string; full_name?: string | null; email?: string | null; status?: string | null; role?: string | null }>;
        } | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.admins) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : 'Failed to load admins';
          toast.error(message);
          return;
        }
        const mapped = data.admins.map((a, idx) => {
          const statusText = String(a.status ?? '').toLowerCase();
          const normalizedStatus: 'active' | 'pending' = statusText === 'active' ? 'active' : 'pending';
          const name = (a.full_name ?? '').trim();
          const email = (a.email ?? '').trim();
          return {
            id: String(a.id ?? idx),
            name: name || email || 'Admin',
            role: (a.role ?? 'admin').toString().toLowerCase() === 'admin' ? 'Admin' : 'Moderator',
            email: email || 'N/A',
            status: normalizedStatus,
          } as UniversityAdmin;
        });
        if (!ignore) {
          setAdmins(mapped);
        }
      } catch {
        toast.error('Failed to load admins');
      }
    };
    fetchAdmins();
    return () => {
      ignore = true;
    };
  }, [admin]);

  useEffect(() => {
    if (!admin || !id) {
      return;
    }
    let ignore = false;
    const fetchUniversity = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/universities/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data: {
          message?: string;
          university?: {
            id: number | string;
            name?: string | null;
            domain?: string | null;
            website?: string | null;
            latitude?: number | null;
            longitude?: number | null;
            address?: string | null;
            pic?: string[] | null;
            contact_email?: string | null;
            contact_phone?: string | null;
            description?: string | null;
            created_at?: string | null;
            dormitories_count?: number | string | null;
            users_count?: number | string | null;
            listings_total?: number | string | null;
            recent_listings?: Array<{ id: number | string; title?: string | null; seller_name?: string | null; date?: string | null }>;
            categories_total?: number | string | null;
            categories?: Array<{ id: number | string; name?: string | null; product_count?: number | string | null }>;
            average_order_value?: number | string | null;
            average_daily_uploads?: number | string | null;
          };
        } | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.university) {
          return;
        }
        const uni = data.university;
        if (!ignore) {
          setProfile((prev) => ({
            ...prev,
            id: String(uni.id ?? prev.id),
            name: uni.name?.trim() || prev.name,
            domain: uni.domain?.trim() || prev.domain,
            address: uni.address?.trim() || prev.address,
            latitude: typeof uni.latitude === 'number' ? uni.latitude.toFixed(6) : prev.latitude,
            longitude: typeof uni.longitude === 'number' ? uni.longitude.toFixed(6) : prev.longitude,
            website: typeof uni.website === 'string' && uni.website?.trim() ? uni.website.trim() : prev.website,
            contactEmail: uni.contact_email?.trim() || prev.contactEmail,
            contactPhone: uni.contact_phone?.trim() || prev.contactPhone,
            description: uni.description?.trim() || prev.description,
            createdAt:
              typeof uni.created_at === 'string' && uni.created_at ? uni.created_at : prev.createdAt,
            status: prev.status,
          }));
          const pics = Array.isArray(uni.pic) ? uni.pic.filter((u) => typeof u === 'string' && u.trim().length > 0) : [];
          if (pics.length > 0) {
            setMediaItems(pics.map((url, idx) => ({ id: `api-pic-${idx}`, url, label: 'Campus' })));
            setActiveMediaIndex(0);
          }
          setUsersCount(Number(uni.users_count ?? 0) || 0);
          setDormitoriesCount(Number(uni.dormitories_count ?? 0) || 0);
          setListingsTotal(Number(uni.listings_total ?? 0) || 0);
          const recent = Array.isArray(uni.recent_listings) ? uni.recent_listings : [];
          setListings(
            recent.map((item) => ({
              id: String(item.id),
              title: item.title ?? 'Untitled',
              seller: item.seller_name ?? 'N/A',
              createdAt: item.date ?? '',
            })),
          );
          const categories = Array.isArray(uni.categories) ? uni.categories : [];
          const mappedCategories =
            categories.length > 0
              ? categories
                  .filter((c) => typeof c?.name === 'string' && c.name?.trim())
                  .map((c) => ({
                    name: c.name!.trim(),
                    count: Number(c.product_count ?? 0) || 0,
                  }))
              : null;
          if (mappedCategories) {
            setCategoryChartData(mappedCategories);
          }
          setCategoriesTotal(Number(uni.categories_total ?? mappedCategories?.length ?? 0) || 0);
          setAverageOrderValue(Number(uni.average_order_value ?? 0) || 0);
          setAverageDailyUploads(Number(uni.average_daily_uploads ?? 0) || 0);
        }
      } catch {
        // silently ignore; keep fallback UI
      }
    };
    fetchUniversity();
    return () => {
      ignore = true;
    };
  }, [admin, id]);

  useEffect(() => {
    if (!isLocationPickerOpen) {
      return;
    }
    const lat = Number(profile.latitude);
    const lng = Number(profile.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      setSelectedPosition([lat, lng]);
    } else {
      setSelectedPosition(null);
    }
    setSelectedAddress(null);
    setSuggestionsPage(1);
  }, [isLocationPickerOpen, profile.latitude, profile.longitude]);

  useEffect(() => {
    if (!isLocationPickerOpen || !mapContainerRef.current || !AMAP_JS_KEY || !AMAP_SECURITY_CODE) {
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
          const center: [number, number] = selectedPosition
            ? [selectedPosition[1], selectedPosition[0]]
            : defaultCenter;
          mapRef.current = new AMap.Map(mapContainerRef.current, {
            zoom: selectedPosition ? 12 : 4,
            center,
            mapStyle: 'amap://styles/dark',
          });
          geocoderRef.current = new AMap.Geocoder({ radius: 1000, extensions: 'all' });
          mapRef.current.on('click', (event) => {
            const { lng, lat } = event.lnglat;
            setSelectedPosition([lat, lng]);
            setSelectedAddress(null);
            if (geocoderRef.current) {
              geocoderRef.current.getAddress([lng, lat], (status, result) => {
                if (status !== 'complete' || !result?.regeocode) {
                  setAddressSuggestions([]);
                  return;
                }
                const suggestions: { text: string; location: { lat: number; lng: number } }[] = [];
                const formatted = result.regeocode.formattedAddress;
                if (formatted) {
                  suggestions.push({ text: formatted, location: { lat, lng } });
                  setSelectedAddress(formatted);
                }
                const pois = result.regeocode.pois ?? [];
                pois.forEach((poi) => {
                  const loc = poi.location;
                  if (!loc) {
                    return;
                  }
                  const coords = Array.isArray(loc) ? { lng: loc[0], lat: loc[1] } : { lng: loc.lng, lat: loc.lat };
                  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) {
                    return;
                  }
                  const poiText = `${poi.name ?? ''}${poi.address ? ` · ${poi.address}` : ''}`.trim();
                  suggestions.push({
                    text: poiText || 'Unknown location',
                    location: { lat: coords.lat, lng: coords.lng },
                  });
                });
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
  }, [isLocationPickerOpen, selectedPosition]);

  const totalSuggestionPages = useMemo(
    () => Math.max(1, Math.ceil(addressSuggestions.length / SUGGESTIONS_PER_PAGE)),
    [addressSuggestions.length],
  );
  const pagedSuggestions = useMemo(
    () =>
      addressSuggestions.slice(
        (suggestionsPage - 1) * SUGGESTIONS_PER_PAGE,
        suggestionsPage * SUGGESTIONS_PER_PAGE,
      ),
    [addressSuggestions, suggestionsPage],
  );

  useEffect(() => {
    if (!isLocationPickerOpen || !mapRef.current || !amapRef.current) {
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
  }, [isLocationPickerOpen, selectedPosition]);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/universities')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                <Badge variant={profile.status === 'active' ? 'default' : 'secondary'}>
                  {profile.status === 'active' ? 'Active' : 'Inactive'}
                </Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{profile.address}</span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
              <Button
                variant="destructive"
                onClick={() => setIsDeleteDialogOpen(true)}
                disabled={isDeleting}
              >
                {isDeleting ? 'Deleting...' : 'Delete University'}
              </Button>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Delete University</DialogTitle>
                </DialogHeader>
                <div className="space-y-3">
                  <Label>Confirm action</Label>
                  <RadioGroup value={deleteChoice} onValueChange={setDeleteChoice} className="gap-3">
                    <div className="flex items-center gap-2">
                      <RadioGroupItem value="confirm" id="delete-confirm" />
                      <Label htmlFor="delete-confirm">Yes, delete this university</Label>
                    </div>
                  </RadioGroup>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                    Cancel
                  </Button>
                  <Button
                    variant="destructive"
                    onClick={async () => {
                      if (!admin || !id) {
                        return;
                      }
                      if (deleteChoice !== 'confirm') {
                        toast.error('Please confirm deletion');
                        return;
                      }
                      setIsDeleting(true);
                      try {
                        const response = await fetch(`${API_BASE_URL}/api/admin/universities/${id}`, {
                          method: 'DELETE',
                          headers: {
                            Authorization: `${admin.tokenType} ${admin.token}`,
                            Accept: 'application/json',
                          },
                        });
                        const data: { message?: string; deleted_id?: number | string } | undefined = await response.json().catch(() => undefined);
                        if (!response.ok) {
                          const message =
                            data && typeof data.message === 'string'
                              ? data.message
                              : response.status === 403
                              ? 'Unauthorized: Only administrators can access this endpoint.'
                              : response.status === 404
                              ? 'University not found.'
                              : response.status === 409
                              ? 'Cannot delete university with existing dormitories.'
                              : 'Failed to delete university';
                          toast.error(message);
                          return;
                        }
                        toast.success('University deleted successfully');
                        setIsDeleteDialogOpen(false);
                        navigate('/universities');
                      } catch {
                        toast.error('Failed to delete university');
                      } finally {
                        setIsDeleting(false);
                        setDeleteChoice('');
                      }
                    }}
                    disabled={isDeleting}
                  >
                    Delete
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
            <Button
              onClick={async () => {
                if (!admin || !id) {
                  return;
                }
                const name = profile.name.trim();
                const domain = profile.domain.trim();
                const website = profile.website.trim();
                const contact_email = profile.contactEmail.trim();
                const contact_phone = profile.contactPhone.trim();
                const description = profile.description.trim();
                const address = selectedAddress?.trim() || profile.address.trim() || null;
                const latFromPicker = selectedPosition ? selectedPosition[0] : null;
                const lngFromPicker = selectedPosition ? selectedPosition[1] : null;
                const latParsed = profile.latitude.trim()
                  ? Number(profile.latitude.trim())
                  : null;
                const lngParsed = profile.longitude.trim()
                  ? Number(profile.longitude.trim())
                  : null;
                const latitude =
                  latFromPicker !== null
                    ? latFromPicker
                    : latParsed !== null && Number.isFinite(latParsed)
                    ? latParsed
                    : null;
                const longitude =
                  lngFromPicker !== null
                    ? lngFromPicker
                    : lngParsed !== null && Number.isFinite(lngParsed)
                    ? lngParsed
                    : null;
                if (latitude !== null && (latitude < -90 || latitude > 90)) {
                  toast.error('Latitude must be between -90 and 90');
                  return;
                }
                if (longitude !== null && (longitude < -180 || longitude > 180)) {
                  toast.error('Longitude must be between -180 and 180');
                  return;
                }
                const picCandidates = mediaItems
                  .filter((m) => typeof m.url === 'string' && m.url.trim().length > 0 && m.id.startsWith('api-pic-'))
                  .map((m) => m.url.trim());
                const body = {
                  name: name || undefined,
                  domain: domain || undefined,
                  website: website ? website : null,
                  latitude,
                  longitude,
                  address,
                  pic: picCandidates.length > 0 ? picCandidates : null,
                  contact_email: contact_email ? contact_email : null,
                  contact_phone: contact_phone ? contact_phone : null,
                  description: description ? description : null,
                };
                setIsSaving(true);
                try {
                  const response = await fetch(`${API_BASE_URL}/api/admin/universities/${id}`, {
                    method: 'PATCH',
                    headers: {
                      Authorization: `${admin.tokenType} ${admin.token}`,
                      Accept: 'application/json',
                      'Content-Type': 'application/json',
                    },
                    body: JSON.stringify(body),
                  });
                  const data: {
                    message?: string;
                    university?: {
                      id?: number | string;
                      name?: string | null;
                      domain?: string | null;
                      website?: string | null;
                      latitude?: number | null;
                      longitude?: number | null;
                      address?: string | null;
                      pic?: string[] | null;
                      contact_email?: string | null;
                      contact_phone?: string | null;
                      description?: string | null;
                      created_at?: string | null;
                      dormitories_count?: number | string | null;
                      users_count?: number | string | null;
                      listings_total?: number | string | null;
                      categories_total?: number | string | null;
                      average_order_value?: number | string | null;
                      average_daily_uploads?: number | string | null;
                    };
                    errors?: Record<string, unknown>;
                  } | undefined = await response.json().catch(() => undefined);
                  if (!response.ok || !data?.university) {
                    if (response.status === 422 && data?.errors) {
                      const messages = Object.values(data.errors)
                        .flat()
                        .filter((v) => typeof v === 'string') as string[];
                      if (messages.length > 0) {
                        toast.error(messages.join(', '));
                        return;
                      }
                    }
                    const message =
                      data && typeof data.message === 'string'
                        ? data.message
                        : response.status === 403
                        ? 'Unauthorized: Only administrators can access this endpoint.'
                        : response.status === 404
                        ? 'University not found.'
                        : 'Failed to update university';
                    toast.error(message);
                    return;
                  }
                  const uni = data.university;
                  setProfile((prev) => ({
                    ...prev,
                    name: uni.name?.trim() || prev.name,
                    domain: uni.domain?.trim() || prev.domain,
                    address: uni.address?.trim() || prev.address,
                    latitude:
                      typeof uni.latitude === 'number'
                        ? uni.latitude.toFixed(6)
                        : prev.latitude,
                    longitude:
                      typeof uni.longitude === 'number'
                        ? uni.longitude.toFixed(6)
                        : prev.longitude,
                    website:
                      typeof uni.website === 'string' && uni.website?.trim()
                        ? uni.website.trim()
                        : prev.website,
                    contactEmail: uni.contact_email?.trim() || prev.contactEmail,
                    contactPhone: uni.contact_phone?.trim() || prev.contactPhone,
                    description: uni.description?.trim() || prev.description,
                    createdAt:
                      typeof uni.created_at === 'string' && uni.created_at
                        ? uni.created_at
                        : prev.createdAt,
                  }));
                  const pics = Array.isArray(uni.pic)
                    ? uni.pic.filter((u) => typeof u === 'string' && u.trim().length > 0)
                    : [];
                  if (pics.length > 0) {
                    setMediaItems(pics.map((url, idx) => ({ id: `api-pic-${idx}`, url, label: 'Campus' })));
                    setActiveMediaIndex(0);
                  }
                  setUsersCount(Number(uni.users_count ?? usersCount) || usersCount);
                  setDormitoriesCount(Number(uni.dormitories_count ?? dormitoriesCount) || dormitoriesCount);
                  setListingsTotal(Number(uni.listings_total ?? listingsTotal) || listingsTotal);
                  setCategoriesTotal(Number(uni.categories_total ?? categoriesTotal) || categoriesTotal);
                  setAverageOrderValue(Number(uni.average_order_value ?? averageOrderValue) || averageOrderValue);
                  setAverageDailyUploads(Number(uni.average_daily_uploads ?? averageDailyUploads) || averageDailyUploads);
                  toast.success('University updated successfully');
                } catch {
                  toast.error('Failed to update university');
                } finally {
                  setIsSaving(false);
                }
              }}
              disabled={isSaving}
              className="gradient-primary text-primary-foreground"
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-border bg-card">
          <div className="relative h-56 w-full sm:h-64 lg:h-72">
            <div
              className="flex h-full transition-transform duration-700 ease-in-out"
              style={{ transform: `translateX(-${activeMediaIndex * 100}%)` }}
            >
              {mediaItems.map((item) => (
                <div key={item.id} className="h-full w-full shrink-0">
                  <img src={item.url} alt={item.label} className="h-full w-full object-cover" />
                </div>
              ))}
            </div>
            <div className="absolute inset-x-0 bottom-4 flex items-center justify-between px-4">
              <Button variant="secondary" size="icon" onClick={handlePrevMedia}>
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <Button variant="secondary" size="icon" onClick={handleNextMedia}>
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-4 py-3 text-sm text-muted-foreground">
            <span>{mediaItems[activeMediaIndex]?.label ?? 'Campus'}</span>
            <span>
              {activeMediaIndex + 1} / {mediaCount}
            </span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <StatCard
            title="Active Users"
            value={usersCount.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
            onClick={() => {
              if (usersCount === 0) {
                toast.info('This university has no users at the moment');
                return;
              }
              navigate(`/users?university=${encodeURIComponent(profile.name)}`);
            }}
          />
          <StatCard title="Live Listings" value={listingsTotal.toLocaleString()} icon={<ShoppingBag className="w-6 h-6" />} />
          <StatCard title="Dormitories" value={dormitoriesCount.toLocaleString()} icon={<Building2 className="w-6 h-6" />} />
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-[1.1fr_0.9fr] gap-6">
          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">University Overview</h3>
                <Badge variant="outline">Marketplace Partner</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{profile.description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Domain</p>
                  <p className="text-foreground">{profile.domain}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Added to Platform</p>
                  <p className="text-foreground">{profile.createdAt}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Website</p>
                  <div className="flex items-center gap-2 text-primary">
                    <Globe className="w-4 h-4" />
                    <span>{profile.website}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
                  <p className="text-foreground">{profile.address}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Listings</h3>
              <div className="space-y-3">
                {listings.map((listing) => (
                  <div key={listing.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-border bg-secondary/30 px-4 py-3">
                    <div>
                      <p className="font-medium text-foreground">{listing.title}</p>
                      <p className="text-xs text-muted-foreground">
                        {listing.seller} · {listing.createdAt}
                      </p>
                    </div>
                    {listing.price || listing.status ? (
                      <div className="flex items-center gap-3">
                        {listing.price ? <span className="text-sm text-foreground">{listing.price}</span> : null}
                        {listing.status ? (
                          <Badge
                            variant={
                              listing.status === 'active'
                                ? 'default'
                                : listing.status === 'pending'
                                ? 'secondary'
                                : 'outline'
                            }
                          >
                            {listing.status}
                          </Badge>
                        ) : null}
                      </div>
                    ) : null}
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Category Uploads</h3>
                <span className="text-xs text-muted-foreground">Listings by category</span>
              </div>
              <div className="h-[240px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: 'hsl(222 47% 8%)',
                        border: '1px solid hsl(222 30% 18%)',
                        borderRadius: '8px',
                        color: 'hsl(210 40% 98%)',
                      }}
                    />
                    <Bar dataKey="count" fill="hsl(174 72% 50%)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <div className="space-y-6">
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Update University</h3>
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="university-name">University Name</Label>
                  <Input
                    id="university-name"
                    value={profile.name}
                    onChange={(event) => setProfile((prev) => ({ ...prev, name: event.target.value }))}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university-domain">Domain</Label>
                  <Input
                    id="university-domain"
                    value={profile.domain}
                    onChange={(event) => setProfile((prev) => ({ ...prev, domain: event.target.value }))}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university-address">Address</Label>
                  <Input
                    id="university-address"
                    value={profile.address}
                    onChange={(event) => setProfile((prev) => ({ ...prev, address: event.target.value }))}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label>Location</Label>
                  <div className="flex items-center justify-between gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      className={
                        selectedPosition
                          ? 'border-primary bg-primary text-primary-foreground'
                          : 'border-muted-foreground/40 text-muted-foreground'
                      }
                      onClick={() => setIsLocationPickerOpen((prev) => !prev)}
                    >
                      {isLocationPickerOpen ? 'Close Location Picker' : 'Update Location'}
                    </Button>
                    <span className="text-xs text-muted-foreground">
                      {selectedAddress && selectedAddress.trim().length > 0
                        ? selectedAddress
                        : 'No address selected'}
                    </span>
                  </div>
                  {isLocationPickerOpen && (
                    <div className="space-y-3">
                      <div className="h-[320px] rounded-lg overflow-hidden border border-border">
                        {AMAP_JS_KEY && AMAP_SECURITY_CODE ? (
                          <div ref={mapContainerRef} className="h-full w-full" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">
                            Missing AMap keys.
                          </div>
                        )}
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
                            {pagedSuggestions.map((item, index) => (
                              <button
                                key={`${item.text}-${(suggestionsPage - 1) * SUGGESTIONS_PER_PAGE + index}`}
                                type="button"
                                onClick={() => {
                                  setSelectedAddress(item.text);
                                  setSelectedPosition([item.location.lat, item.location.lng]);
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
                            {totalSuggestionPages > 1 && (
                              <div className="flex items-center justify-between pt-2">
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={suggestionsPage <= 1}
                                  onClick={() => setSuggestionsPage((p) => Math.max(1, p - 1))}
                                >
                                  Previous
                                </Button>
                                <span className="text-xs text-muted-foreground">
                                  Page {suggestionsPage} of {totalSuggestionPages}
                                </span>
                                <Button
                                  type="button"
                                  variant="outline"
                                  disabled={suggestionsPage >= totalSuggestionPages}
                                  onClick={() =>
                                    setSuggestionsPage((p) => Math.min(totalSuggestionPages, p + 1))
                                  }
                                >
                                  Next
                                </Button>
                              </div>
                            )}
                          </div>
                        )}
                        {selectedPosition && (
                          <p className="mt-2 text-xs text-muted-foreground">
                            Selected coordinates: {selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}
                          </p>
                        )}
                        <div className="mt-3 flex items-center justify-end gap-2">
                          <Button
                            type="button"
                            onClick={() => {
                              const lat = selectedPosition ? selectedPosition[0] : null;
                              const lng = selectedPosition ? selectedPosition[1] : null;
                              console.log({
                                address: selectedAddress ?? null,
                                latitude: lat,
                                longitude: lng,
                              });
                              setIsLocationPickerOpen(false);
                            }}
                            className="gradient-primary text-primary-foreground"
                          >
                            Confirm
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university-website">Website</Label>
                  <Input
                    id="university-website"
                    value={profile.website}
                    onChange={(event) => setProfile((prev) => ({ ...prev, website: event.target.value }))}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="university-email">Contact Email</Label>
                    <div className="relative">
                      <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="university-email"
                        value={profile.contactEmail}
                        onChange={(event) => setProfile((prev) => ({ ...prev, contactEmail: event.target.value }))}
                        className="bg-secondary/50 pl-9"
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university-phone">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                      <Input
                        id="university-phone"
                        value={profile.contactPhone}
                        onChange={(event) => setProfile((prev) => ({ ...prev, contactPhone: event.target.value }))}
                        className="bg-secondary/50 pl-9"
                      />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university-description">Description</Label>
                  <Textarea
                    id="university-description"
                    value={profile.description}
                    onChange={(event) => setProfile((prev) => ({ ...prev, description: event.target.value }))}
                    className="min-h-[120px] bg-secondary/50"
                  />
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Admins & Moderators</h3>
                <Button variant="outline" size="sm">
                  Invite Admin
                </Button>
              </div>
              <div className="space-y-3">
                {admins.map((admin) => (
                  <div key={admin.id} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                    <div>
                      <p className="text-sm font-medium text-foreground">{admin.name}</p>
                      <p className="text-xs text-muted-foreground">{admin.role}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </div>
                    <Badge variant={admin.status === 'active' ? 'default' : 'secondary'}>
                      {admin.status}
                    </Badge>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-2 mb-4">
                <GraduationCap className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Campus Highlights</h3>
              </div>
              <div className="space-y-3 text-sm text-muted-foreground">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <span>Average order value</span>
                  <span className="text-foreground">${averageOrderValue.toFixed(2)}</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <span>Average daily uploads</span>
                  <span className="text-foreground">{averageDailyUploads.toFixed(1)} per day</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <span>Top category</span>
                  <span className="text-foreground">Electronics</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
