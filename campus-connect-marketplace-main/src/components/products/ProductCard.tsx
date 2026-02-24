import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { Product, formatPrice } from '@/lib/mockData';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/api';
import { useTranslation } from 'react-i18next';

interface ProductCardProps {
  product: Product;
  className?: string;
  linkTo?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className, linkTo }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { t } = useTranslation();
  const favorite = isFavorite(product.id);

  const primaryImage = product.images.find(img => img.is_primary) || product.images[0];

  const handleFavoriteClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    toggleFavorite(product.id);
  };

  return (
    <Link
      to={linkTo || `/product/${product.id}`}
      className={cn(
        "group block bg-card/70 border border-white/10 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={normalizeImageUrl(primaryImage.image_url)}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            {t('productCard.noImage')}
          </div>
        )}

        {/* Favorite Button */}
        <button
          onClick={handleFavoriteClick}
          className={cn(
            "absolute top-3 right-3 p-2 rounded-full backdrop-blur-sm transition-all duration-200",
            favorite
              ? "bg-primary text-primary-foreground"
              : "bg-card/80 text-foreground hover:bg-card"
          )}
          aria-label={favorite ? t('productCard.favoriteRemove') : t('productCard.favoriteAdd')}
        >
          <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
        </button>

        {/* Promoted Badge */}
        {product.is_promoted && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-warning text-warning-foreground border-0 gap-1">
              <Star className="w-3 h-3 fill-current" />
              {t('product.featured')}
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        {product.status !== 'available' && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-base font-semibold">
              {product.status === 'sold' ? t('product.sold') : t('product.reserved')}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Price */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-base font-semibold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.condition_level && (
            <Badge variant="outline" className="text-[10px]">
              {product.condition_level.name}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-sm font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        {product.distance_km !== undefined && (
          <div className="text-[10px] text-tertiary font-medium">
            {t('product.distanceKm', { count: product.distance_km })}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
