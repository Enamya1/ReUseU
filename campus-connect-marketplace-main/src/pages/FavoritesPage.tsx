import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight, Loader2, LayoutGrid, List } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import ProductList from '@/components/products/ProductList';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';

const FavoritesPage: React.FC = () => {
  const { favoriteProducts, isLoading } = useFavorites();
  const { isAuthenticated } = useAuth();
  const [viewMode, setViewMode] = useState<'card' | 'list'>('card');

  if (!isAuthenticated) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">Save your favorites</h1>
            <p className="text-muted-foreground mb-6">
              Log in to save items and keep track of your favorite finds.
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
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Your Favorites
            </h1>
            <p className="text-muted-foreground">
              <span className="numeric-text">{favoriteProducts.length}</span> {favoriteProducts.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <span>Showing</span>
              <Badge variant="secondary">{favoriteProducts.length}</Badge>
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
          </div>
        </div>

        {isLoading ? (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Loader2 className="w-12 h-12 text-muted-foreground animate-spin" />
            </div>
            <h2 className="text-xl font-semibold mb-2">Loading favorites...</h2>
          </div>
        ) : favoriteProducts.length === 0 ? (
          <div className="max-w-md mx-auto text-center py-12">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <Heart className="w-12 h-12 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold mb-2">No favorites yet</h2>
            <p className="text-muted-foreground mb-6">
              Start browsing and save items you love by clicking the heart icon.
            </p>
            <Button asChild>
              <Link to="/">
                Browse items
                <ArrowRight className="w-4 h-4" />
              </Link>
            </Button>
          </div>
        ) : viewMode === 'card' ? (
          <ProductGrid products={favoriteProducts} />
        ) : (
          <ProductList products={favoriteProducts} />
        )}
      </div>
    </MainLayout>
  );
};

export default FavoritesPage;
