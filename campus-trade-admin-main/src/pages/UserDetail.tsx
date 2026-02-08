import { FormEvent, useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { universities, dormitories, User } from '@/lib/dummyData';
import { ArrowLeft, Mail, Phone, GraduationCap, Building2, ShoppingBag, CheckCircle, XCircle, Save, User as UserIcon, Hash, CalendarDays, Users, Languages, MessageCircle, Send } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const PRODUCT_IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL ?? API_BASE_URL ?? 'http://127.0.0.1:8000';
const PRODUCTS_PAGE_SIZE = 6;
const SEARCH_PAGE_SIZE = 100;

type ApiUser = {
  id: number;
  student_id: string | null;
  full_name: string | null;
  username: string | null;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  email_verified_at: string | null;
  phone_number: string | null;
  profile_picture: string | null;
  bio: string | null;
  date_of_birth: string | null;
  gender: string | null;
  language: string | null;
  timezone: string | null;
  dormitory_id: number | null;
  dormitory: {
    id: number;
    dormitory_name: string;
    university_id: number;
  } | null;
  university: {
    id: number;
    name: string;
  } | null;
  status: 'active' | 'inactive' | 'suspended';
  failed_login_attempts: number | null;
  locked_until: string | null;
  deleted_at: string | null;
  created_at: string | null;
  updated_at: string | null;
  last_login_at: string | null;
  listed_count: number | string | null;
  sold_count: number | string | null;
  sold: number | string | null;
};

type UserResponse = {
  message: string;
  user: ApiUser;
};

type ApiProductTag = {
  id: number;
  name: string;
};

type ApiProduct = {
  id?: number | string;
  product_id?: number | string;
  title: string;
  status: string;
  created_at: string;
  image_url: string | null;
  tags: ApiProductTag[];
};

type ProductsResponse = {
  message: string;
  page: number;
  page_size: number;
  total: number;
  total_pages: number;
  products: ApiProduct[];
};

type ApiMessage = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_username: string;
  message_text: string;
  created_at: string;
};

type MessagesResponse = {
  message: string;
  messages: ApiMessage[];
};

type SendMessageResponse = {
  message: string;
  conversation_id: number;
  message_data?: ApiMessage;
};

type UploadedProduct = {
  id?: string;
  title: string;
  status: 'active' | 'sold' | 'reserved' | 'blocked';
  createdAt: string;
  imageUrl: string;
  tags: string[];
};

type ProductDetailStateProduct = {
  id: string;
  title: string;
  status: 'active' | 'sold' | 'reserved' | 'blocked';
  images: string[];
  tags: string[];
  categoryName: string;
  universityName: string;
  conditionName: string;
  description: string;
  views: number;
  clicks: number;
  favorites: number;
  price: string;
  createdAt: string;
  updatedAt: string;
  sellerName: string;
  sellerId: string;
  sellerAvatar?: string;
  dormitoryName: string;
  pickupAvailable: boolean;
  deliveryAvailable: boolean;
  location: string;
  conditionId?: string;
};

type ChatMessage = {
  id: number | string;
  sender: 'admin' | 'user';
  text: string;
  time: string;
};

const normalizeProductStatus = (status: string | null | undefined): 'active' | 'sold' | 'reserved' | 'blocked' => {
  const normalized = status?.toLowerCase();
  if (normalized === 'block' || normalized === 'blocked') {
    return 'blocked';
  }
  if (normalized === 'sold') {
    return 'sold';
  }
  if (normalized === 'reserved') {
    return 'reserved';
  }
  return 'active';
};

const resolveProductImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return '';
  }
  const baseUrl = PRODUCT_IMAGE_BASE_URL.replace(/\/+$/, '');
  const trimmed = imageUrl.trim().replace(/\\/g, '/');
  const normalizedPath = trimmed.replace(/\/{2,}/g, '/');
  const normalizedHttp = normalizedPath.replace(/^http:\//i, 'http://').replace(/^https:\//i, 'https://');
  if (normalizedHttp.startsWith('http://') || normalizedHttp.startsWith('https://')) {
    try {
      const resolvedUrl = new URL(normalizedHttp);
      if (resolvedUrl.hostname === 'localhost') {
        const base = new URL(baseUrl);
        resolvedUrl.protocol = base.protocol;
        resolvedUrl.host = base.host;
      }
      return resolvedUrl.toString();
    } catch {
      return normalizedHttp;
    }
  }
  if (normalizedPath.startsWith('/')) {
    return `${baseUrl}${normalizedPath}`;
  }
  return `${baseUrl}/${normalizedPath}`;
};

const formatMessageTime = (value: string | null | undefined): string => {
  if (!value) {
    return '';
  }
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) {
    return '';
  }
  return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

const buildProductRouteId = (product: UploadedProduct): string => {
  if (product.id) {
    return product.id;
  }
  const titleSlug = product.title.trim().toLowerCase().replace(/\s+/g, '-');
  return titleSlug || 'details';
};

const buildProductDetailState = (product: UploadedProduct, user: User): ProductDetailStateProduct => ({
  id: product.id ?? buildProductRouteId(product),
  title: product.title,
  status: product.status,
  images: product.imageUrl ? [product.imageUrl] : [],
  tags: product.tags ?? [],
  categoryName: product.tags[0] ?? 'N/A',
  universityName: user.universityName || 'N/A',
  conditionName: 'N/A',
  description: 'No description available.',
  views: 0,
  clicks: 0,
  favorites: 0,
  price: 'N/A',
  createdAt: product.createdAt,
  updatedAt: product.createdAt,
  sellerName: user.name,
  sellerId: user.id,
  sellerAvatar: user.avatar,
  dormitoryName: user.dormitoryName || 'N/A',
  pickupAvailable: false,
  deliveryAvailable: false,
  location: user.universityName || 'N/A',
  conditionId: undefined,
});

const mapApiProductToUploaded = (product: ApiProduct): UploadedProduct => {
  const resolvedId = product.id ?? product.product_id;
  return {
    id: resolvedId ? String(resolvedId) : undefined,
    title: product.title ?? '',
    status: normalizeProductStatus(product.status),
    createdAt: product.created_at ?? '',
    imageUrl: resolveProductImageUrl(product.image_url),
    tags: product.tags?.map((tag) => tag.name).filter(Boolean) ?? [],
  };
};

const buildUser = (apiUser: ApiUser): User => {
  const dormitory = dormitories.find((item) => item.id === String(apiUser.dormitory_id));
  const dormitoryName = apiUser.dormitory?.dormitory_name ?? dormitory?.name ?? '';
  const dormitoryId = apiUser.dormitory?.id ?? apiUser.dormitory_id;
  const universityIdFromDormitory = apiUser.dormitory?.university_id;
  const universityLookupId = apiUser.university?.id ?? universityIdFromDormitory;
  const university = universityLookupId
    ? universities.find((item) => item.id === String(universityLookupId))
    : undefined;
  const universityName = apiUser.university?.name ?? university?.name ?? dormitory?.universityName ?? 'N/A';
  const universityId = universityLookupId;
  const displayName = apiUser.full_name || apiUser.username || apiUser.email.split('@')[0] || apiUser.email;
  return {
    id: String(apiUser.id),
    email: apiUser.email,
    emailVerified: Boolean(apiUser.email_verified_at),
    name: displayName,
    username: apiUser.username ?? '',
    studentId: apiUser.student_id ?? '',
    dateOfBirth: apiUser.date_of_birth ?? '',
    gender: apiUser.gender ?? '',
    language: apiUser.language ?? '',
    role: apiUser.role,
    status: apiUser.status,
    universityId: universityId ? String(universityId) : '',
    universityName,
    dormitoryId: dormitoryId ? String(dormitoryId) : '',
    dormitoryName,
    phone: apiUser.phone_number ?? '',
    avatar: apiUser.profile_picture ?? '',
    createdAt: apiUser.created_at ?? '',
    lastLogin: apiUser.last_login_at ?? '',
    productsListed: Number(apiUser.listed_count) || 0,
    productsSold: Number(apiUser.sold_count ?? apiUser.sold) || 0,
  };
};

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const [formData, setFormData] = useState<Partial<User>>({});
  const [isEditing, setIsEditing] = useState(false);
  const [profitPeriod, setProfitPeriod] = useState('last6Months');
  const [chatInput, setChatInput] = useState('');
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [chatError, setChatError] = useState<string | null>(null);
  const [chatConversationId, setChatConversationId] = useState<number | null>(null);
  const [isStatusUpdating, setIsStatusUpdating] = useState(false);
  const [productSearch, setProductSearch] = useState('');
  const [tagFilter, setTagFilter] = useState('all');
  const [uploadOrder, setUploadOrder] = useState('latest');
  const [uploadedProducts, setUploadedProducts] = useState<UploadedProduct[]>([]);
  const [productsLoading, setProductsLoading] = useState(true);
  const [productsError, setProductsError] = useState<string | null>(null);
  const [productsPage, setProductsPage] = useState(1);
  const [productsTotalPages, setProductsTotalPages] = useState(1);
  const [productsTotalCount, setProductsTotalCount] = useState(0);
  const [productsPageSize, setProductsPageSize] = useState(PRODUCTS_PAGE_SIZE);
  const [allProducts, setAllProducts] = useState<UploadedProduct[]>([]);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);

  const normalizedProductSearch = productSearch.trim().toLowerCase();
  const shouldSearchAll = normalizedProductSearch.length > 0 || tagFilter !== 'all';
  const avatarUrl = user?.avatar ? resolveProductImageUrl(user.avatar) : '';

  useEffect(() => {
    setProductsPage(1);
  }, [normalizedProductSearch, tagFilter]);

  useEffect(() => {
    if (!admin || !id) {
      return;
    }
    let ignore = false;
    const fetchUser = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data: UserResponse | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.user) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : response.status === 404
              ? 'User not found.'
              : 'Failed to load user';
          if (!ignore) {
            setError(message);
            setUser(null);
          }
          return;
        }
        const mappedUser = buildUser(data.user);
        if (!ignore) {
          setUser(mappedUser);
          setFormData(mappedUser);
        }
      } catch {
        if (!ignore) {
          setError('Failed to load user');
          setUser(null);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    fetchUser();
    return () => {
      ignore = true;
    };
  }, [admin, id]);

  useEffect(() => {
    if (!admin || shouldSearchAll) {
      return;
    }
    let ignore = false;
    const fetchProducts = async () => {
      setProductsLoading(true);
      setProductsError(null);
      try {
        const params = new URLSearchParams();
        params.set('per_page', String(PRODUCTS_PAGE_SIZE));
        params.set('page', String(productsPage));
        params.set('user_id', String(id));
        const response = await fetch(`${API_BASE_URL}/api/admin/products?${params.toString()}`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data: ProductsResponse | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.products) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : response.status === 422
              ? 'Validation Error'
              : 'Failed to load products';
          if (!ignore) {
            setProductsError(message);
            setUploadedProducts([]);
            setProductsTotalCount(0);
            setProductsTotalPages(1);
            setProductsPageSize(PRODUCTS_PAGE_SIZE);
          }
          return;
        }
        const mappedProducts = data.products.map(mapApiProductToUploaded);
        if (!ignore) {
          setUploadedProducts(mappedProducts);
          setProductsTotalCount(Number(data.total) || 0);
          setProductsTotalPages(Number(data.total_pages) || 1);
          setProductsPageSize(Number(data.page_size) || PRODUCTS_PAGE_SIZE);
        }
      } catch {
        if (!ignore) {
          setProductsError('Failed to load products');
          setUploadedProducts([]);
          setProductsTotalCount(0);
          setProductsTotalPages(1);
          setProductsPageSize(PRODUCTS_PAGE_SIZE);
        }
      } finally {
        if (!ignore) {
          setProductsLoading(false);
        }
      }
    };
    fetchProducts();
    return () => {
      ignore = true;
    };
  }, [admin, id, productsPage, shouldSearchAll]);

  useEffect(() => {
    if (!admin || !shouldSearchAll) {
      return;
    }
    let ignore = false;
    const fetchAllProducts = async () => {
      setSearchLoading(true);
      setSearchError(null);
      try {
        const baseParams = new URLSearchParams();
        baseParams.set('per_page', String(SEARCH_PAGE_SIZE));
        baseParams.set('user_id', String(id));
        const firstResponse = await fetch(`${API_BASE_URL}/api/admin/products?${baseParams.toString()}&page=1`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const firstData: ProductsResponse | undefined = await firstResponse.json().catch(() => undefined);
        if (!firstResponse.ok || !firstData?.products) {
          const message =
            firstData && typeof firstData.message === 'string'
              ? firstData.message
              : firstResponse.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : firstResponse.status === 422
              ? 'Validation Error'
              : 'Failed to load products';
          if (!ignore) {
            setSearchError(message);
            setAllProducts([]);
          }
          return;
        }
        const totalPages = Number(firstData.total_pages) || 1;
        const pagePromises = Array.from({ length: Math.max(0, totalPages - 1) }, (_, index) => {
          const page = index + 2;
          return fetch(`${API_BASE_URL}/api/admin/products?${baseParams.toString()}&page=${page}`, {
            method: 'GET',
            headers: {
              Authorization: `${admin.tokenType} ${admin.token}`,
              Accept: 'application/json',
            },
          })
            .then((response) => response.json().catch(() => undefined))
            .catch(() => undefined);
        });
        const restData = await Promise.all(pagePromises);
        const allProductsData = [firstData, ...restData]
          .flatMap((data) => (data && Array.isArray(data.products) ? data.products : []))
          .map(mapApiProductToUploaded);
        if (!ignore) {
          setAllProducts(allProductsData);
        }
      } catch {
        if (!ignore) {
          setSearchError('Failed to load products');
          setAllProducts([]);
        }
      } finally {
        if (!ignore) {
          setSearchLoading(false);
        }
      }
    };
    fetchAllProducts();
    return () => {
      ignore = true;
    };
  }, [admin, id, shouldSearchAll]);

  const baseProducts = shouldSearchAll ? allProducts : uploadedProducts;
  const productTags = Array.from(new Set(baseProducts.flatMap((product) => product.tags))).filter(Boolean).sort();
  const filteredProducts = baseProducts
    .filter((product) => {
      const matchesSearch = !normalizedProductSearch
        || product.title.toLowerCase().includes(normalizedProductSearch)
        || product.tags.some((tag) => tag.toLowerCase().includes(normalizedProductSearch));
      const matchesTag = tagFilter === 'all' || product.tags.includes(tagFilter);
      return matchesSearch && matchesTag;
    })
    .sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return uploadOrder === 'latest' ? dateB - dateA : dateA - dateB;
    });
  const displayTotalPages = shouldSearchAll
    ? Math.max(1, Math.ceil(filteredProducts.length / productsPageSize))
    : productsTotalPages;
  const displayTotalCount = shouldSearchAll ? filteredProducts.length : productsTotalCount || uploadedProducts.length;
  const pagedProducts = shouldSearchAll
    ? filteredProducts.slice((productsPage - 1) * productsPageSize, productsPage * productsPageSize)
    : filteredProducts;
  const isProductsLoading = productsLoading || searchLoading;
  const productsErrorMessage = searchError ?? productsError;
  const pageItems: Array<number | 'ellipsis'> = [];
  if (displayTotalPages <= 7) {
    for (let page = 1; page <= displayTotalPages; page += 1) {
      pageItems.push(page);
    }
  } else {
    const left = Math.max(1, productsPage - 2);
    const right = Math.min(displayTotalPages, productsPage + 2);
    if (left > 1) {
      pageItems.push(1);
      if (left > 2) {
        pageItems.push('ellipsis');
      }
    }
    for (let page = left; page <= right; page += 1) {
      pageItems.push(page);
    }
    if (right < displayTotalPages) {
      if (right < displayTotalPages - 1) {
        pageItems.push('ellipsis');
      }
      pageItems.push(displayTotalPages);
    }
  }

  useEffect(() => {
    if (!isChatOpen || !admin || !id) {
      return;
    }
    let ignore = false;
    const fetchMessages = async () => {
      setIsChatLoading(true);
      setChatError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', '50');
        if (chatConversationId) {
          params.set('conversation_id', String(chatConversationId));
        }
        const response = await fetch(`${API_BASE_URL}/api/admin/messages?${params.toString()}`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data: MessagesResponse | undefined = await response.json().catch(() => undefined);
        if (!response.ok) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : response.status === 422
              ? 'Validation Error'
              : 'Failed to load messages';
          if (!ignore) {
            setChatError(message);
          }
          return;
        }
        const messages = data?.messages ?? [];
        const userId = Number(id);
        const matchedConversationId = !chatConversationId
          ? messages.find(
              (message) =>
                message.sender_id === userId ||
                (user?.username && message.sender_username === user.username),
            )?.conversation_id ?? null
          : null;
        const activeConversationId = chatConversationId ?? matchedConversationId;
        if (!chatConversationId && activeConversationId) {
          setChatConversationId(activeConversationId);
        }
        const filteredMessages = activeConversationId
          ? messages.filter((message) => message.conversation_id === activeConversationId)
          : messages;
        const mappedMessages: ChatMessage[] = filteredMessages.map((message) => ({
          id: message.id,
          sender: message.sender_id === userId ? 'user' : 'admin',
          text: message.message_text,
          time: formatMessageTime(message.created_at),
        }));
        if (!ignore) {
          setChatMessages(mappedMessages);
        }
      } catch {
        if (!ignore) {
          setChatError('Failed to load messages');
        }
      } finally {
        if (!ignore) {
          setIsChatLoading(false);
        }
      }
    };
    fetchMessages();
    return () => {
      ignore = true;
    };
  }, [isChatOpen, admin, id, chatConversationId, user?.username]);

  useEffect(() => {
    if (productsPage > displayTotalPages) {
      setProductsPage(displayTotalPages);
    }
  }, [productsPage, displayTotalPages]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-xl text-muted-foreground mb-4">Loading user...</p>
        </div>
      </DashboardLayout>
    );
  }

  if (error) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-xl text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => navigate('/users')}>Back to Users</Button>
        </div>
      </DashboardLayout>
    );
  }

  if (!user) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-xl text-muted-foreground mb-4">User not found</p>
          <Button onClick={() => navigate('/users')}>Back to Users</Button>
        </div>
      </DashboardLayout>
    );
  }

  const profitDataByPeriod: Record<string, { label: string; profit: number }[]> = {
    '2weeks': [
      { label: 'Mon', profit: 48 },
      { label: 'Tue', profit: 62 },
      { label: 'Wed', profit: 55 },
      { label: 'Thu', profit: 71 },
      { label: 'Fri', profit: 66 },
      { label: 'Sat', profit: 80 },
      { label: 'Sun', profit: 74 },
      { label: 'Mon', profit: 69 },
      { label: 'Tue', profit: 76 },
      { label: 'Wed', profit: 72 },
      { label: 'Thu', profit: 88 },
      { label: 'Fri', profit: 95 },
      { label: 'Sat', profit: 91 },
      { label: 'Sun', profit: 99 },
    ],
    lastMonth: [
      { label: 'Week 1', profit: 260 },
      { label: 'Week 2', profit: 310 },
      { label: 'Week 3', profit: 280 },
      { label: 'Week 4', profit: 340 },
    ],
    last6Months: [
      { label: 'Jan', profit: 120 },
      { label: 'Feb', profit: 180 },
      { label: 'Mar', profit: 140 },
      { label: 'Apr', profit: 260 },
      { label: 'May', profit: 310 },
      { label: 'Jun', profit: 280 },
    ],
    '1year': [
      { label: 'Jan', profit: 120 },
      { label: 'Feb', profit: 180 },
      { label: 'Mar', profit: 140 },
      { label: 'Apr', profit: 260 },
      { label: 'May', profit: 310 },
      { label: 'Jun', profit: 280 },
      { label: 'Jul', profit: 360 },
      { label: 'Aug', profit: 330 },
      { label: 'Sep', profit: 390 },
      { label: 'Oct', profit: 410 },
      { label: 'Nov', profit: 380 },
      { label: 'Dec', profit: 450 },
    ],
  };
  const profitData = profitDataByPeriod[profitPeriod] ?? profitDataByPeriod.last6Months;
  const profitChartConfig = {
    profit: {
      label: 'Profit',
      color: 'hsl(174 72% 50%)',
    },
  };

  const handleSave = () => {
    toast.success('User updated successfully');
    setIsEditing(false);
  };

  const handleStatusToggle = async () => {
    if (isStatusUpdating) {
      return;
    }
    if (!admin || !id) {
      toast.error('Unauthorized: Only administrators can access this endpoint.');
      return;
    }
    if (formData.status !== 'active') {
      toast.error('Activation is not available for this user.');
      return;
    }
    setIsStatusUpdating(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/users/${id}/deactivate`, {
        method: 'PATCH',
        headers: {
          Authorization: `${admin.tokenType} ${admin.token}`,
          Accept: 'application/json',
        },
      });
      const data: { message?: string } | undefined = await response.json().catch(() => undefined);
      if (!response.ok) {
        const message =
          data && typeof data.message === 'string'
            ? data.message
            : response.status === 403
            ? 'Unauthorized: Only administrators can access this endpoint.'
            : response.status === 404
            ? 'User not found.'
            : 'Failed to deactivate user';
        toast.error(message);
        return;
      }
      const updated = { ...formData, status: 'inactive' as const };
      setFormData(updated);
      setUser((prev) => (prev ? { ...prev, status: 'inactive' } : prev));
      toast.success('User deactivated successfully');
    } catch {
      toast.error('Failed to deactivate user');
    } finally {
      setIsStatusUpdating(false);
    }
  };

  const handleChatSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed || !admin || !id || isSendingMessage) {
      return;
    }
    const receiverId = Number(id);
    if (Number.isNaN(receiverId)) {
      setChatError('Invalid user id.');
      return;
    }
    setIsSendingMessage(true);
    setChatError(null);
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/messages`, {
        method: 'POST',
        headers: {
          Authorization: `${admin.tokenType} ${admin.token}`,
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          receiver_id: receiverId,
          message_text: trimmed,
        }),
      });
      const data: SendMessageResponse | undefined = await response.json().catch(() => undefined);
      if (!response.ok) {
        const message =
          data && typeof data.message === 'string'
            ? data.message
            : response.status === 403
            ? 'Unauthorized: Only administrators can access this endpoint.'
            : response.status === 422
            ? 'Validation Error'
            : 'Failed to send message';
        setChatError(message);
        return;
      }
      if (data?.conversation_id) {
        setChatConversationId(data.conversation_id);
      }
      const messageData = data?.message_data;
      const newMessage: ChatMessage = messageData
        ? {
            id: messageData.id,
            sender: messageData.sender_id === receiverId ? 'user' : 'admin',
            text: messageData.message_text,
            time: formatMessageTime(messageData.created_at),
          }
        : {
            id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
            sender: 'admin',
            text: trimmed,
            time: formatMessageTime(new Date().toISOString()),
          };
      setChatMessages((prev) => [...prev, newMessage]);
      setChatInput('');
    } catch {
      setChatError('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => navigate('/users')}
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl font-bold text-foreground">User Details</h1>
            <p className="text-muted-foreground">View and manage user information</p>
          </div>
          <div className="flex items-center gap-2">
            <Dialog open={isChatOpen} onOpenChange={setIsChatOpen}>
              <DialogTrigger asChild>
                <Button variant="outline">
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Chat
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle>Chat with {user.name}</DialogTitle>
                </DialogHeader>
                <div className="flex flex-col gap-4">
                  <div className="max-h-72 overflow-y-auto rounded-lg border border-border bg-secondary/30 p-4 space-y-3">
                    {isChatLoading ? (
                      <p className="text-sm text-muted-foreground">Loading messages...</p>
                    ) : chatError ? (
                      <p className="text-sm text-destructive">{chatError}</p>
                    ) : chatMessages.length === 0 ? (
                      <p className="text-sm text-muted-foreground">No messages yet.</p>
                    ) : (
                      chatMessages.map((message) => (
                        <div
                          key={message.id}
                          className={cn(
                            "flex w-full",
                            message.sender === 'admin' ? "justify-end" : "justify-start"
                          )}
                        >
                          <div
                            className={cn(
                              "max-w-[80%] rounded-lg px-3 py-2 text-sm",
                              message.sender === 'admin'
                                ? "bg-primary text-primary-foreground"
                                : "bg-card text-foreground border border-border"
                            )}
                          >
                            <div className="text-[11px] opacity-70 mb-1">
                              {message.sender === 'admin' ? 'You' : user.name}
                            </div>
                            <div>{message.text}</div>
                            <div className="text-[10px] opacity-70 mt-1 text-right">{message.time}</div>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                  <form className="flex items-center gap-2" onSubmit={handleChatSubmit}>
                    <Input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Type a message..."
                      className="bg-secondary/50"
                      disabled={isSendingMessage}
                    />
                    <Button type="submit" disabled={isSendingMessage}>
                      <Send className="w-4 h-4 mr-2" />
                      {isSendingMessage ? 'Sending...' : 'Send'}
                    </Button>
                  </form>
                </div>
              </DialogContent>
            </Dialog>
            {isEditing ? (
              <>
                <Button variant="outline" onClick={() => setIsEditing(false)}>
                  Cancel
                </Button>
                <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
                  <Save className="w-4 h-4 mr-2" />
                  Save Changes
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)} variant="outline">
                Edit User
              </Button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Profile Card */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex flex-col items-center text-center">
              <div className="w-24 h-24 rounded-full border border-border bg-secondary/50 overflow-hidden flex items-center justify-center mb-4">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={user.name} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-3xl font-bold text-primary">
                    {user.name.split(' ').map(n => n[0]).join('')}
                  </span>
                )}
              </div>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <div className="flex items-center gap-2 text-muted-foreground">
                <span>{user.email}</span>
              </div>
              
              <div className="flex items-center gap-2 mt-4">
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium",
                  formData.status === 'active' && "bg-success/10 text-success",
                  formData.status === 'inactive' && "bg-muted text-muted-foreground",
                  formData.status === 'suspended' && "bg-destructive/10 text-destructive"
                )}>
                  {formData.status}
                </span>
                <span className={cn(
                  "px-3 py-1 rounded-full text-sm font-medium capitalize border",
                  formData.role === 'admin' && "border-primary text-primary",
                  formData.role === 'moderator' && "border-warning text-warning",
                  formData.role === 'user' && "border-muted-foreground text-muted-foreground"
                )}>
                  {formData.role}
                </span>
              </div>

              <div className="w-full border-t border-border my-6" />

              <div className="w-full space-y-4">
                <div className="flex items-center gap-3 text-left">
                  <Mail className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Email</p>
                    <div className="flex items-center gap-2">
                      <p className="text-sm text-foreground">{user.email}</p>
                      <span
                        className={cn(
                          "rounded-full px-2 py-0.5 text-[10px] font-medium",
                          user.emailVerified ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                        )}
                      >
                        {user.emailVerified ? 'Verified' : 'Unverified'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Phone className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Phone</p>
                    <p className="text-sm text-foreground">{user.phone}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <GraduationCap className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">University</p>
                    <p className="text-sm text-foreground">{user.universityName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Building2 className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Dormitory</p>
                    <p className="text-sm text-foreground">{user.dormitoryName}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Hash className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Student ID</p>
                    <p className="text-sm text-foreground">{user.studentId || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <UserIcon className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Username</p>
                    <p className="text-sm text-foreground">{user.username || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <CalendarDays className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Date of Birth</p>
                    <p className="text-sm text-foreground">{user.dateOfBirth || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Users className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Gender</p>
                    <p className="text-sm text-foreground">{user.gender || 'N/A'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 text-left">
                  <Languages className="w-5 h-5 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Language</p>
                    <p className="text-sm text-foreground">{user.language || 'N/A'}</p>
                  </div>
                </div>
              </div>

              <div className="w-full border-t border-border my-6" />

              <Button
                variant={formData.status === 'active' ? 'destructive' : 'default'}
                className="w-full"
                onClick={handleStatusToggle}
                disabled={isStatusUpdating}
              >
                {formData.status === 'active' ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    {isStatusUpdating ? 'Deactivating...' : 'Deactivate User'}
                  </>
                ) : (
                  <>
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Activate User
                  </>
                )}
              </Button>
            </div>
          </div>

          {/* Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Activity Stats */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Activity</h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <ShoppingBag className="w-4 h-4 text-primary" />
                    <span className="text-xs text-muted-foreground">Listed</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{user.productsListed}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <CheckCircle className="w-4 h-4 text-success" />
                    <span className="text-xs text-muted-foreground">Sold</span>
                  </div>
                  <p className="text-2xl font-bold text-foreground">{user.productsSold}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <span className="text-xs text-muted-foreground">Member Since</span>
                  <p className="text-lg font-bold text-foreground mt-1">{user.createdAt}</p>
                </div>
                <div className="bg-secondary/50 rounded-lg p-4">
                  <span className="text-xs text-muted-foreground">Last Login</span>
                  <p className="text-lg font-bold text-foreground mt-1">{user.lastLogin}</p>
                </div>
              </div>
            </div>

            {/* Edit Form */}
            <div className="bg-card rounded-xl border border-border p-6">
              <h3 className="text-lg font-semibold text-foreground mb-4">Profile Information</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    value={formData.name || ''}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    disabled={!isEditing}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email || ''}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    disabled={!isEditing}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="phone">Phone</Label>
                  <Input
                    id="phone"
                    value={formData.phone || ''}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!isEditing}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="role">Role</Label>
                  <Select
                    value={formData.role}
                    onValueChange={(value: 'user' | 'admin' | 'moderator') => setFormData({ ...formData, role: value })}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="user">User</SelectItem>
                      <SelectItem value="moderator">Moderator</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground">
                    <Button
                      type="button"
                      variant="link"
                      className="h-auto p-0 text-sm text-primary"
                      disabled={!user.universityName || user.universityName === 'N/A'}
                      onClick={() => navigate('/universities')}
                    >
                      {user.universityName || 'N/A'}
                    </Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dormitory">Dormitory</Label>
                  <div className="rounded-md border border-border bg-secondary/50 px-3 py-2 text-sm text-foreground">
                    {user.dormitoryName || 'N/A'}
                  </div>
                </div>
              </div>
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Uploaded Products</h3>
                <span className="text-sm text-muted-foreground">
                  Showing {pagedProducts.length} of {displayTotalCount}
                </span>
              </div>
              <div className="flex flex-col gap-3 mb-4">
                <div className="flex flex-col lg:flex-row lg:items-center gap-3">
                  <Input
                    value={productSearch}
                    onChange={(event) => setProductSearch(event.target.value)}
                    placeholder="Search products..."
                    className="bg-secondary/50"
                  />
                  <Select value={tagFilter} onValueChange={setTagFilter}>
                    <SelectTrigger className="w-full lg:w-44 bg-secondary/50">
                      <SelectValue placeholder="All tags" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All tags</SelectItem>
                      {productTags.map((tag) => (
                        <SelectItem key={tag} value={tag}>{tag}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={uploadOrder} onValueChange={setUploadOrder}>
                    <SelectTrigger className="w-full lg:w-44 bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="latest">Last upload</SelectItem>
                      <SelectItem value="oldest">First upload</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              {isProductsLoading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {Array.from({ length: PRODUCTS_PAGE_SIZE }, (_, index) => (
                    <div key={`product-skeleton-${index}`} className="bg-secondary/50 rounded-lg p-4">
                      <div className="flex items-start gap-4">
                        <Skeleton className="h-16 w-16 rounded-lg" />
                        <div className="flex-1 space-y-2">
                          <Skeleton className="h-4 w-3/5" />
                          <Skeleton className="h-3 w-24" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : productsErrorMessage ? (
                <p className="text-sm text-muted-foreground">{productsErrorMessage}</p>
              ) : pagedProducts.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products match your filters.</p>
              ) : (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {pagedProducts.map((product) => {
                      const canNavigate = Boolean(product.title);
                      return (
                        <div
                          key={product.id ?? `${product.title}-${product.createdAt}`}
                          className={cn(
                            "bg-secondary/50 rounded-lg p-4 transition-colors",
                            canNavigate && "cursor-pointer hover:bg-secondary/70",
                          )}
                          onClick={() => {
                            if (canNavigate) {
                              const routeId = buildProductRouteId(product);
                              navigate(`/products/${routeId}`, {
                                state: { product: buildProductDetailState(product, user) },
                              });
                            }
                          }}
                        >
                          <div className="flex items-start gap-4">
                            <div className="h-16 w-16 rounded-lg border border-border bg-card overflow-hidden flex items-center justify-center">
                              <img
                                src={product.imageUrl || '/placeholder.svg'}
                                alt={product.title}
                                className="h-full w-full object-cover"
                              />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between mb-2">
                                <p className="text-sm font-medium text-foreground">{product.title}</p>
                                <span
                                  className={cn(
                                    "px-2 py-0.5 rounded-full text-xs font-medium capitalize",
                                    product.status === 'sold' && "bg-success/10 text-success",
                                    product.status === 'active' && "bg-primary/10 text-primary",
                                    product.status === 'reserved' && "bg-warning/10 text-warning",
                                    product.status === 'blocked' && "bg-destructive/10 text-destructive"
                                  )}
                                >
                                  {product.status}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  {displayTotalPages > 1 && (
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mt-4">
                      <p className="text-xs text-muted-foreground">
                        Page {productsPage} of {displayTotalPages} • {productsPageSize} per page
                      </p>
                      <div className="flex items-center gap-2">
                        {pageItems.map((item, index) => {
                          if (item === 'ellipsis') {
                            return (
                              <span key={`ellipsis-${index}`} className="px-2 text-xs text-muted-foreground">
                                ...
                              </span>
                            );
                          }
                          return (
                            <Button
                              key={`page-${item}`}
                              type="button"
                              variant={item === productsPage ? 'default' : 'outline'}
                              size="sm"
                              onClick={() => setProductsPage(item)}
                            >
                              {item}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </>
              )}
            </div>
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-foreground">Profit Over Time</h3>
                  <p className="text-sm text-muted-foreground">Test data</p>
                </div>
                <Select value={profitPeriod} onValueChange={setProfitPeriod}>
                  <SelectTrigger className="w-44 bg-secondary/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="2weeks">2 weeks ago</SelectItem>
                    <SelectItem value="lastMonth">Last month</SelectItem>
                    <SelectItem value="last6Months">Last 6 months</SelectItem>
                    <SelectItem value="1year">1 year</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="h-[260px]">
                <ChartContainer config={profitChartConfig} className="h-full w-full">
                  <AreaChart data={profitData} margin={{ left: 0, right: 12 }}>
                    <defs>
                      <linearGradient id="profitGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="var(--color-profit)" stopOpacity={0.4} />
                        <stop offset="95%" stopColor="var(--color-profit)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} />
                    <XAxis dataKey="label" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                    <ChartTooltip
                      cursor={false}
                      content={
                        <ChartTooltipContent
                          formatter={(value) => `$${Number(value).toLocaleString()}`}
                        />
                      }
                    />
                    <Area
                      type="monotone"
                      dataKey="profit"
                      stroke="var(--color-profit)"
                      fill="url(#profitGradient)"
                      strokeWidth={2}
                    />
                  </AreaChart>
                </ChartContainer>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
