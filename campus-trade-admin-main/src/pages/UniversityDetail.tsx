import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { universities, dormitories, users } from '@/lib/dummyData';
import { Button } from '@/components/ui/button';
import { ArrowLeft, MapPin, Users, Building2, Calendar, Globe, GraduationCap } from 'lucide-react';
import { StatCard } from '@/components/ui/stat-card';

export default function UniversityDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const university = universities.find(u => u.id === id);
  const universityDormitories = dormitories.filter(d => d.universityId === id);
  const universityUsers = users.filter(u => u.universityId === id);

  if (!university) {
    return (
      <DashboardLayout>
        <div className="flex flex-col items-center justify-center h-[60vh]">
          <h1 className="text-2xl font-bold text-foreground mb-4">University Not Found</h1>
          <Button onClick={() => navigate('/')}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const activeUsers = universityUsers.filter(u => u.status === 'active').length;
  const totalCapacity = universityDormitories.reduce((sum, d) => sum + d.capacity, 0);
  const totalOccupancy = universityDormitories.reduce((sum, d) => sum + d.occupancy, 0);
  const occupancyRate = totalCapacity > 0 ? ((totalOccupancy / totalCapacity) * 100).toFixed(1) : 0;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate('/')}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{university.name}</h1>
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="w-4 h-4" />
              <span>{university.location}</span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard
            title="Total Students"
            value={university.studentCount.toLocaleString()}
            icon={<Users className="w-6 h-6" />}
          />
          <StatCard
            title="Dormitories"
            value={university.dormitoriesCount.toString()}
            icon={<Building2 className="w-6 h-6" />}
          />
          <StatCard
            title="Platform Users"
            value={universityUsers.length.toString()}
            change={activeUsers > 0 ? (activeUsers / universityUsers.length) * 100 : 0}
            trend="up"
            icon={<GraduationCap className="w-6 h-6" />}
          />
          <StatCard
            title="Dorm Occupancy"
            value={`${occupancyRate}%`}
            icon={<Building2 className="w-6 h-6" />}
          />
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* University Info */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">University Information</h3>
            <div className="space-y-4">
              {university.description && (
                <p className="text-muted-foreground text-sm">{university.description}</p>
              )}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Founded</p>
                  <p className="text-foreground font-medium">{university.foundedYear || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground uppercase tracking-wider">Added to Platform</p>
                  <p className="text-foreground font-medium">{university.createdAt}</p>
                </div>
                {university.website && (
                  <div className="col-span-2">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">Website</p>
                    <a 
                      href={university.website} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-primary hover:underline flex items-center gap-1"
                    >
                      <Globe className="w-4 h-4" />
                      {university.website}
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Dormitories List */}
          <div className="bg-card rounded-xl border border-border p-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">Dormitories</h3>
            {universityDormitories.length > 0 ? (
              <div className="space-y-3">
                {universityDormitories.map((dorm) => (
                  <div 
                    key={dorm.id} 
                    className="flex items-center justify-between p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors"
                  >
                    <div>
                      <p className="font-medium text-foreground">{dorm.name}</p>
                      <p className="text-xs text-muted-foreground">{dorm.address}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-foreground">{dorm.occupancy}/{dorm.capacity}</p>
                      <p className="text-xs text-muted-foreground">
                        {((dorm.occupancy / dorm.capacity) * 100).toFixed(0)}% full
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">No dormitories registered yet.</p>
            )}
          </div>
        </div>

        {/* Users from this University */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-foreground">Platform Users</h3>
            <Button variant="outline" size="sm" onClick={() => navigate('/users')}>
              View All Users
            </Button>
          </div>
          {universityUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {universityUsers.slice(0, 6).map((user) => (
                <div 
                  key={user.id} 
                  className="flex items-center gap-3 p-3 rounded-lg bg-secondary/30 hover:bg-secondary/50 transition-colors cursor-pointer"
                  onClick={() => navigate(`/users/${user.id}`)}
                >
                  <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center">
                    <span className="text-sm font-medium text-primary">
                      {user.name.split(' ').map(n => n[0]).join('')}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{user.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{user.dormitoryName}</p>
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
          ) : (
            <p className="text-muted-foreground text-sm">No users from this university yet.</p>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
