import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { Homepage } from "./pages/Homepage";
import { SearchPage } from "./pages/SearchPage";
import { HOAProfile } from "./pages/HOAProfile";
import { CommunityPortal } from "./pages/CommunityPortal";
import { CommunityDashboard } from "./pages/CommunityDashboard";
import { AdminDashboard } from "./pages/AdminDashboard";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => {
  const base = (import.meta.env.BASE_URL || '/').replace(/\/$/, '');
  console.log('[App] Router basename:', base, 'pathname:', window.location.pathname, 'href:', window.location.href);
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter basename={base}>
            <Routes>
              <Route path="/" element={<Homepage />} />
              <Route path="/search" element={<SearchPage />} />
              <Route path="/hoa/:slug" element={<HOAProfile />} />
              <Route path="/community/:slug" element={<CommunityPortal />} />
              <Route path="/community/:slug/dashboard" element={<CommunityDashboard />} />
              <Route path="/admin" element={<AdminDashboard />} />
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </TooltipProvider>
      </AuthProvider>
    </QueryClientProvider>
  );
};

export default App;