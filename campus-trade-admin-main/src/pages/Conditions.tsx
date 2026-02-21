import { useEffect, useMemo, useState } from 'react';
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
import { useAuth } from '@/contexts/AuthContext';
import { Skeleton } from '@/components/ui/skeleton';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

export default function Conditions() {
  const [conditions, setConditions] = useState<Condition[]>(initialConditions);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCondition, setNewCondition] = useState({ name: '', description: '' });
  const [ratingStars, setRatingStars] = useState<number>(0);
  const [hoverStar, setHoverStar] = useState<{ index: number; half: 'left' | 'right' } | null>(null);
  const levelValue = useMemo(() => Math.max(0, Math.min(10, Math.round(ratingStars * 2))), [ratingStars]);
  const { admin } = useAuth();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let ignore = false;
    const fetchConditions = async () => {
      if (!admin) {
        setConditions(initialConditions);
        return;
      }
      setLoading(true);
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/condition-levels`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data:
          | {
              message?: string;
              condition_levels?: Array<{
                id: number | string;
                name?: string | null;
                description?: string | null;
                level?: number | string | null;
                created_at?: string | null;
              }>;
            }
          | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.condition_levels) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : 'Failed to load condition levels';
          toast.error(message);
          setConditions(initialConditions);
          setLoading(false);
          return;
        }
        if (!ignore) {
          const mapped: Condition[] = data.condition_levels.map((c) => ({
            id: String(c.id),
            name: (c.name ?? '').trim() || 'Condition',
            description: (c.description ?? '') || '',
            level: Number(c.level ?? 0) || 0,
            createdAt: c.created_at ?? new Date().toISOString().split('T')[0],
          }));
          setConditions(mapped);
          setLoading(false);
        }
      } catch {
        toast.error('Failed to load condition levels');
        setConditions(initialConditions);
        setLoading(false);
      }
    };
    fetchConditions();
    return () => {
      ignore = true;
    };
  }, [admin]);

  const handleCreate = async () => {
    const name = newCondition.name.trim();
    const description = newCondition.description.trim();
    const level = levelValue;
    if (!name) {
      toast.error('Name is required');
      return;
    }
    if (!admin) {
      toast.error('Unauthorized: Only administrators can access this endpoint.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/condition-levels`, {
        method: 'POST',
        headers: {
          Authorization: `${admin.tokenType} ${admin.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || null,
          level,
        }),
      });
      const data:
        | {
            message?: string;
            condition_level?: {
              id: number | string;
              name?: string | null;
              description?: string | null;
              sort_order?: number | string | null;
              level?: number | string | null;
            };
            errors?: Record<string, string[]>;
          }
        | undefined = await response.json().catch(() => undefined);
      if (response.status === 403) {
        toast.error('Unauthorized: Only administrators can access this endpoint.');
        return;
      }
      if (response.status === 422 && data?.errors) {
        const firstError = Object.values(data.errors)[0]?.[0] ?? 'Validation Error';
        toast.error(firstError);
        return;
      }
      if (response.status !== 201 || !data?.condition_level) {
        toast.error(data?.message || 'Failed to create condition level');
        return;
      }
      const c = data.condition_level;
      const condition: Condition = {
        id: String(c.id),
        name: (c.name ?? name),
        description: (c.description ?? description) || '',
        level: Number(c.level ?? level) || level,
        createdAt: new Date().toISOString().split('T')[0],
      };
      setConditions([...conditions, condition]);
      setNewCondition({ name: '', description: '' });
      setRatingStars(0);
      setIsDialogOpen(false);
      toast.success(data.message ?? 'Condition level created successfully');
    } catch {
      toast.error('Failed to create condition level');
    }
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
                  <Label>Level (0–10 via 5-star)</Label>
                  <div className="flex items-center gap-2">
                    {[0, 1, 2, 3, 4].map((i) => {
                      const full = ratingStars >= i + 1;
                      const half = ratingStars === i + 0.5;
                      const selectedColor =
                        ratingStars === 5
                          ? 'text-green-500'
                          : ratingStars <= 1 && ratingStars > 0
                          ? 'text-red-500'
                          : ratingStars > 1
                          ? 'text-blue-500'
                          : 'text-muted-foreground';
                      const showHoverFull = hoverStar && hoverStar.index === i && hoverStar.half === 'right';
                      const showHoverHalf = hoverStar && hoverStar.index === i && hoverStar.half === 'left';
                      return (
                        <div key={`star-input-${i}`} className="relative w-6 h-6">
                          <Star className={cn('w-6 h-6 text-muted-foreground')} />
                          {full && <Star className={cn('w-6 h-6 fill-current absolute inset-0', selectedColor)} />}
                          {half && (
                            <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                              <Star className={cn('w-6 h-6 fill-current', selectedColor)} />
                            </div>
                          )}
                          {showHoverFull && <Star className="w-6 h-6 text-red-500 fill-current absolute inset-0 pointer-events-none" />}
                          {showHoverHalf && (
                            <div className="absolute inset-0 overflow-hidden pointer-events-none" style={{ width: '50%' }}>
                              <Star className="w-6 h-6 text-red-500 fill-current" />
                            </div>
                          )}
                          <button
                            type="button"
                            className="absolute left-0 top-0 w-1/2 h-full"
                            onMouseEnter={() => setHoverStar({ index: i, half: 'left' })}
                            onMouseLeave={() => setHoverStar(null)}
                            onClick={() => setRatingStars(i + 0.5)}
                            aria-label={`${i + 0.5} stars`}
                            title={`${i + 0.5} stars (level ${Math.round((i + 0.5) * 2)})`}
                          />
                          <button
                            type="button"
                            className="absolute right-0 top-0 w-1/2 h-full"
                            onMouseEnter={() => setHoverStar({ index: i, half: 'right' })}
                            onMouseLeave={() => setHoverStar(null)}
                            onClick={() => setRatingStars(i + 1)}
                            aria-label={`${i + 1} stars`}
                            title={`${i + 1} stars (level ${Math.round((i + 1) * 2)})`}
                          />
                        </div>
                      );
                    })}
                    <span className="ml-2 text-xs text-muted-foreground">Level {levelValue}</span>
                  </div>
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
          {loading &&
            Array.from({ length: 6 }).map((_, idx) => (
              <div
                key={`skeleton-${idx}`}
                className="bg-card rounded-xl border border-border p-6 animate-fade-in"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-2">
                    {Array.from({ length: 5 }).map((__, i) => (
                      <Skeleton key={`sk-star-${i}`} className="w-5 h-5 rounded-sm" />
                    ))}
                  </div>
                  <Skeleton className="h-4 w-20" />
                </div>
                <Skeleton className="h-5 w-40 mb-2" />
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-24 mt-4" />
              </div>
            ))}
          {!loading && conditions.sort((a, b) => b.level - a.level).map((condition) => {
            const fullStars = Math.floor(Number(condition.level) / 2);
            const hasHalf = Number(condition.level) % 2 === 1;
            return (
            <div 
              key={condition.id}
              className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors animate-fade-in"
            >
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-2">
                  {[0,1,2,3,4].map((i) => {
                    const full = i < fullStars;
                    const half = i === fullStars && hasHalf;
                    return (
                      <div key={`star-${condition.id}-${i}`} className="relative w-5 h-5">
                        <Star className="w-5 h-5 text-muted-foreground" />
                        {full && <Star className={cn('w-5 h-5 fill-current absolute inset-0', getLevelColor(fullStars))} />}
                        {half && (
                          <div className="absolute inset-0 overflow-hidden" style={{ width: '50%' }}>
                            <Star className={cn('w-5 h-5 fill-current', getLevelColor(fullStars + 1))} />
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
                <span className="text-xs text-muted-foreground bg-secondary px-2 py-1 rounded-full">
                  Level {condition.level}
                </span>
              </div>
              <h3 className="font-semibold text-foreground text-lg mb-2">{condition.name}</h3>
              <p className="text-sm text-muted-foreground">{condition.description}</p>
              <p className="text-xs text-muted-foreground mt-4">Created: {condition.createdAt}</p>
            </div>
          )})}
        </div>
      </div>
    </DashboardLayout>
  );
}
