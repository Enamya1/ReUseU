import React, { useState, useMemo } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles, TrendingUp, Shield, Users } from 'lucide-react';
import MainLayout from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import ProductGrid from '@/components/products/ProductGrid';
import CategoryFilter from '@/components/filters/CategoryFilter';
import { mockProducts, mockCategories, Category } from '@/lib/mockData';
import { useAuth } from '@/contexts/AuthContext';
import { normalizeImageUrl } from '@/lib/api';
import { useTranslation } from 'react-i18next';

const HomePage: React.FC = () => {
  const { isAuthenticated } = useAuth();
  const [selectedCategory, setSelectedCategory] = useState<number | undefined>(undefined);
  const { t } = useTranslation();

  const filteredProducts = useMemo(() => {
    if (selectedCategory === undefined) {
      return mockProducts;
    }
    return mockProducts.filter(p => p.category_id === selectedCategory);
  }, [selectedCategory]);

  const featuredProducts = mockProducts.filter(p => p.is_promoted).slice(0, 4);

  const handleCategorySelect = (category: Category | null) => {
    setSelectedCategory(category?.id);
  };

  const stats = [
    { icon: Users, label: t('home.stats.activeStudents'), value: '5,000+' },
    { icon: TrendingUp, label: t('home.stats.itemsTraded'), value: '25,000+' },
    { icon: Shield, label: t('home.stats.safeTransactions'), value: '99.9%' },
  ];

  return (
    <MainLayout>
      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero py-16 md:py-24">
        <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
        
        <div className="container relative">
          <div className="max-w-3xl mx-auto text-center text-white">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/10 backdrop-blur-sm text-sm mb-6">
              <Sparkles className="w-4 h-4" />
              <span>{t('home.trustedBy')}</span>
            </div>
            
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight">
              {t('home.heroTitle')}{' '}
              <span className="text-gradient-primary bg-gradient-to-r from-white to-white/60 bg-clip-text text-transparent">
                {t('home.heroHighlight')}
              </span>
            </h1>
            
            <p className="text-lg md:text-xl text-white/80 mb-8 max-w-2xl mx-auto">
              {t('home.heroSubtitle')}
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              {isAuthenticated ? (
                <>
                  <Button variant="hero" size="xl" asChild>
                    <Link to="/create-listing">
                      {t('home.startSelling')}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button variant="outline-white" size="xl" asChild>
                    <a href="#browse">{t('home.browseItems')}</a>
                  </Button>
                </>
              ) : (
                <>
                  <Button variant="hero" size="xl" asChild>
                    <Link to="/signup">
                      {t('home.getStarted')}
                      <ArrowRight className="w-5 h-5" />
                    </Link>
                  </Button>
                  <Button variant="outline-white" size="xl" asChild>
                    <Link to="/login">{t('home.logIn')}</Link>
                  </Button>
                </>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="mt-16 grid grid-cols-3 gap-4 max-w-2xl mx-auto">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-xl bg-white/10 backdrop-blur-sm"
              >
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-white/80" />
                <p className="text-2xl font-bold text-white">{stat.value}</p>
                <p className="text-sm text-white/60">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Products */}
      {featuredProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-muted/30">
          <div className="container">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-2xl font-display font-bold text-foreground">
                  {t('home.featuredTitle')}
                </h2>
                <p className="text-muted-foreground">
                  {t('home.featuredSubtitle')}
                </p>
              </div>
              <Button variant="ghost" asChild>
                <Link to="/featured">
                  {t('home.viewAll')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6">
              {featuredProducts.map(product => (
                <Link
                  key={product.id}
                  to={`/product/${product.id}`}
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden bg-muted"
                >
                  {product.images[0] && (
                    <img
                      src={normalizeImageUrl(product.images[0].image_url)}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-4 text-white">
                    <p className="text-lg font-bold">${product.price}</p>
                    <p className="text-sm text-white/80 line-clamp-1">{product.title}</p>
                  </div>
                </Link>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Browse Products */}
      <section id="browse" className="py-12 md:py-16">
        <div className="container">
          <div className="mb-8">
            <h2 className="text-2xl font-display font-bold text-foreground mb-4">
              {t('home.browseByCategory')}
            </h2>
            <CategoryFilter
              selectedCategory={selectedCategory}
              onSelectCategory={handleCategorySelect}
            />
          </div>

          <ProductGrid
            products={filteredProducts}
            emptyMessage={t('home.emptyCategory')}
          />

          {filteredProducts.length > 0 && (
            <div className="mt-8 text-center">
              <Button variant="outline" size="lg" asChild>
                <Link to="/browse">
                  {t('home.viewAllItems')}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </Button>
            </div>
          )}
        </div>
      </section>

      {/* CTA Section */}
      {!isAuthenticated && (
        <section className="py-16 bg-gradient-primary">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center text-primary-foreground">
              <h2 className="text-3xl font-display font-bold mb-4">
                {t('home.ctaTitle')}
              </h2>
              <p className="text-lg opacity-80 mb-8">
                {t('home.ctaSubtitle')}
              </p>
              <Button variant="secondary" size="xl" asChild>
                <Link to="/signup">
                  {t('home.ctaButton')}
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </Button>
            </div>
          </div>
        </section>
      )}
    </MainLayout>
  );
};

export default HomePage;
