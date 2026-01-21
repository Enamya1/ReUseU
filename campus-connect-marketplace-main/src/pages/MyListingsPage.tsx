import React from 'react';
import { Link } from 'react-router-dom';
import { Plus, ArrowRight, Package } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import { Button } from '@/components/ui/button';
import { getUserProducts } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';

const MyListingsPage: React.FC = () => {
  const { user, isAuthenticated } = useAuth();

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

  const myProducts = getUserProducts(user.id);

  return (
    <MainLayout>
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              My Listings
            </h1>
            <p className="text-muted-foreground">
              {myProducts.length} {myProducts.length === 1 ? 'item' : 'items'} listed
            </p>
          </div>
          <Button asChild>
            <Link to="/create-listing">
              <Plus className="w-4 h-4" />
              New Listing
            </Link>
          </Button>
        </div>

        {myProducts.length === 0 ? (
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
          <ProductGrid products={myProducts} />
        )}
      </div>
    </MainLayout>
  );
};

export default MyListingsPage;
