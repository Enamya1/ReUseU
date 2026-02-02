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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { dormitories as initialDormitories, universities, Dormitory } from '@/lib/dummyData';
import { Plus, Building2, MapPin, Users } from 'lucide-react';
import { toast } from 'sonner';

export default function Dormitories() {
  const [dormitories, setDormitories] = useState<Dormitory[]>(initialDormitories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [filterUniversity, setFilterUniversity] = useState<string>('all');
  const [newDormitory, setNewDormitory] = useState({ name: '', universityId: '', address: '', capacity: '' });

  const filteredDormitories = filterUniversity === 'all' 
    ? dormitories 
    : dormitories.filter(d => d.universityId === filterUniversity);

  const columns = [
    {
      header: 'Dormitory',
      accessorKey: (row: Dormitory) => (
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <p className="font-medium text-foreground">{row.name}</p>
            <p className="text-xs text-muted-foreground flex items-center gap-1">
              <MapPin className="w-3 h-3" /> {row.address}
            </p>
          </div>
        </div>
      ),
    },
    {
      header: 'University',
      accessorKey: 'universityName' as keyof Dormitory,
    },
    {
      header: 'Occupancy',
      accessorKey: (row: Dormitory) => (
        <div>
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-muted-foreground" />
            <span>{row.occupancy} / {row.capacity}</span>
          </div>
          <div className="w-24 h-1.5 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary rounded-full"
              style={{ width: `${(row.occupancy / row.capacity) * 100}%` }}
            />
          </div>
        </div>
      ),
    },
    {
      header: 'Created',
      accessorKey: 'createdAt' as keyof Dormitory,
    },
  ];

  const handleCreate = () => {
    if (!newDormitory.name || !newDormitory.universityId || !newDormitory.address || !newDormitory.capacity) {
      toast.error('Please fill in all fields');
      return;
    }

    const university = universities.find(u => u.id === newDormitory.universityId);
    const dormitory: Dormitory = {
      id: String(dormitories.length + 1),
      name: newDormitory.name,
      universityId: newDormitory.universityId,
      universityName: university?.name || '',
      address: newDormitory.address,
      capacity: parseInt(newDormitory.capacity),
      occupancy: 0,
      createdAt: new Date().toISOString().split('T')[0],
    };

    setDormitories([...dormitories, dormitory]);
    setNewDormitory({ name: '', universityId: '', address: '', capacity: '' });
    setIsDialogOpen(false);
    toast.success('Dormitory created successfully');
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Dormitories</h1>
            <p className="text-muted-foreground">Manage dormitories across universities</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Dormitory
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Dormitory</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new dormitory to a university.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Dormitory Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Baker House"
                    value={newDormitory.name}
                    onChange={(e) => setNewDormitory({ ...newDormitory, name: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="university">University</Label>
                  <Select
                    value={newDormitory.universityId}
                    onValueChange={(value) => setNewDormitory({ ...newDormitory, universityId: value })}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="Select university" />
                    </SelectTrigger>
                    <SelectContent>
                      {universities.map((u) => (
                        <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="address">Address</Label>
                  <Input
                    id="address"
                    placeholder="e.g., 362 Memorial Dr"
                    value={newDormitory.address}
                    onChange={(e) => setNewDormitory({ ...newDormitory, address: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="capacity">Capacity</Label>
                  <Input
                    id="capacity"
                    type="number"
                    placeholder="e.g., 350"
                    value={newDormitory.capacity}
                    onChange={(e) => setNewDormitory({ ...newDormitory, capacity: e.target.value })}
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

        {/* Filter */}
        <div className="flex items-center gap-4">
          <div className="w-64">
            <Select value={filterUniversity} onValueChange={setFilterUniversity}>
              <SelectTrigger className="bg-card">
                <SelectValue placeholder="Filter by university" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Universities</SelectItem>
                {universities.map((u) => (
                  <SelectItem key={u.id} value={u.id}>{u.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <p className="text-sm text-muted-foreground">
            Showing {filteredDormitories.length} dormitories
          </p>
        </div>

        {/* Table */}
        <DataTable columns={columns} data={filteredDormitories} />
      </div>
    </DashboardLayout>
  );
}
