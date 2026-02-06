import { useEffect, useState } from 'react';
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
import { universities as initialUniversities, University } from '@/lib/dummyData';
import { Plus, GraduationCap, MapPin, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';
import { MapContainer, TileLayer, Marker, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { useAuth } from '@/contexts/AuthContext';

const defaultIconPrototype = L.Icon.Default.prototype as unknown as { _getIconUrl?: string };
delete defaultIconPrototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

type MapPosition = { lat: number; lng: number };
type ApiUniversity = {
  id: number | string;
  name: string;
  domain: string;
  latitude: number | null;
  longitude: number | null;
  pic: string | null;
  created_at?: string | null;
};

type CreateUniversityResponse = {
  message: string;
  university?: ApiUniversity;
  errors?: Record<string, string[]>;
};

const formatLocation = (position: MapPosition | null) => {
  if (!position) {
    return '';
  }
  return `${position.lat.toFixed(5)}, ${position.lng.toFixed(5)}`;
};

const MapPicker = ({ position, onSelect }: { position: MapPosition | null; onSelect: (pos: MapPosition) => void }) => {
  const map = useMap();
  useEffect(() => {
    if (position) {
      map.setView([position.lat, position.lng], map.getZoom(), { animate: true });
    }
  }, [map, position]);

  useMapEvents({
    click: (event) => {
      onSelect({ lat: event.latlng.lat, lng: event.latlng.lng });
    },
  });

  return position ? <Marker position={[position.lat, position.lng]} /> : null;
};

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export default function Universities() {
  const [universities, setUniversities] = useState<University[]>(initialUniversities);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isMapOpen, setIsMapOpen] = useState(false);
  const { admin } = useAuth();
  const [newUniversity, setNewUniversity] = useState({
    name: '',
    domain: '',
    imageUrl: '',
    lat: null as number | null,
    lng: null as number | null,
  });
  const [mapPosition, setMapPosition] = useState<MapPosition | null>(null);
  const [geoLoading, setGeoLoading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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
    if (!newUniversity.name || !newUniversity.domain) {
      toast.error('Please fill in all required fields');
      return;
    }
    if (!admin) {
      toast.error('You must be logged in to create a university');
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
          name: newUniversity.name,
          domain: newUniversity.domain,
          latitude: newUniversity.lat,
          longitude: newUniversity.lng,
          pic: newUniversity.imageUrl || null,
        }),
      });
      const data: CreateUniversityResponse | undefined = await response.json().catch(() => undefined);
      if (response.status === 422) {
        const errors = data?.errors
          ? Object.values(data.errors).flat().join(' ')
          : data?.message || 'Validation Error';
        toast.error(errors);
        return;
      }
      if (!response.ok || !data?.university) {
        const message = data?.message || 'Failed to create university';
        toast.error(message);
        return;
      }
      const createdUniversity: University = {
        id: String(data.university.id),
        name: data.university.name,
        location:
          data.university.latitude !== null && data.university.longitude !== null
            ? `${data.university.latitude.toFixed(5)}, ${data.university.longitude.toFixed(5)}`
            : 'N/A',
        studentCount: 0,
        dormitoriesCount: 0,
        createdAt: data.university.created_at?.split('T')[0] ?? new Date().toISOString().split('T')[0],
        lat: data.university.latitude ?? 0,
        lng: data.university.longitude ?? 0,
        domain: data.university.domain,
        imageUrl: data.university.pic ?? undefined,
      };
      setUniversities((prev) => [...prev, createdUniversity]);
      setNewUniversity({ name: '', domain: '', imageUrl: '', lat: null, lng: null });
      setMapPosition(null);
      setIsDialogOpen(false);
      toast.success(data.message || 'University created successfully');
    } catch {
      toast.error('Failed to create university');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenMap = () => {
    const position =
      newUniversity.lat !== null && newUniversity.lng !== null
        ? { lat: newUniversity.lat, lng: newUniversity.lng }
        : null;
    setMapPosition(position);
    setIsMapOpen(true);
  };

  const handleSaveMap = () => {
    if (!mapPosition) {
      toast.error('Please select a location on the map');
      return;
    }
    setNewUniversity((prev) => ({
      ...prev,
      lat: mapPosition.lat,
      lng: mapPosition.lng,
    }));
    setIsMapOpen(false);
  };

  const handleUseMyLocation = () => {
    if (!navigator.geolocation) {
      toast.error('Geolocation is not supported in this browser');
      return;
    }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (position) => {
        setGeoLoading(false);
        setMapPosition({ lat: position.coords.latitude, lng: position.coords.longitude });
      },
      () => {
        setGeoLoading(false);
        toast.error('Unable to retrieve your location');
      }
    );
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
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
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
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    placeholder="e.g., mit.edu"
                    value={newUniversity.domain}
                    onChange={(e) => setNewUniversity({ ...newUniversity, domain: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl">Picture Link</Label>
                  <Input
                    id="imageUrl"
                    placeholder="https://example.com/image.jpg"
                    value={newUniversity.imageUrl}
                    onChange={(e) => setNewUniversity({ ...newUniversity, imageUrl: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="mapLocation">Location</Label>
                  <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                    <Input
                      id="mapLocation"
                      placeholder="Select on map"
                      value={formatLocation(
                        newUniversity.lat !== null && newUniversity.lng !== null
                          ? { lat: newUniversity.lat, lng: newUniversity.lng }
                          : null
                      )}
                      readOnly
                      className="bg-secondary/50"
                    />
                    <Button type="button" variant="outline" onClick={handleOpenMap}>
                      Pick on Map
                    </Button>
                  </div>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="gradient-primary text-primary-foreground" disabled={isSubmitting}>
                  {isSubmitting ? 'Creating...' : 'Create'}
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
        <Dialog open={isMapOpen} onOpenChange={setIsMapOpen}>
          <DialogContent className="bg-card border-border max-w-4xl">
            <DialogHeader>
              <DialogTitle className="text-foreground">Select University Location</DialogTitle>
              <DialogDescription className="text-muted-foreground">
                Click on the map to place a marker, then save your selection.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center gap-2">
                <Button type="button" variant="outline" onClick={handleUseMyLocation} disabled={geoLoading}>
                  {geoLoading ? 'Locating...' : 'Use My Location'}
                </Button>
                <div className="text-sm text-muted-foreground">
                  {mapPosition ? formatLocation(mapPosition) : 'No location selected'}
                </div>
              </div>
              <div className="h-[420px] rounded-lg overflow-hidden border border-border">
                <MapContainer
                  center={mapPosition ? [mapPosition.lat, mapPosition.lng] : [39.8283, -98.5795]}
                  zoom={mapPosition ? 12 : 4}
                  style={{ height: '100%', width: '100%' }}
                  className="z-0"
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
                    url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
                  />
                  <MapPicker position={mapPosition} onSelect={setMapPosition} />
                </MapContainer>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsMapOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleSaveMap} className="gradient-primary text-primary-foreground">
                Save Location
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
        </div>

        {/* Table */}
        <DataTable columns={columns} data={universities} />
      </div>
    </DashboardLayout>
  );
}
