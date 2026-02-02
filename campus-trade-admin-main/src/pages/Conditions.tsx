import { useState } from 'react';
import { DashboardLayout } from '@/components/layout/DashboardLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { conditions as initialConditions, Condition } from '@/lib/dummyData';
import { Plus, Star } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

export default function Conditions() {
  const [conditions, setConditions] = useState<Condition[]>(initialConditions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCondition, setNewCondition] = useState({ name: '', description: '', level: '' });

  const handleCreate = () => {
    if (!newCondition.name || !newCondition.description || !newCondition.level) {
      toast.error('Please fill in all fields');
      return;
    }

    const condition: Condition = {
      id: String(conditions.length + 1),
      name: newCondition.name,
      description: newCondition.description,
      level: parseInt(newCondition.level),
      createdAt: new Date().toISOString().split('T')[0],
    };

    setConditions([...conditions, condition]);
    setNewCondition({ name: '', description: '', level: '' });
    setIsDialogOpen(false);
    toast.success('Condition created successfully');
  };

  const getLevelColor = (level: number) => {
    if (level >= 4) return 'text-success';
    if (level >= 3) return 'text-primary';
    if (level >= 2) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Condition Levels</h1>
            <p className="text-muted-foreground">Define product condition standards</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Condition
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Condition Level</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Define a new condition level for products.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Condition Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Like New"
                    value={newCondition.name}
                    onChange={(e) => setNewCondition({ ...newCondition, name: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="level">Level (1-5)</Label>
                  <Input
                    id="level"
                    type="number"
                    min="1"
                    max="5"
                    placeholder="5"
                    value={newCondition.level}
                    onChange={(e) => setNewCondition({ ...newCondition, level: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this condition level..."
                    value={newCondition.description}
                    onChange={(e) => setNewCondition({ ...newCondition, description: e.target.value })}
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

        {/* Conditions List */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {conditions.sort((a, b) => b.level - a.level).map((condition) => (
            <div 
              key={condition.id}
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors animate-fade-in"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {[...Array(5)].map((_, i) => (
                    <Star 
                      key={i}
                      className={cn(
                        "w-5 h-5",
                        i < condition.level 
                          ? `${getLevelColor(condition.level)} fill-current` 
                          : "text-muted"
                      )}
                    />
                  ))}
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  Level {condition.level}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{condition.name}</h3>
              <p className="text-sm text-muted-foreground">{condition.description}</p>
              <p className="text-xs text-muted-foreground mt-4">Created: {condition.createdAt}</p>
            </div>
          ))}
        </div>
      </div>
    </DashboardLayout>
  );
}
