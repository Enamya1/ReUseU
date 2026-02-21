import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

export default function Settings() {
  const { admin } = useAuth();
  const [form, setForm] = useState({
    name: admin?.name || 'Admin User',
    email: admin?.email || 'admin@example.com',
    username: admin?.name?.toLowerCase().replace(/\s+/g, '.') || 'admin.user',
    phone: '+1 555-000-0000',
    language: 'English',
    bio: 'Administrator of the campus trade platform.',
  });

  const handleSave = () => {
    toast.success('Settings saved (dummy)');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Settings</h1>
          <p className="text-muted-foreground">Manage your account information</p>
        </div>

        <div className="bg-card rounded-xl border border-border p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="username">Username</Label>
              <Input
                id="username"
                value={form.username}
                onChange={(e) => setForm({ ...form, username: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                value={form.phone}
                onChange={(e) => setForm({ ...form, phone: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Input
                id="language"
                value={form.language}
                onChange={(e) => setForm({ ...form, language: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
            <div className="space-y-2 md:col-span-2">
              <Label htmlFor="bio">Bio</Label>
              <Textarea
                id="bio"
                value={form.bio}
                onChange={(e) => setForm({ ...form, bio: e.target.value })}
                className="bg-secondary/50"
              />
            </div>
          </div>
          <div className="mt-6 flex items-center justify-end gap-2">
            <Button variant="outline">Cancel</Button>
            <Button onClick={handleSave} className="gradient-primary text-primary-foreground">
              Save Changes
            </Button>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
