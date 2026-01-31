import React, { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Heart, Share2, MapPin, Clock, User, ChevronLeft, ChevronRight, MessageCircle, AlertCircle } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getProductById, formatPrice, formatRelativeTime, mockProducts } from '@/lib/mockData';
import { useFavorites } from '@/contexts/FavoritesContext';
import { useAuth } from '@/contexts/AuthContext';
import ProductCard from '@/components/products/ProductCard';
import { toast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { normalizeImageUrl } from '@/lib/api';
import { useTranslation } from 'react-i18next';

const ProductDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isAuthenticated } = useAuth();
  const { isFavorite, toggleFavorite } = useFavorites();
  const [currentImageIndex, setCurrentImageIndex] = useState(0);

  const product = id ? getProductById(parseInt(id)) : undefined;

  if (!product) {
    return (
      <MainLayout>
        <div className="container py-16">
          <div className="max-w-md mx-auto text-center">
            <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <AlertCircle className="w-12 h-12 text-muted-foreground" />
            </div>
            <h1 className="text-2xl font-display font-bold mb-2">{t('product.notFoundTitle')}</h1>
            <p className="text-muted-foreground mb-6">
              {t('product.notFoundSubtitle')}
            </p>
            <Button asChild>
              <Link to="/">{t('product.browseOther')}</Link>
            </Button>
          </div>
        </div>
      </MainLayout>
    );
  }

  const favorite = isFavorite(product.id);
  const relatedProducts = mockProducts
    .filter(p => p.id !== product.id && p.category_id === product.category_id)
    .slice(0, 4);

  const handleFavorite = () => {
    if (!isAuthenticated) {
      toast({
        title: t('product.loginRequired'),
        description: t('product.loginToFavorites'),
      });
      navigate('/login');
      return;
    }
    toggleFavorite(product.id);
    toast({
      title: favorite ? t('product.favoriteRemoved') : t('product.favoriteAdded'),
      description: favorite ? t('product.favoriteRemovedDesc') : t('product.favoriteAddedDesc'),
    });
  };

  const handleShare = async () => {
    try {
      await navigator.share({
        title: product.title,
        text: t('product.shareText', { title: product.title }),
        url: window.location.href,
      });
    } catch {
      navigator.clipboard.writeText(window.location.href);
      toast({
        title: t('product.shareTitle'),
        description: t('product.shareDesc'),
      });
    }
  };

  const handleContact = () => {
    if (!isAuthenticated) {
      toast({
        title: t('product.loginRequired'),
        description: t('product.loginToContact'),
      });
      navigate('/login');
      return;
    }
    toast({
      title: t('product.messageSent'),
      description: t('product.messageSentDesc'),
    });
  };

  const nextImage = () => {
    setCurrentImageIndex((prev) => 
      prev === product.images.length - 1 ? 0 : prev + 1
    );
  };

  const prevImage = () => {
    setCurrentImageIndex((prev) => 
      prev === 0 ? product.images.length - 1 : prev - 1
    );
  };

  return (
    <MainLayout>
      <div className="container py-6 md:py-10">
        {/* Breadcrumb */}
        <nav className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Link to="/" className="hover:text-foreground transition-colors">{t('product.breadcrumbHome')}</Link>
          <span>/</span>
          {product.category && (
            <>
              <Link 
                to={`/category/${product.category.name.toLowerCase()}`}
                className="hover:text-foreground transition-colors"
              >
                {product.category.name}
              </Link>
              <span>/</span>
            </>
          )}
          <span className="text-foreground truncate">{product.title}</span>
        </nav>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12">
          {/* Image Gallery */}
          <div className="space-y-4">
            <div className="relative aspect-square rounded-2xl overflow-hidden bg-muted">
              {product.images.length > 0 ? (
                <>
                  <img
                    src={normalizeImageUrl(product.images[currentImageIndex]?.image_url)}
                    alt={product.title}
                    className="w-full h-full object-cover"
                  />
                  {product.images.length > 1 && (
                    <>
                      <button
                        onClick={prevImage}
                        className="absolute left-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
                      aria-label={t('product.previousImage')}
                      >
                        <ChevronLeft className="w-5 h-5" />
                      </button>
                      <button
                        onClick={nextImage}
                        className="absolute right-4 top-1/2 -translate-y-1/2 p-2 rounded-full bg-card/80 backdrop-blur-sm hover:bg-card transition-colors"
                      aria-label={t('product.nextImage')}
                      >
                        <ChevronRight className="w-5 h-5" />
                      </button>
                    </>
                  )}
                </>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                  {t('product.noImages')}
                </div>
              )}
            </div>

            {/* Thumbnails */}
            {product.images.length > 1 && (
              <div className="flex gap-2 overflow-x-auto pb-2">
                {product.images.map((image, index) => (
                  <button
                    key={image.id}
                    onClick={() => setCurrentImageIndex(index)}
                    className={cn(
                      "w-20 h-20 rounded-lg overflow-hidden shrink-0 border-2 transition-colors",
                      currentImageIndex === index
                        ? "border-primary"
                        : "border-transparent hover:border-muted-foreground/50"
                    )}
                  >
                    <img
                      src={normalizeImageUrl(image.image_url)}
                      alt={`${product.title} ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            {/* Price & Status */}
            <div className="flex items-start justify-between gap-4">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  {product.is_promoted && (
                    <Badge className="bg-warning text-warning-foreground border-0">
                      {t('product.featured')}
                    </Badge>
                  )}
                  {product.status !== 'available' && (
                    <Badge variant="secondary">
                      {product.status === 'sold' ? t('product.sold') : t('product.reserved')}
                    </Badge>
                  )}
                </div>
                <h1 className="text-3xl font-display font-bold text-foreground">
                  {formatPrice(product.price)}
                </h1>
              </div>
              <div className="flex gap-2">
                <Button
                  variant={favorite ? "default" : "outline"}
                  size="icon"
                  onClick={handleFavorite}
                  aria-label={favorite ? t('productCard.favoriteRemove') : t('productCard.favoriteAdd')}
                >
                  <Heart className={cn("w-5 h-5", favorite && "fill-current")} />
                </Button>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={handleShare}
                  aria-label={t('product.shareAction')}
                >
                  <Share2 className="w-5 h-5" />
                </Button>
              </div>
            </div>

            {/* Title */}
            <h2 className="text-xl font-semibold text-foreground">
              {product.title}
            </h2>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
              {product.dormitory && (
                <div className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4" />
                  <span>{product.dormitory.dormitory_name}</span>
                </div>
              )}
              {product.distance_km !== undefined && (
                <Badge variant="outline" className="text-tertiary border-tertiary">
                  {t('product.distanceKm', { count: product.distance_km })}
                </Badge>
              )}
              <div className="flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                <span>{t('product.posted', { time: formatRelativeTime(product.created_at) })}</span>
              </div>
            </div>

            {/* Condition & Category */}
            <div className="flex flex-wrap gap-2">
              {product.condition_level && (
                <Badge variant="outline">
                  {t('product.conditionLabel', { name: product.condition_level.name })}
                </Badge>
              )}
              {product.category && (
                <Badge variant="secondary">
                  {product.category.icon} {product.category.name}
                </Badge>
              )}
            </div>

            {/* Tags */}
            {product.tags.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {product.tags.map(tag => (
                  <Badge
                    key={tag.id}
                    variant="secondary"
                    className="bg-accent text-accent-foreground cursor-pointer hover:bg-accent/80"
                  >
                    #{tag.name}
                  </Badge>
                ))}
              </div>
            )}

            {/* Description */}
            {product.description && (
              <div className="space-y-2">
                <h3 className="font-semibold text-foreground">{t('product.description')}</h3>
                <p className="text-muted-foreground leading-relaxed">
                  {product.description}
                </p>
              </div>
            )}

            {/* Seller Info */}
            {product.seller && (
              <div className="p-4 rounded-xl bg-muted/50 border border-border">
                <div className="flex items-center gap-4">
                  <Avatar className="w-14 h-14">
                    <AvatarImage src={normalizeImageUrl(product.seller.profile_picture)} alt={product.seller.full_name} />
                    <AvatarFallback className="bg-tertiary text-tertiary-foreground text-lg">
                      {product.seller.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-foreground">{product.seller.full_name}</p>
                    <p className="text-sm text-muted-foreground">@{product.seller.username}</p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link to={`/seller/${product.seller.id}`}>
                      <User className="w-4 h-4" />
                      {t('product.viewProfile')}
                    </Link>
                  </Button>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-3 pt-4">
              <Button
                variant="hero"
                size="xl"
                className="flex-1"
                onClick={handleContact}
                disabled={product.status !== 'available'}
              >
                <MessageCircle className="w-5 h-5" />
                {t('product.contactSeller')}
              </Button>
            </div>
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl font-display font-bold text-foreground mb-6">
              {t('product.similarItems')}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {relatedProducts.map(p => (
                <ProductCard key={p.id} product={p} />
              ))}
            </div>
          </section>
        )}
      </div>
    </MainLayout>
  );
};

export default ProductDetailPage;
