import { FormEvent, useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { products, users, universities, dormitories, User } from '@/lib/dummyData';
import { ArrowLeft, Mail, Phone, GraduationCap, Building2, ShoppingBag, CheckCircle, XCircle, Save, User as UserIcon, Hash, CalendarDays, Users, Languages, MessageCircle, Send } from 'lucide-react';
import { Area, AreaChart, CartesianGrid, XAxis, YAxis } from 'recharts';
import { toast } from 'sonner';
import { ChartContainer, ChartTooltip, ChartTooltipContent } from '@/components/ui/chart';
import { cn } from '@/lib/utils';

export default function UserDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const user = users.find(u => u.id === id);
  
  const [formData, setFormData] = useState<Partial<User>>(user || {});
  const [isEditing, setIsEditing] = useState(false);
  const [profitPeriod, setProfitPeriod] = useState('last6Months');
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState(() => [
    { id: 1, sender: 'user' as const, text: 'Hi, I need help with my listing.', time: '09:42' },
    { id: 2, sender: 'admin' as const, text: 'Sure, what seems to be the issue?', time: '09:44' },
  ]);

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
  const uploadedProducts = products.filter((product) => product.sellerId === user.id);
  const uploadedProductsPreview = uploadedProducts.slice(0, 6);
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

  const handleStatusToggle = () => {
    const newStatus = formData.status === 'active' ? 'inactive' : 'active';
    setFormData({ ...formData, status: newStatus });
    toast.success(`User ${newStatus === 'active' ? 'activated' : 'deactivated'}`);
  };

  const handleChatSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmed = chatInput.trim();
    if (!trimmed) {
      return;
    }
    setChatMessages((prev) => [
      ...prev,
      {
        id: prev.length + 1,
        sender: 'admin',
        text: trimmed,
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      },
    ]);
    setChatInput('');
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
            <Dialog>
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
                    {chatMessages.map((message) => (
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
                    ))}
                  </div>
                  <form className="flex items-center gap-2" onSubmit={handleChatSubmit}>
                    <Input
                      value={chatInput}
                      onChange={(event) => setChatInput(event.target.value)}
                      placeholder="Type a message..."
                      className="bg-secondary/50"
                    />
                    <Button type="submit">
                      <Send className="w-4 h-4 mr-2" />
                      Send
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
              <div className="w-24 h-24 rounded-full bg-primary/20 flex items-center justify-center mb-4">
                <span className="text-3xl font-bold text-primary">
                  {user.name.split(' ').map(n => n[0]).join('')}
                </span>
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
            <div className="bg-card rounded-xl border border-border p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-foreground">Uploaded Products</h3>
                <span className="text-sm text-muted-foreground">{uploadedProducts.length} total</span>
              </div>
              {uploadedProductsPreview.length === 0 ? (
                <p className="text-sm text-muted-foreground">No products uploaded yet.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {uploadedProductsPreview.map((product) => (
                    <div
                      key={product.id}
                      className="bg-secondary/50 rounded-lg p-4 cursor-pointer hover:bg-secondary/70 transition-colors"
                      onClick={() => navigate(`/products/${product.id}`)}
                    >
                      <div className="flex items-start gap-4">
                        <div className="h-16 w-16 rounded-lg border border-border bg-card overflow-hidden flex items-center justify-center">
                          <img
                            src={product.images[0] || '/placeholder.svg'}
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
                                product.status === 'reserved' && "bg-warning/10 text-warning"
                              )}
                            >
                              {product.status}
                            </span>
                          </div>
                          <p className="text-xs text-muted-foreground">Uploaded by {user.name}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
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
