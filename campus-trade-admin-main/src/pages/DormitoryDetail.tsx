import { useMemo, useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Building2, ArrowLeft, Users, MapPin, Calendar, Globe, CircleDot, ShoppingBag } from 'lucide-react';
import { toast } from 'sonner';
import { Dormitory, categories } from '@/lib/dummyData';
import { DataTable } from '@/components/ui/data-table';
import { Skeleton } from '@/components/ui/skeleton';
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
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    const t = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(t);
  }, []);

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

  const stats = useMemo(
    () => [
      { label: 'Capacity', value: profile.capacity.toLocaleString(), icon: <Building2 className="w-5 h-5" /> },
      { label: 'Residents', value: profile.occupancy.toLocaleString(), icon: <Users className="w-5 h-5" /> },
      { label: 'University', value: profile.universityName, icon: <CircleDot className="w-5 h-5" /> },
      { label: 'Added', value: profile.createdAt, icon: <Calendar className="w-5 h-5" /> },
    ],
    [profile],
  );

  const platformUsers = Math.round(profile.occupancy * 0.7);
  const verifiedUsers = Math.round(platformUsers * 0.6);
  const unverifiedUsers = Math.max(0, platformUsers - verifiedUsers);
  const nonPlatformResidents = Math.max(0, profile.occupancy - platformUsers);
  const pieData = [
    { name: 'Verified', value: verifiedUsers },
    { name: 'Unverified', value: unverifiedUsers },
    { name: 'Not on Platform', value: nonPlatformResidents },
  ];
  const pieColors = ['#0992C2', '#0AC4E0', '#EB4C4C'];

  const categoryData = categories.slice(0, 6).map((c) => ({
    name: c.name,
    count: (c.productCount % 100) + 1,
  }));
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

  const recentListings: RecentListing[] = [
    { id: 'p-1001', title: 'Gaming Chair', seller: 'Alex Kim', createdAt: '2026-01-15' },
    { id: 'p-1002', title: 'Mini Fridge', seller: 'Priya Singh', createdAt: '2026-01-14' },
    { id: 'p-1003', title: 'LED Desk Lamp', seller: 'Diego Lopez', createdAt: '2026-01-13' },
  ];

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
            <div className="bg-card rounded-xl border border-border p-6">
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
              <h3 className="text-lg font-semibold text-foreground mb-4">Admin Notes</h3>
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>Domain</Label>
                  <Input value={domain} onChange={(e) => setDomain(e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Description</Label>
                  <Input value={description} onChange={(e) => setDescription(e.target.value)} className="bg-secondary/50" />
                </div>
                <div className="space-y-2">
                  <Label>Website</Label>
                  <Input value={website} onChange={(e) => setWebsite(e.target.value)} className="bg-secondary/50" />
                </div>
                <Button
                  onClick={() => {
                    toast.success('Saved dummy changes');
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
                  <span className="text-foreground">Furniture</span>
                </div>
              </div>
            </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
