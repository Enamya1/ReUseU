import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { Product } from '@/lib/mockData';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCurrency } from '@/contexts/CurrencyContext';
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
  const { formatSelectedCurrencyParts } = useCurrency();
  const { t } = useTranslation();
  const favorite = isFavorite(product.id);
  const displayPrice = formatSelectedCurrencyParts(product.price, product.currency);
  const distanceLabel =
    typeof product.distance_km === 'number'
      ? product.distance_km < 1
        ? `${Math.round(product.distance_km * 1000)} m`
        : `${product.distance_km.toFixed(1)} km`
      : null;

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
            "absolute top-3 right-3 p-2.5 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100",
            favorite
              ? "bg-white text-black shadow-lg hover:shadow-xl border-2 border-white/20"
              : "bg-transparent text-white border-2 border-white/60 hover:bg-white/10 hover:border-white/80"
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
        {product.status !== 'available' ? (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-base font-semibold">
              {product.status === 'sold' ? t('product.sold') : t('product.reserved')}
            </Badge>
          </div>
        ) : (product.exchange_type || product.exchange_target || product.target_product_title) ? (
          <div className="absolute bottom-3 left-3">
            <Badge variant="secondary" className="text-[10px] h-5 px-1.5 border-0 font-bold tracking-tighter uppercase">
              {product.exchange_type === 'exchange_only' ? t('createListing.exchangeOnly') : t('createListing.exchangeTitle')}
            </Badge>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-3 space-y-1.5">
        {/* Price */}
        <div className="flex items-center justify-between gap-2">
          <span className="price-text inline-flex items-baseline gap-1 text-base font-semibold text-foreground">
            <span>{displayPrice.amount}</span>
            <span className="text-[0.72em] font-medium leading-none">{displayPrice.currency}</span>
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

        {distanceLabel ? (
          <div className="numeric-text text-[10px] text-tertiary font-medium">{distanceLabel}</div>
        ) : null}
      </div>
    </Link>
  );
};

export default ProductCard;
