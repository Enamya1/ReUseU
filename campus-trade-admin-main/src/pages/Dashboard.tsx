import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { Users, ShoppingBag, DollarSign, TrendingUp, GraduationCap, AlertTriangle, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UniversityMap } from '@/components/dashboard/UniversityMap';
import { useAuth } from '@/contexts/AuthContext';
import { useState, useEffect } from 'react';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

interface DashboardData {
  stats: {
    total_users: { value: number; change_pct: number; trend: string };
    active_listings: { value: number; change_pct: number; trend: string };
    total_value_exchanged: { value: number; change_pct: number; trend: string };
    transactions: { value: number; change_pct: number; trend: string };
    active_users: number;
    new_users_month: number;
  };
  universities: Array<{ id: number; name: string; address: string; latitude: number; longitude: number }>;
  universities_overview: Array<{ university_id: number; university_name: string; users_count: number }>;
  chart_data: Array<{ name: string; users: number; transactions_amount: number }>;
  recent_users: Array<{
    id: number;
    full_name: string;
    email: string;
    username: string;
    profile_picture: string | null;
    status: string;
    university: string;
    joined_at: string;
  }>;
}

export default function Dashboard() {
  const { admin } = useAuth();
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!admin?.token) return;
      
      try {
        setLoading(true);
        const response = await fetch(`${API_BASE_URL}/api/admin/dashboard`, {
          headers: {
            'Authorization': `${admin.tokenType} ${admin.token}`,
            'Accept': 'application/json',
          },
        });

        if (!response.ok) {
          throw new Error('Failed to fetch dashboard data');
        }

        const result = await response.json();
        setData(result.data);
        setError(null);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [admin]);

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <div className="momentum-loader"></div>
        </div>
      </DashboardLayout>
    );
  }

  if (error || !data) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center h-96">
          <p className="text-destructive">{error || 'No data available'}</p>
        </div>
      </DashboardLayout>
    );
  }

  const universityChartData = data.universities_overview.map(u => ({
    name: u.university_name.split(' ')[0],
    students: u.users_count,
  }));
  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-foreground">Dashboard</h1>
          <p className="text-muted-foreground">Welcome back! Here's what's happening with your platform.</p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Users"
            value={data.stats.total_users.value.toLocaleString()}
            change={data.stats.total_users.change_pct}
            trend={data.stats.total_users.trend as 'up' | 'down' | 'stable'}
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            title="Active Listings"
            value={data.stats.active_listings.value.toLocaleString()}
            change={data.stats.active_listings.change_pct}
            trend={data.stats.active_listings.trend as 'up' | 'down' | 'stable'}
            icon={<ShoppingBag className="w-6 h-6" />}
          />
          <StatCard
            title="Total Value Exchanged"
            value={`$${(data.stats.total_value_exchanged.value / 1000).toFixed(1)}K`}
            change={data.stats.total_value_exchanged.change_pct}
            trend={data.stats.total_value_exchanged.trend as 'up' | 'down' | 'stable'}
            icon={<DollarSign className="w-6 h-6" />}
          />
          <StatCard
            title="Transactions amount"
            value={data.stats.transactions.value.toLocaleString()}
            change={data.stats.transactions.change_pct}
            trend={data.stats.transactions.trend as 'up' | 'down' | 'stable'}
            icon={<TrendingUp className="w-6 h-6" />}
          />
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Growth Chart */}
          <div className="lg:col-span-2 bg-card rounded-xl border border-border p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-foreground">Platform Growth</h3>
                <p className="text-sm text-muted-foreground">Users and transactions amount over time</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data.chart_data}>
                  <defs>
                    <linearGradient id="colorUsers" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(174 72% 50%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(174 72% 50%)" stopOpacity={0}/>
                    </linearGradient>
                    <linearGradient id="colorTransactions" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(262 83% 58%)" stopOpacity={0.3}/>
                      <stop offset="95%" stopColor="hsl(262 83% 58%)" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222 47% 8%)', 
                      border: '1px solid hsl(222 30% 18%)',
                      borderRadius: '8px',
                      color: 'hsl(210 40% 98%)'
                    }}
                  />
                  <Area type="monotone" dataKey="users" stroke="hsl(174 72% 50%)" fillOpacity={1} fill="url(#colorUsers)" />
                  <Area type="monotone" dataKey="transactions_amount" stroke="hsl(262 83% 58%)" fillOpacity={1} fill="url(#colorTransactions)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Quick Stats */}
          <div className="space-y-4">
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-success/10 flex items-center justify-center">
                  <Activity className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Active Users</p>
                  <p className="text-xl font-bold text-foreground">{data.stats.active_users.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full"
                  style={{ width: `${(data.stats.active_users / data.stats.total_users.value) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {((data.stats.active_users / data.stats.total_users.value) * 100).toFixed(1)}% of total users
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-xl font-bold text-foreground">{data.stats.new_users_month}</p>
                </div>
              </div>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-warning/10 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5 text-warning" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Reports</p>
                  <p className="text-xl font-bold text-foreground">0</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* University Map */}
        <UniversityMap universities={data.universities} />

        {/* Universities Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Universities Overview</h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={universityChartData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(222 30% 18%)" />
                  <XAxis dataKey="name" stroke="hsl(215 20% 55%)" fontSize={12} />
                  <YAxis stroke="hsl(215 20% 55%)" fontSize={12} />
                  <Tooltip 
                    contentStyle={{ 
                      backgroundColor: 'hsl(222 47% 8%)', 
                      border: '1px solid hsl(222 30% 18%)',
                      borderRadius: '8px',
                      color: 'hsl(210 40% 98%)'
                    }}
                  />
                  <Bar dataKey="students" fill="hsl(174 72% 50%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Recent Users */}
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <Users className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Recent Users</h3>
            </div>
            <div className="space-y-4">
              {data.recent_users.map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {user.profile_picture ? (
                      <img src={user.profile_picture} alt={user.full_name} className="w-10 h-10 rounded-full object-cover" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                        <span className="text-sm font-medium text-primary">
                          {user.full_name.split(' ').map(n => n[0]).join('')}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.full_name}</p>
                      <p className="text-xs text-muted-foreground">{user.university}</p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    user.status === 'active' ? 'bg-success/10 text-success' :
                    user.status === 'inactive' ? 'bg-muted text-muted-foreground' :
                    'bg-destructive/10 text-destructive'
                  }`}>
                    {user.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
