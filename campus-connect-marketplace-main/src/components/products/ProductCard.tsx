import React from 'react';
import { Link } from 'react-router-dom';
import { Heart, MapPin, Clock, Star } from 'lucide-react';
import { Product, formatPrice, formatRelativeTime } from '@/lib/mockData';
import { useFavorites } from '@/contexts/FavoritesContext';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ProductCardProps {
  product: Product;
  className?: string;
  linkTo?: string;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, className, linkTo }) => {
  const { isFavorite, toggleFavorite } = useFavorites();
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
        "group block bg-card rounded-xl overflow-hidden shadow-card hover:shadow-card-hover transition-all duration-300 animate-fade-in",
        className
      )}
    >
      {/* Image Container */}
      <div className="relative aspect-square overflow-hidden bg-muted">
        {primaryImage ? (
          <img
            src={primaryImage.image_url}
            alt={product.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
            No image
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
          aria-label={favorite ? "Remove from favorites" : "Add to favorites"}
        >
          <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
        </button>

        {/* Promoted Badge */}
        {product.is_promoted && (
          <div className="absolute top-3 left-3">
            <Badge className="bg-warning text-warning-foreground border-0 gap-1">
              <Star className="w-3 h-3 fill-current" />
              Featured
            </Badge>
          </div>
        )}

        {/* Status Badge */}
        {product.status !== 'available' && (
          <div className="absolute inset-0 bg-foreground/60 flex items-center justify-center">
            <Badge variant="secondary" className="text-base font-semibold">
              {product.status === 'sold' ? 'Sold' : 'Reserved'}
            </Badge>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-4 space-y-2">
        {/* Price */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-lg font-bold text-foreground">
            {formatPrice(product.price)}
          </span>
          {product.condition_level && (
            <Badge variant="outline" className="text-xs">
              {product.condition_level.name}
            </Badge>
          )}
        </div>

        {/* Title */}
        <h3 className="font-medium text-foreground line-clamp-2 group-hover:text-primary transition-colors">
          {product.title}
        </h3>

        {/* Meta Info */}
        <div className="flex items-center gap-3 text-xs text-muted-foreground">
          {product.dormitory && (
            <div className="flex items-center gap-1">
              <MapPin className="w-3 h-3" />
              <span className="truncate max-w-[100px]">{product.dormitory.dormitory_name}</span>
            </div>
          )}
          {product.distance_km !== undefined && (
            <span className="text-tertiary font-medium">{product.distance_km} km</span>
          )}
          <div className="flex items-center gap-1 ml-auto">
            <Clock className="w-3 h-3" />
            <span>{formatRelativeTime(product.created_at)}</span>
          </div>
        </div>

        {/* Tags */}
        {product.tags.length > 0 && (
          <div className="flex flex-wrap gap-1 pt-1">
            {product.tags.slice(0, 3).map(tag => (
              <Badge
                key={tag.id}
                variant="secondary"
                className="text-xs bg-accent text-accent-foreground"
              >
                {tag.name}
              </Badge>
            ))}
            {product.tags.length > 3 && (
              <Badge variant="secondary" className="text-xs">
                +{product.tags.length - 3}
              </Badge>
            )}
          </div>
        )}
      </div>
    </Link>
  );
};

export default ProductCard;
