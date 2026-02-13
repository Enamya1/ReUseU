import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { universities } from '@/lib/dummyData';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { StatCard } from '@/components/ui/stat-card';
import { ArrowLeft, Building2, Globe, GraduationCap, Image, Mail, MapPin, Phone, ShoppingBag, Star, Users } from 'lucide-react';

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
  price: string;
  status: 'active' | 'pending' | 'sold';
  seller: string;
  createdAt: string;
};

export default function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
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

  const mediaItems: UniversityMedia[] = [
    { id: 'media-1', url: 'https://images.unsplash.com/photo-1503676260728-1c00da094a0b?auto=format&fit=crop&w=900&q=80', label: 'Main campus' },
    { id: 'media-2', url: 'https://images.unsplash.com/photo-1496307042754-b4aa456c4a2d?auto=format&fit=crop&w=900&q=80', label: 'Student center' },
    { id: 'media-3', url: 'https://images.unsplash.com/photo-1462536943532-57a629f6cc60?auto=format&fit=crop&w=900&q=80', label: 'Library hub' },
    { id: 'media-4', url: 'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=900&q=80', label: 'Dormitory row' },
  ];

  const admins: UniversityAdmin[] = [
    { id: 'admin-1', name: 'Maya Chen', role: 'Super Admin', email: 'maya.chen@svu.edu', status: 'active' },
    { id: 'admin-2', name: 'Omar Ellis', role: 'Marketplace Lead', email: 'omar.ellis@svu.edu', status: 'active' },
    { id: 'admin-3', name: 'Lina Patel', role: 'Safety Moderator', email: 'lina.patel@svu.edu', status: 'pending' },
  ];

  const listings: UniversityListing[] = [
    { id: 'list-1', title: 'Engineering Textbooks Bundle', price: '$85', status: 'active', seller: 'A. Kim', createdAt: '2026-02-10' },
    { id: 'list-2', title: 'Dorm Mini Fridge', price: '$65', status: 'pending', seller: 'J. Park', createdAt: '2026-02-11' },
    { id: 'list-3', title: 'Studio Headphones', price: '$120', status: 'sold', seller: 'R. Gomez', createdAt: '2026-02-08' },
  ];

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
            <Button variant="outline">Preview Listing</Button>
            <Button variant="outline">Disable University</Button>
            <Button>Save Changes</Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Users" value="1,248" icon={<Users className="w-6 h-6" />} />
          <StatCard title="Live Listings" value="326" icon={<ShoppingBag className="w-6 h-6" />} />
          <StatCard title="Dormitories" value="18" icon={<Building2 className="w-6 h-6" />} />
          <StatCard title="Trust Score" value="4.8" icon={<Star className="w-6 h-6" />} />
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
              <div className="flex items-center gap-2 mb-4">
                <Image className="w-5 h-5 text-primary" />
                <h3 className="text-lg font-semibold text-foreground">Campus Media</h3>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {mediaItems.map((item) => (
                  <div key={item.id} className="overflow-hidden rounded-lg border border-border">
                    <img src={item.url} alt={item.label} className="h-40 w-full object-cover" />
                    <div className="px-3 py-2 text-xs text-muted-foreground">{item.label}</div>
                  </div>
                ))}
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
                    <div className="flex items-center gap-3">
                      <span className="text-sm text-foreground">{listing.price}</span>
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
                    </div>
                  </div>
                ))}
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
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-2">
                    <Label htmlFor="university-lat">Latitude</Label>
                    <Input
                      id="university-lat"
                      value={profile.latitude}
                      onChange={(event) => setProfile((prev) => ({ ...prev, latitude: event.target.value }))}
                      className="bg-secondary/50"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="university-lng">Longitude</Label>
                    <Input
                      id="university-lng"
                      value={profile.longitude}
                      onChange={(event) => setProfile((prev) => ({ ...prev, longitude: event.target.value }))}
                      className="bg-secondary/50"
                    />
                  </div>
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
                  <span className="text-foreground">$42.80</span>
                </div>
                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/30 px-4 py-3">
                  <span>Dispute resolution</span>
                  <span className="text-foreground">98% in 24h</span>
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
