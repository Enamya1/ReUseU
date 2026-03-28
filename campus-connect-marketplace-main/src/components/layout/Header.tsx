import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Bell, Heart, Menu, X, LogOut, Settings, ShoppingBag, ChevronDown, Plus, Wallet } from 'lucide-react';
import { Button } from '@/components/ui/button';
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
import { useCurrency } from '@/contexts/CurrencyContext';
import { normalizeImageUrl } from '@/lib/api';
import { NavLink } from '@/components/NavLink';
import { cn } from '@/lib/utils';
import { useTranslation } from 'react-i18next';
import CurrencySelector from '@/components/currency/CurrencySelector';
import SearchInputEnhanced from '@/components/ui/search-input-enhanced';
import { SearchSuggestion } from '@/components/ui/search-suggestions';

type HeaderProps = {
  className?: string;
};

type MessageNotificationItem = {
  id?: number | string;
  conversation_id?: number | null;
  sender_id?: number;
  sender_username?: string;
  sender_profile_picture?: string;
  product_id?: number | null;
  notification_type?: string;
  notification_text?: string;
  notification_count?: number;
  created_at?: string;
  amount?: number;
  currency?: string;
  wallet_id?: number;
  transaction_ledger_id?: number;
};

const Header: React.FC<HeaderProps> = ({ className }) => {
  const { user, isAuthenticated, logout, getMessageNotifications, getProductSearchSuggestions, refreshBalance } = useAuth();
  const { favorites } = useFavorites();
  const { formatWithSelectedCurrency } = useCurrency();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [notifications, setNotifications] = useState<MessageNotificationItem[]>([]);
  const [unreadTotal, setUnreadTotal] = useState(0);
  const [isScrolled, setIsScrolled] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchSuggestions, setSearchSuggestions] = useState<SearchSuggestion[]>([]);
  const [isLoadingSearchSuggestions, setIsLoadingSearchSuggestions] = useState(false);
  const searchRequestSequenceRef = useRef(0);
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();

  const userBalance = user?.balance ?? 0;
  const showCurrencySelector = true;
  const primaryNavItems = [
    { to: '/', label: t('nav.home') },
    { to: '/nearby', label: t('nav.nearBy') },
    { to: '/exchange', label: t('nav.exchange') },
    { to: '/ai', label: t('nav.ai') },
    { to: '/my-listings', label: t('nav.myListings') },
    { to: '/messages', label: t('nav.messages') },
  ];
  const moreNavItems = [
    { to: '/favorites', label: t('nav.favorites') },
    { to: '/create-listing', label: t('nav.createListing') },
  ];

  useEffect(() => {
    if (!isAuthenticated) {
      setNotifications([]);
      setUnreadTotal(0);
      return;
    }
    let cancelled = false;
    const run = async () => {
      try {
        const response = await getMessageNotifications({ limit: 20 });
        if (cancelled) return;
        setNotifications(response.messages ?? []);
        setUnreadTotal(response.total ?? (response.messages?.length ?? 0));

        // If there's a wallet notification, refresh the balance
        const hasWalletNotification = response.messages?.some(m => m.notification_type?.startsWith('wallet_'));
        if (hasWalletNotification) {
          refreshBalance();
        }
      } catch {
        if (cancelled) return;
        setNotifications([]);
        setUnreadTotal(0);
      }
    };
    run();
    // Also refresh balance on mount if authenticated
    if (isAuthenticated) {
      refreshBalance();
    }
    
    return () => {
      cancelled = true;
    };
  }, [getMessageNotifications, isAuthenticated, refreshBalance]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (!isAuthenticated || user?.role !== 'user') {
      setSearchSuggestions([]);
      setIsLoadingSearchSuggestions(false);
      return;
    }

    const normalizedQuery = searchQuery.trim();
    if (!normalizedQuery) {
      setSearchSuggestions([]);
      setIsLoadingSearchSuggestions(false);
      return;
    }

    const requestId = searchRequestSequenceRef.current + 1;
    searchRequestSequenceRef.current = requestId;
    setIsLoadingSearchSuggestions(true);

    const timerId = window.setTimeout(async () => {
      try {
        const response = await getProductSearchSuggestions({
          q: normalizedQuery,
          suggestions_limit: 8,
        });
        if (searchRequestSequenceRef.current !== requestId) return;
        const mappedSuggestions = (response.suggestions ?? []).map((suggestion, index) => ({
          id: `${suggestion}-${index}`,
          title: suggestion,
        }));
        setSearchSuggestions(mappedSuggestions);
      } catch {
        if (searchRequestSequenceRef.current !== requestId) return;
        setSearchSuggestions([]);
      } finally {
        if (searchRequestSequenceRef.current === requestId) {
          setIsLoadingSearchSuggestions(false);
        }
      }
    }, 150);

    return () => {
      window.clearTimeout(timerId);
    };
  }, [getProductSearchSuggestions, isAuthenticated, searchQuery, user?.role]);

  const handleSearchInputChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(event.target.value);
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setSearchQuery(suggestion.title);
    navigate(`/search?q=${encodeURIComponent(suggestion.title)}`);
    setMobileMenuOpen(false);
  };

  const handleSearchSubmit = (query: string) => {
    const normalizedQuery = query.trim();
    if (!normalizedQuery) return;
    setSearchQuery(normalizedQuery);
    navigate(`/search?q=${encodeURIComponent(normalizedQuery)}`);
    setMobileMenuOpen(false);
  };

  const handleImageSearchUpload = (file: File) => {
    navigate('/search?mode=visual', {
      state: { visualFile: file },
    });
    setMobileMenuOpen(false);
  };

  const unreadCount = useMemo(
    () => (unreadTotal > 0 ? unreadTotal : notifications.length),
    [notifications.length, unreadTotal],
  );

  const formatNotificationTime = (value?: string) => {
    if (!value) return '';
    const parsed = new Date(value);
    if (Number.isNaN(parsed.getTime())) return '';
    return parsed.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  const handleNotificationClick = (item: MessageNotificationItem) => {
    if (item.notification_type?.startsWith('wallet_')) {
      navigate('/wallet');
      setMobileMenuOpen(false);
      return;
    }

    const params = new URLSearchParams();
    if (item.conversation_id) params.set('conversationId', String(item.conversation_id));
    if (item.sender_id) params.set('receiverId', String(item.sender_id));
    if (item.sender_username) params.set('receiverName', item.sender_username);
    const query = params.toString();
    navigate(query ? `/messages?${query}` : '/messages');
    setMobileMenuOpen(false);
  };

  return (
    <header className={cn("sticky top-0 z-50 w-full transition-all duration-300", isScrolled ? "bg-background/95 backdrop-blur-sm" : "bg-transparent mix-blend-difference", className)}>
      <div className="flex w-full items-center justify-between gap-5 px-4 py-4 sm:px-6 sm:py-6">
        {/* Left section - Logo and main navigation */}
        <div className="flex items-center gap-8">
          <Link to="/" className="flex items-center gap-3 landing-cursor-hover shrink-0">
            <span className="xiaowu-brand xiaowu-logo-header" aria-label="校物圈，校园物品共享平台">
              校物圈
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
        </div>

        {/* Right section - Icons */}
        <nav className="hidden lg:flex items-center gap-2 ml-auto">
          {isAuthenticated ? (
            <>
              <SearchInputEnhanced
                className="text-white"
                suggestions={searchSuggestions}
                isLoadingSuggestions={isLoadingSearchSuggestions}
                onSuggestionClick={handleSuggestionClick}
                onSearchSubmit={handleSearchSubmit}
                onChange={handleSearchInputChange}
                onImageUpload={handleImageSearchUpload}
              />
              {showCurrencySelector ? <CurrencySelector /> : null}
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-white hover:bg-white hover:text-black px-3 gap-2"
                asChild
              >
                <Link to="/wallet" className="flex items-center">
                  <Wallet className="w-4 h-4" />
                  <span className="numeric-text font-medium text-xs">
                    {formatWithSelectedCurrency(userBalance, 'CNY')}
                  </span>
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="rounded-full text-white hover:bg-white hover:text-black px-4"
                asChild
              >
                <Link to="/favorites" className="relative">
                  <Heart className="w-5 h-5" />
                  {favorites.length > 0 && (
                    <span className="numeric-text absolute -top-1 -right-1 w-4 h-4 text-xs bg-primary text-primary-foreground rounded-full flex items-center justify-center">
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
                    className="relative rounded-full text-white hover:bg-white hover:text-black"
                  >
                    <Bell className="w-5 h-5" />
                    {unreadCount > 0 && (
                      <span className="numeric-text absolute -top-1 -right-1 min-w-4 h-4 rounded-full bg-primary text-primary-foreground text-[10px] flex items-center justify-center px-1">
                        {unreadCount}
                      </span>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-72">
                  <div className="px-2 py-1.5 text-sm font-semibold">Notification</div>
                  <DropdownMenuSeparator />
                  {notifications.length > 0 ? (
                    notifications.map((item) => (
                      <DropdownMenuItem
                        key={item.id}
                        className="cursor-pointer flex items-center gap-3"
                        onSelect={(event) => {
                          event.preventDefault();
                          handleNotificationClick(item);
                        }}
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={normalizeImageUrl(item.sender_profile_picture)} alt={item.sender_username} />
                          <AvatarFallback className="bg-tertiary text-tertiary-foreground text-xs">
                            {item.sender_username?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <div className="min-w-0">
                          <div className="text-sm">
                            {item.notification_text || `New message from ${item.sender_username || 'user'}`}
                            {item.notification_count && item.notification_count > 1 ? (
                              <span className="numeric-text">{` (${item.notification_count})`}</span>
                            ) : null}
                          </div>
                          <div className="text-xs text-muted-foreground">{formatNotificationTime(item.created_at)}</div>
                        </div>
                      </DropdownMenuItem>
                    ))
                  ) : (
                    <div className="px-2 py-4 text-xs text-muted-foreground">No notifications</div>
                  )}
                </DropdownMenuContent>
              </DropdownMenu>
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="rounded-full text-white hover:bg-white hover:text-black"
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
                    <Link to="/wallet" className="cursor-pointer">
                      <Wallet className="w-4 h-4 mr-2" />
                      {t('nav.wallet') || 'Wallet'}
                    </Link>
                  </DropdownMenuItem>
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
                className="rounded-full px-5 py-2 text-[11px] font-semibold tracking-[0.3em] uppercase text-white transition-all hover:bg-white hover:text-black whitespace-nowrap"
              >
                {t('common.login')}
              </Link>
              <Link
                to="/signup"
                className="rounded-full px-5 py-2 text-[11px] font-semibold tracking-[0.3em] uppercase text-white transition-all hover:bg-white hover:text-black whitespace-nowrap"
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
        <div className="lg:hidden bg-card animate-fade-in">
          <div className="container py-4 space-y-4">
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
                <div className="flex items-center justify-between p-2 rounded-lg bg-muted/50">
                  <div className="flex items-center gap-3">
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
                  <Link 
                    to="/wallet" 
                    className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-background hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Wallet className="w-4 h-4 text-primary" />
                    <span className="numeric-text font-semibold text-xs">
                      {formatWithSelectedCurrency(userBalance, 'CNY')}
                    </span>
                  </Link>
                </div>

                <SearchInputEnhanced
                  className="w-full"
                  suggestions={searchSuggestions}
                  isLoadingSuggestions={isLoadingSearchSuggestions}
                  onSuggestionClick={handleSuggestionClick}
                  onSearchSubmit={handleSearchSubmit}
                  onChange={handleSearchInputChange}
                  onImageUpload={handleImageSearchUpload}
                />

                <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="w-full">
                    <Bell className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                  <DropdownMenuContent align="start" className="w-72">
                    <div className="px-2 py-1.5 text-sm font-semibold">notification</div>
                    <DropdownMenuSeparator />
                    {notifications.length > 0 ? (
                      notifications.map((item) => (
                        <DropdownMenuItem
                          key={item.id}
                          className="cursor-pointer flex items-center gap-3"
                          onSelect={(event) => {
                            event.preventDefault();
                            handleNotificationClick(item);
                          }}
                        >
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={normalizeImageUrl(item.sender_profile_picture)} alt={item.sender_username} />
                            <AvatarFallback className="bg-tertiary text-tertiary-foreground text-xs">
                              {item.sender_username?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0">
                            <div className="text-sm">
                              {item.notification_text || `New message from ${item.sender_username || 'user'}`}
                              {item.notification_count && item.notification_count > 1 ? (
                                <span className="numeric-text">{` (${item.notification_count})`}</span>
                              ) : null}
                            </div>
                            <div className="text-xs text-muted-foreground">{formatNotificationTime(item.created_at)}</div>
                          </div>
                        </DropdownMenuItem>
                      ))
                    ) : (
                      <div className="px-2 py-4 text-xs text-muted-foreground">No notifications</div>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>

                <nav className="grid gap-1">
                  <Link
                    to="/favorites"
                    className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-muted transition-colors"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    <Heart className="w-5 h-5" />
                    <span>{t('nav.favorites')}</span>
                    {favorites.length > 0 && (
                      <span className="numeric-text ml-auto text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">
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

                <div className="pt-2 space-y-2">
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
              <div className="space-y-2">
                <SearchInputEnhanced
                  className="w-full"
                  onSearchSubmit={handleSearchSubmit}
                  onImageUpload={handleImageSearchUpload}
                />
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
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  );
};

export default Header;
