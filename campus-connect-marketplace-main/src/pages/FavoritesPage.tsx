import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, ArrowRight } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import { mockProducts } from '@/lib/mockData';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';

const FavoritesPage: React.FC = () => {
  const { favorites } = useFavorites();
  const { isAuthenticated } = useAuth();

  const favoriteProducts = mockProducts.filter(p => favorites.includes(p.id));

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
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Your Favorites
            </h1>
            <p className="text-muted-foreground">
              {favoriteProducts.length} {favoriteProducts.length === 1 ? 'item' : 'items'} saved
            </p>
          </div>
        </div>

        {favoriteProducts.length === 0 ? (
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
        ) : (
          <ProductGrid products={favoriteProducts} />
        )}
      </div>
    </MainLayout>
  );
};

export default FavoritesPage;
