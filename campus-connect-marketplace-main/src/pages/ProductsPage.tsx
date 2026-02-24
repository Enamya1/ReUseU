import React, { useEffect, useMemo, useState } from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import {
  mockCategories,
  mockConditionLevels,
  mockProducts,
  mockTags,
  type Product,
} from '@/lib/mockData';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { cn } from '@/lib/utils';
import { LayoutGrid, List, Search, SlidersHorizontal } from 'lucide-react';

const ProductsPage: React.FC = () => {
  const products = mockProducts;
  const [search, setSearch] = useState('');
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 0]);
  const [selectedCategories, setSelectedCategories] = useState<number[]>([]);
  const [selectedConditions, setSelectedConditions] = useState<number[]>([]);
  const [selectedTags, setSelectedTags] = useState<number[]>([]);
  const [selectedColors, setSelectedColors] = useState<string[]>([]);
  const [selectedSizes, setSelectedSizes] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState('default');
  const [page, setPage] = useState(1);

  const maxPrice = useMemo(
    () => Math.max(0, ...products.map((product) => product.price)),
    [products],
  );

  useEffect(() => {
    setPriceRange([0, maxPrice]);
  }, [maxPrice]);

  const categoryCounts = useMemo(() => {
    return products.reduce<Record<number, number>>((acc, product) => {
      acc[product.category_id] = (acc[product.category_id] ?? 0) + 1;
      return acc;
    }, {});
  }, [products]);

  const filteredProducts = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();
    let results = products.filter((product) => {
      const matchesSearch =
        normalizedSearch.length === 0 ||
        product.title.toLowerCase().includes(normalizedSearch) ||
        (product.description ?? '').toLowerCase().includes(normalizedSearch);
      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(product.category_id);
      const matchesPrice = product.price >= priceRange[0] && product.price <= priceRange[1];
      const matchesCondition =
        selectedConditions.length === 0 ||
        selectedConditions.includes(product.condition_level_id);
      const matchesTags =
        selectedTags.length === 0 ||
        product.tags.some((tag) => selectedTags.includes(tag.id));
      return matchesSearch && matchesCategory && matchesPrice && matchesCondition && matchesTags;
    });

    if (sortValue === 'price-asc') {
      results = [...results].sort((a, b) => a.price - b.price);
    }
    if (sortValue === 'price-desc') {
      results = [...results].sort((a, b) => b.price - a.price);
    }
    if (sortValue === 'newest') {
      results = [...results].sort(
        (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
      );
    }

    return results;
  }, [priceRange, products, search, selectedCategories, selectedConditions, selectedTags, sortValue]);

  useEffect(() => {
    setPage(1);
  }, [search, priceRange, selectedCategories, selectedConditions, selectedTags, sortValue]);

  const pageSize = 24;
  const totalPages = Math.max(1, Math.ceil(filteredProducts.length / pageSize));
  const pagedProducts = useMemo(() => {
    const start = (page - 1) * pageSize;
    return filteredProducts.slice(start, start + pageSize);
  }, [filteredProducts, page]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 5) {
      return Array.from({ length: totalPages }, (_, idx) => idx + 1);
    }
    if (page <= 3) {
      return [1, 2, 3, 'ellipsis', totalPages];
    }
    if (page >= totalPages - 2) {
      return [1, 'ellipsis', totalPages - 2, totalPages - 1, totalPages];
    }
    return [1, 'ellipsis', page - 1, page, page + 1, 'ellipsis', totalPages];
  }, [page, totalPages]);

  const colorOptions = [
    { id: 'slate', className: 'bg-slate-900' },
    { id: 'emerald', className: 'bg-emerald-500' },
    { id: 'amber', className: 'bg-amber-400' },
    { id: 'rose', className: 'bg-rose-500' },
    { id: 'sky', className: 'bg-sky-500' },
    { id: 'violet', className: 'bg-violet-500' },
  ];

  const sizeOptions = ['4', '6', '8', '10', '12', '14', '16', '18', '20'];

  const toggleValue = <T,>(value: T, setValue: React.Dispatch<React.SetStateAction<T[]>>) => {
    setValue((current) =>
      current.includes(value) ? current.filter((item) => item !== value) : [...current, value],
    );
  };

  return (
    <MainLayout>
      <div className="container py-8 md:py-12">
        <div className="grid gap-8 lg:grid-cols-[280px_1fr]">
          <aside className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-5 space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
              </div>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search products"
                  className="pl-9"
                />
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Price</div>
                <Slider
                  min={0}
                  max={maxPrice}
                  step={5}
                  value={priceRange}
                  onValueChange={(value) => setPriceRange(value as [number, number])}
                />
                <div className="flex items-center justify-between text-xs text-muted-foreground">
                  <span>${priceRange[0].toFixed(0)}</span>
                  <span>${priceRange[1].toFixed(0)}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Color</div>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map((color) => (
                    <button
                      key={color.id}
                      type="button"
                      onClick={() => toggleValue(color.id, setSelectedColors)}
                      className={cn(
                        "h-6 w-6 rounded-full border border-border transition-transform",
                        color.className,
                        selectedColors.includes(color.id) && "ring-2 ring-primary ring-offset-2 ring-offset-card",
                      )}
                      aria-label={color.id}
                    />
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Size</div>
                <div className="grid grid-cols-5 gap-2">
                  {sizeOptions.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => toggleValue(size, setSelectedSizes)}
                      className={cn(
                        "h-9 rounded-md border border-border text-xs font-medium transition-colors",
                        selectedSizes.includes(size)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Category</div>
                <div className="space-y-2">
                  {mockCategories.map((category) => (
                    <label key={category.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedCategories.includes(category.id)}
                          onCheckedChange={() => toggleValue(category.id, setSelectedCategories)}
                        />
                        <span className="flex items-center gap-1">
                          <span>{category.icon}</span>
                          <span>{category.name}</span>
                        </span>
                      </span>
                      <span className="text-xs">{categoryCounts[category.id] ?? 0}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Condition</div>
                <div className="space-y-2">
                  {mockConditionLevels.map((condition) => (
                    <label key={condition.id} className="flex items-center justify-between text-sm text-muted-foreground">
                      <span className="flex items-center gap-2">
                        <Checkbox
                          checked={selectedConditions.includes(condition.id)}
                          onCheckedChange={() => toggleValue(condition.id, setSelectedConditions)}
                        />
                        <span>{condition.name}</span>
                      </span>
                      <span className="text-xs text-muted-foreground">#{condition.sort_order}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="space-y-3">
                <div className="text-sm font-semibold text-foreground">Tags</div>
                <div className="flex flex-wrap gap-2">
                  {mockTags.map((tag) => (
                    <button
                      key={tag.id}
                      type="button"
                      onClick={() => toggleValue(tag.id, setSelectedTags)}
                      className={cn(
                        "rounded-full border border-border px-3 py-1 text-xs transition-colors",
                        selectedTags.includes(tag.id)
                          ? "bg-primary text-primary-foreground border-primary"
                          : "bg-background text-muted-foreground hover:text-foreground",
                      )}
                    >
                      {tag.name}
                    </button>
                  ))}
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() => {
                  setSearch('');
                  setSelectedCategories([]);
                  setSelectedConditions([]);
                  setSelectedTags([]);
                  setSelectedColors([]);
                  setSelectedSizes([]);
                  setSortValue('default');
                  setPriceRange([0, maxPrice]);
                }}
              >
                Reset
              </Button>
            </div>
          </aside>

          <div className="space-y-8">
            <div className="rounded-2xl border border-border bg-card p-6">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">Category</h2>
                  <p className="text-sm text-muted-foreground">Pick the right collection to start browsing.</p>
                </div>
                <div className="flex flex-wrap gap-3">
                  {mockCategories.slice(0, 6).map((category) => (
                    <button
                      key={category.id}
                      type="button"
                      className="flex items-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-sm font-medium text-foreground shadow-sm"
                    >
                      <span className="text-lg">{category.icon}</span>
                      <span>{category.name}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div className="rounded-2xl border border-border bg-card px-5 py-4">
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
                  <span>Showing</span>
                  <Badge variant="secondary">{filteredProducts.length}</Badge>
                  <span>items</span>
                </div>
                <div className="flex flex-wrap items-center gap-3">
                  <Select value={sortValue} onValueChange={setSortValue}>
                    <SelectTrigger className="h-9 w-[180px]">
                      <SelectValue placeholder="Default sorting" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default sorting</SelectItem>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-asc">Price: low to high</SelectItem>
                      <SelectItem value="price-desc">Price: high to low</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex items-center gap-2">
                    <Button variant="outline" size="icon">
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button variant="outline" size="icon">
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {mockConditionLevels.map((condition) => (
                  <Badge key={condition.id} variant="outline" className="text-xs">
                    {condition.name}
                  </Badge>
                ))}
              </div>
            </div>

            <ProductGrid
              products={pagedProducts as Product[]}
              className="grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4"
              emptyMessage="No products match these filters."
            />

            {totalPages > 1 ? (
              <Pagination>
                <PaginationContent>
                  {page > 1 ? (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage((prev) => Math.max(1, prev - 1));
                        }}
                      />
                    </PaginationItem>
                  ) : null}

                  {paginationItems.map((item, idx) =>
                    item === 'ellipsis' ? (
                      <PaginationItem key={`ellipsis-${idx}`}>
                        <PaginationEllipsis />
                      </PaginationItem>
                    ) : (
                      <PaginationItem key={item}>
                        <PaginationLink
                          href="#"
                          isActive={item === page}
                          onClick={(event) => {
                            event.preventDefault();
                            setPage(item as number);
                          }}
                        >
                          {item}
                        </PaginationLink>
                      </PaginationItem>
                    ),
                  )}

                  {page < totalPages ? (
                    <PaginationItem>
                      <PaginationNext
                        href="#"
                        onClick={(event) => {
                          event.preventDefault();
                          setPage((prev) => Math.min(totalPages, prev + 1));
                        }}
                      />
                    </PaginationItem>
                  ) : null}
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ProductsPage;
