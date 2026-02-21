import { useEffect, useState } from 'react';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { categories as initialCategories, Category } from '@/lib/dummyData';
import { Plus, Laptop, Book, Armchair, Shirt, Dumbbell, ChefHat, Gamepad2, Bike, Package } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? '';

const iconMap: Record<string, React.ComponentType<{ className?: string }>> = {
  Laptop, Book, Armchair, Shirt, Dumbbell, ChefHat, Gamepad2, Bike, Package,
};

export default function Categories() {
  const [categories, setCategories] = useState<Category[]>(initialCategories);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newCategory, setNewCategory] = useState({ name: '', description: '', logo: '', parentId: '' });
  const { admin } = useAuth();
  const [totalCategories, setTotalCategories] = useState<number>(initialCategories.length);
  const [totalProducts, setTotalProducts] = useState<number>(initialCategories.reduce((acc, c) => acc + c.productCount, 0));

  useEffect(() => {
    let ignore = false;
    const fetchCategories = async () => {
      if (!admin) {
        setCategories(initialCategories);
        setTotalCategories(initialCategories.length);
        setTotalProducts(initialCategories.reduce((acc, c) => acc + c.productCount, 0));
        return;
      }
      try {
        const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
          method: 'GET',
          headers: {
            Authorization: `${admin.tokenType} ${admin.token}`,
            Accept: 'application/json',
          },
        });
        const data:
          | {
              message?: string;
              total_categories?: number | string;
              total_products?: number | string;
              categories?: Array<{ id: number | string; name?: string | null; description?: string | null; logo?: string | null; parent_id?: number | string | null; product_count?: number | string | null }>;
            }
          | undefined = await response.json().catch(() => undefined);
        if (!response.ok || !data?.categories) {
          const message =
            data && typeof data.message === 'string'
              ? data.message
              : response.status === 403
              ? 'Unauthorized: Only administrators can access this endpoint.'
              : 'Failed to load categories';
          toast.error(message);
          setCategories(initialCategories);
          setTotalCategories(initialCategories.length);
          setTotalProducts(initialCategories.reduce((acc, c) => acc + c.productCount, 0));
          return;
        }
        if (!ignore) {
          const mapped: Category[] = data.categories.map((c) => ({
            id: String(c.id),
            name: (c.name ?? '').trim() || 'Category',
            description: (c.description ?? '') || '',
            productCount: Number(c.product_count ?? 0) || 0,
            icon: 'Package',
            createdAt: '',
          }));
          setCategories(mapped);
          setTotalCategories(Number(data.total_categories ?? mapped.length) || mapped.length);
          setTotalProducts(Number(data.total_products ?? 0) || 0);
        }
      } catch {
        toast.error('Failed to load categories');
        setCategories(initialCategories);
        setTotalCategories(initialCategories.length);
        setTotalProducts(initialCategories.reduce((acc, c) => acc + c.productCount, 0));
      }
    };
    fetchCategories();
    return () => {
      ignore = true;
    };
  }, [admin]);

  const handleCreate = async () => {
    const name = newCategory.name.trim();
    const description = newCategory.description.trim();
    const logo = newCategory.logo.trim();
    const parentIdNum = newCategory.parentId ? Number(newCategory.parentId) : null;
    if (!name) {
      toast.error('Name is required');
      return;
    }
    if (!admin) {
      toast.error('Unauthorized: Only administrators can access this endpoint.');
      return;
    }
    try {
      const response = await fetch(`${API_BASE_URL}/api/admin/categories`, {
        method: 'POST',
        headers: {
          Authorization: `${admin.tokenType} ${admin.token}`,
          'Content-Type': 'application/json',
          Accept: 'application/json',
        },
        body: JSON.stringify({
          name,
          description: description || null,
          logo: logo || null,
          parent_id: parentIdNum,
        }),
      });
      const data:
        | {
            message?: string;
            category?: {
              id: number | string;
              name?: string | null;
              description?: string | null;
              logo?: string | null;
              parent_id?: number | string | null;
              created_at?: string | null;
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
      if (response.status !== 201 || !data?.category) {
        toast.error(data?.message || 'Failed to create category');
        return;
      }
      const c = data.category;
      const category: Category = {
        id: String(c.id),
        name: (c.name ?? name) || name,
        description: (c.description ?? description) || '',
        productCount: 0,
        icon: 'Package',
        createdAt: (c.created_at ?? new Date().toISOString().split('T')[0]).trim(),
      };
      setCategories([...categories, category]);
      setNewCategory({ name: '', description: '', logo: '', parentId: '' });
      setIsDialogOpen(false);
      toast.success(data.message ?? 'Category created successfully');
    } catch {
      toast.error('Failed to create category');
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-foreground">Categories</h1>
            <p className="text-muted-foreground">Manage product categories</p>
          </div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button className="gradient-primary text-primary-foreground">
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-card border-border">
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Category</DialogTitle>
                <DialogDescription className="text-muted-foreground">
                  Add a new product category.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Category Name</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Electronics"
                    value={newCategory.name}
                    onChange={(e) => setNewCategory({ ...newCategory, name: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="Describe this category..."
                    value={newCategory.description}
                    onChange={(e) => setNewCategory({ ...newCategory, description: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo (emoji)</Label>
                  <Input
                    id="logo"
                    placeholder="e.g., 🧰"
                    value={newCategory.logo}
                    onChange={(e) => setNewCategory({ ...newCategory, logo: e.target.value })}
                    className="bg-secondary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="parent">Parent Category</Label>
                  <Select
                    value={newCategory.parentId}
                    onValueChange={(value) => setNewCategory({ ...newCategory, parentId: value })}
                  >
                    <SelectTrigger className="bg-secondary/50">
                      <SelectValue placeholder="None" />
                    </SelectTrigger>
                    <SelectContent>
                      {categories.map((c) => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Categories</p>
            <p className="text-2xl font-bold text-foreground">{totalCategories}</p>
          </div>
          <div className="bg-card rounded-xl border border-border p-4">
            <p className="text-sm text-muted-foreground">Total Products</p>
            <p className="text-2xl font-bold text-foreground">{totalProducts.toLocaleString()}</p>
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {categories.map((category) => {
            const IconComponent = iconMap[category.icon] || Package;
            return (
              <div 
                key={category.id}
                className="bg-card rounded-xl border border-border p-6 hover:border-primary/50 transition-colors animate-fade-in"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4">
                  <IconComponent className="w-6 h-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground mb-1">{category.name}</h3>
                <p className="text-sm text-muted-foreground mb-4 line-clamp-2">{category.description}</p>
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">{category.productCount.toLocaleString()} products</span>
                  <span className="text-xs text-muted-foreground">{category.createdAt}</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </DashboardLayout>
  );
}
