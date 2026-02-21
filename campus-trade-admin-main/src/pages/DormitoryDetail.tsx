import { useMemo, useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Checkbox } from '@/components/ui/checkbox';
import { Building2, ArrowLeft, Users, MapPin, Calendar, Globe, CircleDot, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Dormitory, categories } from '@/lib/dummyData';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
import AMapLoader from '@amap/amap-jsapi-loader';
const AMAP_JS_KEY = import.meta.env.VITE_AMAP_JS_KEY ?? '';
const AMAP_SECURITY_CODE = import.meta.env.VITE_AMAP_SECURITY_CODE ?? '';
const defaultCenter: [number, number] = [104.1954, 35.8617];
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Sector } from 'recharts';

type RecentListing = {
  id: string;
  title: string;
  seller: string;
  createdAt: string;
};

export default function DormitoryDetail() {
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const { admin } = useAuth();
  const [loading, setLoading] = useState(true);

  const [profile, setProfile] = useState<Dormitory>(() => ({
    id: id || '1',
    name: 'Maple Hall',
    universityId: '3',
    universityName: 'City University',
    capacity: 420,
    occupancy: 187,
    address: '123 Dorm Rd, Cityville',
    createdAt: '2026-01-08',
  }));

  const [domain, setDomain] = useState('maple-hall.example.edu');
  const [description, setDescription] = useState('Mixed-year residence hall with study lounges and a community kitchen.');
  const [website, setWebsite] = useState('https://maple-hall.example.edu');
  const [topCategory, setTopCategory] = useState('N/A');
  const [apiNumbers, setApiNumbers] = useState<{ verifiedUsers: number; unverifiedUsers: number; totalUsers: number }>({
    verifiedUsers: 0,
    unverifiedUsers: 0,
    totalUsers: 0,
  });
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
  type AddressSuggestion = { text: string; location: { lat: number; lng: number } };
  const mapContainerRef = useRef<HTMLDivElement | null>(null);
  const mapRef = useRef<AMapMap | null>(null);
  const markerRef = useRef<AMapMarker | null>(null);
  const geocoderRef = useRef<AMapGeocoder | null>(null);
  const amapRef = useRef<AMapNamespace | null>(null);
  const [selectedPosition, setSelectedPosition] = useState<[number, number] | null>(null);
  const [selectedAddress, setSelectedAddress] = useState<string | null>(null);
  const [addressSuggestions, setAddressSuggestions] = useState<AddressSuggestion[]>([]);
  const SUGGESTIONS_PER_PAGE = 6;
  const [suggestionsPage, setSuggestionsPage] = useState(1);
  const [isLocationPickerOpen, setIsLocationPickerOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [deleteConfirmChecked, setDeleteConfirmChecked] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const totalSuggestionPages = useMemo(() => Math.max(1, Math.ceil(addressSuggestions.length / SUGGESTIONS_PER_PAGE)), [addressSuggestions.length]);
  const pagedSuggestions = useMemo(() => addressSuggestions.slice((suggestionsPage - 1) * SUGGESTIONS_PER_PAGE, suggestionsPage * SUGGESTIONS_PER_PAGE), [addressSuggestions, suggestionsPage]);
  useEffect(() => {
    if (!isLocationPickerOpen) {
      return;
    }
    setSelectedAddress(null);
    setSuggestionsPage(1);
  }, [isLocationPickerOpen, selectedPosition]);

  const stats = useMemo(
    () => [
      { label: 'Capacity', value: profile.capacity.toLocaleString(), icon: <Building2 className="w-5 h-5" /> },
      { label: 'Residents', value: profile.occupancy.toLocaleString(), icon: <Users className="w-5 h-5" /> },
      { label: 'University', value: profile.universityName, icon: <CircleDot className="w-5 h-5" /> },
      { label: 'Added', value: profile.createdAt, icon: <Calendar className="w-5 h-5" /> },
    ],
    [profile],
  );

  const pieData = useMemo(() => {
    const nonPlatformResidents = Math.max(0, Number(profile.occupancy) - Number(apiNumbers.totalUsers));
    return [
      { name: 'Verified', value: Number(apiNumbers.verifiedUsers) },
      { name: 'Unverified', value: Number(apiNumbers.unverifiedUsers) },
      { name: 'Not on Platform', value: nonPlatformResidents },
    ];
  }, [profile.occupancy, apiNumbers]);
  const pieColors = ['#0992C2', '#0AC4E0', '#EB4C4C'];

  const [categoryData, setCategoryData] = useState<{ name: string; count: number }[]>(
    categories.slice(0, 6).map((c) => ({ name: c.name, count: (c.productCount % 100) + 1 })),
  );
  const [hoverIndex, setHoverIndex] = useState<number>(-1);
  const RADIAN = Math.PI / 180;
  type ActiveShapeProps = {
    cx: number;
    cy: number;
    midAngle: number;
    innerRadius: number;
    outerRadius: number;
    startAngle: number;
    endAngle: number;
    fill: string;
    payload: { name: string };
    value: number;
  };
  const renderActiveShape = (props: ActiveShapeProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, startAngle, endAngle, fill, payload, value } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 8) * cos;
    const sy = cy + (outerRadius + 8) * sin;
    const mx = cx + (outerRadius + 18) * cos;
    const my = cy + (outerRadius + 18) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 26;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    return (
      <g>
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius} startAngle={startAngle} endAngle={endAngle} fill={fill} />
        <Sector cx={cx} cy={cy} innerRadius={innerRadius} outerRadius={outerRadius + 6} startAngle={startAngle} endAngle={endAngle} fill={fill} opacity={0.85} />
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={3} fill={fill} />
        <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey} textAnchor={textAnchor} className="text-xs fill-foreground">
          {payload.name}: {Math.round(outerRadius - innerRadius)}px
        </text>
      </g>
    );
  };

  const renderSliceLabel = (props: ActiveShapeProps) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, fill, payload } = props;
    const sin = Math.sin(-RADIAN * midAngle);
    const cos = Math.cos(-RADIAN * midAngle);
    const sx = cx + (outerRadius + 8) * cos;
    const sy = cy + (outerRadius + 8) * sin;
    const mx = cx + (outerRadius + 18) * cos;
    const my = cy + (outerRadius + 18) * sin;
    const ex = mx + (cos >= 0 ? 1 : -1) * 26;
    const ey = my;
    const textAnchor = cos >= 0 ? 'start' : 'end';
    return (
      <g>
        <path d={`M${sx},${sy}L${mx},${my}L${ex},${ey}`} stroke={fill} fill="none" />
        <circle cx={ex} cy={ey} r={3} fill={fill} />
        <text x={ex + (cos >= 0 ? 1 : -1) * 10} y={ey} textAnchor={textAnchor} className="text-xs fill-foreground">
          {payload.name}: {Math.round(outerRadius - innerRadius)}px
        </text>
      </g>
    );
  };
  const baseInner = 40;
  const minThick = 15;
  const maxThick = 100;
  const totalPie = pieData.reduce((sum, d) => sum + d.value, 0);
  const pieSlices = useMemo(() => {
    let acc = 0;
    return pieData.map((d, idx) => {
      const angle = totalPie ? (d.value / totalPie) * 360 : 0;
      const startAngle = acc;
      const endAngle = acc + angle;
      acc = endAngle;
      const thickness = minThick + (1 - (d.value / Math.max(1, totalPie))) * (maxThick - minThick);
      const outerRadius = baseInner + thickness;
      return { ...d, startAngle, endAngle, outerRadius, idx };
    });
  }, [pieData, totalPie]);
  const sliceDescriptions: Record<string, string> = {
    Verified: 'Residents with verified accounts in the platform.',
    Unverified: 'Residents on the platform but their accounts are not verified.',
    'Not on Platform': 'Dorm residents who are not registered in the platform.',
  };

  const [recentListings, setRecentListings] = useState<RecentListing[]>([
    { id: 'p-1001', title: 'Gaming Chair', seller: 'Alex Kim', createdAt: '2026-01-15' },
    { id: 'p-1002', title: 'Mini Fridge', seller: 'Priya Singh', createdAt: '2026-01-14' },
    { id: 'p-1003', title: 'LED Desk Lamp', seller: 'Diego Lopez', createdAt: '2026-01-13' },
  ]);

  useEffect(() => {
    if (!admin || !id) {
      return;
    }
    let ignore = false;
    const fetchDormitory = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dormitories/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data:
          | {
              message?: string;
              dormitory?: {
                id?: number | string;
                name?: string | null;
                domain?: string | null;
                longitude?: number | null;
                latitude?: number | null;
                address?: string | null;
                users_count?: number | string | null;
                residents?: number | string | null;
                verified_users?: number | string | null;
                unverified_users?: number | string | null;
                total_users?: number | string | null;
                top_category?: string | null;
                description?: string | null;
                full_capacity?: number | string | null;
                created_at?: string | null;
                university_id?: number | string | null;
                university_name?: string | null;
              };
              recent_listings?: Array<{ id: number | string; name?: string | null; uploader_name?: string | null; created_at?: string | null }>;
              categories?: Array<{ id: number | string; name?: string | null; product_count?: number | string | null }>;
            }
          | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.dormitory) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : response.status === 404
              ? 'Dormitory not found.'
              : 'Failed to load dormitory';
          if (!ignore) {
            toast.error(message);
            setLoading(false);
          }
          return;
        }
        const d = data.dormitory;
        const capacity = Number(d?.full_capacity) || 0;
        const occupancy = Number(d?.residents ?? d?.users_count) || 0;
        const uniId = d?.university_id != null ? String(d.university_id) : '';
        const uniName = (d?.university_name ?? '').trim() || 'N/A';
        const addr = (d?.address ?? '').trim() || 'N/A';
        const createdAt = d?.created_at ?? '';
        const name = (d?.name ?? '').trim() || 'Dormitory';
        const domainStr = (d?.domain ?? '').trim();
        const descStr = (d?.description ?? '') || '';
        const verified = Number(d?.verified_users) || 0;
        const unverified = Number(d?.unverified_users) || 0;
        const totalUsers = Number(d?.total_users) || verified + unverified;
        const topCat = (d?.top_category ?? '').trim();
        if (!ignore) {
          setProfile((prev) => ({
            ...prev,
            id: String(d?.id ?? prev.id),
            name,
            universityId: uniId || prev.universityId,
            universityName: uniName || prev.universityName,
            capacity,
            occupancy,
            address: addr,
            createdAt: createdAt || prev.createdAt,
          }));
          if (domainStr) {
            setDomain(domainStr);
            setWebsite(/^https?:\/\//.test(domainStr) ? domainStr : `https://${domainStr}`);
          }
          if (descStr) {
            setDescription(descStr);
          }
          setTopCategory(topCat || 'N/A');
          setApiNumbers({ verifiedUsers: verified, unverifiedUsers: unverified, totalUsers });
          const cats = Array.isArray(data.categories) ? data.categories : [];
          setCategoryData(
            cats.map((c) => ({
              name: (c.name ?? '').trim() || 'Category',
              count: Number(c.product_count) || 0,
            })),
          );
          const listings = Array.isArray(data.recent_listings) ? data.recent_listings : [];
          setRecentListings(
            listings.map((item) => ({
              id: String(item.id ?? ''),
              title: (item.name ?? '').trim() || 'Listing',
              seller: (item.uploader_name ?? '').trim() || 'Unknown',
              createdAt: item.created_at ?? '',
            })),
          );
          setLoading(false);
        }
      } catch {
        if (!ignore) {
          toast.error('Failed to load dormitory');
          setLoading(false);
        }
      }
    };
    fetchDormitory();
    return () => {
      ignore = true;
    };
  }, [admin, id]);
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
            setSuggestionsPage(1);
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
                const pois = result.regeocode.pois ?? [];
                pois.forEach((poi) => {
                  const loc = poi.location;
                  if (!loc) return;
                  const coords = Array.isArray(loc) ? { lng: loc[0], lat: loc[1] } : { lng: loc.lng, lat: loc.lat };
                  if (!Number.isFinite(coords.lat) || !Number.isFinite(coords.lng)) return;
                  const poiText = `${poi.name ?? ''}${poi.address ? ` · ${poi.address}` : ''}`.trim();
                  suggestions.push({ text: poiText || 'Unknown location', location: { lat: coords.lat, lng: coords.lng } });
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
  }, [selectedPosition, isLocationPickerOpen]);
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
  }, [selectedPosition, isLocationPickerOpen]);

  const columns = [
    { header: 'Title', accessorKey: 'title' as keyof RecentListing },
    { header: 'Seller', accessorKey: 'seller' as keyof RecentListing },
    { header: 'Created', accessorKey: 'createdAt' as keyof RecentListing },
  ];

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-md" />
              <div>
                <Skeleton className="h-6 w-40 mb-2" />
                <Skeleton className="h-4 w-64" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Skeleton className="h-9 w-24" />
              <Skeleton className="h-9 w-36" />
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }, (_, i) => (
              <div key={`stat-skeleton-${i}`} className="rounded-xl border border-border bg-card p-4">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="mt-3 h-7 w-20" />
              </div>
            ))}
          </div>
          <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-5 w-28" />
              </div>
              <Skeleton className="h-4 w-3/5 mb-4" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-2">
                  <Skeleton className="h-3 w-20" />
                  <Skeleton className="h-4 w-40" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-48" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-4 w-44" />
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-56" />
              </div>
              <Skeleton className="h-4 w-72 mb-4" />
              <Skeleton className="h-[260px] w-full rounded-lg" />
            </div>
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <div className="flex items-center justify-between mb-2">
                <Skeleton className="h-5 w-48" />
              </div>
              <Skeleton className="h-4 w-56 mb-4" />
              <Skeleton className="h-[260px] w-full rounded-lg" />
            </div>
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <Skeleton className="h-5 w-40 mb-4" />
              <div className="space-y-3">
                {Array.from({ length: 3 }, (_, index) => (
                  <div key={`listing-skeleton-${index}`} className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                    <Skeleton className="h-4 w-40" />
                    <Skeleton className="h-4 w-24" />
                  </div>
                ))}
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-36" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-9 w-full" />
                </div>
                <Skeleton className="h-9 w-40" />
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <div className="flex items-center justify-between mb-4">
                <Skeleton className="h-5 w-28" />
                <Skeleton className="h-5 w-24" />
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-16" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate('/dormitories')}>
              <ArrowLeft className="w-5 h-5" />
            </Button>
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-foreground">{profile.name}</h1>
                <Badge variant="outline">Residence</Badge>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <MapPin className="w-4 h-4" />
                <span>{profile.address}</span>
              </div>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              onClick={() => {
                toast.success('Saved dummy changes');
              }}
            >
              Save
            </Button>
            <Button onClick={() => navigate(`/university/${profile.universityId}`)}>View University</Button>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <Button
              variant="destructive"
              onClick={() => setIsDeleteDialogOpen(true)}
              disabled={isDeleting}
            >
              Delete Dormitory
            </Button>
            <DialogContent className="bg-card border-border w-[92vw] max-w-lg">
              <DialogHeader>
                <DialogTitle>Delete Dormitory</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Deleting this dormitory will remove it from the platform. If the dormitory has existing users or products, the server may prevent deletion.
                </p>
                <div className="flex items-start gap-3 rounded-lg border border-border bg-secondary/30 p-3">
                  <Checkbox
                    checked={deleteConfirmChecked}
                    onCheckedChange={(v) => setDeleteConfirmChecked(Boolean(v))}
                  />
                  <div className="space-y-1">
                    <p className="text-xs font-medium text-foreground">I understand this action cannot be undone.</p>
                    <p className="text-xs text-muted-foreground">
                      Proceeding will attempt to delete the dormitory and its associations. If users or products exist, deletion may be blocked.
                    </p>
                  </div>
                </div>
              </div>
              <DialogFooter className="gap-2">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)} disabled={isDeleting}>
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  disabled={!deleteConfirmChecked || isDeleting}
                  onClick={async () => {
                    if (!admin || !id) {
                      toast.error('Missing admin session or dormitory id');
                      return;
                    }
                    setIsDeleting(true);
                    try {
                      const response = await fetch(`${API_BASE_URL}/api/admin/dormitories/${id}`, {
                        method: 'DELETE',
                        headers: {
                          Authorization: `${admin.tokenType} ${admin.token}`,
                          Accept: 'application/json',
                        },
                      });
                      const data: { message?: string; deleted_id?: number | string } | undefined = await response.json().catch(() => undefined);
                      if (!response.ok) {
                        const message =
                          data?.message ??
                          (response.status === 404
                            ? 'Dormitory not found.'
                            : response.status === 403
                            ? 'Unauthorized: Only administrators can access this endpoint.'
                            : response.status === 409
                            ? 'Cannot delete dormitory due to existing related records.'
                            : 'Failed to delete dormitory');
                        toast.error(message);
                        setIsDeleting(false);
                        return;
                      }
                      toast.success(data?.message ?? 'Dormitory deleted successfully');
                      setIsDeleteDialogOpen(false);
                      navigate('/dormitories');
                    } catch {
                      toast.error('Failed to delete dormitory');
                    } finally {
                      setIsDeleting(false);
                    }
                  }}
                >
                  Confirm Delete
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl border border-border bg-card p-4">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{s.label}</p>
                <div className="text-primary">{s.icon}</div>
              </div>
              <p className="mt-2 text-lg font-semibold text-foreground">{s.value}</p>
            </div>
          ))}
        </div>

        <div className="columns-1 md:columns-2 xl:columns-3 gap-6">
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Dormitory Overview</h3>
                <Badge variant="outline">Marketplace Partner</Badge>
              </div>
              <p className="text-sm text-muted-foreground mb-4">{description}</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Domain</p>
                  <div className="flex items-center gap-2 text-primary">
                    <Globe className="w-4 h-4" />
                    <span>{domain}</span>
                  </div>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Added to Platform</p>
                  <p className="text-foreground">{profile.createdAt}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Address</p>
                  <p className="text-foreground">{profile.address}</p>
                </div>
                <div className="space-y-1">
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">University</p>
                  <Button variant="link" className="h-auto p-0 text-sm" onClick={() => navigate(`/university/${profile.universityId}`)}>
                    {profile.universityName}
                  </Button>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6 min-h-[500px]">
              <h3 className="text-lg font-semibold text-foreground mb-1">Residents Breakdown</h3>
              <p className="text-sm text-muted-foreground mb-4">Verified, unverified, and not-on-platform residents. Thickness encodes share.</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={[{ name: 'placeholder', value: 1 }]}
                      dataKey="value"
                      nameKey="name"
                      cx="50%"
                      cy="50%"
                      innerRadius={baseInner}
                      outerRadius={baseInner}
                      startAngle={0}
                      endAngle={360}
                      fill="transparent"
                      stroke="none"
                      isAnimationActive={false}
                    />
                    {pieSlices.map((s, i) => (
                      <Pie
                        key={`slice-${i}`}
                        data={[{ name: s.name, value: s.value }]}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={baseInner}
                        outerRadius={hoverIndex === i ? s.outerRadius + 12 : s.outerRadius}
                        startAngle={s.startAngle}
                        endAngle={s.endAngle}
                        stroke="none"
                        label={renderSliceLabel}
                        labelLine={false}
                        {...(hoverIndex === i ? { activeIndex: 0, activeShape: renderActiveShape } : {})}
                        onMouseEnter={() => setHoverIndex(i)}
                        onMouseLeave={() => setHoverIndex(-1)}
                        isAnimationActive
                        animationDuration={800}
                        animationEasing="ease-out"
                      >
                        <Cell fill={pieColors[i % pieColors.length]} stroke="none" />
                      </Pie>
                    ))}
                  </PieChart>
                </ResponsiveContainer>
                <div className="mt-3 text-xs sm:text-sm text-muted-foreground">
                  {hoverIndex >= 0 ? (
                    <div className="flex items-center gap-2">
                      <span
                        className="inline-block h-2 w-2 rounded"
                        style={{ backgroundColor: pieColors[hoverIndex % pieColors.length] }}
                      />
                      <span className="text-foreground">{pieSlices[hoverIndex].name}</span>
                      <span>— {sliceDescriptions[pieSlices[hoverIndex].name] ?? 'Slice details'}</span>
                    </div>
                  ) : (
                    <span>Hover a slice to see details.</span>
                  )}
                </div>
              </div>
            </div>
 
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-1">Category Distribution</h3>
              <p className="text-sm text-muted-foreground mb-4">Top categories by listing count.</p>
              <div className="h-[280px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={categoryData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                    <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={12} />
                    <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(222 47% 8%)', border: '1px solid hsl(214 20% 88%)' }} />
                    <Bar dataKey="count" fill="#0992C2" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
 
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Recent Listings</h3>
              <div className="space-y-3">
                <DataTable<RecentListing>
                  columns={[
                    { header: 'Title', accessorKey: 'title' },
                    { header: 'Seller', accessorKey: 'seller' },
                    { header: 'Created', accessorKey: 'createdAt' },
                  ]}
                  data={recentListings}
                  onRowClick={(row) => navigate(`/products/${row.id}`)}
                />
              </div>
            </div>
 
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Dormitory Data</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Dormitory Name</Label>
                  <Input value={profile.name} onChange={(e) => setProfile({ ...profile, name: e.target.value })} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Address</Label>
                  <Input value={profile.address} onChange={(e) => setProfile({ ...profile, address: e.target.value })} className="bg-secondary/50" />
                  <div className="flex items-center justify-between gap-3 mt-2">
                    <Button
                      type="button"
                      variant="outline"
                      className={selectedPosition ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/40 text-muted-foreground'}
                      onClick={() => setIsLocationPickerOpen((v) => !v)}
                    >
                      {selectedPosition ? 'Location selected' : 'Set location'}
                    </Button>
                    {selectedPosition ? (
                      <span className="text-xs text-muted-foreground">
                        {selectedPosition[0].toFixed(5)}, {selectedPosition[1].toFixed(5)}
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">No location selected</span>
                    )}
                  </div>
                  {isLocationPickerOpen && (
                    <>
                      <div className="h-[320px] rounded-lg overflow-hidden border border-border mt-2">
                        {AMAP_JS_KEY && AMAP_SECURITY_CODE ? (
                          <div ref={mapContainerRef} className="h-full w-full" />
                        ) : (
                          <div className="flex h-full items-center justify-center text-sm text-muted-foreground">Missing AMap keys.</div>
                        )}
                      </div>
                      <div className="rounded-lg border border-border bg-secondary/30 p-3 mt-3">
                        <p className="text-xs font-medium text-foreground">Suggested address</p>
                        {addressSuggestions.length === 0 ? (
                          <p className="text-xs text-muted-foreground">
                            {selectedPosition ? 'No address suggestions found for this location.' : 'Click on the map to generate address suggestions.'}
                          </p>
                        ) : (
                          <div className="mt-2 space-y-2">
                            {pagedSuggestions.map((item, index) => (
                              <button
                                key={`addr-suggestion-${index}`}
                                type="button"
                                className="w-full text-left rounded-md border border-border bg-card px-3 py-2 hover:border-primary hover:bg-primary/5"
                                onClick={() => {
                                  setProfile({ ...profile, address: item.text });
                                  setSelectedAddress(item.text);
                                  setSelectedPosition([item.location.lat, item.location.lng]);
                                }}
                              >
                                <span className="block text-xs text-muted-foreground">{item.text}</span>
                                <span className="block text-[10px] text-muted-foreground/70">
                                  {item.location.lat.toFixed(5)}, {item.location.lng.toFixed(5)}
                                </span>
                              </button>
                            ))}
                            <div className="flex items-center justify-between pt-2">
                              <Button variant="outline" size="sm" disabled={suggestionsPage <= 1} onClick={() => setSuggestionsPage((p) => Math.max(1, p - 1))}>
                                Prev
                              </Button>
                              <span className="text-xs text-muted-foreground">
                                Page {suggestionsPage} / {totalSuggestionPages}
                              </span>
                              <Button
                                variant="outline"
                                size="sm"
                                disabled={suggestionsPage >= totalSuggestionPages}
                                onClick={() => setSuggestionsPage((p) => Math.min(totalSuggestionPages, p + 1))}
                              >
                                Next
                              </Button>
                            </div>
                          </div>
                        )}
                        <div className="flex items-center justify-end gap-2 mt-3">
                          <Button variant="outline" size="sm" onClick={() => setIsLocationPickerOpen(false)}>
                            Close
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => {
                              if (selectedAddress) {
                                setProfile({ ...profile, address: selectedAddress });
                              }
                              setIsLocationPickerOpen(false);
                            }}
                          >
                            Use Selected Location
                          </Button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input
                    value={domain}
                    onChange={(e) => {
                      const value = e.target.value.trim();
                      setDomain(value);
                      if (value) {
                        setWebsite(/^https?:\/\//.test(value) ? value : `https://${value}`);
                      } else {
                        setWebsite('');
                      }
                    }}
                    className="bg-secondary/50"
                    placeholder="e.g. dorm.example.edu"
                  />
                </div>
                <Button
                  onClick={async () => {
                    if (!admin || !id) {
                      toast.error('Missing admin session or dormitory id');
                      return;
                    }
                    const payload: Record<string, unknown> = {};
                    const name = profile.name?.trim();
                    const domainStr = domain?.trim();
                    const addressStr = profile.address?.trim();
                    const descStr = description?.trim();
                    if (name) payload.name = name;
                    if (domainStr) payload.domain = domainStr;
                    if (Number.isFinite(selectedPosition?.[0]) && Number.isFinite(selectedPosition?.[1])) {
                      payload.latitude = selectedPosition![0];
                      payload.longitude = selectedPosition![1];
                    }
                    if (addressStr) payload.address = addressStr;
                    if (descStr) payload.description = descStr;
                    try {
                      const response = await fetch(`${API_BASE_URL}/api/admin/dormitories/${id}`, {
                        method: 'PATCH',
                        headers: {
                          Authorization: `${admin.tokenType} ${admin.token}`,
                          Accept: 'application/json',
                          'Content-Type': 'application/json',
                        },
                        body: JSON.stringify(payload),
                      });
                      const data:
                        | {
                            message?: string;
                            dormitory?: {
                              id?: number | string;
                              name?: string | null;
                              domain?: string | null;
                              latitude?: number | string | null;
                              longitude?: number | string | null;
                              address?: string | null;
                              description?: string | null;
                            };
                            errors?: Record<string, string[]>;
                          }
                        | undefined = await response.json().catch(() => undefined);
                      if (!response.ok) {
                        const message =
                          data?.message ??
                          (response.status === 422
                            ? 'Validation Error'
                            : response.status === 404
                            ? 'Dormitory not found.'
                            : response.status === 403
                            ? 'Unauthorized: Only administrators can access this endpoint.'
                            : 'Failed to update dormitory');
                        toast.error(message);
                        return;
                      }
                      const d = data?.dormitory;
                      if (d) {
                        const lat = Number(d.latitude);
                        const lng = Number(d.longitude);
                        setProfile((prev) => ({
                          ...prev,
                          name: (d.name ?? prev.name) || prev.name,
                          address: (d.address ?? prev.address) || prev.address,
                        }));
                        const newDomain = (d.domain ?? domain) ?? '';
                        setDomain(newDomain);
                        if (newDomain) {
                          setWebsite(/^https?:\/\//.test(newDomain) ? newDomain : `https://${newDomain}`);
                        }
                        setDescription((d.description ?? description) || description);
                        if (Number.isFinite(lat) && Number.isFinite(lng)) {
                          setSelectedPosition([lat, lng]);
                        }
                      }
                      toast.success(data?.message ?? 'Dormitory updated successfully');
                    } catch {
                      toast.error('Failed to update dormitory');
                    }
                  }}
                  className="gradient-primary text-primary-foreground"
                >
                  Save Changes
                </Button>
              </div>
            </div>
 
            <div className="bg-card rounded-xl border border-border p-6 break-inside-avoid mb-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Highlights</h3>
                <Badge variant="outline">Dorm Insights</Badge>
              </div>
              <div className="grid grid-cols-1 gap-3 text-sm">
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <span>Occupancy rate</span>
                  <span className="text-foreground">{Math.round((profile.occupancy / Math.max(1, profile.capacity)) * 100)}%</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <span>Active listings</span>
                  <span className="text-foreground">37</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <span>Top category</span>
                  <span className="text-foreground">{topCategory}</span>
                </div>
              </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
