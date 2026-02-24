import React from 'react';
import MainLayout from '@/components/layout/MainLayout';
import ProductGrid from '@/components/products/ProductGrid';
import { mockProducts } from '@/lib/mockData';

const ProductsPage: React.FC = () => {
  const products = mockProducts;

  return (
    <MainLayout>
      <div className="container py-8 md:py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-display font-bold text-foreground">
              Browse items
            </h1>
            <p className="text-muted-foreground">
              {products.length} {products.length === 1 ? 'item' : 'items'} available
            </p>
          </div>
        </div>
        <ProductGrid products={products} />
      </div>
    </MainLayout>
  );
};

export default ProductsPage;
