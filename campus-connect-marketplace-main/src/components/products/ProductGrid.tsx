import React from 'react';
import { Product } from '@/lib/mockData';
import ProductCard from './ProductCard';
import { cn } from '@/lib/utils';

interface ProductGridProps {
  products: Product[];
  className?: string;
  emptyMessage?: string;
  getProductLink?: (product: Product) => string;
}

const ProductGrid: React.FC<ProductGridProps> = ({ 
  products, 
  className,
  emptyMessage = "No products found",
  getProductLink
}) => {
  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-24 h-24 mb-4 rounded-full bg-muted flex items-center justify-center">
          <span className="text-4xl">📦</span>
        </div>
        <p className="text-muted-foreground text-lg">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3 md:gap-4",
        className
      )}
    >
      {products.map((product) => (
        <ProductCard
          key={product.id}
          product={product}
          linkTo={getProductLink ? getProductLink(product) : undefined}
        />
      ))}
    </div>
  );
};

export default ProductGrid;
