import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Search } from 'lucide-react';
import { User } from '@/lib/dummyData';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

type ChatMessage = {
  id: number | string;
  sender: 'admin' | 'user';
  text: string;
  time: string;
};

const getInitials = (name: string) =>
  name
    .split(' ')
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';
const PROFILE_IMAGE_BASE_URL = import.meta.env.VITE_IMAGE_BASE_URL ?? API_BASE_URL ?? 'http://127.0.0.1:8000';
const ITEMS_PER_PAGE = 10;

type ApiUser = {
  id: number;
  full_name: string | null;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  profile_picture: string | null;
  last_login_at: string | null;
  dormitory_name: string | null;
  product_count: number | string;
  sold_counter: number | string;
  university_name: string | null;
};

type PaginatedResponse<T> = {
  current_page: number;
  data: T[];
  last_page: number;
  per_page: number;
  total: number;
};

type UsersResponse = {
  message: string;
  users: PaginatedResponse<ApiUser>;
};

type ApiMessage = {
  id: number;
  conversation_id: number;
  sender_id: number;
  sender_username: string | null;
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

type NamesResponse = {
  message: string;
  universities: {
    university_name: string;
    dormitories: string[];
  }[];
};

const resolveProfileImageUrl = (imageUrl: string | null | undefined): string => {
  if (!imageUrl) {
    return '';
  }
  const baseUrl = PROFILE_IMAGE_BASE_URL.replace(/\/+$/, '');
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

const buildUser = (user: ApiUser): User => {
  return {
    id: String(user.id),
    email: user.email,
    emailVerified: false,
    name: user.full_name || user.email.split('@')[0] || user.email,
    username: '',
    studentId: '',
    dateOfBirth: '',
    gender: '',
    language: '',
    role: user.role,
    status: user.status,
    universityId: '',
    universityName: user.university_name ?? 'N/A',
    dormitoryId: '',
    dormitoryName: user.dormitory_name ?? '',
    phone: '',
    avatar: user.profile_picture ?? '',
    createdAt: '',
    lastLogin: user.last_login_at ?? '',
    productsListed: Number(user.product_count) || 0,
    productsSold: Number(user.sold_counter) || 0,
  };
};

export default function Chat() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [listsLoading, setListsLoading] = useState(false);
  const [listsError, setListsError] = useState<string | null>(null);
  const [universitiesOptions, setUniversitiesOptions] = useState<string[]>([]);
  const [dormitoriesOptions, setDormitoriesOptions] = useState<string[]>([]);
  const [universityDormsMap, setUniversityDormsMap] = useState<Record<string, string[]>>({});
  const [dormSelectError, setDormSelectError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [universityFilter, setUniversityFilter] = useState('all');
  const [dormFilter, setDormFilter] = useState('all');
  const [activeUserId, setActiveUserId] = useState('');
  const [messageInput, setMessageInput] = useState('');
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatConversationIds, setChatConversationIds] = useState<Record<string, number | null>>({});
  const [chatError, setChatError] = useState<string | null>(null);
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [isSendingMessage, setIsSendingMessage] = useState(false);

  useEffect(() => {
    if (!admin) {
      return;
    }
    let ignore = false;
    const fetchUsers = async () => {
      const isFirstPage = currentPage === 1;
      if (isFirstPage) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      setError(null);
      try {
        const response = await fetch(
          `${API_BASE_URL}/api/admin/get_all_users?page=${currentPage}&per_page=${ITEMS_PER_PAGE}`,
          {
            method: 'GET',
            headers: {
              Authorization: `${admin.tokenType} ${admin.token}`,
              Accept: 'application/json',
            },
          },
        );
        const data: UsersResponse | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.users) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : response.status === 422
              ? 'Validation Error'
              : 'Failed to load users';
          if (!ignore) {
            setError(message);
            if (isFirstPage) {
              setUsers([]);
              setTotalPages(1);
            }
          }
          return;
        }
        const mappedUsers = data.users.data.map(buildUser);
        if (!ignore) {
          setTotalPages(Math.max(1, data.users.last_page || 1));
          setUsers((prev) => {
            if (isFirstPage) {
              return mappedUsers;
            }
            const existingIds = new Set(prev.map((item) => item.id));
            const next = mappedUsers.filter((item) => !existingIds.has(item.id));
            return [...prev, ...next];
          });
        }
      } catch {
        if (!ignore) {
          setError('Failed to load users');
          if (currentPage === 1) {
            setUsers([]);
            setTotalPages(1);
          }
        }
      } finally {
        if (!ignore) {
          setLoading(false);
          setLoadingMore(false);
        }
      }
    };
    fetchUsers();
    return () => {
      ignore = true;
    };
  }, [admin, currentPage]);

  const chatUsers = useMemo(() => users.filter((user) => user.role !== 'admin'), [users]);

  useEffect(() => {
    if (!admin) {
      return;
    }
    let ignore = false;
    const fetchLists = async () => {
      setListsLoading(true);
      setListsError(null);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/dormitories_and_university_/names`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data: NamesResponse | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : 'Failed to load universities and dormitories';
          if (!ignore) {
            setListsError(message);
            setUniversitiesOptions([]);
            setDormitoriesOptions([]);
          }
          return;
        }
        const universitiesList = Array.isArray(data.universities) ? data.universities : [];
        const normalize = (items: string[]) =>
          Array.from(new Set(items.map((item) => item.trim()).filter((item) => item.length > 0)));
        if (!ignore) {
          const universityNames = normalize(
            universitiesList.map((item) => item.university_name).filter(Boolean),
          );
          const dormsMap = universitiesList.reduce<Record<string, string[]>>((acc, item) => {
            const name = item.university_name?.trim();
            if (!name) {
              return acc;
            }
            acc[name] = normalize(Array.isArray(item.dormitories) ? item.dormitories : []);
            return acc;
          }, {});
          setUniversitiesOptions(universityNames);
          setUniversityDormsMap(dormsMap);
          setDormitoriesOptions([]);
        }
      } catch {
        if (!ignore) {
          setListsError('Failed to load universities and dormitories');
          setUniversitiesOptions([]);
          setDormitoriesOptions([]);
          setUniversityDormsMap({});
        }
      } finally {
        if (!ignore) {
          setListsLoading(false);
        }
      }
    };
    fetchLists();
    return () => {
      ignore = true;
    };
  }, [admin]);

  useEffect(() => {
    if (universityFilter !== 'all' && !universitiesOptions.includes(universityFilter)) {
      setUniversityFilter('all');
    }
  }, [universitiesOptions, universityFilter]);

  useEffect(() => {
    if (universityFilter === 'all') {
      setDormitoriesOptions([]);
      if (dormFilter !== 'all') {
        setDormFilter('all');
      }
      return;
    }
    const nextDorms = universityDormsMap[universityFilter] ?? [];
    setDormitoriesOptions(nextDorms);
    if (dormFilter !== 'all' && !nextDorms.includes(dormFilter)) {
      setDormFilter('all');
    }
    if (dormSelectError) {
      setDormSelectError(null);
    }
  }, [dormFilter, dormSelectError, universityDormsMap, universityFilter]);

  const availableDorms = useMemo(() => dormitoriesOptions, [dormitoriesOptions]);

  const filteredUsers = useMemo(() => {
    return chatUsers.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesUniversity =
        universityFilter === 'all' || user.universityName === universityFilter;
      const matchesDorm = dormFilter === 'all' || user.dormitoryName === dormFilter;
      return matchesSearch && matchesUniversity && matchesDorm;
    });
  }, [chatUsers, dormFilter, search, universityFilter]);

  useEffect(() => {
    if (filteredUsers.length === 0) {
      setActiveUserId('');
      return;
    }
    setActiveUserId((prev) => {
      if (prev && filteredUsers.some((user) => user.id === prev)) {
        return prev;
      }
      return filteredUsers[0].id;
    });
  }, [filteredUsers]);

  const activeUser = chatUsers.find((user) => user.id === activeUserId) ?? filteredUsers[0];
  const hasMore = currentPage < totalPages;
  const activeConversationId = activeUser ? chatConversationIds[activeUser.id] ?? null : null;
  const isUsersLoading = loading && users.length === 0;

  useEffect(() => {
    if (!admin || !activeUser) {
      setChatMessages([]);
      setChatError(null);
      setIsChatLoading(false);
      return;
    }
    let ignore = false;
    const fetchMessages = async () => {
      setIsChatLoading(true);
      setChatError(null);
      try {
        const params = new URLSearchParams();
        params.set('limit', '50');
        if (activeConversationId) {
          params.set('conversation_id', String(activeConversationId));
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
            setChatMessages([]);
          }
          return;
        }
        const messagesData = data?.messages ?? [];
        const activeUserIdNumber = Number(activeUser.id);
        const matchedConversationId =
          activeConversationId ??
          messagesData.find((message) => message.sender_id === activeUserIdNumber)?.conversation_id ??
          null;
        if (!activeConversationId && matchedConversationId) {
          setChatConversationIds((prev) => ({
            ...prev,
            [activeUser.id]: matchedConversationId,
          }));
        }
        const filteredMessages = matchedConversationId
          ? messagesData.filter((message) => message.conversation_id === matchedConversationId)
          : messagesData.filter((message) => message.sender_id === activeUserIdNumber);
        const mappedMessages: ChatMessage[] = filteredMessages.map((message) => ({
          id: message.id,
          sender: message.sender_id === activeUserIdNumber ? 'user' : 'admin',
          text: message.message_text,
          time: formatMessageTime(message.created_at),
        }));
        if (!ignore) {
          setChatMessages(mappedMessages);
        }
      } catch {
        if (!ignore) {
          setChatError('Failed to load messages');
          setChatMessages([]);
        }
      } finally {
        if (!ignore) {
          setIsChatLoading(false);
        }
      }
    };
    setChatMessages([]);
    fetchMessages();
    return () => {
      ignore = true;
    };
  }, [activeConversationId, activeUser, admin]);

  const handleSendMessage = async () => {
    const trimmed = messageInput.trim();
    if (!trimmed || !activeUser || !admin || isSendingMessage) {
      return;
    }
    const receiverId = Number(activeUser.id);
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
        setChatConversationIds((prev) => ({
          ...prev,
          [activeUser.id]: data.conversation_id,
        }));
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
      setMessageInput('');
    } catch {
      setChatError('Failed to send message');
    } finally {
      setIsSendingMessage(false);
    }
  };

  const handleUserListScroll = (event: React.UIEvent<HTMLDivElement>) => {
    if (loading || loadingMore || !hasMore) {
      return;
    }
    const target = event.currentTarget;
    const threshold = 120;
    if (target.scrollTop + target.clientHeight >= target.scrollHeight - threshold) {
      setCurrentPage((prev) => Math.min(prev + 1, totalPages));
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 h-[calc(100vh-7rem)] min-h-0 flex flex-col">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Chat</h1>
          <p className="text-muted-foreground">Send messages to users and broadcast updates</p>
        </div>
        <div className="grid grid-cols-1 xl:grid-cols-[320px_minmax(0,1fr)] gap-6 flex-1 min-h-0">
          <div className="bg-card rounded-xl border border-border p-4 flex flex-col gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                className="pl-9 bg-secondary/50"
              />
            </div>
            <Select
              value={universityFilter}
              onValueChange={(value) => {
                setUniversityFilter(value);
                setDormFilter('all');
                setDormSelectError(null);
              }}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="All universities" />
              </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All universities</SelectItem>
              {listsLoading && (
                <div className="space-y-2 px-2 py-1">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-28" />
                  <Skeleton className="h-4 w-32" />
                </div>
              )}
                {!listsLoading &&
                  universitiesOptions.map((university) => (
                    <SelectItem key={university} value={university}>
                      {university}
                    </SelectItem>
                  ))}
                {!listsLoading && universitiesOptions.length === 0 && (
                  <SelectItem value="empty" disabled>
                    No universities
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            <Select
              value={dormFilter}
              onValueChange={(value) => {
                if (universityFilter === 'all') {
                  setDormSelectError('Select university first');
                  return;
                }
                setDormFilter(value);
                setDormSelectError(null);
              }}
              onOpenChange={(open) => {
                if (open && universityFilter === 'all') {
                  setDormSelectError('Select university first');
                }
              }}
            >
              <SelectTrigger className="bg-secondary/50">
                <SelectValue placeholder="All dormitories" />
              </SelectTrigger>
            <SelectContent>
                <SelectItem value="all">All dormitories</SelectItem>
                {universityFilter === 'all' && !listsLoading && (
                  <SelectItem value="empty" disabled>
                    Select university first
                  </SelectItem>
                )}
              {listsLoading && (
                <div className="space-y-2 px-2 py-1">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-24" />
                  <Skeleton className="h-4 w-36" />
                </div>
              )}
                {!listsLoading &&
                  universityFilter !== 'all' &&
                  availableDorms.map((dorm) => (
                    <SelectItem key={dorm} value={dorm}>
                      {dorm}
                    </SelectItem>
                  ))}
                {!listsLoading && universityFilter !== 'all' && availableDorms.length === 0 && (
                  <SelectItem value="empty" disabled>
                    No dormitories
                  </SelectItem>
                )}
              </SelectContent>
            </Select>
            {listsError && (
              <div className="text-xs text-destructive">
                {listsError}
              </div>
            )}
            {dormSelectError && (
              <div className="text-xs text-destructive">
                {dormSelectError}
              </div>
            )}
            {isUsersLoading ? (
              <Skeleton className="h-4 w-28" />
            ) : (
              <div className="text-xs text-muted-foreground">
                Showing {filteredUsers.length} users
              </div>
            )}
            <div className="space-y-2 overflow-y-auto max-h-[560px] pr-1" onScroll={handleUserListScroll}>
              {error && (
                <div className="text-sm text-destructive text-center py-4">
                  {error}
                </div>
              )}
              {isUsersLoading ? (
                <div className="space-y-3">
                  {Array.from({ length: ITEMS_PER_PAGE }, (_, index) => (
                    <div
                      key={`chat-user-skeleton-${index}`}
                      className="flex items-center gap-3 rounded-lg border border-border px-3 py-3"
                    >
                      <Skeleton className="h-10 w-10 rounded-full" />
                      <div className="flex-1 space-y-2">
                        <Skeleton className="h-4 w-32" />
                        <Skeleton className="h-3 w-40" />
                      </div>
                      <Skeleton className="h-3 w-10" />
                    </div>
                  ))}
                </div>
              ) : (
                filteredUsers.map((user) => {
                  const isActive = user.id === activeUser?.id;
                  return (
                    <button
                      key={user.id}
                      type="button"
                      onClick={() => setActiveUserId(user.id)}
                      className={cn(
                        "w-full text-left rounded-lg border border-transparent px-3 py-3 flex items-center gap-3 transition-colors",
                        isActive
                          ? "bg-primary/10 border-primary/20"
                          : "hover:bg-secondary/50"
                      )}
                    >
                      {user.avatar ? (
                        <img
                          src={resolveProfileImageUrl(user.avatar)}
                          alt={user.name}
                          className="w-10 h-10 rounded-full object-cover border border-border"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                          {getInitials(user.name)}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                        <p className="text-xs text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                      <div className="text-[10px] text-muted-foreground">
                        {user.lastLogin}
                      </div>
                    </button>
                  );
                })
              )}
              {!loading && filteredUsers.length === 0 && !error && (
                <div className="text-sm text-muted-foreground text-center py-10">
                  No users match your filters.
                </div>
              )}
              {loadingMore && (
                <div className="text-xs text-muted-foreground text-center py-3">
                  Loading more users...
                </div>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-6 min-h-0">
            <div className="bg-card rounded-xl border border-border flex flex-col flex-1 min-h-0">
              <div className="border-b border-border p-4 flex items-center justify-between">
                {isUsersLoading ? (
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-2">
                      <Skeleton className="h-4 w-32" />
                      <Skeleton className="h-3 w-44" />
                    </div>
                    <Skeleton className="h-5 w-16" />
                  </div>
                ) : activeUser ? (
                  <div className="flex items-center gap-3">
                    {activeUser.avatar ? (
                      <img
                        src={resolveProfileImageUrl(activeUser.avatar)}
                        alt={activeUser.name}
                        className="w-10 h-10 rounded-full object-cover border border-border"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/10 text-primary flex items-center justify-center text-sm font-semibold">
                        {getInitials(activeUser.name)}
                      </div>
                    )}
                    <div>
                      <button
                        type="button"
                        onClick={() => navigate(`/users/${activeUser.id}`)}
                        className="text-sm font-semibold text-foreground transition-colors hover:text-primary"
                      >
                        {activeUser.name}
                      </button>
                      <p className="text-xs text-muted-foreground">{activeUser.email}</p>
                    </div>
                    <Badge
                      variant="outline"
                      className={cn(
                        "capitalize",
                        activeUser.status === 'active' && "border-success text-success",
                        activeUser.status === 'inactive' && "border-muted-foreground text-muted-foreground",
                        activeUser.status === 'suspended' && "border-destructive text-destructive"
                      )}
                    >
                      {activeUser.status}
                    </Badge>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">Select a user to start chatting</div>
                )}
                {isUsersLoading ? (
                  <Skeleton className="h-4 w-28" />
                ) : activeUser ? (
                  <div className="text-xs text-muted-foreground">
                    {activeUser.universityName} • {activeUser.dormitoryName}
                  </div>
                ) : null}
              </div>
              <div className="flex-1 min-h-0 overflow-y-auto p-4 space-y-4">
                {isChatLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 6 }, (_, index) => {
                      const alignEnd = index % 2 === 0;
                      return (
                        <div
                          key={`chat-message-skeleton-${index}`}
                          className={cn("flex", alignEnd ? "justify-end" : "justify-start")}
                        >
                          <div className="max-w-[70%] space-y-2">
                            <Skeleton className="h-4 w-56" />
                            <Skeleton className="h-4 w-40" />
                            <Skeleton className="h-3 w-16" />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : chatError ? (
                  <div className="text-sm text-destructive text-center py-10">
                    {chatError}
                  </div>
                ) : chatMessages.length === 0 ? (
                  <div className="text-sm text-muted-foreground text-center py-10">
                    No messages yet. Start the conversation.
                  </div>
                ) : (
                  chatMessages.map((message) => (
                    <div
                      key={message.id}
                      className={cn(
                        "flex",
                        message.sender === 'admin' ? "justify-end" : "justify-start"
                      )}
                    >
                      <div
                        className={cn(
                          "max-w-[70%] rounded-2xl px-4 py-3 text-sm",
                          message.sender === 'admin'
                            ? "bg-primary text-primary-foreground"
                            : "bg-secondary text-foreground"
                        )}
                      >
                        <p>{message.text}</p>
                        <p
                          className={cn(
                            "mt-2 text-[10px]",
                            message.sender === 'admin' ? "text-primary-foreground/70" : "text-muted-foreground"
                          )}
                        >
                          {message.time}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>
              <div className="border-t border-border p-4">
                <div className="flex flex-col md:flex-row gap-3">
                  <Textarea
                    placeholder="Type a message..."
                    value={messageInput}
                    onChange={(event) => setMessageInput(event.target.value)}
                    className="bg-secondary/50"
                    disabled={!activeUser || isSendingMessage}
                  />
                  <Button
                    onClick={handleSendMessage}
                    disabled={!activeUser || !messageInput.trim() || isSendingMessage}
                  >
                    {isSendingMessage ? 'Sending...' : 'Send'}
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
