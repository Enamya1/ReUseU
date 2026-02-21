import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { lazy, Suspense } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
const Login = lazy(() => import("./pages/Login"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Universities = lazy(() => import("./pages/Universities"));
const UniversityDetail = lazy(() => import("./pages/UniversityDetail"));
const Dormitories = lazy(() => import("./pages/Dormitories"));
const DormitoryDetail = lazy(() => import("./pages/DormitoryDetail"));
const Categories = lazy(() => import("./pages/Categories"));
const Conditions = lazy(() => import("./pages/Conditions"));
const Users = lazy(() => import("./pages/Users"));
const UserDetail = lazy(() => import("./pages/UserDetail"));
const ProductDetail = lazy(() => import("./pages/ProductDetail"));
const Chat = lazy(() => import("./pages/Chat"));
const NotFound = lazy(() => import("./pages/NotFound"));
const Settings = lazy(() => import("./pages/Settings"));

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Suspense fallback={<div className="p-6">Loading...</div>}>
            <Routes>
              <Route path="/login" element={<Login />} />
              <Route path="/" element={<Dashboard />} />
              <Route path="/universities" element={<Universities />} />
              <Route path="/university/:id" element={<UniversityDetail />} />
              <Route path="/dormitories" element={<Dormitories />} />
              <Route path="/dormitories/:id" element={<DormitoryDetail />} />
              <Route path="/dormitory/:id" element={<DormitoryDetail />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/conditions" element={<Conditions />} />
              <Route path="/users" element={<Users />} />
              <Route path="/users/:id" element={<UserDetail />} />
              <Route path="/products/:id" element={<ProductDetail />} />
              <Route path="/chat" element={<Chat />} />
              <Route path="/settings" element={<Settings />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </Suspense>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
