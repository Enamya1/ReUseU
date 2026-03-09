import React, { useEffect, useMemo, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { MapPin, ShieldCheck, Star, MessageCircle, CalendarClock, BadgeCheck } from 'lucide-react';
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
    { icon: ShieldCheck, title: 'Verified student', subtitle: 'Campus email verified' },
    { icon: Star, title: 'Top seller', subtitle: 'Consistent 5★ reviews' },
    { icon: BadgeCheck, title: 'Safe trading', subtitle: 'No reports in last 12 months' },
  ];

  return (
    <MainLayout
      headerClassName="bg-white/90 backdrop-blur border-b border-slate-200 mix-blend-normal text-slate-900 shadow-sm [&_a]:text-slate-900 [&_a]:border-slate-300 [&_a:hover]:text-slate-950 [&_a:hover]:bg-slate-900/5 [&_button]:text-slate-900 [&_button]:border-slate-200 [&_button:hover]:bg-slate-900/5 [&_svg]:text-slate-900 [&_input]:bg-white [&_input]:border-slate-200 [&_input]:text-slate-900 [&_input]:placeholder:text-slate-400 [&_input:focus-visible]:ring-slate-300"
      floatingButtonClassName="floating-button-light"
    >
      <div className="bg-white text-slate-900">
        <div className="border-b border-slate-200">
          <div className="container py-10 md:py-14">
            <div className="flex flex-col gap-8 lg:flex-row lg:items-end lg:justify-between">
              <div className="flex flex-col gap-6">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
                  <span>Public profile</span>
                  <span className="h-1 w-1 rounded-full bg-slate-300" />
                  <span>Marketplace seller</span>
                </div>
                <div className="flex flex-col gap-6 md:flex-row md:items-center">
                  <div className="relative">
                    <Avatar className="h-28 w-28 border-4 border-white shadow-md">
                      <AvatarImage src={normalizeImageUrl(displaySeller.profile_picture)} alt={displaySeller.full_name} />
                      <AvatarFallback className="bg-slate-100 text-slate-700 text-3xl">
                        {displaySeller.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -bottom-2 -right-2 flex h-9 w-9 items-center justify-center rounded-full bg-emerald-500 text-white shadow-lg">
                      <ShieldCheck className="h-4 w-4" />
                    </span>
                  </div>
                  <div>
                    <h1 className="text-3xl font-display font-bold">{displaySeller.full_name}</h1>
                    <div className="mt-2 flex flex-wrap items-center gap-3 text-sm text-slate-600">
                      <span>@{displaySeller.username}</span>
                      {dormitory ? (
                        <>
                          <span className="h-1 w-1 rounded-full bg-slate-300" />
                          <span className="flex items-center gap-1">
                            <MapPin className="h-4 w-4" />
                            {dormitory.location || dormitory.dormitory_name}
                          </span>
                        </>
                      ) : null}
                    </div>
                    <div className="mt-4 flex flex-wrap items-center gap-2">
                      {sellerProfile?.email_verified === true ? (
                        <Badge className="bg-emerald-100 text-emerald-700 border-0">Verified</Badge>
                      ) : null}
                      {sellerProfile?.email_verified === false ? (
                        <Badge className="bg-rose-100 text-rose-700 border-0">Unverified</Badge>
                      ) : null}
                      <Badge className="bg-slate-100 text-slate-700 border-0">Fast responder</Badge>
                      <Badge className="bg-slate-100 text-slate-700 border-0">Trusted seller</Badge>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <Button className="gap-2">
                  <MessageCircle className="h-4 w-4" />
                  Message seller
                </Button>
              </div>
            </div>
          </div>
        </div>

        <div className="container py-10 md:py-12 space-y-10">
          {profileStatusMessage ? (
            <div className="rounded-2xl border border-slate-200 bg-white p-4 text-sm text-slate-600">
              {profileStatusMessage}
            </div>
          ) : null}
          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                {highlights.map((item) => (
                  <div key={item.title} className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                    <div className="flex items-start gap-3">
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                        <item.icon className="h-5 w-5" />
                      </span>
                      <div>
                        <p className="text-sm font-semibold text-slate-900">{item.title}</p>
                        <p className="text-sm text-slate-500">{item.subtitle}</p>
                      </div>
                    </div>
                  </div>
                ))}
                <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
                  <div className="flex items-start gap-3">
                    <span className="flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-700">
                      <CalendarClock className="h-5 w-5" />
                    </span>
                    <div>
                      <p className="text-sm font-semibold text-slate-900">Member since</p>
                      <p className="text-sm text-slate-500">{sellerProfile?.member_since || 'September 2023'}</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-slate-900">About</h2>
                    <p className="text-sm text-slate-500">Public profile details visible to other users.</p>
                  </div>
                  <Link to="/messages" className="text-sm font-semibold text-primary hover:text-primary/80">
                    Contact
                  </Link>
                </div>
                <p className="text-sm text-slate-600 leading-relaxed">
                  {sellerProfile?.bio ||
                    displaySeller.bio ||
                    'I focus on clean, well-maintained items and quick campus meetups. Happy to answer questions and share more photos.'}
                </p>
                <div className="grid gap-4 md:grid-cols-2 text-sm text-slate-600">
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Campus</p>
                    <p className="font-medium text-slate-900">{dormitory?.domain ?? 'State University'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Dorm</p>
                    <p className="font-medium text-slate-900">{dormitory?.dormitory_name ?? 'Maple Hall'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Timezone</p>
                    <p className="font-medium text-slate-900">{displaySeller.timezone ?? 'UTC+8 (Asia/Shanghai)'}</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs uppercase tracking-[0.2em] text-slate-400">Language</p>
                    <p className="font-medium text-slate-900">{languageLabel}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Performance</h3>
                <div className="mt-5 grid gap-4">
                  {stats.map((stat) => (
                    <div key={stat.label} className="flex items-center justify-between">
                      <span className="text-sm text-slate-500">{stat.label}</span>
                      <span className="numeric-text text-lg font-semibold text-slate-900">{stat.value}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
                <h3 className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-500">Public info</h3>
                <div className="mt-4 space-y-3 text-sm text-slate-600">
                  <div className="flex items-center justify-between">
                    <span>Average response</span>
                    <span className="numeric-text font-medium text-slate-900">32 min</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Meetup preference</span>
                    <span className="font-medium text-slate-900">Campus lobby</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Negotiation</span>
                    <span className="font-medium text-slate-900">Open to offers</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Last active</span>
                    <span className="font-medium text-slate-900">{sellerProfile?.last_login || 'Today'}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-2xl font-display font-bold text-slate-900">Listings by {displaySeller.full_name}</h2>
              <span className="numeric-text text-sm text-slate-500">
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
