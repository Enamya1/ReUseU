import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { users, universities, dormitories, User } from '@/lib/dummyData';
import { ArrowLeft, Mail, Phone, GraduationCap, Building2, ShoppingBag, CheckCircle, XCircle, Save } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = users.find(u => u.id === id);
  
  const [formData, setFormData] = useState<Partial<User>>(user || {});
  const [isEditing, setIsEditing] = useState(false);

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

  const universityDormitories = dormitories.filter(d => d.universityId === formData.universityId);

  const handleSave = () => {
    toast.success('User updated successfully');
    setIsEditing(false);
  };

  const handleStatusToggle = () => {
    const newStatus = formData.status === 'active' ? 'inactive' : 'active';
    setFormData({ ...formData, status: newStatus });
    toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
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
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
              </div>
              <h2 className="text-xl font-bold text-foreground">{user.name}</h2>
              <p className="text-muted-foreground">{user.email}</p>
              
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
                    <p className="text-sm text-foreground">{user.email}</p>
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
              </div>

              <div className="w-full border-t border-border my-6" />

              <Button
                variant={formData.status === 'active' ? 'destructive' : 'default'}
                className="w-full"
                onClick={handleStatusToggle}
              >
                {formData.status === 'active' ? (
                  <>
                    <XCircle className="w-4 h-4 mr-2" />
                    Deactivate User
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
                  <Select
                    value={formData.universityId}
                    onValueChange={(value) => {
                      const uni = universities.find(u => u.id === value);
                      setFormData({ 
                        ...formData, 
                        universityId: value,
                        universityName: uni?.name || '',
                        dormitoryId: '',
                        dormitoryName: ''
                      });
                    }}
                    disabled={!isEditing}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="dormitory">Dormitory</Label>
                  <Select
                    value={formData.dormitoryId}
                    onValueChange={(value) => {
                      const dorm = dormitories.find(d => d.id === value);
                      setFormData({ 
                        ...formData, 
                        dormitoryId: value,
                        dormitoryName: dorm?.name || ''
                      });
                    }}
                    disabled={!isEditing || !formData.universityId}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select dormitory" />
                    </SelectTrigger>
                    <SelectContent>
                      {universityDormitories.map((d) => (
                        <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
