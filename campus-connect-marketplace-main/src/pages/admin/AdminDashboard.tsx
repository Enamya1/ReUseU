import React from 'react';
import { Users, Package, TrendingUp, DollarSign } from 'lucide-react';
import { mockProducts, mockUsers } from '@/lib/mockData';
import { normalizeImageUrl } from '@/lib/api';

const AdminDashboard: React.FC = () => {
  const stats = [
    { label: 'Total Users', value: mockUsers.length, icon: Users, change: '+12%' },
    { label: 'Active Listings', value: mockProducts.length, icon: Package, change: '+8%' },
    { label: 'Total Sales', value: '$12,450', icon: DollarSign, change: '+23%' },
    { label: 'Avg. Price', value: '$85', icon: TrendingUp, change: '+5%' },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-display font-bold mb-2">Welcome back, Admin</h2>
        <p className="text-muted-foreground">Here's what's happening on SCU today.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => (
          <div key={index} className="p-6 rounded-xl bg-card border border-border">
            <div className="flex items-center justify-between mb-4">
              <div className="p-2 rounded-lg bg-primary/10">
                <stat.icon className="w-5 h-5 text-primary" />
              </div>
              <span className="text-sm text-success font-medium">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-semibold mb-4">Recent Users</h3>
          <div className="space-y-3">
            {mockUsers.slice(0, 4).map(user => (
              <div key={user.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <div className="w-10 h-10 rounded-full bg-tertiary text-tertiary-foreground flex items-center justify-center font-semibold">
                  {user.full_name?.charAt(0)}
                </div>
                <div className="flex-1">
                  <p className="font-medium">{user.full_name}</p>
                  <p className="text-sm text-muted-foreground">{user.email}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 rounded-xl bg-card border border-border">
          <h3 className="font-semibold mb-4">Recent Listings</h3>
          <div className="space-y-3">
            {mockProducts.slice(0, 4).map(product => (
              <div key={product.id} className="flex items-center gap-3 p-3 rounded-lg bg-muted/50">
                <img src={normalizeImageUrl(product.images[0]?.image_url)} alt="" className="w-12 h-12 rounded-lg object-cover" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium truncate">{product.title}</p>
                  <p className="text-sm text-muted-foreground">${product.price}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
