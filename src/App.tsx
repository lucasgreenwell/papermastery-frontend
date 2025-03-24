import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { SubscriptionProvider } from "./context/SubscriptionContext";
import Landing from "./pages/Landing";
import Auth from "./pages/Auth";
import Dashboard from "./pages/Dashboard";
import PaperDetails from "./pages/PaperDetails";
import NotFound from "./pages/NotFound";
import Playground from "./pages/playground/Playground";
import ConsultingBooking from "./pages/consulting/ConsultingBooking";
import SubscriptionSuccess from "./pages/subscription/SubscriptionSuccess";
import SubscriptionCancel from "./pages/subscription/SubscriptionCancel";

const queryClient = new QueryClient();

// Protected route component
const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  if (!user) {
    console.log('Not authenticated, redirecting to auth page');
    return <Navigate to="/auth" replace />;
  }
  
  return <>{children}</>;
};

const AppRoutes = () => {
  const { user, isLoading } = useAuth();
  
  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }
  
  return (
    <Routes>
      <Route path="/" element={user ? <Navigate to="/dashboard" replace /> : <Landing />} />
      <Route path="/auth" element={user ? <Navigate to="/dashboard" replace /> : <Auth />} />
      
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <Dashboard />
        </ProtectedRoute>
      } />
      
      <Route path="/papers/:id" element={
        <ProtectedRoute>
          <PaperDetails />
        </ProtectedRoute>
      } />
      
      <Route path="/papers/:paperId/consulting" element={
        <ProtectedRoute>
          <ConsultingBooking />
        </ProtectedRoute>
      } />
      
      <Route path="/playground" element={
        <ProtectedRoute>
          <Playground />
        </ProtectedRoute>
      } />
      
      {/* Subscription pages */}
      <Route path="/subscription/success" element={
        <ProtectedRoute>
          <SubscriptionSuccess />
        </ProtectedRoute>
      } />
      
      <Route path="/subscription/cancel" element={
        <ProtectedRoute>
          <SubscriptionCancel />
        </ProtectedRoute>
      } />
      
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <BrowserRouter>
      <AuthProvider>
        <SubscriptionProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <div className="min-h-screen bg-background">
              <AppRoutes />
            </div>
          </TooltipProvider>
        </SubscriptionProvider>
      </AuthProvider>
    </BrowserRouter>
  </QueryClientProvider>
);

export default App;
