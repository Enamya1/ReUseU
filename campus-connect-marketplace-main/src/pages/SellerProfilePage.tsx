import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Star, MessageCircle, CalendarClock, BadgeCheck, TrendingUp, Package, Award } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import ProductGrid from '@/components/products/ProductGrid';
import { type Dormitory, type Product, type User } from '@/lib/mockData';
import { normalizeImageUrl } from '@/lib/api';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

type SellerProfileSeller = {
  id?: number;
  name?: string;
  profile_picture?: string | null;
  email_verified?: boolean;
  member_since?: string;
  dorm_name?: string;
  uni_name?: string;
  uni_address?: string;
  bio?: string;
  language?: string;
  timezone?: string;
  last_login?: string;
  listed_products_count?: number;
  sales_count?: number;
  average_condition_level?: number;
};

const SellerProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated, getSellerProfile } = useAuth();
  const [sellerProfile, setSellerProfile] = useState<SellerProfileSeller | null>(null);
  const [seller, setSeller] = useState<User | null>(null);
  const [dormitory, setDormitory] = useState<Dormitory | null>(null);
  const [sellerProducts, setSellerProducts] = useState<Product[]>([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [errorState, setErrorState] = useState<'not_found' | 'error' | null>(null);

  const sellerId = useMemo(() => {
    const parsed = Number(id);
    return Number.isFinite(parsed) ? parsed : null;
  }, [id]);

  const displaySeller = useMemo<User>(() => {
    if (seller) return seller;
    const fallbackId = sellerId ?? 0;
    return {
      id: fallbackId,
      full_name: 'Seller',
      username: fallbackId ? `seller-${fallbackId}` : 'seller',
      email: '',
      role: 'user',
      status: 'active',
    };
  }, [seller, sellerId]);

  const stats = useMemo(() => {
    const listedCount = sellerProfile?.listed_products_count ?? totalProducts ?? sellerProducts.length;
    const averageCondition =
      typeof sellerProfile?.average_condition_level === 'number'
        ? sellerProfile.average_condition_level.toFixed(1)
        : '—';
    const salesCount = typeof sellerProfile?.sales_count === 'number' ? sellerProfile.sales_count : 0;
    return [
      { label: 'Listings', value: String(listedCount) },
      { label: 'Average condition level', value: averageCondition },
      { label: 'Response', value: '< 1 hr' },
      { label: 'Sales', value: String(salesCount) },
    ];
  }, [sellerProfile, sellerProducts.length, totalProducts]);

  const profileStatusMessage = useMemo(() => {
    if (isLoading) return 'Loading seller profile...';
    if (errorState === 'not_found') return 'Seller not found.';
    if (errorState === 'error') return 'Unable to load seller profile.';
    return null;
  }, [errorState, isLoading]);

  const languageLabel = useMemo(() => {
    const raw = (sellerProfile?.language || displaySeller.language || '').trim();
    if (!raw) return 'English, 中文';
    const normalized = raw.toLowerCase();
    const mapped: Record<string, string> = {
      en: 'English',
      zh: 'Chinese',
      'zh-cn': 'Chinese (Simplified)',
      'zh-hans': 'Chinese (Simplified)',
      'zh-tw': 'Chinese (Traditional)',
      'zh-hant': 'Chinese (Traditional)',
      es: 'Spanish',
      fr: 'French',
      de: 'German',
      it: 'Italian',
      pt: 'Portuguese',
      ru: 'Russian',
      ja: 'Japanese',
      ko: 'Korean',
      ar: 'Arabic',
      hi: 'Hindi',
    };
    return mapped[normalized] || raw;
  }, [displaySeller.language, sellerProfile?.language]);

  useEffect(() => {
    if (!sellerId) {
      setSeller(null);
      setDormitory(null);
      setSellerProducts([]);
      setSellerProfile(null);
      setTotalProducts(0);
      setIsLoading(false);
      return;
    }
    if (!isAuthenticated) {
      toast({
        title: 'Login required',
        description: 'Please log in to view seller profiles.',
      });
      navigate('/login');
      return;
    }

    let cancelled = false;
    setIsLoading(true);
    const run = async () => {
      try {
        const data = await getSellerProfile(sellerId, { page: 1, page_size: 10 });
        if (cancelled) return;
        if (!data.seller) {
          setErrorState('not_found');
          setSeller(null);
          setDormitory(null);
          setSellerProducts([]);
          setSellerProfile(null);
          setTotalProducts(0);
          return;
        }

        const profile = data.seller;
        const normalizedName = profile.name?.trim() || `Seller ${sellerId}`;
        const slug = normalizedName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, '-')
          .replace(/(^-|-$)/g, '');
        const mappedSeller: User = {
          id: profile.id ?? sellerId,
          full_name: normalizedName,
          username: slug || `seller-${sellerId}`,
          email: '',
          profile_picture: profile.profile_picture ?? undefined,
          bio: profile.bio ?? undefined,
          language: profile.language ?? undefined,
          timezone: profile.timezone ?? undefined,
          dormitory_id: 0,
          role: 'user',
          status: 'active',
        };

        const mappedDormitory: Dormitory | null = profile.dorm_name || profile.uni_name || profile.uni_address
          ? {
              id: 0,
              dormitory_name: profile.dorm_name || '',
              domain: profile.uni_name || profile.uni_address || '',
              location: profile.uni_address || undefined,
              lat: undefined,
              lng: undefined,
              is_active: true,
              university_id: 0,
            }
          : null;

        const mappedProducts = (data.products || []).map((item, index) => {
          const productId = typeof item.id === 'number' ? item.id : index + 1;
          const thumbnailUrl = normalizeImageUrl(item.image_thumbnail_url) || item.image_thumbnail_url || undefined;
          const images = thumbnailUrl
            ? [
                {
                  id: 0,
                  product_id: productId,
                  image_url: thumbnailUrl,
                  image_thumbnail_url: thumbnailUrl,
                  is_primary: true,
                },
              ]
            : [];
          const productDormitory =
            item.location?.dormitory_name || typeof item.location?.latitude === 'number'
              ? {
                  id: 0,
                  dormitory_name: item.location?.dormitory_name || '',
                  domain: '',
                  location: undefined,
                  lat: item.location?.latitude,
                  lng: item.location?.longitude,
                  is_active: true,
                  university_id: 0,
                }
              : undefined;
          const conditionLevel = item.condition_name
            ? {
                id: 0,
                name: item.condition_name,
                sort_order: 0,
              }
            : undefined;

          return {
            id: productId,
            seller_id: mappedSeller.id,
            seller: mappedSeller,
            dormitory_id: productDormitory?.id ?? 0,
            dormitory: productDormitory,
            category_id: 0,
            condition_level_id: 0,
            title: item.name || 'Untitled',
            description: undefined,
            price: typeof item.price === 'number' ? item.price : 0,
            currency: typeof item.currency === 'string' ? item.currency : undefined,
            status: 'available',
            is_promoted: false,
            created_at: new Date().toISOString(),
            images,
            tags: [],
            condition_level: conditionLevel,
          } as Product;
        });

        setSellerProfile(profile);
        setSeller(mappedSeller);
        setDormitory(mappedDormitory);
        setSellerProducts(mappedProducts);
        setTotalProducts(typeof data.total === 'number' ? data.total : mappedProducts.length);
        setErrorState(null);
      } catch (error) {
        if (cancelled) return;
        const maybe = error as { message?: string } | undefined;
        const message = maybe?.message?.toLowerCase() || '';
        if (message.includes('unauthorized') || message.includes('unauthenticated')) {
          toast({
            title: 'Login required',
            description: maybe?.message || 'Please log in to view seller profiles.',
          });
          navigate('/login');
          return;
        }
        if (message.includes('not found')) {
          setErrorState('not_found');
          return;
        }
        setErrorState('error');
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [getSellerProfile, isAuthenticated, navigate, sellerId]);

  const highlights = [
    { icon: ShieldCheck, title: 'Verified student', subtitle: 'Campus email verified', color: 'bg-primary text-primary-foreground' },
    { icon: Award, title: 'Top seller', subtitle: 'Consistent 5★ reviews', color: 'bg-secondary text-secondary-foreground' },
    { icon: BadgeCheck, title: 'Safe trading', subtitle: 'No reports in last 12 months', color: 'bg-muted text-muted-foreground' },
  ];

  return (
    <MainLayout
      headerClassName="bg-background/90 backdrop-blur mix-blend-normal text-foreground shadow-sm"
      floatingButtonClassName="floating-button-light"
    >
      <div className="bg-background text-foreground">
        {/* Hero Section with Gradient */}
        <div className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-background" />
          <div className="container relative py-10 md:py-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-muted-foreground">
                  <span>Public profile</span>
                  <span className="h-1 w-1 rounded-full bg-border" />
                  <span>Marketplace seller</span>
                </div>
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="relative">
                    <Avatar className="h-28 w-28 shadow-lg">
                      <AvatarImage src={normalizeImageUrl(displaySeller.profile_picture)} alt={displaySeller.full_name} />
                      <AvatarFallback className="bg-muted text-muted-foreground text-3xl font-display">
                        {displaySeller.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-display font-bold text-foreground">{displaySeller.full_name}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
                      <span className="text-foreground/80">@{displaySeller.username}</span>
                      {dormitory ? (
                        <>
                          <span className="h-1 w-1 rounded-full bg-border" />
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {dormitory.location || dormitory.dormitory_name}
                          </span>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {sellerProfile?.email_verified === true ? (
                        <Badge className="bg-primary text-primary-foreground border-0 hover:bg-primary/90">Verified</Badge>
                      ) : null}
                      {sellerProfile?.email_verified === false ? (
                        <Badge variant="secondary" className="border-0">Unverified</Badge>
                      ) : null}
                      <Badge variant="secondary" className="border-0">Fast responder</Badge>
                      <Badge variant="outline" className="text-foreground">Trusted seller</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90">
                  <MessageCircle className="h-4 w-4" />
                  Message seller
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-10 md:py-12 space-y-10">
          {profileStatusMessage ? (
            <div className="rounded-2xl bg-card p-4 text-sm text-muted-foreground">
              {profileStatusMessage}
            </div>
          ) : null}
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              {/* Highlights Grid */}
              <div className="grid gap-4 md:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item.title} className="group rounded-2xl bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                    <div className="flex items-start gap-3">
                      <span className={`flex h-10 w-10 items-center justify-center rounded-full ${item.color} transition-transform group-hover:scale-110`}>
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-foreground">{item.title}</p>
                        <p className="text-sm text-muted-foreground">{item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="group rounded-2xl bg-card p-5 shadow-sm hover:shadow-md transition-all duration-300 hover:-translate-y-0.5">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-hover:scale-110">
                      <CalendarClock className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-foreground">Member since</p>
                      <p className="text-sm text-muted-foreground">{sellerProfile?.member_since || 'September 2023'}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* About Card */}
              <div className="rounded-2xl bg-card p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-foreground">About</h2>
                    <p className="text-sm text-muted-foreground">Public profile details visible to other users.</p>
                  </div>
                  <Link to="/messages" className="text-sm font-semibold text-primary hover:text-primary/80 transition-colors">
                    Contact
                  </Link>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed">
                  {sellerProfile?.bio ||
                    displaySeller.bio ||
                    'I focus on clean, well-maintained items and quick campus meetups. Happy to answer questions and share more photos.'}
                </p>
                <div className="grid gap-4 md:grid-cols-2 text-sm">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70">Campus</p>
                    <p className="font-medium text-foreground">{dormitory?.domain ?? 'State University'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70">Dorm</p>
                    <p className="font-medium text-foreground">{dormitory?.dormitory_name ?? 'Maple Hall'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70">Timezone</p>
                    <p className="font-medium text-foreground">{displaySeller.timezone ?? 'UTC+8 (Asia/Shanghai)'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-muted-foreground/70">Language</p>
                    <p className="font-medium text-foreground">{languageLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Performance Card */}
              <div className="rounded-2xl bg-card p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="h-4 w-4" />
                  Performance
                </h3>
                <div className="mt-5 grid gap-4">
                  {stats.map((stat, index) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">{stat.label}</span>
                      <span className="numeric-text text-lg font-semibold text-foreground">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Public Info Card */}
              <div className="rounded-2xl bg-card p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  Public info
                </h3>
                <div className="mt-4 space-y-3 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Average response</span>
                    <span className="numeric-text font-medium text-foreground">32 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Meetup preference</span>
                    <span className="font-medium text-foreground">Campus lobby</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Negotiation</span>
                    <span className="font-medium text-foreground">Open to offers</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-muted-foreground">Last active</span>
                    <span className="font-medium text-foreground">{sellerProfile?.last_login || 'Today'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Listings Section */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-foreground">Listings by {displaySeller.full_name}</h2>
              <span className="numeric-text text-sm text-muted-foreground">
                {typeof totalProducts === 'number' ? totalProducts : sellerProducts.length} items
              </span>
            </div>
            <ProductGrid products={sellerProducts} getProductLink={(item) => `/product/${item.id}`} />
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default SellerProfilePage;
