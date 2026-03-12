import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star, MapPin } from 'lucide-react';
import { Product } from '@/lib/mockData';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface ProductListProps {
  products: Product[];
  className?: string;
  emptyMessage?: string;
  getProductLink?: (product: Product) => string;
}

const ProductList: React.FC<ProductListProps> = ({ products, className, emptyMessage = "No products found", getProductLink }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { formatSelectedCurrencyParts } = useCurrency();
  const { t } = useTranslation();

  const handleFavoriteClick = (e: React.MouseEvent, productId: number) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(productId);
  };

  if (products.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center bg-gradient-to-br from-card/50 to-transparent rounded-2xl border border-dashed border-border/40">
        <div className="w-24 h-24 mb-6 rounded-full bg-gradient-to-br from-muted to-muted/60 flex items-center justify-center shadow-lg">
          <span className="text-5xl">📦</span>
        </div>
        <h3 className="text-xl font-semibold text-foreground mb-2">{emptyMessage}</h3>
        <p className="text-muted-foreground/80">Try adjusting your filters to see more results</p>
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {products.map((product) => {
        const favorite = isFavorite(product.id);
        const displayPrice = formatSelectedCurrencyParts(product.price, product.currency);
        const primaryImage = product.images.find(img => img.is_primary) || product.images[0];
        const distanceLabel =
          typeof product.distance_km === 'number'
            ? product.distance_km < 1
              ? `${Math.round(product.distance_km * 1000)} m`
              : `${product.distance_km.toFixed(1)} km`
            : null;

        return (
          <Link
            key={product.id}
            to={getProductLink ? getProductLink(product) : `/product/${product.id}`}
            className="group block bg-gradient-to-br from-card to-card/50 border border-border/60 rounded-xl overflow-hidden shadow-sm hover:shadow-md hover:border-border/80 transition-all duration-300"
          >
            <div className="flex gap-4 p-4">
              {/* Image */}
              <div className="relative w-28 h-28 flex-shrink-0 rounded-xl overflow-hidden bg-muted border border-border/20">
                {primaryImage ? (
                  <img
                    src={normalizeImageUrl(primaryImage.image_url)}
                    alt={product.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    loading="lazy"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground bg-gradient-to-br from-muted to-muted/60">
                    {t('productCard.noImage')}
                  </div>
                )}
                
                {/* Promoted Badge */}
                {product.is_promoted && (
                  <div className="absolute top-2 left-2">
                    <Badge className="bg-gradient-to-r from-yellow-400 to-orange-400 text-white border-0 gap-1 text-xs shadow-sm">
                      <Star className="w-2.5 h-2.5 fill-current" />
                      {t('product.featured')}
                    </Badge>
                  </div>
                )}

                {/* Status Badge */}
                {product.status !== 'available' && (
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 to-black/40 flex items-center justify-center">
                    <Badge variant="secondary" className="text-xs font-semibold bg-white/90 text-black border-0">
                      {product.status === 'sold' ? t('product.sold') : t('product.reserved')}
                    </Badge>
                  </div>
                )}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0 flex flex-col">
                {/* Line 1: Title and Price */}
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1 min-w-0">
                    {/* Title */}
                    <h3 className="text-lg font-bold text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
                      {product.title}
                    </h3>
                    
                    {/* Description */}
                    {product.description && (
                      <p className="text-sm text-muted-foreground/90 line-clamp-2 leading-relaxed">
                        {product.description}
                      </p>
                    )}
                  </div>

                  {/* Price */}
                  <div className="flex-shrink-0 text-right">
                    <span className="price-text inline-flex items-baseline gap-1 text-xl font-bold text-foreground">
                      <span className="text-2xl">{displayPrice.amount}</span>
                      <span className="text-base font-medium opacity-75">{displayPrice.currency}</span>
                    </span>
                  </div>
                </div>

                {/* Line 2: Condition and Tags */}
                <div className="flex items-center gap-3 mt-3">
                  {product.condition_level && (
                    <Badge variant="outline" className="text-xs bg-primary/10 text-primary border-primary/20 font-medium">
                      {product.condition_level.name}
                    </Badge>
                  )}
                  
                  {/* Tags */}
                  {product.tags && product.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1.5">
                      {product.tags.slice(0, 4).map((tag) => (
                        <Badge key={tag.id} variant="secondary" className="text-xs bg-secondary/50 hover:bg-secondary/70 border-secondary/30">
                          {tag.name}
                        </Badge>
                      ))}
                      {product.tags.length > 4 && (
                        <Badge variant="secondary" className="text-xs bg-secondary/50 hover:bg-secondary/70 border-secondary/30">
                          +{product.tags.length - 4}
                        </Badge>
                      )}
                    </div>
                  )}
                </div>

                {/* Line 3: User Profile and Distance */}
                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    {/* User Profile */}
                    {product.seller && (
                      <Link
                        to={`/seller/${product.seller.id}`}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                        onClick={(e) => e.stopPropagation()}
                      >
                        {product.seller.profile_picture ? (
                          <img
                            src={product.seller.profile_picture}
                            alt={product.seller.full_name}
                            className="w-6 h-6 rounded-full object-cover border border-border/30"
                          />
                        ) : (
                          <div className="w-6 h-6 rounded-full bg-gradient-to-br from-primary/20 to-primary/10 flex items-center justify-center text-primary text-xs font-semibold">
                            {product.seller.full_name.charAt(0).toUpperCase()}
                          </div>
                        )}
                        <span className="text-sm text-muted-foreground/80 font-medium hover:text-primary transition-colors">
                          {product.seller.full_name}
                        </span>
                      </Link>
                    )}
                  </div>

                  {/* Distance */}
                  {distanceLabel && (
                    <div className="flex items-center gap-1.5 text-sm text-muted-foreground/80">
                      <MapPin className="w-4 h-4" />
                      <span className="numeric-text font-medium">{distanceLabel}</span>
                    </div>
                  )}
                </div>
              </div>

              {/* Favorite Button */}
              <button
                onClick={(e) => handleFavoriteClick(e, product.id)}
                className={cn(
                  "p-2.5 rounded-full flex-shrink-0 transition-all duration-200 opacity-0 group-hover:opacity-100",
                  favorite
                    ? "bg-white text-black shadow-lg hover:shadow-xl border-2 border-white/20"
                    : "bg-transparent text-white border-2 border-white/60 hover:bg-white/10 hover:border-white/80"
                )}
                aria-label={favorite ? t('productCard.favoriteRemove') : t('productCard.favoriteAdd')}
              >
                <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
              </button>
            </div>
          </Link>
        );
      })}
    </div>
  );
};

export default ProductList;