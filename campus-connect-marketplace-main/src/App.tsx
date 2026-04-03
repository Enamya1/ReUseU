import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { lazy, Suspense } from "react";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";
import { CurrencyProvider } from "@/contexts/CurrencyContext";
import { Skeleton } from "@/components/ui/skeleton";

// Pages
const HomePage = lazy(() => import("./pages/HomePage"));
const ProductsPage = lazy(() => import("./pages/ProductsPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const SignupPage = lazy(() => import("./pages/SignupPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const FavoritesPage = lazy(() => import("./pages/FavoritesPage"));
const MyListingsPage = lazy(() => import("./pages/MyListingsPage"));
const MyListingDetailPage = lazy(() => import("./pages/MyListingDetailPage"));
const CreateListingPage = lazy(() => import("./pages/CreateListingPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const NearbyPage = lazy(() => import("./pages/NearbyPage"));
const ExchangePage = lazy(() => import("./pages/ExchangePage"));
const OnboardingPage = lazy(() => import("./pages/OnboardingPage"));
const SellerProfilePage = lazy(() => import("./pages/SellerProfilePage"));
const MessagesPage = lazy(() => import("./pages/MessagesPage"));
const SearchResultsPage = lazy(() => import("./pages/SearchResultsPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
import { useAuth } from "@/contexts/AuthContext";
const AIAssistantPage = lazy(() => import("./pages/AIAssistantPage"));
const AIVoiceCallPage = lazy(() => import("./pages/AIVoiceCallPage"));


const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 60 * 1000,
      gcTime: 5 * 60 * 1000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});
const HomeRoute = () => {
  const { isAuthenticated } = useAuth();

  if (isAuthenticated) {
    return <Navigate to="/products" replace />;
  }

  return <HomePage />;
};

const OnboardingGate = () => {
  const { isAuthenticated, user } = useAuth();
  const location = useLocation();
  const shouldOnboard =
    isAuthenticated &&
    user?.role !== "admin" &&
    user?.account_completed === false;

  if (shouldOnboard && location.pathname !== "/onboarding") {
    return <Navigate to="/onboarding" replace />;
  }

  return <Outlet />;
};

const RouteSkeleton = () => (
  <div className="min-h-screen bg-background">
    <div className="mx-auto w-full max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
      <div className="mb-6 space-y-3">
        <Skeleton className="h-10 w-56" />
        <Skeleton className="h-4 w-80 max-w-full" />
      </div>
      <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
        <Skeleton className="h-24 w-full rounded-xl" />
      </div>
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
        <Skeleton className="h-64 w-full rounded-xl" />
      </div>
    </div>
  </div>
);

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <CurrencyProvider>
        <FavoritesProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense fallback={<RouteSkeleton />}>
                <Routes>
                  <Route element={<OnboardingGate />}>
                    <Route path="/" element={<HomeRoute />} />
                    <Route path="/products" element={<ProductsPage />} />
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/signup" element={<SignupPage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />
                    <Route path="/seller/:id" element={<SellerProfilePage />} />
                    <Route path="/nearby" element={<NearbyPage />} />
                    <Route path="/exchange" element={<ExchangePage />} />
                    <Route path="/onboarding" element={<OnboardingPage />} />
                    <Route path="/favorites" element={<FavoritesPage />} />
                    <Route path="/my-listings" element={<MyListingsPage />} />
                    <Route path="/my-listings/:id" element={<MyListingDetailPage />} />
                    <Route path="/create-listing" element={<CreateListingPage />} />
                    <Route path="/profile" element={<ProfilePage />} />
                    <Route path="/wallet" element={<WalletPage />} />
                    <Route path="/messages" element={<MessagesPage />} />
                    <Route path="/search" element={<SearchResultsPage />} />
                    <Route path="/ai" element={<AIAssistantPage />} />
                    <Route path="/ai/voice" element={<AIVoiceCallPage />} />
                    <Route path="*" element={<NotFound />} />
                  </Route>
                </Routes>
              </Suspense>
            </BrowserRouter>
          </TooltipProvider>
        </FavoritesProvider>
      </CurrencyProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
