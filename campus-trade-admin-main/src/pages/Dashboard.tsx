import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { StatCard } from '@/components/ui/stat-card';
import { dashboardStats, users, universities } from '@/lib/dummyData';
import { Users, ShoppingBag, DollarSign, TrendingUp, GraduationCap, AlertTriangle, Activity } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { UniversityMap } from '@/components/dashboard/UniversityMap';

const chartData = [
  { name: 'Jan', users: 1200, transactions: 400 },
  { name: 'Feb', users: 1900, transactions: 600 },
  { name: 'Mar', users: 2400, transactions: 800 },
  { name: 'Apr', users: 3100, transactions: 1200 },
  { name: 'May', users: 4200, transactions: 1600 },
  { name: 'Jun', users: 5800, transactions: 2100 },
  { name: 'Jul', users: 7200, transactions: 2800 },
  { name: 'Aug', users: 8900, transactions: 3400 },
  { name: 'Sep', users: 10200, transactions: 4100 },
  { name: 'Oct', users: 11500, transactions: 5200 },
  { name: 'Nov', users: 12100, transactions: 6800 },
  { name: 'Dec', users: 12450, transactions: 8945 },
];

const universityData = universities.map(u => ({
  name: u.name.split(' ')[0],
  students: u.studentCount,
  dormitories: u.dormitoriesCount * 100,
}));

export default function Dashboard() {
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
            value={dashboardStats.totalUsers.toLocaleString()}
            change={dashboardStats.growthRate}
            trend="up"
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            title="Active Listings"
            value={dashboardStats.totalProducts.toLocaleString()}
            change={8.3}
            trend="up"
            icon={<ShoppingBag className="w-6 h-6" />}
          />
          <StatCard
            title="Monthly Revenue"
            value={`$${(dashboardStats.monthlyRevenue / 1000).toFixed(1)}K`}
            change={15.2}
            trend="up"
            icon={<DollarSign className="w-6 h-6" />}
          />
          <StatCard
            title="Transactions"
            value={dashboardStats.totalTransactions.toLocaleString()}
            change={22.5}
            trend="up"
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
                <p className="text-sm text-muted-foreground">Users and transactions over time</p>
              </div>
            </div>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
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
                  <Area type="monotone" dataKey="transactions" stroke="hsl(262 83% 58%)" fillOpacity={1} fill="url(#colorTransactions)" />
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
                  <p className="text-xl font-bold text-foreground">{dashboardStats.activeUsers.toLocaleString()}</p>
                </div>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-success rounded-full"
                  style={{ width: `${(dashboardStats.activeUsers / dashboardStats.totalUsers) * 100}%` }}
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">
                {((dashboardStats.activeUsers / dashboardStats.totalUsers) * 100).toFixed(1)}% of total users
              </p>
            </div>

            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center gap-4 mb-4">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Users className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">New This Month</p>
                  <p className="text-xl font-bold text-foreground">{dashboardStats.newUsersThisMonth}</p>
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
                  <p className="text-xl font-bold text-foreground">{dashboardStats.pendingReports}</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* University Map */}
        <UniversityMap />

        {/* Universities Chart */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="bg-card rounded-xl border border-border p-6">
            <div className="flex items-center gap-3 mb-6">
              <GraduationCap className="w-5 h-5 text-primary" />
              <h3 className="text-lg font-semibold text-foreground">Universities Overview</h3>
            </div>
            <div className="h-[250px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={universityData}>
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
              {users.slice(0, 5).map((user) => (
                <div key={user.id} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-medium text-primary">
                        {user.name.split(' ').map(n => n[0]).join('')}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">{user.name}</p>
                      <p className="text-xs text-muted-foreground">{user.universityName}</p>
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
