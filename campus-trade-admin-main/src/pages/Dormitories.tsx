import { useEffect, useMemo, useRef, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dormitories as initialDormitories, Dormitory } from '@/lib/dummyData';
import { Plus, Building2, MapPin, Users, Search } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import AMapLoader from '@amap/amap-jsapi-loader';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
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
  getAddress: (
    lnglat: [number, number],
    callback: (
      status: string,
      result: {
        regeocode?: {
          formattedAddress?: string;
          pois?: Array<{
            name?: string;
            address?: string;
            location?: { lng: number; lat: number } | [number, number];
          }>;
        };
      },
    ) => void,
  ) => void;
};

type AMapNamespace = {
  Map: new (container: HTMLDivElement, options: { zoom: number; center: [number, number]; mapStyle?: string }) => AMapMap;
  Marker: new (options: { position: [number, number]; map: AMapMap }) => AMapMarker;
  Geocoder: new (options: { radius: number; extensions: string }) => AMapGeocoder;
};

export default function Dormitories() {
  const { admin } = useAuth();
  const [dormitories, setDormitories] = useState<Dormitory[]>([]);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterUniversity, setFilterUniversity] = useState<string>('all');
  const [newDormitory, setNewDormitory] = useState({ name: '', universityId: '', domain: '', address: '', capacity: '' });
  const [currentStep, setCurrentStep] = useState<'details' | 'location'>('details');
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<{ text: string; location: { lat: number; lng: number } }[]>([]);
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const SUGGESTIONS_PER_PAGE = 5;
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const markerRef = useRef<AMapMarker | null>(null);
  const geocoderRef = useRef<AMapGeocoder | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const [nameTouched, setNameTouched] = useState(false);
  const [universityTouched, setUniversityTouched] = useState(false);
  const [domainTouched, setDomainTouched] = useState(false);
  const [capacityTouched, setCapacityTouched] = useState(false);
  const [addressTouched, setAddressTouched] = useState(false);
  const [locationTouched, setLocationTouched] = useState(false);
  const detailsErrors = useMemo(() => {
    const e: { name?: string; universityId?: string; domain?: string; capacity?: string } = {};
    if (!newDormitory.name.trim()) e.name = 'Name is required';
    if (!newDormitory.universityId.trim()) e.universityId = 'University is required';
    const domain = newDormitory.domain.trim();
    const domainOk = /^[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(domain);
    if (!domain) e.domain = 'Domain is required';
    else if (!domainOk) e.domain = 'Enter a valid domain';
    const cap = Number(newDormitory.capacity);
    if (!newDormitory.capacity.trim()) e.capacity = 'Capacity is required';
    else if (!Number.isFinite(cap) || cap <= 0 || !Number.isInteger(cap)) e.capacity = 'Capacity must be a positive integer';
    return e;
  }, [newDormitory]);
  const detailsValid = useMemo(() => Object.values(detailsErrors).length === 0, [detailsErrors]);
  const locationErrors = useMemo(() => {
    const e: { address?: string; location?: string } = {};
    if (!newDormitory.address.trim()) e.address = 'Address is required';
    if (!selectedPosition) e.location = 'Select a location on the map';
    return e;
  }, [newDormitory.address, selectedPosition]);
  const locationValid = useMemo(() => Object.values(locationErrors).length === 0, [locationErrors]);
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
    let ignore = false;
    const fetchDormitories = async () => {
      if (!admin) {
        setDormitories(initialDormitories);
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dormitories`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data: {
          message?: string;
          dormitories?: Array<{
            id: number | string;
            name: string | null;
            longitude?: number | null;
            latitude?: number | null;
            address?: string | null;
            users_count?: number | string | null;
            full_capacity?: number | string | null;
            created_at?: string | null;
            university_id?: number | string | null;
            university_name?: string | null;
          }>;
        } | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.dormitories) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : 'Failed to load dormitories';
          toast.error(message);
          setDormitories(initialDormitories);
          return;
        }
        const mapped: Dormitory[] = data.dormitories.map((d) => ({
          id: String(d.id),
          name: (d.name ?? 'Dormitory').trim(),
          universityId: String(d.university_id ?? ''),
          universityName: (d.university_name ?? 'Unknown').trim(),
          capacity: Number(d.full_capacity ?? 0) || 0,
          occupancy: Number(d.users_count ?? 0) || 0,
          address: (d.address ?? 'N/A').trim(),
          createdAt: (d.created_at ?? '').trim(),
        }));
        if (!ignore) {
          setDormitories(mapped);
        }
      } catch {
        toast.error('Failed to load dormitories');
        setDormitories(initialDormitories);
      }
    };
    fetchDormitories();
    return () => {
      ignore = true;
    };
  }, [admin]);

  useEffect(() => {
    if (!isLocationPickerOpen) {
      return;
    }
    setSelectedAddress(null);
    setSuggestionsPage(1);
  }, [isLocationPickerOpen]);

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
          const center: [number, number] = selectedPosition ? [selectedPosition[1], selectedPosition[0]] : defaultCenter;
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

  const universityOptions = useMemo(() => {
    const map = new Map<string, string>();
    dormitories.forEach((d) => {
      if (d.universityId && d.universityName) {
        map.set(d.universityId, d.universityName);
      }
    });
    return Array.from(map.entries()).map(([id, name]) => ({ id, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [dormitories]);

  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    if (filterUniversity === 'all') {
      return;
    }
    const exists = universityOptions.some((u) => u.id === filterUniversity);
    if (!exists) {
      setFilterUniversity('all');
    }
  }, [filterUniversity, universityOptions]);

  const filteredDormitories = filterUniversity === 'all' 
    ? dormitories 
    : dormitories.filter(d => d.universityId === filterUniversity);

  const nameFilteredDormitories = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return filteredDormitories;
    return filteredDormitories.filter((d) => d.name.toLowerCase().includes(q));
  }, [filteredDormitories, searchQuery]);

  const totalPages = useMemo(
    () => Math.max(1, Math.ceil(nameFilteredDormitories.length / pageSize)),
    [nameFilteredDormitories.length, pageSize],
  );

  useEffect(() => {
    setCurrentPage(1);
  }, [filterUniversity, pageSize, dormitories.length, searchQuery]);

  const pagedDormitories = useMemo(
    () =>
      nameFilteredDormitories.slice((currentPage - 1) * pageSize, currentPage * pageSize),
    [nameFilteredDormitories, currentPage, pageSize],
  );

  const columns = [
    {
      header: 'Dormitory',
      accessorKey: (row: Dormitory) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {row.address}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'University',
      accessorKey: 'universityName' as keyof Dormitory,
    },
    {
      header: 'Occupancy',
      accessorKey: (row: Dormitory) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{row.occupancy} / {row.capacity}</span>
          </div>
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${(row.occupancy / row.capacity) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'createdAt' as keyof Dormitory,
    },
  ];

  const handleCreate = async () => {
    if (!newDormitory.name || !newDormitory.universityId || !newDormitory.domain || !newDormitory.capacity) {
      toast.error('Please fill in all fields');
      return;
    }
    if (!admin) {
      toast.error('Unauthorized: Only administrators can access this endpoint.');
      return;
    }
    const latFromPicker = selectedPosition ? selectedPosition[0] : null;
    const lngFromPicker = selectedPosition ? selectedPosition[1] : null;
    const latitude = latFromPicker !== null ? latFromPicker : null;
    const longitude = lngFromPicker !== null ? lngFromPicker : null;
    if (latitude !== null && (latitude < -90 || latitude > 90)) {
      toast.error('Latitude must be between -90 and 90');
      return;
    }
    if (longitude !== null && (longitude < -180 || longitude > 180)) {
      toast.error('Longitude must be between -180 and 180');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/set_dormitory`, {
        method: 'POST',
        headers: {
          Authorization: `${admin.tokenType} ${admin.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name: newDormitory.name,
          domain: newDormitory.domain,
          latitude,
          longitude,
          address: newDormitory.address || null,
          full_capacity: Number(newDormitory.capacity),
          university_id: Number(newDormitory.universityId),
        }),
      });
      const data: {
        message?: string;
        dormitory?: {
          id: number | string;
          name?: string | null;
          longitude?: number | null;
          latitude?: number | null;
          address?: string | null;
          occupancy?: number | null;
          users_count?: number | null;
          full_capacity?: number | null;
          created_at?: string | null;
          university_id?: number | string | null;
          university_name?: string | null;
        };
        errors?: Record<string, string[]>;
      } | undefined = await response.json().catch(() => undefined);
      if (response.status === 403) {
        toast.error('Unauthorized: Only administrators can access this endpoint.');
        return;
      }
      if (response.status === 404) {
        toast.error('University not found.');
        return;
      }
      if (response.status === 422 && data?.errors) {
        const firstError = Object.values(data.errors)[0]?.[0] ?? 'Validation Error';
        toast.error(firstError);
        return;
      }
      if (response.status !== 201 || !data?.dormitory) {
        toast.error(data?.message || 'Failed to create dormitory');
        return;
      }
      const d = data.dormitory;
      const selectedUni = universityOptions.find(u => u.id === String(d.university_id ?? newDormitory.universityId));
      const dormitory: Dormitory = {
        id: String(d.id),
        name: (d.name ?? newDormitory.name).trim(),
        universityId: String(d.university_id ?? newDormitory.universityId),
        universityName: (d.university_name ?? selectedUni?.name ?? '').trim(),
        address: (d.address ?? newDormitory.address ?? '').trim(),
        capacity: Number(d.full_capacity ?? newDormitory.capacity) || 0,
        occupancy: Number(d.users_count ?? 0) || 0,
        createdAt: (d.created_at ?? new Date().toISOString().split('T')[0]).trim(),
      };
      setDormitories([...dormitories, dormitory]);
      setNewDormitory({ name: '', universityId: '', domain: '', address: '', capacity: '' });
      setSelectedPosition(null);
      setAddressSuggestions([]);
      setSelectedAddress(null);
      setIsLocationPickerOpen(false);
      setCurrentStep('details');
      setIsDialogOpen(false);
      toast.success('Dormitory created successfully');
    } catch {
      toast.error('Failed to create dormitory');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dormitories</h1>
            <p className="text-muted-foreground">Manage dormitories across universities</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Dormitory
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border sm:max-w-2xl">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Dormitory</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new dormitory to a university.
                </DialogDescription>
              </DialogHeader>
              <div className="flex items-center justify-center py-3">
                <div className="flex items-center gap-2">
                  <div className={currentStep === 'details' ? 'h-3 w-3 rounded-full bg-primary' : 'h-3 w-3 rounded-full bg-muted-foreground/40'} />
                  <div className={currentStep === 'details' || currentStep === 'location' ? 'h-1 w-32 bg-primary' : 'h-1 w-32 bg-border'} />
                  <div className={currentStep === 'details' ? 'h-3 w-3 rounded-full bg-primary' : 'h-3 w-3 rounded-full bg-muted-foreground/40'} />
                  <div className={currentStep === 'location' ? 'h-1 w-28 bg-primary' : 'h-1 w-28 bg-border'} />
                  <div className={currentStep === 'location' ? 'h-3 w-3 rounded-full bg-primary' : 'h-3 w-3 rounded-full bg-muted-foreground/40'} />
                </div>
              </div>
              {currentStep === 'details' ? (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Dormitory Name</Label>
                    <Input
                      id="name"
                      placeholder="e.g., Baker House"
                      value={newDormitory.name}
                      onChange={(e) => {
                        setNewDormitory({ ...newDormitory, name: e.target.value });
                        setNameTouched(true);
                      }}
                      className={detailsErrors.name && nameTouched ? 'bg-secondary/50 border border-destructive' : 'bg-secondary/50'}
                    />
                    {detailsErrors.name && nameTouched && <p className="text-xs text-destructive">{detailsErrors.name}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university">University</Label>
                    <Select
                      value={newDormitory.universityId}
                      onValueChange={(value) => {
                        setNewDormitory({ ...newDormitory, universityId: value });
                        setUniversityTouched(true);
                      }}
                    >
                      <SelectTrigger className="bg-secondary/50">
                        <SelectValue placeholder="Select university" />
                      </SelectTrigger>
                      <SelectContent>
                        {universityOptions.map((u) => (
                          <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {detailsErrors.universityId && universityTouched && <p className="text-xs text-destructive">{detailsErrors.universityId}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="domain">Domain</Label>
                    <Input
                      id="domain"
                      placeholder="e.g., dorm.mit.edu"
                      value={newDormitory.domain}
                      onChange={(e) => {
                        setNewDormitory({ ...newDormitory, domain: e.target.value });
                        setDomainTouched(true);
                      }}
                      className={detailsErrors.domain && domainTouched ? 'bg-secondary/50 border border-destructive' : 'bg-secondary/50'}
                    />
                    {detailsErrors.domain && domainTouched && <p className="text-xs text-destructive">{detailsErrors.domain}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="capacity">Capacity</Label>
                    <Input
                      id="capacity"
                      type="number"
                      placeholder="e.g., 350"
                      value={newDormitory.capacity}
                      onChange={(e) => {
                        setNewDormitory({ ...newDormitory, capacity: e.target.value });
                        setCapacityTouched(true);
                      }}
                      className={detailsErrors.capacity && capacityTouched ? 'bg-secondary/50 border border-destructive' : 'bg-secondary/50'}
                    />
                    {detailsErrors.capacity && capacityTouched && <p className="text-xs text-destructive">{detailsErrors.capacity}</p>}
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        if (!detailsValid) return;
                        setCurrentStep('location');
                      }}
                      disabled={!detailsValid}
                      className="gradient-primary text-primary-foreground disabled:opacity-50"
                    >
                      Next
                    </Button>
                  </DialogFooter>
                </div>
              ) : (
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="address">Address</Label>
                    <Input
                      id="address"
                      placeholder="e.g., 362 Memorial Dr"
                      value={newDormitory.address}
                      onChange={(e) => {
                        setNewDormitory({ ...newDormitory, address: e.target.value });
                        setAddressTouched(true);
                      }}
                      className={locationErrors.address && addressTouched ? 'bg-secondary/50 border border-destructive' : 'bg-secondary/50'}
                    />
                    {locationErrors.address && addressTouched && <p className="text-xs text-destructive">{locationErrors.address}</p>}
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
                        onClick={() => {
                          setIsLocationPickerOpen((prev) => !prev);
                          setLocationTouched(true);
                        }}
                      >
                        {isLocationPickerOpen ? 'Close Location Picker' : 'Update Location'}
                      </Button>
                      <span className="text-xs text-muted-foreground">
                        {selectedAddress && selectedAddress.trim().length > 0 ? selectedAddress : 'No address selected'}
                      </span>
                    </div>
                    {locationErrors.location && locationTouched && <p className="text-xs text-destructive">{locationErrors.location}</p>}
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
                                  key={`${item.text}-${index}`}
                                  type="button"
                                  onClick={() => {
                                    setSelectedAddress(item.text);
                                    setNewDormitory((prev) => ({
                                      ...prev,
                                      address: item.text,
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
                                  onClick={() => setSuggestionsPage((p) => Math.min(totalSuggestionPages, p + 1))}
                                >
                                  Next
                                </Button>
                              </div>
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
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setCurrentStep('details')}>
                      Back
                    </Button>
                    <Button onClick={handleCreate} disabled={!locationValid} className="gradient-primary text-primary-foreground disabled:opacity-50">
                      Create
                    </Button>
                  </DialogFooter>
                </div>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {/* Filter */}
        <div className="flex items-center justify-between gap-4">
          <div className="w-64">
            <Select value={filterUniversity} onValueChange={setFilterUniversity}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Filter by university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universityOptions.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by name"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="bg-card w-56 pl-9"
            />
          </div>
        </div>

        {/* Table */}
        <DataTable 
          columns={columns} 
          data={pagedDormitories} 
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            if (page < 1 || page > totalPages) return;
            setCurrentPage(page);
          }}
        />
      </div>
    </DashboardLayout>
  );
}
