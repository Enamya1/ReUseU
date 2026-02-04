import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { User } from '@/lib/dummyData';
import { Search, Mail, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';

const ITEMS_PER_PAGE = 10;
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

type ApiUser = {
  id: number;
  full_name: string;
  email: string;
  role: 'user' | 'admin' | 'moderator';
  status: 'active' | 'inactive' | 'suspended';
  profile_picture: string | null;
  last_login_at: string | null;
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

const buildUser = (user: ApiUser): User => ({
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
  dormitoryName: '',
  phone: '',
  avatar: user.profile_picture ?? '',
  createdAt: '',
  lastLogin: user.last_login_at ?? '',
  productsListed: Number(user.product_count) || 0,
  productsSold: Number(user.sold_counter) || 0,
});

export default function Users() {
  const navigate = useNavigate();
  const { admin } = useAuth();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [roleFilter, setRoleFilter] = useState<string>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [users, setUsers] = useState<User[]>([]);
  const [totalPages, setTotalPages] = useState(1);
  const [totalUsers, setTotalUsers] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let ignore = false;
    const fetchUsers = async () => {
      if (!admin) {
        return;
      }
      setLoading(true);
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
        if (!response.ok || !data) {
          const message =
            data && 'message' in data && typeof data.message === 'string'
              ? data.message
              : 'Failed to load users';
          if (!ignore) {
            setError(message);
            setUsers([]);
            setTotalPages(1);
            setTotalUsers(0);
          }
          return;
        }
        const mappedUsers = data.users.data.map(buildUser);
        if (!ignore) {
          setUsers(mappedUsers);
          setTotalPages(Math.max(1, data.users.last_page || 1));
          setTotalUsers(data.users.total ?? mappedUsers.length);
        }
      } catch {
        if (!ignore) {
          setError('Failed to load users');
          setUsers([]);
          setTotalPages(1);
          setTotalUsers(0);
        }
      } finally {
        if (!ignore) {
          setLoading(false);
        }
      }
    };
    fetchUsers();
    return () => {
      ignore = true;
    };
  }, [admin, currentPage]);

  const filteredUsers = useMemo(() => {
    return users.filter((user) => {
      const matchesSearch =
        user.name.toLowerCase().includes(search.toLowerCase()) ||
        user.email.toLowerCase().includes(search.toLowerCase());
      const matchesStatus = statusFilter === 'all' || user.status === statusFilter;
      const matchesRole = roleFilter === 'all' || user.role === roleFilter;
      return matchesSearch && matchesStatus && matchesRole;
    });
  }, [users, search, statusFilter, roleFilter]);

  const activeCount = filteredUsers.filter((user) => user.status === 'active').length;
  const inactiveCount = filteredUsers.filter((user) => user.status === 'inactive').length;
  const suspendedCount = filteredUsers.filter((user) => user.status === 'suspended').length;

  const columns = [
    {
      header: 'User',
      accessorKey: (row: User) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
            <span className="text-sm font-medium text-primary">
              {row.name.split(' ').map(n => n[0]).join('')}
            </span>
          </div>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-2">
              <Mail className="w-3 h-3" /> {row.email}
              <span
                className={cn(
                  "rounded-full px-2 py-0.5 text-[10px] font-medium",
                  row.emailVerified ? "bg-success/10 text-success" : "bg-destructive/10 text-destructive",
                )}
              >
                {row.emailVerified ? 'Verified' : 'Unverified'}
              </span>
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Role',
      accessorKey: (row: User) => (
        <Badge 
          variant="outline" 
          className={cn(
            "capitalize",
            row.role === 'admin' && "border-primary text-primary",
            row.role === 'moderator' && "border-warning text-warning",
            row.role === 'user' && "border-muted-foreground text-muted-foreground"
          )}
        >
          {row.role}
        </Badge>
      ),
    },
    {
      header: 'Status',
      accessorKey: (row: User) => (
        <span className={cn(
          "px-2 py-1 rounded-full text-xs font-medium",
          row.status === 'active' && "bg-success/10 text-success",
          row.status === 'inactive' && "bg-muted text-muted-foreground",
          row.status === 'suspended' && "bg-destructive/10 text-destructive"
        )}>
          {row.status}
        </span>
      ),
    },
    {
      header: 'University',
      accessorKey: (row: User) => (
        <div className="flex items-center gap-2">
          <GraduationCap className="w-4 h-4 text-muted-foreground" />
          <span className="text-sm">{row.universityName}</span>
        </div>
      ),
    },
    {
      header: 'Activity',
      accessorKey: (row: User) => (
        <div className="text-sm">
          <p>{row.productsListed} listed</p>
          <p className="text-muted-foreground">{row.productsSold} sold</p>
        </div>
      ),
    },
    {
      header: 'Last Login',
      accessorKey: 'lastLogin' as keyof User,
    },
  ];

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Users</h1>
          <p className="text-muted-foreground">Manage platform users</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Users</p>
            <p className="text-2xl font-bold text-foreground">{totalUsers}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Active</p>
            <p className="text-2xl font-bold text-success">
              {activeCount}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Inactive</p>
            <p className="text-2xl font-bold text-muted-foreground">
              {inactiveCount}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Suspended</p>
            <p className="text-2xl font-bold text-destructive">
              {suspendedCount}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap items-center gap-4">
          <div className="relative flex-1 min-w-[200px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search users..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10 bg-card"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
              <SelectItem value="suspended">Suspended</SelectItem>
            </SelectContent>
          </Select>
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="w-40 bg-card">
              <SelectValue placeholder="Role" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Roles</SelectItem>
              <SelectItem value="admin">Admin</SelectItem>
              <SelectItem value="moderator">Moderator</SelectItem>
              <SelectItem value="user">User</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Table */}
        {error && (
          <div className="rounded-lg border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive">
            {error}
          </div>
        )}
        <DataTable 
          columns={columns} 
          data={loading ? [] : filteredUsers}
          currentPage={currentPage}
          totalPages={totalPages}
          onPageChange={(page) => {
            if (loading) {
              return;
            }
            setCurrentPage(page);
          }}
          onRowClick={(user) => navigate(`/users/${user.id}`)}
        />
      </div>
    </DashboardLayout>
  );
}
