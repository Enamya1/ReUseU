import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Package, LayoutGrid, List } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import ProductList from '@/components/products/ProductList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
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
import { useTranslation } from 'react-i18next';

const MyListingsPage: React.FC = () => {
  const { user, isAuthenticated, getMyProductCards } = useAuth();
  const { t } = useTranslation();
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(12);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [products, setProducts] = useState<Product[]>([]);
  const [activeTab, setActiveTab] = useState<'sell' | 'exchange'>('sell');
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');
  const skeletonItems = useMemo(() => Array.from({ length: pageSize }, (_, i) => i), [pageSize]);

  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      if (activeTab === 'exchange') return !!p.exchange_type;
      return !p.exchange_type;
    });
  }, [products, activeTab]);

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
          const rawPrice = (card as { price?: number | string }).price;
          const parsedPrice =
            typeof rawPrice === 'number'
              ? rawPrice
              : typeof rawPrice === 'string'
                ? Number(rawPrice)
                : 0;

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
            price: Number.isFinite(parsedPrice) ? parsedPrice : 0,
            currency: typeof card.currency === 'string' ? card.currency : undefined,
            status: card.status,
            is_promoted: false,
            created_at: card.created_at,
            exchange_type: card.exchange_type,
            target_product_title: card.target_product_title,
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
            title: t('listings.loadErrorTitle'),
            description: maybe?.message || t('listings.loadErrorDesc'),
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
  }, [getMyProductCards, isAuthenticated, page, pageSize, t, user]);

  if (!isAuthenticated || !user) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">{t('listings.manageTitle')}</h1>
            <p className="text-muted-foreground mb-6">
              {t('listings.manageSubtitle')}
            </p>
            <Button asChild>
              <Link to="/login">
                {t('common.login')}
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              {t('listings.title')}
            </h1>
            <p className="numeric-text text-muted-foreground">
              {t('listings.itemsCount', { count: total })}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing</span>
              <Badge variant="secondary">{filteredProducts.length}</Badge>
              <span>items</span>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                variant={viewMode === 'card' ? 'default' : 'outline'} 
                size="icon"
                onClick={() => setViewMode('card')}
              >
                <LayoutGrid className="h-4 w-4" />
              </Button>
              <Button 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                size="icon"
                onClick={() => setViewMode('list')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Button asChild>
              <Link to="/create-listing">
                <Plus className="w-4 h-4" />
                {t('listings.newListing')}
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex items-center gap-2 mb-8 bg-muted/50 p-1 rounded-lg w-fit">
          <Button
            variant={activeTab === 'sell' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('sell')}
            className="rounded-md"
          >
            {t('createListing.sell')}
          </Button>
          <Button
            variant={activeTab === 'exchange' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => setActiveTab('exchange')}
            className="rounded-md"
          >
            {t('createListing.exchange')}
          </Button>
        </div>

        {isLoading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {skeletonItems.map((item) => (
                <div
                  key={item}
                  className="rounded-xl border border-border bg-card shadow-card overflow-hidden animate-pulse"
                >
                  <div className="aspect-square bg-muted" />
                  <div className="p-4 space-y-3">
                    <div className="h-4 bg-muted rounded w-2/3" />
                    <div className="h-3 bg-muted rounded w-1/2" />
                    <div className="h-3 bg-muted rounded w-3/4" />
                  </div>
                </div>
              ))}
            </div>
            <div className="flex justify-center">
              <div className="h-10 w-48 rounded-full bg-muted animate-pulse" />
            </div>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Package className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">
              {activeTab === 'sell' ? t('listings.emptyTitle') : t('listings.noExchangeListings')}
            </h2>
            <p className="text-muted-foreground mb-6">
              {activeTab === 'sell' ? t('listings.emptySubtitle') : t('listings.noExchangeListingsSubtitle')}
            </p>
            <Button asChild>
              <Link to="/create-listing">
                <Plus className="w-4 h-4" />
                {t('listings.createListing')}
              </Link>
            </Button>
          </div>
        ) : (
          <div className="space-y-8">
            {viewMode === 'card' ? (
              <ProductGrid
                products={filteredProducts}
                getProductLink={(product) => `/my-listings/${product.id}`}
              />
            ) : (
              <ProductList
                products={filteredProducts}
                getProductLink={(product) => `/my-listings/${product.id}`}
              />
            )}

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
