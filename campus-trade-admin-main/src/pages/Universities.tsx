import { useEffect, useMemo, useState } from 'react';
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
import { MapContainer, Marker, TileLayer, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Skeleton } from '@/components/ui/skeleton';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const defaultIconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const universityIcon = new L.Icon({
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

type LocationMarkerProps = {
  position: [number, number] | null;
  onSelect: (lat: number, lng: number) => void;
};

function LocationMarker({ position, onSelect }: LocationMarkerProps) {
  useMapEvents({
    click(event) {
      onSelect(event.latlng.lat, event.latlng.lng);
    },
  });
  if (!position) {
    return null;
  }
  return <Marker position={position} icon={universityIcon} />;
}

type ApiUniversity = {
  id: number | string;
  name?: string | null;
  latitude?: number | null;
  longitude?: number | null;
  lat?: number | null;
  lng?: number | null;
  location?: string | null;
  created_at?: string | null;
  createdAt?: string | null;
  students_count?: number | string | null;
  student_count?: number | string | null;
  dormitories_count?: number | string | null;
  dormitoriesCount?: number | string | null;
};

type UniversitiesResponse = {
  message: string;
  universities: ApiUniversity[];
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
    university.location ?? null,
  );
  const createdAt =
    typeof university.created_at === 'string'
      ? university.created_at.split('T')[0]
      : typeof university.createdAt === 'string'
      ? university.createdAt.split('T')[0]
      : new Date().toISOString().split('T')[0];
  const studentCount =
    Number(university.students_count ?? university.student_count ?? 0) || 0;
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
  const [universities, setUniversities] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newUniversity, setNewUniversity] = useState({
    name: '',
    domain: '',
    imageUrl: '',
    latitude: '',
    longitude: '',
  });

  const selectedPosition = useMemo<[number, number] | null>(() => {
    const lat = Number(newUniversity.latitude);
    const lng = Number(newUniversity.longitude);
    if (Number.isFinite(lat) && Number.isFinite(lng)) {
      return [lat, lng];
    }
    return null;
  }, [newUniversity.latitude, newUniversity.longitude]);

  const mapCenter: [number, number] = selectedPosition ?? [39.8283, -98.5795];

  useEffect(() => {
    if (!admin) {
      setUniversities([]);
      return;
    }
    let ignore = false;
    const fetchUniversities = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/universities`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data: UniversitiesResponse | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.universities) {
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
        const mapped = data.universities.map(buildUniversity);
        if (!ignore) {
          setUniversities(mapped);
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
  }, [admin]);

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
        latitude !== null && longitude !== null
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
      setIsDialogOpen(false);
      setIsMapOpen(false);
      toast.success('University created successfully');
    } catch {
      toast.error('Failed to create university');
    } finally {
      setIsSubmitting(false);
    }
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
              if (!open) {
                setIsMapOpen(false);
              }
            }}
          >
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add University
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create University</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new university to the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
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
                  <Label>Location</Label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Input
                      id="latitude"
                      placeholder="Latitude"
                      value={newUniversity.latitude}
                      onChange={(e) => setNewUniversity({ ...newUniversity, latitude: e.target.value })}
                      className="bg-secondary/50"
                    />
                    <Input
                      id="longitude"
                      placeholder="Longitude"
                      value={newUniversity.longitude}
                      onChange={(e) => setNewUniversity({ ...newUniversity, longitude: e.target.value })}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Button type="button" variant="outline" onClick={() => setIsMapOpen((prev) => !prev)}>
                      Select location
                    </Button>
                    {selectedPosition ? (
                      <span className="text-xs text-muted-foreground">
                        {selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No location selected</span>
                    )}
                  </div>
                  {isMapOpen && (
                    <div className="h-[260px] rounded-lg overflow-hidden border border-border">
                      <MapContainer
                        center={mapCenter}
                        zoom={selectedPosition ? 13 : 4}
                        style={{ height: '100%', width: '100%' }}
                        className="z-0"
                      >
                        <TileLayer
                          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                        />
                        <LocationMarker
                          position={selectedPosition}
                          onSelect={(lat, lng) =>
                            setNewUniversity({
                              ...newUniversity,
                              latitude: lat.toFixed(6),
                              longitude: lng.toFixed(6),
                            })
                          }
                        />
                      </MapContainer>
                    </div>
                  )}
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button
                  onClick={handleCreate}
                  className="gradient-primary text-primary-foreground"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? 'Creating...' : 'Create'}
                </Button>
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
                <p className="text-2xl font-bold text-foreground">{universities.length}</p>
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
              {Array.from({ length: 6 }, (_, index) => (
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
          <DataTable columns={columns} data={universities} />
        )}
      </div>
    </DashboardLayout>
  );
}
