import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Heart, Star } from 'lucide-react';
import { Product } from '@/lib/mockData';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useCurrency } from '@/contexts/CurrencyContext';
import { useAuth } from '@/contexts/AuthContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/api';
import { useTranslation } from 'react-i18next';
import { toast } from '@/hooks/use-toast';

interface ProductCardProps {
  product: Product;
  className?: string;
  linkTo?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className, linkTo }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
  const { formatSelectedCurrencyParts } = useCurrency();
  const { isAuthenticated } = useAuth();
  const { t } = useTranslation();
  const favorite = isFavorite(product.id);
  const [isToggling, setIsToggling] = useState(false);
  const displayPrice = formatSelectedCurrencyParts(product.price, product.currency);
  const distanceLabel =
    typeof product.distance_km === 'number'
      ? product.distance_km < 1
        ? `${Math.round(product.distance_km * 1000)} m`
        : `${product.distance_km.toFixed(1)} km`
      : null;

  const primaryImage = product.images.find(img => img.is_primary) || product.images[0];

  const handleFavoriteClick = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    if (!isAuthenticated) {
      toast({
        title: t('product.loginRequired'),
        description: t('product.loginToFavorites'),
      });
      return;
    }
    
    if (isToggling) return;
    
    setIsToggling(true);
    try {
      await toggleFavorite(product.id);
      toast({
        title: favorite ? t('product.favoriteRemoved') : t('product.favoriteAdded'),
        description: favorite ? t('product.favoriteRemovedDesc') : t('product.favoriteAddedDesc'),
      });
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update favorite';
      toast({
        title: 'Error',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setIsToggling(false);
    }
  };

  return (
    <Link
      to={linkTo || `/product/${product.id}`}
      className={cn(
        "group block bg-card/70 rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in",
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
          disabled={isToggling}
          className={cn(
            "absolute top-2 right-2 p-2 rounded-full transition-all duration-200 opacity-0 group-hover:opacity-100",
            favorite
              ? "bg-white text-black shadow-lg hover:shadow-xl"
              : "bg-transparent text-white hover:bg-white/10",
            isToggling && "opacity-50 cursor-not-allowed"
          )}
          aria-label={favorite ? t('productCard.favoriteRemove') : t('productCard.favoriteAdd')}
        >
          <Heart className={cn("w-4 h-4", favorite && "fill-current")} />
        </button>

        {/* Promoted Badge */}
        {product.is_promoted && (
          <div className="absolute top-2 left-2">
            <Badge className="bg-warning text-warning-foreground border-0 gap-1 text-[10px] px-1.5 py-0">
              <Star className="w-2.5 h-2.5 fill-current" />
              {t('product.featured')}
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        {product.status !== 'available' ? (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-sm font-semibold">
              {product.status === 'sold' ? t('product.sold') : t('product.reserved')}
            </Badge>
          </div>
        ) : (product.exchange_type || product.exchange_target || product.target_product_title) ? (
          <div className="absolute bottom-2 left-2">
            <Badge variant="secondary" className="text-[9px] h-4 px-1.5 border-0 font-bold tracking-tighter uppercase">
              {product.exchange_type === 'exchange_only' ? t('createListing.exchangeOnly') : t('createListing.exchangeTitle')}
            </Badge>
          </div>
        ) : null}
      </div>

      {/* Content */}
      <div className="p-2 space-y-1">
        {/* Price */}
        <div className="flex items-center justify-between gap-2">
          <span className="price-text inline-flex items-baseline gap-0.5 text-sm font-semibold text-foreground">
            <span>{displayPrice.amount}</span>
            <span className="text-[0.7em] font-medium leading-none">{displayPrice.currency}</span>
          </span>
          {product.condition_level && (
            <Badge variant="outline" className="text-[9px] px-1 py-0">
              {product.condition_level.name}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="text-xs font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors leading-tight">
          {product.title}
        </h3>

        {distanceLabel ? (
          <div className="numeric-text text-[9px] text-tertiary font-medium">{distanceLabel}</div>
        ) : null}
      </div>
    </Link>
  );
};

export default ProductCard;
