import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, Outlet, useLocation } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { FavoritesProvider } from "@/contexts/FavoritesContext";

// Pages
import HomePage from "./pages/HomePage";
import ProductsPage from "./pages/ProductsPage";
import LoginPage from "./pages/LoginPage";
import SignupPage from "./pages/SignupPage";
import ProductDetailPage from "./pages/ProductDetailPage";
import FavoritesPage from "./pages/FavoritesPage";
import MyListingsPage from "./pages/MyListingsPage";
import MyListingDetailPage from "./pages/MyListingDetailPage";
import CreateListingPage from "./pages/CreateListingPage";
import ProfilePage from "./pages/ProfilePage";
import NearbyPage from "./pages/NearbyPage";
import OnboardingPage from "./pages/OnboardingPage";
import SellerProfilePage from "./pages/SellerProfilePage";
import NotFound from "./pages/NotFound";
import { useAuth } from "@/contexts/AuthContext";


const queryClient = new QueryClient();
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

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <FavoritesProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              <Route element={<OnboardingGate />}>
                {/* Public Routes */}
                <Route path="/" element={<HomeRoute />} />
                <Route path="/products" element={<ProductsPage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/signup" element={<SignupPage />} />
                <Route path="/product/:id" element={<ProductDetailPage />} />
                <Route path="/seller/:id" element={<SellerProfilePage />} />
                <Route path="/nearby" element={<NearbyPage />} />
                <Route path="/onboarding" element={<OnboardingPage />} />

                {/* Protected User Routes */}
                <Route path="/favorites" element={<FavoritesPage />} />
                <Route path="/my-listings" element={<MyListingsPage />} />
                <Route path="/my-listings/:id" element={<MyListingDetailPage />} />
                <Route path="/create-listing" element={<CreateListingPage />} />
                <Route path="/profile" element={<ProfilePage />} />

                {/* Catch-all */}
                <Route path="*" element={<NotFound />} />
              </Route>
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </FavoritesProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
