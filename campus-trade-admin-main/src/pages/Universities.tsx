import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { DataTable } from '@/components/ui/data-table';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { universities as initialUniversities, University } from '@/lib/dummyData';
import { Plus, GraduationCap, MapPin, Users, Building2 } from 'lucide-react';
import { toast } from 'sonner';

export default function Universities() {
  const [universities, setUniversities] = useState<University[]>(initialUniversities);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newUniversity, setNewUniversity] = useState({ name: '', location: '' });

  const columns = [
    {
      header: 'University',
      accessorKey: (row: University) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <GraduationCap className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {row.location}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'Students',
      accessorKey: (row: University) => (
        <div className="flex items-center gap-2">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span>{row.studentCount.toLocaleString()}</span>
        </div>
      ),
    },
    {
      header: 'Dormitories',
      accessorKey: (row: University) => (
        <div className="flex items-center gap-2">
          <Building2 className="w-4 h-4 text-muted-foreground" />
          <span>{row.dormitoriesCount}</span>
        </div>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'createdAt' as keyof University,
    },
  ];

  const handleCreate = () => {
    if (!newUniversity.name || !newUniversity.location) {
      toast.error('Please fill in all fields');
      return;
    }

    const university: University = {
      id: String(universities.length + 1),
      name: newUniversity.name,
      location: newUniversity.location,
      studentCount: 0,
      dormitoriesCount: 0,
      createdAt: new Date().toISOString().split('T')[0],
      lat: 0,
      lng: 0,
    };

    setUniversities([...universities, university]);
    setNewUniversity({ name: '', location: '' });
    setIsDialogOpen(false);
    toast.success('University created successfully');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Universities</h1>
            <p className="text-muted-foreground">Manage universities on the platform</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add University
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create University</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new university to the platform.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">University Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., MIT"
                    value={newUniversity.name}
                    onChange={(e) => setNewUniversity({ ...newUniversity, name: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="location">Location</Label>
                  <Input
                    id="location"
                    placeholder="e.g., Cambridge, MA"
                    value={newUniversity.location}
                    onChange={(e) => setNewUniversity({ ...newUniversity, location: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreate} className="gradient-primary text-primary-foreground">
                  Create
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Universities</p>
            <p className="text-2xl font-bold text-foreground">{universities.length}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Students</p>
            <p className="text-2xl font-bold text-foreground">
              {universities.reduce((acc, u) => acc + u.studentCount, 0).toLocaleString()}
            </p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Dormitories</p>
            <p className="text-2xl font-bold text-foreground">
              {universities.reduce((acc, u) => acc + u.dormitoriesCount, 0)}
            </p>
          </div>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={universities} />
      </div>
    </DashboardLayout>
  );
}
