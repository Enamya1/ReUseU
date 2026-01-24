import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Package } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import {
  Pagination,
  PaginationContent,
  PaginationEllipsis,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@/components/ui/pagination';
import { Product } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from '@/hooks/use-toast';

const MyListingsPage: React.FC = () => {
  const { user, isAuthenticated, getMyProductCards } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);

  const paginationItems = useMemo(() => {
    if (totalPages <= 7) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }
    const items: Array<number | 'ellipsis'> = [];
    items.push(1);

    const start = Math.max(2, page - 1);
    const end = Math.min(totalPages - 1, page + 1);

    if (start > 2) items.push('ellipsis');
    for (let p = start; p <= end; p++) items.push(p);
    if (end < totalPages - 1) items.push('ellipsis');

    items.push(totalPages);
    return items;
  }, [page, totalPages]);

  useEffect(() => {
    if (!isAuthenticated || !user) return;
    let cancelled = false;

    const run = async () => {
      setIsLoading(true);
      try {
        const data = await getMyProductCards({ page, page_size: pageSize });
        if (cancelled) return;

        setTotal(typeof data.total === 'number' ? data.total : 0);
        setTotalPages(typeof data.total_pages === 'number' && data.total_pages > 0 ? data.total_pages : 1);

        const mapped = (data.products || []).map((card) => {
          const dormitoryId = card.dormitory?.id ?? 0;
          const categoryId = card.category?.id ?? 0;
          const conditionLevelId = card.condition_level?.id ?? 0;
          const thumbnailUrl = card.image_thumbnail_url || undefined;

          return {
            id: card.id,
            seller_id: user.id,
            dormitory_id: dormitoryId,
            dormitory: card.dormitory
              ? {
                  id: card.dormitory.id,
                  dormitory_name: card.dormitory.dormitory_name,
                  domain: '',
                  location: undefined,
                  is_active: card.dormitory.is_active ?? true,
                  university_id: card.dormitory.university_id ?? 0,
                }
              : undefined,
            category_id: categoryId,
            category: card.category
              ? {
                  id: card.category.id,
                  name: card.category.name,
                  parent_id: card.category.parent_id ?? undefined,
                }
              : undefined,
            condition_level_id: conditionLevelId,
            condition_level: card.condition_level
              ? {
                  id: card.condition_level.id,
                  name: card.condition_level.name,
                  description: card.condition_level.description || undefined,
                  sort_order: card.condition_level.sort_order ?? 0,
                }
              : undefined,
            title: card.title,
            description: undefined,
            price: card.price,
            status: card.status,
            is_promoted: false,
            created_at: card.created_at,
            images: thumbnailUrl
              ? [
                  {
                    id: 0,
                    product_id: card.id,
                    image_url: thumbnailUrl,
                    image_thumbnail_url: thumbnailUrl,
                    is_primary: true,
                  },
                ]
              : [],
            tags: [],
          };
        });

        setProducts(mapped);
      } catch (error) {
        const maybe = error as { message?: string } | undefined;
        if (!cancelled) {
          toast({
            title: "Error",
            description: maybe?.message || "Failed to load your listings",
            variant: "destructive",
          });
          setProducts([]);
          setTotal(0);
          setTotalPages(1);
        }
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    run();
    return () => {
      cancelled = true;
    };
  }, [getMyProductCards, isAuthenticated, page, pageSize, user]);

  if (!isAuthenticated || !user) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">Manage your listings</h1>
            <p className="text-muted-foreground mb-6">
              Log in to view and manage your listings.
            </p>
            <Button asChild>
              <Link to="/login">
                Log in
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              My Listings
            </h1>
            <p className="text-muted-foreground">
              {total} {total === 1 ? 'item' : 'items'} listed
            </p>
          </div>
          <Button asChild>
            <Link to="/create-listing">
              <Plus className="w-4 h-4" />
              New Listing
            </Link>
          </Button>
        </div>

        {isLoading ? (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Loading listings...</h2>
            <p className="text-muted-foreground">Fetching your items</p>
          </div>
        ) : products.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No listings yet</h2>
            <p className="text-muted-foreground mb-6">
              Start selling by creating your first listing.
            </p>
            <Button asChild>
              <Link to="/create-listing">
                <Plus className="w-4 h-4" />
                Create listing
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            <ProductGrid products={products} />

            {totalPages > 1 ? (
              <Pagination>
                <PaginationContent>
                  {page > 1 ? (
                    <PaginationItem>
                      <PaginationPrevious
                        href="#"
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.max(1, p - 1));
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
                          onClick={(e) => {
                            e.preventDefault();
                            setPage(item);
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
                        onClick={(e) => {
                          e.preventDefault();
                          setPage((p) => Math.min(totalPages, p + 1));
                        }}
                      />
                    </PaginationItem>
                  ) : null}
                </PaginationContent>
              </Pagination>
            ) : null}
          </div>
        )}
      </div>
    </MainLayout>
  );
};

export default MyListingsPage;
