import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Search, Heart, Menu, X, LogOut, Settings, ShoppingBag, ChevronDown, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/contexts/AuthContext';
import { useFavorites } from '@/contexts/FavoritesContext';
import { normalizeImageUrl } from '@/lib/api';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';

type HeaderProps = {
  className?: string;
};

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { user, isAuthenticated, logout } = useAuth();
  const { favorites } = useFavorites();
  const navigate = useNavigate();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { t } = useTranslation();
  const primaryNavItems = [
    { to: '/', label: t('nav.home') },
    { to: '/nearby', label: t('nav.nearBy') },
    { to: '/ai', label: t('nav.ai') },
    { to: '/my-listings', label: t('nav.myListings') },
    { to: '/messages', label: t('nav.messages') },
    { to: '/profile', label: t('nav.profile') },
  ];
  const moreNavItems = [
    { to: '/favorites', label: t('nav.favorites') },
    { to: '/create-listing', label: t('nav.createListing') },
  ];

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  return (
    <header className={cn("sticky top-0 z-50 w-full bg-transparent mix-blend-difference", className)}>
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-5 px-4 py-4 sm:px-6 sm:py-6">
        <Link to="/" className="flex items-center gap-3 landing-cursor-hover shrink-0 mr-6 xl:mr-10">
          <div className="h-11 w-11 rounded-full border border-white flex items-center justify-center">
            <img
              src="/logo_enhanced.png"
              alt="Suki"
              className="h-8 w-8 object-contain"
            />
          </div>
          <span className="text-xs font-medium tracking-[0.3em] uppercase text-white hidden sm:block">
            Suki
          </span>
        </Link>

        <nav className="hidden lg:flex items-center gap-8 text-[11px] tracking-[0.3em] uppercase">
          {primaryNavItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className="relative text-white/90 hover:text-white transition-colors whitespace-nowrap pb-1 after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:h-[1px] after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              activeClassName="text-white"
            >
              {item.label}
            </NavLink>
          ))}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button
                type="button"
                className="relative inline-flex items-center gap-1 text-white/90 hover:text-white transition-colors whitespace-nowrap pb-1 after:content-[''] after:absolute after:left-1/2 after:-translate-x-1/2 after:bottom-0 after:h-[1px] after:w-0 after:bg-current after:transition-all after:duration-300 hover:after:w-full"
              >
                <span>{t('header.more')}</span>
                <ChevronDown className="w-4 h-4" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-48">
              {moreNavItems.map((item) => (
                <DropdownMenuItem key={item.to} asChild>
                  <Link to={item.to} className="cursor-pointer">
                    {item.label}
                  </Link>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>

        <nav className="hidden lg:flex items-center gap-2">
          <form onSubmit={handleSearch} className="w-44 xl:w-52">
            <div className="relative w-full">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/60" />
              <Input
                type="search"
                placeholder={t('header.searchPlaceholder')}
                className="pl-11 pr-4 h-10 rounded-full bg-white/10 border border-white/20 text-white placeholder:text-white/60 focus-visible:ring-1 focus-visible:ring-white/40"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </form>
          {isAuthenticated ? (
            <>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full border border-white/30 text-white hover:bg-white hover:text-black px-4"
                asChild
              >
                <Link to="/favorites" className="relative">
                  <Heart className="w-5 h-5" />
                  {favorites.length > 0 && (
                    <span className="absolute -top-1 -right-1 w-4 h-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
                      {favorites.length}
                    </span>
                  )}
                </Link>
              </Button>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full border border-white/30 text-white hover:bg-white hover:text-black"
                  >
                    <Avatar className="w-8 h-8">
                      <AvatarImage src={normalizeImageUrl(user?.profile_picture)} alt={user?.full_name} />
                      <AvatarFallback className="bg-tertiary text-tertiary-foreground text-sm">
                        {user?.full_name?.charAt(0) || 'U'}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <div className="px-2 py-1.5">
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{user?.username}</p>
                  </div>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/my-listings" className="cursor-pointer">
                      <ShoppingBag className="w-4 h-4 mr-2" />
                      {t('nav.myListings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link to="/profile" className="cursor-pointer">
                      <Settings className="w-4 h-4 mr-2" />
                      {t('header.settings')}
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={logout} className="cursor-pointer text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    {t('common.logout')}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </>
          ) : (
            <>
              <Link
                to="/login"
                className="rounded-full border border-white/40 px-5 py-2 text-[11px] font-semibold tracking-[0.3em] uppercase text-white transition-all hover:bg-white hover:text-black whitespace-nowrap"
              >
                {t('common.login')}
              </Link>
              <Link
                to="/signup"
                className="rounded-full border border-white px-5 py-2 text-[11px] font-semibold tracking-[0.3em] uppercase text-white transition-all hover:bg-white hover:text-black whitespace-nowrap"
              >
                {t('common.signup')}
              </Link>
            </>
          )}
        </nav>

        {/* Mobile Menu Button */}
        <Button
          variant="ghost"
          size="icon"
          className="lg:hidden text-white hover:bg-white/10"
          onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
        >
          {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </Button>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-border bg-card animate-fade-in">
          <div className="container py-4 space-y-4">
            {/* Mobile Search */}
            <form onSubmit={handleSearch}>
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="search"
                placeholder={t('header.searchPlaceholder')}
                  className="pl-10 pr-4 h-10 bg-muted/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </form>

            <nav className="grid gap-1">
              {primaryNavItems.map((item) => (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                  activeClassName="text-primary"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item.label}
                </NavLink>
              ))}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    type="button"
                    className="flex items-center gap-2 px-3 py-2 text-sm font-medium text-foreground/80 hover:text-foreground transition-colors"
                  >
                    <span>{t('header.more')}</span>
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  {moreNavItems.map((item) => (
                    <DropdownMenuItem key={item.to} asChild>
                      <Link to={item.to} className="cursor-pointer" onClick={() => setMobileMenuOpen(false)}>
                        {item.label}
                      </Link>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            </nav>

            {isAuthenticated ? (
              <div className="space-y-2">
                <div className="flex items-center gap-3 p-2 rounded-lg bg-muted/50">
                  <Avatar className="w-10 h-10">
                    <AvatarImage src={normalizeImageUrl(user?.profile_picture)} alt={user?.full_name} />
                    <AvatarFallback className="bg-tertiary text-tertiary-foreground">
                      {user?.full_name?.charAt(0) || 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium">{user?.full_name}</p>
                    <p className="text-xs text-muted-foreground">@{user?.username}</p>
                  </div>
                </div>
                
                <nav className="grid gap-1">
                  <Link
                    to="/favorites"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5" />
                    <span>{t('nav.favorites')}</span>
                    {favorites.length > 0 && (
                      <span className="ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
                        {favorites.length}
                      </span>
                    )}
                  </Link>
                  <Link
                    to="/my-listings"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <ShoppingBag className="w-5 h-5" />
                    <span>{t('nav.myListings')}</span>
                  </Link>
                  <Link
                    to="/profile"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Settings className="w-5 h-5" />
                    <span>{t('header.settings')}</span>
                  </Link>
                </nav>

                <div className="pt-2 border-t border-border space-y-2">
                  <Button
                    variant="default"
                    className="w-full"
                    asChild
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Link to="/create-listing">
                      <Plus className="w-4 h-4" />
                      {t('header.sellAnItem')}
                    </Link>
                  </Button>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      logout();
                      setMobileMenuOpen(false);
                    }}
                  >
                    <LogOut className="w-4 h-4" />
                    {t('common.logout')}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" asChild>
                  <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                    {t('common.login')}
                  </Link>
                </Button>
                <Button variant="default" className="flex-1" asChild>
                  <Link to="/signup" onClick={() => setMobileMenuOpen(false)}>
                    {t('common.signup')}
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
