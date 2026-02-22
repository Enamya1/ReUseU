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
      <section className="relative overflow-hidden bg-background py-10 md:py-16">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.12),transparent_55%)] opacity-40" />
        <div className="container relative">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-card/70 p-8 md:p-10 min-h-[360px]">
                <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08),transparent_45%)]" />
                <div className="relative">
                  <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full border border-white/10 bg-white/5 text-sm mb-6">
                    <Sparkles className="w-4 h-4" />
                    <span>{t('home.trustedBy')}</span>
                  </div>

                  <h1 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-6 leading-tight text-foreground">
                    {t('home.heroTitle')}{' '}
                    <span className="text-gradient-primary">
                      {t('home.heroHighlight')}
                    </span>
                  </h1>

                  <p className="text-lg md:text-xl text-muted-foreground mb-8 max-w-2xl">
                    {t('home.heroSubtitle')}
                  </p>

                  <div className="flex flex-col sm:flex-row gap-4">
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
              </div>
            </div>

            <div className="lg:col-span-5 grid gap-6 auto-rows-fr">
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-card/40 min-h-[240px]">
                <div className="absolute inset-4 rounded-[18px] border border-dashed border-white/20" />
              </div>
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-card/40 min-h-[240px]">
                <div className="absolute inset-4 rounded-[18px] border border-dashed border-white/20" />
              </div>
            </div>
          </div>

          <div className="mt-10 grid grid-cols-1 sm:grid-cols-3 gap-4">
            {stats.map((stat, index) => (
              <div
                key={index}
                className="text-center p-4 rounded-xl border border-white/10 bg-card/60"
              >
                <stat.icon className="w-6 h-6 mx-auto mb-2 text-muted-foreground" />
                <p className="text-2xl font-bold text-foreground">{stat.value}</p>
                <p className="text-sm text-muted-foreground">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {featuredProducts.length > 0 && (
        <section className="py-12 md:py-16 bg-background">
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
                  className="group relative aspect-[4/5] rounded-2xl overflow-hidden border border-white/10 bg-card/40"
                >
                  {product.images[0] && (
                    <img
                      src={normalizeImageUrl(product.images[0].image_url)}
                      alt={product.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  )}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
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

      <section className="py-12 md:py-16 bg-background">
        <div className="container">
          <div className="grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7 relative overflow-hidden rounded-[28px] border border-white/10 bg-card/40 min-h-[320px]">
              <div className="absolute inset-5 rounded-[22px] border border-dashed border-white/20" />
            </div>
            <div className="lg:col-span-5 grid gap-6 auto-rows-fr">
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-card/40 min-h-[200px]">
                <div className="absolute inset-4 rounded-[18px] border border-dashed border-white/20" />
              </div>
              <div className="relative overflow-hidden rounded-[24px] border border-white/10 bg-card/40 min-h-[200px]">
                <div className="absolute inset-4 rounded-[18px] border border-dashed border-white/20" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="browse" className="py-12 md:py-16 bg-background">
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
        <section className="py-16 bg-background">
          <div className="container">
            <div className="max-w-2xl mx-auto text-center border border-white/10 bg-card/70 rounded-[28px] p-10">
              <h2 className="text-3xl font-display font-bold mb-4 text-foreground">
                {t('home.ctaTitle')}
              </h2>
              <p className="text-lg text-muted-foreground mb-8">
                {t('home.ctaSubtitle')}
              </p>
              <Button variant="hero" size="xl" asChild>
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
